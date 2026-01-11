import { manipulateAsync, SaveFormat, FlipType } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

/**
 * Create a Polaroid-style image with frame, date, and caption
 */
export async function createPolaroidImage(
  imageUri: string,
  caption: string = '',
  date: Date = new Date()
): Promise<string> {
  try {
    // First, resize the image to a square
    const squareImage = await manipulateAsync(
      imageUri,
      [{ resize: { width: 1000, height: 1000 } }],
      { compress: 0.9, format: SaveFormat.JPEG }
    );

    // For now, return the processed image
    // The Polaroid frame will be overlaid in the UI component
    return squareImage.uri;
  } catch (error) {
    console.error('Error creating Polaroid image:', error);
    throw error;
  }
}

/**
 * Format date for Polaroid timestamp
 */
export function formatPolaroidDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

/**
 * Apply vintage filter effect
 */
export async function applyVintageFilter(imageUri: string): Promise<string> {
  try {
    // Basic image processing
    // For more advanced filters, you'd integrate with a library like react-native-image-filter-kit
    const processed = await manipulateAsync(
      imageUri,
      [
        { resize: { width: 1000 } },
        // Add slight rotation for authentic Polaroid feel (optional)
        // { rotate: Math.random() * 4 - 2 }, // Random -2 to 2 degrees
      ],
      { compress: 0.85, format: SaveFormat.JPEG }
    );

    return processed.uri;
  } catch (error) {
    console.error('Error applying vintage filter:', error);
    throw error;
  }
}

/**
 * Combine front and back camera images (BeReal style)
 */
export async function combineImages(
  backImageUri: string,
  frontImageUri: string
): Promise<string> {
  try {
    // Resize back image to full size
    const backImage = await manipulateAsync(
      backImageUri,
      [{ resize: { width: 1000, height: 1000 } }],
      { compress: 0.9, format: SaveFormat.JPEG }
    );

    // Resize front image to small circle overlay
    const frontImage = await manipulateAsync(
      frontImageUri,
      [{ resize: { width: 250, height: 250 } }],
      { compress: 0.9, format: SaveFormat.JPEG }
    );

    // Return the back image URI - we'll overlay the front image in the UI
    // In a production app, you'd composite them here using canvas
    return backImage.uri;
  } catch (error) {
    console.error('Error combining images:', error);
    throw error;
  }
}
