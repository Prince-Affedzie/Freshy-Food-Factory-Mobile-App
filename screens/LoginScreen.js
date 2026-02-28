// src/screens/auth/LoginScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";

const GoogleLogo = require('../assets/Google-logo.png');

// Simple Loading Component - defined inline
const LoadingOverlay = ({ visible, message = 'Loading...' }) => {
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.loadingOverlay, { opacity: fadeAnim }]}>
      <View style={styles.loadingContainer}>
        <View style={styles.loadingSpinner}>
          <Ionicons name="refresh" size={30} color="#4CAF50" style={styles.spinningIcon} />
        </View>
        <Text style={styles.loadingText}>{message}</Text>
      </View>
    </Animated.View>
  );
};

const LoginScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const { login: authLogin, google_login } = useAuth();

  // Configure Google Sign-In on component mount
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '34872065423-88pioj4h26bguflctfpub95mt0830an6.apps.googleusercontent.com',
    });
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[0-9]{10,15}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    
    try {
      // Check if Google Play Services are available (Android only)
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({
          showPlayServicesUpdateDialog: true,
        });
      }

      // Sign out first to clear any previous session
      try {
        await GoogleSignin.signOut();
      } catch (signOutError) {
        // Ignore sign out errors
        console.log('Sign out error:', signOutError);
      }

      // Sign in with Google
      const res = await GoogleSignin.signIn();
      const  idToken  = res.data.idToken;
    
      const response = await google_login({  token: idToken, });

      if (response.success) {
        Alert.alert(
          'Welcome to FreshyFoodFactory!',
          `Welcome back,! 🎉`,
          [{ text: 'Continue', onPress: () => console.log('Navigated to home') }]
        );
      } else {
        Alert.alert(
          'Login Failed', 
          response.error || 'Unable to authenticate with Google. Please try again.'
        );
      }
      
    } catch (error) {
      console.error('Google Login Error:', error);
      
      // Handle specific Google Sign-In errors
      switch (error.code) {
        case statusCodes.SIGN_IN_CANCELLED:
          Alert.alert('Google Sign-In Cancelled', 'You cancelled the sign-in process.');
          break;
        case statusCodes.IN_PROGRESS:
          Alert.alert('Google Sign-In In Progress', 'A sign-in operation is already in progress.');
          break;
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          Alert.alert(
            'Google Play Services Not Available',
            'Google Play Services are not available or outdated. Please update.'
          );
          break;
        default:
          Alert.alert(
            'Google Sign-In Failed',
            error.message || 'An error occurred during Google Sign-In. Please try again.'
          );
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const loginData = {
        phone: formData.phone.trim(),
        password: formData.password,
      };

      const response = await authLogin(loginData);

      if (response.success) {
        Alert.alert('Welcome Back!', 'Login successful 🎉');
      } else {
        Alert.alert('Login Failed', response.error || 'Please check your credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const handleQuickLogin = (demoType) => {
    if (demoType === 'customer') {
      setFormData({
        phone: '0541234567',
        password: '123456',
      });
    }
  };

  // Combined loading state
  const isLoading = loading || googleLoading;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}> 
          <View style={styles.logoContainer}>
            <Ionicons name="leaf" size={48} color="#4CAF50" />
            <Text style={styles.logoText}>FreshyFoodFactory</Text>
          </View>
          
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue your fresh food journey</Text>
        </View>

        {/* Social Login */}
        <View style={styles.socialContainer}>
          <TouchableOpacity 
            style={[styles.socialButton, googleLoading && styles.socialButtonDisabled]}
            onPress={handleGoogleLogin}
            disabled={googleLoading || loading}
          >
            {googleLoading ? (
              <View style={styles.socialButtonLoading}>
                <Ionicons name="logo-google" size={20} color="#DB4437" />
                <Text style={styles.socialButtonText}>Connecting...</Text>
              </View>
            ) : (
              <>
                <Image 
                  source={GoogleLogo}
                  style={styles.googleLogo}
                />
                <Text style={styles.socialButtonText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.divider} />
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Phone Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={[styles.inputContainer, errors.phone && styles.inputError]}>
              <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your phone number"
                value={formData.phone}
                onChangeText={(text) => handleInputChange('phone', text.replace(/[^0-9]/g, ''))}
                keyboardType="phone-pad"
                maxLength={15}
                editable={!isLoading}
                autoCapitalize="none"
              />
            </View>
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <View style={styles.passwordHeader}>
              <Text style={styles.label}>Password</Text>
              <TouchableOpacity onPress={handleForgotPassword} disabled={isLoading}>
                <Text style={[styles.forgotPassword, isLoading && styles.disabledText]}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.inputContainer, errors.password && styles.inputError]}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Enter your password"
                value={formData.password}
                onChangeText={(text) => handleInputChange('password', text)}
                secureTextEntry={!showPassword}
                editable={!isLoading}
                autoCapitalize="none"
                onSubmitEditing={handleLogin}
                returnKeyType="go"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={isLoading ? "#999" : "#666"}
                />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>

          {/* Remember Me (Optional) */}
          <TouchableOpacity 
            style={styles.rememberContainer} 
            disabled={isLoading}
          >
            <View style={[styles.checkbox, isLoading && styles.checkboxDisabled]}>
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            </View>
            <Text style={[styles.rememberText, isLoading && styles.disabledText]}>
              Remember me
            </Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {loading ? (
              <View style={styles.buttonLoadingContent}>
                <Ionicons name="refresh" size={20} color="#FFFFFF" style={styles.buttonSpinner} />
                <Text style={styles.loginButtonText}>Signing In...</Text>
              </View>
            ) : (
              <>
                <Text style={styles.loginButtonText}>Sign In</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View style={styles.signupLinkContainer}>
            <Text style={styles.signupLinkText}>Don't have an account? </Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('SignUp')} 
              disabled={isLoading}
            >
              <Text style={[styles.signupLink, isLoading && styles.disabledText]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Simple Loading Overlay */}
      <LoadingOverlay 
        visible={isLoading}
        message={
          googleLoading ? "Signing in with Google..." : 
          loading ? "Logging in..." : 
          "Loading..."
        }
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginLeft: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  forgotPassword: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  disabledText: {
    color: '#999',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
  },
  inputError: {
    borderColor: '#F44336',
    backgroundColor: '#FFF5F5',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 14,
  },
  passwordInput: {
    paddingRight: 40,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    padding: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 4,
    marginLeft: 4,
  },
  googleLogo: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxDisabled: {
    backgroundColor: '#A5D6A7',
  },
  rememberText: {
    fontSize: 14,
    color: '#666',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 24,
  },
  loginButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  buttonLoadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSpinner: {
    marginRight: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    paddingHorizontal: 16,
    color: '#666',
    fontSize: 14,
  },
  socialContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  socialButtonDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  socialButtonLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialButtonText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    fontWeight: '500',
  },
  signupLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  signupLinkText: {
    fontSize: 16,
    color: '#666',
  },
  signupLink: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  // Loading Overlay Styles
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingContainer: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingSpinner: {
    marginBottom: 15,
  },
  spinningIcon: {
    transform: [{ rotate: '0deg' }],
    animationKeyframes: {
      '0%': { transform: [{ rotate: '0deg' }] },
      '100%': { transform: [{ rotate: '360deg' }] },
    },
    animationDuration: '1s',
    animationIterationCount: 'infinite',
    animationTimingFunction: 'linear',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
});

// Add animation to the icon using Animated
const AnimatedLoginScreen = (props) => {
  const spinValue = new Animated.Value(0);
  
  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={{ flex: 1 }}>
      <LoginScreen {...props} spinAnimation={spin} />
    </Animated.View>
  );
};

export default LoginScreen;