import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard,
  ShoppingBag,
  Utensils,
  Menu as MenuIcon,
  Users,
  ScrollText,
  UserCircle,
  X,
  LogOut,
  Home,
  Coffee,
  Receipt,
  Settings,
  ChefHat,
  ClipboardList
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const user = useAuthStore((state) => state.user);
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  
  const menuItems = [
    { 
      name: 'Dashboard', 
      path: '/dashboard', 
      icon: LayoutDashboard, 
      roles: ['OWNER', 'KASIR', 'DAPUR'],
      badge: null
    },
    { 
      name: 'Kasir', 
      path: '/kasir', 
      icon: ShoppingBag, 
      roles: ['OWNER', 'KASIR'],
      badge: 'POS'
    },
    { 
      name: 'Dapur', 
      path: '/dapur', 
      icon: Coffee, 
      roles: ['OWNER', 'DAPUR'],
      badge: 'KDS'
    },
    { 
      name: 'Kelola Menu', 
      path: '/menu', 
      icon: Utensils, 
      roles: ['OWNER'],
      badge: null
    },
    { 
      name: 'Karyawan', 
      path: '/karyawan', 
      icon: Users, 
      roles: ['OWNER'],
      badge: null
    },
    { 
      name: 'Riwayat', 
      path: '/riwayat', 
      icon: ScrollText, 
      roles: ['OWNER', 'KASIR'],
      badge: null
    },
    { 
      name: 'Profil', 
      path: '/profil', 
      icon: UserCircle, 
      roles: ['OWNER', 'KASIR', 'DAPUR'],
      badge: null
    },
  ];

  const filteredMenus = menuItems.filter(menu => user?.role && menu.roles.includes(user.role));

  const handleLogout = () => {
    logout();
    navigate('/login');
    onClose(); // Tutup sidebar di mobile
  };

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-[#18181B]/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      <aside 
        className={cn(
          "border-r-[6px] border-[#18181B] bg-[#7F1D1D] text-[#FFFDF7] flex flex-col min-h-screen shadow-[12px_0_0px_#18181B] z-50 fixed lg:static inset-y-0 left-0 w-[280px] transform transition-all duration-300 ease-in-out dark:border-[#FFFDF7] dark:shadow-[12px_0_0px_#FFFDF7]",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Background pattern dalam sidebar dengan animasi */}
        <div className="absolute inset-0 bg-diagonal-animated opacity-20 pointer-events-none diagonal-stripes-animated" />
        <div className="absolute inset-0 bg-dot-animated opacity-30 pointer-events-none animated-dots-overlay" />
        <div className="absolute inset-0 bg-grain-animated pointer-events-none" />
        
        {/* Decorative geometric shapes di background sidebar */}
        <div className="absolute top-20 right-0 w-40 h-40 border-2 border-[#FFFDF7]/5 rotate-45 pointer-events-none animate-spin" style={{ animationDuration: '30s' }} />
        <div className="absolute bottom-32 left-0 w-32 h-32 border-2 border-[#C9A227]/10 rounded-full pointer-events-none animate-pulse" style={{ animationDuration: '4s' }} />
        
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#7F1D1D]/50 to-[#7F1D1D] pointer-events-none" />
        
        {/* Brand Section - Enhanced Neubrutalism */}
       <div className="p-6 flex items-center justify-between gap-3 border-b-[6px] border-[#C9A227] dark:border-[#FFFDF7] relative flex-shrink-0 z-10">
          {/* Decorative geometric shapes */}
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-[#C9A227]/20 rotate-12 animate-float" />
          <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-[#FFFDF7]/5 rotate-45 animate-float" style={{ animationDelay: '0.5s' }} />
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-12 h-12 rounded-lg border-[3px] border-[#FFFDF7] bg-[#FFFDF7] p-1.5 shadow-[5px_5px_0px_#18181B] dark:border-[#18181B] dark:shadow-[5px_5px_0px_#FFFDF7] flex items-center justify-center overflow-hidden rotate-[-2deg] hover:rotate-0 transition-transform duration-300 avatar-glow">
              <img 
                src="/logo.png" 
                alt="Logo Setia Rasa" 
                className="w-full h-full object-contain" 
              />
            </div>
            <div className="rotate-[-1deg]">
               <span className="text-2xl font-black tracking-tight leading-none block font-space text-[#FFFDF7] dark:text-[#FFFDF7]">
    Setia Rasa
  </span>
  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#FFFDF7]/80 dark:text-[#FFFDF7]/80 block mt-0.5 font-jetbrains">
    ★ Restaurant POS
  </span>
</div>
          </div>
          <button 
            onClick={onClose}
            className="lg:hidden border-[3px] border-[#FFFDF7]/50 p-2 rounded-lg hover:bg-[#FFFDF7]/10 transition-all hover:scale-110 hover:rotate-3 relative z-10 shadow-[3px_3px_0px_rgba(255,253,247,0.1)] hover-scale-bounce"
          >
            <X className="w-5 h-5 stroke-[3px]" />
          </button>
        </div>
      
        {/* Navigation - Hide scrollbar but keep functionality */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto relative scrollbar-hide z-10">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-[#C9A227]/10 rotate-12 blur-2xl animate-float" />
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-[#FFFDF7]/5 rotate-[-12deg] blur-2xl animate-float" style={{ animationDelay: '1s' }} />
          
          {filteredMenus.map((item, index) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl border-[3px] transition-all duration-200 font-extrabold text-sm relative group",
                  isActive 
                    ? "border-[#18181B] bg-[#C9A227] text-[#18181B] shadow-[6px_6px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[6px_6px_0px_#FFFDF7] scale-[1.02]" 
                    : "border-transparent text-[#FFFDF7]/70 hover:bg-[#FFFDF7]/10 hover:text-[#FFFDF7] hover:border-[#FFFDF7]/30 hover:shadow-[4px_4px_0px_rgba(255,253,247,0.1)] hover:scale-[1.02]",
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
                  {/* Icon container dengan efek neubrutalism */}
                  <div className={cn(
                    "w-9 h-9 rounded-lg border-[2px] flex items-center justify-center transition-all duration-200 flex-shrink-0",
                    isActive 
                      ? "border-[#18181B] bg-[#18181B]/10 shadow-[3px_3px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[3px_3px_0px_#FFFDF7]" 
                      : "border-[#FFFDF7]/20 bg-[#FFFDF7]/5 group-hover:border-[#FFFDF7]/40 group-hover:bg-[#FFFDF7]/10"
                  )}>
                    <item.icon className={cn(
                      "w-5 h-5 stroke-[2.5px]",
                      isActive ? "text-[#18181B]" : "text-[#FFFDF7]/70 group-hover:text-[#FFFDF7]"
                    )} />
                  </div>
                  
                  <span className="tracking-wide flex-1 font-dm-sans">{item.name}</span>
                  
                  {item.badge && (
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-lg border-[2px] transition-all duration-200 flex-shrink-0 font-jetbrains",
                      isActive 
                        ? "border-[#18181B] bg-[#18181B]/20 text-[#18181B] shadow-[3px_3px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[3px_3px_0px_#FFFDF7]" 
                        : "border-[#FFFDF7]/30 bg-[#FFFDF7]/10 text-[#FFFDF7]/70 group-hover:border-[#FFFDF7]/50 group-hover:text-[#FFFDF7]"
                    )}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        
        {/* Footer Sidebar - Enhanced with Logout button matching Topbar */}
        <div className="p-4 border-t-[6px] border-[#C9A227] dark:border-[#FFFDF7] relative flex-shrink-0 z-10">
          {/* Decorative elements */}
          <div className="absolute -top-8 right-0 w-32 h-32 bg-[#C9A227]/10 rotate-12 blur-2xl animate-float" style={{ animationDelay: '0.3s' }} />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#FFFDF7]/5 rotate-45 blur-2xl animate-float" style={{ animationDelay: '0.7s' }} />
          
          <div className="flex items-center gap-3 relative z-10 bg-[#FFFDF7]/5 p-3 rounded-xl border-[2px] border-[#FFFDF7]/10 shadow-[4px_4px_0px_rgba(255,253,247,0.05)] backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl border-[2px] border-[#FFFDF7]/30 bg-[#FFFDF7]/10 flex items-center justify-center overflow-hidden shadow-[3px_3px_0px_rgba(255,253,247,0.1)] hover:scale-105 transition-transform duration-200 flex-shrink-0 avatar-glow">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg font-black font-space">{user?.name?.charAt(0) || 'U'}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black truncate tracking-wide font-space">{user?.name || 'User'}</p>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[#FFFDF7]/60 dark:text-[#FFFDF7]/60 font-jetbrains">
                  {user?.role || 'Guest'}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-green-400/60 border border-green-400/30 shadow-[0_0_8px_rgba(74,222,128,0.3)] flex-shrink-0 animate-pulse" />
              </div>
            </div>
            {/* Tombol Logout - Sama dengan Topbar */}
            <button 
              onClick={handleLogout}
              title="Keluar" 
              className="border-2 border-[#FFFDF7]/30 bg-[#FFFDF7]/5 p-2 rounded-xl transition-all hover:bg-[#FFFDF7] hover:text-[#18181B] hover:border-[#FFFDF7] hover:scale-110 hover:rotate-3 active:scale-95 shadow-[3px_3px_0px_rgba(255,253,247,0.05)] group flex-shrink-0"
            >
              <LogOut className="w-4 h-4 stroke-[2.5px] text-[#FFFDF7]/70 group-hover:text-[#18181B]" />
            </button>
          </div>
        </div>
      </aside>

      {/* Global styles untuk hide scrollbar */}
      <style>{`
        /* Hide scrollbar for Chrome, Safari and Opera */
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        /* Hide scrollbar for IE, Edge and Firefox */
        .scrollbar-hide {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>
    </>
  );
}