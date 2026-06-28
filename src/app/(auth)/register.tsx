/**
 * KrishakBondhu - Premium Register Screen
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
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

const KeyboardWrapper = Platform.OS === 'ios' ? KeyboardAvoidingView : View;

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { setAuth } = useAuthStore();
  const { t } = useTranslation();

  // Focus States
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);
  const [isLocationFocused, setIsLocationFocused] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert(t('register.fillAllFields'), t('register.fillAllFields'));
      return;
    }
    if (password.length < 6) {
      Alert.alert(t('register.passwordTooShort'), t('register.passwordTooShort'));
      return;
    }

    setLoading(true);
    try {
      const response = await authService.register({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
        location: location.trim() || undefined,
      });
      await setAuth(response.user, response.access_token);
    } catch (error: any) {
      const message = error.response?.data?.detail || t('register.error');
      Alert.alert(t('register.error'), message);
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
          <Text style={styles.headerEmoji}>🌱</Text>
          <Text style={styles.appName}>KrishakBondhu</Text>
          <Text style={styles.tagline}>{t('register.subtitle')}</Text>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>{t('register.createAccount')}</Text>
          <Text style={styles.formSubtitle}>{t('register.subtitle')}</Text>

          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('register.namePlaceholder')} *</Text>
            <View style={[
              styles.inputWrapper,
              isNameFocused && styles.inputWrapperFocused
            ]}>
              <Ionicons
                name="person-outline"
                size={20}
                color={isNameFocused ? '#5ECE7D' : '#8E9F94'}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder={t('register.namePlaceholder')}
                placeholderTextColor="#A4B3A9"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                onFocus={() => setIsNameFocused(true)}
                onBlur={() => setIsNameFocused(false)}
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('profile.email')} *</Text>
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
                placeholder={t('register.emailPlaceholder')}
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

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('register.passwordPlaceholder').split(' ')[0]} *</Text>
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
                placeholder={t('register.passwordPlaceholder')}
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

          {/* Phone */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('profile.phone')}</Text>
            <View style={[
              styles.inputWrapper,
              isPhoneFocused && styles.inputWrapperFocused
            ]}>
              <Ionicons
                name="call-outline"
                size={20}
                color={isPhoneFocused ? '#5ECE7D' : '#8E9F94'}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder={t('register.phonePlaceholder')}
                placeholderTextColor="#A4B3A9"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                onFocus={() => setIsPhoneFocused(true)}
                onBlur={() => setIsPhoneFocused(false)}
              />
            </View>
          </View>

          {/* Location */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('profile.location')}</Text>
            <View style={[
              styles.inputWrapper,
              isLocationFocused && styles.inputWrapperFocused
            ]}>
              <Ionicons
                name="pin-outline"
                size={20}
                color={isLocationFocused ? '#5ECE7D' : '#8E9F94'}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder={t('register.locationPlaceholder')}
                placeholderTextColor="#A4B3A9"
                value={location}
                onChangeText={setLocation}
                onFocus={() => setIsLocationFocused(true)}
                onBlur={() => setIsLocationFocused(false)}
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>{t('register.createAccount')}</Text>
            )}
          </TouchableOpacity>

          {/* Footer Navigation */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('register.alreadyHaveAccount')} </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.footerLink}>{t('register.signIn')}</Text>
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
    marginBottom: 20,
    paddingTop: 20,
  },
  headerEmoji: {
    fontSize: 50,
    marginBottom: 6,
  },
  appName: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1C2D24',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 13.5,
    color: '#6E8277',
    marginTop: 4,
    fontWeight: '500',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    marginHorizontal: 24,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 32,
    shadowColor: '#0F3A20',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1C2D24',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  formSubtitle: {
    fontSize: 13.5,
    color: '#6E8277',
    marginBottom: 24,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
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
    paddingVertical: 13,
    height: 50,
    fontSize: 15,
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
    marginTop: 12,
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
    marginTop: 24,
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
