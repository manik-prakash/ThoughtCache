import { Router } from 'express';
import { listTags, createTag } from '../controllers/tagController';
import { authenticate } from '../middleware/auth';
import { validateTag } from '../middleware/validate';

const router = Router();

router.get('/', authenticate, listTags);
router.post('/', authenticate, validateTag, createTag);

export default router;

