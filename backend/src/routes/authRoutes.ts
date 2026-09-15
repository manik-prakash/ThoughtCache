import { Router } from 'express';
import { signup, login, logout, getMe, guestSession } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validateSignup, validateLogin } from '../middleware/validate';
import { guestRateLimit } from '../middleware/guestRateLimit';

const router = Router();

router.post('/signup', validateSignup, signup);
router.post('/login', validateLogin, login);
router.post('/guest', guestRateLimit, guestSession);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);

export default router;

