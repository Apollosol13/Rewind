import React from 'react';
import { Text, TextStyle, StyleSheet } from 'react-native';
import { useFonts, Caveat_400Regular, Caveat_700Bold } from '@expo-google-fonts/caveat';

interface HandwrittenTextProps {
  children: React.ReactNode;
  style?: TextStyle;
  bold?: boolean;
  size?: number;
}

export default function HandwrittenText({ 
  children, 
  style, 
  bold = false,
  size = 24 
}: HandwrittenTextProps) {
  let [fontsLoaded] = useFonts({
    Caveat_400Regular,
    Caveat_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Text 
      style={[
        styles.handwritten,
        { 
          fontFamily: bold ? 'Caveat_700Bold' : 'Caveat_400Regular',
          fontSize: size,
        },
        style
      ]}
      numberOfLines={1}
      adjustsFontSizeToFit={false}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  handwritten: {
    color: '#2C2C2C',
    letterSpacing: 0.5,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
