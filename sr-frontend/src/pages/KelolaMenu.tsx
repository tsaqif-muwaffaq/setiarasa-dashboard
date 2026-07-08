import React, { useState } from 'react';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { useGlobalLoading } from '@/components/GlobalLoadingProvider';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Search, UtensilsCrossed, ChefHat, X } from 'lucide-react';

interface Menu {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  imageUrl: string;
}

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

const CATEGORY_COLORS: Record<string, string> = {
  'AYAM & BEBEK': 'border-[#7F1D1D] bg-[#7F1D1D]/10 text-[#7F1D1D] dark:text-[#FFFDF7]',
  'IKAN & LAINNYA': 'border-[#065F46] bg-[#065F46]/10 text-[#065F46] dark:text-[#FFFDF7]',
  'NASI GORENG': 'border-[#C9A227] bg-[#C9A227]/20 text-[#18181B] dark:text-[#C9A227]',
  'MIE, KWETIAU, BIHUN': 'border-[#18181B] bg-[#18181B]/10 text-[#18181B] dark:bg-[#FFFDF7]/10 dark:text-[#FFFDF7]',
  'SAYUR & SOP': 'border-[#065F46] bg-[#065F46]/10 text-[#065F46] dark:text-[#FFFDF7]',
  'MINUMAN': 'border-[#7F1D1D] bg-[#7F1D1D]/10 text-[#7F1D1D] dark:text-[#FFFDF7]',
};

const toSafeNumber = (value: unknown) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

