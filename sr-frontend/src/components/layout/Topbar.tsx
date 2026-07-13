import { useAuthStore } from '@/store/useAuthStore';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LogOut, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TopbarProps {
  onMenuClick: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="h-16 sticky top-0 z-20 border-b-2 border-[#18181B]/10 dark:border-[#FFFDF7]/10 bg-[#FFFDF7] dark:bg-[#18181B] flex items-center justify-between px-4 sm:px-8 shadow-sm transition-colors duration-300 pattern-header">
      {/* Decorative line dengan animasi shimmer */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#C9A227]/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#7F1D1D]/10 to-transparent animate-shimmer" style={{ animationDelay: '1s' }} />
      
      <div className="flex items-center gap-3">
        <button 
          className="lg:hidden border-2 border-[#18181B]/20 dark:border-[#FFFDF7]/20 p-2 rounded-lg hover:bg-[#C9A227]/10 dark:hover:bg-[#C9A227]/20 transition-all hover:scale-105 hover-scale-bounce"
          onClick={onMenuClick}
        >
          <Menu className="w-5 h-5 text-[#18181B] dark:text-[#FFFDF7]" />
        </button>
        
        <div>
          <h2 className="text-lg font-black text-[#18181B] dark:text-[#FFFDF7] font-space">
            Selamat Bekerja, <span className="text-[#7F1D1D] dark:text-[#C9A227]">{user?.name}!</span>
            <span className="floating-dot ml-2 inline-block" />
          </h2>
          <p className="text-xs font-medium text-[#18181B]/50 dark:text-[#FFFDF7]/50 hidden sm:block font-dm-sans">
            Sistem Manajemen Restoran Setia Rasa
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-bold text-[#18181B] dark:text-[#FFFDF7] font-space">{user?.name}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#7F1D1D] dark:text-[#C9A227] font-jetbrains">
            <span className="w-1.5 h-1.5 rounded-full bg-[#065F46] dark:bg-[#34D399] animate-pulse inline-block mr-1" />
            {user?.role}
          </p>
        </div>

        <div className="w-9 h-9 rounded-lg border-2 border-[#18181B]/20 dark:border-[#FFFDF7]/20 bg-[#7F1D1D] dark:bg-[#7F1D1D] text-[#FFFDF7] dark:text-[#FFFDF7] flex items-center justify-center font-black text-sm shadow-sm card-hover-frame avatar-glow">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-lg" />
          ) : (
            getInitials(user?.name || 'User')
          )}
        </div>

        <ThemeToggle />

        <button 
          onClick={handleLogout} 
          title="Keluar" 
          className="border-2 border-[#7F1D1D]/30 dark:border-[#C9A227]/30 bg-[#7F1D1D]/5 dark:bg-[#C9A227]/5 p-2 rounded-lg transition-all hover:bg-[#7F1D1D] dark:hover:bg-[#C9A227] hover:text-[#FFFDF7] dark:hover:text-[#18181B] hover:border-[#7F1D1D] dark:hover:border-[#C9A227] hover:scale-105 active:scale-95 card-hover-frame group"
        >
          <LogOut className="w-4 h-4 text-[#7F1D1D] dark:text-[#FFFDF7]/70 group-hover:text-[#FFFDF7] dark:group-hover:text-[#18181B]" />
        </button>
      </div>
    </header>
  );
}