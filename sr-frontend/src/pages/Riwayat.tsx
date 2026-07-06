// Riwayat.tsx - Tambahkan kolom Metode Pembayaran dan Asal Pesanan

import { useState } from 'react';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Search, Eye, Receipt, ClipboardList, X, QrCode, Banknote, Wifi, WifiOff } from 'lucide-react';

// ── Komponen Neubrutalism ──
function NeoCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`border-4 border-[#18181B] bg-[#FFFDF7] shadow-[6px_6px_0px_#18181B] dark:border-[#FFFDF7] dark:bg-[#18181B] dark:shadow-[6px_6px_0px_#FFFDF7] card-lift-premium ${className}`}>
      {children}
    </div>
  );
}

function NeoInput({ className = '', ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      className={`border-2 border-[#18181B] bg-[#FFFDF7] px-3 py-1.5 text-xs font-bold text-[#18181B] outline-none transition-all focus:shadow-[4px_4px_0px_#7F1D1D] focus:border-[#7F1D1D] dark:border-[#FFFDF7] dark:bg-[#18181B] dark:text-[#FFFDF7] dark:focus:shadow-[4px_4px_0px_#C9A227] dark:focus:border-[#C9A227] placeholder:text-[#18181B]/40 dark:placeholder:text-[#FFFDF7]/40 ${className}`}
      {...props}
    />
  );
}

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  menu: { name: string; imageUrl: string };
}

interface Order {
  id: string;
  customerName: string;
  tableNumber: string | null;
  status: 'PENDING' | 'PENDING_PAYMENT' | 'COOKING' | 'COMPLETED' | 'CANCELLED';
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
  paymentMethod: string;
  source: 'OFFLINE' | 'ONLINE';
}

// ── Komponen Badge Metode Pembayaran ──
function PaymentMethodBadge({ method }: { method: string }) {
  const map: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    CASH: { 
      label: 'Tunai', 
      className: 'border-[#18181B] bg-[#E7D9B8] text-[#18181B] dark:border-[#FFFDF7] dark:bg-[#18181B] dark:text-[#FFFDF7]',
      icon: <Banknote className="w-3 h-3 mr-1" />
    },
    QRIS: { 
      label: 'QRIS', 
      className: 'border-[#065F46] bg-[#065F46]/10 text-[#065F46] dark:border-[#34D399] dark:bg-[#065F46]/30 dark:text-[#34D399]',
      icon: <QrCode className="w-3 h-3 mr-1" />
    },
    GOPAY: { 
      label: 'GoPay', 
      className: 'border-[#1A73E8] bg-[#1A73E8]/10 text-[#1A73E8] dark:border-[#1A73E8] dark:bg-[#1A73E8]/30 dark:text-[#1A73E8]',
      icon: <Wifi className="w-3 h-3 mr-1" />
    },
    SHOPEEPAY: { 
      label: 'ShopeePay', 
      className: 'border-[#EE4D2D] bg-[#EE4D2D]/10 text-[#EE4D2D] dark:border-[#EE4D2D] dark:bg-[#EE4D2D]/30 dark:text-[#EE4D2D]',
      icon: <Wifi className="w-3 h-3 mr-1" />
    },
    BANK_TRANSFER: { 
      label: 'Transfer Bank', 
      className: 'border-[#C9A227] bg-[#C9A227]/20 text-[#18181B] dark:border-[#C9A227] dark:bg-[#C9A227]/20 dark:text-[#C9A227]',
      icon: <Wifi className="w-3 h-3 mr-1" />
    },
    DEBIT: { 
      label: 'Debit', 
      className: 'border-[#7B2FBE] bg-[#7B2FBE]/10 text-[#7B2FBE] dark:border-[#7B2FBE] dark:bg-[#7B2FBE]/30 dark:text-[#7B2FBE]',
      icon: <Wifi className="w-3 h-3 mr-1" />
    },
  };

  const { label, className, icon } = map[method] ?? { 
    label: method, 
    className: 'border-[#18181B] bg-[#FFFDF7] text-[#18181B] dark:border-[#FFFDF7] dark:bg-[#18181B] dark:text-[#FFFDF7]',
    icon: null
  };

  return (
    <span className={`inline-flex items-center border-2 px-2 py-0.5 text-[10px] font-black shadow-[2px_2px_0px_#18181B] dark:shadow-[2px_2px_0px_#FFFDF7] ${className}`}>
      {icon}
      {label}
    </span>
  );
}

