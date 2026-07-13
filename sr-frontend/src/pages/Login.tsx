import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';
import { Lock, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { FloatingShapes } from '@/components/FloatingShapes';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/login`, {
        email,
        password
      });

      const { token, user } = response.data.data;
      setAuth(token, user);
      toast.success(response.data.message);

      if (user.role === 'DAPUR') {
        navigate('/dapur', { replace: true });
      } else if (user.role === 'KASIR') {
        navigate('/kasir', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }

    } catch (error: unknown) {
      const message = axios.isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message
        : undefined;
      toast.error(message || 'Gagal terhubung ke server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFDF7] dark:bg-[#18181B] p-4 transition-colors duration-300 relative overflow-hidden">
      {/* Floating Shapes Dekoratif */}
      <FloatingShapes />
      
      {/* Animated Grid Overlay */}
      <div className="animated-grid-overlay" />
      
      {/* Animated Dots Overlay */}
      <div className="animated-dots-overlay" />
      
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Card Login - Neubrutalism dengan animasi masuk */}
      <div className="relative max-w-md w-full border-4 border-[#18181B] bg-[#FFFDF7] shadow-[12px_12px_0px_#18181B] dark:border-[#FFFDF7] dark:bg-[#18181B] dark:shadow-[12px_12px_0px_#FFFDF7] overflow-hidden animate-fade-in-up corner-accent-animated">
        {/* Top accent bar - gradasi profesional dengan shimmer */}
        <div className="h-2 w-full bg-gradient-to-r from-[#7F1D1D] via-[#C9A227] to-[#065F46] animate-shimmer" />

        <div className="p-8 space-y-6">

          {/* Brand Section */}
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-2xl border-4 border-[#18181B] bg-[#FFFDF7] p-2 shadow-[4px_4px_0px_#18181B] dark:border-[#FFFDF7] dark:bg-[#18181B] dark:shadow-[4px_4px_0px_#FFFDF7] flex items-center justify-center hover-scale-bounce avatar-glow">
                <img 
                  src="/logo.png" 
                  alt="Logo Setia Rasa" 
                  className="w-full h-full object-contain" 
                />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-gradient">
                Setia Rasa
              </h1>
              <p className="text-xs font-bold uppercase tracking-wider text-[#18181B]/50 dark:text-[#FFFDF7]/50 mt-1 typing-text inline-block">
                Internal Point of Sales System
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t-2 border-[#18181B]/20 dark:border-[#FFFDF7]/20" />

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5 animate-slide-in-left-delay-1">
              <label className="text-xs font-bold uppercase tracking-wider text-[#18181B] dark:text-[#FFFDF7]">
                Email Pegawai
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#18181B]/40 dark:text-[#FFFDF7]/40" />
                <input
                  type="email"
                  required
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-[#18181B]/30 bg-[#FFFDF7] focus:border-[#7F1D1D] focus:shadow-[0_0_0_3px_rgba(127,29,29,0.15)] outline-none text-sm font-medium text-[#18181B] transition-all rounded-lg dark:border-[#FFFDF7]/30 dark:bg-[#18181B] dark:text-[#FFFDF7] dark:focus:border-[#C9A227] dark:focus:shadow-[0_0_0_3px_rgba(201,162,39,0.15)] placeholder:text-[#18181B]/40 dark:placeholder:text-[#FFFDF7]/40"
                  placeholder="email@setiarasa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5 animate-slide-in-left-delay-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#18181B] dark:text-[#FFFDF7]">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#18181B]/40 dark:text-[#FFFDF7]/40" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full pl-10 pr-12 py-2.5 border-2 border-[#18181B]/30 bg-[#FFFDF7] focus:border-[#7F1D1D] focus:shadow-[0_0_0_3px_rgba(127,29,29,0.15)] outline-none text-sm font-medium text-[#18181B] transition-all rounded-lg dark:border-[#FFFDF7]/30 dark:bg-[#18181B] dark:text-[#FFFDF7] dark:focus:border-[#C9A227] dark:focus:shadow-[0_0_0_3px_rgba(201,162,39,0.15)] placeholder:text-[#18181B]/40 dark:placeholder:text-[#FFFDF7]/40"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#18181B]/40 hover:text-[#18181B] dark:text-[#FFFDF7]/40 dark:hover:text-[#FFFDF7] transition-colors focus:outline-none hover-scale-bounce"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full border-4 border-[#18181B] bg-gradient-to-r from-[#7F1D1D] to-[#9B2226] text-[#FFFDF7] font-bold py-3 shadow-[6px_6px_0px_#18181B] transition-all hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[10px_10px_0px_#18181B] active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0px_#18181B] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 dark:border-[#FFFDF7] dark:shadow-[6px_6px_0px_#FFFDF7] dark:hover:shadow-[10px_10px_0px_#FFFDF7] flex items-center justify-center gap-2 mt-2 rounded-lg hover-scale-bounce animate-slide-in-left-delay-3 ripple-button"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-[#FFFDF7] border-t-transparent animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                <>
                  Masuk Sistem
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t-2 border-[#18181B]/20 dark:border-[#FFFDF7]/20 animate-fade-in-up-delay-4">
            <p className="text-[10px] font-bold text-[#18181B]/40 dark:text-[#FFFDF7]/40 font-jetbrains">
              Internal System v2.0
            </p>
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#18181B]/40 dark:text-[#FFFDF7]/40">
              <span className="w-1.5 h-1.5 rounded-full bg-[#065F46] animate-pulse dark:bg-[#34D399] inline-block" />
              Sistem Aktif
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}