import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { getUnreadCount } from '../services/stickyMessages';
import { getCurrentUser } from '../services/auth';

interface MessagesTabIconProps {
  color: string;
  focused: boolean;
}

export default function MessagesTabIcon({ color, focused }: MessagesTabIconProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadUnreadCount();

    // Poll for unread messages every 30 seconds
    const interval = setInterval(() => {
      loadUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadUnreadCount = async () => {
    const { user } = await getCurrentUser();
    if (user) {
      const { count } = await getUnreadCount(user.id);
      setUnreadCount(count);
    }
  };

  return (
    <View style={styles.container}>
      <IconSymbol 
        size={28} 
        name={focused ? 'envelope.fill' : 'envelope'} 
        color={color} 
      />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: '#EF4249',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
});
