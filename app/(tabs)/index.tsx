import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWeather } from '@/contexts/WeatherContext';
import Header from '@/components/layout/Header';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorView from '@/components/ui/ErrorView';
import WeatherBackground from '@/components/feature/WeatherBackground';
import SmartInsights from '@/components/feature/SmartInsights';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Premium Animated Weather Icon ───────────────────────────────────────────
function WeatherIcon({ iconCode, isDayTime, size = 80 }: { iconCode: number; isDayTime: boolean; size?: number }) {
  const pulse = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const bounce = useRef(new Animated.Value(0)).current;

  const getIconData = (code: number, isDay: boolean) => {
    if ([1, 2].includes(code)) return { name: isDay ? 'weather-sunny' : 'weather-night', color: '#FFD700', animated: 'rotate' as const };
    if ([3, 4, 5].includes(code)) return { name: 'weather-partly-cloudy', color: '#FFB300', animated: 'pulse' as const };
    if ([6, 7, 8].includes(code)) return { name: 'weather-cloudy', color: '#90A4AE', animated: 'pulse' as const };
    if ([11].includes(code)) return { name: 'weather-fog', color: '#B0BEC5', animated: 'pulse' as const };
    if ([12, 13, 14, 18].includes(code)) return { name: 'weather-rainy', color: '#42A5F5', animated: 'bounce' as const };
    if ([15, 16, 17, 41, 42].includes(code)) return { name: 'weather-lightning-rainy', color: '#FF9800', animated: 'pulse' as const };
    if ([19, 20, 21, 22, 23].includes(code)) return { name: 'weather-snowy', color: '#90CAF9', animated: 'pulse' as const };
    if ([24, 25].includes(code)) return { name: 'weather-hail', color: '#78909C', animated: 'pulse' as const };
    if ([26, 29].includes(code)) return { name: 'weather-snowy-rainy', color: '#90A4AE', animated: 'pulse' as const };
    if ([30].includes(code)) return { name: 'thermometer-high', color: '#F44336', animated: 'pulse' as const };
    if ([31].includes(code)) return { name: 'snowflake', color: '#90CAF9', animated: 'rotate' as const };
    if ([32].includes(code)) return { name: 'weather-windy', color: '#78909C', animated: 'pulse' as const };
    if ([33, 34].includes(code)) return { name: 'weather-night', color: '#C5CAE9', animated: 'rotate' as const };
    if ([35, 36, 37, 38].includes(code)) return { name: 'weather-night-partly-cloudy', color: '#90A4AE', animated: 'pulse' as const };
    if ([39, 40].includes(code)) return { name: 'weather-pouring', color: '#42A5F5', animated: 'bounce' as const };
    return { name: 'weather-cloudy', color: '#9E9E9E', animated: 'none' as const };
  };

  const { name, color, animated } = getIconData(iconCode, isDayTime);

  useEffect(() => {
    if (animated === 'pulse') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.09, duration: 1800, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 1800, useNativeDriver: true }),
        ])
      ).start();
    } else if (animated === 'rotate') {
      Animated.loop(
        Animated.timing(rotate, { toValue: 1, duration: 10000, useNativeDriver: true })
      ).start();
    } else if (animated === 'bounce') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounce, { toValue: -8, duration: 500, useNativeDriver: true }),
          Animated.timing(bounce, { toValue: 0, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [animated]);

  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const getTransform = () => {
    if (animated === 'pulse') return [{ scale: pulse }];
    if (animated === 'rotate') return [{ rotate: spin }];
    if (animated === 'bounce') return [{ translateY: bounce }];
    return [];
  };

  return (
    <Animated.View style={{ transform: getTransform() }}>
      <MaterialCommunityIcons name={name as any} size={size} color={color} />
    </Animated.View>
  );
}

// ─── Glass Metric Card ────────────────────────────────────────────────────────
function GlassMetricCard({ icon, iconLib, label, value, unit, color, wide }: any) {
  const { theme } = useTheme();
  const cardWidth = wide ? SCREEN_W - 32 : (SCREEN_W - 52) / 2;
  return (
    <View style={[
      styles.metricCard,
      {
        backgroundColor: theme.surfaceElevated,
        borderColor: theme.surfaceBorder,
        width: cardWidth,
      }
    ]}>
      <View style={[styles.metricIconBg, { backgroundColor: (color ?? theme.primary) + '22' }]}>
        {iconLib === 'community'
          ? <MaterialCommunityIcons name={icon} size={18} color={color ?? theme.primary} />
          : <MaterialIcons name={icon} size={18} color={color ?? theme.primary} />}
      </View>
      <Text style={[styles.metricLabel, { color: theme.textTertiary }]}>{label}</Text>
      <Text style={[styles.metricValue, { color: theme.textPrimary }]} numberOfLines={1}>
        {value}
        {unit ? <Text style={[styles.metricUnit, { color: theme.textTertiary }]}> {unit}</Text> : null}
      </Text>
    </View>
  );
}

