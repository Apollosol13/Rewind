import sharp from 'sharp';
import path from 'path';

/**
 * Image Processor Service
 * Handles image compression, resizing, and optimization
 */

const config = {
  quality: parseInt(process.env.COMPRESSION_QUALITY) || 88,
  maxWidth: parseInt(process.env.MAX_IMAGE_WIDTH) || 1200,
  maxHeight: parseInt(process.env.MAX_IMAGE_HEIGHT) || 1600,
  thumbnailWidth: parseInt(process.env.THUMBNAIL_WIDTH) || 800,
};

/**
 * Compress and resize image to standard size
 * @param {Buffer} imageBuffer - Original image buffer
 * @returns {Promise<Buffer>} - Compressed image buffer
 */
export async function compressImage(imageBuffer) {
  try {
    const compressed = await sharp(imageBuffer)
      .rotate() // Auto-rotate based on EXIF orientation
      .resize(config.maxWidth, config.maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({
        quality: config.quality,
        progressive: true,
        mozjpeg: true, // Better compression
      })
      .toBuffer();

    console.log(`✅ Image compressed: ${imageBuffer.length} → ${compressed.length} bytes (${Math.round((1 - compressed.length / imageBuffer.length) * 100)}% reduction)`);

    return compressed;
  } catch (error) {
    console.error('❌ Error compressing image:', error);
    throw new Error('Image compression failed');
  }
}

/**
 * Generate thumbnail for feed display
 * @param {Buffer} imageBuffer - Original image buffer
 * @returns {Promise<Buffer>} - Thumbnail buffer
 */
export async function generateThumbnail(imageBuffer) {
  try {
    const thumbnail = await sharp(imageBuffer)
      .rotate() // Auto-rotate based on EXIF orientation
      .resize(config.thumbnailWidth, null, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({
        quality: 85, // Slightly lower quality for thumbnails
        progressive: true,
      })
      .toBuffer();

    console.log(`✅ Thumbnail generated: ${thumbnail.length} bytes`);

    return thumbnail;
  } catch (error) {
    console.error('❌ Error generating thumbnail:', error);
    throw new Error('Thumbnail generation failed');
  }
}

/**
 * Get image metadata
 * @param {Buffer} imageBuffer - Image buffer
 * @returns {Promise<Object>} - Image metadata
 */
export async function getImageMetadata(imageBuffer) {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: imageBuffer.length,
      hasAlpha: metadata.hasAlpha,
      orientation: metadata.orientation,
    };
  } catch (error) {
    console.error('❌ Error reading image metadata:', error);
    throw new Error('Failed to read image metadata');
  }
}

/**
 * Validate image file
 * @param {Buffer} imageBuffer - Image buffer to validate
 * @returns {Promise<Object>} - Validation result
 */
export async function validateImage(imageBuffer) {
  try {
    const metadata = await getImageMetadata(imageBuffer);
    
    const maxSizeMB = parseInt(process.env.MAX_IMAGE_SIZE_MB) || 10;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    // Check file size
    if (metadata.size > maxSizeBytes) {
      return {
        valid: false,
        error: `Image too large. Maximum size: ${maxSizeMB}MB`,
      };
    }

    // Check format
    const allowedFormats = ['jpeg', 'jpg', 'png', 'webp', 'heif', 'heic'];
    if (!allowedFormats.includes(metadata.format.toLowerCase())) {
      return {
        valid: false,
        error: `Invalid format. Allowed: ${allowedFormats.join(', ')}`,
      };
    }

    // Check dimensions
    if (metadata.width < 100 || metadata.height < 100) {
      return {
        valid: false,
        error: 'Image too small. Minimum: 100x100 pixels',
      };
    }

    return {
      valid: true,
      metadata,
    };
  } catch (error) {
    return {
      valid: false,
      error: 'Invalid image file',
    };
  }
}

/**
 * Process photo for upload
 * Compresses main image and generates thumbnail
 * @param {Buffer} imageBuffer - Original image buffer
 * @returns {Promise<Object>} - Processed images and metadata
 */
export async function processPhotoForUpload(imageBuffer) {
  try {
    // Validate image first
    const validation = await validateImage(imageBuffer);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Process images in parallel for speed
    const [compressedImage, thumbnail, metadata] = await Promise.all([
      compressImage(imageBuffer),
      generateThumbnail(imageBuffer),
      getImageMetadata(imageBuffer),
    ]);

    const originalSize = imageBuffer.length;
    const compressedSize = compressedImage.length;
    const savings = Math.round((1 - compressedSize / originalSize) * 100);

    console.log(`📸 Image processed successfully:`);
    console.log(`   Original: ${Math.round(originalSize / 1024)}KB`);
    console.log(`   Compressed: ${Math.round(compressedSize / 1024)}KB`);
    console.log(`   Thumbnail: ${Math.round(thumbnail.length / 1024)}KB`);
    console.log(`   Savings: ${savings}%`);

    return {
      image: compressedImage,
      thumbnail,
      metadata: {
        ...metadata,
        originalSize,
        compressedSize,
        savings: `${savings}%`,
      },
    };
  } catch (error) {
    console.error('❌ Error processing photo:', error);
    throw error;
  }
}

export default {
  compressImage,
  generateThumbnail,
  getImageMetadata,
  validateImage,
  processPhotoForUpload,
};
