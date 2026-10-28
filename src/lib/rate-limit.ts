import "server-only";
import { createHash } from "node:crypto";
import { basePrisma } from "./db";

/**
 * Fixed-window limiter stored in Postgres (good enough for one internal app;
 * no Redis to run). Keys are hashed so emails/IPs never sit in the table.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number) {
  const hashed = createHash("sha256").update(key).digest("base64url");
  const since = new Date(Date.now() - windowSeconds * 1000);

  const hits = await basePrisma.rateLimitHit.count({
    where: { key: hashed, createdAt: { gte: since } },
  });
  if (hits >= limit) return { ok: false as const };

  await basePrisma.rateLimitHit.create({ data: { key: hashed } });
  // Opportunistic cleanup of old rows.
  if (Math.random() < 0.02) {
    await basePrisma.rateLimitHit.deleteMany({
      where: { createdAt: { lt: new Date(Date.now() - 86_400_000) } },
    });
  }
  return { ok: true as const };
}
