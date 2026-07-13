// Kasir.tsx - Fully Responsive Mobile Friendly
import { useMemo, useState, useEffect } from 'react';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { useGlobalLoading } from '@/components/GlobalLoadingProvider';
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
  CheckCircle,
  XCircle,
  Info,
  AlertTriangle,
} from 'lucide-react';

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
      className={`w-full border-2 border-[#18181B] bg-[#FFFDF7] px-3 py-2 text-xs sm:text-sm font-bold text-[#18181B] outline-none transition-all focus:shadow-[4px_4px_0px_#7F1D1D] focus:border-[#7F1D1D] dark:border-[#FFFDF7] dark:bg-[#18181B] dark:text-[#FFFDF7] dark:focus:shadow-[4px_4px_0px_#C9A227] dark:focus:border-[#C9A227] placeholder:text-[#18181B]/40 dark:placeholder:text-[#FFFDF7]/40 font-dm-sans ${className}`}
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

// Custom toast dengan icon
const toastSuccess = (message: string) => {
  toast.success(message, {
    icon: <CheckCircle className="w-4 h-4 text-[#065F46]" />,
  });
};

const toastError = (message: string) => {
  toast.error(message, {
    icon: <XCircle className="w-4 h-4 text-[#7F1D1D]" />,
  });
};

const toastInfo = (message: string) => {
  toast.info(message, {
    icon: <Info className="w-4 h-4 text-[#C9A227]" />,
  });
};

const toastWarning = (message: string) => {
  toast.warning(message, {
    icon: <AlertTriangle className="w-4 h-4 text-[#C9A227]" />,
  });
};

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

const toSafeNumber = (value: unknown) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

