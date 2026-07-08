import { Request, Response } from 'express';
import cloudinary from '../config/cloudinary';
import prisma from '../lib/prisma';

interface MulterRequest extends Request {
  file?: any;
}

// ── 1. Fungsi Tambah Menu (Support File Upload & URL) ──
export const createMenu = async (req: MulterRequest, res: Response): Promise<void> => {
  try {
    const { name, description, price, category, stock, imageUrl } = req.body;
    
    let finalImageUrl = '';

    // ── FIX: Support 2 metode ──
    // 1. Upload file (prioritas)
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
      finalImageUrl = uploadResult.secure_url;
    } 
    // 2. Gunakan URL dari body (jika tidak ada file)
    else if (imageUrl && imageUrl.trim() !== '') {
      finalImageUrl = imageUrl.trim();
    } 
    // 3. Tidak ada gambar sama sekali
    else {
      res.status(400).json({ 
        success: false, 
        message: 'Gambar menu wajib diisi! (Upload file atau masukkan URL)' 
      });
      return;
    }

    const newMenu = await prisma.menu.create({
      data: {
        name,
        description: description || null,
        price: parseFloat(price),
        category,
        stock: parseInt(stock),
        imageUrl: finalImageUrl,
      },
    });

    res.status(201).json({ success: true, message: 'Menu berhasil ditambahkan', data: newMenu });
  } catch (error) {
    console.error('Error create menu:', error);
    res.status(500).json({ success: false, message: 'Gagal menambahkan menu' });
  }
};

// ── 2. Fungsi Update Menu (Support File Upload & URL) ──
export const updateMenu = async (req: MulterRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { name, price, category, stock, imageUrl } = req.body;
    
    let finalImageUrl = imageUrl; // Default pakai yang sudah ada

    // Jika ada file baru, upload ke Cloudinary
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
      finalImageUrl = uploadResult.secure_url;
    } 
    // Jika tidak ada file tapi ada imageUrl di body, pakai itu
    else if (imageUrl && imageUrl.trim() !== '') {
      finalImageUrl = imageUrl.trim();
    }

    const updatedMenu = await prisma.menu.update({
      where: { id },
      data: {
        name,
        price: Number(price),
        category,
        stock: Number(stock),
        imageUrl: finalImageUrl
      }
    });

    res.status(200).json({ success: true, message: 'Menu berhasil diperbarui', data: updatedMenu });
  } catch (error) {
    console.error('Error update menu:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui menu' });
  }
};

// ── 3. Fungsi Ambil Semua Menu ──
export const getAllMenus = async (req: Request, res: Response): Promise<void> => {
  try {
    const menus = await prisma.menu.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ success: true, data: menus });
  } catch (error) {
    console.error('Error get menus:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data menu' });
  }
};

// ── 4. Fungsi Hapus Menu ──
export const deleteMenu = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    await prisma.menu.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'Menu berhasil dihapus' });
  } catch (error) {
    console.error('Error delete menu:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus menu' });
  }
};