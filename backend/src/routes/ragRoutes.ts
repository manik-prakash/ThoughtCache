import { Router } from 'express';
import { queryRag } from '../controllers/ragController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/query', authenticate, queryRag);

export default router;
