import { Router } from 'express';
import {
  listItems,
  getItem,
  createItem,
  updateItem,
  deleteItem,
  toggleStar,
} from '../controllers/itemController';
import { authenticate } from '../middleware/auth';
import { validateItem } from '../middleware/validate';

const router = Router();

router.get('/', authenticate, listItems);
router.get('/:id', authenticate, getItem);
router.post('/', authenticate, validateItem, createItem);
router.put('/:id', authenticate, validateItem, updateItem);
router.delete('/:id', authenticate, deleteItem);
router.patch('/:id/star', authenticate, toggleStar);

export default router;

