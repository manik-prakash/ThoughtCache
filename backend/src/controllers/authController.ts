import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import User from '../models/User';
import { Profile } from '../models/Profile';
import { generateToken } from '../utils/jwt';
import mongoose from 'mongoose';

export const signup = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password, displayName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ error: 'Email already registered' });
      return;
    }

    // Create user
    const user = new User({ email, password });
    await user.save();

    // Create profile
    const profile = new Profile({
      user_id: (user._id as any),
      display_name: displayName || email.split('@')[0] || 'User',
    });
    await profile.save();

    // Generate token
    const token = generateToken((user._id as any).toString());

    res.status(201).json({
      token,
      user: {
        id: (user._id as any).toString(),
        email: user.email,
        displayName: profile.display_name,
        createdAt: (user as any).createdAt,
      },
    });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'Email already registered' });
      return;
    }
    res.status(500).json({ error: 'Failed to create account', message: error.message });
  }
};

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user and include password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Get profile
    const profile = await Profile.findOne({ user_id: (user._id as any) });

    // Generate token
    const token = generateToken((user._id as any).toString());

    res.json({
      token,
      user: {
        id: (user._id as any).toString(),
        email: user.email,
        displayName: profile?.display_name || null,
        createdAt: (user as any).createdAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Login failed', message: error.message });
  }
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  // JWT is stateless, so we just return success
  // In production, you might want to implement token blacklisting
  res.json({ success: true, message: 'Logged out successfully' });
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.id);
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const profile = await Profile.findOne({ user_id: user._id });

    res.json({
      id: (user._id as any).toString(),
      email: user.email,
      displayName: profile?.display_name || null,
      createdAt: (user as any).createdAt,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get user', message: error.message });
  }
};

