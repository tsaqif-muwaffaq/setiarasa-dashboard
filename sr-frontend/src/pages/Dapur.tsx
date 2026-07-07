import { useEffect, useState } from 'react';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';
import { ChefHat, Clock, CheckCircle2, Utensils, Flame, Wifi, Bell, BellOff } from 'lucide-react';

// ── Komponen Neubrutalism ──
function NeoCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`border-4 border-[#18181B] bg-[#FFFDF7] shadow-[6px_6px_0px_#18181B] dark:border-[#FFFDF7] dark:bg-[#18181B] dark:shadow-[6px_6px_0px_#FFFDF7] card-lift-premium ${className}`}>
      {children}
    </div>
  );
}

function NeoBadge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center border-2 border-[#18181B] px-2 py-0.5 text-[10px] font-black shadow-[2px_2px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[2px_2px_0px_#FFFDF7] ${className}`}>
      {children}
    </span>
  );
}

interface OrderItem {
  id: string;
  quantity: number;
  menu?: {
    name?: string;
  };
}

interface Order {
  id: string;
  customerName: string;
  tableNumber: string;
  status:
    | 'PENDING_PAYMENT'
    | 'PAID'
    | 'COOKING'
    | 'READY'
    | 'COMPLETED'
    | 'FAILED'
    | 'EXPIRED'
    | 'CANCELLED';
  createdAt: string;
  items: OrderItem[];
}

function useElapsedMinutes(dateString: string) {
  const timestamp = new Date(dateString).getTime();
  if (!Number.isFinite(timestamp)) return 0;
  const diff = Math.floor((Date.now() - timestamp) / 60000);
  return diff;
}

function ElapsedBadge({ createdAt }: { createdAt: string }) {
  const mins = useElapsedMinutes(createdAt);
  const isLate = mins >= 10;
  return (
    <span
      className={`border-2 px-2 py-0.5 text-[11px] font-black shadow-[2px_2px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[2px_2px_0px_#FFFDF7] ${isLate ? 'border-[#7F1D1D] bg-[#7F1D1D]/10 text-[#7F1D1D]' : 'border-[#18181B] bg-[#FFFDF7] text-[#18181B] dark:border-[#FFFDF7] dark:bg-[#18181B] dark:text-[#FFFDF7]'}`}
    >
      {mins < 1 ? 'Baru' : `${mins} mnt`}
    </span>
  );
}

