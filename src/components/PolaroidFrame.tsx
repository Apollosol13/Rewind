import React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import HandwrittenText from './HandwrittenText';
import { formatPolaroidDate } from '../utils/dateFormatter';

interface PolaroidFrameProps {
  imageUri: string;
  caption?: string;
  date?: Date | string;
  showRainbow?: boolean;
  width?: number;
}

export default function PolaroidFrame({
  imageUri,
  caption = '',
  date = new Date(),
  showRainbow = true,
  width = 320,
}: PolaroidFrameProps) {
  const imageSize = width - 40; // Account for padding
  const photoDate = typeof date === 'string' ? new Date(date) : date;

  return (
    <View style={[styles.polaroidFrame, { width }]}>
      {/* Rainbow stripe (Polaroid branding) */}
      {showRainbow && (
        <View style={styles.rainbowContainer}>
          <View style={styles.rainbowStripe}>
            <View style={[styles.stripe, { backgroundColor: '#FF6B6B' }]} />
            <View style={[styles.stripe, { backgroundColor: '#FFA500' }]} />
            <View style={[styles.stripe, { backgroundColor: '#FFD93D' }]} />
            <View style={[styles.stripe, { backgroundColor: '#6BCB77' }]} />
            <View style={[styles.stripe, { backgroundColor: '#4D96FF' }]} />
            <View style={[styles.stripe, { backgroundColor: '#9D84B7' }]} />
          </View>
        </View>
      )}

      {/* Photo */}
      <View style={styles.photoContainer}>
        <Image 
          source={{ uri: imageUri }} 
          style={[styles.photo, { width: imageSize, height: imageSize }]}
          resizeMode="cover"
        />
        {/* Vintage overlay for warm/sepia tone */}
        <View style={[styles.vintageOverlay, { width: imageSize, height: imageSize }]} />
        {/* Vignette effect (darkened corners) */}
        <View style={[styles.vignette, { width: imageSize, height: imageSize }]} />
      </View>

      {/* Bottom section with date and caption */}
      <View style={styles.bottomSection}>
        <HandwrittenText size={16} style={styles.date}>
          {formatPolaroidDate(photoDate)}
        </HandwrittenText>
        {caption ? (
          <HandwrittenText size={22} style={styles.caption}>
            {caption}
          </HandwrittenText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  polaroidFrame: {
    backgroundColor: '#F8F6F0', // Aged white/cream color
    padding: 20,
    paddingBottom: 50,
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  rainbowContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  rainbowStripe: {
    flexDirection: 'row',
    width: 60,
    height: 8,
    borderRadius: 2,
    overflow: 'hidden',
  },
  stripe: {
    flex: 1,
    height: '100%',
  },
  photoContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    borderRadius: 2,
  },
  vintageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(255, 220, 150, 0.15)', // Warm sepia tone
    borderRadius: 2,
  },
  vignette: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 40,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  bottomSection: {
    marginTop: 12,
    paddingHorizontal: 4,
  },
  date: {
    color: '#8B7355', // Faded brown color like old ink
    opacity: 0.85,
    marginBottom: 4,
  },
  caption: {
    marginTop: 6,
    lineHeight: 26,
  },
});
