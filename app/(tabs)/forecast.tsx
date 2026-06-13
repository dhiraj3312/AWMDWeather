import React, { useState, useRef } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWeather } from '@/contexts/WeatherContext';
import Header from '@/components/layout/Header';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorView from '@/components/ui/ErrorView';
import { HourlyForecast, DailyForecast } from '@/services/accuweather';

const { width: SCREEN_W } = Dimensions.get('window');

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

function getWeatherIconColor(code: number, isDay: boolean): string {
  if ([1, 2].includes(code)) return isDay ? '#FFD700' : '#C5CAE9';
  if ([3, 4, 5].includes(code)) return '#FFB300';
  if ([6, 7, 8].includes(code)) return '#90A4AE';
  if ([11].includes(code)) return '#B0BEC5';
  if ([12, 13, 14, 18, 39, 40].includes(code)) return '#42A5F5';
  if ([15, 16, 17, 41, 42].includes(code)) return '#FF9800';
  return '#90A4AE';
}

function getRainColor(prob: number, theme: any): string {
  if (prob >= 80) return theme.alertRed;
  if (prob >= 60) return theme.alertOrange;
  if (prob >= 40) return theme.alertYellow;
  return theme.textTertiary;
}

// ─── Premium Hourly Card ──────────────────────────────────────────────────────
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
  const iconColor = isNow ? theme.primary : getWeatherIconColor(item.WeatherIcon, item.IsDaylight);

  return (
    <View style={[
      styles.hourlyCard,
      {
        backgroundColor: isNow ? theme.primary + '20' : theme.surfaceElevated,
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
      <MaterialCommunityIcons name={iconName as any} size={28} color={iconColor} />
      <Text style={[styles.hourlyTemp, { color: theme.textPrimary }]}>
        {Math.round(item.Temperature.Value)}°
      </Text>
      {item.Wind ? (
        <View style={styles.hourlyWind}>
          <MaterialCommunityIcons name="weather-windy" size={10} color={theme.accentCyan} />
          <Text style={[styles.hourlyWindText, { color: theme.textTertiary }]}>
            {Math.round(item.Wind.Speed.Value)}
          </Text>
        </View>
      ) : null}
      <View style={styles.hourlyProbs}>
        {rainProb > 5 ? (
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

// ─── Probability Bar Chart ────────────────────────────────────────────────────
function ProbChart({
  hourly, theme, language, type,
}: {
  hourly: HourlyForecast[]; theme: any; language: string; type: 'rain' | 'thunder';
}) {
  const data = hourly.slice(0, 12);
  const isRain = type === 'rain';
  const icon = isRain ? 'water' : 'lightning-bolt';
  const color = isRain ? theme.accentBlue : theme.alertYellow;
  const title = isRain
    ? (language === 'mr' ? 'पाऊस संभावना (12 तास)' : 'Rain Probability (12h)')
    : (language === 'mr' ? 'वादळ संभावना (12 तास)' : 'Thunderstorm Probability (12h)');
  const getProb = (h: HourlyForecast) =>
    isRain ? (h.RainProbability ?? h.PrecipitationProbability ?? 0) : (h.ThunderstormProbability ?? 0);
  const maxProb = Math.max(...data.map(getProb));

  if (type === 'thunder' && maxProb === 0) return null;

  return (
    <View style={[styles.chartCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder }]}>
      <View style={styles.chartHeader}>
        <MaterialCommunityIcons name={icon as any} size={14} color={color} />
        <Text style={[styles.chartTitle, { color: theme.textSecondary }]}>{title}</Text>
        <Text style={[styles.chartMaxLabel, { color: color }]}>max {maxProb}%</Text>
      </View>
      <View style={styles.chartBars}>
        {data.map((item, i) => {
          const prob = getProb(item);
          const h = Math.max(4, (prob / 100) * 70);
          const barColor = isRain ? getRainColor(prob, theme) : (prob > 60 ? theme.alertOrange : theme.alertYellow);
          return (
            <View key={i} style={styles.barCol}>
              <Text style={[styles.barTopLabel, { color: prob > 20 ? barColor : 'transparent' }]}>{prob}%</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { height: h, backgroundColor: barColor }]} />
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

// ─── Expandable Daily Card ────────────────────────────────────────────────────
function DailyCard({ item, index, language, theme }: {
  item: DailyForecast; index: number; language: string; theme: any;
}) {
  const [expanded, setExpanded] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    Animated.timing(slideAnim, { toValue: expanded ? 0 : 1, duration: 220, useNativeDriver: false }).start();
    setExpanded(!expanded);
  };

  const date = new Date(item.Date);
  const isToday = index === 0;
  const isTomorrow = index === 1;
  const dayName = isToday
    ? (language === 'mr' ? 'आज' : 'Today')
    : isTomorrow
    ? (language === 'mr' ? 'उद्या' : 'Tomorrow')
    : date.toLocaleDateString(language === 'mr' ? 'mr-IN' : 'en-IN', { weekday: 'short', month: 'short', day: 'numeric' });

  const maxRain = Math.max(item.Day?.RainProbability ?? 0, item.Night?.RainProbability ?? 0);
  const maxThunder = Math.max(item.Day?.ThunderstormProbability ?? 0, item.Night?.ThunderstormProbability ?? 0);
  const iconName = getWeatherIconName(item.Day?.Icon ?? 1, true);
  const iconColor = isToday ? theme.primary : getWeatherIconColor(item.Day?.Icon ?? 1, true);
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
      onPress={toggle}
    >
      {/* ── Main Row ── */}
      <View style={styles.dailyMainRow}>
        {/* Date */}
        <View style={styles.dailyDateCol}>
          <Text style={[styles.dailyDayName, { color: isToday ? theme.primary : theme.textPrimary }]}>{dayName}</Text>
          <Text style={[styles.dailyDateText, { color: theme.textTertiary }]}>
            {date.toLocaleDateString(language === 'mr' ? 'mr-IN' : 'en-IN', { month: 'short', day: 'numeric' })}
          </Text>
        </View>

        {/* Icon + condition */}
        <View style={styles.dailyCondCol}>
          <MaterialCommunityIcons name={iconName as any} size={26} color={iconColor} />
          <Text style={[styles.dailyCondText, { color: theme.textSecondary }]} numberOfLines={2}>
            {item.Day?.IconPhrase ?? ''}
          </Text>
        </View>

        {/* Rain/Thunder probs */}
        <View style={styles.dailyProbCol}>
          {maxRain > 0 ? (
            <View style={styles.probItem}>
              <MaterialCommunityIcons name="water" size={12} color={getRainColor(maxRain, theme)} />
              <Text style={[styles.probItemText, { color: getRainColor(maxRain, theme) }]}>{maxRain}%</Text>
            </View>
          ) : null}
          {maxThunder > 20 ? (
            <View style={styles.probItem}>
              <MaterialCommunityIcons name="lightning-bolt" size={12} color={theme.alertYellow} />
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
          <View style={[styles.tempBarTrack, { backgroundColor: theme.surfaceBorder }]}>
            <View style={[styles.tempBarFill, {
              backgroundColor: theme.primary,
              width: `${Math.min(100, Math.max(20, (tempSpread / 15) * 100))}%` as any,
            }]} />
          </View>
        </View>

        <MaterialIcons name={expanded ? 'expand-less' : 'expand-more'} size={16} color={theme.textTertiary} />
      </View>

      {/* ── Expanded Detail ── */}
      {expanded ? (
        <View style={[styles.dailyExpandedSection, { borderTopColor: theme.surfaceBorder }]}>
          {/* Day summary */}
          {(item.Day?.IconPhrase || item.Night?.IconPhrase) ? (
            <View style={[styles.predictionBlock, { backgroundColor: theme.surface, borderColor: theme.primary + '30' }]}>
              <MaterialIcons name="info-outline" size={13} color={theme.primary} />
              <Text style={[styles.predictionText, { color: theme.textSecondary }]}>
                {item.Day?.IconPhrase ?? ''}
                {item.Night?.IconPhrase ? ` / ${item.Night.IconPhrase}` : ''}
                {item.Day?.PrecipitationType ? ` · ${item.Day.PrecipitationIntensity ?? ''} ${item.Day.PrecipitationType}` : ''}
              </Text>
            </View>
          ) : null}

          {/* Stats grid */}
          <View style={styles.expandedGrid}>
            {[
              { icon: 'wb-sunny', lib: 'material', label: language === 'mr' ? 'दिवस पाऊस' : 'Day Rain', val: `${item.Day?.RainProbability ?? 0}%`, color: getRainColor(item.Day?.RainProbability ?? 0, theme) },
              { icon: 'nights-stay', lib: 'material', label: language === 'mr' ? 'रात्र पाऊस' : 'Night Rain', val: `${item.Night?.RainProbability ?? 0}%`, color: getRainColor(item.Night?.RainProbability ?? 0, theme) },
              { icon: 'lightning-bolt', lib: 'community', label: language === 'mr' ? 'दिवस वादळ' : 'Day Thunder', val: `${item.Day?.ThunderstormProbability ?? 0}%`, color: theme.alertYellow },
              { icon: 'lightning-bolt', lib: 'community', label: language === 'mr' ? 'रात्र वादळ' : 'Night Thunder', val: `${item.Night?.ThunderstormProbability ?? 0}%`, color: theme.alertYellow },
            ].map((cell, i) => (
              <View key={i} style={styles.expandedCell}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                  {cell.lib === 'material'
                    ? <MaterialIcons name={cell.icon as any} size={11} color={theme.textTertiary} />
                    : <MaterialCommunityIcons name={cell.icon as any} size={11} color={theme.textTertiary} />}
                  <Text style={[{ fontSize: 10 }, { color: theme.textTertiary }]}>{cell.label}</Text>
                </View>
                <Text style={[{ fontSize: 18, fontWeight: '800' }, { color: cell.color }]}>{cell.val}</Text>
              </View>
            ))}
          </View>

          {/* RealFeel */}
          {item.RealFeelTemperature ? (
            <View style={styles.expandedGrid}>
              <View style={styles.expandedCell}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                  <MaterialCommunityIcons name="thermometer-high" size={11} color="#FF7043" />
                  <Text style={[{ fontSize: 10 }, { color: theme.textTertiary }]}>{language === 'mr' ? 'जाणवणारा कमाल' : 'RealFeel High'}</Text>
                </View>
                <Text style={[{ fontSize: 18, fontWeight: '800' }, { color: theme.textPrimary }]}>
                  {Math.round(item.RealFeelTemperature.Maximum.Value)}°C
                </Text>
              </View>
              <View style={styles.expandedCell}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                  <MaterialCommunityIcons name="thermometer-low" size={11} color="#42A5F5" />
                  <Text style={[{ fontSize: 10 }, { color: theme.textTertiary }]}>{language === 'mr' ? 'जाणवणारा किमान' : 'RealFeel Low'}</Text>
                </View>
                <Text style={[{ fontSize: 18, fontWeight: '800' }, { color: theme.textPrimary }]}>
                  {Math.round(item.RealFeelTemperature.Minimum.Value)}°C
                </Text>
              </View>
            </View>
          ) : null}

          {/* Total liquid */}
          {item.Day?.TotalLiquid && item.Day.TotalLiquid.Value > 0 ? (
            <View style={[styles.liquidRow, { backgroundColor: theme.accentBlue + '15', borderColor: theme.accentBlue + '30' }]}>
              <MaterialCommunityIcons name="cup-water" size={14} color={theme.accentBlue} />
              <Text style={[{ fontSize: 13 }, { color: theme.textSecondary }]}>
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
              <View style={styles.sunRowItem}>
                <MaterialIcons name="wb-sunny" size={15} color="#FFD700" />
                <Text style={[{ fontSize: 11 }, { color: theme.textTertiary }]}>{language === 'mr' ? 'सूर्योदय' : 'Sunrise'}</Text>
                <Text style={[{ fontSize: 13, fontWeight: '600' }, { color: theme.textPrimary }]}>
                  {new Date(item.Sun.Rise).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <View style={[styles.sunDivider, { backgroundColor: theme.surfaceBorder }]} />
              <View style={styles.sunRowItem}>
                <MaterialIcons name="nights-stay" size={15} color="#7C83BD" />
                <Text style={[{ fontSize: 11 }, { color: theme.textTertiary }]}>{language === 'mr' ? 'सूर्यास्त' : 'Sunset'}</Text>
                <Text style={[{ fontSize: 13, fontWeight: '600' }, { color: theme.textPrimary }]}>
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

// ─── Main Forecast Screen ─────────────────────────────────────────────────────
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

      {/* Tabs */}
      <View style={[styles.tabBar, { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder }]}>
        {(['hourly', 'daily'] as const).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <Pressable
              key={tab}
              style={[
                styles.tabBtn,
                isActive && { backgroundColor: theme.primary },
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <MaterialIcons
                name={tab === 'hourly' ? 'access-time' : 'calendar-today'}
                size={15}
                color={isActive ? '#000' : theme.textSecondary}
              />
              <Text style={[styles.tabLabel, {
                color: isActive ? '#000' : theme.textSecondary,
                fontWeight: isActive ? '700' : '500',
              }]}>
                {tab === 'hourly' ? t.hourly : t.daily}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Headline */}
      {dailyForecast?.Headline?.Text ? (
        <View style={[styles.headline, { backgroundColor: theme.primary + '15', borderColor: theme.primary + '40' }]}>
          <MaterialIcons name="info-outline" size={15} color={theme.primary} />
          <Text style={[styles.headlineText, { color: theme.textSecondary }]} numberOfLines={2}>
            {dailyForecast.Headline.Text}
          </Text>
        </View>
      ) : null}

      {/* ── HOURLY ── */}
      {activeTab === 'hourly' ? (
        <ScrollView
          contentContainerStyle={styles.hourlyScrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.primary} />}
        >
          {/* Horizontal card scroll */}
          <Text style={[styles.sectionLabel, { color: theme.textTertiary }]}>
            {t.hourlyForecast} · {hourlyForecast.length}h
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hourlyCardRow}
            style={{ marginBottom: 4 }}
          >
            {hourlyForecast.map((item, i) => (
              <HourlyCard key={i} item={item} isNow={i === 0} />
            ))}
          </ScrollView>

          <View style={{ height: 18 }} />

          {/* Rain Chart */}
          <Text style={[styles.sectionLabel, { color: theme.textTertiary }]}>{t.rainProbability}</Text>
          <View style={{ marginTop: 8 }}>
            <ProbChart hourly={hourlyForecast} theme={theme} language={language} type="rain" />
          </View>

          {/* Thunder Chart */}
          {hourlyForecast.some((h) => (h.ThunderstormProbability ?? 0) > 0) ? (
            <>
              <View style={{ height: 14 }} />
              <Text style={[styles.sectionLabel, { color: theme.textTertiary }]}>{t.thunderstormProb}</Text>
              <View style={{ marginTop: 8 }}>
                <ProbChart hourly={hourlyForecast} theme={theme} language={language} type="thunder" />
              </View>
            </>
          ) : null}

          {/* Hourly Table */}
          <View style={{ height: 16 }} />
          <Text style={[styles.sectionLabel, { color: theme.textTertiary }]}>
            {language === 'mr' ? 'तासिक तपशील' : 'Hourly Detail'}
          </Text>
          <View style={[styles.hourlyTable, { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder, marginTop: 8 }]}>
            <View style={[styles.hourlyTableHeader, { borderBottomColor: theme.surfaceBorder, backgroundColor: theme.primary + '15' }]}>
              {[
                { label: language === 'mr' ? 'वेळ' : 'Time', flex: 2 },
                { label: language === 'mr' ? 'परिस्थिती' : 'Condition', flex: 2 },
                { label: '°C', flex: 1, align: 'right' as const },
                { label: language === 'mr' ? 'पाऊस' : 'Rain', flex: 1, align: 'right' as const },
                { label: language === 'mr' ? 'वारा' : 'Wind', flex: 1, align: 'right' as const },
              ].map((col, i) => (
                <Text key={i} style={[styles.hourlyTableHLabel, { color: theme.textTertiary, flex: col.flex, textAlign: col.align ?? 'left' }]}>
                  {col.label}
                </Text>
              ))}
            </View>
            {hourlyForecast.map((item, i) => {
              const rain = item.RainProbability ?? item.PrecipitationProbability ?? 0;
              const wind = item.Wind?.Speed?.Value ?? 0;
              return (
                <View
                  key={i}
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
                    {Math.round(wind)}
                  </Text>
                </View>
              );
            })}
          </View>
          <View style={{ height: 24 }} />
        </ScrollView>
      ) : (
        /* ── DAILY ── */
        <FlatList
          data={dailyForecast?.DailyForecasts ?? []}
          keyExtractor={(item, i) => `daily_${i}`}
          renderItem={({ item, index }) => (
            <DailyCard item={item} index={index} language={language} theme={theme} />
          )}
          contentContainerStyle={styles.dailyListContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.primary} />}
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

  hourlyScrollContent: { paddingHorizontal: 16, paddingTop: 4 },
  hourlyCardRow: { flexDirection: 'row', gap: 9, paddingRight: 4, paddingTop: 8 },
  hourlyCard: {
    alignItems: 'center', paddingHorizontal: 11, paddingVertical: 13,
    borderRadius: 16, borderWidth: 1, minWidth: 74, gap: 6,
  },
  hourlyNowLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  hourlyTime: { fontSize: 10, fontWeight: '500' },
  hourlyTemp: { fontSize: 18, fontWeight: '800' },
  hourlyWind: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  hourlyWindText: { fontSize: 10 },
  hourlyProbs: { gap: 3, alignItems: 'center', minHeight: 16 },
  probChip: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  probChipText: { fontSize: 9, fontWeight: '600' },

  chartCard: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 12 },
  chartHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chartTitle: { flex: 1, fontSize: 13, fontWeight: '600' },
  chartMaxLabel: { fontSize: 11, fontWeight: '600' },
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', height: 110, gap: 3 },
  barCol: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: 2 },
  barTopLabel: { fontSize: 7, fontWeight: '700', height: 11 },
  barTrack: { width: '100%', height: 70, justifyContent: 'flex-end', alignItems: 'center' },
  barFill: { width: '80%', borderRadius: 3, minHeight: 4, opacity: 0.9 },
  barBottomLabel: { fontSize: 7, marginTop: 2 },

  hourlyTable: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  hourlyTableHeader: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 9, borderBottomWidth: 1 },
  hourlyTableHLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },
  hourlyTableRow: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 9, borderBottomWidth: 1 },
  hourlyTableCell: { fontSize: 12 },

  dailyListContent: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 24 },
  dailyCard: { borderRadius: 16, borderWidth: 1, marginBottom: 10, overflow: 'hidden' },
  dailyMainRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 8 },
  dailyDateCol: { width: 70 },
  dailyDayName: { fontSize: 13, fontWeight: '700' },
  dailyDateText: { fontSize: 10, marginTop: 2 },
  dailyCondCol: { flex: 1, alignItems: 'center', gap: 4 },
  dailyCondText: { fontSize: 9, textAlign: 'center', lineHeight: 13 },
  dailyProbCol: { width: 42, alignItems: 'center', gap: 4 },
  probItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  probItemText: { fontSize: 10, fontWeight: '700' },
  dailyTempCol: { width: 68, alignItems: 'flex-end', gap: 5 },
  tempRangeRow: { flexDirection: 'row', gap: 5, alignItems: 'baseline' },
  dailyTempHigh: { fontSize: 16, fontWeight: '800' },
  dailyTempLow: { fontSize: 13, fontWeight: '500' },
  tempBarTrack: { height: 4, width: '100%', borderRadius: 2, overflow: 'hidden' },
  tempBarFill: { height: '100%', borderRadius: 2 },

  dailyExpandedSection: { paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, paddingTop: 12, gap: 12 },
  predictionBlock: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10, borderRadius: 8, borderWidth: 1 },
  predictionText: { flex: 1, fontSize: 13, lineHeight: 19 },
  expandedGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  expandedCell: { width: (SCREEN_W - 76) / 2 },
  liquidRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 8, borderWidth: 1 },
  sunRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  sunRowItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  sunDivider: { width: 1, height: 28 },
});
