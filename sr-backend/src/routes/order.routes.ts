// order.routes.ts
import { Router } from 'express';
import * as OrderController from '../controllers/order.controller';

const router = Router();

router.post('/', OrderController.createOrder);
router.get('/active', OrderController.getActiveOrders);

router.get('/stats', OrderController.getDashboardStats);
router.get('/history', OrderController.getAllOrders);

// ⭐ Route sales-trend HARUS di atas route dengan parameter :id
router.get('/sales-trend', OrderController.getSalesTrend);

// Route dengan parameter
router.get('/pending-actions', OrderController.getPendingActionOrders);
router.patch('/:id/confirm-cash', OrderController.confirmCashPayment);
router.patch('/:id/status', OrderController.updateOrderStatus);

export default router;