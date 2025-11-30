import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  getTheme,
  updateTheme,
} from '../controllers/profileController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getProfile);
router.put('/', authenticate, updateProfile);
router.get('/theme', authenticate, getTheme);
router.put('/theme', authenticate, updateTheme);

export default router;

