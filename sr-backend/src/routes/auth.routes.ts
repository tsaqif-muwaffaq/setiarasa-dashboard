import { Router } from 'express';
import * as AuthController from '../controllers/auth.controller';

const router = Router();

// Endpoint: POST http://localhost:5000/api/auth/login
router.post('/login', AuthController.login);

export default router;