function OrderCard({
  order,
  variant,
  onAction,
  isPending,
  index,
}: {
  order: Order;
  variant: 'pending' | 'cooking';
  onAction: () => void;
  isPending: boolean;
  index: number;
}) {
  const isPendingVariant = variant === 'pending';
  const orderItems = Array.isArray(order.items) ? order.items : [];

  return (
    <NeoCard className={`p-3 animate-fade-in-up-delay-${(index % 4) + 1}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="font-black text-sm text-[#18181B] dark:text-[#FFFDF7] truncate">
            {order.tableNumber ? `Meja ${order.tableNumber}` : '🛍 Bawa Pulang'}
          </p>
          <p className="text-xs font-bold text-[#18181B]/70 dark:text-[#FFFDF7]/70 truncate mt-0.5">{order.customerName || 'Pelanggan'}</p>
        </div>
        <ElapsedBadge createdAt={order.createdAt || new Date().toISOString()} />
      </div>

      <ul className="space-y-0.5 mb-3">
        {orderItems.map((item, itemIndex) => (
          <li key={item.id || `${order.id}-${itemIndex}`} className="flex items-baseline gap-2 text-sm">
            <span className={`font-black text-xs w-6 text-right ${isPendingVariant ? 'text-[#C9A227]' : 'text-[#065F46]'}`}>
              {item.quantity ?? 0}×
            </span>
            <span className="font-bold text-[#18181B] dark:text-[#FFFDF7]">{item.menu?.name ?? 'Menu'}</span>
          </li>
        ))}
      </ul>

      <button
        className={`w-full border-4 border-[#18181B] font-black py-2 text-xs shadow-[4px_4px_0px_#18181B] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#18181B] active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0px_#18181B] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 dark:border-[#FFFDF7] dark:shadow-[4px_4px_0px_#FFFDF7] dark:hover:shadow-[6px_6px_0px_#FFFDF7] card-lift-premium ${isPendingVariant ? 'bg-[#C9A227] text-[#18181B]' : 'bg-[#065F46] text-[#FFFDF7]'}`}
        onClick={onAction}
        disabled={isPending}
      >
        {isPendingVariant ? (
          <>
            <Utensils className="w-3 h-3 inline mr-1.5" />
            Mulai Masak
          </>
        ) : (
          <>
            <CheckCircle2 className="w-3 h-3 inline mr-1.5" />
            Selesai & Sajikan
          </>
        )}
      </button>
    </NeoCard>
  );
}

export default function Dapur() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  // ── State: Notifikasi Suara ──
  const [audio] = useState(() => {
    if (typeof window !== 'undefined') {
      return new Audio('/notif-dapur.mp3');
    }
    return null;
  });

  const playNotif = () => {
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
  };

  // ── State: Toggle Suara ──
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('sr_notification_sound') !== 'false';
  });

  // ── State: Jumlah Pesanan Sebelumnya ──
  const [prevOrderCount, setPrevOrderCount] = useState(0);

  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` },
  };

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ['activeOrders'],
    queryFn: async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/orders/active`, axiosConfig);
        return Array.isArray(res.data?.data) ? res.data.data : [];
      } catch (error) {
        console.error('Gagal memuat pesanan aktif dapur:', error);
        return [];
      }
    },
    refetchInterval: 5000,
  });

  // ── Deteksi Pesanan Baru ──
  const safeOrders = Array.isArray(orders)
    ? orders.filter((order): order is Order => Boolean(order && typeof order === 'object'))
    : [];
  const pendingOrders = safeOrders.filter((o) => o?.status === 'PAID');
  const cookingOrders = safeOrders.filter((o) => o?.status === 'COOKING');

  useEffect(() => {
    if (pendingOrders.length > prevOrderCount) {
      const isSoundEnabled = localStorage.getItem('sr_notification_sound') !== 'false';
      if (isSoundEnabled) {
        playNotif();
        const newOrder = pendingOrders[pendingOrders.length - 1];
        toast.info(`🔔 Pesanan baru dari ${newOrder?.customerName || 'Pelanggan'}!`, {
          duration: 4000,
          icon: '🍳',
        });
      }
    }
    setPrevOrderCount(pendingOrders.length);
  }, [pendingOrders.length]);

  // ── Toggle Suara ──
  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    localStorage.setItem('sr_notification_sound', String(newState));
    if (newState) toast.success('🔊 Suara notifikasi diaktifkan');
    else toast.success('🔇 Suara notifikasi dimatikan');
  };

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await axios.patch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/orders/${id}/status`, { status }, axiosConfig);
    },
    onSuccess: (_, variables) => {
      if (variables.status === 'COOKING') toast.info('🔪 Pesanan mulai dimasak!');
      if (variables.status === 'COMPLETED') toast.success('✅ Pesanan selesai dan siap disajikan!');
      queryClient.invalidateQueries({ queryKey: ['activeOrders'] });
    },
    onError: () => {
      toast.error('Gagal memperbarui status pesanan');
    },
  });

  return (
    <div className="flex flex-col gap-5 h-[calc(100dvh-5rem)] overflow-hidden bg-[#FFFDF7] dark:bg-[#18181B]">

      {/* Header dengan tombol toggle suara */}
      <div className="flex items-center justify-between shrink-0 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center border-2 border-[#18181B] shadow-[3px_3px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[3px_3px_0px_#FFFDF7] ${pendingOrders.length > 0 ? 'bg-[#C9A227] animate-pulse' : 'bg-[#7F1D1D]'} hover-scale-bounce`}>
            <ChefHat className={`h-5 w-5 ${pendingOrders.length > 0 ? 'text-[#18181B]' : 'text-[#FFFDF7]'}`} />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-[#18181B] dark:text-[#FFFDF7]">
              Kitchen Display
              {pendingOrders.length > 0 && (
                <span className="ml-2 text-xs font-black text-[#C9A227] animate-pulse">
                  ● {pendingOrders.length} Pesanan Baru!
                </span>
              )}
            </h1>
            <p className="text-xs font-bold text-[#18181B]/70 dark:text-[#FFFDF7]/70 mt-0.5">Setia Rasa · Dapur</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleSound}
            className="border-2 border-[#18181B] p-1.5 shadow-[2px_2px_0px_#18181B] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#18181B] active:translate-x-1 active:translate-y-1 active:shadow-[1px_1px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[2px_2px_0px_#FFFDF7] dark:hover:shadow-[4px_4px_0px_#FFFDF7] hover-scale-bounce"
            title={soundEnabled ? 'Matikan suara' : 'Aktifkan suara'}
          >
            {soundEnabled ? (
              <Bell className="w-4 h-4 text-[#065F46] dark:text-[#34D399]" />
            ) : (
              <BellOff className="w-4 h-4 text-[#7F1D1D] dark:text-[#7F1D1D]" />
            )}
          </button>

          <NeoBadge className={`border-[#065F46] text-[#065F46] dark:border-[#34D399] dark:text-[#34D399] ${pendingOrders.length > 0 ? 'animate-pulse-soft-premium' : ''}`}>
            <Wifi className="w-3 h-3 mr-1" />
            Live
          </NeoBadge>
        </div>
      </div>

      {/* Stat strip dengan animasi jika ada pesanan baru */}
      <div className="grid grid-cols-2 gap-3 shrink-0">
        <div className={`border-2 px-4 py-3 shadow-[4px_4px_0px_#18181B] flex items-center gap-3 transition-all duration-300 animate-fade-in-up-delay-1 ${pendingOrders.length > 0 ? 'border-[#C9A227] bg-[#C9A227]/20 dark:border-[#C9A227] dark:shadow-[4px_4px_0px_#FFFDF7]' : 'border-[#C9A227] bg-[#C9A227]/10 dark:border-[#C9A227] dark:shadow-[4px_4px_0px_#FFFDF7]'}`}>
          <Clock className={`w-4 h-4 shrink-0 ${pendingOrders.length > 0 ? 'text-[#7F1D1D] dark:text-[#FFFDF7]' : 'text-[#C9A227]'}`} />
          <div>
            <p className={`text-2xl font-black leading-none ${pendingOrders.length > 0 ? 'text-[#7F1D1D] dark:text-[#FFFDF7]' : 'text-[#18181B] dark:text-[#C9A227]'}`}>
              {pendingOrders.length}
            </p>
            <p className="text-[11px] font-bold text-[#18181B]/70 dark:text-[#FFFDF7]/70 mt-0.5 uppercase tracking-wide">Menunggu</p>
          </div>
        </div>
        <div className="border-2 border-[#065F46] bg-[#065F46]/10 px-4 py-3 shadow-[4px_4px_0px_#18181B] dark:border-[#34D399] dark:shadow-[4px_4px_0px_#FFFDF7] flex items-center gap-3 animate-fade-in-up-delay-2">
          <Flame className="w-4 h-4 text-[#065F46] shrink-0 dark:text-[#34D399]" />
          <div>
            <p className="text-2xl font-black text-[#065F46] dark:text-[#34D399] leading-none">
              {cookingOrders.length}
            </p>
            <p className="text-[11px] font-bold text-[#18181B]/70 dark:text-[#FFFDF7]/70 mt-0.5 uppercase tracking-wide">Dimasak</p>
          </div>
        </div>
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">

        {/* Kolom Pending */}
        <div className="flex flex-col min-h-0 animate-fade-in-up-delay-3">
          <div className="flex items-center gap-2 mb-3 shrink-0">
            <span className={`w-2 h-2 border-2 shadow-[2px_2px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[2px_2px_0px_#FFFDF7] ${pendingOrders.length > 0 ? 'border-[#7F1D1D] bg-[#7F1D1D] animate-pulse' : 'border-[#C9A227] bg-[#C9A227]'}`} />
            <h2 className="text-xs font-black uppercase tracking-wider text-[#18181B]/70 dark:text-[#FFFDF7]/70">
              Menunggu Masak
            </h2>
            <span className={`ml-auto text-xs font-black border-2 px-2 py-0.5 shadow-[2px_2px_0px_#18181B] dark:shadow-[2px_2px_0px_#FFFDF7] ${pendingOrders.length > 0 ? 'border-[#7F1D1D] text-[#7F1D1D] animate-pulse' : 'border-[#C9A227] text-[#C9A227] dark:border-[#C9A227]'}`}>
              {pendingOrders.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-0.5">
            {isLoading && (
              <p className="text-center text-sm font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50 py-10 flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-[#7F1D1D] border-t-transparent rounded-full animate-spin dark:border-[#C9A227] dark:border-t-transparent" />
                Memuat data...
              </p>
            )}
            {pendingOrders.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center py-16 border-4 border-dashed border-[#C9A227]/30 text-center">
                <Clock className="w-7 h-7 text-[#C9A227]/40 mb-2 animate-float-premium" />
                <p className="text-sm font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50">Belum ada pesanan baru</p>
              </div>
            )}
            {pendingOrders.map((order, index) => (
              <OrderCard
                key={order.id}
                order={order}
                variant="pending"
                onAction={() => updateStatusMutation.mutate({ id: order.id, status: 'COOKING' })}
                isPending={updateStatusMutation.isPending}
                index={index}
              />
            ))}
          </div>
        </div>

        {/* Kolom Cooking */}
        <div className="flex flex-col min-h-0 animate-fade-in-up-delay-4">
          <div className="flex items-center gap-2 mb-3 shrink-0">
            <span className="w-2 h-2 border-2 border-[#065F46] bg-[#065F46] animate-pulse shadow-[2px_2px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[2px_2px_0px_#FFFDF7]" />
            <h2 className="text-xs font-black uppercase tracking-wider text-[#18181B]/70 dark:text-[#FFFDF7]/70">
              Sedang Dimasak
            </h2>
            <span className="ml-auto text-xs font-black text-[#065F46] border-2 border-[#065F46] px-2 py-0.5 shadow-[2px_2px_0px_#18181B] dark:border-[#34D399] dark:shadow-[2px_2px_0px_#FFFDF7]">
              {cookingOrders.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-0.5">
            {cookingOrders.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center py-16 border-4 border-dashed border-[#065F46]/30 text-center">
                <Flame className="w-7 h-7 text-[#065F46]/40 mb-2 animate-float-premium-1" />
                <p className="text-sm font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50">Tidak ada yang sedang dimasak</p>
              </div>
            )}
            {cookingOrders.map((order, index) => (
              <OrderCard
                key={order.id}
                order={order}
                variant="cooking"
                onAction={() => updateStatusMutation.mutate({ id: order.id, status: 'COMPLETED' })}
                isPending={updateStatusMutation.isPending}
                index={index}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
