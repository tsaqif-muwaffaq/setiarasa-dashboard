import { Router } from 'express';
import * as PaymentController from '../controllers/payment.controller';

const router = Router();

router.post('/create', PaymentController.createPayment);
router.post('/notification', PaymentController.handleMidtransNotification); // 👈 Daftarkan webhook di sini

export default router;