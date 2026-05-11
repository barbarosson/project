type Bucket = { n: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function clientKey(req: Request, name: string): string {
  const fwd = req.headers.get("x-forwarded-for");
  const ip = fwd?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
  return `${name}:${ip}`;
}

/**
 * Simple in-memory fixed window limiter (per server instance).
 * For production at scale, prefer Redis or an edge rate-limit product.
 */
export function enforceRateLimit(
  req: Request,
  name: string,
  max: number,
  windowMs: number
): { ok: true } | { ok: false; retryAfterMs: number } {
  const key = clientKey(req, name);
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now >= b.resetAt) {
    buckets.set(key, { n: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (b.n >= max) {
    return { ok: false, retryAfterMs: Math.max(0, b.resetAt - now) };
  }
  b.n += 1;
  return { ok: true };
}
