import { Router } from 'express';
import * as AuthController from '../controllers/auth.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

router.post('/login', AuthController.login);

// Endpoint baru untuk update profil (dilindungi verifyToken)
router.put('/profile', verifyToken, AuthController.updateProfile);

export default router;