# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Firewater, please report it responsibly.

**Email:** getfirewater@gmail.com

Include as much detail as possible:

- Description of the vulnerability
- Steps to reproduce
- Affected components (web app, iOS app, API, database)
- Potential impact
- Any suggested fixes, if you have them

I'll acknowledge receipt within 48 hours and aim to provide a substantive response within 7 days. If the issue is confirmed, I'll work on a fix and coordinate disclosure with you before any public announcement.

## Scope

The following are in scope for security reports:

- **firewater.app** (production web app)
- **Firewater iOS app** (Capacitor build)
- **API routes** (Vercel serverless functions)
- **Authentication flows** (Clerk integration)
- **Database access** (Vercel Postgres)
- **Barcode scanning and image processing pipelines**

The following are out of scope:

- Third-party services (Clerk, Vercel, Gemini) — report those directly to the respective vendor
- Social engineering or phishing attacks against contributors
- Denial of service attacks
- Issues in dependencies that are already publicly disclosed (check if a patch is pending before reporting)

## What Qualifies

- Authentication or authorization bypasses
- Exposure of user data (PII, credentials, tokens)
- SQL injection, XSS, CSRF, or SSRF in Firewater-controlled code
- Insecure API endpoints (missing auth, excessive data exposure)
- Secrets or credentials committed to the repository
- Privilege escalation between user accounts

## What Doesn't Qualify

- Missing security headers that don't lead to a demonstrated exploit
- Rate limiting suggestions without a demonstrated abuse scenario
- Vulnerabilities requiring physical access to a user's device
- Outdated dependency versions without a working proof of concept
- Clickjacking on pages with no state-changing actions

## Data Handling

Firewater uses Clerk for authentication and Vercel Postgres for data persistence. User credentials are never stored directly by Firewater. API keys and secrets are managed via environment variables and are never committed to source control.

Barcode scans and AI recommendation queries are processed server-side via Vercel functions. No raw images or scan data are persisted beyond the lifecycle of the request.

## Supported Versions

Firewater is a single actively maintained branch. Security fixes are applied to the latest version only. There are no legacy versions or LTS branches.

| Version | Supported |
|---------|-----------|
| Latest (`main`) | ✅ |
| All prior commits | ❌ |

## Disclosure Policy

I follow coordinated disclosure. If you report a vulnerability:

1. I'll confirm the issue and work on a fix
2. I'll keep you updated on progress
3. Once patched, I'll credit you in the release notes (unless you prefer to remain anonymous)
4. Public disclosure happens after the fix is deployed

I ask that you give a reasonable window (90 days) before public disclosure if a fix is in progress.

## Thanks

If you take the time to find and report a real vulnerability, that's genuinely appreciated. Firewater is a large project from just a couple guys, so an extra set of eyes on security matters a lot.
