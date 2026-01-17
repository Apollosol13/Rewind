import express from 'express';

const router = express.Router();

// Placeholder for photo upload endpoint (we'll implement this in Phase 2)
router.post('/upload', (req, res) => {
  res.status(501).json({
    message: 'Photo upload endpoint - Coming in Phase 2!',
    info: 'This will handle image compression and upload to Supabase',
  });
});

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    message: 'Photo routes working!',
    compression_quality: process.env.COMPRESSION_QUALITY || 88,
    max_width: process.env.MAX_IMAGE_WIDTH || 1200,
  });
});

export default router;
