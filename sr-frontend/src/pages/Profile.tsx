import { useState, useRef } from 'react';
import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';
import { User, Mail, Lock, Save, AlertCircle, Camera, Phone, BellRing, BellOff, ShieldCheck, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Profile() {
  const { user, token, setAuth } = useAuthStore();
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('sr_notification_sound') !== 'false';
  });

  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    localStorage.setItem('sr_notification_sound', String(newState));
    if (newState) toast.success('🔊 Suara notifikasi diaktifkan');
    else toast.success('🔇 Suara notifikasi dimatikan');
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Ukuran foto maksimal 2MB');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleRemovePhoto = () => {
    setAvatarPreview('');
    setAvatarFile(null);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let finalAvatarUrl = avatarPreview;

      if (avatarFile) {
        toast.loading('📤 Mengunggah foto...', { id: 'upload-toast' });
        const formData = new FormData();
        formData.append('file', avatarFile);
        formData.append('upload_preset', 'setiarasa_avatars');
        
        const cloudinaryRes = await axios.post(
          `https://api.cloudinary.com/v1_1/dt932mybz/image/upload`,
          formData
        );
        finalAvatarUrl = cloudinaryRes.data.secure_url;
        toast.dismiss('upload-toast');
      }

      const response = await axios.put(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/profile`,
        {
          name,
          email,
          phone,
          avatar: finalAvatarUrl,
          oldPassword: oldPassword || undefined,
          newPassword: newPassword || undefined
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('✅ ' + response.data.message);
      
      setAuth(token as string, response.data.data);
      
      setOldPassword('');
      setNewPassword('');
      setAvatarFile(null);

    } catch (error: any) {
      toast.dismiss('upload-toast');
      toast.error(error.response?.data?.message || 'Gagal memperbarui profil.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Komponen Neubrutalism ──
  function NeoCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
      <div className={`border-4 border-[#18181B] bg-[#FFFDF7] shadow-[6px_6px_0px_#18181B] dark:border-[#FFFDF7] dark:bg-[#18181B] dark:shadow-[6px_6px_0px_#FFFDF7] card-lift-premium ${className}`}>
        {children}
      </div>
    );
  }

  function NeoBadge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
      <span className={`inline-flex items-center border-2 border-[#18181B] px-3 py-1 text-xs font-black shadow-[3px_3px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[3px_3px_0px_#FFFDF7] ${className}`}>
        {children}
      </span>
    );
  }

  const getAvatarColor = (role: string) => {
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
      <NeoCard className="p-4 sm:p-6 animate-fade-in-up">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-[#7F1D1D] dark:text-[#C9A227]">
              ⚡ Setia Rasa · Akun
            </p>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#18181B] dark:text-[#FFFDF7]">
              Pengaturan Akun
            </h1>
            <p className="text-sm font-bold text-[#18181B]/70 dark:text-[#FFFDF7]/70 mt-1">
              Kelola identitas, keamanan, dan preferensi sistem Anda.
            </p>
          </div>
          <NeoBadge className="border-[#065F46] text-[#065F46] dark:border-[#34D399] dark:text-[#34D399] animate-pulse-soft-premium">
            <span className="w-2 h-2 rounded-full bg-[#065F46] dark:bg-[#34D399] mr-2 inline-block animate-pulse" />
            Sesi Aktif
          </NeoBadge>
        </div>
      </NeoCard>

      <div className="grid grid-cols-1 xl:grid-cols-7 gap-6">

        {/* ── Kolom Kiri ── */}
        <div className="xl:col-span-2 flex flex-col gap-6">

          {/* Card Profil */}
          <NeoCard className="p-5 animate-fade-in-up-delay-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-[#18181B] bg-[#C9A227] shadow-[3px_3px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[3px_3px_0px_#FFFDF7] hover-scale-bounce">
                <User className="h-4 w-4 text-[#18181B]" />
              </div>
              <h3 className="text-base font-black text-[#18181B] dark:text-[#FFFDF7]">Profil Publik</h3>
            </div>

            <div className="flex flex-col items-center text-center gap-4">
              <div className="relative group">
                <div className="w-24 h-24 border-4 border-[#18181B] bg-[#E7D9B8] overflow-hidden flex items-center justify-center shadow-[4px_4px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[4px_4px_0px_#FFFDF7]">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-[#18181B]/50" />
                  )}
                </div>
                
                <div className="absolute -bottom-3 left-0 right-0 flex justify-between px-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 border-2 border-[#18181B] bg-[#7F1D1D] text-[#FFFDF7] shadow-[2px_2px_0px_#18181B] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#18181B] active:translate-x-1 active:translate-y-1 active:shadow-[1px_1px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[2px_2px_0px_#FFFDF7] dark:hover:shadow-[4px_4px_0px_#FFFDF7] hover-scale-bounce"
                    title="Ubah foto"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                  
                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="p-1.5 border-2 border-[#18181B] bg-[#7F1D1D] text-[#FFFDF7] shadow-[2px_2px_0px_#18181B] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#18181B] active:translate-x-1 active:translate-y-1 active:shadow-[1px_1px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[2px_2px_0px_#FFFDF7] dark:hover:shadow-[4px_4px_0px_#FFFDF7] hover-scale-bounce"
                      title="Hapus foto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoChange}
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                />
              </div>

              <div>
                <NeoBadge className={`border-2 ${getAvatarColor(user?.role || '')}`}>
                  {user?.role}
                </NeoBadge>
                <p className="text-[10px] font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50 mt-2">
                  Format: JPG, PNG, WEBP. Maks 2MB.
                </p>
              </div>

              <div className="w-full border-t-2 border-[#18181B] pt-4 space-y-2 text-left dark:border-[#FFFDF7]">
                <div className="flex items-center gap-2 text-xs font-bold text-[#18181B]/70 dark:text-[#FFFDF7]/70">
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{user?.email}</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#18181B]/70 dark:text-[#FFFDF7]/70">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>Autentikasi aktif</span>
                </div>
              </div>
            </div>
          </NeoCard>

          {/* Preferensi */}
          <NeoCard className="p-5 animate-fade-in-up-delay-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-[#18181B] bg-[#C9A227] shadow-[3px_3px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[3px_3px_0px_#FFFDF7] hover-scale-bounce">
                {soundEnabled ? <BellRing className="h-4 w-4 text-[#18181B]" /> : <BellOff className="h-4 w-4 text-[#18181B]" />}
              </div>
              <h3 className="text-base font-black text-[#18181B] dark:text-[#FFFDF7]">Preferensi Lokal</h3>
            </div>

            <div className="flex items-center justify-between border-2 border-[#18181B] p-3 dark:border-[#FFFDF7]">
              <div>
                <p className="font-black text-sm text-[#18181B] dark:text-[#FFFDF7]">Suara Notifikasi</p>
                <p className="text-xs font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50">Ting tong pesanan masuk</p>
              </div>
              <button
                type="button"
                onClick={toggleSound}
                className={`p-2 border-2 border-[#18181B] transition-all active:translate-x-1 active:translate-y-1 active:shadow-[1px_1px_0px_#18181B] dark:border-[#FFFDF7] hover-scale-bounce ${
                  soundEnabled
                    ? 'bg-[#065F46] text-[#FFFDF7] shadow-[3px_3px_0px_#18181B] dark:shadow-[3px_3px_0px_#FFFDF7]'
                    : 'bg-[#FFFDF7] text-[#18181B] shadow-[3px_3px_0px_#18181B] dark:bg-[#18181B] dark:text-[#FFFDF7] dark:shadow-[3px_3px_0px_#FFFDF7]'
                }`}
              >
                {soundEnabled ? <BellRing className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-[10px] font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50 mt-2 text-center">
              *Pengaturan ini hanya berlaku di perangkat ini.
            </p>
          </NeoCard>

        </div>

        {/* ── Kolom Kanan: Form ── */}
        <NeoCard className="xl:col-span-5 p-5 animate-fade-in-up-delay-3">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-[#18181B] bg-[#C9A227] shadow-[3px_3px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[3px_3px_0px_#FFFDF7] hover-scale-bounce">
              <Lock className="h-4 w-4 text-[#18181B]" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#18181B] dark:text-[#FFFDF7]">Data & Keamanan</h3>
              <p className="text-xs font-bold text-[#18181B]/50 dark:text-[#FFFDF7]/50">Perbarui identitas, kontak, dan kata sandi</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-5 mt-2">

            {/* Nama */}
            <div className="space-y-1.5 animate-slide-left-1">
              <label className="text-xs font-black uppercase tracking-wider text-[#18181B] dark:text-[#FFFDF7]">
                Nama Lengkap
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#18181B]/50 dark:text-[#FFFDF7]/50" />
                <input
                  type="text"
                  required
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-[#18181B] bg-[#FFFDF7] focus:shadow-[4px_4px_0px_#7F1D1D] focus:border-[#7F1D1D] outline-none text-sm font-bold text-[#18181B] transition-all dark:border-[#FFFDF7] dark:bg-[#18181B] dark:text-[#FFFDF7] dark:focus:shadow-[4px_4px_0px_#C9A227] dark:focus:border-[#C9A227]"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            {/* Email & Telepon */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-left-2">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-[#18181B] dark:text-[#FFFDF7]">
                  Alamat Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#18181B]/50 dark:text-[#FFFDF7]/50" />
                  <input
                    type="email"
                    required
                    className="w-full pl-10 pr-4 py-2.5 border-2 border-[#18181B] bg-[#FFFDF7] focus:shadow-[4px_4px_0px_#7F1D1D] focus:border-[#7F1D1D] outline-none text-sm font-bold text-[#18181B] transition-all dark:border-[#FFFDF7] dark:bg-[#18181B] dark:text-[#FFFDF7] dark:focus:shadow-[4px_4px_0px_#C9A227] dark:focus:border-[#C9A227]"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-[#18181B] dark:text-[#FFFDF7]">
                  Nomor WhatsApp
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#18181B]/50 dark:text-[#FFFDF7]/50" />
                  <input
                    type="tel"
                    className="w-full pl-10 pr-4 py-2.5 border-2 border-[#18181B] bg-[#FFFDF7] focus:shadow-[4px_4px_0px_#7F1D1D] focus:border-[#7F1D1D] outline-none text-sm font-bold text-[#18181B] transition-all dark:border-[#FFFDF7] dark:bg-[#18181B] dark:text-[#FFFDF7] dark:focus:shadow-[4px_4px_0px_#C9A227] dark:focus:border-[#C9A227] placeholder:text-[#18181B]/40 dark:placeholder:text-[#FFFDF7]/40"
                    placeholder="08123456789"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Keamanan */}
            <div className="border-t-2 border-[#18181B] pt-5 dark:border-[#FFFDF7] animate-slide-left-3">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-[#18181B] bg-[#C9A227] shadow-[2px_2px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[2px_2px_0px_#FFFDF7] hover-scale-bounce">
                  <Lock className="h-3.5 w-3.5 text-[#18181B]" />
                </div>
                <p className="text-sm font-black text-[#18181B] dark:text-[#FFFDF7]">Keamanan Akun</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-[#18181B] dark:text-[#FFFDF7]">
                    Sandi Lama
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#18181B]/50 dark:text-[#FFFDF7]/50" />
                    <input
                      type="password"
                      className="w-full pl-10 pr-4 py-2.5 border-2 border-[#18181B] bg-[#FFFDF7] focus:shadow-[4px_4px_0px_#7F1D1D] focus:border-[#7F1D1D] outline-none text-sm font-bold text-[#18181B] transition-all dark:border-[#FFFDF7] dark:bg-[#18181B] dark:text-[#FFFDF7] dark:focus:shadow-[4px_4px_0px_#C9A227] dark:focus:border-[#C9A227] placeholder:text-[#18181B]/40 dark:placeholder:text-[#FFFDF7]/40"
                      placeholder="Ketik untuk mengubah sandi"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-[#18181B] dark:text-[#FFFDF7]">
                    Sandi Baru
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#18181B]/50 dark:text-[#FFFDF7]/50" />
                    <input
                      type="password"
                      className="w-full pl-10 pr-4 py-2.5 border-2 border-[#18181B] bg-[#FFFDF7] focus:shadow-[4px_4px_0px_#7F1D1D] focus:border-[#7F1D1D] outline-none text-sm font-bold text-[#18181B] transition-all dark:border-[#FFFDF7] dark:bg-[#18181B] dark:text-[#FFFDF7] dark:focus:shadow-[4px_4px_0px_#C9A227] dark:focus:border-[#C9A227] placeholder:text-[#18181B]/40 dark:placeholder:text-[#FFFDF7]/40"
                      placeholder="Kosongkan jika tidak diubah"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="flex gap-3 items-start border-2 border-[#18181B] p-3 dark:border-[#FFFDF7] animate-slide-left-4">
              <AlertCircle className="w-4 h-4 text-[#18181B]/50 dark:text-[#FFFDF7]/50 shrink-0 mt-0.5" />
              <p className="text-xs font-bold text-[#18181B]/70 dark:text-[#FFFDF7]/70 leading-relaxed">
                Pastikan nomor WhatsApp aktif untuk kebutuhan komunikasi tim. Kosongkan kolom sandi jika Anda tidak ingin mengubah keamanan akun Anda.
              </p>
            </div>

            {/* Submit */}
            <div className="pt-2 border-t-2 border-[#18181B] dark:border-[#FFFDF7]">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto sm:float-right border-4 border-[#18181B] bg-[#7F1D1D] text-[#FFFDF7] font-black py-3 px-7 shadow-[6px_6px_0px_#18181B] transition-all hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[10px_10px_0px_#18181B] active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0px_#18181B] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 dark:border-[#FFFDF7] dark:shadow-[6px_6px_0px_#FFFDF7] dark:hover:shadow-[10px_10px_0px_#FFFDF7] flex items-center justify-center gap-2 text-sm card-lift-premium"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-[#FFFDF7] border-t-transparent animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Simpan Perubahan
                  </>
                )}
              </button>
            </div>

          </form>
        </NeoCard>

      </div>
    </div>
  );
}