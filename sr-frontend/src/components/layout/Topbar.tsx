import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Topbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(); // Hapus data dari Zustand & LocalStorage
    navigate('/login'); // Arahkan kembali ke halaman login
  };

  return (
    <header className="h-20 bg-card border-b border-border flex items-center justify-between px-8 shadow-sm z-10">
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          Selamat Bekerja, {user?.name}!
        </h2>
        <p className="text-sm text-muted-foreground">
          Sistem Informasi Manajemen Restoran
        </p>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-bold text-foreground">{user?.name}</p>
          <p className="text-xs text-primary font-medium uppercase tracking-wider">{user?.role}</p>
        </div>
        
        {/* Avatar Inisial */}
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg border border-primary/20">
          {user?.name.charAt(0).toUpperCase()}
        </div>
        
        {/* Tombol Logout */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleLogout} 
          title="Keluar" 
          className="text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
}