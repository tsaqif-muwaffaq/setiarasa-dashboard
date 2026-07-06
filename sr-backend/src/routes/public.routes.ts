// public.routes.ts - LENGKAP
import { Router } from 'express';
import * as OrderController from '../controllers/order.controller';
import * as MenuController from '../controllers/menu.controller';

const router = Router();

// Middleware untuk menandai request sebagai public (dari web online)
const markAsPublic = (req: any, res: any, next: any) => {
  req.isPublic = true; // 👈 Tandai sebagai request dari web public
  next();
};

// 1. Endpoint Publik untuk melihat daftar Menu (Tanpa Token)
router.get('/menu', MenuController.getAllMenus);

// 2. Endpoint Publik untuk mengirim Pesanan (Tanpa Token)
//    Menggunakan middleware markAsPublic agar source = 'ONLINE'
router.post('/orders', markAsPublic, OrderController.createOrder);

// 3. Endpoint Publik untuk Cek Status Pesanan
router.get('/orders/:id', OrderController.getOrderStatus);

export default router;