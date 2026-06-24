import React, { useState } from 'react';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';
import { Plus, Trash2, Image as ImageIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// Tipe Data Menu
interface Menu {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  imageUrl: string;
}

export default function KelolaMenu() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // State Form
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState('');
  const [image, setImage] = useState<File | null>(null);

  // Konfigurasi Axios dengan Token
  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` },
  };

  // 1. Fetch Data Menu (Otomatis Caching)
  const { data: menus, isLoading } = useQuery<Menu[]>({
    queryKey: ['menus'],
    queryFn: async () => {
      const res = await axios.get('http://localhost:5000/api/menu', axiosConfig);
      return res.data.data;
    },
  });

  // 2. Mutasi Tambah Menu (Upload Foto)
  const addMenuMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await axios.post('http://localhost:5000/api/menu', formData, {
        headers: {
          ...axiosConfig.headers,
          'Content-Type': 'multipart/form-data', // Wajib untuk upload file
        },
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Menu baru berhasil ditambahkan!');
      queryClient.invalidateQueries({ queryKey: ['menus'] }); // Refresh tabel otomatis
      setIsDialogOpen(false); // Tutup modal
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal menambahkan menu');
    },
  });

  // 3. Mutasi Hapus Menu
  const deleteMenuMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`http://localhost:5000/api/menu/${id}`, axiosConfig);
    },
    onSuccess: () => {
      toast.success('Menu berhasil dihapus!');
      queryClient.invalidateQueries({ queryKey: ['menus'] });
    },
  });

  const resetForm = () => {
    setName(''); setPrice(''); setCategory(''); setStock(''); setImage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) {
      toast.error('Foto makanan wajib diunggah!');
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('price', price);
    formData.append('category', category);
    formData.append('stock', stock);
    formData.append('image', image); // Memasukkan file gambar

    addMenuMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Kelola Menu</h1>
          <p className="text-sm text-muted-foreground">Manajemen daftar makanan, harga, dan stok.</p>
        </div>

        {/* Modal Tambah Menu */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Menu
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Tambah Menu Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Menu</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Misal: Nasi Goreng Spesial" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Harga (Rp)</Label>
                  <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Stok Awal</Label>
                  <Input id="stock" type="number" value={stock} onChange={(e) => setStock(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Kategori</Label>
                <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} required placeholder="Misal: Makanan Utama" />
              </div>
              <div className="space-y-2 border-2 border-dashed border-border rounded-lg p-4 text-center">
                <Label htmlFor="image" className="cursor-pointer flex flex-col items-center justify-center gap-2">
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Klik untuk upload foto menu</span>
                  <span className="text-xs text-primary font-medium">{image ? image.name : 'Belum ada file'}</span>
                </Label>
                <Input id="image" type="file" accept="image/*" className="hidden" onChange={(e) => setImage(e.target.files?.[0] || null)} />
              </div>
              <Button type="submit" className="w-full" disabled={addMenuMutation.isPending}>
                {addMenuMutation.isPending ? 'Menyimpan...' : 'Simpan Menu'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabel Data Menu */}
      <div className="border rounded-lg bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
            <TableRow>
              <TableHead className="w-[100px]">Foto</TableHead>
              <TableHead>Nama Menu</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Harga</TableHead>
              <TableHead>Stok</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10">Memuat data...</TableCell></TableRow>
            ) : menus?.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Belum ada menu yang ditambahkan.</TableCell></TableRow>
            ) : (
              menus?.map((menu) => (
                <TableRow key={menu.id}>
                  <TableCell>
                    <img src={menu.imageUrl} alt={menu.name} className="w-12 h-12 rounded-md object-cover border" />
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{menu.name}</TableCell>
                  <TableCell>{menu.category}</TableCell>
                  <TableCell>Rp {menu.price.toLocaleString('id-ID')}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${menu.stock > 10 ? 'bg-accent/20 text-accent' : 'bg-destructive/20 text-destructive'}`}>
                      {menu.stock} Tersedia
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        if (confirm(`Yakin ingin menghapus ${menu.name}?`)) {
                          deleteMenuMutation.mutate(menu.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}