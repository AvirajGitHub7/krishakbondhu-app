/**
 * KrishakBondhu - Premium Profile Screen (Farmer Contribution Hub)
 */

import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  FlatList,
  Pressable,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { authService } from '@/services/auth';
import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as SecureStore from 'expo-secure-store';
import { LinearGradient } from 'expo-linear-gradient';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type IconName = keyof typeof Ionicons.glyphMap;

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'as', name: 'অসমীয়া (Assamese)' },
  { code: 'bn', name: 'বাংলা (Bengali)' },
  { code: 'kha', name: 'Khasi' },
  { code: 'gar', name: 'Garo' },
  { code: 'hi', name: 'हिन्दी (Hindi)' },
  { code: 'brx', name: 'Boro' },
];

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuthStore();
  const { t, i18n } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handlePickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('profile.accessRequired', 'Access Required'), t('profile.galleryPermission', 'Permission to access gallery is required.'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.5,
      base64: true,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets && result.assets[0].base64) {
      setUploadingAvatar(true);
      try {
        const updatedUser = await authService.updateProfile({
          avatar_base64: result.assets[0].base64,
        });
        await updateUser(updatedUser);
      } catch (e: any) {
        Alert.alert(t('profile.updateFailed', 'Update Failed'), e.response?.data?.detail || 'Error uploading avatar');
      } finally {
        setUploadingAvatar(false);
      }
    }
  };

  const handleLogout = () => {
    Alert.alert(t('profile.logoutConfirmTitle'), t('profile.logoutConfirmDesc'), [
      { text: t('profile.cancel'), style: 'cancel' },
      { text: t('profile.logout'), style: 'destructive', onPress: logout },
    ]);
  };

  const selectLanguage = async (code: string) => {
    await i18n.changeLanguage(code);
    await SecureStore.setItemAsync('user_language', code);
    setModalVisible(false);
  };

  const getLanguageName = (code: string) => {
    const lang = LANGUAGES.find((l) => l.code === code);
    return lang ? lang.name : 'English';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <TouchableOpacity style={styles.avatarLarge} onPress={handlePickAvatar} activeOpacity={0.8}>
          {uploadingAvatar ? (
            <ActivityIndicator color="#0F3A20" size="large" />
          ) : user?.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarLargeText}>
              {user?.name?.[0]?.toUpperCase() || '?'}
            </Text>
          )}
          <View style={styles.editAvatarBadge}>
            <Ionicons name="camera" size={14} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.role?.toUpperCase()}</Text>
        </View>
      </View>

      {/* Profile Settings */}
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>{t('profile.accountDetails')}</Text>
        <View style={styles.settingsCard}>
          <SettingRow icon="mail-outline" label={t('profile.email')} value={user?.email || '-'} />
          <SettingRow icon="call-outline" label={t('profile.phone')} value={user?.phone || 'Not set'} />
          <SettingRow icon="location-outline" label={t('profile.location')} value={user?.location || 'Not set'} />
          <SettingRow
            icon="calendar-outline"
            label={t('profile.joined')}
            value={
              user?.created_at
                ? new Date(user.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : '-'
            }
            last
          />
        </View>
      </View>


      {/* App Preferences */}
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>{t('profile.appPreferences')}</Text>
        <View style={styles.settingsCard}>
          <TouchableOpacity onPress={() => setModalVisible(true)} activeOpacity={0.7}>
            <SettingRow
              icon="language-outline"
              label={t('profile.language')}
              value={getLanguageName(i18n.language)}
              last
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>{t('profile.about')}</Text>
        <View style={styles.settingsCard}>
          <SettingRow icon="leaf-outline" label={t('profile.app')} value="KrishakBondhu" />
          <SettingRow icon="code-slash-outline" label={t('profile.version')} value="1.0.0" last />
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={20} color="#D32F2F" style={{ marginRight: 8 }} />
        <Text style={styles.logoutText}>{t('profile.logout')}</Text>
      </TouchableOpacity>

      {/* Language Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalDragHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Language / ভাষা নির্বাচন</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1C2D24" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={LANGUAGES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.languageOption,
                    i18n.language === item.code && styles.languageOptionActive,
                  ]}
                  onPress={() => selectLanguage(item.code)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.languageOptionText,
                      i18n.language === item.code && styles.languageOptionTextActive,
                    ]}
                  >
                    {item.name}
                  </Text>
                  {i18n.language === item.code && (
                    <Ionicons name="checkmark-circle" size={22} color="#5ECE7D" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

/* --- Reusable Sub-components --- */

function StatCard({ icon, value, label }: { icon: IconName; value: string; label: string }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIconContainer}>
        <Ionicons name={icon} size={20} color="#0F3A20" />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SettingRow({
  icon,
  label,
  value,
  last,
}: {
  icon: IconName;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.settingRow, !last && styles.settingRowBorder]}>
      <View style={styles.settingIconContainer}>
        <Ionicons name={icon} size={18} color="#5A7265" />
      </View>
      <Text style={styles.settingLabel}>{label}</Text>
      <Text style={styles.settingValue} numberOfLines={1}>
        {value}
      </Text>
      <Ionicons name="chevron-forward" size={16} color="#8E9F94" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF8F5' },
  content: { padding: 20, paddingBottom: 120 },

  // Profile Hero
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 16,
  },
  avatarLarge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
    shadowColor: '#1C2D24',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 48,
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#0F3A20',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarLargeText: { fontSize: 36, fontWeight: '900', color: '#0F3A20' },
  userName: { fontSize: 24, fontWeight: '900', color: '#0F3A20', marginBottom: 4, letterSpacing: -0.5 },
  userEmail: { fontSize: 14, color: '#5A7265', marginBottom: 16 },
  roleBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#0F3A20',
  },

  // Settings
  settingsSection: { marginBottom: 24, paddingHorizontal: 4 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#8E9F94',
    marginBottom: 12,
    marginLeft: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#1C2D24',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  
  // Badges / Achievements Styling
  badgesScroll: {
    paddingLeft: 8,
    marginBottom: 8,
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 16,
    paddingRight: 24,
  },
  badgeWrapper: {
    alignItems: 'center',
    width: 90,
  },
  badgeCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  badgeLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#5A7265',
    textAlign: 'center',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingRowBorder: { borderBottomWidth: 1, borderBottomColor: '#FAF8F5' },
  settingIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FAF8F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingLabel: { fontSize: 14, color: '#5A7265', fontWeight: '600' },
  settingValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C2D24',
    flex: 1,
    textAlign: 'right',
    marginRight: 8,
  },

  // Logout
  logoutBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    marginBottom: 10,
    shadowColor: '#D32F2F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 2,
  },
  logoutText: { fontSize: 16, fontWeight: '900', color: '#D32F2F', letterSpacing: -0.2 },

  // Language Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#F8FAF9',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 48,
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  modalDragHandle: {
    width: 48,
    height: 5,
    backgroundColor: '#D1D8D4',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C2D24',
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 8,
    backgroundColor: '#FAF8F5',
  },
  languageOptionActive: {
    backgroundColor: '#E8F8EE',
  },
  languageOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5A7265',
  },
  languageOptionTextActive: {
    color: '#0F3A20',
    fontWeight: '800',
  },
});
