import { manipulateAsync, SaveFormat, FlipType } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { applyFilter } from './filterPresets';

/**
 * Create a Polaroid-style image with frame, date, and caption
 * Applies authentic 1970s-80s instant film characteristics
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

    // Apply polaroid filter effect (requires filter library for full effect)
    const filteredImage = await applyFilter(squareImage.uri, 'polaroid');

    // For now, return the processed image
    // The Polaroid frame will be overlaid in the UI component
    return filteredImage;
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
 * Apply vintage filter effect (1960s-70s Kodachrome aesthetic)
 * Warm tones, faded colors, reduced contrast
 */
export async function applyVintageFilter(imageUri: string): Promise<string> {
  try {
    // Resize first
    const processed = await manipulateAsync(
      imageUri,
      [{ resize: { width: 1000 } }],
      { compress: 0.85, format: SaveFormat.JPEG }
    );

    // Apply vintage filter preset (requires filter library for full effect)
    return await applyFilter(processed.uri, 'vintage');
  } catch (error) {
    console.error('Error applying vintage filter:', error);
    throw error;
  }
}

/**
 * Apply sepia filter (1900s-1930s aged photo look)
 */
export async function applySepiaFilter(imageUri: string): Promise<string> {
  try {
    const processed = await manipulateAsync(
      imageUri,
      [{ resize: { width: 1000 } }],
      { compress: 0.85, format: SaveFormat.JPEG }
    );
    return await applyFilter(processed.uri, 'sepia');
  } catch (error) {
    console.error('Error applying sepia filter:', error);
    throw error;
  }
}

/**
 * Apply legacy filter (Timeless old money aesthetic with warm muted tones)
 */
export async function applyLegacyFilter(imageUri: string): Promise<string> {
  try {
    const processed = await manipulateAsync(
      imageUri,
      [{ resize: { width: 1000 } }],
      { compress: 0.9, format: SaveFormat.JPEG }
    );
    return await applyFilter(processed.uri, 'legacy');
  } catch (error) {
    console.error('Error applying legacy filter:', error);
    throw error;
  }
}

/**
 * Apply film filter (1990s-2000s modern film photography)
 */
export async function applyFilmFilter(imageUri: string): Promise<string> {
  try {
    const processed = await manipulateAsync(
      imageUri,
      [{ resize: { width: 1000 } }],
      { compress: 0.9, format: SaveFormat.JPEG }
    );
    return await applyFilter(processed.uri, 'film');
  } catch (error) {
    console.error('Error applying film filter:', error);
    throw error;
  }
}

/**
 * Apply camcorder filter (1980s-90s VHS/Hi8 video aesthetic)
 * Scan lines, color bleeding, tape artifacts
 */
export async function applyCamcorderFilter(imageUri: string): Promise<string> {
  try {
    const processed = await manipulateAsync(
      imageUri,
      [{ resize: { width: 1000 } }],
      { compress: 0.8, format: SaveFormat.JPEG }
    );
    return await applyFilter(processed.uri, 'camcorder');
  } catch (error) {
    console.error('Error applying camcorder filter:', error);
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
