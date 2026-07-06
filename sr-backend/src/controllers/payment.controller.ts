import { Request, Response } from 'express';
import midtransClient from 'midtrans-client';
import { OrderStatus, PaymentMethod } from '@prisma/client';
import crypto from 'crypto';
import prisma from '../lib/prisma';

const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY as string,
  clientKey: process.env.MIDTRANS_CLIENT_KEY as string,
});

export const createPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId, amount, customerName, customerEmail } = req.body;

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
      return;
    }

    // 👇 LOGIKA CERDAS: Cek apakah pesanan sudah punya token sebelumnya
    if (order.snapToken) {
      console.log(`Menggunakan ulang token lama untuk pesanan ${orderId}`);
      res.status(200).json({
        success: true,
        token: order.snapToken
      });
      return; // Berhenti di sini, jangan bikin transaksi baru di Midtrans!
    }

    // Jika belum punya token, baru kita request transaksi ke Midtrans (Gunakan ID Asli)
    const parameter = {
      transaction_details: {
        order_id: orderId, // 👈 Gunakan ID murni, JANGAN pakai Date.now() lagi
        gross_amount: amount,
      },
      customer_details: {
        first_name: customerName || 'Pelanggan',
        email: customerEmail || 'pelanggan@setiarasa.com',
      },
      callbacks: {
        finish: 'http://localhost:5173/cek-pesanan'
      }
    };

    const transaction = await snap.createTransaction(parameter);

    // 👇 SIMPAN token baru tersebut ke database kita
    await prisma.order.update({
      where: { id: orderId },
      data: { snapToken: transaction.token }
    });

    res.status(200).json({
      success: true,
      token: transaction.token,
      redirect_url: transaction.redirect_url
    });
  } catch (error) {
    console.error('Midtrans Error:', error);
    res.status(500).json({ success: false, message: 'Gagal memproses pembayaran' });
  }
};

// --- Webhook Notification Handler (Paling Krusial) ---
export const handleMidtransNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const notification = req.body;

    // Keamanan Verifikasi Signature Token Midtrans
    const serverKey = process.env.MIDTRANS_SERVER_KEY as string;
    const coreString = notification.order_id + notification.status_code + notification.gross_amount + serverKey;
    const localSignature = crypto.createHash('sha512').update(coreString).digest('hex');

    if (localSignature !== notification.signature_key) {
      res.status(403).json({ success: false, message: 'Invalid Signature Key Token' });
      return;
    }

    const orderId = notification.order_id;
    const transactionStatus = notification.transaction_status;
    const fraudStatus = notification.fraud_status;
    const paymentType = notification.payment_type;

    let updateStatus: OrderStatus = 'PENDING_PAYMENT';
    let mappedMethod: PaymentMethod = 'QRIS';

    // Pemetaan instan kembalian tipe bayar Midtrans ke tipe data enum database kita
    if (paymentType === 'gopay') mappedMethod = 'GOPAY';
    else if (paymentType === 'shopeepay') mappedMethod = 'SHOPEEPAY';
    else if (paymentType === 'bank_transfer') mappedMethod = 'BANK_TRANSFER';
    else if (paymentType === 'credit_card') mappedMethod = 'DEBIT';

    if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
      if (fraudStatus === 'challenge') {
        updateStatus = 'FAILED';
      } else {
        updateStatus = 'PAID'; // 👈 Mengubah pesanan ke Lunas, dapur langsung auto-ting!
      }
    } else if (transactionStatus === 'cancel' || transactionStatus === 'deny') {
      updateStatus = 'CANCELLED';
    } else if (transactionStatus === 'expire') {
      updateStatus = 'EXPIRED';
    }

    // GANTI BLOK UPDATE PRISMA DI PAYMENT.CONTROLLER.TS LU DENGAN INI:

// 👇 GANTI BLOK UPDATE PRISMA YANG LAMA DENGAN INI (AUTO-RESTOCK)
    if (updateStatus !== 'PENDING_PAYMENT') {
      
      // 1. Ambil data pesanan saat ini beserta item-nya SEBELUM di-update
      const existingOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true }
      });

      // 2. Siapkan data update status
      const updateData: any = { status: updateStatus };
      if (updateStatus === 'PAID') {
        updateData.paymentMethod = mappedMethod;
      }

      // 3. Update status pesanan di database
      await prisma.order.update({
        where: { id: orderId },
        data: updateData
      });

      // 4. Logika Auto-Restock: Jika pesanan batal/expired
      if (
        (updateStatus === 'CANCELLED' || updateStatus === 'EXPIRED') && 
        existingOrder && 
        existingOrder.status !== 'CANCELLED' && 
        existingOrder.status !== 'EXPIRED'
      ) {
        // Kembalikan stok menu ke semula
        for (const item of existingOrder.items) {
          await prisma.menu.update({
            where: { id: item.menuId },
            data: {
              stock: { increment: item.quantity }
            }
          });
        }
        console.log(`[Webhook] Stok untuk pesanan ${orderId} berhasil dikembalikan!`);
      }
    }
    // 👆 SAMPAI SINI. Bawahnya biarin res.status(200).json(...)

    res.status(200).json({ success: true, message: 'Webhook handled successfully' });
  } catch (error) {
    console.error('Webhook Error Notification:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error Webhook' });
  }
};