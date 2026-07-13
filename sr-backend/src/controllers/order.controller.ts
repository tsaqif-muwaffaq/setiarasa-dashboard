import { Request, Response } from 'express';
import { OrderStatus, PaymentMethod } from '@prisma/client';
import prisma from '../lib/prisma';

// Batas waktu pembayaran non-tunai (menit) sebelum pesanan otomatis dianggap kedaluwarsa.
// Metode CASH tidak kena auto-expired karena menunggu konfirmasi manual dari kasir (lihat confirmCashPayment).
const PAYMENT_EXPIRY_MINUTES = 15;

// --- Buat Pesanan Baru (Mendukung Kasir & Public Client) ---
export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { customerName, tableNumber, orderType, paymentMethod, items } = req.body;

    if (!items || items.length === 0) {
      res.status(400).json({ success: false, message: 'Keranjang pesanan tidak boleh kosong' });
      return;
    }

    const totalAmount = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

    // Tentukan status awal berdasarkan metode pembayaran yang dipilih
    // Semua metode pembayaran (CASH maupun non-CASH) tetap menunggu konfirmasi dulu
    const initialStatus: OrderStatus = 'PENDING_PAYMENT';

    // Tentukan source (asal pesanan) berdasarkan ada/tidaknya flag isPublic
    // - Jika dari route public (web online) -> source = 'ONLINE'
    // - Jika dari route internal (kasir) -> source = 'OFFLINE'
    const isPublic = (req as any).isPublic === true;
    const source = isPublic ? 'ONLINE' : 'OFFLINE';

    const newOrder = await prisma.$transaction(async (tx) => {
      // A. Validasi Stok Ketat (Paralel menggunakan Promise.all)
      await Promise.all(items.map(async (item: any) => {
        const menuInfo = await tx.menu.findUnique({ where: { id: item.menuId } });
        if (!menuInfo) throw new Error(`Menu dengan ID ${item.menuId} tidak ditemukan.`);
        if (menuInfo.stock < item.quantity) {
          throw new Error(`Gagal: Stok "${menuInfo.name}" tidak mencukupi! Sisa: ${menuInfo.stock}`);
        }
      }));

      // B. Buat Record Order Utama dengan field source
      const order = await tx.order.create({
        data: {
          customerName: customerName || 'Pelanggan',
          tableNumber: tableNumber ? String(tableNumber) : null,
          orderType: orderType || 'DINE_IN',
          status: initialStatus,
          paymentMethod: (paymentMethod as PaymentMethod) || 'CASH',
          totalAmount,
          source, // 👈 Menyimpan asal pesanan (ONLINE/OFFLINE)
          items: {
            create: items.map((item: any) => ({
              menuId: item.menuId,
              quantity: item.quantity,
              price: item.price
            }))
          }
        },
        include: { items: true }
      });

      // C. Kurangi Stok Secara Aman (Paralel menggunakan Promise.all)
      await Promise.all(items.map((item: any) =>
        tx.menu.update({
          where: { id: item.menuId },
          data: { stock: { decrement: item.quantity } }
        })
      ));

      return order;
    }, {
      maxWait: 15000, // Waktu tunggu mendapatkan koneksi dari pool (15 detik)
      timeout: 30000, // Batas waktu total eksekusi transaksi (30 detik)
    });

    res.status(201).json({ success: true, message: 'Pesanan berhasil dibuat', data: newOrder });
  } catch (error: any) {
    console.error('Error create order:', error);
    const message = error instanceof Error ? error.message : 'Gagal memproses pesanan';
    res.status(500).json({ success: false, message });
  }
};

// --- Ambil Pesanan Aktif (Khusus Monitor Dapur: Hanya PAID & COOKING) ---
export const getActiveOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        status: {
          in: ['PAID', 'COOKING'] // 👈 PENDING_PAYMENT disembunyikan total dari dapur
        }
      },
      include: {
        items: {
          include: { menu: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error('Error get active orders:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil pesanan aktif' });
  }
};

// --- Update Status Pesanan (Dapur/Kasir) ---
export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: status as OrderStatus }
    });

    res.status(200).json({ success: true, message: 'Status pesanan diperbarui', data: updatedOrder });
  } catch (error) {
    console.error('Error update order status:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui status' });
  }
};

// --- Konfirmasi Pembayaran Tunai (khusus kasir, untuk order CASH dari Web Public) ---
export const confirmCashPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
      return;
    }
    if (order.paymentMethod !== 'CASH') {
      res.status(400).json({ success: false, message: 'Pesanan ini bukan metode pembayaran tunai' });
      return;
    }
    if (order.status !== 'PENDING_PAYMENT') {
      res.status(400).json({ success: false, message: 'Pesanan ini sudah tidak menunggu pembayaran' });
      return;
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: 'PAID' },
    });

    res.status(200).json({ success: true, message: 'Pembayaran tunai dikonfirmasi', data: updatedOrder });
  } catch (error) {
    console.error('Error confirm cash payment:', error);
    res.status(500).json({ success: false, message: 'Gagal mengonfirmasi pembayaran' });
  }
};

