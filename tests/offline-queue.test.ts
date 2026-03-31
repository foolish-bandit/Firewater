import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Tests the offline mutation queue logic.
 * Verifies queueing, dequeuing, replay, and retry behavior.
 */

interface QueuedMutation {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string | null;
  timestamp: number;
  retryCount: number;
  description: string;
}

const MAX_RETRIES = 5;
const MAX_QUEUE_SIZE = 100;

// Reimplement the queue logic for unit testing
function createQueue() {
  let queue: QueuedMutation[] = [];

  function enqueue(mutation: Omit<QueuedMutation, 'id' | 'timestamp' | 'retryCount'>): void {
    if (queue.length >= MAX_QUEUE_SIZE) {
      queue.shift();
    }
    queue.push({
      ...mutation,
      id: Math.random().toString(36).slice(2),
      timestamp: Date.now(),
      retryCount: 0,
    });
  }

  function getAll(): QueuedMutation[] {
    return [...queue];
  }

  function clear(): void {
    queue = [];
  }

  async function process(
    fetchFn: (url: string, init: RequestInit) => Promise<{ ok: boolean; status: number }>
  ): Promise<{ processed: number; failed: number }> {
    let processed = 0;
    let failed = 0;
    const remaining: QueuedMutation[] = [];

    for (const mutation of queue) {
      try {
        const res = await fetchFn(mutation.url, {
          method: mutation.method,
          headers: mutation.headers,
          body: mutation.body,
        });

        if (res.ok || res.status === 409) {
          processed++;
        } else if (res.status >= 400 && res.status < 500 && res.status !== 429) {
          processed++; // client error, not retryable
        } else {
          mutation.retryCount++;
          if (mutation.retryCount < MAX_RETRIES) {
            remaining.push(mutation);
          }
          failed++;
        }
      } catch {
        mutation.retryCount++;
        if (mutation.retryCount < MAX_RETRIES) {
          remaining.push(mutation);
        }
        failed++;
      }
    }

    queue = remaining;
    return { processed, failed };
  }

  return { enqueue, getAll, clear, process };
}

describe('Offline Queue: Enqueueing', () => {
  let q: ReturnType<typeof createQueue>;

  beforeEach(() => {
    q = createQueue();
  });

  it('should enqueue a mutation', () => {
    q.enqueue({
      url: '/api/social?scope=reviews&action=create',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"rating":4}',
      description: 'Create review',
    });
    expect(q.getAll()).toHaveLength(1);
    expect(q.getAll()[0].retryCount).toBe(0);
  });

  it('should cap queue at MAX_QUEUE_SIZE, dropping oldest', () => {
    for (let i = 0; i < MAX_QUEUE_SIZE + 5; i++) {
      q.enqueue({
        url: `/api/action-${i}`,
        method: 'POST',
        headers: {},
        body: null,
        description: `Action ${i}`,
      });
    }
    expect(q.getAll()).toHaveLength(MAX_QUEUE_SIZE);
    // Oldest (0-4) should be dropped
    expect(q.getAll()[0].url).toBe('/api/action-5');
  });

  it('should assign unique IDs and timestamps', () => {
    q.enqueue({ url: '/a', method: 'POST', headers: {}, body: null, description: 'A' });
    q.enqueue({ url: '/b', method: 'POST', headers: {}, body: null, description: 'B' });
    const items = q.getAll();
    expect(items[0].id).not.toBe(items[1].id);
    expect(items[0].timestamp).toBeLessThanOrEqual(items[1].timestamp);
  });
});

describe('Offline Queue: Processing', () => {
  let q: ReturnType<typeof createQueue>;

  beforeEach(() => {
    q = createQueue();
  });

  it('should remove successfully replayed mutations', async () => {
    q.enqueue({ url: '/api/review', method: 'POST', headers: {}, body: '{}', description: 'Review' });
    q.enqueue({ url: '/api/list', method: 'POST', headers: {}, body: '{}', description: 'List' });

    const result = await q.process(async () => ({ ok: true, status: 200 }));
    expect(result.processed).toBe(2);
    expect(result.failed).toBe(0);
    expect(q.getAll()).toHaveLength(0);
  });

  it('should treat 409 Conflict as success (already applied)', async () => {
    q.enqueue({ url: '/api/review', method: 'POST', headers: {}, body: '{}', description: 'Review' });

    const result = await q.process(async () => ({ ok: false, status: 409 }));
    expect(result.processed).toBe(1);
    expect(q.getAll()).toHaveLength(0);
  });

  it('should drop non-retryable 4xx errors', async () => {
    q.enqueue({ url: '/api/review', method: 'POST', headers: {}, body: '{}', description: 'Review' });

    const result = await q.process(async () => ({ ok: false, status: 400 }));
    expect(result.processed).toBe(1);
    expect(q.getAll()).toHaveLength(0);
  });

  it('should retry on 5xx errors', async () => {
    q.enqueue({ url: '/api/review', method: 'POST', headers: {}, body: '{}', description: 'Review' });

    const result = await q.process(async () => ({ ok: false, status: 500 }));
    expect(result.failed).toBe(1);
    expect(q.getAll()).toHaveLength(1);
    expect(q.getAll()[0].retryCount).toBe(1);
  });

  it('should retry on 429 rate limit', async () => {
    q.enqueue({ url: '/api/review', method: 'POST', headers: {}, body: '{}', description: 'Review' });

    const result = await q.process(async () => ({ ok: false, status: 429 }));
    expect(result.failed).toBe(1);
    expect(q.getAll()).toHaveLength(1);
  });

  it('should retry on network error', async () => {
    q.enqueue({ url: '/api/review', method: 'POST', headers: {}, body: '{}', description: 'Review' });

    const result = await q.process(async () => { throw new Error('Network error'); });
    expect(result.failed).toBe(1);
    expect(q.getAll()).toHaveLength(1);
  });

  it('should drop mutations after MAX_RETRIES', async () => {
    q.enqueue({ url: '/api/review', method: 'POST', headers: {}, body: '{}', description: 'Review' });

    // Fail MAX_RETRIES times
    for (let i = 0; i < MAX_RETRIES; i++) {
      await q.process(async () => ({ ok: false, status: 500 }));
    }

    // Should be dropped now
    expect(q.getAll()).toHaveLength(0);
  });

  it('should handle mixed success and failure', async () => {
    q.enqueue({ url: '/api/success', method: 'POST', headers: {}, body: null, description: 'OK' });
    q.enqueue({ url: '/api/fail', method: 'POST', headers: {}, body: null, description: 'Fail' });
    q.enqueue({ url: '/api/success2', method: 'POST', headers: {}, body: null, description: 'OK2' });

    let callCount = 0;
    const result = await q.process(async (url) => {
      callCount++;
      if (url === '/api/fail') return { ok: false, status: 500 };
      return { ok: true, status: 200 };
    });

    expect(callCount).toBe(3);
    expect(result.processed).toBe(2);
    expect(result.failed).toBe(1);
    expect(q.getAll()).toHaveLength(1);
    expect(q.getAll()[0].url).toBe('/api/fail');
  });
});

describe('Offline Queue: Clear', () => {
  it('should clear all items', () => {
    const q = createQueue();
    q.enqueue({ url: '/a', method: 'POST', headers: {}, body: null, description: 'A' });
    q.enqueue({ url: '/b', method: 'POST', headers: {}, body: null, description: 'B' });
    q.clear();
    expect(q.getAll()).toHaveLength(0);
  });
});
