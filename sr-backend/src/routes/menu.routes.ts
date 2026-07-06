import { Router } from 'express';
import * as MenuController from '../controllers/menu.controller';
import upload from '../middlewares/upload';

const router = Router();

// Route untuk mengambil semua data menu (GET /api/menu)
router.get('/', MenuController.getAllMenus);

// Route untuk menambah menu baru (POST /api/menu)
// Kita sisipkan middleware "upload.single('image')" agar Express siap menangkap file
router.post('/', upload.single('image'), MenuController.createMenu);

// ---------------------------------------------------
// TAMBAHKAN BARIS INI UNTUK FITUR EDIT (UPDATE STOK)
// ---------------------------------------------------
router.put('/:id', upload.single('image'), MenuController.updateMenu);

// Route untuk menghapus menu (DELETE /api/menu/:id)
router.delete('/:id', MenuController.deleteMenu);

export default router;