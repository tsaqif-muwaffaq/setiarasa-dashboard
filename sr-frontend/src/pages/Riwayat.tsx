// Riwayat.tsx - Responsive Mobile Friendly
import { useState } from 'react';
import axios from 'axios';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { useGlobalLoading } from '@/components/GlobalLoadingProvider';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Search, Eye, Receipt, ClipboardList, X, QrCode, Banknote, Wifi, WifiOff, Calendar, Filter, ChevronDown } from 'lucide-react';

// ── Komponen Neubrutalism ──
function NeoCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`border-4 border-[#18181B] dark:border-[#FFFDF7] bg-[#FFFDF7] dark:bg-[#18181B] shadow-[6px_6px_0px_#18181B] dark:shadow-[6px_6px_0px_#FFFDF7] card-lift-premium border-glow-animated ${className}`}>
      {children}
    </div>
  );
}

function NeoInput({ className = '', ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      className={`border-2 border-[#18181B] bg-[#FFFDF7] px-3 py-1.5 text-xs font-bold text-[#18181B] outline-none transition-all focus:shadow-[4px_4px_0px_#7F1D1D] focus:border-[#7F1D1D] dark:border-[#FFFDF7] dark:bg-[#18181B] dark:text-[#FFFDF7] dark:focus:shadow-[4px_4px_0px_#C9A227] dark:focus:border-[#C9A227] placeholder:text-[#18181B]/40 dark:placeholder:text-[#FFFDF7]/40 font-dm-sans ${className}`}
      {...props}
    />
  );
}

