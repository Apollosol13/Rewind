import multer from 'multer';

// Configure multer for memory storage (we'll process in-memory)
const storage = multer.memoryStorage();

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heif',
    'image/heic',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and HEIF images are allowed.'), false);
  }
};

// Configure upload limits
const limits = {
  fileSize: (parseInt(process.env.MAX_IMAGE_SIZE_MB) || 10) * 1024 * 1024, // Default 10MB
  files: 1, // Only one file at a time
};

// Create multer upload instance
export const upload = multer({
  storage,
  fileFilter,
  limits,
});

// Single photo upload middleware
export const uploadSinglePhoto = upload.single('photo');

// Error handling middleware for multer
export function handleUploadError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    // Multer-specific errors
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        message: `Maximum file size: ${limits.fileSize / 1024 / 1024}MB`,
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Too many files',
        message: 'Only one file allowed per upload',
      });
    }
    return res.status(400).json({
      error: 'Upload error',
      message: err.message,
    });
  } else if (err) {
    // Other errors (file filter, etc.)
    return res.status(400).json({
      error: 'Invalid file',
      message: err.message,
    });
  }
  next();
}

export default {
  upload,
  uploadSinglePhoto,
  handleUploadError,
};
