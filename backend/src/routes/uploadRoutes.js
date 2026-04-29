import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { buildPublicImageUrl, ensureUploadsDir } from '../controllers/uploadController.js';

const router = Router();

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png']);

const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    try {
      await ensureUploadsDir();
      cb(null, path.join(process.cwd(), 'uploads'));
    } catch (error) {
      cb(error);
    }
  },
  filename: (_req, file, cb) => {
    const ext = file.mimetype === 'image/png' ? '.png' : '.jpg';
    const id = crypto.randomBytes(12).toString('hex');
    cb(null, `${Date.now()}-${id}${ext}`);
  }
});

const fileFilter = (_req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(new Error('TYPE_NOT_ALLOWED'));
    return;
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.post('/', authMiddleware(['admin']), upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Aucun fichier image fourni.' });
  }

  const url = buildPublicImageUrl(req, req.file.filename);
  return res.status(201).json({ url, filename: req.file.filename });
});

router.use((err, _req, res, next) => {
  if (!err) return next();

  if (err.message === 'TYPE_NOT_ALLOWED') {
    return res.status(400).json({ message: 'Type de fichier non autorise. Utilisez JPG ou PNG.' });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'Image trop volumineuse (max 5MB).' });
  }

  return res.status(500).json({ message: 'Upload impossible.' });
});

export default router;
