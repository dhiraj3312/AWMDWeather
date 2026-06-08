import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  RefreshControl,
  Pressable,
  Modal,
  Platform,
  Dimensions,
} from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText, Defs, LinearGradient as SvgGradient, Stop, Polyline, Rect } from 'react-native-svg';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWeather } from '@/contexts/WeatherContext';
import Header from '@/components/layout/Header';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorView from '@/components/ui/ErrorView';
import { HourlyForecast, DailyForecast } from '@/services/accuweather';

const SCREEN_W = Math.max(320, Dimensions.get('window').width);

// ─── Weather Icon Mapping ──────────────────────────────────────────────────────
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

// ─── SVG Temperature Line Chart ────────────────────────────────────────────────
interface TempPoint { label: string; value: number; secondary?: number }

function TemperatureLineChart({
  data,
  width,
  height = 120,
  color,
  secondaryColor,
  secondaryLabel,
  unit = '°C',
}: {
  data: TempPoint[];
  width: number;
  height?: number;
  color: string;
  secondaryColor?: string;
  secondaryLabel?: string;
  unit?: string;
}) {
  const { theme } = useTheme();
  if (!data || data.length < 2) return null;

  const padL = 28, padR = 12, padT = 20, padB = 30;
  const chartW = Math.max(10, width - padL - padR);
  const chartH = Math.max(10, height - padT - padB);

  const allVals = data.flatMap((d) => [d.value, d.secondary ?? d.value]);
  const minVal = Math.min(...allVals) - 2;
  const maxVal = Math.max(...allVals) + 2;
  const range = Math.max(1, maxVal - minVal);

  const xStep = chartW / Math.max(1, data.length - 1);
  const toX = (i: number) => padL + i * xStep;
  const toY = (v: number) => padT + chartH - ((v - minVal) / range) * chartH;

  // Build smooth SVG path using cubic bezier
  const buildPath = (vals: number[]) => {
    const pts = vals.map((v, i) => ({ x: toX(i), y: toY(v) }));
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const cpx = (prev.x + curr.x) / 2;
      d += ` C ${cpx} ${prev.y} ${cpx} ${curr.y} ${curr.x} ${curr.y}`;
    }
    return d;
  };

  const buildAreaPath = (vals: number[]) => {
    const pts = vals.map((v, i) => ({ x: toX(i), y: toY(v) }));
    let d = `M ${pts[0].x} ${padT + chartH}`;
    d += ` L ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const cpx = (prev.x + curr.x) / 2;
      d += ` C ${cpx} ${prev.y} ${cpx} ${curr.y} ${curr.x} ${curr.y}`;
    }
    d += ` L ${pts[pts.length - 1].x} ${padT + chartH} Z`;
    return d;
  };

  const primaryPath = buildPath(data.map((d) => d.value));
  const areaPath = buildAreaPath(data.map((d) => d.value));
  const secondaryPath = data[0].secondary !== undefined
    ? buildPath(data.map((d) => d.secondary ?? d.value))
    : null;

  const skipEvery = data.length > 12 ? 2 : 1;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <SvgGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.25" />
          <Stop offset="1" stopColor={color} stopOpacity="0.03" />
        </SvgGradient>
      </Defs>

      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((f, i) => {
        const y = padT + f * chartH;
        const val = Math.round(maxVal - f * range);
        return (
          <React.Fragment key={`grid_${i}`}>
            <Line
              x1={padL} y1={y} x2={padL + chartW} y2={y}
              stroke={theme.surfaceBorder} strokeWidth="0.7" strokeDasharray="4,4"
            />
            {i % 2 === 0 ? (
              <SvgText
                x={padL - 4} y={y + 4}
                fontSize="8" fill={theme.textTertiary} textAnchor="end"
              >
                {val}{unit}
              </SvgText>
            ) : null}
          </React.Fragment>
        );
      })}

      {/* Area fill */}
      <Path d={areaPath} fill="url(#areaGrad)" />

      {/* Secondary line (e.g. night temp) */}
      {secondaryPath ? (
        <Path
          d={secondaryPath}
          stroke={secondaryColor ?? '#8FA5C5'}
          strokeWidth="1.5"
          fill="none"
          strokeDasharray="5,3"
        />
      ) : null}

      {/* Primary line */}
      <Path d={primaryPath} stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />

      {/* Data points + labels */}
      {data.map((d, i) => {
        const x = toX(i);
        const y = toY(d.value);
        const showLabel = i % skipEvery === 0;
        return (
          <React.Fragment key={`pt_${i}`}>
            <Circle cx={x} cy={y} r="3.5" fill={color} stroke={theme.background} strokeWidth="1.5" />
            {showLabel ? (
              <>
                <SvgText
                  x={x} y={y - 7}
                  fontSize="9" fill={color} textAnchor="middle" fontWeight="700"
                >
                  {Math.round(d.value)}°
                </SvgText>
                <SvgText
                  x={x} y={height - 4}
                  fontSize="8" fill={theme.textTertiary} textAnchor="middle"
                >
                  {d.label}
                </SvgText>
              </>
            ) : null}
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

// ─── Probability Bar Chart ──────────────────────────────────────────────────────
function ProbBarChart({
  data,
  width,
  height = 80,
  color,
  label,
}: {
  data: { label: string; value: number }[];
  width: number;
  height?: number;
  color: string;
  label?: string;
}) {
  const { theme } = useTheme();
  if (!data || data.length === 0) return null;
  const padL = 4, padR = 4, padT = 14, padB = 18;
  const chartW = Math.max(1, width - padL - padR);
  const chartH = Math.max(1, height - padT - padB);
  const barW = Math.max(4, (chartW / data.length) * 0.65);
  const gap = chartW / data.length;

  return (
    <Svg width={width} height={height}>
      {label ? (
        <SvgText x={width / 2} y={10} fontSize="9" fill={theme.textTertiary} textAnchor="middle">
          {label}
        </SvgText>
      ) : null}
      {data.map((d, i) => {
        const barH = Math.max(2, (d.value / 100) * chartH);
        const x = padL + i * gap + (gap - barW) / 2;
        const y = padT + chartH - barH;
        const textY = padT + chartH + 12;
        return (
          <React.Fragment key={`b_${i}`}>
            <Rect
              x={x} y={y} width={barW} height={barH}
              rx="2" fill={d.value > 0 ? color : theme.surfaceBorder} opacity={0.85}
            />
            <SvgText x={x + barW / 2} y={y - 2} fontSize="7.5" fill={color} textAnchor="middle">
              {d.value > 0 ? `${d.value}%` : ''}
            </SvgText>
            <SvgText x={x + barW / 2} y={textY} fontSize="7.5" fill={theme.textTertiary} textAnchor="middle">
              {d.label}
            </SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

// ─── Metric Row (reusable) ──────────────────────────────────────────────────────
function MetricRow({
  icon, iconLib, label, value, unit, valueColor, theme,
}: {
  icon: string; iconLib?: 'material' | 'community';
  label: string; value: string | number; unit?: string;
  valueColor?: string; theme: any;
}) {
  const lib = iconLib ?? 'material';
  return (
    <View style={mStyles.metricRow}>
      <View style={[mStyles.metricIcon, { backgroundColor: theme.surfaceElevated }]}>
        {lib === 'community' ? (
          <MaterialCommunityIcons name={icon as any} size={16} color={theme.textTertiary} />
        ) : (
          <MaterialIcons name={icon as any} size={16} color={theme.textTertiary} />
        )}
      </View>
      <Text style={[mStyles.metricLabel, { color: theme.textTertiary }]}>{label}</Text>
      <Text style={[mStyles.metricValue, { color: valueColor ?? theme.textPrimary }]}>
        {value}{unit ? <Text style={[mStyles.metricUnit, { color: theme.textTertiary }]}> {unit}</Text> : null}
      </Text>
    </View>
  );
}

// ─── Hourly Detail Modal ────────────────────────────────────────────────────────
function HourlyDetailModal({
  visible, item, allHourly, index, language, onClose,
}: {
  visible: boolean;
  item: HourlyForecast;
  allHourly: HourlyForecast[];
  index: number;
  language: string;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [currentIdx, setCurrentIdx] = useState(index);

  const current = allHourly[currentIdx] ?? item;
  const mr = language === 'mr';

  const rainProb = current.RainProbability ?? current.PrecipitationProbability ?? 0;
  const thunderProb = current.ThunderstormProbability ?? 0;
  const iconName = getWeatherIconName(current.WeatherIcon, current.IsDaylight);

  const timeStr = new Date(current.DateTime).toLocaleTimeString(mr ? 'mr-IN' : 'en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
  const dateStr = new Date(current.DateTime).toLocaleDateString(mr ? 'mr-IN' : 'en-IN', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  // Line chart data: temperatures for all hours
  const chartW = Math.max(10, SCREEN_W - 48);
  const chartData = allHourly.map((h) => ({
    label: `${new Date(h.DateTime).getHours()}h`,
    value: h.Temperature.Value,
  }));

  // Rain probability bars
  const rainBars = allHourly.map((h) => ({
    label: `${new Date(h.DateTime).getHours()}`,
    value: h.RainProbability ?? h.PrecipitationProbability ?? 0,
  }));

  const getRainColor = (p: number) => {
    if (p >= 80) return theme.alertRed;
    if (p >= 60) return theme.alertOrange;
    if (p >= 40) return theme.alertYellow;
    return theme.accentBlue;
  };

  const windDir = current.Wind?.Direction?.English ?? '';
  const windSpeed = current.Wind?.Speed ? `${Math.round(current.Wind.Speed.Value)} km/h` : '--';

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={[mStyles.root, { backgroundColor: theme.background, paddingTop: Platform.OS === 'android' ? 28 : insets.top }]}>

        {/* Header */}
        <View style={[mStyles.header, { backgroundColor: theme.surface, borderBottomColor: theme.surfaceBorder }]}>
          <Pressable onPress={onClose} hitSlop={12} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
            <MaterialIcons name="arrow-back" size={24} color={theme.textPrimary} />
          </Pressable>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[mStyles.headerTitle, { color: theme.primary }]}>{timeStr}</Text>
            <Text style={[mStyles.headerSub, { color: theme.textSecondary }]}>{dateStr}</Text>
          </View>
          <MaterialCommunityIcons name={iconName as any} size={36} color={theme.primary} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[mStyles.scroll, { paddingBottom: insets.bottom + 32 }]}
        >
          {/* Main temperature display */}
          <View style={[mStyles.tempCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder }]}>
            <View style={mStyles.tempMain}>
              <Text style={[mStyles.bigTemp, { color: theme.textPrimary }]}>
                {Math.round(current.Temperature.Value)}°C
              </Text>
              <Text style={[mStyles.condition, { color: theme.textSecondary }]}>
                {current.IconPhrase}
              </Text>
            </View>
            <View style={mStyles.tempMeta}>
              {rainProb > 0 ? (
                <View style={[mStyles.probBadge, { backgroundColor: getRainColor(rainProb) + '20', borderColor: getRainColor(rainProb) + '50' }]}>
                  <MaterialCommunityIcons name="water" size={14} color={getRainColor(rainProb)} />
                  <Text style={[mStyles.probBadgeText, { color: getRainColor(rainProb) }]}>
                    {mr ? 'पाऊस' : 'Rain'} {rainProb}%
                  </Text>
                </View>
              ) : null}
              {thunderProb > 0 ? (
                <View style={[mStyles.probBadge, { backgroundColor: theme.alertYellow + '20', borderColor: theme.alertYellow + '50' }]}>
                  <MaterialCommunityIcons name="lightning-bolt" size={14} color={theme.alertYellow} />
                  <Text style={[mStyles.probBadgeText, { color: theme.alertYellow }]}>
                    {mr ? 'वादळ' : 'Thunder'} {thunderProb}%
                  </Text>
                </View>
              ) : null}
              {current.HasPrecipitation && current.PrecipitationType ? (
                <View style={[mStyles.probBadge, { backgroundColor: theme.accentBlue + '20', borderColor: theme.accentBlue + '50' }]}>
                  <MaterialIcons name="grain" size={12} color={theme.accentBlue} />
                  <Text style={[mStyles.probBadgeText, { color: theme.accentBlue }]}>{current.PrecipitationType}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Hour navigation strip */}
          <View style={[mStyles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
            <Text style={[mStyles.sectionTitle, { color: theme.textTertiary }]}>
              {mr ? 'तास निवडा' : 'Select Hour'}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
              {allHourly.map((h, i) => {
                const isActive = i === currentIdx;
                const hr = new Date(h.DateTime).getHours();
                const rp = h.RainProbability ?? h.PrecipitationProbability ?? 0;
                return (
                  <Pressable
                    key={`sel_${i}`}
                    onPress={() => setCurrentIdx(i)}
                    style={[
                      mStyles.hourChip,
                      {
                        backgroundColor: isActive ? theme.primary : theme.surfaceElevated,
                        borderColor: isActive ? theme.primary : theme.surfaceBorder,
                      },
                    ]}
                  >
                    <Text style={[mStyles.hourChipTime, { color: isActive ? '#000' : theme.textSecondary }]}>
                      {hr}:00
                    </Text>
                    <Text style={[mStyles.hourChipTemp, { color: isActive ? '#000' : theme.textPrimary }]}>
                      {Math.round(h.Temperature.Value)}°
                    </Text>
                    {rp > 20 ? (
                      <Text style={[mStyles.hourChipRain, { color: isActive ? '#000' : getRainColor(rp) }]}>
                        {rp}%
                      </Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Temperature trend line */}
          <View style={[mStyles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
            <Text style={[mStyles.sectionTitle, { color: theme.textTertiary }]}>
              {mr ? 'तापमान प्रवाह' : 'Temperature Trend'}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TemperatureLineChart
                data={chartData}
                width={Math.max(chartW, allHourly.length * 42)}
                height={140}
                color={theme.primary}
              />
            </ScrollView>
          </View>

          {/* Rain probability chart */}
          {rainBars.some((b) => b.value > 0) ? (
            <View style={[mStyles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
              <Text style={[mStyles.sectionTitle, { color: theme.textTertiary }]}>
                {mr ? 'पाऊस संभावना' : 'Rain Probability'}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <ProbBarChart
                  data={rainBars}
                  width={Math.max(chartW, allHourly.length * 30)}
                  height={90}
                  color={theme.accentBlue}
                />
              </ScrollView>
            </View>
          ) : null}

          {/* All measurements grid */}
          <View style={[mStyles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
            <Text style={[mStyles.sectionTitle, { color: theme.textTertiary }]}>
              {mr ? 'संपूर्ण मोजमाप' : 'All Measurements'}
            </Text>
            <View style={mStyles.metricsGrid}>

              <View style={[mStyles.metricBlock, { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder }]}>
                <MaterialCommunityIcons name="thermometer" size={22} color={theme.primary} />
                <Text style={[mStyles.metricBlockVal, { color: theme.textPrimary }]}>
                  {Math.round(current.Temperature.Value)}°C
                </Text>
                <Text style={[mStyles.metricBlockLabel, { color: theme.textTertiary }]}>
                  {mr ? 'तापमान' : 'Temperature'}
                </Text>
              </View>

              <View style={[mStyles.metricBlock, { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder }]}>
                <MaterialCommunityIcons name="water-percent" size={22} color={theme.accentCyan} />
                <Text style={[mStyles.metricBlockVal, { color: theme.textPrimary }]}>--</Text>
                <Text style={[mStyles.metricBlockLabel, { color: theme.textTertiary }]}>
                  {mr ? 'आर्द्रता' : 'Humidity'}
                </Text>
              </View>

              <View style={[mStyles.metricBlock, { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder }]}>
                <MaterialCommunityIcons name="weather-windy" size={22} color={theme.accentBlue} />
                <Text style={[mStyles.metricBlockVal, { color: theme.textPrimary }]}>{windSpeed}</Text>
                <Text style={[mStyles.metricBlockLabel, { color: theme.textTertiary }]}>
                  {windDir} {mr ? 'वारा' : 'Wind'}
                </Text>
              </View>

              <View style={[mStyles.metricBlock, { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder }]}>
                <MaterialCommunityIcons name="weather-rainy" size={22} color={theme.accentBlue} />
                <Text style={[mStyles.metricBlockVal, { color: getRainColor(rainProb) }]}>{rainProb}%</Text>
                <Text style={[mStyles.metricBlockLabel, { color: theme.textTertiary }]}>
                  {mr ? 'पाऊस' : 'Rain Prob'}
                </Text>
              </View>

              <View style={[mStyles.metricBlock, { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder }]}>
                <MaterialCommunityIcons name="lightning-bolt" size={22} color={theme.alertYellow} />
                <Text style={[mStyles.metricBlockVal, { color: thunderProb > 50 ? theme.alertOrange : theme.textPrimary }]}>
                  {thunderProb}%
                </Text>
                <Text style={[mStyles.metricBlockLabel, { color: theme.textTertiary }]}>
                  {mr ? 'वादळ' : 'Thunder'}
                </Text>
              </View>

              <View style={[mStyles.metricBlock, { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder }]}>
                <MaterialCommunityIcons name="weather-sunny" size={22} color={theme.alertOrange} />
                <Text style={[mStyles.metricBlockVal, { color: theme.textPrimary }]}>
                  {current.IsDaylight ? (mr ? 'दिवसा' : 'Daytime') : (mr ? 'रात्री' : 'Night')}
                </Text>
                <Text style={[mStyles.metricBlockLabel, { color: theme.textTertiary }]}>
                  {mr ? 'वेळ' : 'Period'}
                </Text>
              </View>
            </View>

            {/* Detailed rows */}
            <View style={[mStyles.detailRows, { borderTopColor: theme.surfaceBorder }]}>
              <MetricRow
                icon="weather-windy" iconLib="community"
                label={mr ? 'वारा वेग' : 'Wind Speed'}
                value={current.Wind?.Speed ? Math.round(current.Wind.Speed.Value) : '--'}
                unit="km/h"
                theme={theme}
              />
              <MetricRow
                icon="compass" iconLib="community"
                label={mr ? 'वारा दिशा' : 'Wind Direction'}
                value={current.Wind?.Direction?.English ?? '--'}
                theme={theme}
              />
              {current.HasPrecipitation ? (
                <MetricRow
                  icon="water" iconLib="community"
                  label={mr ? 'पर्जन्य प्रकार' : 'Precipitation Type'}
                  value={current.PrecipitationType ?? '--'}
                  valueColor={theme.accentBlue}
                  theme={theme}
                />
              ) : null}
              <MetricRow
                icon="access-time"
                label={mr ? 'वेळ' : 'DateTime'}
                value={new Date(current.DateTime).toLocaleString(mr ? 'mr-IN' : 'en-IN', {
                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                })}
                theme={theme}
              />
            </View>
          </View>

          {/* AWMD Context */}
          <View style={[mStyles.awmdCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.primary + '40' }]}>
            <View style={mStyles.awmdRow}>
              <MaterialIcons name="info-outline" size={16} color={theme.primary} />
              <Text style={[mStyles.awmdText, { color: theme.textSecondary }]}>
                {mr
                  ? 'AWMD स्थानिक: ढग हालचाल W/NW/SW → E/ESE | सासवड क्षेत्रातून तीव्र विकास शक्य'
                  : 'AWMD Local: Cloud movement W/NW/SW → E/ESE | Stronger development possible from Saswad sector'}
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Daily Detail Modal ─────────────────────────────────────────────────────────
function DailyDetailModal({
  visible, item, allDaily, index, language, onClose,
}: {
  visible: boolean;
  item: DailyForecast;
  allDaily: DailyForecast[];
  index: number;
  language: string;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [currentIdx, setCurrentIdx] = useState(index);

  const current = allDaily[currentIdx] ?? item;
  const mr = language === 'mr';
  const isToday = currentIdx === 0;

  const iconName = getWeatherIconName(current.Day?.Icon ?? 1, true);
  const nightIcon = getWeatherIconName(current.Night?.Icon ?? 33, false);

  const dayRain = current.Day?.RainProbability ?? 0;
  const nightRain = current.Night?.RainProbability ?? 0;
  const dayThunder = current.Day?.ThunderstormProbability ?? 0;
  const nightThunder = current.Night?.ThunderstormProbability ?? 0;

  const dateStr = new Date(current.Date).toLocaleDateString(mr ? 'mr-IN' : 'en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  // Temperature range chart (min-max bars for all days)
  const chartW = Math.max(10, SCREEN_W - 48);
  const tempData: TempPoint[] = allDaily.map((d, i) => ({
    label: i === 0 ? (mr ? 'आज' : 'Today') : new Date(d.Date).toLocaleDateString(mr ? 'mr-IN' : 'en-IN', { weekday: 'short' }),
    value: d.Temperature.Maximum.Value,
    secondary: d.Temperature.Minimum.Value,
  }));

  // Rain prob bars for all days
  const rainBars = allDaily.map((d, i) => ({
    label: i === 0 ? (mr ? 'आज' : 'T') : new Date(d.Date).toLocaleDateString('en-IN', { weekday: 'narrow' }),
    value: Math.max(d.Day?.RainProbability ?? 0, d.Night?.RainProbability ?? 0),
  }));

  const getRainColor = (p: number) => {
    if (p >= 80) return theme.alertRed;
    if (p >= 60) return theme.alertOrange;
    if (p >= 40) return theme.alertYellow;
    return theme.accentBlue;
  };

  const formatTime = (dt?: string) => {
    if (!dt) return '--';
    return new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={[mStyles.root, { backgroundColor: theme.background, paddingTop: Platform.OS === 'android' ? 28 : insets.top }]}>

        {/* Header */}
        <View style={[mStyles.header, { backgroundColor: theme.surface, borderBottomColor: theme.surfaceBorder }]}>
          <Pressable onPress={onClose} hitSlop={12} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
            <MaterialIcons name="arrow-back" size={24} color={theme.textPrimary} />
          </Pressable>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[mStyles.headerTitle, { color: theme.primary }]}>
              {isToday ? (mr ? 'आज' : 'Today') : new Date(current.Date).toLocaleDateString(mr ? 'mr-IN' : 'en-IN', { weekday: 'long' })}
            </Text>
            <Text style={[mStyles.headerSub, { color: theme.textSecondary }]}>{dateStr}</Text>
          </View>
          <MaterialCommunityIcons name={iconName as any} size={36} color={theme.primary} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[mStyles.scroll, { paddingBottom: insets.bottom + 32 }]}
        >
          {/* Main temp card */}
          <View style={[mStyles.tempCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder }]}>
            <View style={mStyles.dailyTempRow}>
              <View style={mStyles.dailyTempBlock}>
                <MaterialCommunityIcons name="weather-sunny" size={20} color={theme.primary} />
                <Text style={[mStyles.dailyTempLabel, { color: theme.textTertiary }]}>
                  {mr ? 'दिवस' : 'Day'}
                </Text>
                <Text style={[mStyles.bigTemp, { color: theme.textPrimary }]}>
                  {Math.round(current.Temperature.Maximum.Value)}°C
                </Text>
                <Text style={[mStyles.conditionSmall, { color: theme.textSecondary }]} numberOfLines={2}>
                  {current.Day?.IconPhrase}
                </Text>
              </View>
              <View style={[mStyles.tempDivider, { backgroundColor: theme.surfaceBorder }]} />
              <View style={mStyles.dailyTempBlock}>
                <MaterialCommunityIcons name="weather-night" size={20} color={theme.accentBlue} />
                <Text style={[mStyles.dailyTempLabel, { color: theme.textTertiary }]}>
                  {mr ? 'रात्र' : 'Night'}
                </Text>
                <Text style={[mStyles.bigTemp, { color: theme.accentBlue }]}>
                  {Math.round(current.Temperature.Minimum.Value)}°C
                </Text>
                <Text style={[mStyles.conditionSmall, { color: theme.textSecondary }]} numberOfLines={2}>
                  {current.Night?.IconPhrase}
                </Text>
              </View>
            </View>
          </View>

          {/* Day selector strip */}
          <View style={[mStyles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
            <Text style={[mStyles.sectionTitle, { color: theme.textTertiary }]}>
              {mr ? 'दिवस निवडा' : 'Select Day'}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
              {allDaily.map((d, i) => {
                const isActive = i === currentIdx;
                const dayLabel = i === 0
                  ? (mr ? 'आज' : 'Today')
                  : new Date(d.Date).toLocaleDateString(mr ? 'mr-IN' : 'en-IN', { weekday: 'short', day: 'numeric' });
                const maxRain = Math.max(d.Day?.RainProbability ?? 0, d.Night?.RainProbability ?? 0);
                return (
                  <Pressable
                    key={`day_${i}`}
                    onPress={() => setCurrentIdx(i)}
                    style={[
                      mStyles.dayChip,
                      {
                        backgroundColor: isActive ? theme.primary : theme.surfaceElevated,
                        borderColor: isActive ? theme.primary : theme.surfaceBorder,
                      },
                    ]}
                  >
                    <Text style={[mStyles.dayChipLabel, { color: isActive ? '#000' : theme.textSecondary }]}>
                      {dayLabel}
                    </Text>
                    <MaterialCommunityIcons
                      name={getWeatherIconName(d.Day?.Icon ?? 1, true) as any}
                      size={18}
                      color={isActive ? '#000' : theme.textSecondary}
                    />
                    <Text style={[mStyles.dayChipTemp, { color: isActive ? '#000' : theme.textPrimary }]}>
                      {Math.round(d.Temperature.Maximum.Value)}° / {Math.round(d.Temperature.Minimum.Value)}°
                    </Text>
                    {maxRain > 20 ? (
                      <Text style={[mStyles.dayChipRain, { color: isActive ? '#000' : getRainColor(maxRain) }]}>
                        {maxRain}%
                      </Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Temperature trend (max + min lines) */}
          <View style={[mStyles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
            <View style={mStyles.sectionTitleRow}>
              <Text style={[mStyles.sectionTitle, { color: theme.textTertiary }]}>
                {mr ? 'तापमान श्रेणी' : 'Temperature Range'}
              </Text>
              <View style={mStyles.legendRow}>
                <View style={[mStyles.legendDot, { backgroundColor: theme.primary }]} />
                <Text style={[mStyles.legendText, { color: theme.textTertiary }]}>{mr ? 'कमाल' : 'Max'}</Text>
                <View style={[mStyles.legendDot, { backgroundColor: theme.accentBlue }]} />
                <Text style={[mStyles.legendText, { color: theme.textTertiary }]}>{mr ? 'किमान' : 'Min'}</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TemperatureLineChart
                data={tempData}
                width={Math.max(chartW, allDaily.length * 50)}
                height={150}
                color={theme.primary}
                secondaryColor={theme.accentBlue}
                secondaryLabel={mr ? 'किमान' : 'Min'}
              />
            </ScrollView>
          </View>

          {/* Rain probability bars */}
          {rainBars.some((b) => b.value > 0) ? (
            <View style={[mStyles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
              <Text style={[mStyles.sectionTitle, { color: theme.textTertiary }]}>
                {mr ? 'पाऊस संभावना (जास्तीत जास्त)' : 'Rain Probability (Max)'}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <ProbBarChart
                  data={rainBars}
                  width={Math.max(chartW, allDaily.length * 36)}
                  height={90}
                  color={theme.accentBlue}
                />
              </ScrollView>
            </View>
          ) : null}

          {/* Day / Night breakdown */}
          <View style={[mStyles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
            <Text style={[mStyles.sectionTitle, { color: theme.textTertiary }]}>
              {mr ? 'दिवस / रात्र तपशील' : 'Day / Night Breakdown'}
            </Text>

            {/* Day */}
            <View style={[mStyles.dnBlock, { backgroundColor: theme.surfaceElevated, borderColor: theme.primary + '30' }]}>
              <View style={mStyles.dnHeader}>
                <MaterialCommunityIcons name="weather-sunny" size={18} color={theme.primary} />
                <Text style={[mStyles.dnTitle, { color: theme.primary }]}>{mr ? 'दिवसाचा अंदाज' : 'Day Forecast'}</Text>
              </View>
              <View style={mStyles.metricsGrid}>
                <View style={[mStyles.metricBlock, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
                  <MaterialCommunityIcons name="water" size={20} color={getRainColor(dayRain)} />
                  <Text style={[mStyles.metricBlockVal, { color: getRainColor(dayRain) }]}>{dayRain}%</Text>
                  <Text style={[mStyles.metricBlockLabel, { color: theme.textTertiary }]}>{mr ? 'पाऊस' : 'Rain'}</Text>
                </View>
                <View style={[mStyles.metricBlock, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
                  <MaterialCommunityIcons name="lightning-bolt" size={20} color={theme.alertYellow} />
                  <Text style={[mStyles.metricBlockVal, { color: dayThunder > 50 ? theme.alertOrange : theme.textPrimary }]}>{dayThunder}%</Text>
                  <Text style={[mStyles.metricBlockLabel, { color: theme.textTertiary }]}>{mr ? 'वादळ' : 'Thunder'}</Text>
                </View>
                <View style={[mStyles.metricBlock, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
                  <MaterialCommunityIcons name={iconName as any} size={20} color={theme.textSecondary} />
                  <Text style={[mStyles.metricBlockVal, { color: theme.textPrimary }]} numberOfLines={2} style={[mStyles.metricBlockVal, { color: theme.textPrimary, fontSize: 11 }]}>
                    {current.Day?.IconPhrase}
                  </Text>
                  <Text style={[mStyles.metricBlockLabel, { color: theme.textTertiary }]}>{mr ? 'स्थिती' : 'Condition'}</Text>
                </View>
                {(current.Day?.TotalLiquid?.Value ?? 0) > 0 ? (
                  <View style={[mStyles.metricBlock, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
                    <MaterialCommunityIcons name="cup-water" size={20} color={theme.accentBlue} />
                    <Text style={[mStyles.metricBlockVal, { color: theme.accentBlue }]}>
                      {current.Day.TotalLiquid!.Value.toFixed(1)} mm
                    </Text>
                    <Text style={[mStyles.metricBlockLabel, { color: theme.textTertiary }]}>{mr ? 'एकूण पाऊस' : 'Total Rain'}</Text>
                  </View>
                ) : null}
              </View>
              {current.Day?.HasPrecipitation ? (
                <View style={[mStyles.precipBadge, { backgroundColor: theme.accentBlue + '15', borderColor: theme.accentBlue + '40' }]}>
                  <MaterialCommunityIcons name="weather-rainy" size={13} color={theme.accentBlue} />
                  <Text style={[mStyles.precipText, { color: theme.accentBlue }]}>
                    {current.Day.PrecipitationType ?? (mr ? 'पर्जन्य अपेक्षित' : 'Precipitation expected')}
                    {current.Day.PrecipitationIntensity ? ` — ${current.Day.PrecipitationIntensity}` : ''}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Night */}
            <View style={[mStyles.dnBlock, { backgroundColor: theme.surfaceElevated, borderColor: theme.accentBlue + '30', marginTop: 10 }]}>
              <View style={mStyles.dnHeader}>
                <MaterialCommunityIcons name="weather-night" size={18} color={theme.accentBlue} />
                <Text style={[mStyles.dnTitle, { color: theme.accentBlue }]}>{mr ? 'रात्रीचा अंदाज' : 'Night Forecast'}</Text>
              </View>
              <View style={mStyles.metricsGrid}>
                <View style={[mStyles.metricBlock, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
                  <MaterialCommunityIcons name="water" size={20} color={getRainColor(nightRain)} />
                  <Text style={[mStyles.metricBlockVal, { color: getRainColor(nightRain) }]}>{nightRain}%</Text>
                  <Text style={[mStyles.metricBlockLabel, { color: theme.textTertiary }]}>{mr ? 'पाऊस' : 'Rain'}</Text>
                </View>
                <View style={[mStyles.metricBlock, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
                  <MaterialCommunityIcons name="lightning-bolt" size={20} color={theme.alertYellow} />
                  <Text style={[mStyles.metricBlockVal, { color: nightThunder > 50 ? theme.alertOrange : theme.textPrimary }]}>{nightThunder}%</Text>
                  <Text style={[mStyles.metricBlockLabel, { color: theme.textTertiary }]}>{mr ? 'वादळ' : 'Thunder'}</Text>
                </View>
                <View style={[mStyles.metricBlock, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
                  <MaterialCommunityIcons name={nightIcon as any} size={20} color={theme.textSecondary} />
                  <Text numberOfLines={2} style={[mStyles.metricBlockVal, { color: theme.textPrimary, fontSize: 11 }]}>
                    {current.Night?.IconPhrase}
                  </Text>
                  <Text style={[mStyles.metricBlockLabel, { color: theme.textTertiary }]}>{mr ? 'स्थिती' : 'Condition'}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Sun/Moon times */}
          {(current.Sun || current.Moon) ? (
            <View style={[mStyles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
              <Text style={[mStyles.sectionTitle, { color: theme.textTertiary }]}>
                {mr ? 'सूर्य व चंद्र' : 'Sun & Moon'}
              </Text>
              <View style={mStyles.sunMoonGrid}>
                {current.Sun?.Rise ? (
                  <View style={[mStyles.sunMoonItem, { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder }]}>
                    <MaterialIcons name="wb-sunny" size={22} color={theme.primary} />
                    <Text style={[mStyles.sunMoonLabel, { color: theme.textTertiary }]}>{mr ? 'सूर्योदय' : 'Sunrise'}</Text>
                    <Text style={[mStyles.sunMoonTime, { color: theme.textPrimary }]}>{formatTime(current.Sun.Rise)}</Text>
                  </View>
                ) : null}
                {current.Sun?.Set ? (
                  <View style={[mStyles.sunMoonItem, { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder }]}>
                    <MaterialIcons name="nights-stay" size={22} color={theme.alertOrange} />
                    <Text style={[mStyles.sunMoonLabel, { color: theme.textTertiary }]}>{mr ? 'सूर्यास्त' : 'Sunset'}</Text>
                    <Text style={[mStyles.sunMoonTime, { color: theme.textPrimary }]}>{formatTime(current.Sun.Set)}</Text>
                  </View>
                ) : null}
                {current.Moon?.Rise ? (
                  <View style={[mStyles.sunMoonItem, { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder }]}>
                    <MaterialCommunityIcons name="moon-waxing-crescent" size={22} color={theme.accentCyan} />
                    <Text style={[mStyles.sunMoonLabel, { color: theme.textTertiary }]}>{mr ? 'चंद्रोदय' : 'Moonrise'}</Text>
                    <Text style={[mStyles.sunMoonTime, { color: theme.textPrimary }]}>{formatTime(current.Moon.Rise)}</Text>
                  </View>
                ) : null}
                {current.Moon?.Set ? (
                  <View style={[mStyles.sunMoonItem, { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder }]}>
                    <MaterialCommunityIcons name="moon-waning-crescent" size={22} color={theme.textSecondary} />
                    <Text style={[mStyles.sunMoonLabel, { color: theme.textTertiary }]}>{mr ? 'चंद्रास्त' : 'Moonset'}</Text>
                    <Text style={[mStyles.sunMoonTime, { color: theme.textPrimary }]}>{formatTime(current.Moon.Set)}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          ) : null}

          {/* RealFeel */}
          {current.RealFeelTemperature ? (
            <View style={[mStyles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
              <Text style={[mStyles.sectionTitle, { color: theme.textTertiary }]}>
                {mr ? 'जाणवणारे तापमान' : 'RealFeel Temperature'}
              </Text>
              <View style={mStyles.metricsGrid}>
                <View style={[mStyles.metricBlock, { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder }]}>
                  <MaterialCommunityIcons name="thermometer-high" size={22} color={theme.alertOrange} />
                  <Text style={[mStyles.metricBlockVal, { color: theme.textPrimary }]}>
                    {Math.round(current.RealFeelTemperature.Maximum.Value)}°C
                  </Text>
                  <Text style={[mStyles.metricBlockLabel, { color: theme.textTertiary }]}>{mr ? 'कमाल जाणवते' : 'Max Feels Like'}</Text>
                </View>
                <View style={[mStyles.metricBlock, { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder }]}>
                  <MaterialCommunityIcons name="thermometer-low" size={22} color={theme.accentCyan} />
                  <Text style={[mStyles.metricBlockVal, { color: theme.textPrimary }]}>
                    {Math.round(current.RealFeelTemperature.Minimum.Value)}°C
                  </Text>
                  <Text style={[mStyles.metricBlockLabel, { color: theme.textTertiary }]}>{mr ? 'किमान जाणवते' : 'Min Feels Like'}</Text>
                </View>
              </View>
            </View>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Hourly Card ───────────────────────────────────────────────────────────────
function HourlyItem({ item, index, onPress }: { item: HourlyForecast; index: number; onPress: () => void }) {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const time = new Date(item.DateTime);
  const hour = time.toLocaleTimeString(language === 'mr' ? 'mr-IN' : 'en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
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
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.hourlyItem,
        {
          backgroundColor: theme.surfaceElevated,
          borderColor: theme.surfaceBorder,
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
      ]}
    >
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
      <View style={[styles.tapIndicator, { backgroundColor: theme.primary + '20' }]}>
        <MaterialIcons name="expand-more" size={12} color={theme.primary} />
      </View>
    </Pressable>
  );
}

// ─── Daily Card ────────────────────────────────────────────────────────────────
function DailyItem({ item, index, onPress }: { item: DailyForecast; index: number; onPress: () => void }) {
  const { theme } = useTheme();
  const { language } = useLanguage();

  const date = new Date(item.Date);
  const isToday = index === 0;
  const dayName = isToday
    ? (language === 'mr' ? 'आज' : 'Today')
    : date.toLocaleDateString(language === 'mr' ? 'mr-IN' : 'en-IN', {
        weekday: 'short', month: 'short', day: 'numeric',
      });

  const dayRain = item.Day?.RainProbability ?? 0;
  const nightRain = item.Night?.RainProbability ?? 0;
  const maxRain = Math.max(dayRain, nightRain);
  const maxThunder = Math.max(item.Day?.ThunderstormProbability ?? 0, item.Night?.ThunderstormProbability ?? 0);
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
          opacity: pressed ? 0.88 : 1,
        },
      ]}
      onPress={onPress}
    >
      <View style={styles.dailyMain}>
        <View style={styles.dailyDate}>
          <Text style={[styles.dailyDayName, { color: isToday ? theme.primary : theme.textPrimary }]}>
            {dayName}
          </Text>
        </View>

        <MaterialCommunityIcons name={iconName as any} size={26} color={isToday ? theme.primary : theme.textSecondary} />

        <Text style={[styles.dailyCondition, { color: theme.textSecondary }]} numberOfLines={1}>
          {item.Day?.IconPhrase ?? ''}
        </Text>

        <View style={styles.tempRange}>
          <Text style={[styles.tempHigh, { color: theme.textPrimary }]}>
            {Math.round(item.Temperature.Maximum.Value)}°
          </Text>
          <Text style={[styles.tempLow, { color: theme.textTertiary }]}>
            {Math.round(item.Temperature.Minimum.Value)}°
          </Text>
        </View>

        {maxRain > 0 ? (
          <View style={styles.probMini}>
            <MaterialCommunityIcons name="water" size={12} color={getRainColor(maxRain)} />
            <Text style={[styles.probMiniText, { color: getRainColor(maxRain) }]}>{maxRain}%</Text>
          </View>
        ) : null}

        {maxThunder > 40 ? (
          <MaterialCommunityIcons name="lightning-bolt" size={14} color={theme.alertYellow} />
        ) : null}

        <MaterialIcons name="chevron-right" size={16} color={theme.textTertiary} />
      </View>
    </Pressable>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function ForecastScreen() {
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  const { hourlyForecast, dailyForecast, loading, refreshing, error, refresh } = useWeather();
  const [activeTab, setActiveTab] = useState<'hourly' | 'daily'>('hourly');
  const [selectedHourly, setSelectedHourly] = useState<{ item: HourlyForecast; index: number } | null>(null);
  const [selectedDaily, setSelectedDaily] = useState<{ item: DailyForecast; index: number } | null>(null);

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
            style={[styles.tabBtn, activeTab === tab && { backgroundColor: theme.primary }]}
            onPress={() => setActiveTab(tab)}
          >
            <MaterialIcons
              name={tab === 'hourly' ? 'access-time' : 'calendar-today'}
              size={16}
              color={activeTab === tab ? '#000' : theme.textSecondary}
            />
            <Text style={[styles.tabLabel, { color: activeTab === tab ? '#000' : theme.textSecondary }, activeTab === tab && { fontWeight: '700' }]}>
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.primary} />}
        >
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionLabel, { color: theme.textTertiary }]}>
              {t.hourlyForecast} ({hourlyForecast.length}h)
            </Text>
            <Text style={[styles.tapHint, { color: theme.textTertiary }]}>
              {language === 'mr' ? '↑ तपशीलासाठी टॅप करा' : '↑ Tap for details'}
            </Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hourlyRow}>
            {hourlyForecast.map((item, i) => (
              <HourlyItem
                key={`hourly_${i}`}
                item={item}
                index={i}
                onPress={() => setSelectedHourly({ item, index: i })}
              />
            ))}
          </ScrollView>

          {/* Inline temperature line chart */}
          <View style={[styles.inlineChartCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder }]}>
            <Text style={[styles.sectionLabel, { color: theme.textTertiary, marginBottom: 8 }]}>
              {t.temperature} {language === 'mr' ? 'प्रवाह' : 'Trend'}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TemperatureLineChart
                data={hourlyForecast.map((h) => ({
                  label: `${new Date(h.DateTime).getHours()}h`,
                  value: h.Temperature.Value,
                }))}
                width={Math.max(SCREEN_W - 48, hourlyForecast.length * 42)}
                height={130}
                color={theme.primary}
              />
            </ScrollView>
          </View>

          {/* Rain probability chart */}
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

          {/* Thunderstorm chart */}
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
          renderItem={({ item, index }) => (
            <DailyItem
              item={item}
              index={index}
              onPress={() => setSelectedDaily({ item, index })}
            />
          )}
          contentContainerStyle={styles.dailyList}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.primary} />}
          ListHeaderComponent={
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionLabel, { color: theme.textTertiary, marginBottom: 12 }]}>
                {t.dailyForecast} ({dailyForecast?.DailyForecasts?.length ?? 0} {language === 'mr' ? 'दिवस' : 'days'})
              </Text>
              <Text style={[styles.tapHint, { color: theme.textTertiary }]}>
                {language === 'mr' ? '↑ तपशीलासाठी टॅप करा' : '↑ Tap for details'}
              </Text>
            </View>
          }
          ListEmptyComponent={
            <Text style={[styles.empty, { color: theme.textTertiary }]}>{t.loading}</Text>
          }
        />
      )}

      {/* Hourly Detail Modal */}
      {selectedHourly ? (
        <HourlyDetailModal
          visible={true}
          item={selectedHourly.item}
          allHourly={hourlyForecast}
          index={selectedHourly.index}
          language={language}
          onClose={() => setSelectedHourly(null)}
        />
      ) : null}

      {/* Daily Detail Modal */}
      {selectedDaily && dailyForecast ? (
        <DailyDetailModal
          visible={true}
          item={selectedDaily.item}
          allDaily={dailyForecast.DailyForecasts}
          index={selectedDaily.index}
          language={language}
          onClose={() => setSelectedDaily(null)}
        />
      ) : null}
    </View>
  );
}

// ─── Modal Styles ──────────────────────────────────────────────────────────────
const mStyles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerSub: { fontSize: 12, marginTop: 2 },
  scroll: { padding: 16, gap: 14 },

  tempCard: { borderRadius: 16, borderWidth: 1, padding: 16 },
  tempMain: { alignItems: 'center', marginBottom: 14 },
  bigTemp: { fontSize: 52, fontWeight: '800', lineHeight: 60 },
  condition: { fontSize: 16, marginTop: 4 },
  conditionSmall: { fontSize: 12, lineHeight: 18, textAlign: 'center' },
  tempMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  probBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1,
  },
  probBadgeText: { fontSize: 12, fontWeight: '700' },

  sectionCard: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10 },

  hourChip: {
    alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8,
    borderRadius: 12, borderWidth: 1, minWidth: 52,
  },
  hourChipTime: { fontSize: 10, fontWeight: '600', marginBottom: 2 },
  hourChipTemp: { fontSize: 14, fontWeight: '700' },
  hourChipRain: { fontSize: 9, marginTop: 2 },

  dayChip: {
    alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 12, borderWidth: 1, minWidth: 80, gap: 3,
  },
  dayChipLabel: { fontSize: 10, fontWeight: '600' },
  dayChipTemp: { fontSize: 12, fontWeight: '700' },
  dayChipRain: { fontSize: 9 },

  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricBlock: {
    flex: 1, minWidth: '43%', alignItems: 'center',
    padding: 12, borderRadius: 12, borderWidth: 1, gap: 5,
  },
  metricBlockVal: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  metricBlockLabel: { fontSize: 10, textAlign: 'center' },

  detailRows: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, gap: 10 },
  metricRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  metricIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  metricLabel: { width: 100, fontSize: 12 },
  metricValue: { flex: 1, fontSize: 14, fontWeight: '600', textAlign: 'right' },
  metricUnit: { fontSize: 11 },

  awmdCard: { borderRadius: 12, borderWidth: 1, padding: 12 },
  awmdRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  awmdText: { flex: 1, fontSize: 12, lineHeight: 18 },

  // Daily specific
  dailyTempRow: { flexDirection: 'row', alignItems: 'stretch' },
  dailyTempBlock: { flex: 1, alignItems: 'center', padding: 12, gap: 4 },
  dailyTempLabel: { fontSize: 11, fontWeight: '600' },
  tempDivider: { width: 1, marginVertical: 8 },

  dnBlock: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 12 },
  dnHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dnTitle: { fontSize: 13, fontWeight: '700' },

  precipBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    padding: 8, borderRadius: 8, borderWidth: 1,
  },
  precipText: { flex: 1, fontSize: 12 },

  sunMoonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  sunMoonItem: {
    flex: 1, minWidth: '43%', alignItems: 'center',
    padding: 12, borderRadius: 12, borderWidth: 1, gap: 5,
  },
  sunMoonLabel: { fontSize: 10 },
  sunMoonTime: { fontSize: 16, fontWeight: '700' },
});

// ─── Screen Styles ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  tabBar: {
    flexDirection: 'row', margin: 16,
    borderRadius: 12, borderWidth: 1, padding: 4, gap: 4,
  },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingVertical: 10, borderRadius: 8, gap: 6,
  },
  tabLabel: { fontSize: 14, fontWeight: '500' },
  headline: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    marginHorizontal: 16, marginBottom: 12, padding: 12, borderRadius: 10, borderWidth: 1,
  },
  headlineText: { flex: 1, fontSize: 13, lineHeight: 20 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginLeft: 4 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  tapHint: { fontSize: 10, fontStyle: 'italic', marginRight: 4 },

  hourlyScroll: { paddingHorizontal: 16 },
  hourlyRow: { marginTop: 10 },
  hourlyItem: {
    alignItems: 'center', padding: 12, borderRadius: 14, borderWidth: 1,
    marginRight: 10, minWidth: 70, gap: 6,
  },
  hourlyTime: { fontSize: 11, fontWeight: '600' },
  hourlyTemp: { fontSize: 18, fontWeight: '700' },
  hourlyProbs: { gap: 3, alignItems: 'center' },
  probRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  probText: { fontSize: 10, fontWeight: '600' },
  tapIndicator: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 2 },

  inlineChartCard: { borderRadius: 14, borderWidth: 1, padding: 12, marginTop: 16 },

  probChart: {
    flexDirection: 'row', alignItems: 'flex-end', padding: 12,
    borderRadius: 14, borderWidth: 1, marginTop: 10, height: 120, gap: 4,
  },
  barWrapper: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: 2 },
  barLabel: { fontSize: 8, marginBottom: 2 },
  barTrack: { width: '100%', height: 80, justifyContent: 'flex-end', alignItems: 'center' },
  bar: { width: '70%', borderRadius: 3, minHeight: 4 },
  barTime: { fontSize: 8, marginTop: 2 },

  dailyList: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 24 },
  dailyItem: { borderRadius: 14, borderWidth: 1, marginBottom: 10, overflow: 'hidden' },
  dailyMain: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  dailyDate: { width: 80 },
  dailyDayName: { fontSize: 13, fontWeight: '600' },
  dailyCondition: { flex: 1, fontSize: 12 },
  tempRange: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  tempHigh: { fontSize: 16, fontWeight: '700' },
  tempLow: { fontSize: 14 },
  probMini: { flexDirection: 'row', alignItems: 'center', gap: 3, width: 40 },
  probMiniText: { fontSize: 11, fontWeight: '600' },
  empty: { textAlign: 'center', marginTop: 40 },
});
