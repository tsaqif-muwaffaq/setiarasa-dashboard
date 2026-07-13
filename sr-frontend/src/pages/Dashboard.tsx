// Dashboard.tsx - Fully Responsive Mobile Friendly
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useGlobalLoading } from '@/components/GlobalLoadingProvider';
import { 
  DollarSign, 
  ShoppingBag, 
  Receipt, 
  TrendingUp, 
  CreditCard, 
  Wallet, 
  QrCode, 
  Banknote, 
  Clock, 
  RefreshCw, 
  Zap, 
  BarChart3, 
  Star, 
  ArrowUpRight, 
  Smartphone,
  Calendar,
  ArrowUp,
  ArrowDown,
  Minus,
  CheckCircle2,
  Wifi
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface WeeklyRevenue {
  name: string;
  total: number;
}

interface TopMenu {
  id: string;
  name: string;
  category: string;
  sold: number;
  revenue: number;
  image?: string;
  imageUrl?: string;
}

interface PaymentBreakdown {
  CASH: number;
  QRIS: number;
  GOPAY: number;
  SHOPEEPAY: number;
  BANK_TRANSFER: number;
  DEBIT: number;
}

interface DashboardStats {
  totalRevenue?: number;
  orderCount?: number;
  paymentBreakdown?: PaymentBreakdown;
  weeklyRevenue?: WeeklyRevenue[];
  topMenus?: TopMenu[];
  todayDate?: string;
  yesterdayRevenue?: number;
}

type SalesPeriod = 'daily' | 'weekly' | 'monthly';

const emptyPaymentBreakdown: PaymentBreakdown = {
  CASH: 0,
  QRIS: 0,
  GOPAY: 0,
  SHOPEEPAY: 0,
  BANK_TRANSFER: 0,
  DEBIT: 0,
};

const emptyDashboardStats: DashboardStats = {
  totalRevenue: 0,
  orderCount: 0,
  paymentBreakdown: emptyPaymentBreakdown,
  weeklyRevenue: [],
  topMenus: [],
  todayDate: new Date().toISOString().split('T')[0],
  yesterdayRevenue: 0,
};

const toSafeNumber = (value: unknown): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

// Helper: Format tanggal Indonesia
const formatDateIndonesia = (date: Date) => {
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

// ── Komponen Neubrutalism ──
function NeoCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`border-4 border-[#18181B] dark:border-[#FFFDF7] bg-[#FFFDF7] dark:bg-[#18181B] shadow-[4px_4px_0px_#18181B] sm:shadow-[6px_6px_0px_#18181B] dark:shadow-[4px_4px_0px_#FFFDF7] sm:dark:shadow-[6px_6px_0px_#FFFDF7] card-lift border-glow-animated ${className}`}>
      {children}
    </div>
  );
}

function NeoBadge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center border-2 border-[#18181B] dark:border-[#FFFDF7] px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-black shadow-[2px_2px_0px_#18181B] sm:shadow-[3px_3px_0px_#18181B] dark:shadow-[2px_2px_0px_#FFFDF7] sm:dark:shadow-[3px_3px_0px_#FFFDF7] ${className}`}>
      {children}
    </span>
  );
}

