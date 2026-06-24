import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';

// Muat variabel dari .env
dotenv.config();

const app = express();

// Middlewares Dasar
app.use(cors()); // Mengizinkan Frontend React (port berbeda) mengakses API ini
app.use(express.json()); // Mengizinkan Express membaca data format JSON
app.use(express.urlencoded({ extended: true }));

// Daftarkan Routes
app.use('/api/auth', authRoutes);

// Route Default untuk tes server
app.get('/', (req: Request, res: Response) => {
  res.send('API Setia Rasa Dashboard berjalan dengan lancar! 🚀');
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan internal pada server.',
  });
});

// Nyalakan Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server backend berjalan di http://localhost:${PORT}`);
});