// ── Komponen Badge Asal Pesanan ──
function SourceBadge({ source }: { source: 'OFFLINE' | 'ONLINE' }) {
  const isOffline = source === 'OFFLINE';
  return (
    <span className={`inline-flex items-center border-2 px-2 py-0.5 text-[10px] font-black shadow-[2px_2px_0px_#18181B] dark:shadow-[2px_2px_0px_#FFFDF7] ${
      isOffline 
        ? 'border-[#18181B] bg-[#FFFDF7] text-[#18181B] dark:border-[#FFFDF7] dark:bg-[#18181B] dark:text-[#FFFDF7]' 
        : 'border-[#065F46] bg-[#065F46]/10 text-[#065F46] dark:border-[#34D399] dark:bg-[#065F46]/30 dark:text-[#34D399]'
    }`}>
      {isOffline ? (
        <>
          <WifiOff className="w-3 h-3 mr-1" />
          Offline
        </>
      ) : (
        <>
          <Wifi className="w-3 h-3 mr-1" />
          Online
        </>
      )}
    </span>
  );
}

function StatusPill({ status }: { status: Order['status'] }) {
  const map: Record<Order['status'], { label: string; className: string }> = {
    COMPLETED: { label: 'Selesai', className: 'border-[#065F46] bg-[#065F46]/10 text-[#065F46] dark:border-[#34D399] dark:bg-[#065F46]/30 dark:text-[#34D399]' },
    COOKING: { label: 'Dimasak', className: 'border-[#C9A227] bg-[#C9A227]/20 text-[#18181B] dark:border-[#C9A227] dark:bg-[#C9A227]/20 dark:text-[#C9A227]' },
    PENDING: { label: 'Menunggu', className: 'border-[#C9A227] bg-[#C9A227]/10 text-[#18181B] dark:border-[#C9A227] dark:bg-[#C9A227]/15 dark:text-[#C9A227]' },
    PENDING_PAYMENT: { label: 'Belum Bayar', className: 'border-[#7F1D1D] bg-[#7F1D1D]/10 text-[#7F1D1D] dark:border-[#C9A227] dark:bg-[#7F1D1D]/30 dark:text-[#FFFDF7]' },
    CANCELLED: { label: 'Dibatalkan', className: 'border-[#7F1D1D] bg-[#7F1D1D]/10 text-[#7F1D1D] dark:border-[#7F1D1D] dark:bg-[#7F1D1D]/30 dark:text-[#FFFDF7]' },
  };
  const { label, className } = map[status] ?? { label: status, className: 'border-[#18181B] bg-[#FFFDF7] text-[#18181B] dark:border-[#FFFDF7] dark:bg-[#18181B] dark:text-[#FFFDF7]' };
  return (
    <span className={`inline-flex items-center border-2 px-2 py-0.5 text-[10px] font-black shadow-[2px_2px_0px_#18181B] dark:shadow-[2px_2px_0px_#FFFDF7] ${className}`}>
      {label}
    </span>
  );
}

