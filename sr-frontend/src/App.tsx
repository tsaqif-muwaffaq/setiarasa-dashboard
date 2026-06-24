import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';

// Halaman & Layout
import Login from './pages/Login';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Placeholder untuk halaman-halaman dashboard (Akan dibuat di fase berikutnya)
const Dashboard = () => <div className="text-2xl font-bold text-foreground">Halaman Ringkasan Dashboard</div>;
const Kasir = () => <div className="text-2xl font-bold text-foreground">Halaman Sistem Kasir (POS)</div>;
const KelolaMenu = () => <div className="text-2xl font-bold text-foreground">Halaman Kelola Menu Restoran</div>;

function App() {
  return (
    <Router>
      <Toaster position="top-right" richColors />
      
      <Routes>
        {/* Rute Publik (Tanpa Proteksi) */}
        <Route path="/login" element={<Login />} />
        
        {/* Rute Terproteksi (Harus Login) */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/kasir" element={<Kasir />} />
            <Route path="/dapur" element={<div>Halaman Dapur</div>} />
            <Route path="/menu" element={<KelolaMenu />} />
            <Route path="/riwayat" element={<div>Riwayat Transaksi</div>} />
            <Route path="/karyawan" element={<div>Kelola Karyawan</div>} />
          </Route>
        </Route>

        {/* Redirect default */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;