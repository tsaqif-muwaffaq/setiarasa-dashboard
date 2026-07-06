import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// --- 1. Ambil Semua Daftar Karyawan ---
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        phone: true,
        avatar: true,
        // Password sengaja tidak di-select demi alasan keamanan (Security Best Practice)
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error('Error get all users:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data karyawan' });
  }
};

// --- 2. Tambah Karyawan Baru (Registrasi Akun) ---
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    // Validasi input kosong
    if (!name || !email || !password || !role) {
      res.status(400).json({ success: false, message: 'Semua kolom wajib diisi' });
      return;
    }

    // Validasi format Role sesuai dengan Enum di Prisma Schema
    const validRoles = ['OWNER', 'KASIR', 'DAPUR'];
    if (!validRoles.includes(role)) {
      res.status(400).json({ success: false, message: 'Role tidak valid. Pilih OWNER, KASIR, atau DAPUR' });
      return;
    }

    // Edge Case: Cek apakah email sudah terdaftar di database
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ success: false, message: 'Email sudah digunakan oleh karyawan lain' });
      return;
    }

    // Enkripsi Password (Hashing) menggunakan bcrypt sebelum disimpan ke database
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Simpan data ke PostgreSQL
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    res.status(201).json({
      success: true,
      message: `Akun karyawan ${name} berhasil dibuat dengan role ${role}`,
      data: newUser
    });
  } catch (error) {
    console.error('Error create user:', error);
    res.status(500).json({ success: false, message: 'Gagal membuat akun karyawan' });
  }
};

// --- 3. Hapus Akun Karyawan ---
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    // Cek apakah user yang ingin dihapus ada di database
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ success: false, message: 'Karyawan tidak ditemukan' });
      return;
    }

    // Eksekusi penghapusan
    await prisma.user.delete({ where: { id } });

    res.status(200).json({ success: true, message: 'Akun karyawan berhasil dihapus' });
  } catch (error) {
    console.error('Error delete user:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus akun karyawan' });
  }
};