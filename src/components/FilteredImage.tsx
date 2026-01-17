import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { PhotoStyle } from './StyleDial';
import { getFilterPreset } from '../utils/filterPresets';

interface FilteredImageProps {
  uri: string;
  style?: any;
  filterId: PhotoStyle;
}

/**
 * Displays an image with filter effects applied
 * Uses CSS-like filters as a starting point
 * Full implementation would integrate react-native-image-filter-kit color matrices
 */
export default function FilteredImage({ uri, style, filterId }: FilteredImageProps) {
  const preset = getFilterPreset(filterId);
  
  if (!preset) {
    return <Image source={{ uri }} style={style} resizeMode="cover" />;
  }

  // Build filter style based on preset
  const filterStyle: any = {};

  // Note: React Native's Image component doesn't support CSS filters directly
  // For production, you'd need to:
  // 1. Use react-native-image-filter-kit with ColorMatrix filter
  // 2. Or pre-process images on capture using expo-image-manipulator
  // 3. Or use a WebView with CSS filters for preview only

  // For now, we'll apply opacity/tint as a basic starting point
  // The actual color matrix transformations need the filter kit integration

  return (
    <View style={[style, styles.container]}>
      <Image 
        source={{ uri }} 
        style={[StyleSheet.absoluteFill, filterStyle]} 
        resizeMode="cover"
      />
      
      {/* Overlay effects */}
      {filterId === 'sepia' && (
        <View style={[StyleSheet.absoluteFill, styles.sepiaOverlay]} />
      )}
      {filterId === 'noir' && (
        <View style={[StyleSheet.absoluteFill, styles.noirOverlay]} />
      )}
      {filterId === 'camcorder' && (
        <>
          <View style={[StyleSheet.absoluteFill, styles.vhsOverlay]} />
          <View style={[StyleSheet.absoluteFill, styles.scanlines]} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  sepiaOverlay: {
    backgroundColor: 'rgba(112, 66, 20, 0.25)',
  },
  noirOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  vhsOverlay: {
    backgroundColor: 'rgba(255, 0, 100, 0.05)', // Slight magenta tint
  },
  scanlines: {
    backgroundColor: 'transparent',
    opacity: 0.1,
    // Scanline pattern would be applied here
    // Could use a repeating SVG pattern or image
  },
});
