import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'KASIR' | 'DAPUR';
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  // Cek apakah ada data di localStorage saat aplikasi pertama kali dimuat
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token') || null,

  setAuth: (user, token) => {
    // Simpan ke localStorage agar sesi bertahan
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    // Simpan ke global state
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },
}));