import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  RefreshControl,
  Pressable,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWeather } from '@/contexts/WeatherContext';
import Header from '@/components/layout/Header';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorView from '@/components/ui/ErrorView';
import { HourlyForecast, DailyForecast } from '@/services/accuweather';

function getWeatherIconName(code: number, isDay: boolean): string {
  if ([1, 2].includes(code)) return isDay ? 'weather-sunny' : 'weather-night';
  if ([3, 4, 5].includes(code)) return 'weather-partly-cloudy';
  if ([6, 7, 8].includes(code)) return 'weather-cloudy';
  if ([11].includes(code)) return 'weather-fog';
  if ([12, 13, 14, 18].includes(code)) return 'weather-rainy';
  if ([15, 16, 17, 41, 42].includes(code)) return 'weather-lightning-rainy';
  if ([19, 20, 21, 22, 23].includes(code)) return 'weather-snowy';
  if ([24, 25].includes(code)) return 'weather-hail';
  if ([33, 34].includes(code)) return 'weather-night';
  if ([35, 36, 37, 38].includes(code)) return 'weather-night-partly-cloudy';
  if ([39, 40].includes(code)) return 'weather-pouring';
  return 'weather-cloudy';
}

function HourlyItem({ item }: { item: HourlyForecast }) {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const time = new Date(item.DateTime);
  const hour = time.toLocaleTimeString(language === 'mr' ? 'mr-IN' : 'en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  const rainProb = item.RainProbability ?? item.PrecipitationProbability ?? 0;
  const thunderProb = item.ThunderstormProbability ?? 0;
  const iconName = getWeatherIconName(item.WeatherIcon, item.IsDaylight);

  const getRainColor = () => {
    if (rainProb >= 80) return theme.alertRed;
    if (rainProb >= 60) return theme.alertOrange;
    if (rainProb >= 40) return theme.alertYellow;
    return theme.textTertiary;
  };

  return (
    <View style={[styles.hourlyItem, { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder }]}>
      <Text style={[styles.hourlyTime, { color: theme.textSecondary }]}>{hour}</Text>
      <MaterialCommunityIcons name={iconName as any} size={28} color={theme.primary} />
      <Text style={[styles.hourlyTemp, { color: theme.textPrimary }]}>
        {Math.round(item.Temperature.Value)}°
      </Text>
      <View style={styles.hourlyProbs}>
        {rainProb > 0 ? (
          <View style={styles.probRow}>
            <MaterialCommunityIcons name="water" size={10} color={getRainColor()} />
            <Text style={[styles.probText, { color: getRainColor() }]}>{rainProb}%</Text>
          </View>
        ) : null}
        {thunderProb > 0 ? (
          <View style={styles.probRow}>
            <MaterialCommunityIcons name="lightning-bolt" size={10} color={theme.alertYellow} />
            <Text style={[styles.probText, { color: theme.alertYellow }]}>{thunderProb}%</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function DailyItem({ item, index }: { item: DailyForecast; index: number }) {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const [expanded, setExpanded] = useState(false);

  const date = new Date(item.Date);
  const isToday = index === 0;
  const dayName = isToday
    ? (language === 'mr' ? 'आज' : 'Today')
    : date.toLocaleDateString(language === 'mr' ? 'mr-IN' : 'en-IN', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });

  const dayRain = item.Day?.RainProbability ?? 0;
  const nightRain = item.Night?.RainProbability ?? 0;
  const maxRain = Math.max(dayRain, nightRain);

  const dayThunder = item.Day?.ThunderstormProbability ?? 0;
  const nightThunder = item.Night?.ThunderstormProbability ?? 0;
  const maxThunder = Math.max(dayThunder, nightThunder);

  const iconName = getWeatherIconName(item.Day?.Icon ?? 1, true);

  const getRainColor = (prob: number) => {
    if (prob >= 80) return theme.alertRed;
    if (prob >= 60) return theme.alertOrange;
    if (prob >= 40) return theme.alertYellow;
    return theme.textTertiary;
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.dailyItem,
        {
          backgroundColor: isToday ? theme.surfaceHighlight : theme.surfaceElevated,
          borderColor: isToday ? theme.primary + '60' : theme.surfaceBorder,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
      onPress={() => setExpanded(!expanded)}
    >
      <View style={styles.dailyMain}>
        {/* Date */}
        <View style={styles.dailyDate}>
          <Text style={[styles.dailyDayName, { color: isToday ? theme.primary : theme.textPrimary }]}>
            {dayName}
          </Text>
        </View>

        {/* Icon */}
        <MaterialCommunityIcons name={iconName as any} size={26} color={isToday ? theme.primary : theme.textSecondary} />

        {/* Condition */}
        <Text style={[styles.dailyCondition, { color: theme.textSecondary }]} numberOfLines={1}>
          {item.Day?.IconPhrase ?? ''}
        </Text>

        {/* Temp range */}
        <View style={styles.tempRange}>
          <Text style={[styles.tempHigh, { color: theme.textPrimary }]}>
            {Math.round(item.Temperature.Maximum.Value)}°
          </Text>
          <Text style={[styles.tempLow, { color: theme.textTertiary }]}>
            {Math.round(item.Temperature.Minimum.Value)}°
          </Text>
        </View>

        {/* Rain prob */}
        {maxRain > 0 ? (
          <View style={styles.probMini}>
            <MaterialCommunityIcons name="water" size={12} color={getRainColor(maxRain)} />
            <Text style={[styles.probMiniText, { color: getRainColor(maxRain) }]}>{maxRain}%</Text>
          </View>
        ) : null}
      </View>

      {/* Expanded detail */}
      {expanded ? (
        <View style={[styles.dailyExpanded, { borderTopColor: theme.surfaceBorder }]}>
          <View style={styles.dailyExpandedGrid}>
            <View style={styles.expandedBlock}>
              <Text style={[styles.expandLabel, { color: theme.textTertiary }]}>
                {language === 'mr' ? 'दिवसा वर्षाव' : 'Day Rain'}
              </Text>
              <Text style={[styles.expandValue, { color: getRainColor(dayRain) }]}>{dayRain}%</Text>
            </View>
            <View style={styles.expandedBlock}>
              <Text style={[styles.expandLabel, { color: theme.textTertiary }]}>
                {language === 'mr' ? 'रात्री वर्षाव' : 'Night Rain'}
              </Text>
              <Text style={[styles.expandValue, { color: getRainColor(nightRain) }]}>{nightRain}%</Text>
            </View>
            <View style={styles.expandedBlock}>
              <Text style={[styles.expandLabel, { color: theme.textTertiary }]}>
                {language === 'mr' ? 'दिवसा वादळ' : 'Day Thunder'}
              </Text>
              <Text style={[styles.expandValue, { color: dayThunder > 50 ? theme.alertOrange : theme.textSecondary }]}>
                {dayThunder}%
              </Text>
            </View>
            <View style={styles.expandedBlock}>
              <Text style={[styles.expandLabel, { color: theme.textTertiary }]}>
                {language === 'mr' ? 'रात्री वादळ' : 'Night Thunder'}
              </Text>
              <Text style={[styles.expandValue, { color: nightThunder > 50 ? theme.alertOrange : theme.textSecondary }]}>
                {nightThunder}%
              </Text>
            </View>
          </View>

          {item.Sun ? (
            <View style={styles.sunRow}>
              <View style={styles.sunItem}>
                <MaterialIcons name="wb-sunny" size={14} color={theme.primary} />
                <Text style={[styles.sunText, { color: theme.textSecondary }]}>
                  {new Date(item.Sun.Rise).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <View style={styles.sunItem}>
                <MaterialIcons name="nights-stay" size={14} color={theme.textTertiary} />
                <Text style={[styles.sunText, { color: theme.textSecondary }]}>
                  {new Date(item.Sun.Set).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}

export default function ForecastScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { hourlyForecast, dailyForecast, loading, refreshing, error, refresh } = useWeather();
  const [activeTab, setActiveTab] = useState<'hourly' | 'daily'>('hourly');

  if (loading && hourlyForecast.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Header />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <LoadingSpinner message={t.loadingWeather} />
        </View>
      </View>
    );
  }

  if (error && hourlyForecast.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Header />
        <ErrorView message={error} onRetry={refresh} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header />

      {/* Tab Toggle */}
      <View style={[styles.tabBar, { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder }]}>
        {(['hourly', 'daily'] as const).map((tab) => (
          <Pressable
            key={tab}
            style={[
              styles.tabBtn,
              activeTab === tab && { backgroundColor: theme.primary },
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <MaterialIcons
              name={tab === 'hourly' ? 'access-time' : 'calendar-today'}
              size={16}
              color={activeTab === tab ? '#000' : theme.textSecondary}
            />
            <Text
              style={[
                styles.tabLabel,
                { color: activeTab === tab ? '#000' : theme.textSecondary },
                activeTab === tab && { fontWeight: '700' },
              ]}
            >
              {tab === 'hourly' ? t.hourly : t.daily}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Headline */}
      {dailyForecast?.Headline && activeTab === 'daily' ? (
        <View style={[styles.headline, { backgroundColor: theme.surfaceHighlight, borderColor: theme.primary + '40' }]}>
          <MaterialIcons name="info-outline" size={16} color={theme.primary} />
          <Text style={[styles.headlineText, { color: theme.textSecondary }]} numberOfLines={2}>
            {dailyForecast.Headline.Text}
          </Text>
        </View>
      ) : null}

      {activeTab === 'hourly' ? (
        <ScrollView
          contentContainerStyle={styles.hourlyScroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.primary} />
          }
        >
          <Text style={[styles.sectionLabel, { color: theme.textTertiary }]}>
            {t.hourlyForecast} ({hourlyForecast.length}h)
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hourlyRow}>
            {hourlyForecast.map((item, i) => (
              <HourlyItem key={`hourly_${i}`} item={item} />
            ))}
          </ScrollView>

          {/* Rain probability chart bars */}
          <Text style={[styles.sectionLabel, { color: theme.textTertiary, marginTop: 20 }]}>
            {t.rainProbability}
          </Text>
          <View style={[styles.probChart, { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder }]}>
            {hourlyForecast.slice(0, 12).map((item, i) => {
              const prob = item.RainProbability ?? item.PrecipitationProbability ?? 0;
              const h = Math.max(4, (prob / 100) * 80);
              const color = prob >= 80 ? theme.alertRed : prob >= 60 ? theme.alertOrange : prob >= 40 ? theme.alertYellow : theme.accentBlue + '60';
              return (
                <View key={`bar_${i}`} style={styles.barWrapper}>
                  <Text style={[styles.barLabel, { color: theme.textTertiary }]}>{prob}%</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.bar, { height: h, backgroundColor: color }]} />
                  </View>
                  <Text style={[styles.barTime, { color: theme.textTertiary }]}>
                    {new Date(item.DateTime).getHours()}h
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Thunderstorm probability */}
          {hourlyForecast.some((h) => (h.ThunderstormProbability ?? 0) > 0) ? (
            <>
              <Text style={[styles.sectionLabel, { color: theme.textTertiary, marginTop: 20 }]}>
                {t.thunderstormProb}
              </Text>
              <View style={[styles.probChart, { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder }]}>
                {hourlyForecast.slice(0, 12).map((item, i) => {
                  const prob = item.ThunderstormProbability ?? 0;
                  const h = Math.max(4, (prob / 100) * 80);
                  return (
                    <View key={`tbar_${i}`} style={styles.barWrapper}>
                      <Text style={[styles.barLabel, { color: theme.textTertiary }]}>{prob}%</Text>
                      <View style={styles.barTrack}>
                        <View style={[styles.bar, { height: h, backgroundColor: prob > 50 ? theme.alertOrange : theme.alertYellow + '80' }]} />
                      </View>
                      <Text style={[styles.barTime, { color: theme.textTertiary }]}>
                        {new Date(item.DateTime).getHours()}h
                      </Text>
                    </View>
                  );
                })}
              </View>
            </>
          ) : null}

          <View style={{ height: 24 }} />
        </ScrollView>
      ) : (
        <FlatList
          data={dailyForecast?.DailyForecasts ?? []}
          keyExtractor={(item, i) => `daily_${i}`}
          renderItem={({ item, index }) => <DailyItem item={item} index={index} />}
          contentContainerStyle={styles.dailyList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.primary} />
          }
          ListHeaderComponent={
            <Text style={[styles.sectionLabel, { color: theme.textTertiary, marginBottom: 12 }]}>
              {t.dailyForecast} ({dailyForecast?.DailyForecasts?.length ?? 0} {t.daily === 'Daily' ? 'days' : 'दिवस'})
            </Text>
          }
          ListEmptyComponent={
            <Text style={[styles.empty, { color: theme.textTertiary }]}>
              {t.loading}
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  tabLabel: { fontSize: 14, fontWeight: '500' },
  headline: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  headlineText: { flex: 1, fontSize: 13, lineHeight: 20 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginLeft: 4,
  },
  hourlyScroll: { paddingHorizontal: 16 },
  hourlyRow: { marginTop: 10 },
  hourlyItem: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginRight: 10,
    minWidth: 70,
    gap: 8,
  },
  hourlyTime: { fontSize: 11, fontWeight: '600' },
  hourlyTemp: { fontSize: 18, fontWeight: '700' },
  hourlyProbs: { gap: 3, alignItems: 'center' },
  probRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  probText: { fontSize: 10, fontWeight: '600' },

  probChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 10,
    height: 120,
    gap: 4,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    gap: 2,
  },
  barLabel: { fontSize: 8, marginBottom: 2 },
  barTrack: { width: '100%', height: 80, justifyContent: 'flex-end', alignItems: 'center' },
  bar: { width: '70%', borderRadius: 3, minHeight: 4 },
  barTime: { fontSize: 8, marginTop: 2 },

  dailyList: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 24 },
  dailyItem: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
  },
  dailyMain: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  dailyDate: { width: 80 },
  dailyDayName: { fontSize: 13, fontWeight: '600' },
  dailyCondition: { flex: 1, fontSize: 12 },
  tempRange: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  tempHigh: { fontSize: 16, fontWeight: '700' },
  tempLow: { fontSize: 14 },
  probMini: { flexDirection: 'row', alignItems: 'center', gap: 3, width: 40 },
  probMiniText: { fontSize: 11, fontWeight: '600' },

  dailyExpanded: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    paddingTop: 12,
    gap: 12,
  },
  dailyExpandedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  expandedBlock: { width: '45%' },
  expandLabel: { fontSize: 11, marginBottom: 4 },
  expandValue: { fontSize: 18, fontWeight: '700' },
  sunRow: {
    flexDirection: 'row',
    gap: 24,
  },
  sunItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sunText: { fontSize: 13 },
  empty: { textAlign: 'center', marginTop: 40 },
});
