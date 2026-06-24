import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { UtensilsCrossed, ChefHat } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password,
      });

      if (res.data.success) {
        toast.success('Selamat datang kembali!');
        setAuth(res.data.data.user, res.data.data.token);
        navigate('/dashboard'); 
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal terhubung ke server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex lg:grid lg:grid-cols-2 bg-background">
      {/* Sisi Kiri: Form Login */}
      <div className="flex items-center justify-center w-full px-8 py-12 lg:px-16">
        <div className="mx-auto w-full max-w-[400px] space-y-8">
          
          {/* Header Brand */}
          <div className="space-y-2 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-2 mb-6">
              <div className="bg-primary p-2 rounded-lg">
                <UtensilsCrossed className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">
                Setia Rasa
              </span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Masuk ke Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Masukkan email dan password untuk mengelola operasional restoran.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@setiarasa.web.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 bg-background"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-foreground">Password</Label>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 bg-background"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-md font-medium transition-all" 
              disabled={loading}
            >
              {loading ? 'Memverifikasi...' : 'Masuk ke Sistem'}
            </Button>
          </form>

          {/* Footer Info */}
          <p className="text-center text-sm text-muted-foreground pt-6 border-t">
            Sistem Internal Rumah Makan Setia Rasa &copy; 2026
          </p>
        </div>
      </div>

      {/* Sisi Kanan: Gambar Visual (Hanya muncul di layar besar) */}
      <div className="hidden lg:flex relative bg-slate-900 items-center justify-center overflow-hidden">
        {/* URL gambar bisa diganti dengan foto asli sate/menu andalan restoran nanti */}
        <img
          src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1920&auto=format&fit=crop"
          alt="Suasana Restoran"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        
        {/* Overlay Text */}
        <div className="relative z-10 p-12 text-center text-white max-w-lg space-y-6">
          <ChefHat className="w-16 h-16 mx-auto text-primary" />
          <h2 className="text-4xl font-bold leading-tight">
            Setia Karena Rasa
          </h2>
          <p className="text-lg text-slate-300">
            Pusat kendali manajemen menu, stok, dan transaksi harian untuk memberikan pelayanan terbaik bagi pelanggan setia.
          </p>
        </div>
      </div>
    </div>
  );
}