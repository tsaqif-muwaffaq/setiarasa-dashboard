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

    // Validasi input
    if (!orderId) {
      res.status(400).json({ 
        success: false, 
        message: 'Order ID wajib diisi' 
      });
      return;
    }

    // 1. Cari pesanan di database
    const order = await prisma.order.findUnique({ 
      where: { id: orderId } 
    });
    
    if (!order) {
      res.status(404).json({ 
        success: false, 
        message: 'Pesanan tidak ditemukan' 
      });
      return;
    }

    // 2. Cek apakah pesanan sudah dibayar atau selesai
    if (order.status === 'PAID' || order.status === 'COMPLETED') {
      res.status(400).json({ 
        success: false, 
        message: 'Pesanan ini sudah dibayar dan tidak memerlukan pembayaran lagi.' 
      });
      return;
    }

    // 3. Cek apakah pesanan sudah expired atau dibatalkan
    if (order.status === 'EXPIRED' || order.status === 'CANCELLED') {
      res.status(400).json({ 
        success: false, 
        message: 'Pesanan ini sudah tidak berlaku. Silakan buat pesanan baru.' 
      });
      return;
    }

    // 4. ✅ LOGIKA CERDAS: Cek apakah pesanan sudah punya token sebelumnya
    if (order.snapToken) {
      console.log(`[Payment] Menggunakan ulang token lama untuk pesanan ${orderId}`);
      
      res.status(200).json({
        success: true,
        token: order.snapToken,
        message: 'Token pembayaran ditemukan, melanjutkan pembayaran...'
      });
      return; // Berhenti di sini, jangan bikin transaksi baru di Midtrans!
    }

    // 5. Jika belum punya token, request transaksi baru ke Midtrans
    console.log(`[Payment] Membuat transaksi baru untuk pesanan ${orderId}`);
    
    // Pastikan amount sesuai dengan totalAmount di database
    const finalAmount = order.totalAmount;
    
    const parameter = {
      transaction_details: {
        order_id: orderId, // Gunakan ID murni
        gross_amount: finalAmount,
      },
      customer_details: {
        first_name: customerName || order.customerName || 'Pelanggan',
        email: customerEmail || 'pelanggan@setiarasa.com',
      },
      callbacks: {
        finish: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/status`
      }
    };

    let transaction;
    try {
      transaction = await snap.createTransaction(parameter);
    } catch (midtransError: any) {
      console.error('[Payment] Midtrans Error Detail:', midtransError);
      
      // Tangani error spesifik dari Midtrans
      if (midtransError.message?.includes('duplicate') || midtransError.message?.includes('already')) {
        // Jika Midtrans bilang duplicate, coba ambil ulang status pesanan
        const updatedOrder = await prisma.order.findUnique({ 
          where: { id: orderId } 
        });
        
        if (updatedOrder?.snapToken) {
          // Jika ternyata ada token di database, gunakan itu
          res.status(200).json({
            success: true,
            token: updatedOrder.snapToken,
            message: 'Token pembayaran ditemukan, melanjutkan pembayaran...'
          });
          return;
        }
      }
      
      // Lempar error untuk ditangani di catch utama
      throw new Error(`Midtrans: ${midtransError.message || 'Gagal membuat transaksi'}`);
    }

    // 6. ✅ SIMPAN token baru ke database
    await prisma.order.update({
      where: { id: orderId },
      data: { snapToken: transaction.token }
    });

    console.log(`[Payment] Token berhasil dibuat dan disimpan untuk pesanan ${orderId}`);

    res.status(200).json({
      success: true,
      token: transaction.token,
      redirect_url: transaction.redirect_url,
      message: 'Transaksi pembayaran berhasil dibuat'
    });
    
  } catch (error) {
    console.error('[Payment] Error createPayment:', error);
    
    // Kirim pesan error yang informatif ke frontend
    let errorMessage = 'Gagal memproses pembayaran. Silakan coba lagi.';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    // Jangan kirim stack trace ke production, tapi berikan pesan yang jelas
    res.status(500).json({ 
      success: false, 
      message: errorMessage,
      // Tambahkan error code untuk debugging (opsional)
      code: error instanceof Error ? error.name : 'UNKNOWN_ERROR'
    });
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
    const transactionStatus = String(notification.transaction_status || '').toLowerCase();
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

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook Error Notification:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error Webhook' });
  }
};