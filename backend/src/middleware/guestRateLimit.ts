import { Request, Response, NextFunction } from 'express';

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;

const hits = new Map<string, number[]>();

// Per-IP buckets don't get swept until that same IP hits this endpoint
// again, so an attacker cycling through many spoofed X-Forwarded-For
// values (see index.ts's trust-proxy note) could otherwise grow this map
// without bound. A periodic global sweep caps worst-case memory
// regardless of how many distinct IPs are ever seen.
setInterval(
  () => {
    const now = Date.now();
    for (const [ip, timestamps] of hits) {
      const recent = timestamps.filter((t) => now - t < WINDOW_MS);
      if (recent.length === 0) hits.delete(ip);
      else hits.set(ip, recent);
    }
  },
  10 * 60 * 1000
).unref();

export function guestRateLimit(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || 'unknown';
  const now = Date.now();

  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (recent.length === 0) {
    hits.delete(ip);
  }

  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(ip, recent);
    res.status(429).json({ error: 'Too many demo sessions from this IP, please try again later' });
    return;
  }

  recent.push(now);
  hits.set(ip, recent);
  next();
}
