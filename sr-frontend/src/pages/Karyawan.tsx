// Karyawan.tsx - Fully Responsive Mobile Friendly
import { useState } from 'react';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { useGlobalLoading } from '@/components/GlobalLoadingProvider';
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

function NeoCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`border-4 border-[#18181B] dark:border-[#FFFDF7] bg-[#FFFDF7] dark:bg-[#18181B] shadow-[6px_6px_0px_#18181B] dark:shadow-[6px_6px_0px_#FFFDF7] border-glow-animated ${className}`}>
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
      className={`border-4 border-[#18181B] dark:border-[#FFFDF7] bg-[#7F1D1D] dark:bg-[#7F1D1D] text-[#FFFDF7] dark:text-[#FFFDF7] font-black px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm shadow-[4px_4px_0px_#18181B] sm:shadow-[6px_6px_0px_#18181B] dark:shadow-[4px_4px_0px_#FFFDF7] sm:dark:shadow-[6px_6px_0px_#FFFDF7] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#18181B] sm:hover:shadow-[10px_10px_0px_#18181B] dark:hover:shadow-[6px_6px_0px_#FFFDF7] sm:dark:hover:shadow-[10px_10px_0px_#FFFDF7] active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0px_#18181B] dark:active:shadow-[2px_2px_0px_#FFFDF7] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 ripple-button font-dm-sans ${className}`}
    >
      {children}
    </button>
  );
}

function NeoInput({ className = '', ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      className={`w-full border-2 border-[#18181B] dark:border-[#FFFDF7] bg-[#FFFDF7] dark:bg-[#18181B] px-3 py-2 text-xs sm:text-sm font-bold text-[#18181B] dark:text-[#FFFDF7] outline-none transition-all focus:shadow-[4px_4px_0px_#7F1D1D] dark:focus:shadow-[4px_4px_0px_#C9A227] focus:border-[#7F1D1D] dark:focus:border-[#C9A227] placeholder:text-[#18181B]/40 dark:placeholder:text-[#FFFDF7]/40 font-dm-sans ${className}`}
      {...props}
    />
  );
}

