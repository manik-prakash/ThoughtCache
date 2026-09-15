import { Request, Response, NextFunction } from 'express';

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;

const hits = new Map<string, number[]>();

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
