import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

/** Best-effort client identifier — Vercel sets x-forwarded-for; falls back to a
 *  constant so local/dev requests still share a (permissive) bucket instead of
 *  throwing. Not spoof-proof, but raises the bar above "no limit at all". */
export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Fixed-window rate limit backed by the RateLimitHit table. Returns true if the
 * request should proceed, false if the caller has exceeded `limit` hits under `key`
 * within `windowMs`. Opportunistically prunes old rows so the table doesn't grow
 * unbounded (1-in-20 chance per call, cheap enough not to need a cron job).
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<boolean> {
  const since = new Date(Date.now() - windowMs);

  if (Math.random() < 0.05) {
    const staleCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    prisma.rateLimitHit.deleteMany({ where: { createdAt: { lt: staleCutoff } } }).catch(() => {});
  }

  const count = await prisma.rateLimitHit.count({ where: { key, createdAt: { gte: since } } });
  if (count >= limit) return false;

  await prisma.rateLimitHit.create({ data: { key } });
  return true;
}
