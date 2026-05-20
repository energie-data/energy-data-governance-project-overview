type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const LIMIT = Number(process.env.RATE_LIMIT_PER_HOUR ?? 20);
const WINDOW_MS = 60 * 60 * 1000;

export function checkRateLimit(ip: string): { ok: boolean; retryAfterSec?: number } {
  const now = Date.now();
  let bucket = buckets.get(ip);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + WINDOW_MS };
    buckets.set(ip, bucket);
  }
  if (bucket.count >= LIMIT) {
    return {
      ok: false,
      retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }
  bucket.count += 1;
  return { ok: true };
}
