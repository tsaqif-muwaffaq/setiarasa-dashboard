import multer from 'multer';

// Menggunakan memory storage agar file foto tidak menumpuk di hardisk lokal server,
// melainkan langsung dilempar ke Cloudinary sebagai buffer.
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Batas maksimal ukuran foto adalah 5MB
  },
  fileFilter: (req, file, cb) => {
    // Hanya izinkan format gambar
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file gambar yang diperbolehkan!'));
    }
  },
});

export default upload;