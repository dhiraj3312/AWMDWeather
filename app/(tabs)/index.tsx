import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  Dimensions,
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

function WeatherIcon({ iconCode, isDayTime }: { iconCode: number; isDayTime: boolean }) {
  const { theme } = useTheme();
  // Map AccuWeather icon codes to MaterialCommunityIcons
  const getIcon = (code: number, isDay: boolean): { name: string; color: string } => {
    if ([1, 2].includes(code)) return { name: isDay ? 'weather-sunny' : 'weather-night', color: '#FFD700' };
    if ([3, 4, 5].includes(code)) return { name: 'weather-partly-cloudy', color: '#FFB300' };
    if ([6, 7, 8].includes(code)) return { name: 'weather-cloudy', color: '#9E9E9E' };
    if ([11].includes(code)) return { name: 'weather-fog', color: '#B0BEC5' };
    if ([12, 13, 14, 18].includes(code)) return { name: 'weather-rainy', color: '#42A5F5' };
    if ([15, 16, 17].includes(code)) return { name: 'weather-lightning-rainy', color: '#FF9800' };
    if ([19, 20, 21].includes(code)) return { name: 'weather-snowy', color: '#90CAF9' };
    if ([22, 23].includes(code)) return { name: 'weather-snowy-heavy', color: '#78909C' };
    if ([24, 25].includes(code)) return { name: 'weather-hail', color: '#78909C' };
    if ([26, 29].includes(code)) return { name: 'weather-snowy-rainy', color: '#90A4AE' };
    if ([30].includes(code)) return { name: 'thermometer-high', color: '#F44336' };
    if ([31].includes(code)) return { name: 'snowflake', color: '#90CAF9' };
    if ([32].includes(code)) return { name: 'weather-windy', color: '#78909C' };
    if ([33, 34].includes(code)) return { name: 'weather-night', color: '#FFD700' };
    if ([35, 36, 37, 38].includes(code)) return { name: 'weather-night-partly-cloudy', color: '#90A4AE' };
    if ([39, 40].includes(code)) return { name: 'weather-pouring', color: '#42A5F5' };
    if ([41, 42].includes(code)) return { name: 'weather-lightning', color: '#FF9800' };
    return { name: 'weather-cloudy', color: '#9E9E9E' };
  };
  const { name, color } = getIcon(iconCode, isDayTime);
  return <MaterialCommunityIcons name={name as any} size={80} color={color} />;
}

function StatCard({ icon, iconLib, label, value, unit, color }: any) {
  const { theme } = useTheme();
  return (
    <View style={[styles.statCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder }]}>
      <View style={[styles.statIcon, { backgroundColor: (color ?? theme.primary) + '20' }]}>
        {iconLib === 'community'
          ? <MaterialCommunityIcons name={icon} size={20} color={color ?? theme.primary} />
          : <MaterialIcons name={icon} size={20} color={color ?? theme.primary} />}
      </View>
      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[styles.statValue, { color: theme.textPrimary }]}>
        {value}<Text style={[styles.statUnit, { color: theme.textTertiary }]}> {unit}</Text>
      </Text>
    </View>
  );
}

