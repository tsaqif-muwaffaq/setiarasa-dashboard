import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#FFFDF7] text-[#18181B] relative transition-colors duration-300 dark:bg-[#18181B] dark:text-[#FFFDF7]">
      {/* Pattern background untuk konten utama */}
      <div className="fixed inset-0 bg-pattern bg-dot-grid pointer-events-none z-0" />
      
      <Sidebar 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />
      
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <Topbar onMenuClick={() => setIsMobileMenuOpen(true)} />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto bg-grain">
          <Outlet />
        </main>
      </div>
    </div>
  );
}