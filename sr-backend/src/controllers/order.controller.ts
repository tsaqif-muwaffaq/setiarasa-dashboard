import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { customerName, tableNumber, items } = req.body;

    if (!items || items.length === 0) {
      res.status(400).json({ success: false, message: 'Keranjang pesanan tidak boleh kosong' });
      return;
    }

    // 1. Hitung total harga di sisi server
    const totalAmount = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

    // 2. Gunakan Prisma Transaction (ACID Compliance)
    const newOrder = await prisma.$transaction(async (tx) => {
      
      // A. Buat record Order utama beserta OrderItem-nya
const order = await tx.order.create({
  data: {
    customerName: customerName || 'Pelanggan',
    tableNumber: tableNumber ? String(tableNumber) : null, 
    totalAmount,
    items: {
      create: items.map((item: any) => ({
        menuId: item.menuId,
        quantity: item.quantity,
        price: item.price
      }))
    }
  } as any, // <-- TAMBAHKAN "as any" DI SINI untuk bypass cache TypeScript
  include: { items: true } 
});

      // B. Kurangi stok untuk setiap menu yang dipesan
      for (const item of items) {
        await tx.menu.update({
          where: { id: item.menuId },
          data: { 
            stock: { decrement: item.quantity } 
          }
        });
      }

      return order;
    });

    res.status(201).json({ success: true, message: 'Pesanan berhasil dibuat', data: newOrder });
  } catch (error) {
    console.error('Error create order:', error);
    res.status(500).json({ success: false, message: 'Gagal memproses pesanan' });
  }
};