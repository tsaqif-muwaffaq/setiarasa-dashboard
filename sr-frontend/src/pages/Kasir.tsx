import { useMemo, useState, useEffect } from 'react';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Store,
  ShoppingBag,
  UtensilsCrossed,
  X,
  ChevronUp,
  Check,
  Banknote,
  QrCode,
  Clock,
} from 'lucide-react';

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
      className={`border-2 border-[#18181B] bg-[#FFFDF7] px-3 py-2 text-sm font-bold text-[#18181B] outline-none transition-all focus:shadow-[4px_4px_0px_#7F1D1D] focus:border-[#7F1D1D] dark:border-[#FFFDF7] dark:bg-[#18181B] dark:text-[#FFFDF7] dark:focus:shadow-[4px_4px_0px_#C9A227] dark:focus:border-[#C9A227] placeholder:text-[#18181B]/40 dark:placeholder:text-[#FFFDF7]/40 ${className}`}
      {...props}
    />
  );
}

function NeoBadge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center border-2 border-[#18181B] px-2 py-0.5 text-[10px] font-black shadow-[2px_2px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[2px_2px_0px_#FFFDF7] ${className}`}>
      {children}
    </span>
  );
}

// --- Tipe Data ---
interface Menu {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  imageUrl: string;
}

interface CartItem {
  menuId: string;
  name: string;
  price: number;
  quantity: number;
}

interface CheckoutPayload {
  customerName: string;
  tableNumber: string | null;
  paymentMethod: 'CASH' | 'QRIS';
  items: {
    menuId: string;
    quantity: number;
    price: number;
  }[];
}

interface IncomingOrderItem {
  id: string;
  quantity: number;
  price: number;
  menu: { name: string };
}

type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'COOKING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED';

interface IncomingOrder {
  id: string;
  customerName: string;
  tableNumber: string | null;
  orderType: string;
  status: OrderStatus;
  paymentMethod: 'CASH' | 'QRIS' | string;
  totalAmount: number;
  createdAt: string;
  items: IncomingOrderItem[];
}

const ACTIONABLE_STATUSES: OrderStatus[] = ['PENDING_PAYMENT', 'PAID'];