// ── Komponen Trend Indicator (Pakai Icon, Bukan Emoji) ──
function TrendIndicator({ value }: { value: number }) {
  if (value > 0) {
    return (
      <span className="inline-flex items-center text-[#065F46] dark:text-[#34D399] font-jetbrains text-[10px] sm:text-xs">
        <ArrowUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-0.5" />
        {Math.abs(value).toFixed(1)}%
      </span>
    );
  } else if (value < 0) {
    return (
      <span className="inline-flex items-center text-[#7F1D1D] dark:text-[#D68A8A] font-jetbrains text-[10px] sm:text-xs">
        <ArrowDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-0.5" />
        {Math.abs(value).toFixed(1)}%
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-[#18181B]/50 dark:text-[#FFFDF7]/50 font-jetbrains text-[10px] sm:text-xs">
      <Minus className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-0.5" />
      0%
    </span>
  );
}

export default function Dashboard() {
  const { showLoading, hideLoading } = useGlobalLoading();
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);
  
  const [salesPeriod, setSalesPeriod] = useState<SalesPeriod>('daily');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentDay, setCurrentDay] = useState<string>(formatDateIndonesia(new Date()));

  // ── Auto Reset Setiap Jam 00 ──
  const resetAtMidnight = useCallback(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    console.log(`[Dashboard] Data akan di-reset dalam ${Math.floor(msUntilMidnight / 60000)} menit`);
    
    return setTimeout(() => {
      console.log('[Dashboard] Reset data tengah malam!');
      setCurrentDay(formatDateIndonesia(new Date()));
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['salesTrend', salesPeriod] });
      setLastUpdated(new Date());
      resetAtMidnight();
    }, msUntilMidnight);
  }, [queryClient, salesPeriod]);

  useEffect(() => {
    const timer = resetAtMidnight();
    return () => clearTimeout(timer);
  }, [resetAtMidnight]);

  // ── Cek setiap menit apakah hari sudah berganti ──
  useEffect(() => {
    const checkDayChange = setInterval(() => {
      const today = formatDateIndonesia(new Date());
      if (today !== currentDay) {
        console.log('[Dashboard] Hari berganti, refresh data...');
        setCurrentDay(today);
        queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
        queryClient.invalidateQueries({ queryKey: ['salesTrend', salesPeriod] });
        setLastUpdated(new Date());
      }
    }, 60000);

    return () => clearInterval(checkDayChange);
  }, [currentDay, queryClient, salesPeriod]);

  // ── Manual Refresh ──
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    setCurrentDay(formatDateIndonesia(new Date()));
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] }),
      queryClient.invalidateQueries({ queryKey: ['salesTrend', salesPeriod] })
    ]);
    setLastUpdated(new Date());
    setIsRefreshing(false);
  };

  const { data: stats, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const isFirstLoad = !queryClient.getQueryData(['dashboardStats']);
      if (isFirstLoad) {
        showLoading('Memuat data dashboard...');
      }
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await axios.get(`${apiUrl}/api/orders/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        const responseData = res.data?.data;
        if (!responseData || typeof responseData !== 'object') {
          console.warn('Invalid stats response structure:', responseData);
          return emptyDashboardStats;
        }

        return {
          totalRevenue: toSafeNumber(responseData.totalRevenue),
          orderCount: toSafeNumber(responseData.orderCount),
          paymentBreakdown: {
            CASH: toSafeNumber(responseData.paymentBreakdown?.CASH),
            QRIS: toSafeNumber(responseData.paymentBreakdown?.QRIS),
            GOPAY: toSafeNumber(responseData.paymentBreakdown?.GOPAY),
            SHOPEEPAY: toSafeNumber(responseData.paymentBreakdown?.SHOPEEPAY),
            BANK_TRANSFER: toSafeNumber(responseData.paymentBreakdown?.BANK_TRANSFER),
            DEBIT: toSafeNumber(responseData.paymentBreakdown?.DEBIT),
          },
          weeklyRevenue: Array.isArray(responseData.weeklyRevenue) ? responseData.weeklyRevenue : [],
          topMenus: Array.isArray(responseData.topMenus) ? responseData.topMenus : [],
          todayDate: responseData.todayDate || new Date().toISOString().split('T')[0],
          yesterdayRevenue: toSafeNumber(responseData.yesterdayRevenue),
        };
      } catch (err) {
        console.error('Gagal memuat statistik dashboard:', err);
        return emptyDashboardStats;
      } finally {
        if (!queryClient.getQueryData(['dashboardStats'])) {
          setTimeout(() => hideLoading(), 300);
        }
      }
    },
    refetchInterval: 30000,
    retry: 2,
    refetchOnWindowFocus: false,
    staleTime: 20000,
  });

  const { data: salesTrend, isLoading: isSalesTrendLoading } = useQuery<WeeklyRevenue[]>({
    queryKey: ['salesTrend', salesPeriod],
    queryFn: async () => {
      const isFirstLoad = !queryClient.getQueryData(['salesTrend', salesPeriod]);
      if (isFirstLoad) {
        showLoading('Memuat tren penjualan...');
      }
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await axios.get(`${apiUrl}/api/orders/sales-trend`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { period: salesPeriod },
        });
        return Array.isArray(res.data?.data) ? res.data.data : [];
      } catch (err) {
        console.error('Gagal memuat tren penjualan:', err);
        return [];
      } finally {
        if (!queryClient.getQueryData(['salesTrend', salesPeriod])) {
          setTimeout(() => hideLoading(), 300);
        }
      }
    },
    refetchInterval: 30000,
    retry: 2,
    refetchOnWindowFocus: false,
    staleTime: 20000,
  });

  const safeStats = stats || emptyDashboardStats;
  
  const rawWeeklyData = Array.isArray(safeStats.weeklyRevenue) ? safeStats.weeklyRevenue : [];
  const todayName = new Date().toLocaleDateString('id-ID', { weekday: 'short' });
  const todayData = rawWeeklyData.filter(item => item.name === todayName);
  const todayRevenue = todayData.length > 0 ? todayData[0].total : 0;
  
  const orderCount = toSafeNumber(safeStats.orderCount);
  const totalRevenue = toSafeNumber(safeStats.totalRevenue);
  const averageOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;
  const weeklyData = rawWeeklyData;
  const topMenus = Array.isArray(safeStats.topMenus) ? safeStats.topMenus : [];
  const breakdown = safeStats.paymentBreakdown || emptyPaymentBreakdown;
  const salesTrendData = Array.isArray(salesTrend) ? salesTrend : [];
  const yesterdayRevenue = toSafeNumber(safeStats.yesterdayRevenue);

  const periodOptions: { value: SalesPeriod; label: string }[] = [
    { value: 'daily', label: 'Hari ini' },
    { value: 'weekly', label: 'Mingguan' },
    { value: 'monthly', label: 'Bulanan' },
  ];

  // Bandingkan dengan kemarin
  const revenueDiff = yesterdayRevenue > 0 
    ? ((totalRevenue - yesterdayRevenue) / yesterdayRevenue * 100) 
    : 0;

  // ── Helper untuk format sub text ──
  const formatSubText = (title: string, value: number, diff: number) => {
    if (title === 'Total Omzet Hari Ini') {
      if (value === 0) return 'Belum ada transaksi hari ini';
      if (diff > 0) return `Naik ${Math.abs(diff).toFixed(1)}% dari kemarin`;
      if (diff < 0) return `Turun ${Math.abs(diff).toFixed(1)}% dari kemarin`;
      return 'Tetap dari kemarin';
    }
    if (title === 'Total Pesanan') {
      return `${value} pesanan selesai hari ini`;
    }
    if (title === 'Rata-rata Transaksi') {
      return 'Nilai belanja per pelanggan';
    }
    return '';
  };

  // ── Metric Cards - Dengan Ukuran Seragam ──
  const metricCards = [
    {
      id: 'omzet',
      title: 'Total Omzet Hari Ini',
      value: isLoading ? '...' : `Rp ${totalRevenue.toLocaleString('id-ID')}`,
      sub: formatSubText('Total Omzet Hari Ini', totalRevenue, revenueDiff),
      icon: DollarSign,
      bgColor: 'bg-[#7F1D1D] dark:bg-[#8B3A3A]',
      iconColor: 'text-[#FFFDF7] dark:text-[#FFFDF7]',
      trend: revenueDiff,
      showTrend: totalRevenue > 0,
    },
    {
      id: 'pesanan',
      title: 'Total Pesanan',
      value: isLoading ? '...' : orderCount.toLocaleString('id-ID'),
      sub: formatSubText('Total Pesanan', orderCount, 0),
      icon: ShoppingBag,
      bgColor: 'bg-[#065F46] dark:bg-[#15875F]',
      iconColor: 'text-[#FFFDF7] dark:text-[#FFFDF7]',
      trend: 0,
      showTrend: false,
    },
    {
      id: 'rata-rata',
      title: 'Rata-rata Transaksi',
      value: isLoading ? '...' : `Rp ${Math.round(averageOrderValue).toLocaleString('id-ID')}`,
      sub: formatSubText('Rata-rata Transaksi', 0, 0),
      icon: Receipt,
      bgColor: 'bg-[#C9A227] dark:bg-[#D8B13D]',
      iconColor: 'text-[#18181B] dark:text-[#18181B]',
      trend: 0,
      showTrend: false,
    },
    {
      id: 'status',
      title: 'Status Dapur',
      value: (
        <span className="flex items-center gap-1 sm:gap-1.5">
          <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#065F46] dark:text-[#34D399]" />
          <span className="text-xs sm:text-sm text-[#18181B] dark:text-[#FFFDF7]">Sinkron</span>
        </span>
      ),
      sub: `Data terakhir: ${lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`,
      icon: Zap,
      bgColor: 'bg-[#18181B] dark:bg-[#FFFDF7]',
      iconColor: 'text-[#FFFDF7] dark:text-[#18181B]',
      trend: 0,
      showTrend: false,
    },
  ];

  const paymentMethods = [
    { 
      label: 'Tunai', 
      key: 'CASH', 
      icon: Banknote, 
      bgColor: 'bg-[#18181B] dark:bg-[#2D3440]',
      iconColor: 'text-[#FFFDF7] dark:text-[#FFFDF7]',
    },
    { 
      label: 'QRIS', 
      key: 'QRIS', 
      icon: QrCode, 
      bgColor: 'bg-[#065F46] dark:bg-[#15875F]',
      iconColor: 'text-[#FFFDF7] dark:text-[#FFFDF7]',
    },
    { 
      label: 'GoPay', 
      key: 'GOPAY', 
      icon: Wallet, 
      bgColor: 'bg-[#1A73E8] dark:bg-[#2B5F9E]',
      iconColor: 'text-[#FFFDF7] dark:text-[#FFFDF7]',
    },
    { 
      label: 'ShopeePay', 
      key: 'SHOPEEPAY', 
      icon: Smartphone, 
      bgColor: 'bg-[#EE4D2D] dark:bg-[#C73E1D]',
      iconColor: 'text-[#FFFDF7] dark:text-[#FFFDF7]',
    },
    { 
      label: 'Transfer', 
      key: 'BANK_TRANSFER', 
      icon: ArrowUpRight, 
      bgColor: 'bg-[#C9A227] dark:bg-[#D8B13D]',
      iconColor: 'text-[#18181B] dark:text-[#18181B]',
    },
    { 
      label: 'Debit', 
      key: 'DEBIT', 
      icon: CreditCard, 
      bgColor: 'bg-[#7B2FBE] dark:bg-[#9B4DE0]',
      iconColor: 'text-[#FFFDF7] dark:text-[#FFFDF7]',
    },
  ];

  const rankColors = [
    'bg-[#C9A227] dark:bg-[#D8B13D] text-[#18181B] dark:text-[#18181B] border-[#18181B] dark:border-[#18181B]',
    'bg-[#065F46] dark:bg-[#15875F] text-[#FFFDF7] dark:text-[#FFFDF7] border-[#18181B] dark:border-[#FFFDF7]',
    'bg-[#7F1D1D] dark:bg-[#8B3A3A] text-[#FFFDF7] dark:text-[#FFFDF7] border-[#18181B] dark:border-[#FFFDF7]',
    'bg-[#18181B] dark:bg-[#FFFDF7] text-[#FFFDF7] dark:text-[#18181B] border-[#FFFDF7] dark:border-[#18181B]',
    'bg-[#E7D9B8] dark:bg-[#3D4450] text-[#18181B] dark:text-[#FFFDF7] border-[#18181B] dark:border-[#FFFDF7]',
  ];

  const formatLastUpdated = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] bg-[#FFFDF7] dark:bg-[#18181B] px-4">
        <div className="border-4 border-[#7F1D1D] dark:border-[#C9A227] bg-[#7F1D1D]/10 dark:bg-[#7F1D1D]/30 p-4 sm:p-6 shadow-[4px_4px_0px_#18181B] sm:shadow-[6px_6px_0px_#18181B] dark:shadow-[4px_4px_0px_#FFFDF7] sm:dark:shadow-[6px_6px_0px_#FFFDF7]">
          <p className="text-base sm:text-xl font-black text-[#7F1D1D] dark:text-[#C9A227]">Gagal Memuat Data</p>
          <p className="text-xs sm:text-sm font-bold text-[#18181B]/70 dark:text-[#FFFDF7]/70 mt-2">
            Terjadi kesalahan saat menghubungi server.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 border-4 border-[#18181B] dark:border-[#FFFDF7] bg-[#7F1D1D] dark:bg-[#7F1D1D] text-[#FFFDF7] dark:text-[#FFFDF7] px-4 sm:px-6 py-1.5 sm:py-2 text-sm sm:text-base font-black shadow-[3px_3px_0px_#18181B] sm:shadow-[4px_4px_0px_#18181B] dark:shadow-[3px_3px_0px_#FFFDF7] sm:dark:shadow-[4px_4px_0px_#FFFDF7] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#18181B] sm:hover:shadow-[6px_6px_0px_#18181B] dark:hover:shadow-[4px_4px_0px_#FFFDF7] sm:dark:hover:shadow-[6px_6px_0px_#FFFDF7] active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0px_#18181B] dark:active:shadow-[2px_2px_0px_#FFFDF7]"
          >
            Muat Ulang
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-10 bg-[#FFFDF7] dark:bg-[#18181B] px-3 sm:px-0">
      {/* Header - Responsive */}
      <NeoCard className="p-3 sm:p-6 animate-fade-in-up corner-accent-animated">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div>
            <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#7F1D1D] dark:text-[#C9A227] font-jetbrains">
              Setia Rasa · Dashboard
            </p>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-gradient font-space">
              Ringkasan Penjualan
            </h1>
            <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1 flex-wrap">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#18181B]/70 dark:text-[#FFFDF7]/70" />
              <p className="text-xs sm:text-sm font-bold text-[#18181B]/70 dark:text-[#FFFDF7]/70 font-dm-sans">
                {currentDay}
              </p>
              <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-[#065F46] dark:bg-[#34D399] animate-pulse inline-block ml-0.5 sm:ml-1 floating-dot" />
              <span className="text-[10px] sm:text-xs font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50 font-jetbrains">
                Live
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50 font-jetbrains">
              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#18181B] dark:text-[#FFFDF7]" />
              <span className="hidden xs:inline">Update: {formatLastUpdated(lastUpdated)}</span>
              <span className="xs:hidden">{formatLastUpdated(lastUpdated)}</span>
              <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-[#065F46] dark:bg-[#34D399] animate-pulse inline-block ml-0.5 sm:ml-1 floating-dot" />
            </div>
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className={`border-2 border-[#18181B] dark:border-[#FFFDF7] p-1.5 sm:p-2 shadow-[2px_2px_0px_#18181B] sm:shadow-[2px_2px_0px_#18181B] dark:shadow-[2px_2px_0px_#FFFDF7] sm:dark:shadow-[2px_2px_0px_#FFFDF7] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#18181B] sm:hover:shadow-[4px_4px_0px_#18181B] dark:hover:shadow-[3px_3px_0px_#FFFDF7] sm:dark:hover:shadow-[4px_4px_0px_#FFFDF7] active:translate-x-1 active:translate-y-1 active:shadow-[1px_1px_0px_#18181B] dark:active:shadow-[1px_1px_0px_#FFFDF7] ${isRefreshing ? 'opacity-50 cursor-not-allowed' : 'hover-scale-bounce'}`}
              title="Refresh data"
            >
              <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 text-[#18181B] dark:text-[#FFFDF7] ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <NeoBadge className="border-[#065F46] dark:border-[#34D399] text-[#065F46] dark:text-[#34D399] animate-pulse-soft">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#065F46] dark:bg-[#34D399] mr-1 sm:mr-2 inline-block animate-pulse" />
              <Wifi className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
              <span className="hidden xs:inline">Live Monitor Aktif</span>
              <span className="xs:hidden">Live</span>
            </NeoBadge>
          </div>
        </div>
        <div className="decorative-line mt-3 sm:mt-4" />
      </NeoCard>

      {/* ── METRIC CARDS - UKURAN SERAGAM ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {metricCards.map((card, index) => (
          <div key={card.id} className={`animate-fade-in-up-delay-${(index % 4) + 1}`}>
            <NeoCard className="h-full p-3 sm:p-5 hover:shadow-[6px_6px_0px_#18181B] sm:hover:shadow-[8px_8px_0px_#18181B] dark:hover:shadow-[6px_6px_0px_#FFFDF7] sm:dark:hover:shadow-[8px_8px_0px_#FFFDF7] transition-all duration-200 corner-accent">
              <div className="flex flex-col h-full">
                {/* Atas: Title + Icon */}
                <div className="flex items-start justify-between">
                  <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#18181B]/50 dark:text-[#FFFDF7]/50 font-dm-sans">
                    {card.title}
                  </p>
                  <div className={`flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center border-2 border-[#18181B] dark:border-[#FFFDF7] ${card.bgColor} shadow-[2px_2px_0px_#18181B] sm:shadow-[3px_3px_0px_#18181B] dark:shadow-[2px_2px_0px_#FFFDF7] sm:dark:shadow-[3px_3px_0px_#FFFDF7] hover-scale-bounce ml-2 sm:ml-3`}>
                    <card.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${card.iconColor}`} />
                  </div>
                </div>

                {/* Tengah: Value */}
                <div className="mt-1.5 sm:mt-2 flex-1">
                  {typeof card.value === 'string' ? (
                    <p className="text-xl sm:text-2xl md:text-3xl font-black text-[#18181B] dark:text-[#FFFDF7] font-space truncate">
                      {card.value}
                    </p>
                  ) : (
                    card.value
                  )}
                </div>

                {/* Bawah: Sub text + Trend */}
                <div className="mt-0.5 sm:mt-1 flex items-center flex-wrap gap-1 sm:gap-1.5 min-h-[16px] sm:min-h-[20px]">
                  <p className="text-[10px] sm:text-xs font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50 font-dm-sans truncate">
                    {card.sub}
                  </p>
                  {card.showTrend && card.trend !== 0 && (
                    <TrendIndicator value={card.trend} />
                  )}
                </div>
              </div>
            </NeoCard>
          </div>
        ))}
      </div>

      {/* Rincian Kas Masuk - Responsive Grid */}
      <div className="animate-fade-in-up-delay-3">
        <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 px-1">
          <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#18181B]/50 dark:text-[#FFFDF7]/50" />
          <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#18181B]/50 dark:text-[#FFFDF7]/50 font-jetbrains">
            Rincian Kas Masuk Hari Ini
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          {paymentMethods.map(({ label, key, icon: Icon, bgColor, iconColor }) => (
            <NeoCard key={key} className="p-2 sm:p-3 text-center hover:shadow-[6px_6px_0px_#18181B] sm:hover:shadow-[8px_8px_0px_#18181B] dark:hover:shadow-[6px_6px_0px_#FFFDF7] sm:dark:hover:shadow-[8px_8px_0px_#FFFDF7] transition-all duration-200 hover-scale-bounce border-glow-animated">
              <div className="flex flex-col items-center">
                <div className={`flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center border-2 border-[#18181B] dark:border-[#FFFDF7] ${bgColor} shadow-[2px_2px_0px_#18181B] sm:shadow-[3px_3px_0px_#18181B] dark:shadow-[2px_2px_0px_#FFFDF7] sm:dark:shadow-[3px_3px_0px_#FFFDF7]`}>
                  <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${iconColor}`} />
                </div>
                <p className="text-[10px] sm:text-xs font-bold text-[#18181B]/70 dark:text-[#FFFDF7]/70 mt-1 sm:mt-2 font-dm-sans">
                  {label}
                </p>
                <p className="text-xs sm:text-sm font-black text-[#7F1D1D] dark:text-[#C9A227] font-space">
                  Rp {toSafeNumber(breakdown[key as keyof PaymentBreakdown]).toLocaleString('id-ID')}
                </p>
              </div>
            </NeoCard>
          ))}
        </div>
      </div>

      {/* Tren Pendapatan & Top Menu */}
      <div className="grid grid-cols-1 xl:grid-cols-7 gap-4 sm:gap-6">
        {/* Tren Pendapatan */}
        <NeoCard className="xl:col-span-4 p-3 sm:p-5 animate-fade-in-up-delay-2 corner-accent-animated">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center border-2 border-[#18181B] dark:border-[#FFFDF7] bg-[#C9A227] dark:bg-[#D8B13D] shadow-[2px_2px_0px_#18181B] sm:shadow-[3px_3px_0px_#18181B] dark:shadow-[2px_2px_0px_#FFFDF7] sm:dark:shadow-[3px_3px_0px_#FFFDF7] hover-scale-bounce">
              <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#18181B] dark:text-[#18181B]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-[#18181B] dark:text-[#FFFDF7] font-space">
                Tren Pendapatan
              </h3>
              <p className="text-[10px] sm:text-xs font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50 font-dm-sans">
                7 Hari Terakhir
              </p>
            </div>
          </div>
          <div className="h-[200px] sm:h-[260px] md:h-[300px] w-full mt-1 sm:mt-2 overflow-hidden">
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50 font-dm-sans">
                <span className="h-3 w-3 sm:h-4 sm:w-4 animate-spin rounded-full border-2 border-[#7F1D1D] dark:border-[#C9A227] border-t-transparent" />
                <span className="hidden xs:inline">Memuat data dari server...</span>
                <span className="xs:hidden">Memuat...</span>
              </div>
            ) : weeklyData.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-xs sm:text-sm font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50 font-dm-sans">
                Belum ada data penjualan.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7D9B8" strokeOpacity={0.3} className="dark:stroke-[#2D3440] dark:stroke-opacity-30" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#18181B" 
                    className="dark:stroke-[#B0B8C8]" 
                    fontSize={9} 
                    tickLine={false} 
                    axisLine={false} 
                    tickMargin={6} 
                    tick={{ fill: '#18181B', fontWeight: 600, fontSize: 9, fontFamily: 'JetBrains Mono' }} 
                  />
                  <YAxis 
                    stroke="#18181B" 
                    className="dark:stroke-[#B0B8C8]" 
                    fontSize={9} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `Rp${value / 1000}k`} 
                    tickMargin={6} 
                    tick={{ fill: '#18181B', fontWeight: 600, fontSize: 9, fontFamily: 'JetBrains Mono' }} 
                  />
                  <Tooltip
                    cursor={{ fill: '#E7D9B8', fillOpacity: 0.2 }}
                    contentStyle={{ 
                      background: '#FFFDF7', 
                      border: '3px solid #18181B', 
                      borderRadius: '0px', 
                      boxShadow: '4px_4px_0px_#18181B', 
                      color: '#18181B', 
                      fontSize: '11px', 
                      fontFamily: 'DM Sans', 
                      padding: '8px 12px' 
                    }}
                    labelStyle={{ color: '#18181B', fontWeight: 900, fontSize: '11px', fontFamily: 'Space Grotesk' }}
                    itemStyle={{ color: '#18181B', fontWeight: 700, fontFamily: 'DM Sans' }}
                    formatter={(value) => [`Rp ${toSafeNumber(value).toLocaleString('id-ID')}`, 'Pendapatan']}
                  />
                  <Bar dataKey="total" fill="#7F1D1D" radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </NeoCard>

        {/* Top 5 Menu */}
        <NeoCard className="xl:col-span-3 p-3 sm:p-5 flex flex-col animate-fade-in-up-delay-3 corner-accent-animated">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center border-2 border-[#18181B] dark:border-[#FFFDF7] bg-[#C9A227] dark:bg-[#D8B13D] shadow-[2px_2px_0px_#18181B] sm:shadow-[3px_3px_0px_#18181B] dark:shadow-[2px_2px_0px_#FFFDF7] sm:dark:shadow-[3px_3px_0px_#FFFDF7] hover-scale-bounce">
              <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#18181B] dark:text-[#18181B]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-[#18181B] dark:text-[#FFFDF7] font-space">
                Top 5 Menu Terlaris
              </h3>
              <p className="text-[10px] sm:text-xs font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50 font-dm-sans">
                Kuantitas penjualan tertinggi (Semua Waktu)
              </p>
            </div>
          </div>
          <div className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50 py-6 sm:py-10 font-dm-sans">
                <span className="h-3 w-3 sm:h-4 sm:w-4 animate-spin rounded-full border-2 border-[#7F1D1D] dark:border-[#C9A227] border-t-transparent" />
                <span className="hidden xs:inline">Memuat data dari server...</span>
                <span className="xs:hidden">Memuat...</span>
              </div>
            ) : topMenus.length === 0 ? (
              <div className="text-center py-6 sm:py-10">
                <p className="text-xs sm:text-sm font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50 font-dm-sans">
                  Belum ada data menu terjual.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 sm:space-y-2">
                {topMenus.slice(0, 5).map((menu, index) => {
                  const menuRevenue = toSafeNumber(menu?.revenue);
                  const menuSold = toSafeNumber(menu?.sold);
                  return (
                    <div key={menu?.id || `${menu?.name || 'menu'}-${index}`} className="flex items-center justify-between border-2 border-[#18181B]/20 dark:border-[#2D3440]/40 p-2 sm:p-3 hover:border-[#C9A227]/50 dark:hover:border-[#C9A227]/30 transition-all duration-200 hover-scale-bounce table-row-hover-animated">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <span className={`flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center border-2 border-[#18181B] dark:border-[#FFFDF7] text-[10px] sm:text-xs font-black shadow-[2px_2px_0px_#18181B] dark:shadow-[2px_2px_0px_#FFFDF7] ${rankColors[index]}`}>
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-black text-[#18181B] dark:text-[#FFFDF7] truncate font-space">
                            {menu?.name || 'Menu'}
                          </p>
                          <p className="text-[10px] sm:text-xs font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50 font-dm-sans">
                            {menu?.category || 'Kategori'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2 sm:ml-3">
                        <p className="text-xs sm:text-sm font-black text-[#18181B] dark:text-[#FFFDF7] font-jetbrains">
                          {menuSold} Qty
                        </p>
                        <p className="text-[10px] sm:text-xs font-bold text-[#7F1D1D] dark:text-[#C9A227] font-jetbrains">
                          Rp {menuRevenue.toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </NeoCard>
      </div>

      {/* Grafik Penjualan - Responsive */}
      <NeoCard className="p-3 sm:p-5 animate-fade-in-up-delay-4 corner-accent-animated">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center border-2 border-[#18181B] dark:border-[#FFFDF7] bg-[#C9A227] dark:bg-[#D8B13D] shadow-[2px_2px_0px_#18181B] sm:shadow-[3px_3px_0px_#18181B] dark:shadow-[2px_2px_0px_#FFFDF7] sm:dark:shadow-[3px_3px_0px_#FFFDF7] hover-scale-bounce">
              <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#18181B] dark:text-[#18181B]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-[#18181B] dark:text-[#FFFDF7] font-space">
                Grafik Penjualan
              </h3>
              <p className="text-[10px] sm:text-xs font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50 font-dm-sans">
                Tren omzet berdasarkan periode
              </p>
            </div>
          </div>
          <div className="flex gap-1 border-2 border-[#18181B] dark:border-[#FFFDF7] p-0.5 sm:p-1">
            {periodOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSalesPeriod(opt.value)}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-black transition-all duration-200 font-dm-sans ${
                  salesPeriod === opt.value
                    ? 'bg-[#7F1D1D] dark:bg-[#8B3A3A] text-[#FFFDF7] dark:text-[#FFFDF7] border-2 border-[#18181B] dark:border-[#FFFDF7] shadow-[2px_2px_0px_#18181B] sm:shadow-[3px_3px_0px_#18181B] dark:shadow-[2px_2px_0px_#FFFDF7] sm:dark:shadow-[3px_3px_0px_#FFFDF7]'
                    : 'bg-[#FFFDF7] dark:bg-[#18181B] text-[#18181B] dark:text-[#FFFDF7] hover:bg-[#C9A227]/20 dark:hover:bg-[#C9A227]/20'
                } hover-scale-bounce`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="h-[200px] sm:h-[260px] md:h-[300px] w-full mt-1 sm:mt-2 overflow-hidden">
          {isSalesTrendLoading ? (
            <div className="w-full h-full flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50 font-dm-sans">
              <span className="h-3 w-3 sm:h-4 sm:w-4 animate-spin rounded-full border-2 border-[#7F1D1D] dark:border-[#C9A227] border-t-transparent" />
              <span className="hidden xs:inline">Memuat data dari server...</span>
              <span className="xs:hidden">Memuat...</span>
            </div>
          ) : salesTrendData.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-xs sm:text-sm font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50 font-dm-sans">
              Belum ada data tren penjualan.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesTrendData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7D9B8" strokeOpacity={0.3} className="dark:stroke-[#2D3440] dark:stroke-opacity-30" />
                <XAxis 
                  dataKey="name" 
                  stroke="#18181B" 
                  className="dark:stroke-[#B0B8C8]" 
                  fontSize={9} 
                  tickLine={false} 
                  axisLine={false} 
                  tickMargin={6} 
                  tick={{ fill: '#18181B', fontWeight: 600, fontSize: 9, fontFamily: 'JetBrains Mono' }} 
                />
                <YAxis 
                  stroke="#18181B" 
                  className="dark:stroke-[#B0B8C8]" 
                  fontSize={9} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `Rp${value / 1000}k`} 
                  tickMargin={6} 
                  tick={{ fill: '#18181B', fontWeight: 600, fontSize: 9, fontFamily: 'JetBrains Mono' }} 
                />
                <Tooltip
                  cursor={{ stroke: '#18181B', strokeWidth: 1, strokeDasharray: '4 4' }}
                  contentStyle={{ 
                    background: '#FFFDF7', 
                    border: '3px solid #18181B', 
                    borderRadius: '0px', 
                    boxShadow: '4px_4px_0px_#18181B', 
                    color: '#18181B', 
                    fontSize: '11px', 
                    fontFamily: 'DM Sans', 
                    padding: '8px 12px' 
                  }}
                  labelStyle={{ color: '#18181B', fontWeight: 900, fontSize: '11px', fontFamily: 'Space Grotesk' }}
                  itemStyle={{ color: '#18181B', fontWeight: 700, fontFamily: 'DM Sans' }}
                  formatter={(value) => [`Rp ${toSafeNumber(value).toLocaleString('id-ID')}`, 'Pendapatan']}
                />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#7F1D1D" 
                  strokeWidth={2.5} 
                  dot={{ r: 3, strokeWidth: 2, stroke: '#7F1D1D', fill: '#FFFDF7' }} 
                  activeDot={{ r: 5, fill: '#7F1D1D' }} 
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </NeoCard>
    </div>
  );
}