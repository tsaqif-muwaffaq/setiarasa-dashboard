import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';
import { DollarSign, ShoppingBag, Receipt, TrendingUp, CreditCard, Wallet, QrCode, Banknote, ChefHat } from 'lucide-react';
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

const toSafeNumber = (value: unknown) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

// ── Komponen Neubrutalism ──
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
  const token = useAuthStore((state) => state.token);

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/orders/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = res.data?.data;
        if (!data || typeof data !== 'object') return emptyDashboardStats;
        return {
          ...data,
          totalRevenue: data.totalRevenue ?? 0,
          orderCount: data.orderCount ?? 0,
          paymentBreakdown: data.paymentBreakdown ?? emptyPaymentBreakdown,
          weeklyRevenue: Array.isArray(data.weeklyRevenue) ? data.weeklyRevenue : [],
          topMenus: Array.isArray(data.topMenus) ? data.topMenus : [],
        };
      } catch (error) {
        console.error('Gagal memuat statistik dashboard:', error);
        return emptyDashboardStats;
      } finally {
        // React Query clears isLoading when this async query settles.
      }
    },
    refetchInterval: 10000,
  });

  const [salesPeriod, setSalesPeriod] = useState<SalesPeriod>('daily');

  const { data: salesTrend, isLoading: isSalesTrendLoading } = useQuery<WeeklyRevenue[]>({
    queryKey: ['salesTrend', salesPeriod],
    queryFn: async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/orders/sales-trend`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { period: salesPeriod },
        });
        return Array.isArray(res.data?.data) ? res.data.data : [];
      } catch (error) {
        console.error('Gagal memuat tren penjualan:', error);
        return [];
      } finally {
        // React Query clears isLoading when this async query settles.
      }
    },
    refetchInterval: 10000,
  });

  const totalRevenue = toSafeNumber(stats?.totalRevenue);
  const orderCount = toSafeNumber(stats?.orderCount);
  const averageOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

  const weeklyData = Array.isArray(stats?.weeklyRevenue) ? stats.weeklyRevenue : [];
  const topMenus = Array.isArray(stats?.topMenus) ? stats.topMenus : [];
  const breakdown = stats?.paymentBreakdown || emptyPaymentBreakdown;

  const salesTrendData = Array.isArray(salesTrend) ? salesTrend : [];

  const periodOptions: { value: SalesPeriod; label: string }[] = [
    { value: 'daily', label: 'Hari ini' },
    { value: 'weekly', label: 'Mingguan' },
    { value: 'monthly', label: 'Bulanan' },
  ];

  const metricCards = [
    {
      title: 'Total Omzet',
      value: isLoading ? '...' : `Rp ${totalRevenue.toLocaleString('id-ID')}`,
      sub: 'Semua transaksi lunas',
      icon: DollarSign,
      color: '#7F1D1D',
    },
    {
      title: 'Total Pesanan',
      value: isLoading ? '...' : orderCount,
      sub: 'Kuantitas pesanan lunas',
      icon: ShoppingBag,
      color: '#065F46',
    },
    {
      title: 'Rata-rata Transaksi',
      value: isLoading ? '...' : `Rp ${averageOrderValue.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`,
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

  return (
    <div className="space-y-6 pb-10 bg-[#FFFDF7] dark:bg-[#18181B]">

      {/* ===== HEADER ===== */}
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
          <NeoBadge className="border-[#065F46] text-[#065F46] dark:border-[#34D399] dark:text-[#34D399] animate-pulse-soft">
            <span className="w-2 h-2 rounded-full bg-[#065F46] dark:bg-[#34D399] mr-2 inline-block animate-pulse" />
            Live Monitor Aktif
          </NeoBadge>
        </div>
      </NeoCard>

      {/* ===== METRIC CARDS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards?.map(({ title, value, sub, icon: Icon }, index) => (
          <div 
            key={title} 
            className={`animate-fade-in-up-delay-${(index % 4) + 1}`}
          >
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

      {/* ===== PAYMENT BREAKDOWN ===== */}
      <div className="animate-fade-in-up-delay-3">
        <p className="text-xs font-black uppercase tracking-wider text-[#18181B]/50 dark:text-[#FFFDF7]/50 mb-3 px-1">
          📊 Rincian Kas Masuk
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {paymentMethods?.map(({ label, key, icon: Icon }) => (
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

      {/* ===== CHARTS ROW ===== */}
      <div className="grid grid-cols-1 xl:grid-cols-7 gap-6">

        {/* ===== BAR CHART ===== */}
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
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: 30, bottom: 0 }}>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    vertical={false} 
                    stroke="#E7D9B8" 
                    strokeOpacity={0.3} 
                    className="dark:stroke-[#FFFDF7]/20"
                  />
                  <XAxis 
                    dataKey="name" 
                    stroke="#18181B"
                    className="dark:stroke-[#FFFDF7]"
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                    tickMargin={8}
                    tick={{ 
                      fill: '#18181B',
                      fontWeight: 600,
                      fontSize: 11,
                    }}
                  />
                  <YAxis 
                    stroke="#18181B"
                    className="dark:stroke-[#FFFDF7]"
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `Rp${value / 1000}k`}
                    tickMargin={8}
                    tick={{ 
                      fill: '#18181B',
                      fontWeight: 600,
                      fontSize: 11,
                    }}
                  />
                  <Tooltip
                    cursor={{ 
                      fill: '#E7D9B8', 
                      fillOpacity: 0.2,
                      className: 'dark:fill-[#FFFDF7]/10'
                    }}
                    contentStyle={{ 
                      background: '#FFFDF7',
                      border: '3px solid #18181B',
                      borderRadius: '0px',
                      boxShadow: '6px 6px 0px #18181B',
                      color: '#18181B',
                      fontSize: '13px',
                      fontFamily: 'inherit',
                      padding: '12px 16px',
                    }}
                    labelStyle={{
                      color: '#18181B',
                      fontWeight: 900,
                      fontSize: '13px',
                    }}
                    itemStyle={{
                      color: '#18181B',
                      fontWeight: 700,
                    }}
                    formatter={(value) => [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Pendapatan']}
                  />
                  <Bar 
                    dataKey="total" 
                    fill="#7F1D1D" 
                    radius={[4, 4, 0, 0]} 
                    maxBarSize={44}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </NeoCard>

        {/* ===== TOP 5 MENU ===== */}
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
                Kuantitas penjualan tertinggi
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
                {topMenus.map((menu, index) => {
                  const menuRevenue = toSafeNumber(menu?.revenue);
                  const menuSold = toSafeNumber(menu?.sold);

                  return (
                    <div 
                      key={menu?.id || `${menu?.name || 'menu'}-${index}`} 
                      className="flex items-center justify-between border-2 border-[#18181B]/20 p-3 dark:border-[#FFFDF7]/10 hover:border-[#C9A227]/50 dark:hover:border-[#C9A227]/30 transition-all duration-200 hover-scale-bounce"
                    >
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

      {/* ===== SALES TREND LINE CHART ===== */}
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
            {periodOptions?.map((opt) => (
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
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesTrendData} margin={{ top: 10, right: 20, left: 30, bottom: 0 }}>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  vertical={false} 
                  stroke="#E7D9B8" 
                  strokeOpacity={0.3}
                  className="dark:stroke-[#FFFDF7]/20"
                />
                <XAxis 
                  dataKey="name" 
                  stroke="#18181B"
                  className="dark:stroke-[#FFFDF7]"
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                  tickMargin={8}
                  tick={{ 
                    fill: '#18181B',
                    fontWeight: 600,
                    fontSize: 11,
                  }}
                />
                <YAxis 
                  stroke="#18181B"
                  className="dark:stroke-[#FFFDF7]"
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `Rp${value / 1000}k`}
                  tickMargin={8}
                  tick={{ 
                    fill: '#18181B',
                    fontWeight: 600,
                    fontSize: 11,
                  }}
                />
                <Tooltip
                  cursor={{ 
                    stroke: '#18181B', 
                    strokeWidth: 1, 
                    strokeDasharray: '4 4',
                    className: 'dark:stroke-[#FFFDF7]'
                  }}
                  contentStyle={{ 
                    background: '#FFFDF7',
                    border: '3px solid #18181B',
                    borderRadius: '0px',
                    boxShadow: '6px 6px 0px #18181B',
                    color: '#18181B',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    padding: '12px 16px',
                  }}
                  labelStyle={{
                    color: '#18181B',
                    fontWeight: 900,
                    fontSize: '13px',
                  }}
                  itemStyle={{
                    color: '#18181B',
                    fontWeight: 700,
                  }}
                  formatter={(value) => [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Pendapatan']}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#7F1D1D"
                  strokeWidth={3}
                  dot={{ 
                    r: 4, 
                    strokeWidth: 2, 
                    stroke: '#7F1D1D', 
                    fill: '#FFFDF7',
                  }}
                  activeDot={{ r: 6, fill: '#7F1D1D' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </NeoCard>

    </div>
  );
}