function OrderRow({ order, onView, index }: { order: Order; onView: () => void; index: number }) {
  return (
    <tr className={`border-b-2 border-[#18181B]/20 hover:bg-[#C9A227]/10 dark:border-[#FFFDF7]/10 dark:hover:bg-[#C9A227]/20 transition-colors group animate-slide-left-${(index % 3) + 1}`}>
      <td className="py-3 pl-4 pr-2">
        <p className="text-sm font-black text-[#18181B] dark:text-[#FFFDF7] tabular-nums">
          {format(new Date(order.createdAt), 'dd MMM yyyy', { locale: id })}
        </p>
        <p className="text-xs font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50 tabular-nums">
          {format(new Date(order.createdAt), 'HH:mm')}
        </p>
      </td>
      <td className="py-3 px-2">
        <p className="text-sm font-black text-[#18181B] dark:text-[#FFFDF7] truncate max-w-[140px]">{order.customerName}</p>
        <p className="text-xs font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50">
          {order.tableNumber || 'Bawa Pulang'}
        </p>
      </td>
      <td className="py-3 px-2">
        <div className="flex flex-col gap-1">
          <StatusPill status={order.status} />
          <PaymentMethodBadge method={order.paymentMethod} />
        </div>
      </td>
      <td className="py-3 px-2">
        <SourceBadge source={order.source || 'OFFLINE'} />
      </td>
      <td className="py-3 px-2 text-right">
        <p className="text-sm font-black text-[#7F1D1D] dark:text-[#C9A227] tabular-nums">
          Rp {order.totalAmount.toLocaleString('id-ID')}
        </p>
      </td>
      <td className="py-3 pr-4 pl-2 text-right">
        <button
          onClick={onView}
          className="border-2 border-[#18181B] bg-[#FFFDF7] px-2 py-1 text-xs font-black text-[#18181B] shadow-[3px_3px_0px_#18181B] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#18181B] active:translate-x-1 active:translate-y-1 active:shadow-[1px_1px_0px_#18181B] dark:border-[#FFFDF7] dark:bg-[#18181B] dark:text-[#FFFDF7] dark:shadow-[3px_3px_0px_#FFFDF7] dark:hover:shadow-[5px_5px_0px_#FFFDF7] opacity-0 group-hover:opacity-100 focus:opacity-100 hover-scale-bounce"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
      </td>
    </tr>
  );
}