function NeoSelect({ className = '', children, ...props }: React.ComponentProps<'select'> & { children: React.ReactNode }) {
  return (
    <select
      className={`border-2 border-[#18181B] bg-[#FFFDF7] px-3 py-1.5 text-xs font-bold text-[#18181B] outline-none transition-all focus:shadow-[4px_4px_0px_#7F1D1D] focus:border-[#7F1D1D] dark:border-[#FFFDF7] dark:bg-[#18181B] dark:text-[#FFFDF7] dark:focus:shadow-[4px_4px_0px_#C9A227] dark:focus:border-[#C9A227] font-dm-sans appearance-none ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  menu?: { name?: string; imageUrl?: string };
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

// ── Type untuk periode filter ──
type FilterPeriod = 'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | 'lastMonth' | 'custom';

const toSafeNumber = (value: unknown) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const formatSafeDate = (dateString: string | undefined, dateFormat: string) => {
  const date = new Date(dateString || '');
  if (!Number.isFinite(date.getTime())) return '-';
  return format(date, dateFormat, { locale: id });
};

// ── Helper untuk mendapatkan rentang tanggal berdasarkan periode ──
const getDateRange = (period: FilterPeriod, customStart?: string, customEnd?: string): { start: Date | null; end: Date | null } => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (period) {
    case 'today': {
      return {
        start: new Date(today),
        end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)
      };
    }
    case 'yesterday': {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        start: new Date(yesterday),
        end: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999)
      };
    }
    case 'thisWeek': {
      const dayOfWeek = today.getDay();
      const diffToMonday = (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
      const start = new Date(today);
      start.setDate(today.getDate() - diffToMonday);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    case 'thisMonth': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
      return { start, end };
    }
    case 'lastMonth': {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
      return { start, end };
    }
    case 'custom': {
      if (customStart && customEnd) {
        const start = new Date(customStart);
        start.setHours(0, 0, 0, 0);
        const end = new Date(customEnd);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      }
      return { start: null, end: null };
    }
    default: {
      return { start: null, end: null };
    }
  }
};

// ── Komponen Badge Metode Pembayaran ──
function PaymentMethodBadge({ method }: { method?: string }) {
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

  const { label, className, icon } = map[method || ''] ?? { 
    label: method || '-', 
    className: 'border-[#18181B] bg-[#FFFDF7] text-[#18181B] dark:border-[#FFFDF7] dark:bg-[#18181B] dark:text-[#FFFDF7]',
    icon: null
  };

  return (
    <span className={`inline-flex items-center border-2 px-2 py-0.5 text-[10px] font-black shadow-[2px_2px_0px_#18181B] dark:shadow-[2px_2px_0px_#FFFDF7] ${className} font-jetbrains`}>
      {icon}
      {label}
    </span>
  );
}

// ── Komponen Badge Asal Pesanan ──
function SourceBadge({ source }: { source?: string }) {
  const isOffline = source === 'OFFLINE';
  return (
    <span className={`inline-flex items-center border-2 px-2 py-0.5 text-[10px] font-black shadow-[2px_2px_0px_#18181B] dark:shadow-[2px_2px_0px_#FFFDF7] font-jetbrains ${
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

function StatusPill({ status }: { status?: Order['status'] | string }) {
  const map: Record<string, { label: string; className: string }> = {
    COMPLETED: { label: 'Selesai', className: 'border-[#065F46] bg-[#065F46]/10 text-[#065F46] dark:border-[#34D399] dark:bg-[#065F46]/30 dark:text-[#34D399]' },
    COOKING: { label: 'Dimasak', className: 'border-[#C9A227] bg-[#C9A227]/20 text-[#18181B] dark:border-[#C9A227] dark:bg-[#C9A227]/20 dark:text-[#C9A227]' },
    PENDING: { label: 'Menunggu', className: 'border-[#C9A227] bg-[#C9A227]/10 text-[#18181B] dark:border-[#C9A227] dark:bg-[#C9A227]/15 dark:text-[#C9A227]' },
    PENDING_PAYMENT: { label: 'Belum Bayar', className: 'border-[#7F1D1D] bg-[#7F1D1D]/10 text-[#7F1D1D] dark:border-[#C9A227] dark:bg-[#7F1D1D]/30 dark:text-[#FFFDF7]' },
    CANCELLED: { label: 'Dibatalkan', className: 'border-[#7F1D1D] bg-[#7F1D1D]/10 text-[#7F1D1D] dark:border-[#7F1D1D] dark:bg-[#7F1D1D]/30 dark:text-[#FFFDF7]' },
  };
  const { label, className } = map[status || ''] ?? { label: status || '-', className: 'border-[#18181B] bg-[#FFFDF7] text-[#18181B] dark:border-[#FFFDF7] dark:bg-[#18181B] dark:text-[#FFFDF7]' };
  return (
    <span className={`inline-flex items-center border-2 px-2 py-0.5 text-[10px] font-black shadow-[2px_2px_0px_#18181B] dark:shadow-[2px_2px_0px_#FFFDF7] ${className} font-jetbrains`}>
      {label}
    </span>
  );
}

function OrderRow({ order, onView, index }: { order: Order; onView: () => void; index: number }) {
  const orderTotalAmount = toSafeNumber(order?.totalAmount);

  return (
    <tr className={`border-b-2 border-[#18181B]/20 hover:bg-[#C9A227]/10 dark:border-[#FFFDF7]/10 dark:hover:bg-[#C9A227]/20 transition-colors group animate-slide-left-${(index % 3) + 1} table-row-hover-animated`}>
      {/* Tanggal - dibuat lebih compact di mobile */}
      <td className="py-2 sm:py-3 pl-2 sm:pl-4 pr-1 sm:pr-2">
        <p className="text-[11px] sm:text-sm font-black text-[#18181B] dark:text-[#FFFDF7] tabular-nums font-jetbrains">
          {formatSafeDate(order?.createdAt, 'dd/MM/yy')}
        </p>
        <p className="text-[10px] sm:text-xs font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50 tabular-nums font-jetbrains">
          {formatSafeDate(order?.createdAt, 'HH:mm')}
        </p>
      </td>
      {/* Pelanggan - di-mobile lebih ringkas */}
      <td className="py-2 sm:py-3 px-1 sm:px-2">
        <p className="text-[11px] sm:text-sm font-black text-[#18181B] dark:text-[#FFFDF7] truncate max-w-[80px] sm:max-w-[140px] font-space">
          {order?.customerName || 'Pelanggan'}
        </p>
        <p className="text-[10px] sm:text-xs font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50 font-dm-sans">
          {order?.tableNumber || 'Bawa Pulang'}
        </p>
      </td>
      {/* Status & Metode - di-mobile di-stack vertikal */}
      <td className="py-2 sm:py-3 px-1 sm:px-2">
        <div className="flex flex-col gap-1">
          <StatusPill status={order.status} />
          <PaymentMethodBadge method={order.paymentMethod} />
        </div>
      </td>
      {/* Asal - di-mobile di-stack */}
      <td className="py-2 sm:py-3 px-1 sm:px-2">
        <SourceBadge source={order.source || 'OFFLINE'} />
      </td>
      {/* Total - lebih ringkas di mobile */}
      <td className="py-2 sm:py-3 px-1 sm:px-2 text-right">
        <p className="text-[11px] sm:text-sm font-black text-[#7F1D1D] dark:text-[#C9A227] tabular-nums font-jetbrains whitespace-nowrap">
          Rp {orderTotalAmount.toLocaleString('id-ID')}
        </p>
      </td>
      {/* Aksi - tombol tetap muncul di mobile tanpa hover */}
      <td className="py-2 sm:py-3 pr-2 sm:pr-4 pl-1 sm:pl-2 text-right">
        <button
          onClick={onView}
          className="border-2 border-[#18181B] bg-[#FFFDF7] px-2 py-1 text-xs font-black text-[#18181B] shadow-[3px_3px_0px_#18181B] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#18181B] active:translate-x-1 active:translate-y-1 active:shadow-[1px_1px_0px_#18181B] dark:border-[#FFFDF7] dark:bg-[#18181B] dark:text-[#FFFDF7] dark:shadow-[3px_3px_0px_#FFFDF7] dark:hover:shadow-[5px_5px_0px_#FFFDF7] hover-scale-bounce"
        >
          <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </button>
      </td>
    </tr>
  );
}

export default function Riwayat() {
  const { showLoading, hideLoading } = useGlobalLoading();
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // ── State untuk filter ──
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('thisWeek');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const { data: orders, isLoading, refetch } = useQuery<Order[]>({
    queryKey: ['orderHistory'],
    queryFn: async () => {
      const isFirstLoad = !queryClient.getQueryData(['orderHistory']);
      if (isFirstLoad) {
        showLoading('Memuat riwayat transaksi...');
      }
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/orders/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        return Array.isArray(res.data?.data) ? res.data.data : [];
      } catch (error) {
        console.error('Gagal memuat riwayat pesanan:', error);
        return [];
      } finally {
        if (!queryClient.getQueryData(['orderHistory'])) {
          setTimeout(() => hideLoading(), 300);
        }
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 30000,
  });

  const safeOrders = Array.isArray(orders)
    ? orders.filter((order): order is Order => Boolean(order && typeof order === 'object'))
    : [];

  // ── Filter berdasarkan periode waktu ──
  const filterOrdersByDate = (orders: Order[]): Order[] => {
    const range = getDateRange(filterPeriod, customStartDate, customEndDate);
    
    if (!range.start || !range.end) {
      return orders;
    }

    return orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= range.start! && orderDate <= range.end!;
    });
  };

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const dateFilteredOrders = filterOrdersByDate(safeOrders);
  
  const filteredOrders = dateFilteredOrders.filter(
    (order) =>
      (order?.customerName || '').toLowerCase().includes(normalizedSearchTerm) ||
      (order?.id || '').toLowerCase().includes(normalizedSearchTerm)
  );

  const totalSelesai = dateFilteredOrders.filter((o) => o?.status === 'COMPLETED').length;
  const totalPending = dateFilteredOrders.filter((o) => o?.status === 'PENDING').length;
  const totalRevenue = dateFilteredOrders
    .filter((o) => o?.status === 'COMPLETED')
    .reduce((sum, o) => sum + toSafeNumber(o?.totalAmount), 0);

  const totalOnline = dateFilteredOrders.filter((o) => o?.source === 'ONLINE').length;
  const totalOffline = dateFilteredOrders.filter((o) => o?.source === 'OFFLINE' || !o?.source).length;
  const selectedOrderItems = Array.isArray(selectedOrder?.items) ? selectedOrder.items : [];
  const selectedOrderTotalAmount = toSafeNumber(selectedOrder?.totalAmount);

  // ── Reset custom dates saat periode bukan custom ──
  const handlePeriodChange = (period: FilterPeriod) => {
    setFilterPeriod(period);
    if (period !== 'custom') {
      setCustomStartDate('');
      setCustomEndDate('');
    }
  };

  // ── Format label periode ──
  const getPeriodLabel = (period: FilterPeriod): string => {
    const map: Record<FilterPeriod, string> = {
      today: 'Hari Ini',
      yesterday: 'Kemarin',
      thisWeek: 'Minggu Ini',
      thisMonth: 'Bulan Ini',
      lastMonth: 'Bulan Lalu',
      custom: 'Kustom'
    };
    return map[period];
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleTampilkanQRIS = async (orderData: Order) => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/payments/create`, {
        orderId: orderData.id,
        amount: toSafeNumber(orderData.totalAmount),
        customerName: orderData.customerName || 'Pelanggan',
      });

      // @ts-ignore
      window.snap.pay(res.data.token, {
        onSuccess: () => {
          alert('Pembayaran berhasil!');
          setIsModalOpen(false);
          refetch();
        },
        onPending: () => {
          alert('Menunggu pembayaran diselesaikan.');
        },
        onError: () => {
          alert('Pembayaran gagal.');
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
    <div className="flex flex-col gap-4 sm:gap-5 pb-10 bg-[#FFFDF7] dark:bg-[#18181B] px-2 sm:px-0">

      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-1 animate-fade-in-up">
        <div>
          <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#7F1D1D] dark:text-[#C9A227] font-jetbrains">
            Setia Rasa · Riwayat
          </p>
          <h1 className="text-lg sm:text-xl font-black tracking-tight text-gradient font-space">Riwayat Transaksi</h1>
        </div>

        {/* Badge Stats - Responsive wrap dengan ukuran lebih kecil di mobile */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          <span className="flex items-center gap-1 sm:gap-1.5 border-2 border-[#18181B] bg-[#FFFDF7] px-2 sm:px-2.5 py-1 sm:py-1.5 text-[10px] sm:text-xs font-black shadow-[2px_2px_0px_#18181B] sm:shadow-[3px_3px_0px_#18181B] dark:border-[#FFFDF7] dark:bg-[#18181B] dark:shadow-[2px_2px_0px_#FFFDF7] sm:dark:shadow-[3px_3px_0px_#FFFDF7] dark:text-[#FFFDF7] animate-fade-in-up-delay-1 border-glow-animated font-jetbrains">
            <ClipboardList className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#18181B]/50 dark:text-[#FFFDF7]/50" />
            <span className="hidden xs:inline">{dateFilteredOrders.length} transaksi</span>
            <span className="xs:hidden">{dateFilteredOrders.length}</span>
          </span>
          <span className="flex items-center gap-1 sm:gap-1.5 border-2 border-[#065F46] bg-[#065F46]/10 px-2 sm:px-2.5 py-1 sm:py-1.5 text-[10px] sm:text-xs font-black text-[#065F46] shadow-[2px_2px_0px_#18181B] sm:shadow-[3px_3px_0px_#18181B] dark:border-[#34D399] dark:bg-[#065F46]/30 dark:text-[#34D399] dark:shadow-[2px_2px_0px_#FFFDF7] sm:dark:shadow-[3px_3px_0px_#FFFDF7] animate-fade-in-up-delay-2 border-glow-animated font-jetbrains">
            {totalSelesai}
            <span className="hidden xs:inline">selesai</span>
          </span>
          {totalPending > 0 && (
            <span className="flex items-center gap-1 sm:gap-1.5 border-2 border-[#C9A227] bg-[#C9A227]/20 px-2 sm:px-2.5 py-1 sm:py-1.5 text-[10px] sm:text-xs font-black text-[#18181B] shadow-[2px_2px_0px_#18181B] sm:shadow-[3px_3px_0px_#18181B] dark:border-[#C9A227] dark:bg-[#C9A227]/20 dark:text-[#C9A227] dark:shadow-[2px_2px_0px_#FFFDF7] sm:dark:shadow-[3px_3px_0px_#FFFDF7] animate-fade-in-up-delay-3 border-glow-animated font-jetbrains">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C9A227] animate-pulse" />
              {totalPending}
            </span>
          )}
          <span className="flex items-center gap-1 sm:gap-1.5 border-2 border-[#18181B] bg-[#FFFDF7] px-2 sm:px-2.5 py-1 sm:py-1.5 text-[10px] sm:text-xs font-black shadow-[2px_2px_0px_#18181B] sm:shadow-[3px_3px_0px_#18181B] dark:border-[#FFFDF7] dark:bg-[#18181B] dark:shadow-[2px_2px_0px_#FFFDF7] sm:dark:shadow-[3px_3px_0px_#FFFDF7] dark:text-[#FFFDF7] animate-fade-in-up-delay-4 border-glow-animated font-jetbrains">
            <Receipt className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#18181B]/50 dark:text-[#FFFDF7]/50" />
            <span className="hidden xs:inline">Rp {totalRevenue.toLocaleString('id-ID')}</span>
            <span className="xs:hidden">Rp {totalRevenue.toLocaleString('id-ID', { notation: 'compact' })}</span>
          </span>
          <span className="flex items-center gap-1 sm:gap-1.5 border-2 border-[#7F1D1D] bg-[#7F1D1D]/10 px-2 sm:px-2.5 py-1 sm:py-1.5 text-[10px] sm:text-xs font-black text-[#7F1D1D] shadow-[2px_2px_0px_#18181B] sm:shadow-[3px_3px_0px_#18181B] dark:border-[#C9A227] dark:bg-[#7F1D1D]/30 dark:text-[#FFFDF7] dark:shadow-[2px_2px_0px_#FFFDF7] sm:dark:shadow-[3px_3px_0px_#FFFDF7] animate-fade-in-up-delay-5 border-glow-animated font-jetbrains">
            <Wifi className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            {totalOnline}
          </span>
          <span className="flex items-center gap-1 sm:gap-1.5 border-2 border-[#18181B] bg-[#FFFDF7] px-2 sm:px-2.5 py-1 sm:py-1.5 text-[10px] sm:text-xs font-black shadow-[2px_2px_0px_#18181B] sm:shadow-[3px_3px_0px_#18181B] dark:border-[#FFFDF7] dark:bg-[#18181B] dark:shadow-[2px_2px_0px_#FFFDF7] sm:dark:shadow-[3px_3px_0px_#FFFDF7] dark:text-[#FFFDF7] animate-fade-in-up-delay-6 border-glow-animated font-jetbrains">
            <WifiOff className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#18181B]/50 dark:text-[#FFFDF7]/50" />
            {totalOffline}
          </span>
        </div>
      </div>

      {/* ── Filter Bar - Responsive ── */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 animate-fade-in-up-delay-1">
        <div className="flex items-center gap-1.5 sm:gap-2 border-2 border-[#18181B] bg-[#FFFDF7] px-2 sm:px-3 py-1 sm:py-1.5 shadow-[2px_2px_0px_#18181B] sm:shadow-[3px_3px_0px_#18181B] dark:border-[#FFFDF7] dark:bg-[#18181B] dark:shadow-[2px_2px_0px_#FFFDF7] sm:dark:shadow-[3px_3px_0px_#FFFDF7] border-glow-animated">
          <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#18181B]/50 dark:text-[#FFFDF7]/50" />
          <span className="text-[10px] sm:text-xs font-bold text-[#18181B] dark:text-[#FFFDF7] font-dm-sans">Periode:</span>
        </div>

        {/* Dropdown Periode */}
        <div className="relative">
          <NeoSelect
            value={filterPeriod}
            onChange={(e) => handlePeriodChange(e.target.value as FilterPeriod)}
            className="pr-6 sm:pr-8 min-w-[100px] sm:min-w-[120px] text-[10px] sm:text-xs py-1 sm:py-1.5"
          >
            <option value="today">Hari Ini</option>
            <option value="yesterday">Kemarin</option>
            <option value="thisWeek">Minggu Ini</option>
            <option value="thisMonth">Bulan Ini</option>
            <option value="lastMonth">Bulan Lalu</option>
            <option value="custom">Kustom</option>
          </NeoSelect>
          <ChevronDown className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#18181B]/50 dark:text-[#FFFDF7]/50 pointer-events-none" />
        </div>

        {/* Custom Date Picker - UPDATED with better visibility */}
        {filterPeriod === 'custom' && (
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <div className="relative">
              <NeoInput
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-28 sm:w-36 text-[10px] sm:text-xs py-1 sm:py-1.5 text-[#18181B] dark:text-[#FFFDF7] bg-[#FFFDF7] dark:bg-[#18181B] border-[#18181B] dark:border-[#FFFDF7] placeholder:text-[#18181B]/40 dark:placeholder:text-[#FFFDF7]/40 [color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>
            <span className="text-[10px] sm:text-xs font-bold text-[#18181B] dark:text-[#FFFDF7] font-dm-sans">s/d</span>
            <div className="relative">
              <NeoInput
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-28 sm:w-36 text-[10px] sm:text-xs py-1 sm:py-1.5 text-[#18181B] dark:text-[#FFFDF7] bg-[#FFFDF7] dark:bg-[#18181B] border-[#18181B] dark:border-[#FFFDF7] placeholder:text-[#18181B]/40 dark:placeholder:text-[#FFFDF7]/40 [color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>
          </div>
        )}

        {/* Reset Filter Button */}
        <button
          onClick={() => {
            setFilterPeriod('thisWeek');
            setCustomStartDate('');
            setCustomEndDate('');
          }}
          className="border-2 border-[#18181B] bg-[#FFFDF7] px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-black text-[#18181B] shadow-[2px_2px_0px_#18181B] sm:shadow-[3px_3px_0px_#18181B] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#18181B] sm:hover:shadow-[5px_5px_0px_#18181B] active:translate-x-1 active:translate-y-1 active:shadow-[1px_1px_0px_#18181B] dark:border-[#FFFDF7] dark:bg-[#18181B] dark:text-[#FFFDF7] dark:shadow-[2px_2px_0px_#FFFDF7] sm:dark:shadow-[3px_3px_0px_#FFFDF7] dark:hover:shadow-[3px_3px_0px_#FFFDF7] sm:dark:hover:shadow-[5px_5px_0px_#FFFDF7] hover-scale-bounce font-dm-sans"
        >
          Reset
        </button>

        {/* Informasi rentang waktu - hidden di mobile very small */}
        <span className="hidden sm:inline text-[10px] font-bold text-[#18181B]/40 dark:text-[#FFFDF7]/40 font-jetbrains ml-auto">
          {(() => {
            const range = getDateRange(filterPeriod, customStartDate, customEndDate);
            if (range.start && range.end) {
              return `${format(range.start, 'dd/MM/yy')} - ${format(range.end, 'dd/MM/yy')}`;
            }
            return 'Semua waktu';
          })()}
        </span>
      </div>

      {/* Tabel - Dengan overflow-x-auto untuk scroll horizontal di mobile */}
      <NeoCard className="overflow-hidden animate-fade-in-up-delay-2 corner-accent-animated">
        <div className="border-b-2 border-[#18181B] bg-[#E7D9B8] px-3 sm:px-4 py-2 sm:py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 dark:border-[#FFFDF7] dark:bg-[#18181B]">
          <p className="text-xs sm:text-sm font-black text-[#18181B] dark:text-[#FFFDF7] font-space">Daftar Pesanan</p>
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#18181B]/50 dark:text-[#FFFDF7]/50" />
            <NeoInput
              placeholder="Cari nama / ID..."
              className="pl-7 sm:pl-8 w-full text-[10px] sm:text-xs py-1 sm:py-1.5"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 text-[#18181B]/50 hover:text-[#18181B] dark:text-[#FFFDF7]/50 dark:hover:text-[#FFFDF7] hover-scale-bounce"
                onClick={() => setSearchTerm('')}
              >
                <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Container dengan overflow-x-auto untuk scroll horizontal */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm min-w-[600px]">
            <thead>
              <tr className="border-b-2 border-[#18181B] bg-[#7F1D1D] dark:border-[#FFFDF7]">
                <th className="py-1.5 sm:py-2.5 pl-2 sm:pl-4 pr-1 sm:pr-2 text-left text-[9px] sm:text-[11px] font-black uppercase tracking-wide text-[#FFFDF7] font-jetbrains">Tanggal</th>
                <th className="py-1.5 sm:py-2.5 px-1 sm:px-2 text-left text-[9px] sm:text-[11px] font-black uppercase tracking-wide text-[#FFFDF7] font-jetbrains">Pelanggan</th>
                <th className="py-1.5 sm:py-2.5 px-1 sm:px-2 text-left text-[9px] sm:text-[11px] font-black uppercase tracking-wide text-[#FFFDF7] font-jetbrains">Status & Metode</th>
                <th className="py-1.5 sm:py-2.5 px-1 sm:px-2 text-left text-[9px] sm:text-[11px] font-black uppercase tracking-wide text-[#FFFDF7] font-jetbrains">Asal</th>
                <th className="py-1.5 sm:py-2.5 px-1 sm:px-2 text-right text-[9px] sm:text-[11px] font-black uppercase tracking-wide text-[#FFFDF7] font-jetbrains">Total</th>
                <th className="py-1.5 sm:py-2.5 pr-2 sm:pr-4 pl-1 sm:pl-2 text-right text-[9px] sm:text-[11px] font-black uppercase tracking-wide text-[#FFFDF7] font-jetbrains">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 sm:py-16 text-center text-xs sm:text-sm font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50 flex items-center justify-center gap-2 font-dm-sans">
                    <span className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-[#7F1D1D] border-t-transparent rounded-full animate-spin dark:border-[#C9A227] dark:border-t-transparent" />
                    Memuat data...
                  </td>
                </tr>
              ) : filteredOrders?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 sm:py-16 text-center text-xs sm:text-sm font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50 font-dm-sans">
                    {searchTerm ? `Tidak ada hasil untuk "${searchTerm}"` : 'Tidak ada transaksi pada periode ini.'}
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
          <div className="border-t-2 border-[#18181B] bg-[#E7D9B8] px-3 sm:px-4 py-1.5 sm:py-2 dark:border-[#FFFDF7] dark:bg-[#18181B]">
            <p className="text-[10px] sm:text-xs font-bold text-[#18181B] dark:text-[#FFFDF7] font-dm-sans">
              Menampilkan {filteredOrders.length} dari {dateFilteredOrders.length} transaksi pada periode ini
            </p>
          </div>
        )}
      </NeoCard>

      {/* Modal Detail - Responsive untuk mobile */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#18181B]/80 p-2 sm:p-4 animate-fade-in-up backdrop-blur-sm">
          <div className="w-full max-w-md border-4 border-[#18181B] bg-[#FFFDF7] shadow-[8px_8px_0px_#18181B] sm:shadow-[12px_12px_0px_#18181B] dark:border-[#FFFDF7] dark:bg-[#18181B] dark:shadow-[8px_8px_0px_#FFFDF7] sm:dark:shadow-[12px_12px_0px_#FFFDF7] max-h-[90vh] overflow-y-auto corner-accent-animated">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4 border-b-2 border-[#18181B] pb-2 sm:pb-3 dark:border-[#FFFDF7]">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-[#7F1D1D] dark:text-[#C9A227] animate-float" />
                  <h2 className="text-base sm:text-lg font-black text-[#18181B] dark:text-[#FFFDF7] font-space">Detail Transaksi</h2>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="border-2 border-[#18181B] bg-[#FFFDF7] p-1 shadow-[2px_2px_0px_#18181B] sm:shadow-[3px_3px_0px_#18181B] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#18181B] sm:hover:shadow-[5px_5px_0px_#18181B] active:translate-x-1 active:translate-y-1 active:shadow-[1px_1px_0px_#18181B] dark:border-[#FFFDF7] dark:bg-[#18181B] dark:shadow-[2px_2px_0px_#FFFDF7] sm:dark:shadow-[3px_3px_0px_#FFFDF7] dark:hover:shadow-[3px_3px_0px_#FFFDF7] sm:dark:hover:shadow-[5px_5px_0px_#FFFDF7] hover-scale-bounce"
                >
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#18181B] dark:text-[#FFFDF7]" />
                </button>
              </div>

              <p className="text-[10px] sm:text-[11px] font-mono font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50 mb-3 sm:mb-4 font-jetbrains break-all">
                {selectedOrder.id || '-'}
              </p>

              {/* Grid 2 kolom di desktop, 1 kolom di mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 sm:gap-x-4 gap-y-2 sm:gap-y-3 mb-3 sm:mb-4">
                {[
                  { label: 'Pelanggan', value: selectedOrder.customerName || 'Pelanggan' },
                  {
                    label: 'Tipe',
                    value: selectedOrder.tableNumber
                      ? selectedOrder.tableNumber
                      : 'Bawa Pulang',
                  },
                  {
                    label: 'Waktu',
                    value: formatSafeDate(selectedOrder.createdAt, 'dd/MM/yyyy HH:mm'),
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
                    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#18181B]/50 dark:text-[#FFFDF7]/50 mb-0.5 sm:mb-1 font-jetbrains">
                      {label}
                    </p>
                    {node ?? <p className="text-xs sm:text-sm font-black text-[#18181B] dark:text-[#FFFDF7] font-space">{value}</p>}
                  </div>
                ))}
              </div>

              <div className="border-t-2 border-[#18181B] pt-3 sm:pt-4 dark:border-[#FFFDF7]">
                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#18181B]/50 dark:text-[#FFFDF7]/50 mb-1.5 sm:mb-2.5 font-jetbrains">
                  Item Pesanan
                </p>
                <div className="space-y-1.5 max-h-48 sm:max-h-56 overflow-y-auto">
                  {selectedOrderItems.map((item, itemIndex) => {
                    const itemName = item?.menu?.name || 'Menu';
                    const itemQuantity = toSafeNumber(item?.quantity);
                    const itemPrice = toSafeNumber(item?.price);
                    return (
                      <div key={item?.id || `${selectedOrder.id}-${itemIndex}`} className="flex items-center gap-2 sm:gap-3 border-2 border-[#18181B]/20 p-1.5 sm:p-2 dark:border-[#FFFDF7]/10 table-row-hover-animated">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-[#18181B] bg-[#E7D9B8] overflow-hidden shrink-0 dark:border-[#FFFDF7]">
                          <img
                            src={item?.menu?.imageUrl || 'https://via.placeholder.com/80'}
                            alt={itemName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-black text-[#18181B] dark:text-[#FFFDF7] truncate font-space">{itemName}</p>
                          <p className="text-[10px] sm:text-[11px] font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50 font-jetbrains">
                            {itemQuantity}× Rp {itemPrice.toLocaleString('id-ID')}
                          </p>
                        </div>
                        <p className="text-xs sm:text-sm font-black text-[#18181B] dark:text-[#FFFDF7] shrink-0 font-jetbrains">
                          Rp {(itemQuantity * itemPrice).toLocaleString('id-ID')}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 sm:pt-4 mt-3 sm:mt-4 border-t-2 border-[#18181B] dark:border-[#FFFDF7]">
                <span className="text-xs sm:text-sm font-bold text-[#18181B]/70 dark:text-[#FFFDF7]/70 font-dm-sans">Total</span>
                <span className="text-base sm:text-xl font-black text-[#7F1D1D] dark:text-[#C9A227] tabular-nums font-space">
                  Rp {selectedOrderTotalAmount.toLocaleString('id-ID')}
                </span>
              </div>

              {selectedOrder.status === 'PENDING_PAYMENT' && (
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t-2 border-[#18181B] dark:border-[#FFFDF7]">
                  <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#18181B]/50 dark:text-[#FFFDF7]/50 mb-1.5 sm:mb-2 text-center font-jetbrains">
                    Tindakan Kasir
                  </p>
                  <button
                    onClick={() => handleTampilkanQRIS(selectedOrder)}
                    className="w-full border-4 border-[#18181B] bg-[#065F46] text-[#FFFDF7] font-black py-2.5 sm:py-3 shadow-[4px_4px_0px_#18181B] sm:shadow-[6px_6px_0px_#18181B] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#18181B] sm:hover:shadow-[10px_10px_0px_#18181B] active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[4px_4px_0px_#FFFDF7] sm:dark:shadow-[6px_6px_0px_#FFFDF7] dark:hover:shadow-[6px_6px_0px_#FFFDF7] sm:dark:hover:shadow-[10px_10px_0px_#FFFDF7] flex items-center justify-center gap-1.5 sm:gap-2 card-lift-premium ripple-button font-space text-xs sm:text-base"
                  >
                    <QrCode className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-xs sm:text-base">Tampilkan QRIS</span>
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