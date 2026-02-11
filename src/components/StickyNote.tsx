import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import HandwrittenText from './HandwrittenText';
import { IconSymbol } from '../../components/ui/icon-symbol';

interface StickyNoteProps {
  text: string;
  color?: string;
  onDelete?: () => void;
  showDelete?: boolean;
  truncate?: boolean;
  maxLines?: number;
}

const colorMap: Record<string, string> = {
  yellow: '#FEFF9C',
  pink: '#FFB5E8',
  blue: '#AFF8DB',
  green: '#B5F5B5',
  orange: '#FFD5A3',
};

export default function StickyNote({ 
  text, 
  color = 'yellow', 
  onDelete,
  showDelete = true,
  truncate = false,
  maxLines = 4,
}: StickyNoteProps) {
  const bgColor = colorMap[color] || colorMap.yellow;

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {showDelete && onDelete && (
        <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
          <IconSymbol name="xmark.circle.fill" size={20} color="rgba(0,0,0,0.3)" />
        </TouchableOpacity>
      )}
      
      <HandwrittenText 
        size={14} 
        style={styles.text}
        numberOfLines={truncate ? maxLines : undefined}
      >
        {text}
      </HandwrittenText>
      
      {/* Sticky note shadow at bottom */}
      <View style={styles.bottomShadow} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    minHeight: 120,
    padding: 16,
    paddingTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
    position: 'relative',
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
  },
  text: {
    color: '#333',
    lineHeight: 22,
  },
  bottomShadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
});
