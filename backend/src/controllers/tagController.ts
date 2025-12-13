import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Tag } from '../models/Tag';
import mongoose from 'mongoose';

export const listTags = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.id);

    const tags = await Tag.find({ user_id: userId }).sort({ name: 1 });

    res.json(
      tags.map((tag) => ({
        id: (tag._id as any).toString(),
        user_id: tag.user_id.toString(),
        name: tag.name,
        color: tag.color,
        created_at: tag.created_at.toISOString(),
      }))
    );
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch tags', message: error.message });
  }
};

export const createTag = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, color } = req.body;
    const userId = new mongoose.Types.ObjectId(req.user!.id);

    const existingTag = await Tag.findOne({ user_id: userId, name: name.trim() });
    if (existingTag) {
      res.status(400).json({ error: 'Tag with this name already exists' });
      return;
    }

    const tag = new Tag({
      user_id: userId,
      name: name.trim(),
      color: color || null,
    });

    await tag.save();

    res.status(201).json({
      id: (tag._id as any).toString(),
      user_id: tag.user_id.toString(),
      name: tag.name,
      color: tag.color,
      created_at: tag.created_at.toISOString(),
    });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'Tag with this name already exists' });
      return;
    }
    res.status(500).json({ error: 'Failed to create tag', message: error.message });
  }
};