// CartPanel sebagai component terpisah di luar Kasir
function CartPanel({
  cart,
  customerName,
  tableNumber,
  orderType,
  paymentType,
  totalAmount,
  totalItems,
  cartDrawerOpen,
  checkoutMutation,
  onCustomerNameChange,
  onTableNumberChange,
  onOrderTypeChange,
  onPaymentTypeChange,
  onRemoveFromCart,
  onUpdateQuantity,
  onCheckout,
  onCloseDrawer,
  onOpenDrawer,
}: {
  cart: CartItem[];
  customerName: string;
  tableNumber: string;
  orderType: 'dine-in' | 'takeaway';
  paymentType: 'CASH' | 'MIDTRANS';
  totalAmount: number;
  totalItems: number;
  cartDrawerOpen: boolean;
  checkoutMutation: any;
  onCustomerNameChange: (value: string) => void;
  onTableNumberChange: (value: string) => void;
  onOrderTypeChange: (type: 'dine-in' | 'takeaway') => void;
  onPaymentTypeChange: (type: 'CASH' | 'MIDTRANS') => void;
  onRemoveFromCart: (menuId: string) => void;
  onUpdateQuantity: (menuId: string, delta: number) => void;
  onCheckout: () => void;
  onCloseDrawer: () => void;
  onOpenDrawer: () => void;
}) {
  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden bg-[#FFFDF7] dark:bg-[#18181B]">
      <div className="border-b-4 border-[#18181B] bg-[#7F1D1D] px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between shrink-0 dark:border-[#FFFDF7]">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <ShoppingCart className="w-4 h-4 text-[#FFFDF7]" />
          <h2 className="text-sm sm:text-base font-black text-[#FFFDF7] font-space">Keranjang</h2>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          {totalItems > 0 && (
            <NeoBadge className="border-[#18181B] bg-[#C9A227] text-[#18181B] shadow-[2px_2px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[2px_2px_0px_#FFFDF7] floating-dot">
              {totalItems} item
            </NeoBadge>
          )}
          <button
            className="lg:hidden border-2 border-[#FFFDF7] p-1 transition-all hover:bg-[#FFFDF7]/20 dark:border-[#FFFDF7]"
            onClick={onCloseDrawer}
          >
            <X className="w-4 h-4 text-[#FFFDF7]" />
          </button>
        </div>
      </div>

      <div className="border-b-4 border-[#18181B] p-3 sm:p-4 space-y-2.5 sm:space-y-3 bg-[#E7D9B8] dark:border-[#FFFDF7] dark:bg-[#18181B] shrink-0">
        <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => onOrderTypeChange('dine-in')}
            className={`border-2 border-[#18181B] py-1.5 sm:py-2 text-[11px] sm:text-sm font-black shadow-[2px_2px_0px_#18181B] sm:shadow-[3px_3px_0px_#18181B] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#18181B] sm:hover:shadow-[5px_5px_0px_#18181B] active:translate-x-1 active:translate-y-1 active:shadow-[1px_1px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[2px_2px_0px_#FFFDF7] sm:dark:shadow-[3px_3px_0px_#FFFDF7] dark:hover:shadow-[3px_3px_0px_#FFFDF7] sm:dark:hover:shadow-[5px_5px_0px_#FFFDF7] ${
              orderType === 'dine-in'
                ? 'bg-[#7F1D1D] text-[#FFFDF7]'
                : 'bg-[#FFFDF7] text-[#18181B] dark:bg-[#18181B] dark:text-[#FFFDF7]'
            } hover-scale-bounce font-dm-sans`}
          >
            <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1" />
            <span className="hidden xs:inline">Di Tempat</span>
            <span className="xs:hidden">Dine-in</span>
          </button>
          <button
            type="button"
            onClick={() => onOrderTypeChange('takeaway')}
            className={`border-2 border-[#18181B] py-1.5 sm:py-2 text-[11px] sm:text-sm font-black shadow-[2px_2px_0px_#18181B] sm:shadow-[3px_3px_0px_#18181B] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#18181B] sm:hover:shadow-[5px_5px_0px_#18181B] active:translate-x-1 active:translate-y-1 active:shadow-[1px_1px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[2px_2px_0px_#FFFDF7] sm:dark:shadow-[3px_3px_0px_#FFFDF7] dark:hover:shadow-[3px_3px_0px_#FFFDF7] sm:dark:hover:shadow-[5px_5px_0px_#FFFDF7] ${
              orderType === 'takeaway'
                ? 'bg-[#7F1D1D] text-[#FFFDF7]'
                : 'bg-[#FFFDF7] text-[#18181B] dark:bg-[#18181B] dark:text-[#FFFDF7]'
            } hover-scale-bounce font-dm-sans`}
          >
            <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1" />
            <span className="hidden xs:inline">Bungkus</span>
            <span className="xs:hidden">Takeaway</span>
          </button>
        </div>

        <div className="space-y-1 animate-slide-left-1">
          <label className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#18181B] dark:text-[#FFFDF7] font-jetbrains">
            Nama Pelanggan <span className="font-normal normal-case">(Opsional)</span>
          </label>
          <NeoInput
            placeholder="Contoh: Budi"
            value={customerName}
            onChange={(e) => onCustomerNameChange(e.target.value)}
            className="text-xs sm:text-sm"
          />
        </div>

        {orderType === 'dine-in' && (
          <div className="space-y-1 animate-in fade-in zoom-in-95 duration-200">
            <label className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#18181B] dark:text-[#FFFDF7] font-jetbrains">
              Nomor Meja <span className="text-[#7F1D1D]">*</span>
            </label>
            <NeoInput
              placeholder="Contoh: Meja 5"
              value={tableNumber}
              onChange={(e) => onTableNumberChange(e.target.value)}
              className="text-xs sm:text-sm"
            />
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-4 space-y-1">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 sm:gap-3 opacity-50">
            <ShoppingCart className="w-8 h-8 sm:w-10 sm:h-10 text-[#18181B]/50 dark:text-[#FFFDF7]/50 animate-float" />
            <p className="text-xs sm:text-sm font-black text-[#18181B]/50 dark:text-[#FFFDF7]/50 font-space">Keranjang kosong</p>
            <p className="text-[10px] sm:text-xs font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50 text-center font-dm-sans">Pilih menu di sebelah kiri</p>
          </div>
        ) : (
          cart.map((item) => {
            const itemPrice = toSafeNumber(item?.price);
            const itemQuantity = toSafeNumber(item?.quantity);
            return (
              <div
                key={item.menuId}
                className="flex items-center gap-1.5 sm:gap-3 border-2 border-[#18181B]/20 p-1.5 sm:p-2 hover:bg-[#C9A227]/10 dark:border-[#FFFDF7]/10 dark:hover:bg-[#C9A227]/20 transition-colors card-hover-frame table-row-hover-animated"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-black text-[#18181B] dark:text-[#FFFDF7] line-clamp-1 font-space">{item?.name || 'Menu'}</h4>
                  <p className="text-[10px] sm:text-xs font-bold text-[#18181B]/70 dark:text-[#FFFDF7]/70 font-jetbrains">
                    Rp {itemPrice.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="flex items-center gap-0.5 sm:gap-1 border-2 border-[#18181B] p-0.5 shadow-[2px_2px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[2px_2px_0px_#FFFDF7]">
                  <button
                    className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center hover:bg-[#C9A227]/20 transition-colors"
                    onClick={() => onUpdateQuantity(item.menuId, -1)}
                  >
                    <Minus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  </button>
                  <span className="text-xs sm:text-sm font-black w-4 sm:w-5 text-center text-[#18181B] dark:text-[#FFFDF7] font-jetbrains">{itemQuantity}</span>
                  <button
                    className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center hover:bg-[#C9A227]/20 transition-colors"
                    onClick={() => onUpdateQuantity(item.menuId, 1)}
                  >
                    <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  </button>
                </div>
                <span className="text-[10px] sm:text-xs font-black text-[#18181B] dark:text-[#FFFDF7] w-12 sm:w-16 text-right shrink-0 font-jetbrains">
                  Rp {(itemPrice * itemQuantity).toLocaleString('id-ID')}
                </span>
                <button
                  className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-[#7F1D1D] bg-[#7F1D1D]/10 flex items-center justify-center transition-all hover:bg-[#7F1D1D] hover:text-[#FFFDF7] dark:border-[#C9A227] dark:bg-[#7F1D1D]/30 dark:hover:bg-[#7F1D1D] shrink-0 hover:scale-110 active:scale-95"
                  onClick={() => onRemoveFromCart(item.menuId)}
                  title="Hapus item dari keranjang"
                >
                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-[#7F1D1D] dark:text-[#FFFDF7] hover:text-[#FFFDF7]" />
                </button>
              </div>
            );
          })
        )}
      </div>

      <div className="border-t-4 border-[#18181B] p-3 sm:p-4 space-y-2.5 sm:space-y-3 bg-[#E7D9B8] dark:border-[#FFFDF7] dark:bg-[#18181B] shrink-0">
        <div>
          <label className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#18181B] dark:text-[#FFFDF7] block mb-1.5 sm:mb-2 font-jetbrains">
            Metode Pembayaran
          </label>
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2.5">
            <button
              type="button"
              onClick={() => onPaymentTypeChange('CASH')}
              className={`border-2 border-[#18181B] py-2 sm:py-2.5 px-2 sm:px-3 text-[11px] sm:text-sm font-black flex items-center justify-center gap-1 sm:gap-1.5 transition-all shadow-[2px_2px_0px_#18181B] sm:shadow-[3px_3px_0px_#18181B] active:scale-95 dark:border-[#FFFDF7] dark:shadow-[2px_2px_0px_#FFFDF7] sm:dark:shadow-[3px_3px_0px_#FFFDF7] hover-scale-bounce font-dm-sans ${
                paymentType === 'CASH'
                  ? 'bg-[#065F46] text-[#FFFDF7] shadow-[2px_2px_0px_#18181B] dark:shadow-[2px_2px_0px_#FFFDF7] sm:dark:shadow-[3px_3px_0px_#FFFDF7]'
                  : 'bg-[#FFFDF7] text-[#18181B] hover:bg-[#065F46]/10 dark:bg-[#18181B] dark:text-[#FFFDF7] dark:hover:bg-[#065F46]/20'
              }`}
            >
              {paymentType === 'CASH' && <Check className="w-3 h-3 sm:w-4 sm:h-4" />}
              <Banknote className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Tunai</span>
              <span className="xs:hidden">Cash</span>
            </button>
            <button
              type="button"
              onClick={() => onPaymentTypeChange('MIDTRANS')}
              className={`border-2 border-[#18181B] py-2 sm:py-2.5 px-2 sm:px-3 text-[11px] sm:text-sm font-black flex items-center justify-center gap-1 sm:gap-1.5 transition-all shadow-[2px_2px_0px_#18181B] sm:shadow-[3px_3px_0px_#18181B] active:scale-95 dark:border-[#FFFDF7] dark:shadow-[2px_2px_0px_#FFFDF7] sm:dark:shadow-[3px_3px_0px_#FFFDF7] hover-scale-bounce font-dm-sans ${
                paymentType === 'MIDTRANS'
                  ? 'bg-[#7F1D1D] text-[#FFFDF7] shadow-[2px_2px_0px_#18181B] dark:shadow-[2px_2px_0px_#FFFDF7] sm:dark:shadow-[3px_3px_0px_#FFFDF7]'
                  : 'bg-[#FFFDF7] text-[#18181B] hover:bg-[#7F1D1D]/10 dark:bg-[#18181B] dark:text-[#FFFDF7] dark:hover:bg-[#7F1D1D]/20'
              }`}
            >
              {paymentType === 'MIDTRANS' && <Check className="w-3 h-3 sm:w-4 sm:h-4" />}
              <QrCode className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">QRIS</span>
              <span className="xs:hidden">QRIS</span>
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-xs sm:text-sm font-bold text-[#18181B]/70 dark:text-[#FFFDF7]/70 font-dm-sans">Total</span>
          <span className="text-base sm:text-xl font-black text-[#7F1D1D] dark:text-[#C9A227] font-space">
            Rp {totalAmount.toLocaleString('id-ID')}
          </span>
        </div>

        <button
          className="w-full border-4 border-[#18181B] bg-[#7F1D1D] text-[#FFFDF7] font-black py-2.5 sm:py-3 text-sm sm:text-base shadow-[4px_4px_0px_#18181B] sm:shadow-[6px_6px_0px_#18181B] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#18181B] sm:hover:shadow-[10px_10px_0px_#18181B] active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0px_#18181B] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 dark:border-[#FFFDF7] dark:shadow-[4px_4px_0px_#FFFDF7] sm:dark:shadow-[6px_6px_0px_#FFFDF7] dark:hover:shadow-[6px_6px_0px_#FFFDF7] sm:dark:hover:shadow-[10px_10px_0px_#FFFDF7] text-base card-lift-premium ripple-button font-space"
          onClick={onCheckout}
          disabled={cart.length === 0 || checkoutMutation.isPending}
        >
          {checkoutMutation.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-[#FFFDF7] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs sm:text-sm">Memproses...</span>
            </span>
          ) : (
            'Proses Pembayaran'
          )}
        </button>
      </div>
    </div>
  );
}

// IncomingOrdersPanel sebagai component terpisah di luar Kasir
function IncomingOrdersPanel({
  actionableOrders,
  filteredIncomingOrders,
  incomingSearch,
  isLoadingIncoming,
  confirmCashMutation,
  acceptOrderMutation,
  onIncomingSearchChange,
}: {
  actionableOrders: IncomingOrder[];
  filteredIncomingOrders: IncomingOrder[];
  incomingSearch: string;
  isLoadingIncoming: boolean;
  confirmCashMutation: any;
  acceptOrderMutation: any;
  onIncomingSearchChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col h-full min-h-0 bg-[#FFFDF7] dark:bg-[#18181B]">
      <div className="border-b-4 border-[#18181B] bg-[#7F1D1D] px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between shrink-0 dark:border-[#FFFDF7]">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Clock className="w-4 h-4 text-[#FFFDF7]" />
          <h2 className="text-sm sm:text-base font-black text-[#FFFDF7] font-space">Pesanan Masuk</h2>
        </div>
        <NeoBadge className="border-[#18181B] bg-[#C9A227] text-[#18181B] shadow-[2px_2px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[2px_2px_0px_#FFFDF7] animate-pulse-soft-premium">
          {actionableOrders.length}
        </NeoBadge>
      </div>

      <div className="border-b-2 border-[#18181B] p-2.5 sm:p-3 bg-[#E7D9B8] dark:border-[#FFFDF7] dark:bg-[#18181B] shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#18181B]/50 dark:text-[#FFFDF7]/50" />
          <NeoInput
            placeholder="Cari nama / ID pesanan..."
            className="pl-8 sm:pl-9 w-full text-xs sm:text-sm"
            value={incomingSearch}
            onChange={(e) => onIncomingSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-4 space-y-2.5 sm:space-y-3">
        {isLoadingIncoming ? (
          <div className="text-center text-xs sm:text-sm font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50 py-8 sm:py-10 flex items-center justify-center gap-2 font-dm-sans">
            <span className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-[#7F1D1D] border-t-transparent rounded-full animate-spin dark:border-[#C9A227] dark:border-t-transparent" />
            <span className="hidden xs:inline">Memuat data dari server...</span>
            <span className="xs:hidden">Memuat...</span>
          </div>
        ) : filteredIncomingOrders?.length === 0 ? (
          <div className="text-center text-xs sm:text-sm font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50 py-8 sm:py-10 font-dm-sans">
            Belum ada pesanan.
          </div>
        ) : (
          filteredIncomingOrders.map((order, index) => {
            const orderId = order?.id || '';
            const orderItems = Array.isArray(order?.items) ? order.items : [];
            const orderTotalAmount = toSafeNumber(order?.totalAmount);
            return (
              <NeoCard key={orderId || index} className={`p-3 sm:p-4 animate-fade-in-up-delay-${(index % 4) + 1} corner-accent-animated`}>
                <div className="flex flex-col xs:flex-row xs:items-start justify-between mb-2 gap-1 xs:gap-0">
                  <div>
                    <p className="font-black text-xs sm:text-sm text-[#18181B] dark:text-[#FFFDF7] font-space">
                      {order?.customerName || 'Pelanggan'}
                    </p>
                    <p className="text-[10px] sm:text-xs font-mono font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50 font-jetbrains">
                      {orderId.slice(0, 8)}...
                    </p>
                  </div>
                  <span
                    className={`border-2 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-black shadow-[2px_2px_0px_#18181B] dark:shadow-[2px_2px_0px_#FFFDF7] ${
                      order?.status === 'PAID'
                        ? 'border-[#065F46] bg-[#065F46]/10 text-[#065F46] dark:border-[#34D399] dark:bg-[#065F46]/30 dark:text-[#34D399]'
                        : 'border-[#7F1D1D] bg-[#7F1D1D]/10 text-[#7F1D1D] dark:border-[#C9A227] dark:bg-[#7F1D1D]/30 dark:text-[#FFFDF7]'
                    } animate-pulse-soft-premium font-jetbrains`}
                  >
                    {order?.status === 'PAID' ? 'Dibayar' : 'Pending'}
                  </span>
                </div>

                <div className="text-[10px] sm:text-xs font-bold text-[#18181B]/70 dark:text-[#FFFDF7]/70 mb-1.5 sm:mb-2 font-dm-sans">
                  {orderItems.map((i) => `${toSafeNumber(i?.quantity)}x ${i?.menu?.name ?? 'Menu'}`).join(', ') || 'Belum ada item'}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-1 sm:gap-0 mb-2 sm:mb-3">
                  <span className="text-[10px] sm:text-xs font-black border-2 border-[#18181B] px-1.5 sm:px-2 py-0.5 shadow-[2px_2px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[2px_2px_0px_#FFFDF7] font-jetbrains">
                    {order?.paymentMethod === 'CASH' ? 'Tunai' : 'QRIS'}
                  </span>
                  <span className="font-black text-[#7F1D1D] dark:text-[#C9A227] text-sm sm:text-base font-space">
                    Rp {orderTotalAmount.toLocaleString('id-ID')}
                  </span>
                </div>

                {order?.status === 'PENDING_PAYMENT' && order?.paymentMethod === 'CASH' && (
                  <button
                    className="w-full border-4 border-[#18181B] bg-[#065F46] text-[#FFFDF7] font-black py-1.5 sm:py-2 text-xs sm:text-sm shadow-[4px_4px_0px_#18181B] sm:shadow-[6px_6px_0px_#18181B] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#18181B] sm:hover:shadow-[10px_10px_0px_#18181B] active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0px_#18181B] disabled:opacity-50 dark:border-[#FFFDF7] dark:shadow-[4px_4px_0px_#FFFDF7] sm:dark:shadow-[6px_6px_0px_#FFFDF7] dark:hover:shadow-[6px_6px_0px_#FFFDF7] sm:dark:hover:shadow-[10px_10px_0px_#FFFDF7] card-lift-premium ripple-button font-space"
                    onClick={() => confirmCashMutation.mutate(orderId)}
                    disabled={confirmCashMutation.isPending}
                  >
                    <Banknote className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1.5" />
                    Konfirmasi Bayar
                  </button>
                )}

                {order?.status === 'PENDING_PAYMENT' && order?.paymentMethod !== 'CASH' && (
                  <div className="text-[10px] sm:text-xs text-center font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50 italic py-1 font-dm-sans">
                    Menunggu konfirmasi otomatis...
                  </div>
                )}

                {order?.status === 'PAID' && (
                  <button
                    className="w-full border-4 border-[#18181B] bg-[#7F1D1D] text-[#FFFDF7] font-black py-1.5 sm:py-2 text-xs sm:text-sm shadow-[4px_4px_0px_#18181B] sm:shadow-[6px_6px_0px_#18181B] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#18181B] sm:hover:shadow-[10px_10px_0px_#18181B] active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0px_#18181B] disabled:opacity-50 dark:border-[#FFFDF7] dark:shadow-[4px_4px_0px_#FFFDF7] sm:dark:shadow-[6px_6px_0px_#FFFDF7] dark:hover:shadow-[6px_6px_0px_#FFFDF7] sm:dark:hover:shadow-[10px_10px_0px_#FFFDF7] card-lift-premium ripple-button font-space"
                    onClick={() => acceptOrderMutation.mutate(orderId)}
                    disabled={acceptOrderMutation.isPending}
                  >
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1.5" />
                    Terima Pesanan
                  </button>
                )}
              </NeoCard>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function Kasir() {
  const { showLoading, hideLoading } = useGlobalLoading();
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);

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

  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [orderType, setOrderType] = useState<'dine-in' | 'takeaway'>('dine-in');
  const [menuSearchTerm, setMenuSearchTerm] = useState('');
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<'CASH' | 'MIDTRANS'>('CASH');
  const [activeTab, setActiveTab] = useState<'pos' | 'incoming'>('pos');
  const [incomingSearch, setIncomingSearch] = useState('');
  const [prevOrderCount, setPrevOrderCount] = useState(0);

  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` },
  };

  const { data: menus, isLoading } = useQuery<Menu[]>({
    queryKey: ['menus'],
    queryFn: async () => {
      const isFirstLoad = !queryClient.getQueryData(['menus']);
      if (isFirstLoad) {
        showLoading('Memuat daftar menu...');
      }
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/menu`, axiosConfig);
        return Array.isArray(res.data?.data) ? res.data.data : [];
      } catch (error) {
        console.error('Gagal memuat menu kasir:', error);
        return [];
      } finally {
        if (!queryClient.getQueryData(['menus'])) {
          setTimeout(() => hideLoading(), 300);
        }
      }
    },
    refetchInterval: 30000,
    refetchOnWindowFocus: false,
    staleTime: 20000,
  });

  const { data: incomingOrders, isLoading: isLoadingIncoming } = useQuery<IncomingOrder[]>({
    queryKey: ['pendingActionOrders'],
    queryFn: async () => {
      const isFirstLoad = !queryClient.getQueryData(['pendingActionOrders']);
      if (isFirstLoad) {
        showLoading('Memuat pesanan masuk...');
      }
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/orders/pending-actions`, axiosConfig);
        return Array.isArray(res.data?.data) ? res.data.data : [];
      } catch (error) {
        console.error('Gagal memuat pesanan masuk:', error);
        return [];
      } finally {
        if (!queryClient.getQueryData(['pendingActionOrders'])) {
          setTimeout(() => hideLoading(), 300);
        }
      }
    },
    refetchInterval: 15000,
    refetchOnWindowFocus: false,
    staleTime: 10000,
  });

  const normalizedMenuSearch = menuSearchTerm.trim().toLowerCase();
  const filteredMenus = useMemo(() => {
    if (!Array.isArray(menus)) return [];
    if (!normalizedMenuSearch) return menus;
    return menus.filter((menu) => (menu?.name || '').toLowerCase().includes(normalizedMenuSearch));
  }, [menus, normalizedMenuSearch]);

  const actionableOrders = useMemo(() => {
    if (!Array.isArray(incomingOrders)) return [];
    return incomingOrders.filter((o) => o?.status ? ACTIONABLE_STATUSES.includes(o.status) : false);
  }, [incomingOrders]);

  useEffect(() => {
    if (actionableOrders.length > prevOrderCount) {
      playNotif();
    }
    setPrevOrderCount(actionableOrders.length);
  }, [actionableOrders.length, playNotif, prevOrderCount]);

  const normalizedIncomingSearch = incomingSearch.trim().toLowerCase();
  const filteredIncomingOrders = useMemo(() => {
    if (!normalizedIncomingSearch) return actionableOrders;
    return actionableOrders.filter(
      (o) =>
        (o?.customerName || '').toLowerCase().includes(normalizedIncomingSearch) ||
        (o?.id || '').toLowerCase().includes(normalizedIncomingSearch)
    );
  }, [actionableOrders, normalizedIncomingSearch]);

  const checkoutMutation = useMutation({
    mutationFn: async (payload: CheckoutPayload) => {
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/orders`, payload, axiosConfig);
      return res.data;
    },
    onSuccess: async (data, variables) => {
      const order = data?.data || {};
      try {
        if (variables.paymentMethod === 'CASH') {
          toastSuccess('Pembayaran Tunai berhasil!');
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
          onSuccess: () => toastSuccess('Pembayaran berhasil!'),
          onPending: () => toastInfo('Menunggu pembayaran...'),
          onError: () => toastError('Pembayaran gagal.'),
          onClose: () => toastWarning('Pop-up ditutup sebelum bayar.'),
        });
      } catch (err) {
        console.error(err);
        toastError('Pesanan tercatat, tapi gagal membuka halaman pembayaran.');
      }
    },
    onError: (error: unknown) => {
      const message = axios.isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message
        : undefined;
      toastError(message || 'Gagal memproses pesanan.');
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
      toastSuccess('Pembayaran tunai dikonfirmasi!');
      queryClient.invalidateQueries({ queryKey: ['pendingActionOrders'] });
    },
    onError: () => toastError('Gagal mengonfirmasi pembayaran.'),
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
      toastSuccess('Pesanan diterima, masuk ke dapur!');
      queryClient.invalidateQueries({ queryKey: ['pendingActionOrders'] });
    },
    onError: () => toastError('Gagal menerima pesanan.'),
  });

  const addToCart = (menu: Menu) => {
    if (!menu?.id) {
      toastError('Data menu tidak valid.');
      return;
    }

    const menuStock = toSafeNumber(menu?.stock);
    const menuPrice = toSafeNumber(menu?.price);
    const menuName = menu?.name || 'Menu';

    if (menuStock <= 0) {
      toastError('Stok menu ini habis!');
      return;
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.menuId === menu.id);
      if (existing) {
        if (existing.quantity >= menuStock) {
          toastError(`Stok maksimal ${menuName} adalah ${menuStock}`);
          return prev;
        }
        return prev?.map((item) =>
          item.menuId === menu.id ? { ...item, quantity: item.quantity + 1 } : item
        ) ?? prev;
      }
      return [...prev, { menuId: menu.id, name: menuName, price: menuPrice, quantity: 1 }];
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

  const totalAmount = cart.reduce((sum, item) => sum + toSafeNumber(item.price) * toSafeNumber(item.quantity), 0);
  const totalItems = cart.reduce((sum, item) => sum + toSafeNumber(item.quantity), 0);

  const handleCheckout = () => {
    if (cart.length === 0) {
      toastError('Keranjang masih kosong!');
      return;
    }
    if (orderType === 'dine-in' && !tableNumber) {
      toastError('Nomor meja wajib diisi untuk makan di tempat!');
      return;
    }
    const payload: CheckoutPayload = {
      customerName: customerName || 'Pelanggan Umum',
      tableNumber: orderType === 'takeaway' ? null : tableNumber,
      paymentMethod: paymentType === 'CASH' ? 'CASH' : 'QRIS',
      items: cart?.map((item) => ({
        menuId: item.menuId,
        quantity: toSafeNumber(item.quantity),
        price: toSafeNumber(item.price),
      })) ?? [],
    };
    checkoutMutation.mutate(payload);
  };

  const handlePrintReceipt = (orderData: any) => {
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    if (!printWindow) return;

    const receiptItems = Array.isArray(orderData?.items) ? orderData.items : [];
    const itemsHtml = receiptItems
      ?.map(
        (item: any) => `
    <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 3px;">
      <span>${toSafeNumber(item.quantity)}x ${item.name || item.menu?.name || 'Menu'}</span>
      <span>Rp ${(toSafeNumber(item.price) * toSafeNumber(item.quantity)).toLocaleString('id-ID')}</span>
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
        <title>Struk # ${(orderData?.id || '').slice(0, 8)}</title>
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
          <span>Rp ${toSafeNumber(orderData?.totalAmount).toLocaleString('id-ID')}</span>
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

  return (
    <div className="bg-[#FFFDF7] dark:bg-[#18181B] min-h-screen px-2 sm:px-0">
      <div className="flex gap-1.5 sm:gap-2 mb-3 sm:mb-4 p-1 border-4 border-[#18181B] bg-[#FFFDF7] shadow-[4px_4px_0px_#18181B] sm:shadow-[6px_6px_0px_#18181B] dark:border-[#FFFDF7] dark:bg-[#18181B] dark:shadow-[4px_4px_0px_#FFFDF7] sm:dark:shadow-[6px_6px_0px_#FFFDF7] w-fit animate-fade-in-up">
        <button
          onClick={() => setActiveTab('pos')}
          className={`px-2 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-sm font-black transition-all hover-scale-bounce font-dm-sans ${
            activeTab === 'pos'
              ? 'bg-[#7F1D1D] text-[#FFFDF7] border-2 border-[#18181B] shadow-[2px_2px_0px_#18181B] sm:shadow-[3px_3px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[2px_2px_0px_#FFFDF7] sm:dark:shadow-[3px_3px_0px_#FFFDF7]'
              : 'text-[#18181B] dark:text-[#FFFDF7] hover:bg-[#C9A227]/20'
          }`}
        >
          <span className="hidden xs:inline">Buat Pesanan</span>
          <span className="xs:hidden">POS</span>
        </button>
        <button
          onClick={() => setActiveTab('incoming')}
          className={`px-2 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-sm font-black transition-all relative hover-scale-bounce font-dm-sans ${
            activeTab === 'incoming'
              ? 'bg-[#7F1D1D] text-[#FFFDF7] border-2 border-[#18181B] shadow-[2px_2px_0px_#18181B] sm:shadow-[3px_3px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[2px_2px_0px_#FFFDF7] sm:dark:shadow-[3px_3px_0px_#FFFDF7]'
              : 'text-[#18181B] dark:text-[#FFFDF7] hover:bg-[#C9A227]/20'
          }`}
        >
          <span className="hidden xs:inline">Pesanan Masuk</span>
          <span className="xs:hidden">Masuk</span>
          {actionableOrders.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 sm:w-5 sm:h-5 border-2 border-[#18181B] bg-[#7F1D1D] text-[#FFFDF7] text-[8px] sm:text-[10px] font-black flex items-center justify-center shadow-[2px_2px_0px_#18181B] sm:shadow-[3px_3px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[2px_2px_0px_#FFFDF7] sm:dark:shadow-[3px_3px_0px_#FFFDF7] animate-pulse-soft-premium font-jetbrains">
              {actionableOrders.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'incoming' ? (
        <NeoCard className="h-[calc(100vh-10rem)] sm:h-[calc(100vh-12rem)] overflow-hidden animate-fade-in-up">
          <IncomingOrdersPanel
            actionableOrders={actionableOrders}
            filteredIncomingOrders={filteredIncomingOrders}
            incomingSearch={incomingSearch}
            isLoadingIncoming={isLoadingIncoming}
            confirmCashMutation={confirmCashMutation}
            acceptOrderMutation={acceptOrderMutation}
            onIncomingSearchChange={setIncomingSearch}
          />
        </NeoCard>
      ) : (
        <>
          <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 lg:h-[calc(100vh-8rem)]">
            <div className="w-full lg:flex-1 flex flex-col h-[calc(100dvh-12rem)] sm:h-[calc(100dvh-11rem)] lg:h-auto min-w-0">
              <NeoCard className="flex flex-col h-full overflow-hidden animate-fade-in-up corner-accent-animated">
                <div className="border-b-4 border-[#18181B] bg-[#7F1D1D] px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between shrink-0 dark:border-[#FFFDF7]">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <UtensilsCrossed className="w-4 h-4 text-[#FFFDF7] animate-float" />
                    <h2 className="text-sm sm:text-base font-black text-[#FFFDF7] font-space">Daftar Menu</h2>
                  </div>
                  {menus && (
                    <span className="text-[10px] sm:text-xs font-black border-2 border-[#18181B] bg-[#FFFDF7] px-1.5 sm:px-2 py-0.5 shadow-[2px_2px_0px_#18181B] text-[#18181B] dark:border-[#FFFDF7] dark:bg-[#18181B] dark:text-[#FFFDF7] dark:shadow-[2px_2px_0px_#FFFDF7] font-jetbrains">
                      {normalizedMenuSearch ? `${filteredMenus.length} / ${menus.length}` : menus.length} item
                    </span>
                  )}
                </div>

                <div className="border-b-2 border-[#18181B] p-2.5 sm:p-3 bg-[#E7D9B8] dark:border-[#FFFDF7] dark:bg-[#18181B] shrink-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#18181B]/50 dark:text-[#FFFDF7]/50" />
                    <NeoInput
                      placeholder="Cari menu..."
                      className="pl-8 sm:pl-9 w-full text-xs sm:text-sm"
                      value={menuSearchTerm}
                      onChange={(e) => setMenuSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 sm:p-4">
                  {isLoading ? (
                    <div className="h-full flex items-center justify-center text-xs sm:text-sm font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50 font-dm-sans">
                      <span className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-[#7F1D1D] border-t-transparent rounded-full animate-spin mr-1.5 sm:mr-2 dark:border-[#C9A227] dark:border-t-transparent" />
                      <span className="hidden xs:inline">Memuat data dari server...</span>
                      <span className="xs:hidden">Memuat...</span>
                    </div>
                  ) : !menus?.length ? (
                    <div className="h-full flex items-center justify-center text-xs sm:text-sm font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50 font-dm-sans">
                      Belum ada menu tersedia.
                    </div>
                  ) : filteredMenus?.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50 font-dm-sans">
                      <Search className="w-6 h-6 sm:w-8 sm:h-8 text-[#C9A227]/70 animate-float" />
                      <p>Menu tidak ditemukan</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2 sm:gap-3">
                      {filteredMenus.map((menu, index) => {
                        const menuName = menu?.name || 'Menu';
                        const menuPrice = toSafeNumber(menu?.price);
                        const menuStock = toSafeNumber(menu?.stock);
                        return (
                          <div
                            key={menu?.id || `${menuName}-${index}`}
                            className={`border-4 border-[#18181B] bg-[#FFFDF7] shadow-[3px_3px_0px_#18181B] sm:shadow-[4px_4px_0px_#18181B] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#18181B] sm:hover:shadow-[8px_8px_0px_#18181B] dark:border-[#FFFDF7] dark:bg-[#18181B] dark:shadow-[3px_3px_0px_#FFFDF7] sm:dark:shadow-[4px_4px_0px_#FFFDF7] dark:hover:shadow-[5px_5px_0px_#FFFDF7] sm:dark:hover:shadow-[8px_8px_0px_#FFFDF7] animate-fade-in-up-delay-${(index % 4) + 1} ${
                              menuStock <= 0 ? 'opacity-55 cursor-not-allowed' : 'cursor-pointer hover-scale-bounce'
                            } border-glow-animated relative`}
                            onClick={() => menuStock > 0 && addToCart(menu)}
                          >
                            {menuStock <= 0 && (
                              <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#18181B]/60 backdrop-blur-[2px]">
                                <div className="border-4 border-[#18181B] bg-[#7F1D1D] text-[#FFFDF7] px-2 sm:px-3 py-0.5 sm:py-1 font-black text-[8px] sm:text-xs tracking-widest shadow-[3px_3px_0px_#18181B] sm:shadow-[4px_4px_0px_#18181B] -rotate-12 dark:border-[#FFFDF7] dark:shadow-[3px_3px_0px_#FFFDF7] sm:dark:shadow-[4px_4px_0px_#FFFDF7] font-jetbrains">
                                  HABIS
                                </div>
                              </div>
                            )}
                            <div className="p-1.5 sm:p-2 relative">
                              <div className="aspect-square overflow-hidden mb-1.5 sm:mb-2 bg-[#E7D9B8] border-2 border-[#18181B] dark:border-[#FFFDF7]">
                                <img
                                  src={menu?.imageUrl || 'https://via.placeholder.com/300'}
                                  alt={menuName}
                                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                                />
                              </div>
                              <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-wider text-[#18181B]/50 dark:text-[#FFFDF7]/50 mb-0.5 font-jetbrains truncate">
                                {menu?.category || 'LAINNYA'}
                              </p>
                              <h3 className="font-black text-[11px] sm:text-sm leading-tight line-clamp-1 text-[#18181B] dark:text-[#FFFDF7] font-space">
                                {menuName}
                              </h3>
                              <div className="flex justify-between items-center mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t-2 border-[#18181B]/20 dark:border-[#FFFDF7]/20">
                                <p className="text-[#7F1D1D] dark:text-[#C9A227] font-black text-[11px] sm:text-sm font-jetbrains">
                                  Rp {menuPrice.toLocaleString('id-ID')}
                                </p>
                                <span className={`text-[8px] sm:text-[10px] font-black px-1 sm:px-1.5 py-0.5 border-2 shadow-[2px_2px_0px_#18181B] dark:shadow-[2px_2px_0px_#FFFDF7] font-jetbrains ${
                                  menuStock <= 10
                                    ? 'border-[#C9A227] bg-[#C9A227]/20 text-[#18181B] dark:border-[#C9A227] dark:bg-[#C9A227]/20 dark:text-[#C9A227]'
                                    : 'border-[#065F46] bg-[#065F46]/10 text-[#065F46] dark:border-[#34D399] dark:bg-[#065F46]/30 dark:text-[#34D399]'
                                }`}>
                                  {menuStock}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </NeoCard>
            </div>

            <div className="hidden lg:flex w-[300px] xl:w-[380px] flex-col min-h-0 shrink-0 animate-slide-right">
              <CartPanel
                cart={cart}
                customerName={customerName}
                tableNumber={tableNumber}
                orderType={orderType}
                paymentType={paymentType}
                totalAmount={totalAmount}
                totalItems={totalItems}
                cartDrawerOpen={cartDrawerOpen}
                checkoutMutation={checkoutMutation}
                onCustomerNameChange={setCustomerName}
                onTableNumberChange={setTableNumber}
                onOrderTypeChange={(type) => {
                  setOrderType(type);
                  if (type === 'takeaway') setTableNumber('');
                }}
                onPaymentTypeChange={setPaymentType}
                onRemoveFromCart={removeFromCart}
                onUpdateQuantity={updateQuantity}
                onCheckout={handleCheckout}
                onCloseDrawer={() => setCartDrawerOpen(false)}
                onOpenDrawer={() => setCartDrawerOpen(true)}
              />
            </div>
          </div>

          <div className="lg:hidden">
            {cartDrawerOpen && (
              <div
                className="fixed inset-0 z-40 bg-[#18181B]/60 backdrop-blur-sm animate-fade-in-up"
                onClick={() => setCartDrawerOpen(false)}
              />
            )}
            <div
              className={`fixed inset-x-0 bottom-0 z-50 border-4 border-[#18181B] bg-[#FFFDF7] shadow-[-4px_0_0px_#18181B] sm:shadow-[-8px_0_0px_#18181B] transition-transform duration-300 ease-in-out flex flex-col dark:border-[#FFFDF7] dark:bg-[#18181B] dark:shadow-[-4px_0_0px_#FFFDF7] sm:dark:shadow-[-8px_0_0px_#FFFDF7] ${
                cartDrawerOpen ? 'translate-y-0' : 'translate-y-full'
              }`}
              style={{ height: '85dvh' }}
            >
              <CartPanel
                cart={cart}
                customerName={customerName}
                tableNumber={tableNumber}
                orderType={orderType}
                paymentType={paymentType}
                totalAmount={totalAmount}
                totalItems={totalItems}
                cartDrawerOpen={cartDrawerOpen}
                checkoutMutation={checkoutMutation}
                onCustomerNameChange={setCustomerName}
                onTableNumberChange={setTableNumber}
                onOrderTypeChange={(type) => {
                  setOrderType(type);
                  if (type === 'takeaway') setTableNumber('');
                }}
                onPaymentTypeChange={setPaymentType}
                onRemoveFromCart={removeFromCart}
                onUpdateQuantity={updateQuantity}
                onCheckout={handleCheckout}
                onCloseDrawer={() => setCartDrawerOpen(false)}
                onOpenDrawer={() => setCartDrawerOpen(true)}
              />
            </div>
            {!cartDrawerOpen && (
              <div className="fixed inset-x-0 bottom-0 z-30 px-2 sm:px-4 pb-2 sm:pb-4 pt-1 sm:pt-2 bg-gradient-to-t from-[#FFFDF7] to-transparent dark:from-[#18181B]">
                <button
                  onClick={() => setCartDrawerOpen(true)}
                  className="w-full flex items-center justify-between border-4 border-[#18181B] bg-[#7F1D1D] text-[#FFFDF7] px-3 sm:px-5 py-2.5 sm:py-3.5 shadow-[6px_6px_0px_#18181B] sm:shadow-[8px_8px_0px_#18181B] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0px_#18181B] sm:hover:shadow-[12px_12px_0px_#18181B] active:translate-x-1 active:translate-y-1 active:shadow-[3px_3px_0px_#18181B] sm:active:shadow-[4px_4px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[6px_6px_0px_#FFFDF7] sm:dark:shadow-[8px_8px_0px_#FFFDF7] dark:hover:shadow-[8px_8px_0px_#FFFDF7] sm:dark:hover:shadow-[12px_12px_0px_#FFFDF7] card-lift-premium animate-fade-in-up"
                >
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="font-black text-xs sm:text-sm font-space">Keranjang</span>
                    {totalItems > 0 && (
                      <span className="border-2 border-[#18181B] bg-[#C9A227] text-[#18181B] text-[10px] sm:text-xs font-black px-1.5 sm:px-2 py-0.5 shadow-[2px_2px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[2px_2px_0px_#FFFDF7] animate-pulse-soft-premium font-jetbrains">
                        {totalItems}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="font-black text-xs sm:text-sm font-space">
                      Rp {totalAmount.toLocaleString('id-ID')}
                    </span>
                    <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-70" />
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