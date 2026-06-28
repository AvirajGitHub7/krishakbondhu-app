/**
 * KrishakBondhu - Premium Login Screen
 */

import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { Link } from 'expo-router';
import { Colors } from '@/constants/colors';
import { authService } from '@/services/auth';
import { useAuthStore } from '@/store/authStore';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

const KeyboardWrapper = Platform.OS === 'ios' ? KeyboardAvoidingView : View;

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const { setAuth } = useAuthStore();
  const { t } = useTranslation();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(t('login.fillAllFields'), t('login.fillAllFields'));
      return;
    }

    setLoading(true);
    try {
      const response = await authService.login({ email: email.trim(), password });
      await setAuth(response.user, response.access_token);
    } catch (error: any) {
      const message = error.response?.data?.detail || t('login.error');
      Alert.alert(t('login.error'), message);
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="always"
      showsVerticalScrollIndicator={false}
    >
        {/* Header Section */}
        <View style={styles.header}>
          <Image
            source={require('../../../assets/images/login.svg')}
            style={styles.logoImage}
            contentFit="contain"
          />
          <Text style={styles.appName}>KrishakBondhu</Text>
          <Text style={styles.tagline}>কৃষক বন্ধু — Your Farming Companion</Text>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>{t('login.welcomeBack')}</Text>
          <Text style={styles.formSubtitle}>{t('login.subtitle')}</Text>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('profile.email')}</Text>
            <View style={[
              styles.inputWrapper,
              isEmailFocused && styles.inputWrapperFocused
            ]}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={isEmailFocused ? '#5ECE7D' : '#8E9F94'}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder={t('login.emailPlaceholder')}
                placeholderTextColor="#A4B3A9"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => setIsEmailFocused(false)}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('register.passwordPlaceholder').split(' ')[0]}</Text>
            <View style={[
              styles.inputWrapper,
              isPasswordFocused && styles.inputWrapperFocused
            ]}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={isPasswordFocused ? '#5ECE7D' : '#8E9F94'}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder={t('login.passwordPlaceholder')}
                placeholderTextColor="#A4B3A9"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.visibilityButton}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#8E9F94"
                />
              </TouchableOpacity>
            </View>
          </View>
          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>{t('login.signIn')}</Text>
            )}
          </TouchableOpacity>

          {/* Footer Navigation */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('login.dontHaveAccount')} </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.footerLink}>{t('login.signUp')}</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4FAF6" />
      {Platform.OS === 'ios' ? (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4FAF6', // Soft mint background
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
    paddingTop: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  logoImage: {
    width: 220,
    height: 185,
    marginBottom: 8,
  },
  appName: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1C2D24',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 13,
    color: '#6E8277',
    marginTop: 4,
    fontWeight: '500',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    marginHorizontal: 24,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 32,
    shadowColor: '#0F3A20',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1C2D24',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#6E8277',
    marginBottom: 28,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1C2D24',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAF9',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#ECEFF1',
    paddingHorizontal: 16,
  },
  inputWrapperFocused: {
    borderColor: '#5ECE7D',
    backgroundColor: '#FFFFFF',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    height: 50,
    fontSize: 15.5,
    color: '#1C2D24',
    fontWeight: '500',
  },
  visibilityButton: {
    padding: 8,
  },
  button: {
    backgroundColor: '#5ECE7D',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#5ECE7D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
    marginTop: 6,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 28,
  },
  footerText: {
    fontSize: 14,
    color: '#6E8277',
    fontWeight: '500',
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '800',
    color: '#5ECE7D',
  },
});