export default function Kasir() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  // ── State: Notifikasi Suara ──
  const [audio] = useState(() => {
    if (typeof window !== 'undefined') {
      return new Audio('/notif-kasir.mp3');
    }
    return null;
  });

  const playNotif = () => {
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
  };

  // ── State: POS ──
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [orderType, setOrderType] = useState<'dine-in' | 'takeaway'>('dine-in');
  const [menuSearchTerm, setMenuSearchTerm] = useState('');
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<'CASH' | 'MIDTRANS'>('CASH');

  // ── State: Tab ──
  const [activeTab, setActiveTab] = useState<'pos' | 'incoming'>('pos');
  const [incomingSearch, setIncomingSearch] = useState('');
  const [prevOrderCount, setPrevOrderCount] = useState(0);

  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` },
  };

  // ============================================================
  // QUERIES
  // ============================================================

  const { data: menus, isLoading } = useQuery<Menu[]>({
    queryKey: ['menus'],
    queryFn: async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/menu`, axiosConfig);
        return Array.isArray(res.data?.data) ? res.data.data : [];
      } catch (error) {
        console.error('Gagal memuat menu kasir:', error);
        return [];
      } finally {
        // React Query clears isLoading when this async query settles.
      }
    },
  });

  const { data: incomingOrders, isLoading: isLoadingIncoming } = useQuery<IncomingOrder[]>({
    queryKey: ['pendingActionOrders'],
    queryFn: async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/orders/pending-actions`, axiosConfig);
        return Array.isArray(res.data?.data) ? res.data.data : [];
      } catch (error) {
        console.error('Gagal memuat pesanan masuk:', error);
        return [];
      } finally {
        // React Query clears isLoading when this async query settles.
      }
    },
    refetchInterval: 15000,
  });

  const normalizedMenuSearch = menuSearchTerm.trim().toLowerCase();
  const filteredMenus = useMemo(() => {
    if (!Array.isArray(menus)) return [];
    if (!normalizedMenuSearch) return menus;
    return menus.filter((menu) => menu.name.toLowerCase().includes(normalizedMenuSearch));
  }, [menus, normalizedMenuSearch]);

  const actionableOrders = useMemo(() => {
    if (!Array.isArray(incomingOrders)) return [];
    return incomingOrders.filter((o) => ACTIONABLE_STATUSES.includes(o.status));
  }, [incomingOrders]);

  useEffect(() => {
    if (actionableOrders.length > prevOrderCount) {
      playNotif();
    }
    setPrevOrderCount(actionableOrders.length);
  }, [actionableOrders.length]);

  const normalizedIncomingSearch = incomingSearch.trim().toLowerCase();
  const filteredIncomingOrders = useMemo(() => {
    if (!normalizedIncomingSearch) return actionableOrders;
    return actionableOrders.filter(
      (o) =>
        o.customerName?.toLowerCase().includes(normalizedIncomingSearch) ||
        o.id.toLowerCase().includes(normalizedIncomingSearch)
    );
  }, [actionableOrders, normalizedIncomingSearch]);

  // ============================================================
  // MUTATIONS
  // ============================================================

  const checkoutMutation = useMutation({
    mutationFn: async (payload: CheckoutPayload) => {
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/orders`, payload, axiosConfig);
      return res.data;
    },
    onSuccess: async (data, variables) => {
      const order = data.data;

      try {
        if (variables.paymentMethod === 'CASH') {
          toast.success('✅ Pembayaran Tunai berhasil!');

          handlePrintReceipt({
            id: order.id,
            customerName: order.customerName,
            tableNumber: order.tableNumber,
            totalAmount: order.totalAmount,
            items: variables.items?.map((vItem) => {
              const originalCartItem = cart.find((c) => c.menuId === vItem.menuId);
              return { ...vItem, name: originalCartItem ? originalCartItem.name : 'Menu' };
            }) ?? [],
          });

          setCart([]);
          setCustomerName('');
          setTableNumber('');
          setOrderType('dine-in');
          setPaymentType('CASH');
          setCartDrawerOpen(false);
          queryClient.invalidateQueries({ queryKey: ['menus'] });
          return;
        }

        const payRes = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/payments/create`,
          {
            orderId: order.id,
            amount: order.totalAmount,
            customerName: order.customerName,
          },
          axiosConfig
        );

        const { token: snapToken } = payRes.data;

        setCart([]);
        setCustomerName('');
        setTableNumber('');
        setOrderType('dine-in');
        setPaymentType('CASH');
        setCartDrawerOpen(false);
        queryClient.invalidateQueries({ queryKey: ['menus'] });

        // @ts-ignore
        window.snap.pay(snapToken, {
          onSuccess: () => toast.success('✅ Pembayaran berhasil!'),
          onPending: () => toast.info('⏳ Menunggu pembayaran...'),
          onError: () => toast.error('❌ Pembayaran gagal.'),
          onClose: () => toast.warning('⚠️ Pop-up ditutup sebelum bayar.'),
        });
      } catch (err) {
        console.error(err);
        toast.error('Pesanan tercatat, tapi gagal membuka halaman pembayaran.');
      }
    },
    onError: (error: unknown) => {
      const message = axios.isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message
        : undefined;
      toast.error(message || 'Gagal memproses pesanan.');
    },
  });

  const confirmCashMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await axios.patch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/orders/${orderId}/confirm-cash`,
        {},
        axiosConfig
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success('✅ Pembayaran tunai dikonfirmasi!');
      queryClient.invalidateQueries({ queryKey: ['pendingActionOrders'] });
    },
    onError: () => toast.error('❌ Gagal mengonfirmasi pembayaran.'),
  });

  const acceptOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await axios.patch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/orders/${orderId}/status`,
        { status: 'COOKING' },
        axiosConfig
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success('✅ Pesanan diterima, masuk ke dapur!');
      queryClient.invalidateQueries({ queryKey: ['pendingActionOrders'] });
    },
    onError: () => toast.error('❌ Gagal menerima pesanan.'),
  });

  // ============================================================
  // HANDLERS
  // ============================================================

  const addToCart = (menu: Menu) => {
    if (menu.stock <= 0) {
      toast.error('Stok menu ini habis!');
      return;
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.menuId === menu.id);
      if (existing) {
        if (existing.quantity >= menu.stock) {
          toast.error(`Stok maksimal ${menu.name} adalah ${menu.stock}`);
          return prev;
        }
        return prev?.map((item) =>
          item.menuId === menu.id ? { ...item, quantity: item.quantity + 1 } : item
        ) ?? prev;
      }
      return [...prev, { menuId: menu.id, name: menu.name, price: menu.price, quantity: 1 }];
    });
  };

  const removeFromCart = (menuId: string) => {
    setCart((prev) => prev.filter((item) => item.menuId !== menuId));
  };

  const updateQuantity = (menuId: string, delta: number) => {
    setCart((prev) =>
      prev?.map((item) => {
        if (item.menuId === menuId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : item;
        }
        return item;
      }) ?? prev
    );
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Keranjang masih kosong!');
      return;
    }
    if (orderType === 'dine-in' && !tableNumber) {
      toast.error('Nomor meja wajib diisi untuk makan di tempat!');
      return;
    }
    const payload: CheckoutPayload = {
      customerName: customerName || 'Pelanggan Umum',
      tableNumber: orderType === 'takeaway' ? null : tableNumber,
      paymentMethod: paymentType === 'CASH' ? 'CASH' : 'QRIS',
      items: cart?.map((item) => ({
        menuId: item.menuId,
        quantity: item.quantity,
        price: item.price,
      })) ?? [],
    };
    checkoutMutation.mutate(payload);
  };

  // ============================================================
  // CETAK STRUK (Neubrutalism style)
  // ============================================================

  const handlePrintReceipt = (orderData: any) => {
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    if (!printWindow) return;

    const receiptItems = Array.isArray(orderData?.items) ? orderData.items : [];
    const itemsHtml = receiptItems
      ?.map(
        (item: any) => `
    <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 3px;">
      <span>${item.quantity}x ${item.name || item.menu?.name}</span>
      <span>Rp ${(item.price * item.quantity).toLocaleString('id-ID')}</span>
    </div>
  `
      )
      .join('');

    const isDineIn = orderData.orderType === 'DINE_IN';
    const orderTypeHtml = orderData.tableNumber
      ? `<div style="font-size: 12px;">Meja : ${orderData.tableNumber}</div>`
      : `<div style="font-size: 12px; font-weight: bold;">Tipe : ${isDineIn ? 'Makan di Tempat' : 'Bawa Pulang'}</div>`;

    printWindow.document.write(`
    <html>
      <head>
        <title>Struk # ${orderData.id.slice(0, 8)}</title>
        <style>
          @page { size: auto; margin: 0mm; }
          body { 
            font-family: 'Courier New', Courier, monospace; 
            padding: 15px; 
            color: #000; 
            background: #fff; 
            width: 260px; 
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .line { border-top: 2px solid #000; margin: 8px 0; }
          .logo-struk { width: 65px; height: 65px; object-fit: contain; margin-bottom: 5px; }
        </style>
      </head>
      <body>
        <div class="center">
          <img src="${window.location.origin}/logo.png" alt="Logo Setia Rasa" class="logo-struk" />
          
          <h2 style="margin: 2px 0 0 0; font-size: 18px; font-weight: bold;">RM SETIA RASA</h2>
          
          <p style="font-size: 10px; margin: 4px 0; line-height: 1.3;">
            Perum. Taman Batu Aji Indah 2, Blok N No. 28<br>
            Jl. Brigjen Katamso, Sagulung Kota<br>
            Kec. Sagulung, Kota Batam<br>
            Kepulauan Riau 29444
          </p>
        </div>
        
        <div class="line"></div>
        <div style="font-size: 12px; margin-bottom: 3px;">Tgl  : ${new Date().toLocaleString('id-ID')}</div>
        <div style="font-size: 12px; margin-bottom: 3px;">Pel  : ${orderData.customerName || 'Pelanggan'}</div>
        
        ${orderTypeHtml}
        
        <div class="line"></div>
        ${itemsHtml}
        <div class="line"></div>
        
        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 14px;">
          <span>TOTAL:</span>
          <span>Rp ${orderData.totalAmount?.toLocaleString('id-ID')}</span>
        </div>
        
        <div class="line"></div>
        <div class="center" style="font-size: 11px; margin-top: 15px;">
          Terima Kasih Atas Kunjungan Anda!<br>"Setia Karena Rasa"
        </div>
        <script>
          window.onload = function() { 
            setTimeout(() => { window.print(); window.close(); }, 500); 
          }
        </script>
      </body>
    </html>
  `);
    printWindow.document.close();
  };

// ── Panel: KERANJANG (POS) ──
const CartPanel = () => (
  <div className="flex flex-col h-full min-h-0 overflow-hidden bg-[#FFFDF7] dark:bg-[#18181B]">
    {/* Header Keranjang - tetap sama */}
    <div className="border-b-4 border-[#18181B] bg-[#7F1D1D] px-4 py-3 flex items-center justify-between shrink-0 dark:border-[#FFFDF7]">
      <div className="flex items-center gap-2">
        <ShoppingCart className="w-4 h-4 text-[#FFFDF7]" />
        <h2 className="text-base font-black text-[#FFFDF7]">Keranjang</h2>
      </div>
      <div className="flex items-center gap-2">
        {totalItems > 0 && (
          <NeoBadge className="border-[#18181B] bg-[#C9A227] text-[#18181B] shadow-[2px_2px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[2px_2px_0px_#FFFDF7]">
            {totalItems} item
          </NeoBadge>
        )}
        <button
          className="lg:hidden border-2 border-[#FFFDF7] p-1 transition-all hover:bg-[#FFFDF7]/20 dark:border-[#FFFDF7]"
          onClick={() => setCartDrawerOpen(false)}
        >
          <X className="w-4 h-4 text-[#FFFDF7]" />
        </button>
      </div>
    </div>

    {/* Order Type & Form - tetap sama */}
    <div className="border-b-4 border-[#18181B] p-4 space-y-3 bg-[#E7D9B8] dark:border-[#FFFDF7] dark:bg-[#18181B] shrink-0">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setOrderType('dine-in')}
          className={`border-2 border-[#18181B] py-2 text-sm font-black shadow-[3px_3px_0px_#18181B] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#18181B] active:translate-x-1 active:translate-y-1 active:shadow-[1px_1px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[3px_3px_0px_#FFFDF7] dark:hover:shadow-[5px_5px_0px_#FFFDF7] ${
            orderType === 'dine-in'
              ? 'bg-[#7F1D1D] text-[#FFFDF7]'
              : 'bg-[#FFFDF7] text-[#18181B] dark:bg-[#18181B] dark:text-[#FFFDF7]'
          } hover-scale-bounce`}
        >
          <Store className="w-4 h-4 inline mr-1" />
          Di Tempat
        </button>
        <button
          type="button"
          onClick={() => {
            setOrderType('takeaway');
            setTableNumber('');
          }}
          className={`border-2 border-[#18181B] py-2 text-sm font-black shadow-[3px_3px_0px_#18181B] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#18181B] active:translate-x-1 active:translate-y-1 active:shadow-[1px_1px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[3px_3px_0px_#FFFDF7] dark:hover:shadow-[5px_5px_0px_#FFFDF7] ${
            orderType === 'takeaway'
              ? 'bg-[#7F1D1D] text-[#FFFDF7]'
              : 'bg-[#FFFDF7] text-[#18181B] dark:bg-[#18181B] dark:text-[#FFFDF7]'
          } hover-scale-bounce`}
        >
          <ShoppingBag className="w-4 h-4 inline mr-1" />
          Bungkus
        </button>
      </div>

      <div className="space-y-1 animate-slide-left-1">
        <label className="text-xs font-black uppercase tracking-wider text-[#18181B] dark:text-[#FFFDF7]">
          Nama Pelanggan <span className="font-normal normal-case">(Opsional)</span>
        </label>
        <NeoInput
          placeholder="Contoh: Budi"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className="w-full"
        />
      </div>

      {orderType === 'dine-in' && (
        <div className="space-y-1 animate-in fade-in zoom-in-95 duration-200">
          <label className="text-xs font-black uppercase tracking-wider text-[#18181B] dark:text-[#FFFDF7]">
            Nomor Meja <span className="text-[#7F1D1D]">*</span>
          </label>
          <NeoInput
            placeholder="Contoh: Meja 5"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            className="w-full"
          />
        </div>
      )}
    </div>

    {/* Cart Items - MODIFIED: Tombol hapus selalu terlihat */}
    <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-1">
      {cart.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center gap-3 opacity-50">
          <ShoppingCart className="w-10 h-10 text-[#18181B]/50 dark:text-[#FFFDF7]/50" />
          <p className="text-sm font-black text-[#18181B]/50 dark:text-[#FFFDF7]/50">Keranjang masih kosong</p>
          <p className="text-xs font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50 text-center">Pilih menu di sebelah kiri</p>
        </div>
      ) : (
        cart?.map((item) => (
          <div
            key={item.menuId}
            className="flex items-center gap-3 border-2 border-[#18181B]/20 p-2 hover:bg-[#C9A227]/10 dark:border-[#FFFDF7]/10 dark:hover:bg-[#C9A227]/20 transition-colors card-hover-frame"
          >
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-black text-[#18181B] dark:text-[#FFFDF7] line-clamp-1">{item.name}</h4>
              <p className="text-xs font-bold text-[#18181B]/70 dark:text-[#FFFDF7]/70">
                Rp {item.price.toLocaleString('id-ID')}
              </p>
            </div>

            <div className="flex items-center gap-1 border-2 border-[#18181B] p-0.5 shadow-[2px_2px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[2px_2px_0px_#FFFDF7]">
              <button
                className="w-6 h-6 flex items-center justify-center hover:bg-[#C9A227]/20 transition-colors"
                onClick={() => updateQuantity(item.menuId, -1)}
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="text-sm font-black w-5 text-center text-[#18181B] dark:text-[#FFFDF7]">{item.quantity}</span>
              <button
                className="w-6 h-6 flex items-center justify-center hover:bg-[#C9A227]/20 transition-colors"
                onClick={() => updateQuantity(item.menuId, 1)}
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            <span className="text-xs font-black text-[#18181B] dark:text-[#FFFDF7] w-16 text-right shrink-0">
              Rp {(item.price * item.quantity).toLocaleString('id-ID')}
            </span>

            {/* Tombol Hapus - Sekarang selalu terlihat dengan background dan border yang jelas */}
            <button
              className="w-8 h-8 border-2 border-[#7F1D1D] bg-[#7F1D1D]/10 flex items-center justify-center transition-all hover:bg-[#7F1D1D] hover:text-[#FFFDF7] dark:border-[#C9A227] dark:bg-[#7F1D1D]/30 dark:hover:bg-[#7F1D1D] shrink-0 hover:scale-110 active:scale-95"
              onClick={() => removeFromCart(item.menuId)}
              title="Hapus item dari keranjang"
            >
              <Trash2 className="w-4 h-4 text-[#7F1D1D] dark:text-[#FFFDF7] hover:text-[#FFFDF7]" />
            </button>
          </div>
        ))
      )}
    </div>

    {/* Footer - Payment & Total - tetap sama */}
    <div className="border-t-4 border-[#18181B] p-4 space-y-3 bg-[#E7D9B8] dark:border-[#FFFDF7] dark:bg-[#18181B] shrink-0">
      <div>
        <label className="text-xs font-black uppercase tracking-wider text-[#18181B] dark:text-[#FFFDF7] block mb-2">
          Metode Pembayaran
        </label>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setPaymentType('CASH')}
            className={`border-2 border-[#18181B] py-2.5 px-3 text-sm font-black flex items-center justify-center gap-1.5 transition-all shadow-[3px_3px_0px_#18181B] active:scale-95 dark:border-[#FFFDF7] dark:shadow-[3px_3px_0px_#FFFDF7] hover-scale-bounce ${
              paymentType === 'CASH'
                ? 'bg-[#065F46] text-[#FFFDF7] shadow-[3px_3px_0px_#18181B] dark:shadow-[3px_3px_0px_#FFFDF7]'
                : 'bg-[#FFFDF7] text-[#18181B] hover:bg-[#065F46]/10 dark:bg-[#18181B] dark:text-[#FFFDF7] dark:hover:bg-[#065F46]/20'
            }`}
          >
            {paymentType === 'CASH' && <Check className="w-4 h-4" />}
            <Banknote className="w-4 h-4" />
            <span>Tunai</span>
          </button>
          <button
            type="button"
            onClick={() => setPaymentType('MIDTRANS')}
            className={`border-2 border-[#18181B] py-2.5 px-3 text-sm font-black flex items-center justify-center gap-1.5 transition-all shadow-[3px_3px_0px_#18181B] active:scale-95 dark:border-[#FFFDF7] dark:shadow-[3px_3px_0px_#FFFDF7] hover-scale-bounce ${
              paymentType === 'MIDTRANS'
                ? 'bg-[#7F1D1D] text-[#FFFDF7] shadow-[3px_3px_0px_#18181B] dark:shadow-[3px_3px_0px_#FFFDF7]'
                : 'bg-[#FFFDF7] text-[#18181B] hover:bg-[#7F1D1D]/10 dark:bg-[#18181B] dark:text-[#FFFDF7] dark:hover:bg-[#7F1D1D]/20'
            }`}
          >
            {paymentType === 'MIDTRANS' && <Check className="w-4 h-4" />}
            <QrCode className="w-4 h-4" />
            <span>QRIS</span>
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-sm font-bold text-[#18181B]/70 dark:text-[#FFFDF7]/70">Total Tagihan</span>
        <span className="text-xl font-black text-[#7F1D1D] dark:text-[#C9A227]">
          Rp {totalAmount.toLocaleString('id-ID')}
        </span>
      </div>

      <button
        className="w-full border-4 border-[#18181B] bg-[#7F1D1D] text-[#FFFDF7] font-black py-3 shadow-[6px_6px_0px_#18181B] transition-all hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[10px_10px_0px_#18181B] active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0px_#18181B] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 dark:border-[#FFFDF7] dark:shadow-[6px_6px_0px_#FFFDF7] dark:hover:shadow-[10px_10px_0px_#FFFDF7] text-base card-lift-premium"
        onClick={handleCheckout}
        disabled={cart.length === 0 || checkoutMutation.isPending}
      >
        {checkoutMutation.isPending ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-[#FFFDF7] border-t-transparent rounded-full animate-spin" />
            Memproses...
          </span>
        ) : (
          'Proses Pembayaran'
        )}
      </button>
    </div>
  </div>
);

  // ============================================================
  // PANEL: PESANAN MASUK
  // ============================================================

  const IncomingOrdersPanel = () => (
    <div className="flex flex-col h-full min-h-0 bg-[#FFFDF7] dark:bg-[#18181B]">
      <div className="border-b-4 border-[#18181B] bg-[#7F1D1D] px-4 py-3 flex items-center justify-between shrink-0 dark:border-[#FFFDF7]">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#FFFDF7]" />
          <h2 className="text-base font-black text-[#FFFDF7]">Pesanan Masuk</h2>
        </div>
        <NeoBadge className="border-[#18181B] bg-[#C9A227] text-[#18181B] shadow-[2px_2px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[2px_2px_0px_#FFFDF7] animate-pulse-soft-premium">
          {actionableOrders.length}
        </NeoBadge>
      </div>

      <div className="border-b-2 border-[#18181B] p-3 bg-[#E7D9B8] dark:border-[#FFFDF7] dark:bg-[#18181B] shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#18181B]/50 dark:text-[#FFFDF7]/50" />
          <NeoInput
            placeholder="Cari nama / ID pesanan..."
            className="pl-9 w-full"
            value={incomingSearch}
            onChange={(e) => setIncomingSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
        {isLoadingIncoming ? (
          <div className="text-center text-sm font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50 py-10 flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-[#7F1D1D] border-t-transparent rounded-full animate-spin dark:border-[#C9A227] dark:border-t-transparent" />
            Memuat data dari server...
          </div>
        ) : filteredIncomingOrders?.length === 0 ? (
          <div className="text-center text-sm font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50 py-10">
            Belum ada pesanan.
          </div>
        ) : (
          filteredIncomingOrders?.map((order, index) => (
            <NeoCard 
              key={order.id} 
              className={`p-4 animate-fade-in-up-delay-${(index % 4) + 1}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-black text-sm text-[#18181B] dark:text-[#FFFDF7]">{order.customerName}</p>
                  <p className="text-xs font-mono font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50">{order.id.slice(0, 8)}...</p>
                </div>
                <span
                  className={`border-2 px-2 py-0.5 text-[11px] font-black shadow-[2px_2px_0px_#18181B] dark:shadow-[2px_2px_0px_#FFFDF7] ${
                    order.status === 'PAID'
                      ? 'border-[#065F46] bg-[#065F46]/10 text-[#065F46] dark:border-[#34D399] dark:bg-[#065F46]/30 dark:text-[#34D399]'
                      : 'border-[#7F1D1D] bg-[#7F1D1D]/10 text-[#7F1D1D] dark:border-[#C9A227] dark:bg-[#7F1D1D]/30 dark:text-[#FFFDF7]'
                  } animate-pulse-soft-premium`}
                >
                  {order.status === 'PAID' ? 'Sudah Dibayar' : 'Menunggu Pembayaran'}
                </span>
              </div>

              <div className="text-xs font-bold text-[#18181B]/70 dark:text-[#FFFDF7]/70 mb-2">
                {order.items?.map((i) => `${i.quantity}x ${i.menu?.name ?? 'Menu'}`).join(', ') || 'Belum ada item'}
              </div>

              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black border-2 border-[#18181B] px-2 py-0.5 shadow-[2px_2px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[2px_2px_0px_#FFFDF7]">
                  {order.paymentMethod === 'CASH' ? 'Tunai' : 'QRIS/Online'}
                </span>
                <span className="font-black text-[#7F1D1D] dark:text-[#C9A227]">
                  Rp {order.totalAmount.toLocaleString('id-ID')}
                </span>
              </div>

              {order.status === 'PENDING_PAYMENT' && order.paymentMethod === 'CASH' && (
                <button
                  className="w-full border-4 border-[#18181B] bg-[#065F46] text-[#FFFDF7] font-black py-2 shadow-[6px_6px_0px_#18181B] transition-all hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[10px_10px_0px_#18181B] active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0px_#18181B] disabled:opacity-50 dark:border-[#FFFDF7] dark:shadow-[6px_6px_0px_#FFFDF7] dark:hover:shadow-[10px_10px_0px_#FFFDF7] card-lift-premium"
                  onClick={() => confirmCashMutation.mutate(order.id)}
                  disabled={confirmCashMutation.isPending}
                >
                  <Banknote className="w-4 h-4 inline mr-1.5" />
                  Konfirmasi Pembayaran
                </button>
              )}

              {order.status === 'PENDING_PAYMENT' && order.paymentMethod !== 'CASH' && (
                <div className="text-xs text-center font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50 italic py-1">
                  Menunggu konfirmasi otomatis dari Midtrans...
                </div>
              )}

              {order.status === 'PAID' && (
                <button
                  className="w-full border-4 border-[#18181B] bg-[#7F1D1D] text-[#FFFDF7] font-black py-2 shadow-[6px_6px_0px_#18181B] transition-all hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[10px_10px_0px_#18181B] active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0px_#18181B] disabled:opacity-50 dark:border-[#FFFDF7] dark:shadow-[6px_6px_0px_#FFFDF7] dark:hover:shadow-[10px_10px_0px_#FFFDF7] card-lift-premium"
                  onClick={() => acceptOrderMutation.mutate(order.id)}
                  disabled={acceptOrderMutation.isPending}
                >
                  <Check className="w-4 h-4 inline mr-1.5" />
                  Terima Pesanan
                </button>
              )}
            </NeoCard>
          ))
        )}
      </div>
    </div>
  );

  // ============================================================
  // RENDER UTAMA
  // ============================================================

  return (
    <div className="bg-[#FFFDF7] dark:bg-[#18181B] min-h-screen">

      {/* ── Tab Switcher ── */}
      <div className="flex gap-2 mb-4 p-1 border-4 border-[#18181B] bg-[#FFFDF7] shadow-[6px_6px_0px_#18181B] dark:border-[#FFFDF7] dark:bg-[#18181B] dark:shadow-[6px_6px_0px_#FFFDF7] w-fit animate-fade-in-up">
        <button
          onClick={() => setActiveTab('pos')}
          className={`px-4 py-2 text-sm font-black transition-all hover-scale-bounce ${
            activeTab === 'pos'
              ? 'bg-[#7F1D1D] text-[#FFFDF7] border-2 border-[#18181B] shadow-[3px_3px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[3px_3px_0px_#FFFDF7]'
              : 'text-[#18181B] dark:text-[#FFFDF7] hover:bg-[#C9A227]/20'
          }`}
        >
          Buat Pesanan
        </button>
        <button
          onClick={() => setActiveTab('incoming')}
          className={`px-4 py-2 text-sm font-black transition-all relative hover-scale-bounce ${
            activeTab === 'incoming'
              ? 'bg-[#7F1D1D] text-[#FFFDF7] border-2 border-[#18181B] shadow-[3px_3px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[3px_3px_0px_#FFFDF7]'
              : 'text-[#18181B] dark:text-[#FFFDF7] hover:bg-[#C9A227]/20'
          }`}
        >
          Pesanan Masuk
          {actionableOrders.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 border-2 border-[#18181B] bg-[#7F1D1D] text-[#FFFDF7] text-[10px] font-black flex items-center justify-center shadow-[3px_3px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[3px_3px_0px_#FFFDF7] animate-pulse-soft-premium">
              {actionableOrders.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'incoming' ? (
        <NeoCard className="h-[calc(100vh-12rem)] overflow-hidden animate-fade-in-up">
          <IncomingOrdersPanel />
        </NeoCard>
      ) : (
        <>
          {/* ── Layout utama POS ── */}
          <div className="flex flex-col lg:flex-row gap-5 lg:h-[calc(100vh-8rem)]">

            {/* ───── Sisi Kiri: Daftar Menu ───── */}
            <div className="w-full lg:flex-1 flex flex-col h-[calc(100dvh-10rem)] lg:h-auto">
              <NeoCard className="flex flex-col h-full overflow-hidden animate-fade-in-up">
                <div className="border-b-4 border-[#18181B] bg-[#7F1D1D] px-4 py-3 flex items-center justify-between shrink-0 dark:border-[#FFFDF7]">
                  <div className="flex items-center gap-2">
                    <UtensilsCrossed className="w-4 h-4 text-[#FFFDF7]" />
                    <h2 className="text-base font-black text-[#FFFDF7]">Daftar Menu</h2>
                  </div>
                  {menus && (
                    <span className="text-xs font-black border-2 border-[#18181B] bg-[#FFFDF7] px-2 py-0.5 shadow-[2px_2px_0px_#18181B] text-[#18181B] dark:border-[#FFFDF7] dark:bg-[#18181B] dark:text-[#FFFDF7] dark:shadow-[2px_2px_0px_#FFFDF7]">
                      {normalizedMenuSearch ? `${filteredMenus.length} / ${menus.length}` : menus.length} item
                    </span>
                  )}
                </div>

                <div className="border-b-2 border-[#18181B] p-3 bg-[#E7D9B8] dark:border-[#FFFDF7] dark:bg-[#18181B] shrink-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#18181B]/50 dark:text-[#FFFDF7]/50" />
                    <NeoInput
                      placeholder="Cari menu..."
                      className="pl-9 w-full"
                      value={menuSearchTerm}
                      onChange={(e) => setMenuSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  {isLoading ? (
                    <div className="h-full flex items-center justify-center text-sm font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50">
                      <span className="w-4 h-4 border-2 border-[#7F1D1D] border-t-transparent rounded-full animate-spin mr-2 dark:border-[#C9A227] dark:border-t-transparent" />
                      Memuat data dari server...
                    </div>
                  ) : !menus?.length ? (
                    <div className="h-full flex items-center justify-center text-sm font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50">
                      Belum ada menu tersedia.
                    </div>
                  ) : filteredMenus?.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center gap-2 text-sm font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50">
                      <Search className="w-8 h-8 text-[#C9A227]/70" />
                      <p>Menu tidak ditemukan</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {filteredMenus?.map((menu, index) => (
                        <div
                          key={menu.id}
                          className={`border-4 border-[#18181B] bg-[#FFFDF7] shadow-[4px_4px_0px_#18181B] transition-all hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[8px_8px_0px_#18181B] dark:border-[#FFFDF7] dark:bg-[#18181B] dark:shadow-[4px_4px_0px_#FFFDF7] dark:hover:shadow-[8px_8px_0px_#FFFDF7] animate-fade-in-up-delay-${(index % 4) + 1} ${
                            menu.stock <= 0 ? 'opacity-55 cursor-not-allowed' : 'cursor-pointer hover-scale-bounce'
                          }`}
                          onClick={() => menu.stock > 0 && addToCart(menu)}
                        >
                          {menu.stock <= 0 && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#18181B]/60 backdrop-blur-[2px]">
                              <div className="border-4 border-[#18181B] bg-[#7F1D1D] text-[#FFFDF7] px-3 py-1 font-black text-xs tracking-widest shadow-[4px_4px_0px_#18181B] -rotate-12 dark:border-[#FFFDF7] dark:shadow-[4px_4px_0px_#FFFDF7]">
                                HABIS
                              </div>
                            </div>
                          )}

                          <div className="p-2 relative">
                            <div className="aspect-square overflow-hidden mb-2 bg-[#E7D9B8] border-2 border-[#18181B] dark:border-[#FFFDF7]">
                              <img
                                src={menu.imageUrl}
                                alt={menu.name}
                                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                              />
                            </div>

                            <p className="text-[10px] font-black uppercase tracking-wider text-[#18181B]/50 dark:text-[#FFFDF7]/50 mb-0.5">
                              {menu.category}
                            </p>

                            <h3 className="font-black text-sm leading-tight line-clamp-1 text-[#18181B] dark:text-[#FFFDF7]">
                              {menu.name}
                            </h3>

                            <div className="flex justify-between items-center mt-2 pt-2 border-t-2 border-[#18181B]/20 dark:border-[#FFFDF7]/20">
                              <p className="text-[#7F1D1D] dark:text-[#C9A227] font-black text-sm">
                                Rp {menu.price.toLocaleString('id-ID')}
                              </p>
                              <span className={`text-[10px] font-black px-1.5 py-0.5 border-2 shadow-[2px_2px_0px_#18181B] dark:shadow-[2px_2px_0px_#FFFDF7] ${
                                menu.stock <= 10
                                  ? 'border-[#C9A227] bg-[#C9A227]/20 text-[#18181B] dark:border-[#C9A227] dark:bg-[#C9A227]/20 dark:text-[#C9A227]'
                                  : 'border-[#065F46] bg-[#065F46]/10 text-[#065F46] dark:border-[#34D399] dark:bg-[#065F46]/30 dark:text-[#34D399]'
                              }`}>
                                Sisa {menu.stock}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </NeoCard>
            </div>

            {/* ───── Sisi Kanan: Keranjang — DESKTOP ONLY ───── */}
            <div className="hidden lg:flex w-[420px] flex-col min-h-0 shrink-0 animate-slide-right">
              <CartPanel />
            </div>
          </div>

          {/* ───── MOBILE: Floating Cart Bar ───── */}
          <div className="lg:hidden">
            {cartDrawerOpen && (
              <div
                className="fixed inset-0 z-40 bg-[#18181B]/60 backdrop-blur-sm animate-fade-in-up"
                onClick={() => setCartDrawerOpen(false)}
              />
            )}

            <div
              className={`fixed inset-x-0 bottom-0 z-50 border-4 border-[#18181B] bg-[#FFFDF7] shadow-[-8px_0_0px_#18181B] transition-transform duration-300 ease-in-out flex flex-col dark:border-[#FFFDF7] dark:bg-[#18181B] dark:shadow-[-8px_0_0px_#FFFDF7] ${
                cartDrawerOpen ? 'translate-y-0' : 'translate-y-full'
              }`}
              style={{ height: '85dvh' }}
            >
              <CartPanel />
            </div>

            {!cartDrawerOpen && (
              <div className="fixed inset-x-0 bottom-0 z-30 px-4 pb-4 pt-2 bg-gradient-to-t from-[#FFFDF7] to-transparent dark:from-[#18181B]">
                <button
                  onClick={() => setCartDrawerOpen(true)}
                  className="w-full flex items-center justify-between border-4 border-[#18181B] bg-[#7F1D1D] text-[#FFFDF7] px-5 py-3.5 shadow-[8px_8px_0px_#18181B] transition-all hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[12px_12px_0px_#18181B] active:translate-x-1 active:translate-y-1 active:shadow-[4px_4px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[8px_8px_0px_#FFFDF7] dark:hover:shadow-[12px_12px_0px_#FFFDF7] card-lift-premium animate-fade-in-up"
                >
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    <span className="font-black text-sm">Lihat Keranjang</span>
                    {totalItems > 0 && (
                      <span className="border-2 border-[#18181B] bg-[#C9A227] text-[#18181B] text-xs font-black px-2 py-0.5 shadow-[2px_2px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[2px_2px_0px_#FFFDF7] animate-pulse-soft-premium">
                        {totalItems}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm">
                      Rp {totalAmount.toLocaleString('id-ID')}
                    </span>
                    <ChevronUp className="w-4 h-4 opacity-70" />
                  </div>
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