// --- Ambil Pesanan yang Butuh Aksi Kasir (menunggu bayar / sudah bayar belum diterima) ---
export const getPendingActionOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const orders = await prisma.order.findMany({
      where: { status: { in: ['PENDING_PAYMENT', 'PAID'] } },
      include: { items: { include: { menu: true } } },
      orderBy: { createdAt: 'asc' },
    });
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error('Error get pending orders:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil pesanan' });
  }
};

// ── Bagian yang perlu diupdate di order.controller.ts ──

// Perbaikan getDashboardStats - TAMBAHKAN LOG VERIFIKASI
export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log(`[Dashboard Stats] Today: ${today.toISOString()}`);

    // 🔥 HITUNG KEMARIN
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setHours(23, 59, 59, 999);

    console.log(`[Dashboard Stats] Yesterday: ${yesterday.toISOString()} - ${yesterdayEnd.toISOString()}`);

    // Ambil semua order lunas/selesai untuk perhitungan omzet hari ini
    const todayOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: today },
        status: { in: ['PAID', 'COOKING', 'READY', 'COMPLETED'] }
      }
    });

    console.log(`[Dashboard Stats] Today orders found: ${todayOrders.length}`);

    // 🔥 HITUNG OMEZ KEMARIN
    const yesterdayOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: yesterday,
          lte: yesterdayEnd
        },
        status: { in: ['PAID', 'COOKING', 'READY', 'COMPLETED'] }
      }
    });

    console.log(`[Dashboard Stats] Yesterday orders found: ${yesterdayOrders.length}`);

    const totalRevenue = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const yesterdayRevenue = yesterdayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const orderCount = todayOrders.length;

    // Hitung rincian metode pembayaran hari ini secara dinamis
    const paymentBreakdown = {
      CASH: 0,
      QRIS: 0,
      GOPAY: 0,
      SHOPEEPAY: 0,
      BANK_TRANSFER: 0,
      DEBIT: 0
    };

    todayOrders.forEach(o => {
      if (o.paymentMethod in paymentBreakdown) {
        paymentBreakdown[o.paymentMethod as keyof typeof paymentBreakdown] += o.totalAmount;
      }
    });

    // Kalkulasi Tren Pendapatan (7 Hari Terakhir)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
        status: { in: ['PAID', 'COOKING', 'READY', 'COMPLETED'] }
      },
      select: { totalAmount: true, createdAt: true }
    });

    console.log(`[Dashboard Stats] Recent orders (7 days): ${recentOrders.length}`);

    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const weeklyDataMap = new Map();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      weeklyDataMap.set(days[d.getDay()], 0);
    }

    recentOrders.forEach(order => {
      const dayName = days[order.createdAt.getDay()];
      if (weeklyDataMap.has(dayName)) {
        weeklyDataMap.set(dayName, weeklyDataMap.get(dayName) + order.totalAmount);
      }
    });

    const weeklyRevenue = Array.from(weeklyDataMap, ([name, total]) => ({ name, total }));

    // Kalkulasi Top 5 Menu Terlaris
    const allItems = await prisma.orderItem.findMany({
      where: {
        order: { status: { in: ['PAID', 'COOKING', 'READY', 'COMPLETED'] } }
      },
      include: { menu: true }
    });

    const menuStats: Record<string, any> = {};
    allItems.forEach(item => {
      if (!menuStats[item.menuId]) {
        menuStats[item.menuId] = {
          id: item.menuId,
          name: item.menu?.name || 'Menu Terhapus',
          category: item.menu?.category || '-',
          sold: 0,
          revenue: 0
        };
      }
      menuStats[item.menuId].sold += item.quantity;
      menuStats[item.menuId].revenue += (item.quantity * item.price);
    });

    const topMenus = Object.values(menuStats)
      .sort((a: any, b: any) => b.sold - a.sold)
      .slice(0, 5);

    // ✅ KIRIM RESPONSE DENGAN DATA LENGKAP
    const responseData = {
      totalRevenue,
      orderCount,
      paymentBreakdown,
      weeklyRevenue,
      topMenus,
      todayDate: today.toISOString().split('T')[0],
      yesterdayRevenue
    };

    console.log(`[Dashboard Stats] Response:`, {
      totalRevenue,
      orderCount,
      yesterdayRevenue,
      todayDate: responseData.todayDate
    });

    res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Error get stats:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data statistik' });
  }
};

// --- Ambil Semua Riwayat Pesanan (Dengan Field Source & PaymentMethod) ---
export const getAllOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            menu: { select: { name: true, imageUrl: true } }
          }
        }
      }
    });

    // Field 'source' dan 'paymentMethod' otomatis terbawa dari database
    // karena sudah ada di model Order
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error('Error get all orders:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil riwayat pesanan' });
  }
};



