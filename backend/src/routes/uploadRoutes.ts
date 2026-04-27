import { Router } from 'express';
import multer from 'multer';
import { uploadController } from '../controllers/uploadController';
import { adminMiddleware } from '../middleware/authMiddleware';

// Конфигурация multer для хранения в памяти
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    // Проверка MIME типа
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

const router = Router();

/**
 * POST /api/upload?folder=subjects
 * Загрузить картинку в Supabase Storage
 * Query параметры:
 * - folder: 'subjects' или 'courses' (по умолчанию 'subjects')
 */
router.post('/', adminMiddleware, upload.single('image'), (req, res) =>
  uploadController.uploadImage(req, res)
);

export default router;