export default function HomeScreen() {
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  const { currentConditions, awmdAlerts, activeLocation, loading, refreshing, error, lastUpdated, refresh } = useWeather();
  const insets = useSafeAreaInsets();

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
  const pressure = cond?.Pressure?.Metric?.Value ?? '--';
  const visibility = cond?.Visibility?.Metric?.Value ?? '--';
  const uvIndex = cond?.UVIndex ?? '--';
  const cloudCover = cond?.CloudCover ?? '--';
  const weatherText = cond?.WeatherText ?? '--';
  const isDayTime = cond?.IsDayTime ?? true;

  const getAlertBanner = () => {
    if (!hasActiveAlert) return null;
    const colors: Record<string, string> = {
      red: theme.alertRed,
      orange: theme.alertOrange,
      yellow: theme.alertYellow,
    };
    const col = colors[highestAlert.level] ?? theme.alertOrange;
    const title = language === 'mr' ? highestAlert.titleMr : highestAlert.titleEn;
    return (
      <View style={[styles.alertBanner, { backgroundColor: col + '20', borderColor: col }]}>
        <MaterialIcons name="warning" size={16} color={col} />
        <Text style={[styles.alertBannerText, { color: col }]} numberOfLines={1}>{title}</Text>
      </View>
    );
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return '';
    return lastUpdated.toLocaleTimeString(language === 'mr' ? 'mr-IN' : 'en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        {/* Alert Banner */}
        {getAlertBanner()}

        {/* Hero Weather Card */}
        <LinearGradient
          colors={[theme.surfaceElevated, theme.surface] as any}
          style={[styles.heroCard, { borderColor: theme.surfaceBorder }]}
        >
          {/* Location & Condition */}
          <View style={styles.heroTop}>
            <View style={styles.heroLocation}>
              <MaterialIcons name="location-on" size={14} color={theme.accentBlue} />
              <Text style={[styles.heroLocationText, { color: theme.textSecondary }]}>
                {activeLocation?.name ?? (language === 'mr' ? 'आळंदी' : 'Alandi')}
              </Text>
            </View>
            <Text style={[styles.weatherCondition, { color: theme.textSecondary }]}>{weatherText}</Text>
          </View>

          {/* Temperature + Icon */}
          <View style={styles.heroCenter}>
            {cond ? <WeatherIcon iconCode={cond.WeatherIcon} isDayTime={isDayTime} /> : null}
            <View style={styles.tempBlock}>
              <Text style={[styles.tempDisplay, { color: theme.textPrimary }]}>
                {typeof temp === 'number' ? Math.round(temp) : temp}
              </Text>
              <Text style={[styles.tempUnit, { color: theme.primary }]}>°C</Text>
            </View>
          </View>

          {/* Feels like row */}
          <View style={styles.heroBottom}>
            <View style={styles.feelsLikeRow}>
              <Text style={[styles.feelsLabel, { color: theme.textTertiary }]}>{t.feelsLike}</Text>
              <Text style={[styles.feelsValue, { color: theme.textSecondary }]}>
                {typeof feelsLike === 'number' ? Math.round(feelsLike) : feelsLike}°C
              </Text>
            </View>
            {lastUpdated ? (
              <Text style={[styles.lastUpdatedText, { color: theme.textTertiary }]}>
                {t.lastUpdated}: {formatLastUpdated()}
              </Text>
            ) : null}
          </View>
        </LinearGradient>

        {/* Quick Stats Row */}
        <View style={styles.quickStatsRow}>
          <View style={[styles.quickStat, { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder }]}>
            <MaterialCommunityIcons name="water-percent" size={22} color={theme.accentBlue} />
            <Text style={[styles.quickStatValue, { color: theme.textPrimary }]}>{humidity}%</Text>
            <Text style={[styles.quickStatLabel, { color: theme.textTertiary }]}>{t.humidity}</Text>
          </View>
          <View style={[styles.quickStat, { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder }]}>
            <MaterialCommunityIcons name="weather-windy" size={22} color={theme.accentCyan} />
            <Text style={[styles.quickStatValue, { color: theme.textPrimary }]}>{windSpeed}</Text>
            <Text style={[styles.quickStatLabel, { color: theme.textTertiary }]}>km/h</Text>
          </View>
          <View style={[styles.quickStat, { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder }]}>
            <MaterialCommunityIcons name="gauge" size={22} color={theme.primary} />
            <Text style={[styles.quickStatValue, { color: theme.textPrimary }]}>{typeof pressure === 'number' ? Math.round(pressure) : pressure}</Text>
            <Text style={[styles.quickStatLabel, { color: theme.textTertiary }]}>hPa</Text>
          </View>
        </View>

        {/* Detailed Grid */}
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          {language === 'mr' ? 'तपशीलवार माहिती' : 'Detailed Information'}
        </Text>
        <View style={styles.detailGrid}>
          <StatCard
            icon="arrow-up-bold"
            iconLib="community"
            label={t.windDirection}
            value={windDir}
            unit=""
            color={theme.accentCyan}
          />
          <StatCard
            icon="eye"
            iconLib="community"
            label={t.visibility}
            value={visibility}
            unit="km"
            color={theme.accentBlue}
          />
          <StatCard
            icon="white-balance-sunny"
            iconLib="community"
            label={t.uvIndex}
            value={uvIndex}
            unit=""
            color={typeof uvIndex === 'number' && uvIndex >= 8 ? theme.alertRed : theme.primary}
          />
          <StatCard
            icon="cloud-percent"
            iconLib="community"
            label={t.cloudCover}
            value={cloudCover}
            unit="%"
            color={theme.textSecondary}
          />
          {cond?.DewPoint ? (
            <StatCard
              icon="thermometer"
              iconLib="community"
              label={t.dewPoint}
              value={Math.round(cond.DewPoint.Metric.Value)}
              unit="°C"
              color={theme.accentBlue}
            />
          ) : null}
          {cond?.WindGust ? (
            <StatCard
              icon="weather-windy-variant"
              iconLib="community"
              label={language === 'mr' ? 'वारा झोत' : 'Wind Gust'}
              value={cond.WindGust.Speed.Metric.Value}
              unit="km/h"
              color={theme.alertOrange}
            />
          ) : null}
        </View>

        {/* AWMD Local Intelligence */}
        <View style={[styles.intelCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.accentBlue + '40' }]}>
          <View style={styles.intelHeader}>
            <MaterialIcons name="radar" size={16} color={theme.accentBlue} />
            <Text style={[styles.intelTitle, { color: theme.accentBlue }]}>
              AWMD {t.localIntelligence}
            </Text>
          </View>
          <Text style={[styles.intelText, { color: theme.textSecondary }]}>
            {language === 'mr'
              ? 'ढगांची प्राथमिक हालचाल: पश्चिम/वायव्य/नैऋत्य → पूर्व/आग्नेय'
              : 'Primary cloud movement: W/NW/SW → E/ESE'}
          </Text>
          <Text style={[styles.intelText, { color: theme.textSecondary }]}>
            {language === 'mr'
              ? 'सासवड बाजूकडून ढगांचा अधिक विकास शक्य'
              : 'Stronger cloud development from Saswad-side sectors'}
          </Text>
          <Text style={[styles.intelNote, { color: theme.textTertiary }]}>
            {language === 'mr'
              ? '* स्थानिक निरीक्षणे सहायक निर्देशक म्हणून वापरली जातात'
              : '* Local observations used as supportive indicators only'}
          </Text>
        </View>

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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  alertBannerText: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },

  heroCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroLocationText: { fontSize: 13, fontWeight: '500' },
  weatherCondition: { fontSize: 14, fontWeight: '500' },

  heroCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  tempBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 8,
  },
  tempDisplay: {
    fontSize: 72,
    fontWeight: '800',
    lineHeight: 80,
  },
  tempUnit: {
    fontSize: 28,
    fontWeight: '600',
    marginTop: 12,
  },

  heroBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feelsLikeRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  feelsLabel: { fontSize: 13 },
  feelsValue: { fontSize: 15, fontWeight: '600' },
  lastUpdatedText: { fontSize: 11 },

  quickStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  quickStat: {
    flex: 1,
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  quickStatValue: { fontSize: 16, fontWeight: '700' },
  quickStatLabel: { fontSize: 11, textAlign: 'center' },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    width: (SCREEN_W - 52) / 2,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: { fontSize: 12 },
  statValue: { fontSize: 17, fontWeight: '700' },
  statUnit: { fontSize: 12, fontWeight: '400' },

  intelCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
    marginBottom: 8,
  },
  intelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  intelTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  intelText: { fontSize: 13, lineHeight: 20 },
  intelNote: { fontSize: 11, fontStyle: 'italic' },
});