export default function KelolaMenu() {
  const { showLoading, hideLoading } = useGlobalLoading();
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');
  const [imageUrlInput, setImageUrlInput] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: 'AYAM & BEBEK',
    stock: '',
    imageUrl: ''
  });

  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // ── Query Ambil Menu ──
  const { data: menus, isLoading } = useQuery<Menu[]>({
    queryKey: ['menus'],
    queryFn: async () => {
      const isFirstLoad = !queryClient.getQueryData(['menus']);
      if (isFirstLoad) {
        showLoading('Memuat daftar menu...');
      }
      try {
        const res = await axios.get(`${API_URL}/api/menu`, axiosConfig);
        return Array.isArray(res.data?.data) ? res.data.data : [];
      } catch (error) {
        console.error('Gagal memuat menu:', error);
        return [];
      } finally {
        if (!queryClient.getQueryData(['menus'])) {
          setTimeout(() => hideLoading(), 300);
        }
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 20000,
  });

  // ── Mutation Create (File Upload) ──
  const createMutation = useMutation({
    mutationFn: async (payload: FormData) => axios.post(`${API_URL}/api/menu`, payload, axiosConfig),
    onSuccess: () => {
      toast.success('✅ Menu baru berhasil ditambahkan!');
      queryClient.invalidateQueries({ queryKey: ['menus'] });
      closeModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal menambahkan menu');
    }
  });

  // ── Mutation Edit (File Upload) ──
  const editMutation = useMutation({
    mutationFn: async (payload: FormData) => axios.put(`${API_URL}/api/menu/${editingId}`, payload, axiosConfig),
    onSuccess: () => {
      toast.success('✅ Data menu berhasil diperbarui!');
      queryClient.invalidateQueries({ queryKey: ['menus'] });
      closeModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal memperbarui menu');
    }
  });

  // ── Mutation Delete ──
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => axios.delete(`${API_URL}/api/menu/${id}`, axiosConfig),
    onSuccess: () => {
      toast.success('✅ Menu berhasil dihapus!');
      queryClient.invalidateQueries({ queryKey: ['menus'] });
    },
    onError: () => toast.error('Gagal menghapus menu')
  });

  const handleOpenAdd = () => {
    setFormData({ name: '', price: '', category: 'AYAM & BEBEK', stock: '', imageUrl: '' });
    setImageFile(null);
    setImageUrlInput('');
    setUploadMethod('file');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (menu: Menu) => {
    const hasImageUrl = menu.imageUrl && menu.imageUrl.trim() !== '';
    setFormData({
      name: menu.name || '',
      price: String(toSafeNumber(menu.price)),
      category: menu.category || 'AYAM & BEBEK',
      stock: String(toSafeNumber(menu.stock)),
      imageUrl: menu.imageUrl || ''
    });
    setImageUrlInput(menu.imageUrl || '');
    setUploadMethod(hasImageUrl ? 'url' : 'file');
    setEditingId(menu.id);
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ name: '', price: '', category: 'AYAM & BEBEK', stock: '', imageUrl: '' });
    setImageFile(null);
    setImageUrlInput('');
    setUploadMethod('file');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── FIX: handleSubmit dengan support file dan URL ──
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // ── CASE 1: Menggunakan URL ──
    if (uploadMethod === 'url') {
      const url = imageUrlInput.trim();
      if (!url) {
        toast.error('URL gambar wajib diisi!');
        return;
      }
      
      // Validasi URL
      try {
        new URL(url);
      } catch {
        toast.error('URL gambar tidak valid! Pastikan format URL benar.');
        return;
      }

      // Kirim sebagai JSON (bukan FormData)
      const payload = {
        name: formData.name,
        price: Number(formData.price),
        category: formData.category,
        stock: Number(formData.stock),
        imageUrl: url // 👈 Kirim imageUrl ke backend
      };

      showLoading(isEditing ? 'Memperbarui menu...' : 'Menambahkan menu...');

      const request = isEditing
        ? axios.put(`${API_URL}/api/menu/${editingId}`, payload, axiosConfig)
        : axios.post(`${API_URL}/api/menu`, payload, axiosConfig);

      request
        .then(() => {
          toast.success(isEditing ? '✅ Data menu berhasil diperbarui!' : '✅ Menu baru berhasil ditambahkan!');
          queryClient.invalidateQueries({ queryKey: ['menus'] });
          closeModal();
        })
        .catch((err) => {
          console.error('Error:', err);
          toast.error(err.response?.data?.message || 'Gagal memproses menu');
        })
        .finally(() => {
          setTimeout(() => hideLoading(), 300);
        });
      return;
    }

    // ── CASE 2: Upload File ──
    const submitData = new FormData();
    submitData.append('name', formData.name);
    submitData.append('price', formData.price);
    submitData.append('category', formData.category);
    submitData.append('stock', formData.stock);

    if (imageFile) {
      submitData.append('image', imageFile);
    } else if (!isEditing) {
      toast.error('Gambar menu wajib diunggah!');
      return;
    }

    if (isEditing) {
      editMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Yakin ingin menghapus menu "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const safeMenus = Array.isArray(menus)
    ? menus.filter((menu): menu is Menu => Boolean(menu && typeof menu === 'object'))
    : [];
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredMenus = safeMenus.filter(menu =>
    (menu?.name || '').toLowerCase().includes(normalizedSearchTerm)
  );

  const totalMenu = safeMenus.length;
  const stokHabis = safeMenus.filter(m => toSafeNumber(m?.stock) <= 0).length;
  const stokMenipis = safeMenus.filter(m => toSafeNumber(m?.stock) > 0 && toSafeNumber(m?.stock) <= 5).length;

  return (
    <div className="space-y-6 pb-10 bg-[#FFFDF7] dark:bg-[#18181B]">

      {/* Header */}
      <NeoCard className="p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-[#18181B] bg-[#C9A227] shadow-[3px_3px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[3px_3px_0px_#FFFDF7]">
              <ChefHat className="h-5 w-5 text-[#18181B]" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-[#7F1D1D] dark:text-[#C9A227]">
                Setia Rasa · Manajemen Menu
              </p>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#18181B] dark:text-[#FFFDF7]">
                Kelola Menu
              </h1>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 w-full lg:w-auto">
            <div className="flex flex-col items-center justify-center border-2 border-[#18181B] bg-[#FFFDF7] px-4 py-2.5 shadow-[3px_3px_0px_#18181B] dark:border-[#FFFDF7] dark:bg-[#18181B] dark:shadow-[3px_3px_0px_#FFFDF7]">
              <span className="text-xl font-black text-[#18181B] dark:text-[#FFFDF7] leading-none">{totalMenu}</span>
              <span className="text-[11px] font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50 mt-1">Total menu</span>
            </div>
            <div className={`flex flex-col items-center justify-center border-2 px-4 py-2.5 shadow-[3px_3px_0px_#18181B] dark:shadow-[3px_3px_0px_#FFFDF7] ${stokHabis > 0 ? 'border-[#7F1D1D] bg-[#7F1D1D]/10' : 'border-[#18181B] bg-[#FFFDF7] dark:border-[#FFFDF7] dark:bg-[#18181B]'}`}>
              <span className={`text-xl font-black leading-none ${stokHabis > 0 ? 'text-[#7F1D1D]' : 'text-[#18181B] dark:text-[#FFFDF7]'}`}>{stokHabis}</span>
              <span className="text-[11px] font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50 mt-1">Stok habis</span>
            </div>
            <div className={`flex flex-col items-center justify-center border-2 px-4 py-2.5 shadow-[3px_3px_0px_#18181B] dark:shadow-[3px_3px_0px_#FFFDF7] ${stokMenipis > 0 ? 'border-[#C9A227] bg-[#C9A227]/20' : 'border-[#18181B] bg-[#FFFDF7] dark:border-[#FFFDF7] dark:bg-[#18181B]'}`}>
              <span className={`text-xl font-black leading-none ${stokMenipis > 0 ? 'text-[#18181B] dark:text-[#C9A227]' : 'text-[#18181B] dark:text-[#FFFDF7]'}`}>{stokMenipis}</span>
              <span className="text-[11px] font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50 mt-1">Stok menipis</span>
            </div>
          </div>
        </div>
      </NeoCard>

      {/* Bar kontrol */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#18181B]/50 dark:text-[#FFFDF7]/50" />
          <NeoInput
            placeholder="Cari nama menu..."
            className="pl-9 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <NeoButton onClick={handleOpenAdd}>
          <Plus className="w-4 h-4 mr-2 inline" /> Tambah Menu Baru
        </NeoButton>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#18181B]/80 p-4">
          <div className="w-full max-w-md border-4 border-[#18181B] bg-[#FFFDF7] shadow-[12px_12px_0px_#18181B] dark:border-[#FFFDF7] dark:bg-[#18181B] dark:shadow-[12px_12px_0px_#FFFDF7] max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header Modal */}
              <div className="flex items-center justify-between mb-4 border-b-2 border-[#18181B] pb-3 dark:border-[#FFFDF7]">
                <div className="flex items-center gap-2">
                  <UtensilsCrossed className="w-5 h-5 text-[#7F1D1D] dark:text-[#C9A227]" />
                  <h2 className="text-lg font-black text-[#18181B] dark:text-[#FFFDF7]">
                    {isEditing ? 'Edit Data Menu' : 'Tambah Menu Baru'}
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
                  <label className="text-xs font-black uppercase tracking-wider text-[#18181B] dark:text-[#FFFDF7]">Nama Menu</label>
                  <NeoInput required placeholder="Contoh: Ayam Bakar" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-[#18181B] dark:text-[#FFFDF7]">Harga (Rp)</label>
                    <NeoInput required type="number" placeholder="15000" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-[#18181B] dark:text-[#FFFDF7]">Stok Awal</label>
                    <NeoInput required type="number" placeholder="50" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-[#18181B] dark:text-[#FFFDF7]">Kategori</label>
                  <select
                    className="w-full border-2 border-[#18181B] bg-[#FFFDF7] px-3 py-2 text-sm font-bold text-[#18181B] outline-none transition-all focus:shadow-[4px_4px_0px_#7F1D1D] focus:border-[#7F1D1D] dark:border-[#FFFDF7] dark:bg-[#18181B] dark:text-[#FFFDF7] dark:focus:shadow-[4px_4px_0px_#C9A227] dark:focus:border-[#C9A227]"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="AYAM & BEBEK">AYAM & BEBEK</option>
                    <option value="IKAN & LAINNYA">IKAN & LAINNYA</option>
                    <option value="NASI GORENG">NASI GORENG</option>
                    <option value="MIE, KWETIAU, BIHUN">MIE, KWETIAU, BIHUN</option>
                    <option value="SAYUR & SOP">SAYUR & SOP</option>
                    <option value="MINUMAN">MINUMAN</option>
                  </select>
                </div>

                {/* ── Gambar Menu dengan Toggle ── */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-[#18181B] dark:text-[#FFFDF7]">
                    Gambar Menu {isEditing ? '(Opsional)' : ''}
                  </label>
                  
                  {/* Toggle buttons */}
                  <div className="flex gap-2 border-2 border-[#18181B] p-1 dark:border-[#FFFDF7]">
                    <button
                      type="button"
                      onClick={() => setUploadMethod('file')}
                      className={`flex-1 py-1.5 text-xs font-black transition-all ${
                        uploadMethod === 'file'
                          ? 'bg-[#7F1D1D] text-[#FFFDF7] border-2 border-[#18181B] shadow-[3px_3px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[3px_3px_0px_#FFFDF7]'
                          : 'bg-[#FFFDF7] text-[#18181B] hover:bg-[#C9A227]/20 dark:bg-[#18181B] dark:text-[#FFFDF7] dark:hover:bg-[#C9A227]/20'
                      }`}
                    >
                      📁 Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadMethod('url')}
                      className={`flex-1 py-1.5 text-xs font-black transition-all ${
                        uploadMethod === 'url'
                          ? 'bg-[#7F1D1D] text-[#FFFDF7] border-2 border-[#18181B] shadow-[3px_3px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[3px_3px_0px_#FFFDF7]'
                          : 'bg-[#FFFDF7] text-[#18181B] hover:bg-[#C9A227]/20 dark:bg-[#18181B] dark:text-[#FFFDF7] dark:hover:bg-[#C9A227]/20'
                      }`}
                    >
                      🔗 Gunakan Link
                    </button>
                  </div>

                  {/* File Upload */}
                  {uploadMethod === 'file' && (
                    <NeoInput
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                      required={!isEditing}
                      className="py-1 w-full"
                    />
                  )}

                  {/* URL Input */}
                  {uploadMethod === 'url' && (
                    <div className="space-y-1.5">
                      <NeoInput
                        type="url"
                        placeholder="https://example.com/gambar-menu.jpg"
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(e.target.value)}
                        className="w-full"
                        required={!isEditing}
                      />
                      
                    </div>
                  )}

                  {/* Preview link saat edit */}
                  {isEditing && formData.imageUrl && uploadMethod === 'url' && (
                    <div className="mt-1.5 text-xs font-bold text-[#18181B]/70 dark:text-[#FFFDF7]/70 flex items-center gap-2">
                      <span>Gambar saat ini:</span>
                      <a 
                        href={formData.imageUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-[#7F1D1D] dark:text-[#C9A227] hover:underline truncate max-w-[200px]"
                      >
                        {formData.imageUrl}
                      </a>
                    </div>
                  )}
                </div>

                <div className="pt-4 flex justify-end gap-2 border-t-2 border-[#18181B] dark:border-[#FFFDF7]">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="border-2 border-[#18181B] bg-[#FFFDF7] text-[#18181B] font-black px-4 py-2 shadow-[3px_3px_0px_#18181B] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#18181B] active:translate-x-1 active:translate-y-1 active:shadow-[1px_1px_0px_#18181B] dark:border-[#FFFDF7] dark:bg-[#18181B] dark:text-[#FFFDF7] dark:shadow-[3px_3px_0px_#FFFDF7] dark:hover:shadow-[5px_5px_0px_#FFFDF7]"
                  >
                    Batal
                  </button>
                  <NeoButton type="submit" disabled={createMutation.isPending || editMutation.isPending}>
                    {createMutation.isPending || editMutation.isPending ? 'Menyimpan...' : 'Simpan'}
                  </NeoButton>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Daftar Menu */}
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-sm font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50">
          <span className="w-4 h-4 rounded-full border-2 border-[#7F1D1D] border-t-transparent animate-spin dark:border-[#C9A227] dark:border-t-transparent" />
          Memuat data menu...
        </div>
      ) : filteredMenus?.length === 0 ? (
        <div className="text-center py-20 border-4 border-dashed border-[#18181B]/30 dark:border-[#FFFDF7]/30 text-sm font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50 bg-[#FFFDF7] dark:bg-[#18181B]">
          <UtensilsCrossed className="w-8 h-8 mx-auto mb-3 text-[#C9A227]/50" />
          {searchTerm ? `Tidak ada menu yang cocok dengan "${searchTerm}".` : 'Belum ada menu. Tambahkan menu pertama Anda.'}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredMenus.map((menu, index) => {
            const menuName = menu?.name || 'Menu';
            const menuCategory = menu?.category || 'LAINNYA';
            const menuPrice = toSafeNumber(menu?.price);
            const menuStock = toSafeNumber(menu?.stock);

            return (
              <div
                key={menu?.id || `${menuName}-${index}`}
                className={`border-4 border-[#18181B] bg-[#FFFDF7] shadow-[6px_6px_0px_#18181B] transition-all hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[10px_10px_0px_#18181B] dark:border-[#FFFDF7] dark:bg-[#18181B] dark:shadow-[6px_6px_0px_#FFFDF7] dark:hover:shadow-[10px_10px_0px_#FFFDF7] ${menuStock <= 0 ? 'opacity-70' : ''}`}
              >
                <div className="relative">
                  <div className="aspect-square overflow-hidden bg-[#E7D9B8]">
                    <img
                      src={menu?.imageUrl || 'https://via.placeholder.com/300'}
                      alt={menuName}
                      className={`w-full h-full object-cover transition-transform duration-300 hover:scale-105 ${menuStock <= 0 ? 'grayscale opacity-60' : ''}`}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300/FFD700/18181B?text=No+Image';
                      }}
                    />
                    {menuStock <= 0 && (
                      <div className="absolute top-2 right-2 z-10 border-2 border-[#18181B] bg-[#7F1D1D] text-[#FFFDF7] text-[10px] font-black px-2 py-1 shadow-[3px_3px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[3px_3px_0px_#FFFDF7]">
                        HABIS
                      </div>
                    )}
                  </div>

                  {/* Overlay aksi */}
                  <div className="absolute inset-0 bg-[#18181B]/60 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                    <button
                      className="border-2 border-[#18181B] bg-[#FFFDF7] p-2 shadow-[3px_3px_0px_#18181B] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#18181B] active:translate-x-1 active:translate-y-1 active:shadow-[1px_1px_0px_#18181B] dark:border-[#FFFDF7] dark:bg-[#18181B] dark:shadow-[3px_3px_0px_#FFFDF7] dark:hover:shadow-[5px_5px_0px_#FFFDF7]"
                      onClick={() => handleOpenEdit(menu)}
                      title="Edit Menu"
                    >
                      <Pencil className="w-3.5 h-3.5 text-[#18181B] dark:text-[#FFFDF7]" />
                    </button>
                    <button
                      className="border-2 border-[#18181B] bg-[#7F1D1D] p-2 shadow-[3px_3px_0px_#18181B] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#18181B] active:translate-x-1 active:translate-y-1 active:shadow-[1px_1px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[3px_3px_0px_#FFFDF7] dark:hover:shadow-[5px_5px_0px_#FFFDF7]"
                      onClick={() => handleDelete(menu.id, menuName)}
                      title="Hapus Menu"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-[#FFFDF7]" />
                    </button>
                  </div>
                </div>

                <div className="p-3 space-y-2">
                  <div>
                    <h3 className="font-black text-sm line-clamp-1 text-[#18181B] dark:text-[#FFFDF7]">{menuName}</h3>
                    <span className={`inline-block mt-1 text-[10px] font-black px-2 py-0.5 border-2 shadow-[2px_2px_0px_#18181B] dark:shadow-[2px_2px_0px_#FFFDF7] ${CATEGORY_COLORS[menuCategory] || 'border-[#18181B] bg-[#E7D9B8] text-[#18181B]'}`}>
                      {menuCategory}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t-2 border-[#18181B] dark:border-[#FFFDF7]">
                    <p className="text-[#7F1D1D] dark:text-[#C9A227] font-black text-sm">
                      Rp {menuPrice.toLocaleString('id-ID')}
                    </p>
                    <span className={`text-xs font-black px-2 py-0.5 border-2 shadow-[2px_2px_0px_#18181B] dark:shadow-[2px_2px_0px_#FFFDF7] ${menuStock <= 0 ? 'border-[#7F1D1D] bg-[#7F1D1D]/10 text-[#7F1D1D]' : menuStock <= 5 ? 'border-[#C9A227] bg-[#C9A227]/20 text-[#18181B] dark:text-[#C9A227]' : 'border-[#065F46] bg-[#065F46]/10 text-[#065F46]'}`}>
                      {menuStock} stok
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}