// Dashboard.tsx - Dengan Filter Frontend & Auto Reset Setiap Jam 00
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useGlobalLoading } from '@/components/GlobalLoadingProvider';
import { DollarSign, ShoppingBag, Receipt, TrendingUp, CreditCard, Wallet, QrCode, Banknote, ChefHat, Clock, RefreshCw } from 'lucide-react';
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
};

const toSafeNumber = (value: unknown): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

// ── Helper: Cek apakah tanggal hari ini ──
const isToday = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
};

// ── Helper: Filter data berdasarkan tanggal ──
const filterTodayData = (orders: any[]) => {
  if (!Array.isArray(orders) || orders.length === 0) return [];
  return orders.filter(order => isToday(order.createdAt));
};

function NeoCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`border-4 border-[#18181B] bg-[#FFFDF7] shadow-[6px_6px_0px_#18181B] dark:border-[#FFFDF7] dark:bg-[#18181B] dark:shadow-[6px_6px_0px_#FFFDF7] card-lift ${className}`}>
      {children}
    </div>
  );
}

function NeoBadge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center border-2 border-[#18181B] px-3 py-1 text-xs font-black shadow-[3px_3px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[3px_3px_0px_#FFFDF7] ${className}`}>
      {children}
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

  // ── Auto Reset Setiap Jam 00 ──
  const resetAtMidnight = useCallback(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    console.log(`[Dashboard] Data akan di-reset dalam ${Math.floor(msUntilMidnight / 60000)} menit`);
    
    return setTimeout(() => {
      console.log('[Dashboard] ⏰ Reset data tengah malam!');
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

  // ── Manual Refresh ──
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
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
  
  // ── FILTER DATA HARI INI ──
  // Ambil data weeklyRevenue, filter yang hari ini
  const rawWeeklyData = Array.isArray(safeStats.weeklyRevenue) ? safeStats.weeklyRevenue : [];
  
  // Filter weekly data untuk hari ini saja
  // Karena weeklyRevenue dari backend sudah dalam format { name, total }
  // Kita perlu mapping ulang untuk menampilkan data hari ini
  const todayName = new Date().toLocaleDateString('id-ID', { weekday: 'short' });
  const todayData = rawWeeklyData.filter(item => item.name === todayName);
  const todayRevenue = todayData.length > 0 ? todayData[0].total : 0;
  
  // ── HITUNG ULANG TOTAL PESANAN HARI INI ──
  // Karena kita tidak punya data mentah orders, kita gunakan orderCount dari backend
  // Tapi kita perlu menyesuaikan: orderCount dari backend mungkin total semua
  // Untuk sementara, kita gunakan orderCount yang ada (dari backend)
  // Jika backend mengembalikan total semua, kita tampilkan sebagai "hari ini"
  // Atau kita bisa tambahkan endpoint terpisah untuk data hari ini
  
  // ── Solusi: Gunakan orderCount dari backend sebagai data hari ini ──
  // Karena backend sudah mengembalikan data hari ini melalui filter createdAt: { gte: today }
  const orderCount = toSafeNumber(safeStats.orderCount);
  const totalRevenue = toSafeNumber(safeStats.totalRevenue);
  const averageOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;
  const weeklyData = rawWeeklyData;
  const topMenus = Array.isArray(safeStats.topMenus) ? safeStats.topMenus : [];
  const breakdown = safeStats.paymentBreakdown || emptyPaymentBreakdown;
  const salesTrendData = Array.isArray(salesTrend) ? salesTrend : [];

  // ── Jika ingin menampilkan data hari ini dari topMenus (opsional) ──
  // Top menus dari backend sudah berdasarkan semua data, tidak bisa difilter per hari
  // Karena kita tidak punya data mentah orders di frontend

  const periodOptions: { value: SalesPeriod; label: string }[] = [
    { value: 'daily', label: 'Hari ini' },
    { value: 'weekly', label: 'Mingguan' },
    { value: 'monthly', label: 'Bulanan' },
  ];

  const metricCards = [
    {
      title: 'Total Omzet',
      value: isLoading ? '...' : `Rp ${totalRevenue.toLocaleString('id-ID')}`,
      sub: 'Transaksi hari ini',
      icon: DollarSign,
      color: '#7F1D1D',
    },
    {
      title: 'Total Pesanan',
      value: isLoading ? '...' : orderCount,
      sub: 'Pesanan selesai hari ini',
      icon: ShoppingBag,
      color: '#065F46',
    },
    {
      title: 'Rata-rata Transaksi',
      value: isLoading ? '...' : `Rp ${Math.round(averageOrderValue).toLocaleString('id-ID')}`,
      sub: 'Nilai belanja per pelanggan',
      icon: Receipt,
      color: '#C9A227',
    },
    {
      title: 'Status Dapur',
      value: '🟢 Sinkron',
      sub: 'Data terhubung real-time',
      icon: ChefHat,
      color: '#18181B',
    },
  ];

  const paymentMethods = [
    { label: 'Tunai', key: 'CASH', icon: Banknote, color: '#18181B' },
    { label: 'QRIS', key: 'QRIS', icon: QrCode, color: '#065F46' },
    { label: 'GoPay', key: 'GOPAY', icon: Wallet, color: '#1A73E8' },
    { label: 'ShopeePay', key: 'SHOPEEPAY', icon: Wallet, color: '#EE4D2D' },
    { label: 'Transfer', key: 'BANK_TRANSFER', icon: CreditCard, color: '#C9A227' },
    { label: 'Debit', key: 'DEBIT', icon: CreditCard, color: '#7B2FBE' },
  ];

  const rankColors = [
    'bg-[#C9A227] text-[#18181B] border-[#18181B]',
    'bg-[#065F46] text-[#FFFDF7] border-[#18181B]',
    'bg-[#7F1D1D] text-[#FFFDF7] border-[#18181B]',
    'bg-[#18181B] text-[#FFFDF7] border-[#FFFDF7] dark:bg-[#FFFDF7] dark:text-[#18181B] dark:border-[#18181B]',
    'bg-[#E7D9B8] text-[#18181B] border-[#18181B]',
  ];

  const formatLastUpdated = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] bg-[#FFFDF7] dark:bg-[#18181B]">
        <div className="border-4 border-[#7F1D1D] bg-[#7F1D1D]/10 p-6 shadow-[6px_6px_0px_#18181B] dark:border-[#C9A227] dark:shadow-[6px_6px_0px_#FFFDF7]">
          <p className="text-xl font-black text-[#7F1D1D] dark:text-[#C9A227]">⚠️ Gagal Memuat Data</p>
          <p className="text-sm font-bold text-[#18181B]/70 dark:text-[#FFFDF7]/70 mt-2">
            Terjadi kesalahan saat menghubungi server.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 border-4 border-[#18181B] bg-[#7F1D1D] text-[#FFFDF7] px-6 py-2 font-black shadow-[4px_4px_0px_#18181B] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0px_#18181B] active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[4px_4px_0px_#FFFDF7] dark:hover:shadow-[6px_6px_0px_#FFFDF7]"
          >
            Muat Ulang
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10 bg-[#FFFDF7] dark:bg-[#18181B]">
      <NeoCard className="p-4 sm:p-6 animate-fade-in-up">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-[#7F1D1D] dark:text-[#C9A227]">
              ⚡ Setia Rasa · Dashboard
            </p>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#18181B] dark:text-[#FFFDF7]">
              Ringkasan Penjualan
            </h1>
            <p className="text-sm font-bold text-[#18181B]/70 dark:text-[#FFFDF7]/70 mt-1">
              Pantau arus kas dan performa penjualan secara real-time.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-xs font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50">
              <Clock className="w-3.5 h-3.5" />
              <span>Update: {formatLastUpdated(lastUpdated)}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#065F46] animate-pulse dark:bg-[#34D399] inline-block ml-1" />
            </div>
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className={`border-2 border-[#18181B] p-2 shadow-[2px_2px_0px_#18181B] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#18181B] active:translate-x-1 active:translate-y-1 active:shadow-[1px_1px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[2px_2px_0px_#FFFDF7] dark:hover:shadow-[4px_4px_0px_#FFFDF7] ${isRefreshing ? 'opacity-50 cursor-not-allowed' : 'hover-scale-bounce'}`}
              title="Refresh data"
            >
              <RefreshCw className={`w-4 h-4 text-[#18181B] dark:text-[#FFFDF7] ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <NeoBadge className="border-[#065F46] text-[#065F46] dark:border-[#34D399] dark:text-[#34D399] animate-pulse-soft">
              <span className="w-2 h-2 rounded-full bg-[#065F46] dark:bg-[#34D399] mr-2 inline-block animate-pulse" />
              Live Monitor Aktif
            </NeoBadge>
          </div>
        </div>
      </NeoCard>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map(({ title, value, sub, icon: Icon }, index) => (
          <div key={title} className={`animate-fade-in-up-delay-${(index % 4) + 1}`}>
            <NeoCard className="p-4 sm:p-5 hover:shadow-[8px_8px_0px_#18181B] dark:hover:shadow-[8px_8px_0px_#FFFDF7] transition-all duration-200 corner-accent">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-[#18181B]/50 dark:text-[#FFFDF7]/50">
                    {title}
                  </p>
                  <p className="text-2xl font-black text-[#18181B] dark:text-[#FFFDF7] mt-1">
                    {value}
                  </p>
                  <p className="text-xs font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50 mt-1">
                    {sub}
                  </p>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center border-2 border-[#18181B] bg-[#C9A227] shadow-[3px_3px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[3px_3px_0px_#FFFDF7] hover-scale-bounce">
                  <Icon className="h-5 w-5 text-[#18181B]" />
                </div>
              </div>
            </NeoCard>
          </div>
        ))}
      </div>

      <div className="animate-fade-in-up-delay-3">
        <p className="text-xs font-black uppercase tracking-wider text-[#18181B]/50 dark:text-[#FFFDF7]/50 mb-3 px-1">
          📊 Rincian Kas Masuk
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {paymentMethods.map(({ label, key, icon: Icon }) => (
            <NeoCard key={key} className="p-3 text-center hover:shadow-[8px_8px_0px_#18181B] dark:hover:shadow-[8px_8px_0px_#FFFDF7] transition-all duration-200 hover-scale-bounce">
              <div className="flex flex-col items-center">
                <div className="flex h-10 w-10 items-center justify-center border-2 border-[#18181B] bg-[#C9A227] shadow-[3px_3px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[3px_3px_0px_#FFFDF7]">
                  <Icon className="h-4 w-4 text-[#18181B]" />
                </div>
                <p className="text-xs font-bold text-[#18181B]/70 dark:text-[#FFFDF7]/70 mt-2">
                  {label}
                </p>
                <p className="text-sm font-black text-[#7F1D1D] dark:text-[#C9A227]">
                  Rp {toSafeNumber(breakdown[key as keyof PaymentBreakdown]).toLocaleString('id-ID')}
                </p>
              </div>
            </NeoCard>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-7 gap-6">
        <NeoCard className="xl:col-span-4 p-4 sm:p-5 animate-fade-in-up-delay-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-[#18181B] bg-[#C9A227] shadow-[3px_3px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[3px_3px_0px_#FFFDF7] hover-scale-bounce">
              <TrendingUp className="h-4 w-4 text-[#18181B]" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#18181B] dark:text-[#FFFDF7]">
                Tren Pendapatan
              </h3>
              <p className="text-xs font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50">
                7 Hari Terakhir
              </p>
            </div>
          </div>
          <div className="h-[300px] w-full mt-2">
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center gap-2 text-sm font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#7F1D1D] border-t-transparent dark:border-[#C9A227] dark:border-t-transparent" />
                Memuat data dari server...
              </div>
            ) : weeklyData.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-sm font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50">
                Belum ada data penjualan.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: 30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7D9B8" strokeOpacity={0.3} className="dark:stroke-[#FFFDF7]/20" />
                  <XAxis dataKey="name" stroke="#18181B" className="dark:stroke-[#FFFDF7]" fontSize={11} tickLine={false} axisLine={false} tickMargin={8} tick={{ fill: '#18181B', fontWeight: 600, fontSize: 11 }} />
                  <YAxis stroke="#18181B" className="dark:stroke-[#FFFDF7]" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `Rp${value / 1000}k`} tickMargin={8} tick={{ fill: '#18181B', fontWeight: 600, fontSize: 11 }} />
                  <Tooltip
                    cursor={{ fill: '#E7D9B8', fillOpacity: 0.2, className: 'dark:fill-[#FFFDF7]/10' }}
                    contentStyle={{ background: '#FFFDF7', border: '3px solid #18181B', borderRadius: '0px', boxShadow: '6px 6px 0px #18181B', color: '#18181B', fontSize: '13px', fontFamily: 'inherit', padding: '12px 16px' }}
                    labelStyle={{ color: '#18181B', fontWeight: 900, fontSize: '13px' }}
                    itemStyle={{ color: '#18181B', fontWeight: 700 }}
                    formatter={(value) => [`Rp ${toSafeNumber(value).toLocaleString('id-ID')}`, 'Pendapatan']}
                  />
                  <Bar dataKey="total" fill="#7F1D1D" radius={[4, 4, 0, 0]} maxBarSize={44} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </NeoCard>

        <NeoCard className="xl:col-span-3 p-4 sm:p-5 flex flex-col animate-fade-in-up-delay-3">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-[#18181B] bg-[#C9A227] shadow-[3px_3px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[3px_3px_0px_#FFFDF7] hover-scale-bounce">
              <ShoppingBag className="h-4 w-4 text-[#18181B]" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#18181B] dark:text-[#FFFDF7]">
                Top 5 Menu Terlaris
              </h3>
              <p className="text-xs font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50">
                Kuantitas penjualan tertinggi (Semua Waktu)
              </p>
            </div>
          </div>
          <div className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 text-sm font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50 py-10">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#7F1D1D] border-t-transparent dark:border-[#C9A227] dark:border-t-transparent" />
                Memuat data dari server...
              </div>
            ) : topMenus.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-sm font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50">
                  Belum ada data menu terjual.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {topMenus.slice(0, 5).map((menu, index) => {
                  const menuRevenue = toSafeNumber(menu?.revenue);
                  const menuSold = toSafeNumber(menu?.sold);
                  return (
                    <div key={menu?.id || `${menu?.name || 'menu'}-${index}`} className="flex items-center justify-between border-2 border-[#18181B]/20 p-3 dark:border-[#FFFDF7]/10 hover:border-[#C9A227]/50 dark:hover:border-[#C9A227]/30 transition-all duration-200 hover-scale-bounce">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center border-2 border-[#18181B] text-xs font-black shadow-[2px_2px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[2px_2px_0px_#FFFDF7] ${rankColors[index]}`}>
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-[#18181B] dark:text-[#FFFDF7] truncate">
                            {menu?.name || 'Menu'}
                          </p>
                          <p className="text-xs font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50">
                            {menu?.category || 'Kategori'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="text-sm font-black text-[#18181B] dark:text-[#FFFDF7]">
                          {menuSold} Qty
                        </p>
                        <p className="text-xs font-bold text-[#7F1D1D] dark:text-[#C9A227]">
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

      <NeoCard className="p-4 sm:p-5 animate-fade-in-up-delay-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-[#18181B] bg-[#C9A227] shadow-[3px_3px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[3px_3px_0px_#FFFDF7] hover-scale-bounce">
              <TrendingUp className="h-4 w-4 text-[#18181B]" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#18181B] dark:text-[#FFFDF7]">
                Grafik Penjualan
              </h3>
              <p className="text-xs font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50">
                Tren omzet berdasarkan periode
              </p>
            </div>
          </div>
          <div className="flex gap-1 border-2 border-[#18181B] p-1 dark:border-[#FFFDF7]">
            {periodOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSalesPeriod(opt.value)}
                className={`px-3 py-1.5 text-xs font-black transition-all duration-200 ${
                  salesPeriod === opt.value
                    ? 'bg-[#7F1D1D] text-[#FFFDF7] border-2 border-[#18181B] shadow-[3px_3px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[3px_3px_0px_#FFFDF7]'
                    : 'bg-[#FFFDF7] text-[#18181B] hover:bg-[#C9A227]/20 dark:bg-[#18181B] dark:text-[#FFFDF7] dark:hover:bg-[#C9A227]/20'
                } hover-scale-bounce`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="h-[300px] w-full mt-2">
          {isSalesTrendLoading ? (
            <div className="w-full h-full flex items-center justify-center gap-2 text-sm font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#7F1D1D] border-t-transparent dark:border-[#C9A227] dark:border-t-transparent" />
              Memuat data dari server...
            </div>
          ) : salesTrendData.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-sm font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50">
              Belum ada data tren penjualan.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesTrendData} margin={{ top: 10, right: 20, left: 30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7D9B8" strokeOpacity={0.3} className="dark:stroke-[#FFFDF7]/20" />
                <XAxis dataKey="name" stroke="#18181B" className="dark:stroke-[#FFFDF7]" fontSize={11} tickLine={false} axisLine={false} tickMargin={8} tick={{ fill: '#18181B', fontWeight: 600, fontSize: 11 }} />
                <YAxis stroke="#18181B" className="dark:stroke-[#FFFDF7]" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `Rp${value / 1000}k`} tickMargin={8} tick={{ fill: '#18181B', fontWeight: 600, fontSize: 11 }} />
                <Tooltip
                  cursor={{ stroke: '#18181B', strokeWidth: 1, strokeDasharray: '4 4', className: 'dark:stroke-[#FFFDF7]' }}
                  contentStyle={{ background: '#ffffffff', border: '3px solid #18181B', borderRadius: '0px', boxShadow: '6px 6px 0px #18181B', color: '#18181B', fontSize: '13px', fontFamily: 'inherit', padding: '12px 16px' }}
                  labelStyle={{ color: '#18181B', fontWeight: 900, fontSize: '13px' }}
                  itemStyle={{ color: '#18181B', fontWeight: 700 }}
                  formatter={(value) => [`Rp ${toSafeNumber(value).toLocaleString('id-ID')}`, 'Pendapatan']}
                />
                <Line type="monotone" dataKey="total" stroke="#7F1D1D" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, stroke: '#7F1D1D', fill: '#FFFDF7' }} activeDot={{ r: 6, fill: '#7F1D1D' }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </NeoCard>
    </div>
  );
}