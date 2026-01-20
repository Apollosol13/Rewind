import { useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { updatePassword, verifyEmail } from '../../src/services/auth';
import { IconSymbol } from '../../components/ui/icon-symbol';

export default function ResetPassword() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenVerified, setTokenVerified] = useState(false);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    verifyResetToken();
  }, []);

  const verifyResetToken = async () => {
    try {
      const tokenHash = params.token_hash as string;
      const type = params.type as string;

      if (tokenHash && type) {
        // Verify the token to establish session
        const { error } = await verifyEmail(tokenHash, type);
        
        if (error) {
          Alert.alert(
            'Invalid Link',
            'This password reset link is invalid or has expired. Please request a new one.',
            [{ text: 'OK', onPress: () => router.replace('/auth') }]
          );
        } else {
          setTokenVerified(true);
        }
      } else {
        Alert.alert(
          'Invalid Link',
          'This password reset link is invalid. Please request a new one.',
          [{ text: 'OK', onPress: () => router.replace('/auth') }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Something went wrong. Please try again.',
        [{ text: 'OK', onPress: () => router.replace('/auth') }]
      );
    } finally {
      setVerifying(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in both fields');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    const { error } = await updatePassword(newPassword);
    setLoading(false);

    if (error) {
      Alert.alert('Error', 'Failed to update password. Please try again.');
    } else {
      Alert.alert(
        'Success',
        'Your password has been updated!',
        [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
      );
    }
  };

  if (verifying) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#EF4249" />
        <Text style={styles.verifyingText}>Verifying reset link...</Text>
      </View>
    );
  }

  if (!tokenVerified) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Invalid or expired link</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <IconSymbol name="lock.fill" size={60} color="#EF4249" style={styles.icon} />
        <Text style={styles.title}>Reset Your Password</Text>
        <Text style={styles.subtitle}>Enter your new password below</Text>

        <TextInput
          style={styles.input}
          placeholder="New Password"
          placeholderTextColor="#999"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor="#999"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleResetPassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Update Password</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F0',
    paddingHorizontal: 30,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  icon: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#EF4249',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  verifyingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4249',
    textAlign: 'center',
  },
});
