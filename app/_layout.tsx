import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="camera" 
          options={{ 
            presentation: 'fullScreenModal',
            animation: 'slide_from_bottom',
          }} 
        />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
