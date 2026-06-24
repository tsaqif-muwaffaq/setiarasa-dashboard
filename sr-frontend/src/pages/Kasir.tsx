import React, { useState } from 'react';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';
import { ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

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

export default function Kasir() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  // State untuk Keranjang & Pelanggan
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [tableNumber, setTableNumber] = useState('');

  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` },
  };

  // 1. Fetch Daftar Menu (Yang stoknya > 0)
  const { data: menus, isLoading } = useQuery<Menu[]>({
    queryKey: ['menus'],
    queryFn: async () => {
      const res = await axios.get('http://localhost:5000/api/menu', axiosConfig);
      return res.data.data;
    },
  });

  // 2. Mutasi Proses Pesanan (Tembak ke Backend)
  const checkoutMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await axios.post('http://localhost:5000/api/orders', payload, axiosConfig);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Pesanan berhasil diproses!');
      // Reset form & keranjang setelah sukses
      setCart([]);
      setCustomerName('');
      setTableNumber('');
      // Refresh data menu agar stok terbaru muncul
      queryClient.invalidateQueries({ queryKey: ['menus'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal memproses pesanan.');
    },
  });

  // --- Fungsi Keranjang ---
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
        return prev.map((item) =>
          item.menuId === menu.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { menuId: menu.id, name: menu.name, price: menu.price, quantity: 1 }];
    });
  };

  const removeFromCart = (menuId: string) => {
    setCart((prev) => prev.filter((item) => item.menuId !== menuId));
  };

  const updateQuantity = (menuId: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.menuId === menuId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : item;
        }
        return item;
      })
    );
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Keranjang masih kosong!');
      return;
    }
    
    const payload = {
      customerName: customerName || 'Pelanggan Umum',
      tableNumber,
      items: cart.map(item => ({
        menuId: item.menuId,
        quantity: item.quantity,
        price: item.price
      }))
    };

    checkoutMutation.mutate(payload);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
      
      {/* Sisi Kiri: Daftar Menu */}
      <div className="flex-1 flex flex-col min-h-0 bg-card border rounded-xl overflow-hidden">
        <div className="p-4 border-b bg-slate-50 dark:bg-slate-900/50">
          <h2 className="text-lg font-bold text-foreground">Daftar Menu</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <p className="text-center text-muted-foreground mt-10">Memuat menu...</p>
          ) : menus?.length === 0 ? (
            <p className="text-center text-muted-foreground mt-10">Belum ada menu tersedia.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {menus?.map((menu) => (
                <Card 
                  key={menu.id} 
                  className={`cursor-pointer transition-all hover:border-primary hover:shadow-md ${menu.stock <= 0 ? 'opacity-50 grayscale' : ''}`}
                  onClick={() => menu.stock > 0 && addToCart(menu)}
                >
                  <CardContent className="p-3">
                    <div className="aspect-square rounded-md overflow-hidden mb-3 bg-slate-100">
                      <img src={menu.imageUrl} alt={menu.name} className="w-full h-full object-cover" />
                    </div>
                    <h3 className="font-semibold text-sm line-clamp-1" title={menu.name}>{menu.name}</h3>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-primary font-bold text-sm">Rp {menu.price.toLocaleString('id-ID')}</p>
                      <span className="text-xs text-muted-foreground">Stok: {menu.stock}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sisi Kanan: Keranjang & Pembayaran */}
      <div className="w-full lg:w-[400px] flex flex-col bg-card border rounded-xl overflow-hidden shrink-0">
        <div className="p-4 border-b bg-primary text-primary-foreground flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          <h2 className="text-lg font-bold">Keranjang Pesanan</h2>
        </div>

        {/* Input Data Pelanggan */}
        <div className="p-4 border-b space-y-3 bg-slate-50 dark:bg-slate-900/50">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Nama Pelanggan (Opsional)</Label>
            <Input 
              placeholder="Contoh: Budi" 
              value={customerName} 
              onChange={(e) => setCustomerName(e.target.value)} 
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Nomor Meja (Opsional)</Label>
            <Input 
              placeholder="Contoh: VIP 1" 
              value={tableNumber} 
              onChange={(e) => setTableNumber(e.target.value)} 
              className="h-9"
            />
          </div>
        </div>

        {/* Daftar Item Keranjang */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2 opacity-60">
              <ShoppingCart className="w-12 h-12" />
              <p className="text-sm">Belum ada pesanan</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.menuId} className="flex justify-between items-center gap-2">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold line-clamp-1">{item.name}</h4>
                  <p className="text-xs text-muted-foreground">Rp {item.price.toLocaleString('id-ID')}</p>
                </div>
                
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-white dark:hover:bg-slate-700" onClick={() => updateQuantity(item.menuId, -1)}>
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-white dark:hover:bg-slate-700" onClick={() => updateQuantity(item.menuId, 1)}>
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>

                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0" onClick={() => removeFromCart(item.menuId)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </div>

        {/* Bagian Total & Tombol Bayar */}
        <div className="p-4 border-t bg-slate-50 dark:bg-slate-900/50 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground font-medium">Total Tagihan</span>
            <span className="text-xl font-bold text-primary">Rp {totalAmount.toLocaleString('id-ID')}</span>
          </div>
          
          <Button 
            className="w-full h-12 text-lg font-bold bg-accent hover:bg-accent/90 text-accent-foreground" 
            onClick={handleCheckout}
            disabled={cart.length === 0 || checkoutMutation.isPending}
          >
            {checkoutMutation.isPending ? 'Memproses...' : 'Proses Pembayaran'}
          </Button>
        </div>
      </div>

    </div>
  );
}