import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

/**
 * OAuth callback handler
 * Handles redirects from Apple Sign In and other OAuth providers
 */
export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // The actual auth handling is done by Supabase in the deep link handler
    // This screen just shows a loading state briefly before redirecting
    const timer = setTimeout(() => {
      router.replace('/(tabs)');
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#EF4249" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF9F6',
  },
});
