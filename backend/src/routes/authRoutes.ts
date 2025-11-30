import { Router } from 'express';
import { signup, login, logout, getMe } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validateSignup, validateLogin } from '../middleware/validate';

const router = Router();

router.post('/signup', validateSignup, signup);
router.post('/login', validateLogin, login);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);

export default router;

