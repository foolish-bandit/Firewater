/**
 * Offline mutation queue.
 *
 * Stores failed write operations and replays them when connectivity returns.
 * Works with both localStorage (web) and Capacitor Preferences (native).
 */

import { storage } from "./storage";

const QUEUE_KEY = "bs_offline_queue";

export interface QueuedMutation {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string | null;
  timestamp: number;
  retryCount: number;
  /** Human-readable description for debugging */
  description: string;
}

const MAX_RETRIES = 5;
const MAX_QUEUE_SIZE = 100;

let processing = false;

/** Add a failed mutation to the queue */
export async function enqueue(mutation: Omit<QueuedMutation, "id" | "timestamp" | "retryCount">): Promise<void> {
  const queue = await getQueue();

  // Prevent unbounded growth
  if (queue.length >= MAX_QUEUE_SIZE) {
    queue.shift(); // drop oldest
  }

  queue.push({
    ...mutation,
    id: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
    timestamp: Date.now(),
    retryCount: 0,
  });

  await storage.setJSON(QUEUE_KEY, queue);
}

/** Get current queue */
export async function getQueue(): Promise<QueuedMutation[]> {
  return (await storage.getJSON<QueuedMutation[]>(QUEUE_KEY)) || [];
}

/** Get queue length (for UI badges) */
export async function getQueueLength(): Promise<number> {
  const queue = await getQueue();
  return queue.length;
}

/** Process the queue — replay all pending mutations */
export async function processQueue(): Promise<{ processed: number; failed: number }> {
  if (processing) return { processed: 0, failed: 0 };
  processing = true;

  let processed = 0;
  let failed = 0;

  try {
    const queue = await getQueue();
    if (queue.length === 0) return { processed: 0, failed: 0 };

    const remaining: QueuedMutation[] = [];

    for (const mutation of queue) {
      try {
        const res = await fetch(mutation.url, {
          method: mutation.method,
          headers: mutation.headers,
          body: mutation.body,
        });

        if (res.ok || res.status === 409) {
          // Success or conflict (already applied) — drop from queue
          processed++;
        } else if (res.status >= 400 && res.status < 500 && res.status !== 429) {
          // Client error (not retryable) — drop
          processed++;
        } else {
          // Server error or rate limited — retry later
          mutation.retryCount++;
          if (mutation.retryCount < MAX_RETRIES) {
            remaining.push(mutation);
          }
          failed++;
        }
      } catch {
        // Network error — keep in queue for next attempt
        mutation.retryCount++;
        if (mutation.retryCount < MAX_RETRIES) {
          remaining.push(mutation);
        }
        failed++;
      }
    }

    await storage.setJSON(QUEUE_KEY, remaining);
    return { processed, failed };
  } finally {
    processing = false;
  }
}

/** Clear the entire queue */
export async function clearQueue(): Promise<void> {
  await storage.remove(QUEUE_KEY);
}

/**
 * Start listening for online events and auto-process the queue.
 * Call once at app startup.
 */
export function startQueueProcessor(): () => void {
  const handler = () => {
    processQueue().catch(() => {});
  };

  window.addEventListener("online", handler);

  // Also process on startup if online
  if (navigator.onLine) {
    // Delay to let the app initialize
    setTimeout(handler, 2000);
  }

  return () => window.removeEventListener("online", handler);
}
