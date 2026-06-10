import React, { useEffect, useRef } from 'react';
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

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Animated Weather Icon ────────────────────────────────────────────────────
function WeatherIcon({ iconCode, isDayTime, size = 80 }: { iconCode: number; isDayTime: boolean; size?: number }) {
  const { theme } = useTheme();
  const pulse = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  const getIconData = (code: number, isDay: boolean): { name: string; color: string; animated: 'pulse' | 'rotate' | 'none' } => {
    if ([1, 2].includes(code)) return { name: isDay ? 'weather-sunny' : 'weather-night', color: '#FFD700', animated: 'rotate' };
    if ([3, 4, 5].includes(code)) return { name: 'weather-partly-cloudy', color: '#FFB300', animated: 'pulse' };
    if ([6, 7, 8].includes(code)) return { name: 'weather-cloudy', color: '#90A4AE', animated: 'pulse' };
    if ([11].includes(code)) return { name: 'weather-fog', color: '#B0BEC5', animated: 'none' };
    if ([12, 13, 14, 18].includes(code)) return { name: 'weather-rainy', color: '#42A5F5', animated: 'pulse' };
    if ([15, 16, 17, 41, 42].includes(code)) return { name: 'weather-lightning-rainy', color: '#FF9800', animated: 'pulse' };
    if ([19, 20, 21, 22, 23].includes(code)) return { name: 'weather-snowy', color: '#90CAF9', animated: 'pulse' };
    if ([24, 25].includes(code)) return { name: 'weather-hail', color: '#78909C', animated: 'pulse' };
    if ([26, 29].includes(code)) return { name: 'weather-snowy-rainy', color: '#90A4AE', animated: 'pulse' };
    if ([30].includes(code)) return { name: 'thermometer-high', color: '#F44336', animated: 'none' };
    if ([31].includes(code)) return { name: 'snowflake', color: '#90CAF9', animated: 'rotate' };
    if ([32].includes(code)) return { name: 'weather-windy', color: '#78909C', animated: 'none' };
    if ([33, 34].includes(code)) return { name: 'weather-night', color: '#C5CAE9', animated: 'rotate' };
    if ([35, 36, 37, 38].includes(code)) return { name: 'weather-night-partly-cloudy', color: '#90A4AE', animated: 'pulse' };
    if ([39, 40].includes(code)) return { name: 'weather-pouring', color: '#42A5F5', animated: 'pulse' };
    return { name: 'weather-cloudy', color: '#9E9E9E', animated: 'none' };
  };

  const { name, color, animated } = getIconData(iconCode, isDayTime);

  useEffect(() => {
    if (animated === 'pulse') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.08, duration: 1800, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 1800, useNativeDriver: true }),
        ])
      ).start();
    } else if (animated === 'rotate') {
      Animated.loop(
        Animated.timing(rotate, { toValue: 1, duration: 12000, useNativeDriver: true })
      ).start();
    }
  }, [animated]);

  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View
      style={{
        transform: animated === 'pulse' ? [{ scale: pulse }] : animated === 'rotate' ? [{ rotate: spin }] : [],
      }}
    >
      <MaterialCommunityIcons name={name as any} size={size} color={color} />
    </Animated.View>
  );
}

// ─── Metric Card ──────────────────────────────────────────────────────────────
function MetricCard({ icon, iconLib, label, value, unit, color, wide }: any) {
  const { theme } = useTheme();
  const cardWidth = wide ? SCREEN_W - 32 : (SCREEN_W - 52) / 2;
  return (
    <View style={[styles.metricCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder, width: cardWidth }]}>
      <View style={[styles.metricIcon, { backgroundColor: (color ?? theme.primary) + '22' }]}>
        {iconLib === 'community'
          ? <MaterialCommunityIcons name={icon} size={20} color={color ?? theme.primary} />
          : <MaterialIcons name={icon} size={20} color={color ?? theme.primary} />}
      </View>
      <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[styles.metricValue, { color: theme.textPrimary }]}>
        {value}
        {unit ? <Text style={[styles.metricUnit, { color: theme.textTertiary }]}> {unit}</Text> : null}
      </Text>
    </View>
  );
}

