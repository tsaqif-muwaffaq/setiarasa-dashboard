import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar untuk layar besar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      
      {/* Area Utama (Kanan) */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        
        {/* Area Konten Dinamis */}
        <main className="flex-1 p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}