function NeoSelect({ className = '', children, ...props }: React.ComponentProps<'select'> & { children: React.ReactNode }) {
  return (
    <select
      className={`w-full border-2 border-[#18181B] dark:border-[#FFFDF7] bg-[#FFFDF7] dark:bg-[#18181B] px-3 py-2 text-xs sm:text-sm font-bold text-[#18181B] dark:text-[#FFFDF7] outline-none transition-all focus:shadow-[4px_4px_0px_#7F1D1D] dark:focus:shadow-[4px_4px_0px_#C9A227] focus:border-[#7F1D1D] dark:focus:border-[#C9A227] font-dm-sans appearance-none ${className}`}
      {...props}
    >
      {children}
    </select>
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
  const { showLoading, hideLoading } = useGlobalLoading();
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
    const isFirstLoad = !queryClient.getQueryData(['employees']);
    if (isFirstLoad) {
      showLoading('Memuat data karyawan...');
    }
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users`, axiosConfig);
      return Array.isArray(res.data?.data) ? res.data.data : [];
    } catch (error) {
      console.error('Gagal memuat data karyawan:', error);
      return [];
    } finally {
      if (!queryClient.getQueryData(['employees'])) {
        setTimeout(() => hideLoading(), 300);
      }
    }
  },
  refetchOnWindowFocus: false,
  staleTime: 30000,
});

  const createEmployeeMutation = useMutation({
    mutationFn: async (payload: typeof formData) =>
      axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users`, payload, axiosConfig),
    onSuccess: (res) => {
      toast.success(res.data.message || 'Akun karyawan berhasil dibuat!');
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
      toast.success('Akun karyawan berhasil dihapus!');
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
    <div className="space-y-4 sm:space-y-6 pb-10 bg-[#FFFDF7] dark:bg-[#18181B] px-3 sm:px-0">

      {/* Header - Responsive */}
      <NeoCard className="p-4 sm:p-6 corner-accent-animated">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-4">
          <div className="w-full sm:w-auto">
            <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#7F1D1D] dark:text-[#C9A227] font-jetbrains">
              Setia Rasa · Staff Management
            </p>
            <h1 className="text-lg sm:text-2xl font-black tracking-tight text-gradient font-space">
              Kelola Karyawan
            </h1>
            <p className="text-xs sm:text-sm font-bold text-[#18181B]/70 dark:text-[#FFFDF7]/70 mt-0.5 sm:mt-1 font-dm-sans">
              Daftarkan dan atur hak akses akun staf restoran Anda.
            </p>
          </div>

          <NeoButton onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto justify-center text-xs sm:text-sm">
            <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 inline" /> 
            <span>Tambah Karyawan</span>
          </NeoButton>
        </div>
        <div className="decorative-line mt-3 sm:mt-4" />
      </NeoCard>

      {/* Summary Pills - Responsive wrap */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 border-2 border-[#18181B] bg-[#FFFDF7] px-2 sm:px-3 py-1 sm:py-1.5 shadow-[2px_2px_0px_#18181B] sm:shadow-[3px_3px_0px_#18181B] dark:border-[#FFFDF7] dark:bg-[#18181B] dark:shadow-[2px_2px_0px_#FFFDF7] sm:dark:shadow-[3px_3px_0px_#FFFDF7] border-glow-animated">
          <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#7F1D1D] dark:text-[#C9A227]" />
          <span className="text-[10px] sm:text-xs font-black text-[#18181B] dark:text-[#FFFDF7] font-jetbrains">{safeEmployees.length} Total</span>
        </div>
        {totalOwner > 0 && (
          <div className="flex items-center gap-1.5 sm:gap-2 border-2 border-[#7F1D1D] bg-[#7F1D1D]/10 px-2 sm:px-3 py-1 sm:py-1.5 shadow-[2px_2px_0px_#18181B] sm:shadow-[3px_3px_0px_#18181B] dark:border-[#C9A227] dark:bg-[#7F1D1D]/30 dark:shadow-[2px_2px_0px_#FFFDF7] sm:dark:shadow-[3px_3px_0px_#FFFDF7] border-glow-animated">
            <Shield className="w-3 h-3 sm:w-3 sm:h-3 text-[#7F1D1D] dark:text-[#C9A227]" />
            <span className="text-[10px] sm:text-xs font-black text-[#7F1D1D] dark:text-[#FFFDF7] font-jetbrains">{totalOwner}</span>
          </div>
        )}
        {totalKasir > 0 && (
          <div className="flex items-center gap-1.5 sm:gap-2 border-2 border-[#065F46] bg-[#065F46]/10 px-2 sm:px-3 py-1 sm:py-1.5 shadow-[2px_2px_0px_#18181B] sm:shadow-[3px_3px_0px_#18181B] dark:border-[#34D399] dark:bg-[#065F46]/30 dark:shadow-[2px_2px_0px_#FFFDF7] sm:dark:shadow-[3px_3px_0px_#FFFDF7] border-glow-animated">
            <Store className="w-3 h-3 sm:w-3 h-3 text-[#065F46] dark:text-[#34D399]" />
            <span className="text-[10px] sm:text-xs font-black text-[#065F46] dark:text-[#34D399] font-jetbrains">{totalKasir}</span>
          </div>
        )}
        {totalDapur > 0 && (
          <div className="flex items-center gap-1.5 sm:gap-2 border-2 border-[#C9A227] bg-[#C9A227]/20 px-2 sm:px-3 py-1 sm:py-1.5 shadow-[2px_2px_0px_#18181B] sm:shadow-[3px_3px_0px_#18181B] dark:border-[#C9A227] dark:bg-[#C9A227]/20 dark:shadow-[2px_2px_0px_#FFFDF7] sm:dark:shadow-[3px_3px_0px_#FFFDF7] border-glow-animated">
            <ChefHat className="w-3 h-3 sm:w-3 h-3 text-[#18181B] dark:text-[#C9A227]" />
            <span className="text-[10px] sm:text-xs font-black text-[#18181B] dark:text-[#C9A227] font-jetbrains">{totalDapur}</span>
          </div>
        )}
      </div>

      {/* Search - Responsive */}
      <div className="relative w-full sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#18181B]/50 dark:text-[#FFFDF7]/50" />
        <NeoInput
          placeholder="Cari nama atau email staf..."
          className="pl-8 sm:pl-9 w-full text-xs sm:text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Tabel - Responsive dengan scroll horizontal */}
      <NeoCard className="overflow-hidden">
        <div className="border-b-2 border-[#18181B] bg-[#E7D9B8] px-3 sm:px-4 py-2 sm:py-3 dark:border-[#FFFDF7] dark:bg-[#18181B]">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#18181B] dark:text-[#FFFDF7] animate-float" />
            <h3 className="text-xs sm:text-sm font-black text-[#18181B] dark:text-[#FFFDF7] font-space">Daftar Hak Akses Aktif</h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm min-w-[650px]">
            <thead>
              <tr className="border-b-2 border-[#18181B] bg-[#7F1D1D] dark:border-[#FFFDF7]">
                <th className="py-1.5 sm:py-2.5 pl-2 sm:pl-4 pr-1 sm:pr-2 text-left text-[9px] sm:text-xs font-black uppercase tracking-wider text-[#FFFDF7] dark:text-[#FFFDF7] font-jetbrains">Nama</th>
                <th className="py-1.5 sm:py-2.5 px-1 sm:px-2 text-left text-[9px] sm:text-xs font-black uppercase tracking-wider text-[#FFFDF7] font-jetbrains hidden sm:table-cell">Email</th>
                <th className="py-1.5 sm:py-2.5 px-1 sm:px-2 text-left text-[9px] sm:text-xs font-black uppercase tracking-wider text-[#FFFDF7] font-jetbrains">Role</th>
                <th className="py-1.5 sm:py-2.5 px-1 sm:px-2 text-left text-[9px] sm:text-xs font-black uppercase tracking-wider text-[#FFFDF7] font-jetbrains hidden sm:table-cell">Terdaftar</th>
                <th className="py-1.5 sm:py-2.5 pr-2 sm:pr-4 pl-1 sm:pl-2 text-right text-[9px] sm:text-xs font-black uppercase tracking-wider text-[#FFFDF7] font-jetbrains">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-10 sm:py-14 text-center text-xs sm:text-sm font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50 font-dm-sans">
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-[#7F1D1D] border-t-transparent rounded-full animate-spin dark:border-[#C9A227] dark:border-t-transparent" />
                      Memuat data staf...
                    </div>
                  </td>
                </tr>
              ) : filteredEmployees?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 sm:py-14 text-center text-xs sm:text-sm font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50 font-dm-sans">
                    {searchTerm ? `Tidak ada hasil untuk "${searchTerm}"` : 'Tidak ada data karyawan ditemukan.'}
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp, index) => {
                  const employeeName = emp?.name || 'Staf';
                  const employeeEmail = emp?.email || '-';
                  const employeeRole = emp?.role || '';

                  return (
                    <tr key={emp?.id || `${employeeEmail}-${index}`} className="border-b-2 border-[#18181B]/20 hover:bg-[#C9A227]/10 dark:border-[#FFFDF7]/10 dark:hover:bg-[#C9A227]/20 table-row-hover-animated">
                      <td className="py-2 sm:py-3 pl-2 sm:pl-4 pr-1 sm:pr-2">
                        <div className="flex items-center gap-2 sm:gap-3">
                          {/* Avatar - Responsive size */}
                          {emp?.avatar ? (
                            <img
                              src={emp.avatar}
                              alt={employeeName}
                              className={`w-7 h-7 sm:w-8 sm:h-8 border-2 border-[#18181B] object-cover shadow-[2px_2px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[2px_2px_0px_#FFFDF7] ${getAvatarStyle(employeeRole)} avatar-glow rounded-sm flex-shrink-0`}
                            />
                          ) : (
                            <div className={`w-7 h-7 sm:w-8 sm:h-8 border-2 border-[#18181B] flex items-center justify-center text-[10px] sm:text-xs font-black shadow-[2px_2px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[2px_2px_0px_#FFFDF7] ${getAvatarStyle(employeeRole)} font-jetbrains flex-shrink-0`}>
                              {employeeName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-black text-xs sm:text-sm text-[#18181B] dark:text-[#FFFDF7] font-space truncate max-w-[80px] sm:max-w-none">
                              {employeeName}
                            </div>
                            <div className="text-[10px] sm:text-xs font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50 font-dm-sans sm:hidden truncate max-w-[80px]">
                              {employeeEmail}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 sm:py-3 px-1 sm:px-2 text-xs sm:text-sm font-bold text-[#18181B]/70 dark:text-[#FFFDF7]/70 font-dm-sans hidden sm:table-cell truncate max-w-[120px]">
                        {employeeEmail}
                      </td>
                      <td className="py-2 sm:py-3 px-1 sm:px-2">
                        {getRoleBadge(employeeRole)}
                      </td>
                      <td className="py-2 sm:py-3 px-1 sm:px-2 text-xs sm:text-sm font-bold text-[#18181B]/70 dark:text-[#FFFDF7]/70 font-jetbrains hidden sm:table-cell whitespace-nowrap">
                        {formatSafeDate(emp?.createdAt)}
                      </td>
                      <td className="py-2 sm:py-3 pr-2 sm:pr-4 pl-1 sm:pl-2 text-right">
                        <button
                          className="border-2 border-[#7F1D1D] bg-[#7F1D1D]/10 px-1.5 sm:px-2 py-1 text-xs font-black text-[#7F1D1D] shadow-[2px_2px_0px_#7F1D1D] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#7F1D1D] active:translate-x-1 active:translate-y-1 active:shadow-[0px_0px_0px_#7F1D1D] dark:border-[#C9A227] dark:bg-[#7F1D1D]/30 dark:text-[#FFFDF7] dark:shadow-[2px_2px_0px_#C9A227] dark:hover:shadow-[4px_4px_0px_#C9A227] hover-scale-bounce flex-shrink-0"
                          onClick={() => handleDelete(emp.id, employeeName)}
                          disabled={deleteEmployeeMutation.isPending}
                          aria-label={`Hapus ${employeeName}`}
                        >
                          <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Tabel - Responsive */}
        {!isLoading && filteredEmployees?.length > 0 && (
          <div className="border-t-2 border-[#18181B] bg-[#E7D9B8] px-3 sm:px-4 py-1.5 sm:py-2 dark:border-[#FFFDF7] dark:bg-[#18181B]">
            <p className="text-[10px] sm:text-xs font-bold text-[#18181B] dark:text-[#FFFDF7] font-dm-sans">
              Menampilkan {filteredEmployees.length} dari {safeEmployees.length} karyawan
            </p>
          </div>
        )}
      </NeoCard>

      {/* Modal Tambah Karyawan - Fully Responsive */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#18181B]/80 p-3 sm:p-4 backdrop-blur-sm animate-fade-in-up">
          <div className="w-full max-w-md border-4 border-[#18181B] bg-[#FFFDF7] shadow-[8px_8px_0px_#18181B] sm:shadow-[12px_12px_0px_#18181B] dark:border-[#FFFDF7] dark:bg-[#18181B] dark:shadow-[8px_8px_0px_#FFFDF7] sm:dark:shadow-[12px_12px_0px_#FFFDF7] max-h-[92vh] overflow-y-auto corner-accent-animated">
            <div className="p-4 sm:p-6">
              {/* Header Modal */}
              <div className="flex items-center justify-between mb-3 sm:mb-4 border-b-2 border-[#18181B] pb-2 sm:pb-3 dark:border-[#FFFDF7]">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-[#7F1D1D] dark:text-[#C9A227] animate-float flex-shrink-0" />
                  <h2 className="text-sm sm:text-lg font-black text-[#18181B] dark:text-[#FFFDF7] font-space truncate">
                    Buat Akun Staf
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="border-2 border-[#18181B] bg-[#FFFDF7] p-1 sm:p-1.5 shadow-[2px_2px_0px_#18181B] sm:shadow-[3px_3px_0px_#18181B] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#18181B] sm:hover:shadow-[5px_5px_0px_#18181B] active:translate-x-1 active:translate-y-1 active:shadow-[1px_1px_0px_#18181B] dark:border-[#FFFDF7] dark:bg-[#18181B] dark:shadow-[2px_2px_0px_#FFFDF7] sm:dark:shadow-[3px_3px_0px_#FFFDF7] dark:hover:shadow-[3px_3px_0px_#FFFDF7] sm:dark:hover:shadow-[5px_5px_0px_#FFFDF7] hover-scale-bounce flex-shrink-0"
                  aria-label="Tutup modal"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-[#18181B] dark:text-[#FFFDF7]" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <div className="space-y-1 sm:space-y-1.5">
                  <label className="block text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#18181B] dark:text-[#FFFDF7] font-jetbrains">
                    Nama Lengkap <span className="text-[#7F1D1D] dark:text-[#C9A227]">*</span>
                  </label>
                  <NeoInput
                    required
                    placeholder="Contoh: Ahmad Budi"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="text-xs sm:text-sm"
                  />
                </div>

                <div className="space-y-1 sm:space-y-1.5">
                  <label className="block text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#18181B] dark:text-[#FFFDF7] font-jetbrains">
                    Email Akun <span className="text-[#7F1D1D] dark:text-[#C9A227]">*</span>
                  </label>
                  <NeoInput
                    required
                    type="email"
                    placeholder="budi@setiarasa.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="text-xs sm:text-sm"
                  />
                </div>

                <div className="space-y-1 sm:space-y-1.5">
                  <label className="block text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#18181B] dark:text-[#FFFDF7] font-jetbrains">
                    Password Akses <span className="text-[#7F1D1D] dark:text-[#C9A227]">*</span>
                  </label>
                  <NeoInput
                    required
                    type="password"
                    placeholder="Minimal 8 karakter"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="text-xs sm:text-sm"
                  />
                </div>

                <div className="space-y-1 sm:space-y-1.5">
                  <label className="block text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#18181B] dark:text-[#FFFDF7] font-jetbrains">
                    Hak Akses (Role) <span className="text-[#7F1D1D] dark:text-[#C9A227]">*</span>
                  </label>
                  <NeoSelect
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="text-xs sm:text-sm"
                  >
                    <option value="KASIR">KASIR — Akses POS & Menu</option>
                    <option value="DAPUR">DAPUR — Layar KDS Koki</option>
                    <option value="OWNER">OWNER — Akses Penuh Sistem</option>
                  </NeoSelect>
                  <p className="text-[10px] sm:text-xs font-bold text-[#18181B]/40 dark:text-[#FFFDF7]/40 mt-0.5 font-dm-sans">
                    Pilih sesuai dengan tanggung jawab staf
                  </p>
                </div>

                <div className="pt-3 sm:pt-4 flex flex-col sm:flex-row justify-end gap-2 border-t-2 border-[#18181B] dark:border-[#FFFDF7]">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="w-full sm:w-auto order-2 sm:order-1 border-2 border-[#18181B] bg-[#FFFDF7] text-[#18181B] font-black px-4 py-2 text-xs sm:text-sm shadow-[2px_2px_0px_#18181B] sm:shadow-[3px_3px_0px_#18181B] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#18181B] sm:hover:shadow-[5px_5px_0px_#18181B] active:translate-x-1 active:translate-y-1 active:shadow-[1px_1px_0px_#18181B] dark:border-[#FFFDF7] dark:bg-[#18181B] dark:text-[#FFFDF7] dark:shadow-[2px_2px_0px_#FFFDF7] sm:dark:shadow-[3px_3px_0px_#FFFDF7] dark:hover:shadow-[3px_3px_0px_#FFFDF7] sm:dark:hover:shadow-[5px_5px_0px_#FFFDF7] font-dm-sans"
                  >
                    Batal
                  </button>
                  <NeoButton 
                    type="submit" 
                    disabled={createEmployeeMutation.isPending}
                    className="w-full sm:w-auto order-1 sm:order-2 justify-center text-xs sm:text-sm"
                  >
                    {createEmployeeMutation.isPending ? (
                      <>
                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2" />
                        Memproses...
                      </>
                    ) : (
                      'Daftarkan Staf'
                    )}
                  </NeoButton>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}