import React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import HandwrittenText from './HandwrittenText';
import { formatPolaroidDate } from '../utils/dateFormatter';
import FilterOverlay from './FilterOverlay';
import CamcorderOverlay from './CamcorderOverlay';
import { PhotoStyle } from './StyleDial';
import { shouldShowFilterOverlay } from '../utils/filterPresets';

interface PolaroidFrameProps {
  imageUri: string;
  caption?: string;
  date?: Date | string;
  showRainbow?: boolean;
  width?: number;
  filterId?: PhotoStyle;
  showWatermark?: boolean;
  showOverlay?: boolean; // Control whether to render overlays (default false for posted photos)
}

export default function PolaroidFrame({
  imageUri,
  caption = '',
  date = new Date(),
  showRainbow = true,
  width = 320,
  filterId = 'polaroid',
  showWatermark = false,
  showOverlay = false, // Default to false - overlays already baked into posted photos
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
        
        {/* Filter-specific overlays */}
        <View style={[StyleSheet.absoluteFill, { width: imageSize, height: imageSize }]}>
          {/* Apply filter effects for all filters */}
          <FilterOverlay filterId={filterId} />
          
          {/* Camcorder UI overlay - REC, frame corners, etc. */}
          {/* Only show overlay if showOverlay is true (for camera preview, not posted photos) */}
          {showOverlay && shouldShowFilterOverlay(filterId) && (
            <CamcorderOverlay timestamp={photoDate} />
          )}
        </View>
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
        {showWatermark && (
          <HandwrittenText size={14} style={styles.watermark}>
            REWIND
          </HandwrittenText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  polaroidFrame: {
    backgroundColor: '#FFFFFF', // Pure white for better contrast
    padding: 20,
    paddingBottom: 50,
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
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
    color: '#000000', // Black for better visibility
    opacity: 1,
    marginBottom: 4,
  },
  caption: {
    marginTop: 6,
    lineHeight: 26,
  },
  watermark: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    color: '#000000',
    opacity: 0.7,
  },
});
