import { Router } from 'express';
import { register, verifyEmail, login, resendCode } from '../controllers/authController.js';

const router = Router();

router.post('/register', register);
router.post('/verify', verifyEmail);
router.post('/login', login);
router.post('/resend-code', resendCode);

export default router;