// ─── Sun/Moon Timeline Card ───────────────────────────────────────────────────
function SunMoonCard({ dailyForecast, language, theme }: any) {
  const today = dailyForecast?.DailyForecasts?.[0];
  if (!today) return null;
  const isMr = language === 'mr';
  const fmt = (dt?: string) =>
    dt ? new Date(dt).toLocaleTimeString(isMr ? 'mr-IN' : 'en-IN', { hour: '2-digit', minute: '2-digit' }) : '--';

  const items = [
    today.Sun?.Rise && { icon: 'wb-sunny', lib: 'material', color: '#FFD700', label: isMr ? 'सूर्योदय' : 'Sunrise', val: fmt(today.Sun.Rise) },
    today.Sun?.Set && { icon: 'nights-stay', lib: 'material', color: '#7C83BD', label: isMr ? 'सूर्यास्त' : 'Sunset', val: fmt(today.Sun.Set) },
    today.Moon?.Rise && { icon: 'moon-waning-crescent', lib: 'community', color: '#B0BEC5', label: isMr ? 'चंद्रोदय' : 'Moonrise', val: fmt(today.Moon.Rise) },
    today.Moon?.Set && { icon: 'moon-waning-crescent', lib: 'community', color: '#546E7A', label: isMr ? 'चंद्रास्त' : 'Moonset', val: fmt(today.Moon.Set) },
  ].filter(Boolean);

  if (!items.length) return null;

  return (
    <View style={[styles.sunMoonCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder }]}>
      {items.map((item: any, i) => (
        <React.Fragment key={i}>
          {i > 0 ? <View style={[styles.sunDivider, { backgroundColor: theme.surfaceBorder }]} /> : null}
          <View style={styles.sunItem}>
            {item.lib === 'community'
              ? <MaterialCommunityIcons name={item.icon as any} size={20} color={item.color} />
              : <MaterialIcons name={item.icon as any} size={20} color={item.color} />}
            <Text style={[styles.sunLabel, { color: theme.textTertiary }]}>{item.label}</Text>
            <Text style={[styles.sunValue, { color: theme.textPrimary }]}>{item.val}</Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}

// ─── UV Index Bar ─────────────────────────────────────────────────────────────
function UVBar({ uvIndex, theme }: { uvIndex: number; theme: any }) {
  const pct = Math.min(100, (uvIndex / 12) * 100);
  const getUVColor = (uv: number) => {
    if (uv <= 2) return '#4CAF50';
    if (uv <= 5) return '#FFEB3B';
    if (uv <= 7) return '#FF9800';
    if (uv <= 10) return '#F44336';
    return '#9C27B0';
  };
  const color = getUVColor(uvIndex);
  const label = uvIndex <= 2 ? 'Low' : uvIndex <= 5 ? 'Moderate' : uvIndex <= 7 ? 'High' : uvIndex <= 10 ? 'Very High' : 'Extreme';
  return (
    <View style={{ gap: 6 }}>
      <View style={[styles.uvTrack, { backgroundColor: theme.surfaceBorder }]}>
        <View style={[styles.uvFill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={{ fontSize: 12, fontWeight: '600', color }}>{uvIndex} — {label}</Text>
    </View>
  );
}

// ─── Alert Banner ─────────────────────────────────────────────────────────────
function AlertBanner({ alert, language, theme }: any) {
  if (!alert || alert.type === 'CLEAR') return null;
  const colors: Record<string, string> = {
    red: theme.alertRed, orange: theme.alertOrange, yellow: theme.alertYellow,
  };
  const col = colors[alert.level] ?? theme.alertOrange;
  const title = language === 'mr' ? alert.titleMr : alert.titleEn;
  return (
    <Pressable style={[styles.alertBanner, { backgroundColor: col + '22', borderColor: col }]}>
      <View style={[styles.alertDot, { backgroundColor: col }]} />
      <MaterialIcons name="warning" size={14} color={col} />
      <Text style={[styles.alertBannerText, { color: col }]} numberOfLines={1}>{title}</Text>
      <MaterialIcons name="chevron-right" size={14} color={col} />
    </Pressable>
  );
}

// ─── Condition-specific hero gradient colors ─────────────────────────────────
function getHeroGradient(iconCode: number, isDayTime: boolean, theme: any): string[] {
  const isRainy = [12, 13, 14, 18, 39, 40, 15, 16, 17, 41, 42].includes(iconCode);
  const isSunny = [1, 2].includes(iconCode) && isDayTime;
  const isNight = !isDayTime;
  if (isSunny) return ['#0D3B6E', '#1565C0'];
  if (isRainy) return ['#0D1B2A', '#1A2B3C'];
  if (isNight) return ['#020816', '#050D1A'];
  return [theme.surfaceElevated, theme.surface];
}

// ─── Main Home Screen ─────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  const { currentConditions, dailyForecast, awmdAlerts, activeLocation, loading, refreshing, error, lastUpdated, refresh } = useWeather();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const [showAllMetrics, setShowAllMetrics] = useState(false);

  useEffect(() => {
    if (currentConditions) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]).start();
    }
  }, [currentConditions]);

  if (loading && !currentConditions) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Header showSearch={false} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <LoadingSpinner message={t.loadingWeather} />
        </View>
      </View>
    );
  }

  if (error && !currentConditions) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Header showSearch={false} />
        <ErrorView message={error} onRetry={refresh} />
      </View>
    );
  }

  const cond = currentConditions;
  const temp = cond?.Temperature?.Metric?.Value ?? null;
  const feelsLike = cond?.RealFeelTemperature?.Metric?.Value ?? null;
  const humidity = cond?.RelativeHumidity ?? '--';
  const windSpeed = cond?.Wind?.Speed?.Metric?.Value ?? '--';
  const windDir = cond?.Wind?.Direction?.English ?? '--';
  const pressure = cond?.Pressure?.Metric?.Value ?? '--';
  const visibility = cond?.Visibility?.Metric?.Value ?? '--';
  const uvIndex = cond?.UVIndex ?? 0;
  const cloudCover = cond?.CloudCover ?? '--';
  const weatherText = cond?.WeatherText ?? (language === 'mr' ? 'माहिती उपलब्ध नाही' : 'Data unavailable');
  const isDayTime = cond?.IsDayTime ?? true;
  const dewPoint = cond?.DewPoint?.Metric?.Value;
  const windGust = cond?.WindGust?.Speed?.Metric?.Value;
  const rainfall1hr = cond?.Precip1hr?.Metric?.Value ?? 0;

  const today = dailyForecast?.DailyForecasts?.[0];
  const thunderProb = Math.max(today?.Day?.ThunderstormProbability ?? 0, today?.Night?.ThunderstormProbability ?? 0);
  const todayRainProb = Math.max(today?.Day?.RainProbability ?? 0, today?.Night?.RainProbability ?? 0);
  const highestAlert = awmdAlerts[0];

  // Pressure trend
  const getPressureTrend = (p: number) => {
    if (p > 1020) return { icon: 'trending-up', label: language === 'mr' ? 'वाढत आहे' : 'Rising', color: '#4CAF50' };
    if (p < 1005) return { icon: 'trending-down', label: language === 'mr' ? 'कमी होत आहे' : 'Falling', color: '#F44336' };
    return { icon: 'trending-flat', label: language === 'mr' ? 'स्थिर' : 'Stable', color: '#9E9E9E' };
  };
  const pressureTrend = typeof pressure === 'number' ? getPressureTrend(pressure) : null;

  const heroGradient = cond ? getHeroGradient(cond.WeatherIcon, isDayTime, theme) : [theme.surfaceElevated, theme.surface];

  const allMetrics = [
    { icon: 'thermometer', iconLib: 'community', label: t.feelsLike, value: typeof feelsLike === 'number' ? `${Math.round(feelsLike)}` : '--', unit: '°C', color: '#FF7043' },
    { icon: 'water-percent', iconLib: 'community', label: t.humidity, value: humidity, unit: '%', color: theme.accentBlue },
    { icon: 'weather-windy', iconLib: 'community', label: t.windSpeed, value: windSpeed, unit: 'km/h', color: theme.accentCyan },
    { icon: 'compass', iconLib: 'community', label: t.windDirection, value: windDir, unit: '', color: '#26C6DA' },
    { icon: 'gauge', iconLib: 'community', label: t.pressure, value: typeof pressure === 'number' ? Math.round(pressure) : '--', unit: 'hPa', color: theme.primary },
    { icon: 'eye', iconLib: 'community', label: t.visibility, value: visibility, unit: 'km', color: theme.accentGreen },
    { icon: 'cloud-percent', iconLib: 'community', label: t.cloudCover, value: cloudCover, unit: '%', color: '#90A4AE' },
    windGust ? { icon: 'weather-windy-variant', iconLib: 'community', label: language === 'mr' ? 'वारा झोत' : 'Wind Gust', value: Math.round(windGust), unit: 'km/h', color: theme.alertOrange } : null,
    dewPoint !== undefined ? { icon: 'thermometer-water', iconLib: 'community', label: t.dewPoint, value: typeof dewPoint === 'number' ? Math.round(dewPoint) : '--', unit: '°C', color: '#26C6DA' } : null,
    rainfall1hr > 0 ? { icon: 'weather-pouring', iconLib: 'community', label: language === 'mr' ? 'पाऊस (१ तास)' : 'Rainfall (1hr)', value: rainfall1hr.toFixed(1), unit: 'mm', color: theme.accentBlue } : null,
    thunderProb > 0 ? { icon: 'weather-lightning', iconLib: 'community', label: language === 'mr' ? 'वादळ शक्यता' : 'Thunder Prob.', value: thunderProb, unit: '%', color: thunderProb > 50 ? theme.alertOrange : theme.alertYellow } : null,
    todayRainProb > 0 ? { icon: 'weather-rainy', iconLib: 'community', label: language === 'mr' ? 'पाऊस संभावना' : 'Rain Prob.', value: todayRainProb, unit: '%', color: todayRainProb >= 80 ? theme.alertRed : todayRainProb >= 50 ? theme.alertOrange : theme.alertYellow } : null,
  ].filter(Boolean);

  const visibleMetrics = showAllMetrics ? allMetrics : allMetrics.slice(0, 6);

  const formatUpdated = () => {
    if (!lastUpdated) return '';
    return lastUpdated.toLocaleTimeString(language === 'mr' ? 'mr-IN' : 'en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Dynamic background — subtle, only behind hero */}
      {cond ? (
        <WeatherBackground iconCode={cond.WeatherIcon} isDayTime={isDayTime} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 320, opacity: 0.55 }} />
      ) : null}

      <Header />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.primary} colors={[theme.primary]} />
        }
      >
        {/* Alert Banner */}
        <AlertBanner alert={highestAlert} language={language} theme={theme} />

        {/* ── Premium Hero Card ── */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <LinearGradient
            colors={heroGradient as any}
            style={[styles.heroCard, { borderColor: theme.surfaceBorder }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Glass sheen */}
            <View style={styles.glassSheen} />

            {/* Top Row: Location + Condition badge */}
            <View style={styles.heroTopRow}>
              <Pressable style={styles.heroLocRow}>
                <MaterialIcons name="location-on" size={12} color={theme.accentBlue} />
                <Text style={[styles.heroLocText, { color: theme.textSecondary }]}>
                  {activeLocation?.name ?? (language === 'mr' ? 'आळंदी' : 'Alandi')}
                </Text>
              </Pressable>
              <View style={[styles.condBadge, { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.15)' }]}>
                <Text style={[styles.condBadgeText, { color: 'rgba(255,255,255,0.75)' }]} numberOfLines={1}>
                  {weatherText}
                </Text>
              </View>
            </View>

            {/* Center: Icon + Temperature */}
            <View style={styles.heroCenter}>
              {cond ? <WeatherIcon iconCode={cond.WeatherIcon} isDayTime={isDayTime} size={92} /> : null}
              <View style={styles.hereTempBlock}>
                <View style={styles.heroTempRow}>
                  <Text style={styles.heroTempNum}>
                    {temp !== null ? Math.round(temp) : '--'}
                  </Text>
                  <Text style={[styles.heroTempUnit, { color: theme.primary }]}>°C</Text>
                </View>
                {feelsLike !== null ? (
                  <View style={styles.heroFeelsRow}>
                    <Text style={[styles.heroFeelsLabel, { color: 'rgba(255,255,255,0.55)' }]}>{t.feelsLike}</Text>
                    <Text style={[styles.heroFeelsValue, { color: 'rgba(255,255,255,0.8)' }]}>
                      {Math.round(feelsLike)}°
                    </Text>
                  </View>
                ) : null}
                {/* Temp range today */}
                {today ? (
                  <View style={styles.heroRangeRow}>
                    <MaterialIcons name="arrow-upward" size={11} color="#FF7043" />
                    <Text style={[styles.heroRangeText, { color: 'rgba(255,255,255,0.7)' }]}>
                      {Math.round(today.Temperature.Maximum.Value)}°
                    </Text>
                    <MaterialIcons name="arrow-downward" size={11} color="#42A5F5" />
                    <Text style={[styles.heroRangeText, { color: 'rgba(255,255,255,0.7)' }]}>
                      {Math.round(today.Temperature.Minimum.Value)}°
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* Quick stats strip */}
            <View style={[styles.heroStatsStrip, { borderTopColor: 'rgba(255,255,255,0.12)' }]}>
              {[
                { icon: 'water-percent', lib: 'community', val: `${humidity}%`, col: '#42A5F5' },
                { icon: 'weather-windy', lib: 'community', val: `${windSpeed} km/h`, col: '#00D4FF' },
                { icon: 'gauge', lib: 'community', val: `${typeof pressure === 'number' ? Math.round(pressure) : '--'} hPa`, col: theme.primary },
                { icon: 'eye', lib: 'community', val: `${visibility} km`, col: '#4CAF50' },
              ].map((stat, i) => (
                <React.Fragment key={i}>
                  {i > 0 ? <View style={[styles.statDiv, { backgroundColor: 'rgba(255,255,255,0.1)' }]} /> : null}
                  <View style={styles.statItem}>
                    <MaterialCommunityIcons name={stat.icon as any} size={13} color={stat.col} />
                    <Text style={styles.statVal}>{stat.val}</Text>
                  </View>
                </React.Fragment>
              ))}
            </View>

            {/* Last updated */}
            {lastUpdated ? (
              <Text style={styles.lastUpdatedText}>
                {t.lastUpdated}: {formatUpdated()}
              </Text>
            ) : null}
          </LinearGradient>
        </Animated.View>

        {/* ── AWMD Smart Insights ── */}
        {cond ? (
          <SmartInsights
            currentConditions={cond}
            dailyForecast={dailyForecast}
            language={language}
            theme={theme}
          />
        ) : null}

        {/* ── Sun & Moon ── */}
        <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>
          {language === 'mr' ? '☀️ सूर्य आणि चंद्र' : '☀️ Sun & Moon'}
        </Text>
        <SunMoonCard dailyForecast={dailyForecast} language={language} theme={theme} />

        {/* ── UV Index Card ── */}
        <View style={[styles.uvCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder }]}>
          <View style={styles.uvCardHeader}>
            <MaterialCommunityIcons name="white-balance-sunny" size={18} color="#FF9800" />
            <Text style={[styles.uvCardTitle, { color: theme.textPrimary }]}>{t.uvIndex}</Text>
            <View style={[styles.uvBadge, { backgroundColor: '#FF980020' }]}>
              <Text style={{ color: '#FF9800', fontSize: 10, fontWeight: '700' }}>UV {uvIndex}</Text>
            </View>
          </View>
          <UVBar uvIndex={uvIndex} theme={theme} />
        </View>

        {/* ── Pressure Trend Card ── */}
        {pressureTrend ? (
          <View style={[styles.pressureCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder }]}>
            <View style={styles.pressureRow}>
              <View style={[styles.pressureIconCircle, { backgroundColor: pressureTrend.color + '20' }]}>
                <MaterialIcons name={pressureTrend.icon as any} size={22} color={pressureTrend.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.pressureLabel, { color: theme.textTertiary }]}>
                  {language === 'mr' ? 'हवा दाब ट्रेंड' : 'Pressure Trend'}
                </Text>
                <Text style={[styles.pressureValue, { color: pressureTrend.color }]}>
                  {pressureTrend.label}
                </Text>
              </View>
              <Text style={[styles.pressureNum, { color: theme.textPrimary }]}>
                {typeof pressure === 'number' ? Math.round(pressure) : '--'}
                <Text style={{ fontSize: 12, color: theme.textTertiary }}> hPa</Text>
              </Text>
            </View>
          </View>
        ) : null}

        {/* ── Detailed Metrics Grid ── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>
            {language === 'mr' ? '📊 तपशीलवार माहिती' : '📊 Detailed Metrics'}
          </Text>
        </View>

        <View style={styles.metricsGrid}>
          {visibleMetrics.map((m: any, i) => (
            <GlassMetricCard key={i} {...m} />
          ))}
        </View>

        {allMetrics.length > 6 ? (
          <Pressable
            onPress={() => setShowAllMetrics(!showAllMetrics)}
            style={({ pressed }) => [styles.showMoreBtn, { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder, opacity: pressed ? 0.8 : 1 }]}
          >
            <MaterialIcons
              name={showAllMetrics ? 'expand-less' : 'expand-more'}
              size={18}
              color={theme.primary}
            />
            <Text style={[styles.showMoreText, { color: theme.primary }]}>
              {showAllMetrics
                ? (language === 'mr' ? 'कमी दाखवा' : 'Show Less')
                : (language === 'mr' ? `आणखी ${allMetrics.length - 6} माहिती` : `Show ${allMetrics.length - 6} more`)}
            </Text>
          </Pressable>
        ) : null}

        {/* ── Today's AccuWeather Summary ── */}
        {dailyForecast?.Headline?.Text ? (
          <View style={[styles.summaryCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.primary + '40' }]}>
            <View style={styles.summaryHeader}>
              <MaterialIcons name="info-outline" size={16} color={theme.primary} />
              <Text style={[styles.summaryTitle, { color: theme.primary }]}>
                {language === 'mr' ? 'हवामान सारांश' : 'Weather Summary'}
              </Text>
            </View>
            <Text style={[styles.summaryText, { color: theme.textSecondary }]}>
              {dailyForecast.Headline.Text}
            </Text>
          </View>
        ) : null}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 10 },

  // Alert Banner
  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    padding: 10, borderRadius: 12, borderWidth: 1, marginBottom: 12,
  },
  alertDot: { width: 6, height: 6, borderRadius: 3 },
  alertBannerText: { fontSize: 12, fontWeight: '700', flex: 1 },

  // Hero
  heroCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  glassSheen: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroLocRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroLocText: { fontSize: 12, fontWeight: '500' },
  condBadge: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 12, borderWidth: 1,
  },
  condBadgeText: { fontSize: 11, fontWeight: '500', maxWidth: 140 },

  heroCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  hereTempBlock: { alignItems: 'flex-end' },
  heroTempRow: { flexDirection: 'row', alignItems: 'flex-start' },
  heroTempNum: { fontSize: 78, fontWeight: '800', color: '#FFFFFF', lineHeight: 86 },
  heroTempUnit: { fontSize: 28, fontWeight: '700', marginTop: 16 },
  heroFeelsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  heroFeelsLabel: { fontSize: 12 },
  heroFeelsValue: { fontSize: 14, fontWeight: '600' },
  heroRangeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  heroRangeText: { fontSize: 13, fontWeight: '600' },

  heroStatsStrip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    borderTopWidth: 1, paddingTop: 14, marginBottom: 8,
  },
  statItem: { alignItems: 'center', gap: 4 },
  statVal: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  statDiv: { width: 1, height: 24 },
  lastUpdatedText: {
    fontSize: 10, textAlign: 'center',
    color: 'rgba(255,255,255,0.35)', marginTop: 2,
  },

  // Sun Moon
  sunMoonCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 14,
  },
  sunItem: { alignItems: 'center', gap: 5, flex: 1 },
  sunLabel: { fontSize: 10, textAlign: 'center' },
  sunValue: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  sunDivider: { width: 1, height: 44 },

  // UV
  uvCard: {
    borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 12, gap: 10,
  },
  uvCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  uvCardTitle: { fontSize: 14, fontWeight: '600', flex: 1 },
  uvBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  uvTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  uvFill: { height: '100%', borderRadius: 4 },

  // Pressure
  pressureCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 14 },
  pressureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pressureIconCircle: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  pressureLabel: { fontSize: 11, marginBottom: 3 },
  pressureValue: { fontSize: 16, fontWeight: '700' },
  pressureNum: { fontSize: 20, fontWeight: '800' },

  // Metrics Grid
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1.1,
    textTransform: 'uppercase', marginBottom: 10,
  },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
  metricCard: {
    borderRadius: 14, borderWidth: 1, padding: 13, gap: 5,
  },
  metricIconBg: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginBottom: 2,
  },
  metricLabel: { fontSize: 11 },
  metricValue: { fontSize: 17, fontWeight: '700' },
  metricUnit: { fontSize: 12, fontWeight: '400' },

  showMoreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 14,
  },
  showMoreText: { fontSize: 13, fontWeight: '600' },

  // Summary
  summaryCard: {
    borderRadius: 14, borderWidth: 1, padding: 14, gap: 8, marginTop: 4,
  },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryTitle: { fontSize: 13, fontWeight: '700' },
  summaryText: { fontSize: 14, lineHeight: 22 },
});
