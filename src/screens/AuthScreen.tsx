import React, { useState, useEffect } from 'react';
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
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as AppleAuthentication from 'expo-apple-authentication';
import HandwrittenText from '../components/HandwrittenText';
import { signIn, signUp, signInWithApple, isAppleAuthAvailable, resendVerificationEmail, resetPassword } from '../services/auth';
import { IconSymbol } from '../../components/ui/icon-symbol';

export default function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAppleAuth, setShowAppleAuth] = useState(false);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const router = useRouter();

  useEffect(() => {
    checkAppleAuth();
  }, []);

  async function checkAppleAuth() {
    const available = await isAppleAuthAvailable();
    setShowAppleAuth(available);
  }

  const handleAuth = async () => {
    if (!email || !password || (isSignUp && !username)) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (isSignUp && !ageConfirmed) {
      Alert.alert('Age Requirement', 'You must be at least 13 years old to use Rewind. Please confirm your age.');
      return;
    }

    if (isSignUp && !termsAccepted) {
      Alert.alert('Terms Required', 'You must accept the Terms of Service to create an account. Our terms prohibit objectionable content and abusive behavior.');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { user, session, needsEmailVerification, error } = await signUp(email, password, username);
        if (error) {
          console.log('❌ Signup error:', error);
          Alert.alert('Sign Up Failed', error.message || 'Please try again');
          return;
        }
        
        console.log('✅ Signup successful. User:', user?.id);
        console.log('📧 Email verification needed:', needsEmailVerification);
        console.log('📬 Email sent to:', email);
        
        if (needsEmailVerification) {
          // Email verification required
          setPendingVerificationEmail(email);
          Alert.alert(
            'Verify Your Email',
            `We sent a verification link to ${email}. Please check your inbox (and spam folder) and click the link to verify your account.`,
            [{ text: 'OK' }]
          );
          return;
        }
        
        // User is automatically signed in after signup, navigate to app
        router.replace('/(tabs)');
      } else {
        const { user, error } = await signIn(email, password);
        if (error) {
          if (error.message?.includes('Email not confirmed')) {
            Alert.alert(
              'Email Not Verified',
              'Please verify your email before signing in. Check your inbox for the verification link.',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Resend Email', 
                  onPress: () => handleResendVerification(email) 
                }
              ]
            );
          } else {
            Alert.alert('Sign In Failed', error.message || 'Please check your credentials');
          }
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

  async function handleResendVerification(emailToVerify: string) {
    setLoading(true);
    const { error } = await resendVerificationEmail(emailToVerify);
    setLoading(false);
    
    if (error) {
      Alert.alert('Error', 'Failed to resend verification email. Please try again.');
    } else {
      Alert.alert('Email Sent', 'We sent a new verification link to your email.');
    }
  }

  async function handleAppleSignIn() {
    setLoading(true);
    try {
      const { user, error } = await signInWithApple();
      if (error) {
        Alert.alert('Sign In Failed', 'Failed to sign in with Apple. Please try again.');
        return;
      }
      if (user) {
        router.replace('/(tabs)');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong with Apple Sign In.');
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!resetEmail) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setLoading(true);
    const { error } = await resetPassword(resetEmail);
    setLoading(false);

    if (error) {
      Alert.alert('Error', 'Failed to send reset email. Please try again.');
    } else {
      Alert.alert(
        'Email Sent',
        'Check your email for a password reset link.',
        [{ text: 'OK', onPress: () => setShowForgotPassword(false) }]
      );
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <IconSymbol 
            name="camera.fill" 
            size={80} 
            color="#4A4A4A"
            style={styles.cameraIcon}
          />
          <View style={styles.titleContainer}>
            <HandwrittenText size={48} bold style={{ textAlign: 'center', width: '100%', paddingHorizontal: 10 }}>REWIND</HandwrittenText>
          </View>
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

            {!isSignUp && !showForgotPassword && !pendingVerificationEmail && (
              <TouchableOpacity
                style={styles.forgotPasswordButton}
                onPress={() => {
                  setShowForgotPassword(true);
                  setResetEmail(email);
                }}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            {isSignUp && (
              <>
              <TouchableOpacity
                style={styles.ageCheckbox}
                onPress={() => setAgeConfirmed(!ageConfirmed)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, ageConfirmed && styles.checkboxChecked]}>
                  {ageConfirmed && (
                    <IconSymbol name="checkmark" size={16} color="#FFF" />
                  )}
                </View>
                <Text style={styles.ageCheckboxText}>
                  I confirm I am at least 13 years old
                </Text>
              </TouchableOpacity>

                <TouchableOpacity
                  style={styles.ageCheckbox}
                  onPress={() => setTermsAccepted(!termsAccepted)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                    {termsAccepted && (
                      <IconSymbol name="checkmark" size={16} color="#FFF" />
                    )}
                  </View>
                  <Text style={styles.ageCheckboxText}>
                    I agree to the{' '}
                    <Text
                      style={styles.termsLink}
                      onPress={(e) => {
                        e.stopPropagation();
                        Linking.openURL('https://apollosol13.github.io/rewind-privacy-policy/terms.html');
                      }}
                    >
                      Terms of Service
                    </Text>
                    {' '}which prohibit objectionable content and abusive behavior
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {showForgotPassword ? (
              <View style={styles.forgotPasswordContainer}>
                <Text style={styles.forgotPasswordTitle}>Reset Password</Text>
                <Text style={styles.forgotPasswordSubtitle}>
                  Enter your email and we'll send you a reset link
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#999"
                  value={resetEmail}
                  onChangeText={setResetEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleForgotPassword}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.submitButtonText}>Send Reset Link</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => setShowForgotPassword(false)}
                >
                  <Text style={styles.backButtonText}>Back to Sign In</Text>
                </TouchableOpacity>
              </View>
            ) : pendingVerificationEmail ? (
              <View style={styles.verificationNotice}>
                <IconSymbol name="envelope.fill" size={40} color="#EF4249" />
                <Text style={styles.verificationTitle}>Check Your Email</Text>
                <Text style={styles.verificationText}>
                  We sent a verification link to{'\n'}
                  <Text style={styles.verificationEmail}>{pendingVerificationEmail}</Text>
                </Text>
                <TouchableOpacity
                  style={styles.resendButton}
                  onPress={() => handleResendVerification(pendingVerificationEmail)}
                  disabled={loading}
                >
                  <Text style={styles.resendButtonText}>Resend Email</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => setPendingVerificationEmail(null)}
                >
                  <Text style={styles.backButtonText}>Back to Sign In</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
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

                {showAppleAuth && !isSignUp && (
                  <>
                    <View style={styles.divider}>
                      <View style={styles.dividerLine} />
                      <Text style={styles.dividerText}>or</Text>
                      <View style={styles.dividerLine} />
                    </View>

                    <AppleAuthentication.AppleAuthenticationButton
                      buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                      cornerRadius={10}
                      style={styles.appleButton}
                      onPress={handleAppleSignIn}
                    />
                  </>
                )}
              </>
            )}

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

            {isSignUp && (
              <View style={styles.legalText}>
                <Text style={styles.legalTextContent}>
                  By signing up, you agree to our{' '}
                  <Text
                    style={styles.legalLink}
                    onPress={() => Linking.openURL('https://apollosol13.github.io/rewind-privacy-policy/terms.html')}
                  >
                    Terms of Service
                  </Text>
                  {' '}and{' '}
                  <Text
                    style={styles.legalLink}
                    onPress={() => Linking.openURL('https://apollosol13.github.io/rewind-privacy-policy/')}
                  >
                    Privacy Policy
                  </Text>
                  .
                </Text>
              </View>
            )}
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
    paddingHorizontal: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  cameraIcon: {
    marginBottom: 16,
  },
  titleContainer: {
    overflow: 'visible',
    paddingHorizontal: 30,
    width: '100%',
    alignItems: 'center',
    marginHorizontal: 20,
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
    backgroundColor: '#EF4249',
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
  legalText: {
    marginTop: 12,
    paddingHorizontal: 8,
  },
  legalTextContent: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    lineHeight: 18,
  },
  legalLink: {
    color: '#EF4249',
    textDecorationLine: 'underline',
  },
  ageCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#EF4249',
    borderColor: '#EF4249',
  },
  ageCheckboxText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  termsLink: {
    color: '#EF4249',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 14,
    color: '#999',
  },
  appleButton: {
    width: '100%',
    height: 50,
  },
  verificationNotice: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  verificationTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  verificationText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  verificationEmail: {
    fontWeight: '600',
    color: '#EF4249',
  },
  resendButton: {
    backgroundColor: '#EF4249',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  resendButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    paddingVertical: 12,
  },
  backButtonText: {
    color: '#666',
    fontSize: 14,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    paddingVertical: 4,
    marginTop: -8,
  },
  forgotPasswordText: {
    color: '#EF4249',
    fontSize: 14,
    fontWeight: '500',
  },
  forgotPasswordContainer: {
    gap: 12,
    marginTop: 8,
  },
  forgotPasswordTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },
  forgotPasswordSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
});
