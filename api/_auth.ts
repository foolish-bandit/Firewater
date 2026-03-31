import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClerkClient, verifyToken } from "@clerk/backend";
import { sql } from "@vercel/postgres";

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

if (!CLERK_SECRET_KEY) {
  console.warn("[AUTH] WARNING: CLERK_SECRET_KEY not set. Authentication will fail.");
}

const clerkClient = createClerkClient({ secretKey: CLERK_SECRET_KEY! });

/**
 * Extract authenticated Clerk user ID from request.
 * Verifies the Clerk session token from the Authorization header.
 */
export async function getAuthUserId(req: VercelRequest): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;

  try {
    const token = authHeader.slice(7);
    const payload = await verifyToken(token, {
      secretKey: CLERK_SECRET_KEY!,
    });
    return payload.sub;
  } catch {
    return null;
  }
}

/**
 * Require authentication. Sends 401 and returns null if not authenticated.
 * Automatically provisions the user in the DB if they don't exist yet.
 */
export async function requireAuth(req: VercelRequest, res: VercelResponse): Promise<string | null> {
  const userId = await getAuthUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Authentication required" });
    return null;
  }
  await ensureUser(userId);
  return userId;
}

/**
 * Ensure a Clerk user exists in the local users table.
 * Fetches user data from Clerk on first encounter.
 */
async function ensureUser(userId: string): Promise<void> {
  const { rows } = await sql`SELECT 1 FROM users WHERE id = ${userId} LIMIT 1`;
  if (rows.length > 0) return;

  const clerkUser = await clerkClient.users.getUser(userId);
  const email =
    clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
      ?.emailAddress || "";
  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || "User";
  const picture = clerkUser.imageUrl || "";

  await sql`
    INSERT INTO users (id, email, name, picture, auth_provider)
    VALUES (${userId}, ${email}, ${name}, ${picture}, 'clerk')
    ON CONFLICT (id) DO NOTHING
  `;
}

/**
 * Check if an email belongs to an admin.
 */
export function isAdmin(email: string | undefined): boolean {
  if (!email) return false;
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase());
  return adminEmails.includes(email.toLowerCase());
}

/**
 * Get admin email from the authenticated Clerk user.
 * Returns null if not authenticated or not an admin.
 */
export async function getAdminEmail(req: VercelRequest): Promise<string | null> {
  const userId = await getAuthUserId(req);
  if (!userId) return null;
  try {
    const user = await clerkClient.users.getUser(userId);
    const email = user.emailAddresses.find(
      (e) => e.id === user.primaryEmailAddressId
    )?.emailAddress;
    if (email && isAdmin(email)) return email;
  } catch {
    // Clerk API error — not admin
  }
  return null;
}
