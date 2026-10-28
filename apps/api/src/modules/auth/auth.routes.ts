import { Router } from 'express';
import { loginWithFirebase, refreshToken, logout, getMe } from './auth.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.post('/login', loginWithFirebase);
router.post('/refresh', refreshToken);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);

export default router;
