import express from 'express';
import { uploadSinglePhoto, handleUploadError } from '../middleware/upload.js';
import { authenticateUser } from '../middleware/auth.js';
import { processPhotoForUpload } from '../services/imageProcessor.js';
import { uploadImage, savePhotoMetadata } from '../services/supabase.js';

const router = express.Router();

/**
 * POST /api/photos/upload
 * Upload and process a photo
 * Requires authentication
 */
router.post('/upload', authenticateUser, uploadSinglePhoto, handleUploadError, async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        message: 'Please provide a photo file',
      });
    }

    console.log(`📸 Processing photo upload for user: ${req.user.id}`);
    console.log(`   Original size: ${Math.round(req.file.size / 1024)}KB`);
    console.log(`   Photo style: ${req.body.photoStyle || 'none'}`);

    // Process image (compress + generate thumbnail + apply filters)
    const processed = await processPhotoForUpload(req.file.buffer, req.body.photoStyle);

    // Upload main image to Supabase Storage
    const imageUpload = await uploadImage(
      processed.image,
      'rewind-photos',
      'photos',
      `${req.user.id}_${Date.now()}.jpg`
    );

    // Upload thumbnail
    const thumbnailUpload = await uploadImage(
      processed.thumbnail,
      'rewind-photos',
      'thumbnails',
      `${req.user.id}_${Date.now()}_thumb.jpg`
    );

    // Save photo metadata to database
    const photoData = {
      userId: req.user.id,
      imageUrl: imageUpload.url,
      thumbnailUrl: thumbnailUpload.url,
      caption: req.body.caption || null,
      photoStyle: req.body.photoStyle || 'polaroid',
      promptTime: req.body.promptTime || new Date().toISOString(),
      latitude: req.body.latitude ? parseFloat(req.body.latitude) : null,
      longitude: req.body.longitude ? parseFloat(req.body.longitude) : null,
    };

    const photo = await savePhotoMetadata(photoData);

    console.log(`✅ Photo uploaded successfully: ${photo.id}`);

    // Return success response
    res.status(201).json({
      success: true,
      photo: {
        id: photo.id,
        imageUrl: photo.image_url,
        thumbnailUrl: photo.thumbnail_url,
        caption: photo.caption,
        photoStyle: photo.photo_style,
        createdAt: photo.created_at,
      },
      processing: {
        originalSize: `${Math.round(req.file.size / 1024)}KB`,
        compressedSize: `${Math.round(processed.metadata.compressedSize / 1024)}KB`,
        savings: processed.metadata.savings,
        thumbnailSize: `${Math.round(processed.thumbnail.length / 1024)}KB`,
      },
    });
  } catch (error) {
    console.error('❌ Photo upload failed:', error);
    
    res.status(500).json({
      error: 'Upload failed',
      message: error.message || 'Failed to process and upload photo',
    });
  }
});

/**
 * GET /api/photos/test
 * Test endpoint to verify configuration
 */
router.get('/test', (req, res) => {
  res.json({
    message: 'Photo upload endpoint ready! 📸',
    config: {
      compression_quality: process.env.COMPRESSION_QUALITY || 88,
      max_width: process.env.MAX_IMAGE_WIDTH || 1200,
      max_height: process.env.MAX_IMAGE_HEIGHT || 1600,
      thumbnail_width: process.env.THUMBNAIL_WIDTH || 800,
      max_file_size: `${process.env.MAX_IMAGE_SIZE_MB || 10}MB`,
    },
    supabase_configured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY),
    endpoints: {
      upload: 'POST /api/photos/upload (requires auth + file)',
    },
  });
});

export default router;
