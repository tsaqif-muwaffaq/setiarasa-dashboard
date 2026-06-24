import { Router } from 'express';
import * as OrderController from '../controllers/order.controller';

const router = Router();

// Endpoint: POST http://localhost:5000/api/orders
router.post('/', OrderController.createOrder);

export default router;