import { Request, Response, NextFunction } from 'express';

export const validateSignup = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { email, password, displayName } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ error: 'Invalid email format' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }

  if (displayName && displayName.trim().length === 0) {
    res.status(400).json({ error: 'Display name cannot be empty' });
    return;
  }

  next();
};

export const validateLogin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  next();
};

export const validateItem = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { title, type } = req.body;

  if (req.method === 'POST' && !title) {
    res.status(400).json({ error: 'Title is required' });
    return;
  }

  if (type && !['thought', 'link', 'bookmark', 'clip'].includes(type)) {
    res.status(400).json({ error: 'Invalid item type' });
    return;
  }

  next();
};

export const validateTag = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { name } = req.body;

  if (!name || name.trim().length === 0) {
    res.status(400).json({ error: 'Tag name is required' });
    return;
  }

  next();
};