export default function Riwayat() {
  const token = useAuthStore((state) => state.token);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: orders, isLoading, refetch } = useQuery<Order[]>({
    queryKey: ['orderHistory'],
    queryFn: async () => {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/orders/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.data;
    },
  });

  const filteredOrders = orders?.filter(
    (order) =>
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSelesai = orders?.filter((o) => o.status === 'COMPLETED').length ?? 0;
  const totalPending = orders?.filter((o) => o.status === 'PENDING').length ?? 0;
  const totalRevenue = orders
    ?.filter((o) => o.status === 'COMPLETED')
    .reduce((sum, o) => sum + o.totalAmount, 0) ?? 0;

  const totalOnline = orders?.filter((o) => o.source === 'ONLINE').length ?? 0;
  const totalOffline = orders?.filter((o) => o.source === 'OFFLINE' || !o.source).length ?? 0;

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleTampilkanQRIS = async (orderData: Order) => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/payments/create`, {
        orderId: orderData.id,
        amount: orderData.totalAmount,
        customerName: orderData.customerName,
      });

      // @ts-ignore
      window.snap.pay(res.data.token, {
        onSuccess: () => {
          alert('✅ Pembayaran berhasil!');
          setIsModalOpen(false);
          refetch();
        },
        onPending: () => {
          alert('⏳ Menunggu pembayaran diselesaikan.');
        },
        onError: () => {
          alert('❌ Pembayaran gagal.');
        },
        onClose: () => {
          console.log('Pop-up QRIS ditutup.');
        },
      });
    } catch (error) {
      console.error('Gagal memuat QRIS:', error);
      alert('Gagal memuat ulang pembayaran QRIS.');
    }
  };

  return (
    <div className="flex flex-col gap-5 pb-10 bg-[#FFFDF7] dark:bg-[#18181B]">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-1 animate-fade-in-up">
        <div>
          <p className="text-[11px] font-black uppercase tracking-wider text-[#7F1D1D] dark:text-[#C9A227]">
            Setia Rasa · Riwayat
          </p>
          <h1 className="text-xl font-black tracking-tight text-[#18181B] dark:text-[#FFFDF7]">Riwayat Transaksi</h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="flex items-center gap-1.5 border-2 border-[#18181B] bg-[#FFFDF7] px-2.5 py-1.5 text-xs font-black shadow-[3px_3px_0px_#18181B] dark:border-[#FFFDF7] dark:bg-[#18181B] dark:shadow-[3px_3px_0px_#FFFDF7] dark:text-[#FFFDF7] animate-fade-in-up-delay-1">
            <ClipboardList className="w-3.5 h-3.5 text-[#18181B]/50 dark:text-[#FFFDF7]/50" />
            {orders?.length ?? 0} transaksi
          </span>
          <span className="flex items-center gap-1.5 border-2 border-[#065F46] bg-[#065F46]/10 px-2.5 py-1.5 text-xs font-black text-[#065F46] shadow-[3px_3px_0px_#18181B] dark:border-[#34D399] dark:bg-[#065F46]/30 dark:text-[#34D399] dark:shadow-[3px_3px_0px_#FFFDF7] animate-fade-in-up-delay-2">
            {totalSelesai} selesai
          </span>
          {totalPending > 0 && (
            <span className="flex items-center gap-1.5 border-2 border-[#C9A227] bg-[#C9A227]/20 px-2.5 py-1.5 text-xs font-black text-[#18181B] shadow-[3px_3px_0px_#18181B] dark:border-[#C9A227] dark:bg-[#C9A227]/20 dark:text-[#C9A227] dark:shadow-[3px_3px_0px_#FFFDF7] animate-fade-in-up-delay-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C9A227] animate-pulse" />
              {totalPending} pending
            </span>
          )}
          <span className="flex items-center gap-1.5 border-2 border-[#18181B] bg-[#FFFDF7] px-2.5 py-1.5 text-xs font-black shadow-[3px_3px_0px_#18181B] dark:border-[#FFFDF7] dark:bg-[#18181B] dark:shadow-[3px_3px_0px_#FFFDF7] dark:text-[#FFFDF7] animate-fade-in-up-delay-4">
            <Receipt className="w-3.5 h-3.5 text-[#18181B]/50 dark:text-[#FFFDF7]/50" />
            Rp {totalRevenue.toLocaleString('id-ID')}
          </span>
          <span className="flex items-center gap-1.5 border-2 border-[#7F1D1D] bg-[#7F1D1D]/10 px-2.5 py-1.5 text-xs font-black text-[#7F1D1D] shadow-[3px_3px_0px_#18181B] dark:border-[#C9A227] dark:bg-[#7F1D1D]/30 dark:text-[#FFFDF7] dark:shadow-[3px_3px_0px_#FFFDF7] animate-fade-in-up-delay-5">
            <Wifi className="w-3.5 h-3.5" />
            {totalOnline} online
          </span>
          <span className="flex items-center gap-1.5 border-2 border-[#18181B] bg-[#FFFDF7] px-2.5 py-1.5 text-xs font-black shadow-[3px_3px_0px_#18181B] dark:border-[#FFFDF7] dark:bg-[#18181B] dark:shadow-[3px_3px_0px_#FFFDF7] dark:text-[#FFFDF7] animate-fade-in-up-delay-6">
            <WifiOff className="w-3.5 h-3.5 text-[#18181B]/50 dark:text-[#FFFDF7]/50" />
            {totalOffline} offline
          </span>
        </div>
      </div>

      {/* Tabel */}
      <NeoCard className="overflow-hidden animate-fade-in-up-delay-2">
        <div className="border-b-2 border-[#18181B] bg-[#E7D9B8] px-4 py-3 flex items-center justify-between dark:border-[#FFFDF7] dark:bg-[#18181B]">
          <p className="text-sm font-black text-[#18181B] dark:text-[#FFFDF7]">Daftar Pesanan</p>
          <div className="relative w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#18181B]/50 dark:text-[#FFFDF7]/50" />
            <NeoInput
              placeholder="Cari nama / ID..."
              className="pl-8 w-full text-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#18181B]/50 hover:text-[#18181B] dark:text-[#FFFDF7]/50 dark:hover:text-[#FFFDF7] hover-scale-bounce"
                onClick={() => setSearchTerm('')}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-[#18181B] bg-[#7F1D1D] dark:border-[#FFFDF7]">
                <th className="py-2.5 pl-4 pr-2 text-left text-[11px] font-black uppercase tracking-wide text-[#FFFDF7]">Tanggal</th>
                <th className="py-2.5 px-2 text-left text-[11px] font-black uppercase tracking-wide text-[#FFFDF7]">Pelanggan</th>
                <th className="py-2.5 px-2 text-left text-[11px] font-black uppercase tracking-wide text-[#FFFDF7]">Status & Metode</th>
                <th className="py-2.5 px-2 text-left text-[11px] font-black uppercase tracking-wide text-[#FFFDF7]">Asal</th>
                <th className="py-2.5 px-2 text-right text-[11px] font-black uppercase tracking-wide text-[#FFFDF7]">Total</th>
                <th className="py-2.5 pr-4 pl-2 text-right text-[11px] font-black uppercase tracking-wide text-[#FFFDF7]">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-sm font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50 flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-[#7F1D1D] border-t-transparent rounded-full animate-spin dark:border-[#C9A227] dark:border-t-transparent" />
                    Memuat data...
                  </td>
                </tr>
              ) : filteredOrders?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-sm font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50">
                    {searchTerm ? `Tidak ada hasil untuk "${searchTerm}"` : 'Belum ada transaksi.'}
                  </td>
                </tr>
              ) : (
                filteredOrders?.map((order, index) => (
                  <OrderRow key={order.id} order={order} onView={() => handleViewDetails(order)} index={index} />
                ))
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && (filteredOrders?.length ?? 0) > 0 && (
          <div className="border-t-2 border-[#18181B] bg-[#E7D9B8] px-4 py-2 dark:border-[#FFFDF7] dark:bg-[#18181B]">
            <p className="text-xs font-bold text-[#18181B] dark:text-[#FFFDF7]">
              Menampilkan {filteredOrders?.length} dari {orders?.length} transaksi
            </p>
          </div>
        )}
      </NeoCard>

      {/* Modal Detail */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#18181B]/80 p-4 animate-fade-in-up">
          <div className="w-full max-w-md border-4 border-[#18181B] bg-[#FFFDF7] shadow-[12px_12px_0px_#18181B] dark:border-[#FFFDF7] dark:bg-[#18181B] dark:shadow-[12px_12px_0px_#FFFDF7] max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between gap-2 mb-4 border-b-2 border-[#18181B] pb-3 dark:border-[#FFFDF7]">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-[#7F1D1D] dark:text-[#C9A227]" />
                  <h2 className="text-lg font-black text-[#18181B] dark:text-[#FFFDF7]">Detail Transaksi</h2>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="border-2 border-[#18181B] bg-[#FFFDF7] p-1 shadow-[3px_3px_0px_#18181B] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#18181B] active:translate-x-1 active:translate-y-1 active:shadow-[1px_1px_0px_#18181B] dark:border-[#FFFDF7] dark:bg-[#18181B] dark:shadow-[3px_3px_0px_#FFFDF7] dark:hover:shadow-[5px_5px_0px_#FFFDF7] hover-scale-bounce"
                >
                  <X className="w-4 h-4 text-[#18181B] dark:text-[#FFFDF7]" />
                </button>
              </div>

              <p className="text-[11px] font-mono font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50 mb-4">
                {selectedOrder.id}
              </p>

              <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-4">
                {[
                  { label: 'Pelanggan', value: selectedOrder.customerName },
                  {
                    label: 'Tipe',
                    value: selectedOrder.tableNumber
                      ? selectedOrder.tableNumber
                      : 'Bawa Pulang',
                  },
                  {
                    label: 'Waktu',
                    value: format(new Date(selectedOrder.createdAt), 'dd/MM/yyyy HH:mm'),
                  },
                  {
                    label: 'Status',
                    node: <StatusPill status={selectedOrder.status} />,
                  },
                  {
                    label: 'Metode Pembayaran',
                    node: <PaymentMethodBadge method={selectedOrder.paymentMethod} />,
                  },
                  {
                    label: 'Asal Pesanan',
                    node: <SourceBadge source={selectedOrder.source || 'OFFLINE'} />,
                  },
                ].map(({ label, value, node }) => (
                  <div key={label}>
                    <p className="text-[10px] font-black uppercase tracking-wider text-[#18181B]/50 dark:text-[#FFFDF7]/50 mb-1">
                      {label}
                    </p>
                    {node ?? <p className="text-sm font-black text-[#18181B] dark:text-[#FFFDF7]">{value}</p>}
                  </div>
                ))}
              </div>

              <div className="border-t-2 border-[#18181B] pt-4 dark:border-[#FFFDF7]">
                <p className="text-[10px] font-black uppercase tracking-wider text-[#18181B]/50 dark:text-[#FFFDF7]/50 mb-2.5">
                  Item Pesanan
                </p>
                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 border-2 border-[#18181B]/20 p-2 dark:border-[#FFFDF7]/10">
                      <div className="w-8 h-8 border-2 border-[#18181B] bg-[#E7D9B8] overflow-hidden shrink-0 dark:border-[#FFFDF7]">
                        <img
                          src={item.menu.imageUrl || 'https://via.placeholder.com/80'}
                          alt={item.menu.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-[#18181B] dark:text-[#FFFDF7] truncate">{item.menu.name}</p>
                        <p className="text-[11px] font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50">
                          {item.quantity}× Rp {item.price.toLocaleString('id-ID')}
                        </p>
                      </div>
                      <p className="text-sm font-black text-[#18181B] dark:text-[#FFFDF7] shrink-0">
                        Rp {(item.quantity * item.price).toLocaleString('id-ID')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 mt-4 border-t-2 border-[#18181B] dark:border-[#FFFDF7]">
                <span className="text-sm font-bold text-[#18181B]/70 dark:text-[#FFFDF7]/70">Total</span>
                <span className="text-xl font-black text-[#7F1D1D] dark:text-[#C9A227] tabular-nums">
                  Rp {selectedOrder.totalAmount.toLocaleString('id-ID')}
                </span>
              </div>

              {selectedOrder.status === 'PENDING_PAYMENT' && (
                <div className="mt-4 pt-4 border-t-2 border-[#18181B] dark:border-[#FFFDF7]">
                  <p className="text-[10px] font-black uppercase tracking-wider text-[#18181B]/50 dark:text-[#FFFDF7]/50 mb-2 text-center">
                    Tindakan Kasir
                  </p>
                  <button
                    onClick={() => handleTampilkanQRIS(selectedOrder)}
                    className="w-full border-4 border-[#18181B] bg-[#065F46] text-[#FFFDF7] font-black py-3 shadow-[6px_6px_0px_#18181B] transition-all hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[10px_10px_0px_#18181B] active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[6px_6px_0px_#FFFDF7] dark:hover:shadow-[10px_10px_0px_#FFFDF7] flex items-center justify-center gap-2 card-lift-premium"
                  >
                    <QrCode className="w-5 h-5" />
                    Tampilkan QRIS Pembayaran
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}