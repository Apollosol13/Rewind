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
      // B&W filter - strong desaturation overlay for preview
      return (
        <View style={styles.overlay} pointerEvents="none">
          {/* Strong gray wash for B&W effect */}
          <View style={[StyleSheet.absoluteFill, styles.filmDesaturate]} />
          {/* Exposure darkening */}
          <View style={[StyleSheet.absoluteFill, styles.filmDarken]} />
        </View>
      );

    case 'camcorder':
      return (
        <View style={styles.overlay} pointerEvents="none">
          {/* 90s Aesthetic: Exposure -15 (darken) */}
          <View style={[StyleSheet.absoluteFill, styles.camcorderDarken]} />
          {/* Warmth +19 (strong warm orange glow) */}
          <View style={[StyleSheet.absoluteFill, styles.camcorderWarmth]} />
          {/* Black Point -7 (lift blacks, vintage fade) */}
          <View style={[StyleSheet.absoluteFill, styles.camcorderFade]} />
          {/* Vibrance +21 (boost muted colors - simulated with subtle color overlay) */}
          <View style={[StyleSheet.absoluteFill, styles.camcorderVibrance]} />
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

  // B&W: strong overlay to simulate grayscale for preview
  filmDesaturate: {
    backgroundColor: 'rgba(128, 128, 128, 0.65)', // Strong desaturation effect
  },
  filmDarken: {
    backgroundColor: 'rgba(0, 0, 0, 0.18)', // Exposure -50 darkening
  },

  // Camcorder: 90's Aesthetic VHS (Dramatic Warm +28, Exposure -15, etc.)
  camcorderDarken: {
    backgroundColor: 'rgba(0, 0, 0, 0.15)', // Exposure -15 (darken image)
  },
  camcorderWarmth: {
    backgroundColor: 'rgba(255, 200, 150, 0.28)', // Warmth +19 (dramatic warm orange)
    mixBlendMode: 'screen', // Blend for warmth effect
  },
  camcorderFade: {
    backgroundColor: 'rgba(255, 255, 255, 0.09)', // Black Point -7 (lift blacks, vintage fade)
  },
  camcorderVibrance: {
    backgroundColor: 'rgba(255, 180, 100, 0.12)', // Vibrance +21 (boost warm tones)
    mixBlendMode: 'overlay', // Blend to boost colors
  },

  // Shared effects removed - filmGrain placeholder caused visible squares
  // In production, actual grain texture would be added as an image overlay
});
