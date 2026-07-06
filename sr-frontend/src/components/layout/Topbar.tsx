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
    <header className="h-16 border-b-2 border-[#18181B]/10 bg-[#FFFDF7] flex items-center justify-between px-4 sm:px-8 shadow-sm z-10 transition-colors duration-300 dark:border-[#FFFDF7]/10 dark:bg-[#18181B] relative pattern-header">
      {/* Decorative line */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#C9A227]/20 to-transparent" />
      
      <div className="flex items-center gap-3">
        <button 
          className="lg:hidden border-2 border-[#18181B]/20 p-2 rounded-lg hover:bg-[#C9A227]/10 transition-all hover:scale-105 dark:border-[#FFFDF7]/20"
          onClick={onMenuClick}
        >
          <Menu className="w-5 h-5 text-[#18181B] dark:text-[#FFFDF7]" />
        </button>
        
        <div>
          <h2 className="text-lg font-black text-[#18181B] dark:text-[#FFFDF7]">
            Selamat Bekerja, <span className="text-[#7F1D1D] dark:text-[#C9A227]">{user?.name}!</span>
          </h2>
          <p className="text-xs font-medium text-[#18181B]/50 dark:text-[#FFFDF7]/50 hidden sm:block">
            Sistem Manajemen Restoran Setia Rasa
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-bold text-[#18181B] dark:text-[#FFFDF7]">{user?.name}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#7F1D1D] dark:text-[#C9A227]">{user?.role}</p>
        </div>

        <div className="w-9 h-9 rounded-lg border-2 border-[#18181B]/20 bg-[#7F1D1D] text-[#FFFDF7] flex items-center justify-center font-black text-sm shadow-sm dark:border-[#FFFDF7]/20 card-hover-frame">
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
          className="border-2 border-[#7F1D1D]/30 bg-[#7F1D1D]/5 p-2 rounded-lg transition-all hover:bg-[#7F1D1D] hover:text-[#FFFDF7] hover:border-[#7F1D1D] hover:scale-105 active:scale-95 dark:border-[#C9A227]/30 dark:hover:bg-[#C9A227] dark:hover:text-[#18181B] card-hover-frame"
        >
          <LogOut className="w-4 h-4 text-[#7F1D1D] dark:text-[#FFFDF7]/70 group-hover:text-[#FFFDF7] dark:group-hover:text-[#18181B]" />
        </button>
      </div>
    </header>
  );
}