// ─── Sun/Moon Row ─────────────────────────────────────────────────────────────
function SunMoonRow({ dailyForecast, language }: { dailyForecast: any; language: string }) {
  const { theme } = useTheme();
  const today = dailyForecast?.DailyForecasts?.[0];
  if (!today) return null;

  const fmt = (dt?: string) =>
    dt ? new Date(dt).toLocaleTimeString(language === 'mr' ? 'mr-IN' : 'en-IN', { hour: '2-digit', minute: '2-digit' }) : '--';

  return (
    <View style={[styles.sunMoonCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder }]}>
      {today.Sun ? (
        <>
          <View style={styles.sunMoonItem}>
            <MaterialIcons name="wb-sunny" size={22} color="#FFD700" />
            <Text style={[styles.sunMoonLabel, { color: theme.textTertiary }]}>
              {language === 'mr' ? 'सूर्योदय' : 'Sunrise'}
            </Text>
            <Text style={[styles.sunMoonValue, { color: theme.textPrimary }]}>{fmt(today.Sun.Rise)}</Text>
          </View>
          <View style={[styles.sunMoonDivider, { backgroundColor: theme.surfaceBorder }]} />
          <View style={styles.sunMoonItem}>
            <MaterialIcons name="nights-stay" size={22} color="#7C83BD" />
            <Text style={[styles.sunMoonLabel, { color: theme.textTertiary }]}>
              {language === 'mr' ? 'सूर्यास्त' : 'Sunset'}
            </Text>
            <Text style={[styles.sunMoonValue, { color: theme.textPrimary }]}>{fmt(today.Sun.Set)}</Text>
          </View>
        </>
      ) : null}
      {today.Moon ? (
        <>
          <View style={[styles.sunMoonDivider, { backgroundColor: theme.surfaceBorder }]} />
          <View style={styles.sunMoonItem}>
            <MaterialCommunityIcons name="moon-waning-crescent" size={22} color="#B0BEC5" />
            <Text style={[styles.sunMoonLabel, { color: theme.textTertiary }]}>
              {language === 'mr' ? 'चंद्रोदय' : 'Moonrise'}
            </Text>
            <Text style={[styles.sunMoonValue, { color: theme.textPrimary }]}>{fmt(today.Moon.Rise)}</Text>
          </View>
          <View style={[styles.sunMoonDivider, { backgroundColor: theme.surfaceBorder }]} />
          <View style={styles.sunMoonItem}>
            <MaterialCommunityIcons name="moon-waning-crescent" size={22} color="#546E7A" style={{ transform: [{ scaleX: -1 }] }} />
            <Text style={[styles.sunMoonLabel, { color: theme.textTertiary }]}>
              {language === 'mr' ? 'चंद्रास्त' : 'Moonset'}
            </Text>
            <Text style={[styles.sunMoonValue, { color: theme.textPrimary }]}>{fmt(today.Moon.Set)}</Text>
          </View>
        </>
      ) : null}
    </View>
  );
}

