import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Linking, Alert } from 'react-native';
import 'react-native-reanimated';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../src/config/supabase';
import { verifyEmail, getCurrentUser } from '../src/services/auth';
import { handleNotificationNavigation } from '../src/services/notificationNavigation';
import { requestNotificationPermissions, registerPushToken } from '../src/services/notifications';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const isAuthenticatedRef = useRef(false); // Track current auth state for closures
  const router = useRouter();
  const segments = useSegments();
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Initialize app - go straight to auth check
    console.log('🚀 App initializing...');
    checkAuth();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const wasAuthenticated = isAuthenticatedRef.current;
      const newAuthState = !!session;
      setIsAuthenticated(newAuthState);
      isAuthenticatedRef.current = newAuthState; // Update ref for closures
      
      // Request notification permissions when user logs in
      if (session && !wasAuthenticated) {
        console.log('🔔 User logged in - requesting notification permissions...');
        try {
          const { granted } = await requestNotificationPermissions();
          
          if (granted) {
            console.log('✅ Notification permissions granted');
            // Register push token
            const { user } = await getCurrentUser();
            if (user) {
              await registerPushToken(user.id);
              console.log('✅ Push token registered for user:', user.id);
            }
          } else {
            console.log('⚠️ Notification permissions denied');
          }
        } catch (error) {
          console.error('❌ Error requesting notification permissions:', error);
        }
      }
    });

    // Handle deep links for email verification
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      console.log('📱 Deep link received:', url);

      // Check if it's an auth callback
      if (url.includes('rewind://auth/callback')) {
        try {
          const urlObj = new URL(url);
          const tokenHash = urlObj.searchParams.get('token_hash');
          const type = urlObj.searchParams.get('type');

          if (tokenHash && type) {
            console.log('✅ Verifying email with token...');
            const { user, session, error } = await verifyEmail(tokenHash, type);

            if (error) {
              console.error('❌ Verification failed:', error);
              Alert.alert('Verification Failed', 'Unable to verify your email. Please try again.');
            } else if (session) {
              console.log('✅ Email verified successfully!');
              Alert.alert('Success', 'Your email has been verified! Welcome to REWIND!');
              router.replace('/(tabs)');
            }
          }
        } catch (error) {
          console.error('❌ Error handling deep link:', error);
        }
      }
    };

    // Listen for deep link when app is already open
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    // Handle notification taps
    const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data;
      
      if (!isAuthenticatedRef.current) {
        console.log('⚠️ User not authenticated, ignoring notification tap');
        return;
      }

      handleNotificationNavigation(data);
    };

    // Listen for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(async (notification) => {
      console.log('🔔 Notification received:', notification);
      
      // Store notification data for timer system
      if (notification.request.content.data?.type === 'daily_rewind') {
        await AsyncStorage.setItem('lastNotificationData', JSON.stringify(notification.request.content.data));
        console.log('⏰ Timer data stored:', notification.request.content.data);
      }
    });

    // Listen for notification taps
    responseListener.current = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);

    // Check if app was opened from a notification
    Notifications.getLastNotificationResponseAsync().then(response => {
      if (response) {
        handleNotificationResponse(response);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
      subscription.remove();
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []); // FIXED: Empty array - only run once on mount!

  const checkAuth = async () => {
    console.log('🔍 Checking authentication...');
    
    // PRODUCTION FIX: Check AsyncStorage FIRST (fast and reliable)
    try {
      console.log('🔍 Checking AsyncStorage for stored session...');
      const keys = await AsyncStorage.getAllKeys();
      const authKeys = keys.filter(key => key.includes('auth-token'));
      
      if (authKeys.length > 0) {
        const storedData = await AsyncStorage.getItem(authKeys[0]);
        if (storedData) {
          console.log('✅ Found stored session in AsyncStorage, assuming authenticated');
          setIsAuthenticated(true);
          isAuthenticatedRef.current = true;
          setIsLoading(false);
          return; // Exit early - we're authenticated!
        }
      }
      
      console.log('⚠️ No stored session in AsyncStorage');
    } catch (storageError) {
      console.error('❌ AsyncStorage check error:', storageError);
    }
    
    // No stored session found - try Supabase with short timeout
    try {
      console.log('🔍 No local session, checking with Supabase...');
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Supabase timeout')), 1000)
      );
      
      const authPromise = supabase.auth.getSession();
      
      const { data: { session } } = await Promise.race([
        authPromise,
        timeoutPromise
      ]) as any;
      
      console.log('✅ Supabase check complete:', !!session);
      const authState = !!session;
      setIsAuthenticated(authState);
      isAuthenticatedRef.current = authState;
    } catch (error) {
      console.error('⚠️ Supabase check timeout/error:', error);
      // If Supabase fails and no AsyncStorage session, assume logged out
      console.log('⚠️ Defaulting to logged out state');
      setIsAuthenticated(false);
      isAuthenticatedRef.current = false;
    } finally {
      console.log('✅ Auth check finished');
      console.log('📊 Final auth state:', isAuthenticatedRef.current);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!isAuthenticated && !inAuthGroup) {
      // User is not signed in and not on auth screen, redirect to auth
      router.replace('/auth');
    } else if (isAuthenticated && inAuthGroup) {
      // User is signed in but on auth screen, redirect to tabs
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, isLoading]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EF4249" />
      </View>
    );
  }

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

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F0',
  },
});
