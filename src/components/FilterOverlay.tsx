import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { PhotoStyle } from './StyleDial';

interface FilterOverlayProps {
  filterId: PhotoStyle;
}

/**
 * Visual overlay effects that distinguish each filter
 * Applied both to camera preview and captured photos
 */
export default function FilterOverlay({ filterId }: FilterOverlayProps) {
  switch (filterId) {
    case 'polaroid':
      return (
        <View style={styles.overlay} pointerEvents="none">
          {/* Warm glow overlay */}
          <View style={[StyleSheet.absoluteFill, styles.polaroidWarmth]} />
          {/* Lifted shadows/faded look */}
          <View style={[StyleSheet.absoluteFill, styles.polaroidFade]} />
          {/* Strong vignette */}
          <View style={[StyleSheet.absoluteFill, styles.polaroidVignette]} />
        </View>
      );

    case 'vintage':
      return (
        <View style={styles.overlay} pointerEvents="none">
          {/* Warm orange-red fade */}
          <View style={[StyleSheet.absoluteFill, styles.vintageOverlay]} />
        </View>
      );

    case 'sepia':
      return (
        <View style={styles.overlay} pointerEvents="none">
          {/* Brown sepia tone */}
          <View style={[StyleSheet.absoluteFill, styles.sepiaOverlay]} />
        </View>
      );

    case 'legacy':
      return (
        <View style={styles.overlay} pointerEvents="none">
          {/* Warm, muted, sophisticated overlay */}
          <View style={[StyleSheet.absoluteFill, styles.legacyOverlay]} />
          {/* Warm amber glow for +42 warmth */}
          <View style={[StyleSheet.absoluteFill, styles.legacyWarmth]} />
        </View>
      );

    case 'film':
      return (
        <View style={styles.overlay} pointerEvents="none">
          {/* Exposure -50 (moderate darkening) */}
          <View style={[StyleSheet.absoluteFill, styles.filmDarken]} />
          {/* Saturation -100 (pure black & white) */}
          <View style={[StyleSheet.absoluteFill, styles.filmDesaturate]} />
          {/* Warmth -50 (cool blue tone) */}
          <View style={[StyleSheet.absoluteFill, styles.filmCoolTone]} />
        </View>
      );

    case 'camcorder':
      return (
        <View style={styles.overlay} pointerEvents="none">
          {/* Brightness: -50 (darken image) */}
          <View style={[StyleSheet.absoluteFill, styles.camcorderDarken]} />
          {/* Desaturation: -31 (gray wash) */}
          <View style={[StyleSheet.absoluteFill, styles.camcorderDesaturate]} />
          {/* Warmth: +29 (warm yellow/orange cast) */}
          <View style={[StyleSheet.absoluteFill, styles.camcorderWarmth]} />
          {/* Highlights: -100 (blown out bright areas - use light overlay) */}
          <View style={[StyleSheet.absoluteFill, styles.camcorderBlownHighlights]} />
          {/* Tint: +18 (slight color shift) */}
          <View style={[StyleSheet.absoluteFill, styles.camcorderTint]} />
        </View>
      );

    default:
      return null;
  }
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },

  // Polaroid: warm, lifted shadows, strong vignette (Vintage settings)
  polaroidWarmth: {
    backgroundColor: 'rgba(255, 200, 150, 0.15)', // Warm tone (+20 warmth)
  },
  polaroidFade: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)', // Lifted shadows/fade (+77 shadows)
  },
  polaroidVignette: {
    backgroundColor: 'rgba(0, 0, 0, 0.08)', // Slight darkening for vignette approximation
  },

  // Vintage: faded orange-red 60s-70s look
  vintageOverlay: {
    backgroundColor: 'rgba(255, 140, 80, 0.18)', // Orange-red fade
  },

  // Sepia: brown antique tone
  sepiaOverlay: {
    backgroundColor: 'rgba(112, 66, 20, 0.35)', // Rich brown sepia
  },

  // Legacy: warm, muted old money aesthetic
  legacyOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)', // Darkening for -53 exposure & -21 brightness
  },
  legacyWarmth: {
    backgroundColor: 'rgba(255, 200, 120, 0.18)', // Warm amber for +42 warmth
  },

  // B&W: clean black & white
  filmDarken: {
    backgroundColor: 'rgba(0, 0, 0, 0.30)', // Exposure -50 (darkening)
  },
  filmDesaturate: {
    backgroundColor: 'rgba(128, 128, 128, 0.75)', // Saturation -100 (heavy gray wash for B&W effect)
  },
  filmCoolTone: {
    backgroundColor: 'rgba(200, 220, 255, 0.20)', // Warmth -50 (cool tone)
  },

  // Camcorder: VHS home video aesthetic (Old VHS camera preset)
  camcorderDarken: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)', // -50 brightness (darken)
  },
  camcorderDesaturate: {
    backgroundColor: 'rgba(128, 128, 128, 0.22)', // -31 saturation (gray wash)
  },
  camcorderWarmth: {
    backgroundColor: 'rgba(255, 180, 80, 0.20)', // +29 warmth (warm orange cast)
  },
  camcorderBlownHighlights: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)', // -100 highlights (blown out bright areas)
  },
  camcorderTint: {
    backgroundColor: 'rgba(255, 230, 200, 0.08)', // +18 tint (slight warm color shift)
  },

  // Shared effects removed - filmGrain placeholder caused visible squares
  // In production, actual grain texture would be added as an image overlay
});