// --- Cek Status Pesanan Publik ---
export const getOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const orderId = req.params.id as string;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        customerName: true,
        status: true,
        paymentMethod: true,
        totalAmount: true,
        createdAt: true,
        source: true, // 👈 Tambahkan source agar pelanggan tahu asal pesanan
        items: {
          select: {
            menu: { select: { name: true } },
            quantity: true
          }
        }
      }
    });

    if (!order) {
      res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan. Cek kembali ID Pesanan Anda.' });
      return;
    }

    // Kalau masih menunggu pembayaran non-tunai dan sudah lewat batas waktu, tandai kedaluwarsa
    let currentStatus: OrderStatus = order.status;

    console.log('[cek-expired]', {
      orderId: order.id,
      status: order.status,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
      now: new Date(),
      deadline: new Date(order.createdAt.getTime() + PAYMENT_EXPIRY_MINUTES * 60 * 1000),
      lewatBatasWaktu: new Date() > new Date(order.createdAt.getTime() + PAYMENT_EXPIRY_MINUTES * 60 * 1000),
    });

    if (currentStatus === 'PENDING_PAYMENT' && order.paymentMethod !== 'CASH') {
      const deadline = new Date(order.createdAt.getTime() + PAYMENT_EXPIRY_MINUTES * 60 * 1000);
      if (new Date() > deadline) {
        const expiredOrder = await prisma.order.update({
          where: { id: orderId },
          data: { status: 'EXPIRED' }
        });
        currentStatus = expiredOrder.status;
      }
    }

    res.status(200).json({ success: true, data: { ...order, status: currentStatus } });
  } catch (error) {
    console.error('Error check order status:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server saat mengecek pesanan.' });
  }
};

// --- Get Sales Trend (Harian/Mingguan/Bulanan) ---
export const getSalesTrend = async (req: Request, res: Response): Promise<void> => {
  try {
    const period = req.query.period as string || 'daily';
    
    let startDate: Date;
    let endDate: Date;

    const now = new Date();

    console.log(`[getSalesTrend] Period: ${period}`);

    switch (period) {
      case 'daily': {
        // Hari ini per jam
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      }
      case 'weekly': {
        // Minggu ini (Senin - Minggu)
        const dayOfWeek = now.getDay();
        const diffToMonday = (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
        startDate = new Date(now);
        startDate.setDate(now.getDate() - diffToMonday);
        startDate.setHours(0, 0, 0, 0);
        
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      }
      case 'monthly': {
        // Bulan ini
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;
      }
      default: {
        res.status(400).json({ 
          success: false, 
          message: 'Period tidak valid. Gunakan: daily, weekly, atau monthly' 
        });
        return;
      }
    }

    console.log(`[getSalesTrend] Start: ${startDate.toISOString()}, End: ${endDate.toISOString()}`);

    // Ambil semua order yang sesuai dengan periode
    const orders = await prisma.order.findMany({
      where: {
        status: { in: ['PAID', 'COOKING', 'READY', 'COMPLETED'] },
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        totalAmount: true,
        createdAt: true
      }
    });

    console.log(`[getSalesTrend] Found ${orders.length} orders`);

    let formattedData: { name: string; total: number }[] = [];

    if (period === 'daily') {
      // Group by jam
      const hourlyMap = new Map();
      orders.forEach(order => {
        const hour = order.createdAt.getHours();
        const key = `${hour.toString().padStart(2, '0')}:00`;
        hourlyMap.set(key, (hourlyMap.get(key) || 0) + order.totalAmount);
      });

      // Format untuk 24 jam
      formattedData = [];
      for (let i = 0; i < 24; i++) {
        const key = `${i.toString().padStart(2, '0')}:00`;
        formattedData.push({
          name: key,
          total: hourlyMap.get(key) || 0
        });
      }
    } else if (period === 'weekly') {
      // Group by hari
      const dayMap = new Map();
      const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      
      orders.forEach(order => {
        const day = order.createdAt.getDay();
        const key = dayNames[day];
        dayMap.set(key, (dayMap.get(key) || 0) + order.totalAmount);
      });

      // Format untuk 7 hari (mulai dari Senin)
      formattedData = [];
      const dayNamesOrdered = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
      dayNamesOrdered.forEach(day => {
        formattedData.push({
          name: day,
          total: dayMap.get(day) || 0
        });
      });
    } else if (period === 'monthly') {
      // Group by tanggal
      const dayMap = new Map();
      orders.forEach(order => {
        const day = order.createdAt.getDate();
        const key = day.toString();
        dayMap.set(key, (dayMap.get(key) || 0) + order.totalAmount);
      });

      // Format untuk semua tanggal dalam bulan
      const daysInMonth = endDate.getDate();
      formattedData = [];
      for (let i = 1; i <= daysInMonth; i++) {
        const key = i.toString();
        formattedData.push({
          name: key,
          total: dayMap.get(key) || 0
        });
      }
    }

    console.log(`[getSalesTrend] Returning ${formattedData.length} data points`);

    res.status(200).json({
      success: true,
      data: formattedData
    });
  } catch (error) {
    console.error('Error get sales trend:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Gagal mengambil data tren penjualan',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
