import { useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { View, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { verifyEmail } from '../../src/services/auth';

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    handleVerification();
  }, []);

  const handleVerification = async () => {
    try {
      const tokenHash = params.token_hash as string;
      const type = params.type as string;

      if (tokenHash && type) {
        console.log('✅ Verifying email with token...');
        const { user, session, error } = await verifyEmail(tokenHash, type);

        if (error) {
          console.error('❌ Verification failed:', error);
          Alert.alert(
            'Verification Failed',
            'Unable to verify your email. Please try again.',
            [{ text: 'OK', onPress: () => router.replace('/auth') }]
          );
        } else if (session) {
          console.log('✅ Email verified successfully!');
          Alert.alert(
            'Success',
            'Your email has been verified! Welcome to REWND!',
            [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
          );
        }
      } else {
        // No valid params, redirect to auth
        console.log('⚠️ No token params found, redirecting to auth');
        router.replace('/auth');
      }
    } catch (error) {
      console.error('❌ Error handling verification:', error);
      Alert.alert(
        'Error',
        'Something went wrong. Please try again.',
        [{ text: 'OK', onPress: () => router.replace('/auth') }]
      );
    }
  };

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
    backgroundColor: '#F5F5F0',
  },
});
