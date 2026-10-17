import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const rawName = path.basename(file.originalname, ext);
    const sanitizedName = rawName.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
    const unique = `${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    cb(null, `dish_${sanitizedName}_${unique}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif', 'image/svg+xml'];
  if (allowed.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, WEBP, GIF, SVG) are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit
});

const router = express.Router();

/**
 * @desc    Upload an image for menu dishes
 * @route   POST /api/upload
 * @access  Protected (Owner, Chef)
 */
router.post('/', (req, res) => {
  // Use multer single file parser
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'Image size exceeds 15MB limit.' });
      }
      return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    // 1. Handled by multipart file
    if (req.file) {
      const relativeUrl = `/uploads/${req.file.filename}`;
      return res.status(201).json({
        success: true,
        message: 'Image uploaded successfully!',
        url: relativeUrl,
        filename: req.file.filename
      });
    }

    // 2. Handled by base64 in JSON payload
    if (req.body && req.body.image && typeof req.body.image === 'string' && req.body.image.startsWith('data:image')) {
      try {
        const matches = req.body.image.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
        if (!matches) {
          return res.status(400).json({ success: false, message: 'Invalid base64 image format.' });
        }
        let ext = matches[1].toLowerCase();
        if (ext === 'jpeg') ext = 'jpg';
        if (ext === 'svg+xml') ext = 'svg';

        const buffer = Buffer.from(matches[2], 'base64');
        const filename = `dish_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`;
        fs.writeFileSync(path.join(uploadsDir, filename), buffer);

        const relativeUrl = `/uploads/${filename}`;
        return res.status(201).json({
          success: true,
          message: 'Image uploaded successfully from data URI!',
          url: relativeUrl,
          filename
        });
      } catch (writeErr) {
        return res.status(500).json({
          success: false,
          message: 'Failed to process base64 image upload.'
        });
      }
    }

    return res.status(400).json({
      success: false,
      message: 'No image file or image data provided.'
    });
  });
});

export default router;
