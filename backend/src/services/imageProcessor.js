import sharp from 'sharp';

/**
 * Process photo for upload:
 * - Compress and resize main image
 * - Generate thumbnail
 * - Apply photo style filters
 * @param {Buffer} imageBuffer - Original image buffer
 * @param {string} photoStyle - Photo style filter to apply ('polaroid', 'camcorder', etc.)
 * @returns {Promise<Object>} - Processed image, thumbnail, and metadata
 */
export async function processPhotoForUpload(imageBuffer, photoStyle = 'polaroid') {
  try {
    // Configuration from environment or defaults
    const COMPRESSION_QUALITY = parseInt(process.env.COMPRESSION_QUALITY) || 88;
    const MAX_WIDTH = parseInt(process.env.MAX_IMAGE_WIDTH) || 1200;
    const MAX_HEIGHT = parseInt(process.env.MAX_IMAGE_HEIGHT) || 1600;
    const THUMBNAIL_WIDTH = parseInt(process.env.THUMBNAIL_WIDTH) || 800;

    // Get original image metadata
    const metadata = await sharp(imageBuffer).metadata();
    const originalSize = imageBuffer.length;

    console.log(`   Processing ${metadata.width}x${metadata.height}px image...`);

    // Process main image (compress + resize if needed)
    let imageProcessor = sharp(imageBuffer)
      .rotate() // Auto-rotate based on EXIF
      .resize(MAX_WIDTH, MAX_HEIGHT, {
        fit: 'inside',
        withoutEnlargement: true,
      });

    // Apply photo style filters
    imageProcessor = applyPhotoStyle(imageProcessor, photoStyle);

    // Convert to JPEG with compression
    const processedImage = await imageProcessor
      .jpeg({
        quality: COMPRESSION_QUALITY,
        progressive: true,
        mozjpeg: true,
      })
      .toBuffer();

    // Generate thumbnail
    let thumbnailProcessor = sharp(imageBuffer)
      .rotate()
      .resize(THUMBNAIL_WIDTH, null, {
        fit: 'inside',
        withoutEnlargement: true,
      });

    // Apply same photo style to thumbnail
    thumbnailProcessor = applyPhotoStyle(thumbnailProcessor, photoStyle);

    const thumbnail = await thumbnailProcessor
      .jpeg({
        quality: 85,
        progressive: true,
      })
      .toBuffer();

    // Get final metadata
    const finalMetadata = await sharp(processedImage).metadata();
    const compressionRatio = (1 - processedImage.length / originalSize) * 100;

    console.log(`   ✅ Compressed: ${Math.round(originalSize / 1024)}KB → ${Math.round(processedImage.length / 1024)}KB (${compressionRatio.toFixed(1)}% savings)`);

    return {
      image: processedImage,
      thumbnail: thumbnail,
      metadata: {
        width: finalMetadata.width,
        height: finalMetadata.height,
        format: finalMetadata.format,
        compressedSize: processedImage.length,
        savings: `${compressionRatio.toFixed(1)}%`,
        photoStyle,
      },
    };
  } catch (error) {
    console.error('❌ Image processing error:', error);
    throw new Error(`Failed to process image: ${error.message}`);
  }
}

/**
 * Apply photo style filters to image
 * @param {sharp.Sharp} processor - Sharp processor instance
 * @param {string} style - Photo style ('polaroid', 'camcorder', 'sticky-note', etc.)
 * @returns {sharp.Sharp} - Modified processor
 */
function applyPhotoStyle(processor, style) {
  switch (style) {
    case 'camcorder':
      // Camcorder: Frontend captures pre-styled image with CSS overlays
      // Backend just passes through with minimal processing
      return processor; // No additional processing - image already styled!

    case 'film':
      // B&W film effect: full grayscale conversion
      return processor
        .grayscale()
        .modulate({
          brightness: 1.03,
          contrast: 1.08,
        })
        .linear(1.05, -(128 * 1.05) + 128); // Increase contrast for film look

    case 'sticky-note':
      // Sticky note effect: yellow tint, soft
      return processor
        .tint({ r: 255, g: 255, b: 200 })
        .modulate({
          brightness: 1.1,
          saturation: 0.7,
        });

    case 'polaroid':
    default:
      // Polaroid effect: slightly warmer, higher contrast
      return processor
        .modulate({
          brightness: 1.02,
          saturation: 1.1,
        })
        .linear(1.1, -(128 * 1.1) + 128); // Increase contrast
  }
}

export default {
  processPhotoForUpload,
};
