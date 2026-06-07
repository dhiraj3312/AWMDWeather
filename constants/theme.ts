// AWMD Weather Design System
export const darkTheme = {
  mode: 'dark' as const,

  // Core palette
  background: '#050D1A',
  surface: '#0A1628',
  surfaceElevated: '#0F2040',
  surfaceBorder: '#1A2E50',
  surfaceHighlight: '#142238',

  // Brand
  primary: '#F0A500',
  primaryDark: '#C87800',
  primaryLight: '#FFD166',

  // Accents
  accentBlue: '#1E90FF',
  accentCyan: '#00D4FF',
  accentGreen: '#2ECC71',

  // Alert colors
  alertRed: '#FF3B30',
  alertRedBg: '#3D0A07',
  alertOrange: '#FF9500',
  alertOrangeBg: '#3D2000',
  alertYellow: '#FFD600',
  alertYellowBg: '#3D3300',
  alertGreen: '#34C759',
  alertGreenBg: '#0A3D1A',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#8FA5C5',
  textTertiary: '#4A6080',
  textMuted: '#2E4260',

  // Status bar
  statusBar: 'light' as const,

  // Gradients (as arrays for LinearGradient)
  gradientHome: ['#050D1A', '#091525', '#0A1628'],
  gradientCard: ['#0F2040', '#0A1628'],
  gradientPrimary: ['#F0A500', '#C87800'],
};

export const lightTheme = {
  mode: 'light' as const,

  background: '#EFF4FB',
  surface: '#FFFFFF',
  surfaceElevated: '#F5F8FF',
  surfaceBorder: '#D0DCF0',
  surfaceHighlight: '#E8F0FF',

  primary: '#C87800',
  primaryDark: '#A06000',
  primaryLight: '#F0A500',

  accentBlue: '#0066CC',
  accentCyan: '#0099CC',
  accentGreen: '#28A745',

  alertRed: '#DC3545',
  alertRedBg: '#FFF0EF',
  alertOrange: '#E07B00',
  alertOrangeBg: '#FFF6EC',
  alertYellow: '#B8A000',
  alertYellowBg: '#FFFCE0',
  alertGreen: '#28A745',
  alertGreenBg: '#F0FFF4',

  textPrimary: '#0A1628',
  textSecondary: '#4A6080',
  textTertiary: '#8FA5C5',
  textMuted: '#C0CFDF',

  statusBar: 'dark' as const,

  gradientHome: ['#EFF4FB', '#E8F0FF', '#F0F5FF'],
  gradientCard: ['#FFFFFF', '#F5F8FF'],
  gradientPrimary: ['#F0A500', '#C87800'],
};

export type Theme = typeof darkTheme;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FONT_SIZE = {
  xs: 11,
  sm: 13,
  md: 15,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  display: 56,
};

export const FONT_WEIGHT = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,
};

export const BORDER_RADIUS = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 999,
};
