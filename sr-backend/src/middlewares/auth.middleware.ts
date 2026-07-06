// auth.middleware.ts - LENGKAP
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'rahasia_setiarasa_aman_123';

export const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Akses ditolak. Token tidak ditemukan.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    (req as any).user = decoded;
    (req as any).isPublic = false; // 👈 Tandai sebagai request internal (dari kasir)
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Sesi telah habis atau token tidak valid. Silakan login ulang.' });
  }
};