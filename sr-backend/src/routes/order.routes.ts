import { Router } from 'express';
import * as OrderController from '../controllers/order.controller';

const router = Router();

router.post('/', OrderController.createOrder);
router.get('/active', OrderController.getActiveOrders);

router.get('/stats', OrderController.getDashboardStats);
router.get('/history', OrderController.getAllOrders);

// ⭐ Tambahkan route sales-trend di sini (sebelum route dengan parameter)
router.get('/sales-trend', OrderController.getSalesTrend);

// Tambahkan dua route ini
router.get('/pending-actions', OrderController.getPendingActionOrders);
router.patch('/:id/confirm-cash', OrderController.confirmCashPayment);

// Route yang menggunakan :id sebaiknya di bawah
router.patch('/:id/status', OrderController.updateOrderStatus);

export default router;