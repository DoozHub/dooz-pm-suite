import type { Context, Next } from 'hono';

interface RateBucket {
    count: number;
    resetAt: number;
}

const buckets = new Map<string, RateBucket>();

const DEFAULT_MAX = 60;
const DEFAULT_WINDOW_MS = 60000;
const WRITE_MAX = 10;
const WRITE_WINDOW_MS = 60000;

function getClientId(c: Context): string {
    return c.req.header('X-Forwarded-For')?.split(',')[0]?.trim()
        || c.req.header('X-Real-IP')
        || 'unknown';
}

function isWriteMethod(method: string): boolean {
    return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
}

export function rateLimitMiddleware(options?: { max?: number; windowMs?: number }) {
    const max = options?.max || DEFAULT_MAX;
    const windowMs = options?.windowMs || DEFAULT_WINDOW_MS;

    return async (c: Context, next: Next) => {
        const clientId = getClientId(c);
        const isWrite = isWriteMethod(c.req.method);
        const limit = isWrite ? WRITE_MAX : max;
        const window = isWrite ? WRITE_WINDOW_MS : windowMs;
        const key = `${clientId}:${isWrite ? 'write' : 'read'}`;
        const now = Date.now();

        let bucket = buckets.get(key);

        if (!bucket || now >= bucket.resetAt) {
            bucket = { count: 0, resetAt: now + window };
            buckets.set(key, bucket);
        }

        bucket.count++;

        const remaining = Math.max(0, limit - bucket.count);

        c.header('X-RateLimit-Limit', String(limit));
        c.header('X-RateLimit-Remaining', String(remaining));
        c.header('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));

        if (bucket.count > limit) {
            const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
            c.header('Retry-After', String(retryAfter));
            return c.json({ error: 'Rate limit exceeded', retry_after_seconds: retryAfter }, 429);
        }

        await next();
    };
}
