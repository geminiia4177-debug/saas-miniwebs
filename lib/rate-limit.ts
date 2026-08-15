/**
 * lib/rate-limit.ts
 * P2-001: Centralized in-memory rate limiter.
 *
 * This is suitable for single-process deployments (e.g. one Next.js server).
 * For multi-instance/distributed deployments, replace this with a Redis-backed
 * implementation (e.g. using Upstash or ioredis).
 */

interface RateLimitRecord {
  count: number;
  timestamp: number;
}

const store = new Map<string, RateLimitRecord>();

/**
 * Check and increment the rate limit counter for a given key.
 * @param key       Unique identifier (e.g. `${ip}-${businessId}`)
 * @param maxRequests Maximum allowed requests per window
 * @param windowMs  Time window in milliseconds
 * @returns true if request is allowed, false if rate limit exceeded
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const record = store.get(key) ?? { count: 0, timestamp: now };

  // Reset window if expired
  if (now - record.timestamp > windowMs) {
    record.count = 0;
    record.timestamp = now;
  }

  if (record.count >= maxRequests) {
    store.set(key, record);
    return false;
  }

  record.count++;
  store.set(key, record);
  return true;
}

/**
 * Returns the remaining TTL (ms) until the rate limit window resets for a key.
 */
export function getRateLimitRetryAfterMs(key: string, windowMs: number): number {
  const record = store.get(key);
  if (!record) return 0;
  const elapsed = Date.now() - record.timestamp;
  return Math.max(0, windowMs - elapsed);
}
