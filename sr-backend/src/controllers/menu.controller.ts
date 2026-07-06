import { Request, Response } from 'express';
import cloudinary from '../config/cloudinary';
import prisma from '../lib/prisma';

// ------------------------------------------------------------------
// FIX: Buat interface khusus agar TypeScript mengenali properti 'file'
// ------------------------------------------------------------------
interface MulterRequest extends Request {
  file?: any;
}

// --- 1. Fungsi Tambah Menu (Upload Foto + Simpan Data) ---
// Perhatikan: parameter req sekarang menggunakan tipe MulterRequest
export const createMenu = async (req: MulterRequest, res: Response): Promise<void> => {
  try {
    const { name, description, price, category, stock } = req.body;
    
    // Cek apakah ada file foto yang dikirim
    if (!req.file) {
      res.status(400).json({ success: false, message: 'Gambar menu wajib diunggah!' });
      return;
    }

    // Karena kita pakai memoryStorage, kita kirim data buffer langsung ke Cloudinary
    const uploadResult: any = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'setiarasa_menu' }, // Akan membuat folder otomatis di Cloudinary
        (error, result) => {
          if (result) resolve(result);
          else reject(error);
        }
      );
      // Tembakkan buffer foto. req.file sekarang aman dari error TypeScript
      stream.end(req.file.buffer); 
    });

    // Ambil URL publik dari Cloudinary
    const imageUrl = uploadResult.secure_url;

    // Simpan seluruh data ke database PostgreSQL (Supabase)
    const newMenu = await prisma.menu.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        category,
        stock: parseInt(stock),
        imageUrl, // Masukkan URL Cloudinary
      },
    });

    res.status(201).json({ success: true, message: 'Menu berhasil ditambahkan', data: newMenu });
  } catch (error) {
    console.error('Error create menu:', error);
    res.status(500).json({ success: false, message: 'Gagal menambahkan menu' });
  }
};

// --- 2. Fungsi Ambil Semua Menu (Untuk Frontend) ---
export const getAllMenus = async (req: Request, res: Response): Promise<void> => {
  try {
    const menus = await prisma.menu.findMany({
      orderBy: { createdAt: 'desc' } // Urutkan dari yang paling baru
    });
    res.status(200).json({ success: true, data: menus });
  } catch (error) {
    console.error('Error get menus:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data menu' });
  }
};

// --- 3. Fungsi Hapus Menu ---
export const deleteMenu = async (req: Request, res: Response): Promise<void> => {
  try {
    // Penegasan tipe (Type Assertion) menjadi string agar Prisma tidak error
    const id = req.params.id as string; 
    
    await prisma.menu.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'Menu berhasil dihapus' });
  } catch (error) {
    console.error('Error delete menu:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus menu' });
  }
};

// --- Update Menu (Edit) ---
export const updateMenu = async (req: MulterRequest, res: Response): Promise<void> => {
  try {
    // FIX: Tambahkan "as string" untuk mencegah error TypeScript
    const id = req.params.id as string; 
    
    const { name, price, category, stock, imageUrl } = req.body;
    let newImageUrl = imageUrl;

    // Jika ada file gambar baru yang diunggah
    if (req.file) {
      const uploadResult: any = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'setiarasa_menu' },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );
        stream.end(req.file.buffer); 
      });
      newImageUrl = uploadResult.secure_url;
    }

    const updatedMenu = await prisma.menu.update({
      where: { id },
      data: {
        name,
        price: Number(price),
        category,
        stock: Number(stock),
        imageUrl: newImageUrl
      }
    });

    res.status(200).json({ success: true, message: 'Menu berhasil diperbarui', data: updatedMenu });
  } catch (error) {
    console.error('Error update menu:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui menu' });
  }
};