import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import menuRoutes from './routes/menu.routes';
import orderRoutes from './routes/order.routes';
import userRoutes from './routes/user.routes';
import publicRoutes from './routes/public.routes';
import paymentRoutes from './routes/payment.routes'; 

// Muat variabel dari .env
dotenv.config();

const app = express();

// Middlewares Dasar
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Daftarkan Routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/payments', paymentRoutes); 

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

// Nyalakan Server (Hanya jika tidak berjalan di Vercel)
const PORT = process.env.PORT || 5000;
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server backend berjalan di http://localhost:${PORT}`);
  });
}

// Export aplikasi untuk Vercel Serverless
export default app;