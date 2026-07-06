import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'rahasia_setiarasa_aman_123'; // Pastikan ada di file .env nantinya

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // 1. Cari user berdasarkan email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(404).json({ success: false, message: 'Akun tidak ditemukan.' });
      return;
    }

    // 2. Cocokkan password yang diinput dengan password hash di database
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ success: false, message: 'Password salah.' });
      return;
    }

    // 3. Buat Token JWT yang berisi ID dan Role Karyawan
    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '12h' } // Token hangus dalam 12 jam shift kerja
    );

    // 4. Kirim respons sukses beserta data user (tanpa password)
    res.status(200).json({
      success: true,
      message: `Selamat bekerja, ${user.name}!`,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          phone: user.phone
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id; 
    // Tangkap data baru dari body
    const { name, phone, avatar, email, oldPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ success: false, message: 'Akun tidak ditemukan.' });
      return;
    }

    const updateData: any = {};

    // 1. Update Data Dasar
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
   if (avatar !== undefined) {
      updateData.avatar = avatar === '' ? null : avatar;
    }

    // 2. Update Email
    if (email && email !== user.email) {
      const emailExist = await prisma.user.findUnique({ where: { email } });
      if (emailExist) {
        res.status(400).json({ success: false, message: 'Email sudah terdaftar. Gunakan email lain.' });
        return;
      }
      updateData.email = email;
    }

    // 3. Update Password
    if (newPassword) {
      if (!oldPassword) {
        res.status(400).json({ success: false, message: 'Masukkan kata sandi lama Anda.' });
        return;
      }
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        res.status(400).json({ success: false, message: 'Kata sandi lama salah.' });
        return;
      }
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    // 4. Simpan ke database (Sekarang select juga phone dan avatar agar dikembalikan ke frontend)
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, phone: true, avatar: true } 
    });

    res.status(200).json({ 
      success: true, 
      message: 'Profil berhasil diperbarui.', 
      data: updatedUser 
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};