import { prisma } from "@/lib/db";

/**
 * lib/rate-limit.ts
 * P1-002: Centralized Prisma-backed distributed rate limiter.
 *
 * This limits traffic globally across all deployment instances.
 */

export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<boolean> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + windowMs);

  try {
    // 1. Clean up expired keys to keep table small
    await prisma.rateLimit.deleteMany({
      where: { expiresAt: { lt: now } },
    });

    // 2. Upsert the rate limit key
    const record = await prisma.rateLimit.upsert({
      where: { key },
      create: {
        key,
        count: 1,
        expiresAt,
      },
      update: {
        count: {
          increment: 1,
        },
      },
    });

    // 3. Evaluate limit
    if (record.count > maxRequests) {
      return false;
    }
    return true;
  } catch (error) {
    console.error("Rate limit check error:", error);
    // Fallback: If DB fails, fail OPEN to not block critical operations,
    // or fail CLOSED if strict security is preferred.
    return true; // Fail open
  }
}

export async function getRateLimitRetryAfterMs(
  key: string,
  windowMs: number
): Promise<number> {
  try {
    const record = await prisma.rateLimit.findUnique({
      where: { key },
    });
    if (!record) return 0;
    
    const now = new Date();
    const remaining = record.expiresAt.getTime() - now.getTime();
    return Math.max(0, remaining);
  } catch {
    return windowMs;
  }
}
