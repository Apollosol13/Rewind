import { Tabs, useRouter, usePathname } from 'expo-router';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { HapticTab } from '../../components/haptic-tab';

// Simple event emitter for tab refresh
class SimpleEmitter {
  private listeners: Record<string, Array<() => void>> = {};

  addListener(event: string, callback: () => void) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
    return { remove: () => { this.listeners[event] = this.listeners[event].filter(cb => cb !== callback); } };
  }

  emit(event: string) {
    (this.listeners[event] || []).forEach(cb => cb());
  }
}

export const tabRefreshEmitter = new SimpleEmitter();

export default function TabLayout() {
  const pathname = usePathname();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#EF4249',
        tabBarInactiveTintColor: '#999',
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: '#FFF',
          borderTopWidth: 1,
          borderTopColor: '#F0F0F0',
          height: 85,
          paddingBottom: 25,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              name={focused ? 'camera.fill' : 'camera'} 
              size={28} 
              color={color} 
            />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            // If already on feed tab, emit refresh event
            if (pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/index' || pathname === '/index') {
              tabRefreshEmitter.emit('refreshFeed');
            }
          },
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              name={focused ? 'envelope.fill' : 'envelope'} 
              size={28} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              name={focused ? 'person.fill' : 'person'} 
              size={28} 
              color={color} 
            />
          ),
        }}
      />
    </Tabs>
  );
}
