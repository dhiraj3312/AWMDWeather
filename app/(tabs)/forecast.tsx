import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  RefreshControl,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWeather } from '@/contexts/WeatherContext';
import Header from '@/components/layout/Header';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorView from '@/components/ui/ErrorView';
import { HourlyForecast, DailyForecast } from '@/services/accuweather';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Icon helper ─────────────────────────────────────────────────────────────
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

function getRainColor(prob: number, theme: any): string {
  if (prob >= 80) return theme.alertRed;
  if (prob >= 60) return theme.alertOrange;
  if (prob >= 40) return theme.alertYellow;
  return theme.textTertiary;
}

// ─── Hourly Card ─────────────────────────────────────────────────────────────
function HourlyCard({ item, isNow }: { item: HourlyForecast; isNow: boolean }) {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const time = new Date(item.DateTime);
  const hour = time.toLocaleTimeString(language === 'mr' ? 'mr-IN' : 'en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
  const rainProb = item.RainProbability ?? item.PrecipitationProbability ?? 0;
  const thunderProb = item.ThunderstormProbability ?? 0;
  const iconName = getWeatherIconName(item.WeatherIcon, item.IsDaylight);
  const iconColor = item.IsDaylight ? '#FFB300' : '#90A4AE';

  return (
    <View style={[
      styles.hourlyCard,
      {
        backgroundColor: isNow ? theme.surfaceHighlight : theme.surfaceElevated,
        borderColor: isNow ? theme.primary + '80' : theme.surfaceBorder,
      },
    ]}>
      {isNow ? (
        <Text style={[styles.hourlyNowLabel, { color: theme.primary }]}>
          {language === 'mr' ? 'आता' : 'Now'}
        </Text>
      ) : (
        <Text style={[styles.hourlyTime, { color: theme.textTertiary }]}>{hour}</Text>
      )}

      <MaterialCommunityIcons name={iconName as any} size={30} color={isNow ? theme.primary : iconColor} />

      <Text style={[styles.hourlyTemp, { color: theme.textPrimary }]}>
        {Math.round(item.Temperature.Value)}°
      </Text>

      {item.Wind ? (
        <View style={styles.hourlyWind}>
          <MaterialCommunityIcons name="weather-windy" size={11} color={theme.accentCyan} />
          <Text style={[styles.hourlyWindText, { color: theme.textTertiary }]}>
            {Math.round(item.Wind.Speed.Value)}
          </Text>
        </View>
      ) : null}

      <View style={styles.hourlyProbs}>
        {rainProb > 0 ? (
          <View style={styles.probChip}>
            <MaterialCommunityIcons name="water" size={9} color={getRainColor(rainProb, theme)} />
            <Text style={[styles.probChipText, { color: getRainColor(rainProb, theme) }]}>{rainProb}%</Text>
          </View>
        ) : null}
        {thunderProb > 10 ? (
          <View style={styles.probChip}>
            <MaterialCommunityIcons name="lightning-bolt" size={9} color={theme.alertYellow} />
            <Text style={[styles.probChipText, { color: theme.alertYellow }]}>{thunderProb}%</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

// ─── Rain Probability Chart ───────────────────────────────────────────────────
function RainChart({ hourly, theme, language }: { hourly: HourlyForecast[]; theme: any; language: string }) {
  const data = hourly.slice(0, 12);
  const maxProb = Math.max(...data.map((h) => h.RainProbability ?? h.PrecipitationProbability ?? 0));

  return (
    <View style={[styles.chartCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder }]}>
      <View style={styles.chartHeader}>
        <MaterialCommunityIcons name="water" size={14} color={theme.accentBlue} />
        <Text style={[styles.chartTitle, { color: theme.textSecondary }]}>
          {language === 'mr' ? 'पाऊस संभावना (12 तास)' : 'Rain Probability (12h)'}
        </Text>
        <Text style={[styles.chartMax, { color: theme.accentBlue }]}>max {maxProb}%</Text>
      </View>
      <View style={styles.chartBars}>
        {data.map((item, i) => {
          const prob = item.RainProbability ?? item.PrecipitationProbability ?? 0;
          const h = Math.max(4, (prob / 100) * 70);
          const color = getRainColor(prob, theme);
          return (
            <View key={`rb_${i}`} style={styles.barCol}>
              <Text style={[styles.barTopLabel, { color: prob > 20 ? color : 'transparent' }]}>{prob}%</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { height: h, backgroundColor: color, opacity: 0.85 }]} />
              </View>
              <Text style={[styles.barBottomLabel, { color: theme.textTertiary }]}>
                {new Date(item.DateTime).getHours()}h
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─── Thunder Chart ────────────────────────────────────────────────────────────
function ThunderChart({ hourly, theme, language }: { hourly: HourlyForecast[]; theme: any; language: string }) {
  const data = hourly.slice(0, 12);
  const hasData = data.some((h) => (h.ThunderstormProbability ?? 0) > 0);
  if (!hasData) return null;

  return (
    <View style={[styles.chartCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder }]}>
      <View style={styles.chartHeader}>
        <MaterialCommunityIcons name="lightning-bolt" size={14} color={theme.alertYellow} />
        <Text style={[styles.chartTitle, { color: theme.textSecondary }]}>
          {language === 'mr' ? 'वादळ संभावना (12 तास)' : 'Thunderstorm Probability (12h)'}
        </Text>
      </View>
      <View style={styles.chartBars}>
        {data.map((item, i) => {
          const prob = item.ThunderstormProbability ?? 0;
          const h = Math.max(4, (prob / 100) * 70);
          const color = prob > 60 ? theme.alertOrange : theme.alertYellow;
          return (
            <View key={`tb_${i}`} style={styles.barCol}>
              <Text style={[styles.barTopLabel, { color: prob > 20 ? color : 'transparent' }]}>{prob}%</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { height: h, backgroundColor: color, opacity: 0.85 }]} />
              </View>
              <Text style={[styles.barBottomLabel, { color: theme.textTertiary }]}>
                {new Date(item.DateTime).getHours()}h
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─── Detailed Daily Item ──────────────────────────────────────────────────────
function DailyItem({ item, index, language, theme }: { item: DailyForecast; index: number; language: string; theme: any }) {
  const [expanded, setExpanded] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const toggleExpand = () => {
    const toValue = expanded ? 0 : 1;
    Animated.timing(slideAnim, { toValue, duration: 220, useNativeDriver: false }).start();
    setExpanded(!expanded);
  };

  const date = new Date(item.Date);
  const isToday = index === 0;
  const isTomorrow = index === 1;
  const dayName = isToday
    ? (language === 'mr' ? 'आज' : 'Today')
    : isTomorrow
    ? (language === 'mr' ? 'उद्या' : 'Tomorrow')
    : date.toLocaleDateString(language === 'mr' ? 'mr-IN' : 'en-IN', {
        weekday: 'short', month: 'short', day: 'numeric',
      });

  const dayRain = item.Day?.RainProbability ?? 0;
  const nightRain = item.Night?.RainProbability ?? 0;
  const maxRain = Math.max(dayRain, nightRain);
  const dayThunder = item.Day?.ThunderstormProbability ?? 0;
  const nightThunder = item.Night?.ThunderstormProbability ?? 0;
  const maxThunder = Math.max(dayThunder, nightThunder);
  const iconName = getWeatherIconName(item.Day?.Icon ?? 1, true);
  const iconColor = isToday ? theme.primary : '#FFB300';

  // Temp bar calculation
  const tempSpread = item.Temperature.Maximum.Value - item.Temperature.Minimum.Value;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.dailyCard,
        {
          backgroundColor: isToday ? theme.surfaceHighlight : theme.surfaceElevated,
          borderColor: isToday ? theme.primary + '50' : theme.surfaceBorder,
          opacity: pressed ? 0.93 : 1,
        },
      ]}
      onPress={toggleExpand}
    >
      {/* Main Row */}
      <View style={styles.dailyMainRow}>
        {/* Date column */}
        <View style={styles.dailyDateCol}>
          <Text style={[styles.dailyDayName, { color: isToday ? theme.primary : theme.textPrimary }]}>
            {dayName}
          </Text>
          <Text style={[styles.dailyDateText, { color: theme.textTertiary }]}>
            {date.toLocaleDateString(language === 'mr' ? 'mr-IN' : 'en-IN', { month: 'short', day: 'numeric' })}
          </Text>
        </View>

        {/* Icon + condition */}
        <View style={styles.dailyCondCol}>
          <MaterialCommunityIcons name={iconName as any} size={28} color={iconColor} />
          <Text style={[styles.dailyCondText, { color: theme.textSecondary }]} numberOfLines={2}>
            {item.Day?.IconPhrase ?? ''}
          </Text>
        </View>

        {/* Rain prob */}
        <View style={styles.dailyProbCol}>
          {maxRain > 0 ? (
            <View style={styles.probItem}>
              <MaterialCommunityIcons name="water" size={13} color={getRainColor(maxRain, theme)} />
              <Text style={[styles.probItemText, { color: getRainColor(maxRain, theme) }]}>{maxRain}%</Text>
            </View>
          ) : null}
          {maxThunder > 20 ? (
            <View style={styles.probItem}>
              <MaterialCommunityIcons name="lightning-bolt" size={13} color={theme.alertYellow} />
              <Text style={[styles.probItemText, { color: theme.alertYellow }]}>{maxThunder}%</Text>
            </View>
          ) : null}
        </View>

        {/* Temp range */}
        <View style={styles.dailyTempCol}>
          <View style={styles.tempRangeRow}>
            <Text style={[styles.dailyTempHigh, { color: theme.textPrimary }]}>
              {Math.round(item.Temperature.Maximum.Value)}°
            </Text>
            <Text style={[styles.dailyTempLow, { color: theme.textTertiary }]}>
              {Math.round(item.Temperature.Minimum.Value)}°
            </Text>
          </View>
          {/* Temperature bar */}
          <View style={[styles.tempBarTrack, { backgroundColor: theme.surfaceBorder }]}>
            <View style={[styles.tempBarFill, { backgroundColor: theme.primary, width: `${Math.min(100, (tempSpread / 15) * 100)}%` as any }]} />
          </View>
        </View>

        <MaterialIcons name={expanded ? 'expand-less' : 'expand-more'} size={18} color={theme.textTertiary} />
      </View>

      {/* Expanded Detail */}
      {expanded ? (
        <View style={[styles.dailyExpandedSection, { borderTopColor: theme.surfaceBorder }]}>
          {/* Headline / Prediction text */}
          <View style={[styles.predictionBlock, { backgroundColor: theme.surface, borderColor: theme.primary + '30' }]}>
            <MaterialIcons name="info-outline" size={14} color={theme.primary} />
            <Text style={[styles.predictionText, { color: theme.textSecondary }]}>
              {item.Day?.IconPhrase ?? ''}{item.Night?.IconPhrase ? ` / ${item.Night.IconPhrase}` : ''}
              {item.Day?.PrecipitationType ? ` · ${item.Day.PrecipitationIntensity ?? ''} ${item.Day.PrecipitationType}` : ''}
            </Text>
          </View>

          {/* Stats grid */}
          <View style={styles.expandedGrid}>
            {/* Day/Night rain */}
            <View style={styles.expandedCell}>
              <View style={styles.expandedCellHeader}>
                <MaterialIcons name="wb-sunny" size={12} color={theme.primary} />
                <Text style={[styles.expandedCellLabel, { color: theme.textTertiary }]}>
                  {language === 'mr' ? 'दिवस पाऊस' : 'Day Rain'}
                </Text>
              </View>
              <Text style={[styles.expandedCellValue, { color: getRainColor(dayRain, theme) }]}>{dayRain}%</Text>
            </View>
            <View style={styles.expandedCell}>
              <View style={styles.expandedCellHeader}>
                <MaterialIcons name="nights-stay" size={12} color="#7C83BD" />
                <Text style={[styles.expandedCellLabel, { color: theme.textTertiary }]}>
                  {language === 'mr' ? 'रात्र पाऊस' : 'Night Rain'}
                </Text>
              </View>
              <Text style={[styles.expandedCellValue, { color: getRainColor(nightRain, theme) }]}>{nightRain}%</Text>
            </View>
            <View style={styles.expandedCell}>
              <View style={styles.expandedCellHeader}>
                <MaterialCommunityIcons name="lightning-bolt" size={12} color={theme.alertYellow} />
                <Text style={[styles.expandedCellLabel, { color: theme.textTertiary }]}>
                  {language === 'mr' ? 'दिवस वादळ' : 'Day Thunder'}
                </Text>
              </View>
              <Text style={[styles.expandedCellValue, { color: dayThunder > 50 ? theme.alertOrange : theme.textSecondary }]}>
                {dayThunder}%
              </Text>
            </View>
            <View style={styles.expandedCell}>
              <View style={styles.expandedCellHeader}>
                <MaterialCommunityIcons name="lightning-bolt" size={12} color="#546E7A" />
                <Text style={[styles.expandedCellLabel, { color: theme.textTertiary }]}>
                  {language === 'mr' ? 'रात्र वादळ' : 'Night Thunder'}
                </Text>
              </View>
              <Text style={[styles.expandedCellValue, { color: nightThunder > 50 ? theme.alertOrange : theme.textSecondary }]}>
                {nightThunder}%
              </Text>
            </View>
          </View>

          {/* RealFeel */}
          {item.RealFeelTemperature ? (
            <View style={styles.expandedGrid}>
              <View style={styles.expandedCell}>
                <View style={styles.expandedCellHeader}>
                  <MaterialCommunityIcons name="thermometer-high" size={12} color="#FF7043" />
                  <Text style={[styles.expandedCellLabel, { color: theme.textTertiary }]}>
                    {language === 'mr' ? 'जाणवणारा कमाल' : 'RealFeel High'}
                  </Text>
                </View>
                <Text style={[styles.expandedCellValue, { color: theme.textPrimary }]}>
                  {Math.round(item.RealFeelTemperature.Maximum.Value)}°C
                </Text>
              </View>
              <View style={styles.expandedCell}>
                <View style={styles.expandedCellHeader}>
                  <MaterialCommunityIcons name="thermometer-low" size={12} color="#42A5F5" />
                  <Text style={[styles.expandedCellLabel, { color: theme.textTertiary }]}>
                    {language === 'mr' ? 'जाणवणारा किमान' : 'RealFeel Low'}
                  </Text>
                </View>
                <Text style={[styles.expandedCellValue, { color: theme.textPrimary }]}>
                  {Math.round(item.RealFeelTemperature.Minimum.Value)}°C
                </Text>
              </View>
            </View>
          ) : null}

          {/* Total liquid */}
          {item.Day?.TotalLiquid && item.Day.TotalLiquid.Value > 0 ? (
            <View style={[styles.liquidRow, { backgroundColor: theme.accentBlue + '15', borderColor: theme.accentBlue + '30' }]}>
              <MaterialCommunityIcons name="cup-water" size={14} color={theme.accentBlue} />
              <Text style={[styles.liquidText, { color: theme.textSecondary }]}>
                {language === 'mr' ? 'एकूण पाऊस: ' : 'Total Liquid: '}
                <Text style={{ fontWeight: '700', color: theme.accentBlue }}>
                  {item.Day.TotalLiquid.Value.toFixed(1)} {item.Day.TotalLiquid.Unit}
                </Text>
              </Text>
            </View>
          ) : null}

          {/* Sunrise/Sunset */}
          {item.Sun ? (
            <View style={styles.sunRow}>
              <View style={styles.sunItem}>
                <MaterialIcons name="wb-sunny" size={16} color="#FFD700" />
                <Text style={[styles.sunLabel, { color: theme.textTertiary }]}>
                  {language === 'mr' ? 'सूर्योदय' : 'Sunrise'}
                </Text>
                <Text style={[styles.sunValue, { color: theme.textPrimary }]}>
                  {new Date(item.Sun.Rise).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <View style={[styles.sunDivider, { backgroundColor: theme.surfaceBorder }]} />
              <View style={styles.sunItem}>
                <MaterialIcons name="nights-stay" size={16} color="#7C83BD" />
                <Text style={[styles.sunLabel, { color: theme.textTertiary }]}>
                  {language === 'mr' ? 'सूर्यास्त' : 'Sunset'}
                </Text>
                <Text style={[styles.sunValue, { color: theme.textPrimary }]}>
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

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ForecastScreen() {
  const { theme } = useTheme();
  const { t, language } = useLanguage();
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
            <Text style={[styles.tabLabel, { color: activeTab === tab ? '#000' : theme.textSecondary, fontWeight: activeTab === tab ? '700' : '500' }]}>
              {tab === 'hourly' ? t.hourly : t.daily}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* AccuWeather Headline */}
      {dailyForecast?.Headline?.Text ? (
        <View style={[styles.headline, { backgroundColor: theme.surfaceHighlight, borderColor: theme.primary + '40' }]}>
          <MaterialIcons name="info-outline" size={16} color={theme.primary} />
          <Text style={[styles.headlineText, { color: theme.textSecondary }]} numberOfLines={2}>
            {dailyForecast.Headline.Text}
          </Text>
        </View>
      ) : null}

      {/* ── HOURLY VIEW ── */}
      {activeTab === 'hourly' ? (
        <ScrollView
          contentContainerStyle={styles.hourlyScrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.primary} />
          }
        >
          {/* Horizontal card scroll */}
          <Text style={[styles.sectionLabel, { color: theme.textTertiary }]}>
            {t.hourlyForecast} · {hourlyForecast.length}h
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hourlyCardRow}
            style={{ marginTop: 8, marginBottom: 4 }}
          >
            {hourlyForecast.map((item, i) => (
              <HourlyCard key={`hc_${i}`} item={item} isNow={i === 0} />
            ))}
          </ScrollView>

          <View style={{ height: 20 }} />

          {/* Rain Probability Chart */}
          <Text style={[styles.sectionLabel, { color: theme.textTertiary }]}>{t.rainProbability}</Text>
          <View style={{ marginTop: 8 }}>
            <RainChart hourly={hourlyForecast} theme={theme} language={language} />
          </View>

          <View style={{ height: 16 }} />

          {/* Thunderstorm Chart */}
          {hourlyForecast.some((h) => (h.ThunderstormProbability ?? 0) > 0) ? (
            <>
              <Text style={[styles.sectionLabel, { color: theme.textTertiary }]}>{t.thunderstormProb}</Text>
              <View style={{ marginTop: 8 }}>
                <ThunderChart hourly={hourlyForecast} theme={theme} language={language} />
              </View>
            </>
          ) : null}

          {/* Hourly Detail Table */}
          <View style={{ height: 16 }} />
          <Text style={[styles.sectionLabel, { color: theme.textTertiary }]}>
            {language === 'mr' ? 'तासिक तपशील' : 'Hourly Detail'}
          </Text>
          <View style={[styles.hourlyTable, { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder, marginTop: 8 }]}>
            <View style={[styles.hourlyTableHeader, { borderBottomColor: theme.surfaceBorder }]}>
              <Text style={[styles.hourlyTableHLabel, { color: theme.textTertiary, flex: 2 }]}>
                {language === 'mr' ? 'वेळ' : 'Time'}
              </Text>
              <Text style={[styles.hourlyTableHLabel, { color: theme.textTertiary, flex: 2 }]}>
                {language === 'mr' ? 'परिस्थिती' : 'Condition'}
              </Text>
              <Text style={[styles.hourlyTableHLabel, { color: theme.textTertiary, flex: 1, textAlign: 'right' }]}>°C</Text>
              <Text style={[styles.hourlyTableHLabel, { color: theme.textTertiary, flex: 1, textAlign: 'right' }]}>
                {language === 'mr' ? 'पाऊस' : 'Rain'}
              </Text>
              <Text style={[styles.hourlyTableHLabel, { color: theme.textTertiary, flex: 1, textAlign: 'right' }]}>
                {language === 'mr' ? 'वारा' : 'Wind'}
              </Text>
            </View>
            {hourlyForecast.map((item, i) => {
              const rain = item.RainProbability ?? item.PrecipitationProbability ?? 0;
              const windSpd = item.Wind?.Speed?.Value ?? 0;
              return (
                <View
                  key={`ht_${i}`}
                  style={[
                    styles.hourlyTableRow,
                    { borderBottomColor: theme.surfaceBorder },
                    i % 2 === 0 ? { backgroundColor: theme.surface + '80' } : {},
                  ]}
                >
                  <Text style={[styles.hourlyTableCell, { color: theme.textSecondary, flex: 2 }]}>
                    {new Date(item.DateTime).toLocaleTimeString(language === 'mr' ? 'mr-IN' : 'en-IN', {
                      hour: '2-digit', minute: '2-digit', hour12: true,
                    })}
                  </Text>
                  <Text style={[styles.hourlyTableCell, { color: theme.textSecondary, flex: 2 }]} numberOfLines={1}>
                    {item.IconPhrase}
                  </Text>
                  <Text style={[styles.hourlyTableCell, { color: theme.textPrimary, flex: 1, textAlign: 'right', fontWeight: '700' }]}>
                    {Math.round(item.Temperature.Value)}°
                  </Text>
                  <Text style={[styles.hourlyTableCell, { color: getRainColor(rain, theme), flex: 1, textAlign: 'right', fontWeight: '600' }]}>
                    {rain}%
                  </Text>
                  <Text style={[styles.hourlyTableCell, { color: theme.accentCyan, flex: 1, textAlign: 'right' }]}>
                    {Math.round(windSpd)}
                  </Text>
                </View>
              );
            })}
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>
      ) : (
        /* ── DAILY VIEW ── */
        <FlatList
          data={dailyForecast?.DailyForecasts ?? []}
          keyExtractor={(item, i) => `daily_${i}`}
          renderItem={({ item, index }) => (
            <DailyItem item={item} index={index} language={language} theme={theme} />
          )}
          contentContainerStyle={styles.dailyListContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.primary} />
          }
          ListHeaderComponent={
            <Text style={[styles.sectionLabel, { color: theme.textTertiary, marginBottom: 10 }]}>
              {t.dailyForecast} · {dailyForecast?.DailyForecasts?.length ?? 0} {language === 'mr' ? 'दिवस' : 'days'}
            </Text>
          }
          ListEmptyComponent={
            <View style={{ padding: 40, alignItems: 'center' }}>
              <LoadingSpinner message={t.loading} size="small" />
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  tabBar: {
    flexDirection: 'row', margin: 16, borderRadius: 12, borderWidth: 1, padding: 4, gap: 4,
  },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingVertical: 10, borderRadius: 8, gap: 6,
  },
  tabLabel: { fontSize: 14 },

  headline: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    marginHorizontal: 16, marginBottom: 10, padding: 12, borderRadius: 10, borderWidth: 1,
  },
  headlineText: { flex: 1, fontSize: 13, lineHeight: 20 },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1.1,
    textTransform: 'uppercase', marginLeft: 2,
  },

  // ── Hourly ──
  hourlyScrollContent: { paddingHorizontal: 16 },
  hourlyCardRow: { flexDirection: 'row', gap: 10, paddingRight: 4 },
  hourlyCard: {
    alignItems: 'center', paddingHorizontal: 12, paddingVertical: 14,
    borderRadius: 16, borderWidth: 1, minWidth: 76, gap: 7,
  },
  hourlyNowLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  hourlyTime: { fontSize: 11, fontWeight: '500' },
  hourlyTemp: { fontSize: 19, fontWeight: '800' },
  hourlyWind: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  hourlyWindText: { fontSize: 10 },
  hourlyProbs: { gap: 3, alignItems: 'center', minHeight: 18 },
  probChip: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  probChipText: { fontSize: 10, fontWeight: '600' },

  // ── Charts ──
  chartCard: {
    borderRadius: 16, borderWidth: 1, padding: 14, gap: 12,
  },
  chartHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chartTitle: { flex: 1, fontSize: 13, fontWeight: '600' },
  chartMax: { fontSize: 12, fontWeight: '600' },
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', height: 110, gap: 3 },
  barCol: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: 2 },
  barTopLabel: { fontSize: 8, fontWeight: '600', height: 12 },
  barTrack: { width: '100%', height: 70, justifyContent: 'flex-end', alignItems: 'center' },
  barFill: { width: '80%', borderRadius: 3, minHeight: 4 },
  barBottomLabel: { fontSize: 8, marginTop: 2 },

  // ── Hourly Table ──
  hourlyTable: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  hourlyTableHeader: {
    flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1,
  },
  hourlyTableHLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  hourlyTableRow: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1 },
  hourlyTableCell: { fontSize: 12 },

  // ── Daily ──
  dailyListContent: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 24 },
  dailyCard: {
    borderRadius: 16, borderWidth: 1, marginBottom: 10, overflow: 'hidden',
  },
  dailyMainRow: {
    flexDirection: 'row', alignItems: 'center', padding: 14, gap: 8,
  },
  dailyDateCol: { width: 72 },
  dailyDayName: { fontSize: 14, fontWeight: '700' },
  dailyDateText: { fontSize: 11, marginTop: 2 },
  dailyCondCol: { flex: 1, alignItems: 'center', gap: 4 },
  dailyCondText: { fontSize: 10, textAlign: 'center', lineHeight: 14 },
  dailyProbCol: { width: 44, alignItems: 'center', gap: 4 },
  probItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  probItemText: { fontSize: 11, fontWeight: '700' },
  dailyTempCol: { width: 72, alignItems: 'flex-end', gap: 5 },
  tempRangeRow: { flexDirection: 'row', gap: 6, alignItems: 'baseline' },
  dailyTempHigh: { fontSize: 17, fontWeight: '800' },
  dailyTempLow: { fontSize: 14, fontWeight: '500' },
  tempBarTrack: { height: 4, width: '100%', borderRadius: 2, overflow: 'hidden' },
  tempBarFill: { height: '100%', borderRadius: 2 },

  // Expanded daily
  dailyExpandedSection: {
    paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, paddingTop: 12, gap: 12,
  },
  predictionBlock: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    padding: 10, borderRadius: 8, borderWidth: 1,
  },
  predictionText: { flex: 1, fontSize: 13, lineHeight: 20 },
  expandedGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  expandedCell: {
    width: (SCREEN_W - 76) / 2, gap: 4,
    backgroundColor: 'transparent',
  },
  expandedCellHeader: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  expandedCellLabel: { fontSize: 11 },
  expandedCellValue: { fontSize: 20, fontWeight: '800' },
  liquidRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 10, borderRadius: 8, borderWidth: 1,
  },
  liquidText: { fontSize: 13 },
  sunRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  sunItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  sunLabel: { fontSize: 11 },
  sunValue: { fontSize: 13, fontWeight: '600' },
  sunDivider: { width: 1, height: 30 },
});
