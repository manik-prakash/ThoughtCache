import { Router } from 'express';
import { getGraph } from '../controllers/graphController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getGraph);

export default router;
