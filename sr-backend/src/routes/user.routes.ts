import { Router } from 'express';
import * as UserController from '../controllers/user.controller';

const router = Router();

// Endpoint CRUD Karyawan (Base URL: /api/users)
router.get('/', UserController.getAllUsers);
router.post('/', UserController.createUser);
router.delete('/:id', UserController.deleteUser);

export default router;