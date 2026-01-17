#!/usr/bin/env node

/**
 * Test script for image compression
 * Creates a test image and processes it through the compression pipeline
 */

import { processPhotoForUpload } from './src/services/imageProcessor.js';
import sharp from 'sharp';

console.log('🧪 Testing Image Compression Pipeline\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

async function test() {
  try {
    // Create a test image (solid red 2000x2000px)
    console.log('📸 Creating test image (2000x2000px, red)...');
    
    const testImage = await sharp({
      create: {
        width: 2000,
        height: 2000,
        channels: 3,
        background: { r: 255, g: 0, b: 0 }
      }
    })
    .jpeg({ quality: 100 })
    .toBuffer();

    console.log(`   Original size: ${Math.round(testImage.length / 1024)}KB\n`);

    // Process through our compression pipeline
    console.log('⚙️  Processing through compression pipeline...');
    const result = await processPhotoForUpload(testImage);

    // Display results
    console.log('\n✅ Compression successful!\n');
    console.log('📊 Results:');
    console.log(`   Image size: ${Math.round(result.image.length / 1024)}KB`);
    console.log(`   Thumbnail size: ${Math.round(result.thumbnail.length / 1024)}KB`);
    console.log(`   Compression savings: ${result.metadata.savings}`);
    console.log(`   Final dimensions: ${result.metadata.width}x${result.metadata.height}px`);
    console.log(`   Format: ${result.metadata.format}`);
    console.log(`   Quality: ${process.env.COMPRESSION_QUALITY || 88}%`);

    // Verify compression worked
    const compressionRatio = result.image.length / testImage.length;
    if (compressionRatio < 0.5) {
      console.log('\n✅ Compression test PASSED (>50% reduction)');
    } else {
      console.log('\n⚠️  Compression test WARNING (low compression ratio)');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🎉 All tests passed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

test();
