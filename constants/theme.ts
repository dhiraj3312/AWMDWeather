// AWMD Weather Design System — Premium Edition
export const darkTheme = {
  mode: 'dark' as const,

  // Core palette — deeper, richer dark
  background: '#040C18',
  surface: '#09152A',
  surfaceElevated: '#0F2040',
  surfaceElevated2: '#132848',
  surfaceBorder: '#1E3458',
  surfaceHighlight: '#152640',

  // Brand — AWMD gold
  primary: '#F0A500',
  primaryDark: '#C87800',
  primaryLight: '#FFD166',
  primaryGlow: 'rgba(240,165,0,0.15)',

  // Accents
  accentBlue: '#2196F3',
  accentCyan: '#00D4FF',
  accentGreen: '#2ECC71',
  accentPurple: '#9C27B0',

  // Alert colors — vivid and clear
  alertRed: '#FF3B30',
  alertRedBg: '#3D0A07',
  alertRedGlow: 'rgba(255,59,48,0.2)',
  alertOrange: '#FF9500',
  alertOrangeBg: '#3D2000',
  alertOrangeGlow: 'rgba(255,149,0,0.2)',
  alertYellow: '#FFD600',
  alertYellowBg: '#3D3300',
  alertYellowGlow: 'rgba(255,214,0,0.15)',
  alertGreen: '#34C759',
  alertGreenBg: '#0A3D1A',
  alertGreenGlow: 'rgba(52,199,89,0.15)',

  // Text hierarchy — improved contrast
  textPrimary: '#F0F4FF',
  textSecondary: '#8FA5C5',
  textTertiary: '#4A6080',
  textMuted: '#283A55',

  // Glassmorphism helpers
  glass: 'rgba(15,32,64,0.85)',
  glassBorder: 'rgba(255,255,255,0.08)',
  glassHighlight: 'rgba(255,255,255,0.04)',

  // Status bar
  statusBar: 'light' as const,

  // Gradients
  gradientHome: ['#040C18', '#081422', '#09152A'],
  gradientCard: ['#0F2040', '#09152A'],
  gradientPrimary: ['#F0A500', '#C87800'],
  gradientHeroSunny: ['#0A2A6E', '#1565C0'],
  gradientHeroRain: ['#0D1B2A', '#1A2B3C'],
  gradientHeroNight: ['#020816', '#050D1A'],
};

export const lightTheme = {
  mode: 'light' as const,

  background: '#EAF0F8',
  surface: '#FFFFFF',
  surfaceElevated: '#F4F8FF',
  surfaceElevated2: '#EEF4FF',
  surfaceBorder: '#D0DCF0',
  surfaceHighlight: '#E5EEFF',

  primary: '#C87800',
  primaryDark: '#A06000',
  primaryLight: '#F0A500',
  primaryGlow: 'rgba(200,120,0,0.12)',

  accentBlue: '#0066CC',
  accentCyan: '#0099CC',
  accentGreen: '#28A745',
  accentPurple: '#7B1FA2',

  alertRed: '#DC3545',
  alertRedBg: '#FFF0EF',
  alertRedGlow: 'rgba(220,53,69,0.15)',
  alertOrange: '#E07B00',
  alertOrangeBg: '#FFF6EC',
  alertOrangeGlow: 'rgba(224,123,0,0.15)',
  alertYellow: '#B8A000',
  alertYellowBg: '#FFFCE0',
  alertYellowGlow: 'rgba(184,160,0,0.12)',
  alertGreen: '#28A745',
  alertGreenBg: '#F0FFF4',
  alertGreenGlow: 'rgba(40,167,69,0.12)',

  textPrimary: '#080E1A',
  textSecondary: '#3A5070',
  textTertiary: '#7A90B0',
  textMuted: '#BACAD8',

  glass: 'rgba(255,255,255,0.92)',
  glassBorder: 'rgba(0,0,0,0.06)',
  glassHighlight: 'rgba(255,255,255,0.8)',

  statusBar: 'dark' as const,

  gradientHome: ['#EAF0F8', '#E5EEFF', '#EEF4FF'],
  gradientCard: ['#FFFFFF', '#F4F8FF'],
  gradientPrimary: ['#F0A500', '#C87800'],
  gradientHeroSunny: ['#1565C0', '#1976D2'],
  gradientHeroRain: ['#1A2B3C', '#243447'],
  gradientHeroNight: ['#0A1628', '#111E33'],
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
  xs: 10,
  sm: 12,
  md: 14,
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
  xl: 22,
  full: 999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 16,
    elevation: 10,
  },
};
