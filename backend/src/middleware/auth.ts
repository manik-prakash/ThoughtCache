import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import User from '../models/User';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized', message: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const payload = verifyToken(token);
      const user = await User.findById(payload.userId).select('email');

      if (!user) {
        res.status(401).json({ error: 'Unauthorized', message: 'User not found' });
        return;
      }

      req.user = {
        id: (user._id as any).toString(),
        email: user.email,
      };

      next();
    } catch (error) {
      res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired token' });
    }
  } catch (error) {
    next(error);
  }
};

