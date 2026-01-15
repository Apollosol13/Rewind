import { Stack } from 'expo-router';
import FollowListScreen from '../src/screens/FollowListScreen';

export default function FollowList() {
  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerStyle: { backgroundColor: '#FAF9F6' },
          headerTintColor: '#FF4444',
          headerShadowVisible: false,
        }}
      />
      <FollowListScreen />
    </>
  );
}
