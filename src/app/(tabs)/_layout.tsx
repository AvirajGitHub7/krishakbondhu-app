/**
 * KrishakBondhu - Premium Tab Layout
 */

import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { Colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

type IconName = keyof typeof Ionicons.glyphMap;

function TabIcon({ icon, focused }: { icon: IconName; focused: boolean }) {
  return (
    <View style={styles.tabItem}>
      <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
        <Ionicons 
          name={icon} 
          size={focused ? 24 : 22} 
          color={focused ? '#FFFFFF' : '#8E9F94'} 
        />
      </View>
      {focused && <View style={styles.activeDot} />}
    </View>
  );
}

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { 
          backgroundColor: '#0F3A20', 
          elevation: 0, 
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { 
          fontWeight: '900', 
          fontSize: 22,
          letterSpacing: -0.5,
        },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
          elevation: 16,
          shadowColor: '#0F3A20',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t('tabs.home', 'Home'),
          headerTitle: 'KrishakBondhu',
          tabBarIcon: ({ focused }) => <TabIcon icon="scan-outline" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: t('tabs.community', 'Community'),
          headerTitle: t('tabs.community', 'Community'),
          tabBarIcon: ({ focused }) => <TabIcon icon="chatbubbles-outline" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="expert"
        options={{
          title: t('tabs.expert', 'Expert'),
          headerTitle: t('tabs.expert', 'Expert'),
          tabBarIcon: ({ focused }) => <TabIcon icon="help-buoy-outline" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile', 'Profile'),
          headerTitle: t('tabs.profile', 'Profile'),
          tabBarIcon: ({ focused }) => <TabIcon icon="person-outline" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapperActive: {
    backgroundColor: '#0F3A20',
    shadowColor: '#0F3A20',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#0F3A20',
    marginTop: 2,
  },
});
