import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { IconSymbol } from '../../components/ui/icon-symbol';

export type PhotoStyle = 'polaroid' | 'vintage' | 'sepia' | 'legacy' | 'film';

interface StyleOption {
  id: PhotoStyle;
  label: string;
  icon: string;
  color: string;
  description: string;
}

const STYLE_OPTIONS: StyleOption[] = [
  { 
    id: 'polaroid', 
    label: 'Polaroid', 
    icon: 'photo', 
    color: '#EF4249',
    description: '1970s-80s instant film with warm tones and soft focus'
  },
  { 
    id: 'vintage', 
    label: 'Vintage', 
    icon: 'camera.filters', 
    color: '#FFB347',
    description: '1960s-70s faded colors, reduced contrast, warm nostalgic glow'
  },
  { 
    id: 'sepia', 
    label: 'Sepia', 
    icon: 'sparkles', 
    color: '#B8956A',
    description: '1900s-1930s aged photo look with brown-tone monochrome'
  },
  { 
    id: 'legacy', 
    label: 'Legacy', 
    icon: 'building.columns.fill', 
    color: '#C9A66B',
    description: 'Timeless old money aesthetic with warm, muted tones and soft sophistication'
  },
  { 
    id: 'film', 
    label: 'B&W', 
    icon: 'film', 
    color: '#4D96FF',
    description: 'Clean black & white with balanced contrast and cool tone'
  },
];

interface StyleDialProps {
  selectedStyle: PhotoStyle;
  onStyleChange: (style: PhotoStyle) => void;
}

export default function StyleDial({ selectedStyle, onStyleChange }: StyleDialProps) {
  return (
    <View style={styles.container}>
      <View style={styles.dial}>
        {/* Dial Background */}
        <View style={styles.dialBackground}>
          <View style={styles.dialCenter} />
        </View>

        {/* Style Options */}
        {STYLE_OPTIONS.map((option, index) => {
          const isSelected = selectedStyle === option.id;
          const angle = (index / STYLE_OPTIONS.length) * 360;
          const radius = 35;
          const radian = (angle - 90) * (Math.PI / 180);
          const x = radius * Math.cos(radian);
          const y = radius * Math.sin(radian);

          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.styleOption,
                {
                  transform: [
                    { translateX: x },
                    { translateY: y },
                  ],
                },
                isSelected && styles.styleOptionSelected,
                isSelected && { backgroundColor: option.color },
              ]}
              onPress={() => onStyleChange(option.id)}
              activeOpacity={0.7}
            >
              <IconSymbol 
                name={option.icon as any} 
                size={isSelected ? 18 : 14} 
                color={isSelected ? '#FFF' : option.color} 
              />
            </TouchableOpacity>
          );
        })}

        {/* Selected Style Label */}
        <View style={styles.labelContainer}>
          <Text style={styles.label}>
            {STYLE_OPTIONS.find(s => s.id === selectedStyle)?.label}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dial: {
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  dialBackground: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#E8E8E8',
  },
  dialCenter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#DDD',
    borderWidth: 2,
    borderColor: '#CCC',
  },
  styleOption: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  styleOptionSelected: {
    width: 38,
    height: 38,
    borderRadius: 19,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#FFF',
  },
  labelContainer: {
    position: 'absolute',
    bottom: -24,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  label: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
});
