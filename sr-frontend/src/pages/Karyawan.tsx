import { useState } from 'react';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';
import { UserPlus, Trash2, Search, Shield, ChefHat, Store, Users, X } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface KaryawanData {
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'KASIR' | 'DAPUR';
  createdAt: string;
  avatar?: string;
}

const formatSafeDate = (dateString: string | undefined) => {
  const date = new Date(dateString || '');
  if (!Number.isFinite(date.getTime())) return '-';
  return format(date, 'dd MMM yyyy', { locale: id });
};

// ── Komponen Neubrutalism ──
function NeoCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`border-4 border-[#18181B] bg-[#FFFDF7] shadow-[6px_6px_0px_#18181B] dark:border-[#FFFDF7] dark:bg-[#18181B] dark:shadow-[6px_6px_0px_#FFFDF7] ${className}`}>
      {children}
    </div>
  );
}

function NeoButton({ children, onClick, className = '', disabled = false, type = 'button' }: { children: React.ReactNode; onClick?: () => void; className?: string; disabled?: boolean; type?: 'button' | 'submit' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`border-4 border-[#18181B] bg-[#7F1D1D] text-[#FFFDF7] font-black px-5 py-2.5 shadow-[6px_6px_0px_#18181B] transition-all hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[10px_10px_0px_#18181B] active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0px_#18181B] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 dark:border-[#FFFDF7] dark:shadow-[6px_6px_0px_#FFFDF7] dark:hover:shadow-[10px_10px_0px_#FFFDF7] ${className}`}
    >
      {children}
    </button>
  );
}

function NeoInput({ className = '', ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      className={`border-2 border-[#18181B] bg-[#FFFDF7] px-3 py-2 text-sm font-bold text-[#18181B] outline-none transition-all focus:shadow-[4px_4px_0px_#7F1D1D] focus:border-[#7F1D1D] dark:border-[#FFFDF7] dark:bg-[#18181B] dark:text-[#FFFDF7] dark:focus:shadow-[4px_4px_0px_#C9A227] dark:focus:border-[#C9A227] placeholder:text-[#18181B]/40 dark:placeholder:text-[#FFFDF7]/40 ${className}`}
      {...props}
    />
  );
}

function NeoBadge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center border-2 border-[#18181B] px-2 py-0.5 text-[10px] font-black shadow-[2px_2px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[2px_2px_0px_#FFFDF7] ${className}`}>
      {children}
    </span>
  );
}

