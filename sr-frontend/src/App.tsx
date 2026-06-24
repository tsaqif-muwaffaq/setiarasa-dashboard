import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Login from './pages/Login';

// Placeholder untuk halaman Dashboard (akan kita buat nanti)
const DashboardPlaceholder = () => (
  <div className="p-10">
    <h1 className="text-2xl font-bold">Selamat datang di Dashboard!</h1>
    <p>Halaman ini akan segera diisi dengan laporan dan statistik.</p>
  </div>
);

function App() {
  return (
    <Router>
      {/* Komponen Toaster diletakkan di root agar bisa dipanggil dari mana saja */}
      <Toaster position="top-right" richColors />
      
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Nanti kita akan tambahkan sistem Proteksi Route (Protected Route) di sini */}
        <Route path="/dashboard" element={<DashboardPlaceholder />} />
        
        {/* Redirect default ke login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;