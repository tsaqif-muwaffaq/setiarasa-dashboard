import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';

export default function ProtectedRoute() {
  const token = useAuthStore((state) => state.token);

  // Jika token tidak ada, arahkan ke login dan ganti history URL
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Jika ada token, render komponen anak (halaman yang dituju)
  return <Outlet />;
}