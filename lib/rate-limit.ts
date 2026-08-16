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
  windowMs: number,
  options?: { failClosed?: boolean }
): Promise<boolean> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + windowMs);

  try {
    // 1. Transactional rate limit check with window reset
    const record = await prisma.$transaction(async (tx) => {
      const existing = await tx.rateLimit.findUnique({
        where: { key },
      });

      if (!existing || existing.expiresAt < now) {
        return await tx.rateLimit.upsert({
          where: { key },
          create: {
            key,
            count: 1,
            expiresAt,
          },
          update: {
            count: 1,
            expiresAt,
          },
        });
      }

      return await tx.rateLimit.update({
        where: { key },
        data: {
          count: { increment: 1 },
        },
      });
    });

    // 2. Evaluate limit
    if (record.count > maxRequests) {
      return false;
    }
    return true;
  } catch (error) {
    console.error("Rate limit check error:", error);
    // P1-002: If failClosed is requested for sensitive routes, return false
    if (options?.failClosed) {
      return false;
    }
    return true; // Fail open for general operations
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
