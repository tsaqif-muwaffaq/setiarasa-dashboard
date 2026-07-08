import { NavLink } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  History, 
  Users,
  ChefHat,
  UtensilsCrossed,
  X,
  UserCog
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const user = useAuthStore((state) => state.user);
  
  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['OWNER', 'KASIR', 'DAPUR'] },
    { name: 'Kasir (POS)', path: '/kasir', icon: ShoppingCart, roles: ['OWNER', 'KASIR'] },
    { name: 'Dapur (KDS)', path: '/dapur', icon: ChefHat, roles: ['OWNER', 'DAPUR'] },
    { name: 'Kelola Menu', path: '/menu', icon: UtensilsCrossed, roles: ['OWNER'] },
    { name: 'Kelola Karyawan', path: '/karyawan', icon: Users, roles: ['OWNER'] },
    { name: 'Riwayat Transaksi', path: '/riwayat', icon: History, roles: ['OWNER', 'KASIR'] },
    { name: 'Profil Saya', path: '/profil', icon: UserCog, roles: ['OWNER', 'KASIR', 'DAPUR'] },
  ];

  const filteredMenus = menuItems.filter(menu => user?.role && menu.roles.includes(user.role));

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-[#18181B]/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      <aside 
        className={cn(
          "border-r-4 border-[#18181B] bg-[#7F1D1D] text-[#FFFDF7] flex flex-col min-h-screen shadow-[8px_0_0px_#18181B] z-50 fixed lg:static inset-y-0 left-0 w-64 transform transition-all duration-300 ease-in-out dark:border-[#FFFDF7] dark:shadow-[8px_0_0px_#FFFDF7] pattern-sidebar",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand Section */}
        <div className="p-5 flex items-center justify-between gap-3 border-b-4 border-[#C9A227]/80 dark:border-[#FFFDF7]/80 relative">
          {/* Decorative element */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-[#FFFDF7]/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-lg border-2 border-[#FFFDF7] bg-[#FFFDF7] p-1 shadow-[3px_3px_0px_#18181B] dark:border-[#18181B] dark:shadow-[3px_3px_0px_#FFFDF7] flex items-center justify-center overflow-hidden card-hover-frame">
              <img 
                src="/logo.png" 
                alt="Logo Setia Rasa" 
                className="w-full h-full object-contain" 
              />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight leading-none">Setia Rasa</span>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#FFFDF7]/70 dark:text-[#FFFDF7]/70">Restaurant POS</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="lg:hidden border-2 border-[#FFFDF7]/50 p-1.5 rounded hover:bg-[#FFFDF7]/10 transition-all hover:scale-105 relative z-10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      
        {/* Navigation */}
        <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto relative">
          {/* Decorative element */}
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#FFFDF7]/5 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
          
          {filteredMenus.map((item, index) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg border-2 transition-all duration-200 font-bold text-sm relative",
                  isActive 
                    ? "border-[#18181B] bg-[#C9A227] text-[#18181B] shadow-[4px_4px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[4px_4px_0px_#FFFDF7]" 
                    : "border-transparent text-[#FFFDF7]/70 hover:bg-[#FFFDF7]/10 hover:text-[#FFFDF7] hover:border-[#FFFDF7]/20",
                  `animate-slide-fade-delay-${(index % 4) + 1}`
                )
              }
              onClick={() => {
                if (window.innerWidth < 1024) {
                  onClose();
                }
              }}
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn(
                    "w-5 h-5",
                    isActive ? "text-[#18181B]" : "text-[#FFFDF7]/60"
                  )} />
                  {item.name}
                  {item.path === '/kasir' && (
                    <span className="ml-auto text-[9px] font-black uppercase tracking-wider px-2 py-0.5 border border-[#FFFDF7]/30 rounded bg-[#FFFDF7]/10 text-[#FFFDF7]/70">
                      POS
                    </span>
                  )}
                  {item.path === '/dapur' && (
                    <span className="ml-auto text-[9px] font-black uppercase tracking-wider px-2 py-0.5 border border-[#FFFDF7]/30 rounded bg-[#FFFDF7]/10 text-[#FFFDF7]/70">
                      KDS
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        
        {/* Footer Sidebar */}
        <div className="p-4 border-t-4 border-[#C9A227]/60 dark:border-[#FFFDF7]/60 relative">
          {/* Decorative element */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFFDF7]/5 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2" />
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-8 h-8 rounded-lg border-2 border-[#FFFDF7]/30 bg-[#FFFDF7]/10 flex items-center justify-center overflow-hidden card-hover-frame">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-black">{user?.name?.charAt(0) || 'U'}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black truncate">{user?.name || 'User'}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#FFFDF7]/60 dark:text-[#FFFDF7]/60">
                {user?.role || 'Guest'}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}