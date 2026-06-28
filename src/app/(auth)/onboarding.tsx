/**
 * KrishakBondhu - Onboarding Flow Screen
 */

import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StatusBar,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const SLIDES = [
  {
    id: 1,
    titleKey: 'onboarding.slide1Title',
    titleBnKey: 'onboarding.slide1TitleBn',
    descKey: 'onboarding.slide1Desc',
    image: require('../../../assets/images/detection.svg'),
  },
  {
    id: 2,
    titleKey: 'onboarding.slide2Title',
    titleBnKey: 'onboarding.slide2TitleBn',
    descKey: 'onboarding.slide2Desc',
    image: require('../../../assets/images/Mobile.svg'),
  },
  {
    id: 3,
    titleKey: 'onboarding.slide3Title',
    titleBnKey: 'onboarding.slide3TitleBn',
    descKey: 'onboarding.slide3Desc',
    image: require('../../../assets/images/expert.svg'),
  },
];

export default function OnboardingScreen() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const router = useRouter();
  const { completeOnboarding } = useAuthStore();
  const { t } = useTranslation();

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideWidth = event.nativeEvent.layoutMeasurement.width;
    const offset = event.nativeEvent.contentOffset.x;
    const activeIndex = Math.round(offset / slideWidth);
    if (activeIndex !== currentSlide && activeIndex >= 0 && activeIndex < SLIDES.length) {
      setCurrentSlide(activeIndex);
    }
  };

  const handleNext = async () => {
    if (currentSlide < SLIDES.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: (currentSlide + 1) * SCREEN_WIDTH,
        animated: true,
      });
      setCurrentSlide(currentSlide + 1);
    } else {
      await handleFinish();
    }
  };

  const handleFinish = async () => {
    await completeOnboarding();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4FAF6" />

      {/* Skip Button */}
      {currentSlide < SLIDES.length - 1 && (
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleFinish}
          activeOpacity={0.7}
        >
          <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
        </TouchableOpacity>
      )}

      {/* Illustrations ScrollView */}
      <View style={styles.illustrationsContainer}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ alignItems: 'center' }}
        >
          {SLIDES.map((slide) => (
            <View key={slide.id} style={styles.slideImageWrapper}>
              <Image
                source={slide.image}
                style={styles.illustration}
                contentFit="contain"
              />
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Bottom Info Card */}
      <View style={styles.infoCard}>
        <View style={styles.cardContent}>
          {/* Subtitle / Alternate Title Tagline */}
          <Text style={styles.bengaliTitle}>{t(SLIDES[currentSlide].titleBnKey)}</Text>
          {/* Main Title */}
          <Text style={styles.title}>{t(SLIDES[currentSlide].titleKey)}</Text>
          {/* Description */}
          <Text style={styles.description}>{t(SLIDES[currentSlide].descKey)}</Text>
        </View>

        {/* Footer Navigation Area */}
        <View style={styles.footer}>
          {/* Slide Indicator Dots */}
          <View style={styles.indicatorContainer}>
            {SLIDES.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  currentSlide === index && styles.indicatorActive,
                ]}
              />
            ))}
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.actionButtonText}>
              {currentSlide === SLIDES.length - 1 ? t('onboarding.getStarted') : t('onboarding.next')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4FAF6', // Soft mint background matches login
  },
  skipButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 24,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: '#E0EAE3',
  },
  skipText: {
    color: '#6E8277',
    fontSize: 14,
    fontWeight: '700',
  },
  illustrationsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: SCREEN_HEIGHT * 0.08,
  },
  slideImageWrapper: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  illustration: {
    width: SCREEN_WIDTH * 0.78,
    height: SCREEN_HEIGHT * 0.35,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 28,
    paddingTop: 36,
    paddingBottom: Platform.OS === 'ios' ? 44 : 32,
    height: SCREEN_HEIGHT * 0.42,
    justifyContent: 'space-between',
    shadowColor: '#0F3A20',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 8,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  bengaliTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#5ECE7D',
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#1C2D24',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 15.5,
    color: '#6E8277',
    lineHeight: 22,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  indicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  indicator: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: '#E0EAE3',
  },
  indicatorActive: {
    width: 24,
    backgroundColor: '#5ECE7D',
  },
  actionButton: {
    backgroundColor: '#5ECE7D',
    borderRadius: 18,
    paddingVertical: 15,
    paddingHorizontal: 32,
    shadowColor: '#5ECE7D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