// ─── Pressure Trend ───────────────────────────────────────────────────────────
function getPressureTrend(pressure: number): { icon: string; label: string; labelMr: string; color: string } {
  if (pressure > 1020) return { icon: 'trending-up', label: 'Rising', labelMr: 'वाढत आहे', color: '#4CAF50' };
  if (pressure < 1005) return { icon: 'trending-down', label: 'Falling', labelMr: 'कमी होत आहे', color: '#F44336' };
  return { icon: 'trending-flat', label: 'Stable', labelMr: 'स्थिर', color: '#9E9E9E' };
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
      <Text style={[styles.uvLabel, { color }]}>{uvIndex} — {label}</Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  const { currentConditions, dailyForecast, awmdAlerts, activeLocation, loading, refreshing, error, lastUpdated, refresh } = useWeather();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (currentConditions) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }
  }, [currentConditions]);

  const highestAlert = awmdAlerts[0];
  const hasActiveAlert = highestAlert && highestAlert.type !== 'CLEAR';

  if (loading && !currentConditions) {
    return (
      <View style={[styles.fullCenter, { backgroundColor: theme.background }]}>
        <Header showSearch={false} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <LoadingSpinner message={t.loadingWeather} />
        </View>
      </View>
    );
  }

  if (error && !currentConditions) {
    return (
      <View style={[styles.fullCenter, { backgroundColor: theme.background }]}>
        <Header showSearch={false} />
        <ErrorView message={error} onRetry={refresh} />
      </View>
    );
  }

  const cond = currentConditions;
  const temp = cond?.Temperature?.Metric?.Value ?? '--';
  const feelsLike = cond?.RealFeelTemperature?.Metric?.Value ?? '--';
  const humidity = cond?.RelativeHumidity ?? '--';
  const windSpeed = cond?.Wind?.Speed?.Metric?.Value ?? '--';
  const windDir = cond?.Wind?.Direction?.English ?? '--';
  const windDirDeg = cond?.Wind?.Direction?.Degrees ?? 0;
  const pressure = cond?.Pressure?.Metric?.Value ?? '--';
  const visibility = cond?.Visibility?.Metric?.Value ?? '--';
  const uvIndex = cond?.UVIndex ?? 0;
  const cloudCover = cond?.CloudCover ?? '--';
  const weatherText = cond?.WeatherText ?? (language === 'mr' ? 'माहिती उपलब्ध नाही' : 'Data unavailable');
  const isDayTime = cond?.IsDayTime ?? true;
  const dewPoint = cond?.DewPoint?.Metric?.Value;
  const windGust = cond?.WindGust?.Speed?.Metric?.Value;
  const rainfall1hr = cond?.Precip1hr?.Metric?.Value ?? 0;

  // Today's daily for sun/moon/thunder prob
  const today = dailyForecast?.DailyForecasts?.[0];
  const thunderProb = Math.max(today?.Day?.ThunderstormProbability ?? 0, today?.Night?.ThunderstormProbability ?? 0);
  const todayRainProb = Math.max(today?.Day?.RainProbability ?? 0, today?.Night?.RainProbability ?? 0);

  const pressureTrend = typeof pressure === 'number' ? getPressureTrend(pressure) : null;

  const getAlertBanner = () => {
    if (!hasActiveAlert) return null;
    const colors: Record<string, string> = {
      red: theme.alertRed, orange: theme.alertOrange, yellow: theme.alertYellow,
    };
    const col = colors[highestAlert.level] ?? theme.alertOrange;
    const title = language === 'mr' ? highestAlert.titleMr : highestAlert.titleEn;
    return (
      <Pressable style={[styles.alertBanner, { backgroundColor: col + '20', borderColor: col }]}>
        <MaterialIcons name="warning" size={16} color={col} />
        <Text style={[styles.alertBannerText, { color: col }]} numberOfLines={1}>{title}</Text>
        <MaterialIcons name="chevron-right" size={16} color={col} />
      </Pressable>
    );
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return '';
    return lastUpdated.toLocaleTimeString(language === 'mr' ? 'mr-IN' : 'en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
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
        {getAlertBanner()}

        {/* ── Hero Card ── */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <LinearGradient
            colors={isDayTime
              ? [theme.surfaceElevated, theme.surface] as any
              : ['#0B1A35', '#050D1A'] as any}
            style={[styles.heroCard, { borderColor: theme.surfaceBorder }]}
          >
            <View style={styles.heroTop}>
              <View style={styles.heroLocation}>
                <MaterialIcons name="location-on" size={14} color={theme.accentBlue} />
                <Text style={[styles.heroLocationText, { color: theme.textSecondary }]}>
                  {activeLocation?.name ?? (language === 'mr' ? 'आळंदी' : 'Alandi')}
                </Text>
              </View>
              <View style={[styles.conditionBadge, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
                <Text style={[styles.conditionBadgeText, { color: theme.textSecondary }]} numberOfLines={1}>
                  {weatherText}
                </Text>
              </View>
            </View>

            <View style={styles.heroCenter}>
              {cond ? <WeatherIcon iconCode={cond.WeatherIcon} isDayTime={isDayTime} size={88} /> : null}
              <View style={styles.tempBlock}>
                <View style={styles.tempRow}>
                  <Text style={[styles.tempDisplay, { color: theme.textPrimary }]}>
                    {typeof temp === 'number' ? Math.round(temp) : '--'}
                  </Text>
                  <Text style={[styles.tempUnit, { color: theme.primary }]}>°C</Text>
                </View>
                <View style={styles.feelsRow}>
                  <Text style={[styles.feelsLabel, { color: theme.textTertiary }]}>{t.feelsLike}</Text>
                  <Text style={[styles.feelsValue, { color: theme.textSecondary }]}>
                    {typeof feelsLike === 'number' ? Math.round(feelsLike) : '--'}°C
                  </Text>
                </View>
              </View>
            </View>

            {/* Quick inline stats */}
            <View style={[styles.heroInlineStats, { borderTopColor: theme.surfaceBorder }]}>
              <View style={styles.inlineStat}>
                <MaterialCommunityIcons name="water-percent" size={14} color={theme.accentBlue} />
                <Text style={[styles.inlineStatVal, { color: theme.textPrimary }]}>{humidity}%</Text>
              </View>
              <View style={[styles.inlineStatDiv, { backgroundColor: theme.surfaceBorder }]} />
              <View style={styles.inlineStat}>
                <MaterialCommunityIcons name="weather-windy" size={14} color={theme.accentCyan} />
                <Text style={[styles.inlineStatVal, { color: theme.textPrimary }]}>{windSpeed} km/h</Text>
              </View>
              <View style={[styles.inlineStatDiv, { backgroundColor: theme.surfaceBorder }]} />
              <View style={styles.inlineStat}>
                <MaterialCommunityIcons name="gauge" size={14} color={theme.primary} />
                <Text style={[styles.inlineStatVal, { color: theme.textPrimary }]}>
                  {typeof pressure === 'number' ? Math.round(pressure) : '--'} hPa
                </Text>
              </View>
              <View style={[styles.inlineStatDiv, { backgroundColor: theme.surfaceBorder }]} />
              <View style={styles.inlineStat}>
                <MaterialIcons name="visibility" size={14} color={theme.accentGreen} />
                <Text style={[styles.inlineStatVal, { color: theme.textPrimary }]}>{visibility} km</Text>
              </View>
            </View>

            {lastUpdated ? (
              <Text style={[styles.lastUpdatedText, { color: theme.textTertiary }]}>
                {t.lastUpdated}: {formatLastUpdated()}
              </Text>
            ) : null}
          </LinearGradient>
        </Animated.View>

        {/* ── Sun & Moon ── */}
        <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>
          {language === 'mr' ? 'सूर्य आणि चंद्र' : 'Sun & Moon'}
        </Text>
        <SunMoonRow dailyForecast={dailyForecast} language={language} />

        {/* ── Detailed Metrics Grid ── */}
        <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>
          {language === 'mr' ? 'तपशीलवार माहिती' : 'Detailed Metrics'}
        </Text>
        <View style={styles.metricsGrid}>
          <MetricCard
            icon="thermometer" iconLib="community"
            label={t.feelsLike}
            value={typeof feelsLike === 'number' ? `${Math.round(feelsLike)}` : '--'}
            unit="°C" color="#FF7043"
          />
          <MetricCard
            icon="water-percent" iconLib="community"
            label={t.humidity}
            value={humidity} unit="%" color={theme.accentBlue}
          />
          <MetricCard
            icon="weather-windy" iconLib="community"
            label={t.windSpeed}
            value={windSpeed} unit="km/h" color={theme.accentCyan}
          />
          <MetricCard
            icon="compass" iconLib="community"
            label={t.windDirection}
            value={windDir} unit="" color="#26C6DA"
          />
          {windGust ? (
            <MetricCard
              icon="weather-windy-variant" iconLib="community"
              label={language === 'mr' ? 'वारा झोत' : 'Wind Gust'}
              value={windGust} unit="km/h" color={theme.alertOrange}
            />
          ) : null}
          <MetricCard
            icon="gauge" iconLib="community"
            label={t.pressure}
            value={typeof pressure === 'number' ? Math.round(pressure) : '--'} unit="hPa" color={theme.primary}
          />
          <MetricCard
            icon="eye" iconLib="community"
            label={t.visibility}
            value={visibility} unit="km" color={theme.accentGreen}
          />
          <MetricCard
            icon="cloud-percent" iconLib="community"
            label={t.cloudCover}
            value={cloudCover} unit="%" color="#90A4AE"
          />
          {dewPoint !== undefined ? (
            <MetricCard
              icon="thermometer-water" iconLib="community"
              label={t.dewPoint}
              value={typeof dewPoint === 'number' ? Math.round(dewPoint) : '--'} unit="°C" color="#26C6DA"
            />
          ) : null}
          {rainfall1hr > 0 ? (
            <MetricCard
              icon="weather-pouring" iconLib="community"
              label={language === 'mr' ? 'पाऊस (१ तास)' : 'Rainfall (1hr)'}
              value={rainfall1hr.toFixed(1)} unit="mm" color={theme.accentBlue}
            />
          ) : null}
          {thunderProb > 0 ? (
            <MetricCard
              icon="weather-lightning" iconLib="community"
              label={language === 'mr' ? 'वादळ शक्यता' : 'Thunder Prob.'}
              value={thunderProb} unit="%" color={thunderProb > 50 ? theme.alertOrange : theme.alertYellow}
            />
          ) : null}
          {todayRainProb > 0 ? (
            <MetricCard
              icon="weather-rainy" iconLib="community"
              label={language === 'mr' ? 'पाऊस संभावना' : 'Rain Prob.'}
              value={todayRainProb} unit="%"
              color={todayRainProb >= 80 ? theme.alertRed : todayRainProb >= 50 ? theme.alertOrange : theme.alertYellow}
            />
          ) : null}
        </View>

        {/* ── UV Index Card ── */}
        <View style={[styles.uvCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder }]}>
          <View style={styles.uvHeader}>
            <MaterialCommunityIcons name="white-balance-sunny" size={18} color="#FF9800" />
            <Text style={[styles.uvTitle, { color: theme.textPrimary }]}>
              {t.uvIndex}
            </Text>
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
                  {language === 'mr' ? pressureTrend.labelMr : pressureTrend.label}
                </Text>
              </View>
              <Text style={[styles.pressureNum, { color: theme.textPrimary }]}>
                {typeof pressure === 'number' ? Math.round(pressure) : '--'} <Text style={{ fontSize: 12, color: theme.textTertiary }}>hPa</Text>
              </Text>
            </View>
          </View>
        ) : null}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  fullCenter: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 12 },

  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 10, borderRadius: 10, borderWidth: 1, marginBottom: 12,
  },
  alertBannerText: { fontSize: 13, fontWeight: '700', flex: 1 },

  // Hero
  heroCard: { borderRadius: 22, borderWidth: 1, padding: 18, marginBottom: 16 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  heroLocation: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroLocationText: { fontSize: 13, fontWeight: '500' },
  conditionBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  conditionBadgeText: { fontSize: 12, fontWeight: '500', maxWidth: 140 },

  heroCenter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, marginBottom: 16 },
  tempBlock: { alignItems: 'flex-end' },
  tempRow: { flexDirection: 'row', alignItems: 'flex-start' },
  tempDisplay: { fontSize: 76, fontWeight: '800', lineHeight: 84 },
  tempUnit: { fontSize: 30, fontWeight: '600', marginTop: 14 },
  feelsRow: { flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 4 },
  feelsLabel: { fontSize: 12 },
  feelsValue: { fontSize: 14, fontWeight: '600' },

  heroInlineStats: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    borderTopWidth: 1, paddingTop: 14, marginBottom: 10,
  },
  inlineStat: { alignItems: 'center', gap: 4 },
  inlineStatVal: { fontSize: 12, fontWeight: '600' },
  inlineStatDiv: { width: 1, height: 24 },

  lastUpdatedText: { fontSize: 10, textAlign: 'center', marginTop: 2 },

  // Sun & Moon
  sunMoonCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 16,
  },
  sunMoonItem: { alignItems: 'center', gap: 6, flex: 1 },
  sunMoonLabel: { fontSize: 11, textAlign: 'center' },
  sunMoonValue: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  sunMoonDivider: { width: 1, height: 48 },

  // Metrics Grid
  sectionTitle: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1.2,
    textTransform: 'uppercase', marginBottom: 10,
  },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  metricCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 6 },
  metricIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  metricLabel: { fontSize: 11 },
  metricValue: { fontSize: 17, fontWeight: '700' },
  metricUnit: { fontSize: 12, fontWeight: '400' },

  // UV
  uvCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 12, gap: 10 },
  uvHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  uvTitle: { fontSize: 14, fontWeight: '600' },
  uvTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  uvFill: { height: '100%', borderRadius: 4 },
  uvLabel: { fontSize: 12, fontWeight: '600' },

  // Pressure Trend
  pressureCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 12 },
  pressureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pressureIconCircle: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  pressureLabel: { fontSize: 11, marginBottom: 4 },
  pressureValue: { fontSize: 16, fontWeight: '700' },
  pressureNum: { fontSize: 20, fontWeight: '800' },
});
