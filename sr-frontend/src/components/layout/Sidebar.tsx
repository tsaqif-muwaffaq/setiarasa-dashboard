import { NavLink } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  History, 
  Users,
  ChefHat,
  UtensilsCrossed
} from 'lucide-react';

export default function Sidebar() {
  const user = useAuthStore((state) => state.user);
  
  // Konfigurasi Menu & Hak Akses (Role)
  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['OWNER', 'KASIR', 'DAPUR'] },
    { name: 'Kasir (POS)', path: '/kasir', icon: ShoppingCart, roles: ['OWNER', 'KASIR'] },
    { name: 'Dapur (KDS)', path: '/dapur', icon: ChefHat, roles: ['OWNER', 'DAPUR'] },
    { name: 'Kelola Menu', path: '/menu', icon: UtensilsCrossed, roles: ['OWNER'] },
    { name: 'Riwayat Transaksi', path: '/riwayat', icon: History, roles: ['OWNER', 'KASIR'] },
    { name: 'Kelola Karyawan', path: '/karyawan', icon: Users, roles: ['OWNER'] },
  ];

  // Saring menu: Hanya tampilkan menu yang rolenya mencakup role user saat ini
  const filteredMenus = menuItems.filter(menu => user?.role && menu.roles.includes(user.role));

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col min-h-screen shadow-xl z-20">
      {/* Brand Header */}
      <div className="p-6 flex items-center gap-3 text-white border-b border-slate-800">
        <div className="bg-primary p-2 rounded-lg">
          <UtensilsCrossed className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold tracking-tight">Setia Rasa</span>
      </div>
      
      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {filteredMenus.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                isActive 
                  ? "bg-primary text-primary-foreground font-medium shadow-md" 
                  : "hover:bg-slate-800 hover:text-white"
              )
            }
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}