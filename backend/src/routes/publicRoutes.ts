import { Router } from 'express';
import { getSharedItem } from '../controllers/publicController';

const router = Router();

router.get('/shared/:slug', getSharedItem);

export default router;

