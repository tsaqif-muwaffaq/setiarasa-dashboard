import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';

// Halaman & Layout Utama
import Login from './pages/Login';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Import Halaman Asli
import KelolaMenu from './pages/KelolaMenu';
import Kasir from './pages/Kasir';
import Dapur from './pages/Dapur';
import Dashboard from './pages/Dashboard';
import Riwayat from './pages/Riwayat';
import Karyawan from './pages/Karyawan';
import Profile from './pages/Profile';

function App() {
  return (
    <>
      {/* Pattern background global dengan animasi */}
      <div className="fixed inset-0 bg-pattern bg-dot-grid pointer-events-none z-0" />
      
      <div className="relative z-10">
        <Toaster position="top-right" richColors />
        
        <Routes>
          {/* Rute Publik (Tanpa Proteksi) */}
          <Route path="/login" element={<Login />} />
          
          {/* Rute Terproteksi (Harus Login) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/kasir" element={<Kasir />} />
              <Route path="/dapur" element={<Dapur />} />
              <Route path="/profil" element={<Profile />} />
              <Route path="/menu" element={<KelolaMenu />} />
              <Route path="/riwayat" element={<Riwayat />} />
              <Route path="/karyawan" element={<Karyawan />} />
            </Route>
          </Route>

          {/* Redirect default */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </>
  );
}

export default App;