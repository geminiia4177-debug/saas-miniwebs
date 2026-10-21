import { prisma } from "@/lib/db";

/**
 * lib/rate-limit.ts
 * P1-002: Centralized Prisma-backed distributed rate limiter.
 *
 * This limits traffic globally across all deployment instances.
 */

export function getClientIp(req: Request): string {
  const directIp =
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-vercel-forwarded-for");
  if (directIp) return directIp.trim();

  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0) {
      return parts[parts.length - 1];
    }
  }

  return "127.0.0.1";
}

export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
  options?: { failClosed?: boolean }
): Promise<boolean> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + windowMs);

  try {
    const result = await prisma.$queryRaw<Array<{ count: number }>>`
      INSERT INTO "RateLimit" ("id", "key", "count", "expiresAt")
      VALUES (gen_random_uuid()::text, ${key}, 1, ${expiresAt})
      ON CONFLICT ("key") DO UPDATE
      SET "count" = CASE WHEN "RateLimit"."expiresAt" < NOW() THEN 1 ELSE "RateLimit"."count" + 1 END,
          "expiresAt" = CASE WHEN "RateLimit"."expiresAt" < NOW() THEN ${expiresAt} ELSE "RateLimit"."expiresAt" END
      RETURNING "count";
    `;

    const count = result?.[0]?.count ?? 1;

    // 2. Evaluate limit
    if (count > maxRequests) {
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