export default function Karyawan() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'KASIR',
  });

  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

  const { data: employees, isLoading } = useQuery<KaryawanData[]>({
    queryKey: ['employees'],
    queryFn: async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users`, axiosConfig);
        return Array.isArray(res.data?.data) ? res.data.data : [];
      } catch (error) {
        console.error('Gagal memuat data karyawan:', error);
        return [];
      }
    },
  });

  const createEmployeeMutation = useMutation({
    mutationFn: async (payload: typeof formData) =>
      axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users`, payload, axiosConfig),
    onSuccess: (res) => {
      toast.success('✅ ' + (res.data.message || 'Akun karyawan berhasil dibuat!'));
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      closeModal();
    },
    onError: (error: unknown) => {
      const message = axios.isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message
        : undefined;
      toast.error(message || 'Gagal membuat akun karyawan.');
    },
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: string) =>
      axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/${id}`, axiosConfig),
    onSuccess: () => {
      toast.success('✅ Akun karyawan berhasil dihapus!');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: () => {
      toast.error('Gagal menghapus akun karyawan.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createEmployeeMutation.mutate(formData);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Yakin ingin menghapus akses sistem untuk "${name}"? Tindakan ini tidak bisa dibatalkan.`)) {
      deleteEmployeeMutation.mutate(id);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ name: '', email: '', password: '', role: 'KASIR' });
  };

  const safeEmployees = Array.isArray(employees)
    ? employees.filter((emp): emp is KaryawanData => Boolean(emp && typeof emp === 'object'))
    : [];
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredEmployees = safeEmployees.filter(
    (emp) =>
      (emp?.name || '').toLowerCase().includes(normalizedSearchTerm) ||
      (emp?.email || '').toLowerCase().includes(normalizedSearchTerm)
  );

  const totalOwner = safeEmployees.filter(e => e?.role === 'OWNER').length;
  const totalKasir = safeEmployees.filter(e => e?.role === 'KASIR').length;
  const totalDapur = safeEmployees.filter(e => e?.role === 'DAPUR').length;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'OWNER':
        return <NeoBadge className="border-[#7F1D1D] bg-[#7F1D1D]/10 text-[#7F1D1D] dark:border-[#C9A227] dark:bg-[#7F1D1D]/30 dark:text-[#FFFDF7]"><Shield className="w-3 h-3 mr-1" /> OWNER</NeoBadge>;
      case 'KASIR':
        return <NeoBadge className="border-[#065F46] bg-[#065F46]/10 text-[#065F46] dark:border-[#34D399] dark:bg-[#065F46]/30 dark:text-[#34D399]"><Store className="w-3 h-3 mr-1" /> KASIR</NeoBadge>;
      case 'DAPUR':
        return <NeoBadge className="border-[#C9A227] bg-[#C9A227]/20 text-[#18181B] dark:border-[#C9A227] dark:bg-[#C9A227]/20 dark:text-[#C9A227]"><ChefHat className="w-3 h-3 mr-1" /> DAPUR</NeoBadge>;
      default:
        return <NeoBadge>{role}</NeoBadge>;
    }
  };

  // Fungsi untuk mendapatkan style avatar berdasarkan role
  const getAvatarStyle = (role: string) => {
    switch (role) {
      case 'OWNER': return 'border-[#7F1D1D] bg-[#7F1D1D]/10 text-[#7F1D1D]';
      case 'KASIR': return 'border-[#065F46] bg-[#065F46]/10 text-[#065F46]';
      case 'DAPUR': return 'border-[#C9A227] bg-[#C9A227]/20 text-[#18181B]';
      default: return 'border-[#18181B] bg-[#E7D9B8] text-[#18181B]';
    }
  };

  return (
    <div className="space-y-6 pb-10 bg-[#FFFDF7] dark:bg-[#18181B]">

      {/* Header */}
      <NeoCard className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-[#7F1D1D] dark:text-[#C9A227]">
              Setia Rasa · Staff Management
            </p>
            <h1 className="text-2xl font-black tracking-tight text-[#18181B] dark:text-[#FFFDF7]">
              Kelola Karyawan
            </h1>
            <p className="text-sm font-bold text-[#18181B]/70 dark:text-[#FFFDF7]/70 mt-1">
              Daftarkan dan atur hak akses akun staf restoran Anda.
            </p>
          </div>

          <NeoButton onClick={() => setIsModalOpen(true)}>
            <UserPlus className="w-4 h-4 mr-2 inline" /> Tambah Karyawan
          </NeoButton>
        </div>
      </NeoCard>

      {/* Summary Pills */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-2 border-2 border-[#18181B] bg-[#FFFDF7] px-3 py-1.5 shadow-[3px_3px_0px_#18181B] dark:border-[#FFFDF7] dark:bg-[#18181B] dark:shadow-[3px_3px_0px_#FFFDF7]">
          <Users className="w-3.5 h-3.5 text-[#7F1D1D] dark:text-[#C9A227]" />
          <span className="text-xs font-black text-[#18181B] dark:text-[#FFFDF7]">{safeEmployees.length} Total Staf</span>
        </div>
        {totalOwner > 0 && (
          <div className="flex items-center gap-2 border-2 border-[#7F1D1D] bg-[#7F1D1D]/10 px-3 py-1.5 shadow-[3px_3px_0px_#18181B] dark:border-[#C9A227] dark:bg-[#7F1D1D]/30 dark:shadow-[3px_3px_0px_#FFFDF7]">
            <Shield className="w-3 h-3 text-[#7F1D1D] dark:text-[#C9A227]" />
            <span className="text-xs font-black text-[#7F1D1D] dark:text-[#FFFDF7]">{totalOwner} Owner</span>
          </div>
        )}
        {totalKasir > 0 && (
          <div className="flex items-center gap-2 border-2 border-[#065F46] bg-[#065F46]/10 px-3 py-1.5 shadow-[3px_3px_0px_#18181B] dark:border-[#34D399] dark:bg-[#065F46]/30 dark:shadow-[3px_3px_0px_#FFFDF7]">
            <Store className="w-3 h-3 text-[#065F46] dark:text-[#34D399]" />
            <span className="text-xs font-black text-[#065F46] dark:text-[#34D399]">{totalKasir} Kasir</span>
          </div>
        )}
        {totalDapur > 0 && (
          <div className="flex items-center gap-2 border-2 border-[#C9A227] bg-[#C9A227]/20 px-3 py-1.5 shadow-[3px_3px_0px_#18181B] dark:border-[#C9A227] dark:bg-[#C9A227]/20 dark:shadow-[3px_3px_0px_#FFFDF7]">
            <ChefHat className="w-3 h-3 text-[#18181B] dark:text-[#C9A227]" />
            <span className="text-xs font-black text-[#18181B] dark:text-[#C9A227]">{totalDapur} Dapur</span>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#18181B]/50 dark:text-[#FFFDF7]/50" />
        <NeoInput
          placeholder="Cari nama atau email staf..."
          className="pl-9 w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Modal Tambah Karyawan dengan Tombol Close (X) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#18181B]/80 p-4">
          <div className="w-full max-w-md border-4 border-[#18181B] bg-[#FFFDF7] shadow-[12px_12px_0px_#18181B] dark:border-[#FFFDF7] dark:bg-[#18181B] dark:shadow-[12px_12px_0px_#FFFDF7] max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header Modal dengan Tombol Close */}
              <div className="flex items-center justify-between mb-4 border-b-2 border-[#18181B] pb-3 dark:border-[#FFFDF7]">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-[#7F1D1D] dark:text-[#C9A227]" />
                  <h2 className="text-lg font-black text-[#18181B] dark:text-[#FFFDF7]">
                    Buat Akun Staf Baru
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="border-2 border-[#18181B] bg-[#FFFDF7] p-1.5 shadow-[3px_3px_0px_#18181B] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#18181B] active:translate-x-1 active:translate-y-1 active:shadow-[1px_1px_0px_#18181B] dark:border-[#FFFDF7] dark:bg-[#18181B] dark:shadow-[3px_3px_0px_#FFFDF7] dark:hover:shadow-[5px_5px_0px_#FFFDF7]"
                  aria-label="Tutup modal"
                >
                  <X className="w-5 h-5 text-[#18181B] dark:text-[#FFFDF7]" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-[#18181B] dark:text-[#FFFDF7]">Nama Lengkap</label>
                  <NeoInput
                    required
                    placeholder="Contoh: Ahmad Budi"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-[#18181B] dark:text-[#FFFDF7]">Email Akun</label>
                  <NeoInput
                    required
                    type="email"
                    placeholder="budi@setiarasa.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-[#18181B] dark:text-[#FFFDF7]">Password Akses</label>
                  <NeoInput
                    required
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-[#18181B] dark:text-[#FFFDF7]">Hak Akses (Role)</label>
                  <select
                    className="w-full border-2 border-[#18181B] bg-[#FFFDF7] px-3 py-2 text-sm font-bold text-[#18181B] outline-none transition-all focus:shadow-[4px_4px_0px_#7F1D1D] focus:border-[#7F1D1D] dark:border-[#FFFDF7] dark:bg-[#18181B] dark:text-[#FFFDF7] dark:focus:shadow-[4px_4px_0px_#C9A227] dark:focus:border-[#C9A227]"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="KASIR">KASIR — Akses POS & Menu Utama</option>
                    <option value="DAPUR">DAPUR — Layar KDS Koki</option>
                    <option value="OWNER">OWNER — Akses Penuh Seluruh Sistem</option>
                  </select>
                </div>

                <div className="pt-4 flex justify-end gap-2 border-t-2 border-[#18181B] dark:border-[#FFFDF7]">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="border-2 border-[#18181B] bg-[#FFFDF7] text-[#18181B] font-black px-4 py-2 shadow-[3px_3px_0px_#18181B] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#18181B] active:translate-x-1 active:translate-y-1 active:shadow-[1px_1px_0px_#18181B] dark:border-[#FFFDF7] dark:bg-[#18181B] dark:text-[#FFFDF7] dark:shadow-[3px_3px_0px_#FFFDF7] dark:hover:shadow-[5px_5px_0px_#FFFDF7]"
                  >
                    Batal
                  </button>
                  <NeoButton type="submit" disabled={createEmployeeMutation.isPending}>
                    {createEmployeeMutation.isPending ? 'Memproses...' : 'Daftarkan Staf'}
                  </NeoButton>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Tabel */}
      <NeoCard className="overflow-hidden">
        <div className="border-b-2 border-[#18181B] bg-[#E7D9B8] px-4 py-3 dark:border-[#FFFDF7] dark:bg-[#18181B]">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#18181B] dark:text-[#FFFDF7]" />
            <h3 className="text-sm font-black text-[#18181B] dark:text-[#FFFDF7]">Daftar Hak Akses Aktif</h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-[#18181B] bg-[#7F1D1D] dark:border-[#FFFDF7]">
                <th className="py-2.5 pl-4 pr-2 text-left text-xs font-black uppercase tracking-wider text-[#FFFDF7]">Nama</th>
                <th className="py-2.5 px-2 text-left text-xs font-black uppercase tracking-wider text-[#FFFDF7]">Email</th>
                <th className="py-2.5 px-2 text-left text-xs font-black uppercase tracking-wider text-[#FFFDF7]">Hak Akses</th>
                <th className="py-2.5 px-2 text-left text-xs font-black uppercase tracking-wider text-[#FFFDF7]">Terdaftar</th>
                <th className="py-2.5 pr-4 pl-2 text-right text-xs font-black uppercase tracking-wider text-[#FFFDF7]">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-14 text-center text-sm font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50">
                    Memuat data staf...
                  </td>
                </tr>
              ) : filteredEmployees?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-14 text-center text-sm font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50">
                    Tidak ada data karyawan ditemukan.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp, index) => {
                  const employeeName = emp?.name || 'Staf';
                  const employeeEmail = emp?.email || '-';
                  const employeeRole = emp?.role || '';

                  return (
                    <tr key={emp?.id || `${employeeEmail}-${index}`} className="border-b-2 border-[#18181B]/20 hover:bg-[#C9A227]/10 dark:border-[#FFFDF7]/10 dark:hover:bg-[#C9A227]/20">
                      <td className="py-3 pl-4 pr-2">
                        <div className="flex items-center gap-3">
                          {/* Avatar - Menggunakan foto profile jika ada, fallback ke inisial */}
                          {emp?.avatar ? (
                            <img
                              src={emp.avatar}
                              alt={employeeName}
                              className={`w-8 h-8 border-2 border-[#18181B] object-cover shadow-[2px_2px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[2px_2px_0px_#FFFDF7] ${getAvatarStyle(employeeRole)}`}
                            />
                          ) : (
                            <div className={`w-8 h-8 border-2 border-[#18181B] flex items-center justify-center text-xs font-black shadow-[2px_2px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[2px_2px_0px_#FFFDF7] ${getAvatarStyle(employeeRole)}`}>
                              {employeeName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-black text-sm text-[#18181B] dark:text-[#FFFDF7]">{employeeName}</div>
                            <div className="text-xs font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50">{employeeEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-sm font-bold text-[#18181B]/70 dark:text-[#FFFDF7]/70">
                        {employeeEmail}
                      </td>
                      <td className="py-3 px-2">{getRoleBadge(employeeRole)}</td>
                      <td className="py-3 px-2 text-sm font-bold text-[#18181B]/70 dark:text-[#FFFDF7]/70">
                        {formatSafeDate(emp?.createdAt)}
                      </td>
                      <td className="py-3 pr-4 pl-2 text-right">
                        <button
                          className="border-2 border-[#7F1D1D] bg-[#7F1D1D]/10 px-2 py-1 text-xs font-black text-[#7F1D1D] shadow-[2px_2px_0px_#7F1D1D] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#7F1D1D] active:translate-x-1 active:translate-y-1 active:shadow-[0px_0px_0px_#7F1D1D] dark:border-[#C9A227] dark:bg-[#7F1D1D]/30 dark:text-[#FFFDF7] dark:shadow-[2px_2px_0px_#C9A227] dark:hover:shadow-[4px_4px_0px_#C9A227]"
                          onClick={() => handleDelete(emp.id, employeeName)}
                          disabled={deleteEmployeeMutation.isPending}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </NeoCard>
    </div>
  );
}
