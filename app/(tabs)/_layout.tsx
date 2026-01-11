import { Tabs } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FF4444',
        tabBarInactiveTintColor: '#999',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E0E0E0',
          borderTopWidth: 1,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 24 }}>{focused ? '📸' : '📷'}</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 24 }}>{focused ? '👤' : '👥'}</Text>
          ),
        }}
      />
    </Tabs>
  );
}
