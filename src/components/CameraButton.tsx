import React from 'react';
import { TouchableOpacity, View, StyleSheet, Text } from 'react-native';
import * as Haptics from 'expo-haptics';

interface CameraButtonProps {
  onPress: () => void;
  label?: string;
}

export default function CameraButton({ onPress, label }: CameraButtonProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity 
        style={styles.shutterButton}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={styles.shutterInner} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  label: {
    color: '#666',
    fontSize: 12,
    marginBottom: 8,
    fontWeight: '600',
    letterSpacing: 1,
  },
  shutterButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EF4249',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  shutterInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#CC0000',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
});
