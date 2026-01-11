import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import HandwrittenText from '../components/HandwrittenText';
import { signIn, signUp } from '../services/auth';

export default function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAuth = async () => {
    if (!email || !password || (isSignUp && !username)) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { user, error } = await signUp(email, password, username);
        if (error) {
          Alert.alert('Sign Up Failed', error.message || 'Please try again');
          return;
        }
        Alert.alert('Success! 🎉', 'Account created! Please sign in.');
        setIsSignUp(false);
      } else {
        const { user, error } = await signIn(email, password);
        if (error) {
          Alert.alert('Sign In Failed', error.message || 'Please check your credentials');
          return;
        }
        // Navigate to main app
        router.replace('/(tabs)');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.emoji}>📸</Text>
          <HandwrittenText size={48} bold>Rewind</HandwrittenText>
          <Text style={styles.tagline}>Capture nostalgic moments</Text>
        </View>

        {/* Polaroid-style card */}
        <View style={styles.formCard}>
          <View style={styles.rainbowStripe}>
            <View style={[styles.stripe, { backgroundColor: '#FF6B6B' }]} />
            <View style={[styles.stripe, { backgroundColor: '#FFA500' }]} />
            <View style={[styles.stripe, { backgroundColor: '#FFD93D' }]} />
            <View style={[styles.stripe, { backgroundColor: '#6BCB77' }]} />
            <View style={[styles.stripe, { backgroundColor: '#4D96FF' }]} />
            <View style={[styles.stripe, { backgroundColor: '#9D84B7' }]} />
          </View>

          <View style={styles.formContent}>
            <Text style={styles.formTitle}>
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </Text>

            {isSignUp && (
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="#999"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
            )}

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleAuth}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isSignUp ? 'Sign Up' : 'Sign In'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => setIsSignUp(!isSignUp)}
              disabled={loading}
            >
              <Text style={styles.switchText}>
                {isSignUp
                  ? 'Already have an account? Sign In'
                  : "Don't have an account? Sign Up"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F0',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  emoji: {
    fontSize: 60,
    marginBottom: 10,
  },
  tagline: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    letterSpacing: 1,
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  rainbowStripe: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 24,
  },
  stripe: {
    flex: 1,
  },
  formContent: {
    gap: 16,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  submitButton: {
    backgroundColor: '#FF4444',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  switchButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  switchText: {
    color: '#666',
    fontSize: 14,
  },
});
