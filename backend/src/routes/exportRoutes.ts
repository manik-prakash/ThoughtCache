import { Router } from 'express';
import { exportData } from '../controllers/exportController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, exportData);

export default router;

