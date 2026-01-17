import { Platform } from 'react-native';

// Import react-native-image-filter-kit components
// NOTE: This library can apply true grayscale color matrix transformations
const ImageFilter = Platform.OS !== 'web' 
  ? require('react-native-image-filter-kit')
  : null;

/**
 * Apply true grayscale filter using react-native-image-filter-kit
 * This creates a real B&W image that matches what backend produces
 */
export async function applyTrueGrayscaleFilter(imageUri: string): Promise<string> {
  if (!ImageFilter || Platform.OS === 'web') {
    console.log('⚠️  Image filter kit not available, using original image');
    return imageUri;
  }

  try {
    console.log('🎨 Applying true grayscale with image-filter-kit...');
    
    // Grayscale color matrix (standard formula)
    // R' = 0.299*R + 0.587*G + 0.114*B
    // G' = 0.299*R + 0.587*G + 0.114*B  
    // B' = 0.299*R + 0.587*G + 0.114*B
    const grayscaleMatrix = [
      0.299, 0.587, 0.114, 0, 0,
      0.299, 0.587, 0.114, 0, 0,
      0.299, 0.587, 0.114, 0, 0,
      0,     0,     0,     1, 0,
    ];

    // Apply the filter
    const result = await ImageFilter.ColorMatrix.apply({
      image: imageUri,
      matrix: grayscaleMatrix,
    });

    console.log('✅ Grayscale applied successfully!');
    return result;
  } catch (error) {
    console.error('❌ Error applying grayscale filter:', error);
    console.log('   Falling back to overlay simulation');
    return imageUri;
  }
}
