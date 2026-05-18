import { Router } from 'express';
import multer from 'multer';
import { uploadController } from '../controllers/uploadController';
import { adminMiddleware } from '../middleware/authMiddleware';

// Multer memory storage configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    // MIME type validation
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

const router = Router();

// Upload routes accept multipart images and require admin access before storage writes.
/**
 * @swagger
 * /upload:
 *   post:
 *     tags:
 *       - Upload
 *     summary: Upload image to Supabase Storage (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: folder
 *         schema:
 *           type: string
 *           enum: [subjects, courses, questions, chapters]
 *         description: Folder for uploading image
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 url:
 *                   type: string
 *       400:
 *         description: Error uploading file
 *       403:
 *         description: Insufficient permissions
 */
// POST /upload accepts one image file and stores it through Supabase.
router.post('/', adminMiddleware, upload.single('image'), (req, res) =>
  uploadController.uploadImage(req, res)
);

export default router;
