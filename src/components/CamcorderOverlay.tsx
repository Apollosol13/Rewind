import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface CamcorderOverlayProps {
  timestamp?: Date;
}

/**
 * VHS/Camcorder overlay with REC indicator, timestamp, and retro UI
 * Mimics 1980s-90s camcorder display
 */
export default function CamcorderOverlay({ timestamp = new Date() }: CamcorderOverlayProps) {

  const formatDate = (date: Date) => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const formatTimestamp = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <View style={styles.overlay} pointerEvents="none">
      {/* Frame corners */}
      <View style={styles.cornerTopLeft} />
      <View style={styles.cornerTopRight} />
      <View style={styles.cornerBottomLeft} />
      <View style={styles.cornerBottomRight} />

      {/* Top bar */}
      <View style={styles.topBar}>
        {/* REC indicator */}
        <View style={styles.recContainer}>
          <Text style={styles.recText}>REC</Text>
          <View style={styles.recDot} />
        </View>

        {/* VCR TAPE REWIND text */}
        <View style={styles.tapeContainer}>
          <Text style={styles.tapeText}>VCR TAPE</Text>
          <Text style={styles.tapeText}>REWIND</Text>
        </View>

        {/* Battery */}
        <View style={styles.batteryContainer}>
          <View style={styles.batteryBody}>
            <View style={styles.batteryLevel} />
          </View>
          <View style={styles.batteryTip} />
          <Text style={styles.batteryText}>62%</Text>
        </View>
      </View>

      {/* Center crosshair */}
      <View style={styles.crosshair}>
        <View style={styles.crosshairHorizontal} />
        <View style={styles.crosshairVertical} />
      </View>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <Text style={styles.bottomText}>VHS</Text>
        <Text style={styles.bottomText}>SP</Text>
        <View style={styles.bottomRight}>
          <Text style={styles.dateText}>{formatDate(timestamp)}</Text>
          <Text style={styles.timeText}>{formatTimestamp(timestamp)}</Text>
        </View>
      </View>

      {/* Scan lines effect */}
      <View style={styles.scanlines} />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },

  // Frame corners (red) - adjusted to fit full frame
  cornerTopLeft: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 50,
    height: 50,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#FF0000',
  },
  cornerTopRight: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 50,
    height: 50,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: '#FF0000',
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    width: 50,
    height: 50,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#FF0000',
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 50,
    height: 50,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: '#FF0000',
  },

  // Top bar
  topBar: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // REC indicator
  recContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  recText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    marginRight: 6,
  },
  recDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF0000',
  },

  // Timer
  timer: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },

  // VCR TAPE text
  tapeContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignItems: 'flex-end',
  },
  tapeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    lineHeight: 12,
  },

  // Battery
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  batteryBody: {
    width: 24,
    height: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 2,
    padding: 1,
    marginRight: 2,
  },
  batteryLevel: {
    width: '70%',
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  batteryTip: {
    width: 3,
    height: 6,
    backgroundColor: '#FFFFFF',
    marginRight: 6,
  },
  batteryText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },

  // Center crosshair
  crosshair: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 30,
    height: 30,
    marginTop: -15,
    marginLeft: -15,
  },
  crosshairHorizontal: {
    position: 'absolute',
    top: 14,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  crosshairVertical: {
    position: 'absolute',
    left: 14,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  bottomText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  bottomRight: {
    flexDirection: 'row',
    gap: 12,
  },
  dateText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },

  // Scan lines effect
  scanlines: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    opacity: 0.1,
    // This creates a repeating pattern effect
    // In a real implementation, you'd use a pattern image or SVG
  },
});
