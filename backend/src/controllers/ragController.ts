import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as ragClient from '../utils/ragClient';

export const queryRag = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { question } = req.body;

    if (!question || typeof question !== 'string' || !question.trim()) {
      res.status(400).json({ error: 'Question is required' });
      return;
    }

    const result = await ragClient.queryRag(req.user!.id, question.trim());
    res.json(result);
  } catch (error: any) {
    res.status(502).json({ error: 'Failed to get an answer', message: error.message });
  }
};
