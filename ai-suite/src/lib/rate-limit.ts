type Bucket = { n: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitResult = { ok: true } | { ok: false; retryAfterMs: number };

/** Prefer platform-provided client IP (Netlify/Vercel); avoid spoofable X-Forwarded-For when possible. */
export function clientIpFromRequest(req: Request): string {
  const nf = req.headers.get("x-nf-client-connection-ip")?.trim();
  if (nf) return nf;
  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const fwd = req.headers.get("x-forwarded-for");
  const first = fwd?.split(",")[0]?.trim();
  if (first) return first;
  return "local";
}

function clientKey(req: Request, name: string): string {
  return `${name}:${clientIpFromRequest(req)}`;
}

function enforceRateLimitInMemory(
  req: Request,
  name: string,
  max: number,
  windowMs: number
): RateLimitResult {
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

async function upstashIncr(key: string, windowSec: number): Promise<number | null> {
  const base = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, "");
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!base || !token) return null;

  const redisKey = `rl:${key}`;
  const headers = { Authorization: `Bearer ${token}` };

  try {
    const incrRes = await fetch(`${base}/incr/${encodeURIComponent(redisKey)}`, {
      method: "POST",
      headers,
      cache: "no-store",
    });
    if (!incrRes.ok) return null;
    const incrJson = (await incrRes.json()) as { result?: unknown };
    const count = Number(incrJson.result);
    if (!Number.isFinite(count)) return null;

    if (count === 1) {
      await fetch(`${base}/expire/${encodeURIComponent(redisKey)}/${windowSec}`, {
        method: "POST",
        headers,
        cache: "no-store",
      });
    }
    return count;
  } catch {
    return null;
  }
}

/**
 * Fixed-window rate limit. Uses Upstash Redis when `UPSTASH_REDIS_REST_*` is set;
 * otherwise in-memory (per server instance).
 */
export async function enforceRateLimit(
  req: Request,
  name: string,
  max: number,
  windowMs: number
): Promise<RateLimitResult> {
  const key = clientKey(req, name);
  const windowSec = Math.max(1, Math.ceil(windowMs / 1000));
  const count = await upstashIncr(key, windowSec);

  if (count !== null) {
    if (count > max) {
      return { ok: false, retryAfterMs: windowMs };
    }
    return { ok: true };
  }

  return enforceRateLimitInMemory(req, name, max, windowMs);
}
