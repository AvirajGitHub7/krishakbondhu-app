/**
 * KrishakBondhu - Color Constants
 * Agricultural theme: deep greens, earth tones, warm accents
 */

export const Colors = {
  // Primary - Rich Forest Green
  primary: '#1B5E20',
  primaryLight: '#4CAF50',
  primaryDark: '#0D3B0E',
  primarySurface: '#E8F5E9',

  // Secondary - Warm Amber
  secondary: '#FF8F00',
  secondaryLight: '#FFC107',
  secondaryDark: '#E65100',

  // Accent - Sky Blue
  accent: '#0288D1',
  accentLight: '#4FC3F7',

  // Status
  success: '#2E7D32',
  warning: '#F57F17',
  error: '#C62828',
  info: '#1565C0',

  // Neutrals
  background: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceElevated: '#F5F5F5',
  border: '#E0E0E0',
  borderLight: '#F0F0F0',

  // Text
  textPrimary: '#1A1A2E',
  textSecondary: '#546E7A',
  textTertiary: '#90A4AE',
  textOnPrimary: '#FFFFFF',
  textOnSecondary: '#FFFFFF',

  // Dark Mode
  dark: {
    background: '#0A1F0A',
    surface: '#1A2E1A',
    surfaceElevated: '#243824',
    border: '#2E4F2E',
    textPrimary: '#E8F5E9',
    textSecondary: '#A5D6A7',
    textTertiary: '#66BB6A',
  },

  // Gradients (start, end)
  gradientPrimary: ['#1B5E20', '#4CAF50'] as const,
  gradientWarm: ['#FF8F00', '#FFC107'] as const,
  gradientSky: ['#0288D1', '#4FC3F7'] as const,

  // Shadows
  shadow: 'rgba(0, 0, 0, 0.08)',
  shadowDark: 'rgba(0, 0, 0, 0.15)',
};
