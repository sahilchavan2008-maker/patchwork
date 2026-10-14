interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory sliding window store (can be replaced by Redis / Upstash in clustered deployments)
const ipStore = new Map<string, RateLimitEntry>();

// Automatic cleanup every 5 minutes to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of ipStore.entries()) {
      if (now > entry.resetTime) {
        ipStore.delete(ip);
      }
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Enforces per-IP sliding window rate limiting
 * @param ip Client IP address
 * @param limit Max allowed requests within window
 * @param windowMs Time window in milliseconds (default: 60,000 ms = 1 min)
 */
export function checkRateLimit(
  ip: string,
  limit: number = 8,
  windowMs: number = 60 * 1000
): RateLimitResult {
  const now = Date.now();
  const entry = ipStore.get(ip);

  if (!entry || now > entry.resetTime) {
    // New window
    ipStore.set(ip, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: Math.ceil((now + windowMs) / 1000),
    };
  }

  if (entry.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: Math.ceil(entry.resetTime / 1000),
    };
  }

  entry.count += 1;
  return {
    success: true,
    limit,
    remaining: limit - entry.count,
    reset: Math.ceil(entry.resetTime / 1000),
  };
}
