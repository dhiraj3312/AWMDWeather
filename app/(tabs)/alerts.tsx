import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  Modal,
  Platform,
  FlatList,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWeather } from '@/contexts/WeatherContext';
import Header from '@/components/layout/Header';
import AlertCard from '@/components/feature/AlertCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { WeatherAlert } from '@/services/accuweather';
import { AlertLevel } from '@/services/alertEngine';

// ─── Filter Button ────────────────────────────────────────────────────────────
interface AlertFilterBtnProps {
  label: string;
  level: AlertLevel | 'all';
  active: boolean;
  count: number;
  onPress: () => void;
}

function AlertFilterBtn({ label, level, active, count, onPress }: AlertFilterBtnProps) {
  const { theme } = useTheme();
  const getColor = () => {
    switch (level) {
      case 'red':    return theme.alertRed;
      case 'orange': return theme.alertOrange;
      case 'yellow': return theme.alertYellow;
      case 'green':  return theme.alertGreen;
      default:       return theme.textSecondary;
    }
  };
  const color = getColor();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.filterBtn,
        {
          backgroundColor: active ? color + '25' : theme.surfaceElevated,
          borderColor: active ? color : theme.surfaceBorder,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      {level !== 'all' ? <View style={[styles.filterDot, { backgroundColor: color }]} /> : null}
      <Text style={[styles.filterLabel, { color: active ? color : theme.textSecondary }]}>{label}</Text>
      {count > 0 ? (
        <View style={[styles.filterBadge, { backgroundColor: active ? color : theme.surfaceBorder }]}>
          <Text style={[styles.filterBadgeText, { color: active ? '#000' : theme.textTertiary }]}>{count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

// ─── Resolve alert level from AccuWeather data ────────────────────────────────
function resolveAlertLevel(alert: WeatherAlert): AlertLevel {
  const haystack = [
    alert.Category, alert.Type, alert.TypeID,
    alert.Description?.English, alert.Description?.Localized,
    ...(alert.Area?.map((a) => a.Text) ?? []),
  ].filter(Boolean).join(' ').toLowerCase();

  if (/red/.test(haystack) || /लाल/.test(haystack)) return 'red';
  if (/orange/.test(haystack) || /नारिंगी/.test(haystack)) return 'orange';
  if (/yellow/.test(haystack) || /पिवळ/.test(haystack)) return 'yellow';
  if (/green/.test(haystack) || /हिरव/.test(haystack)) return 'green';

  if (alert.Priority <= 2) return 'red';
  if (alert.Priority <= 4) return 'orange';
  if (alert.Priority <= 6) return 'yellow';
  return 'green';
}

// ─── Safety Guidance ─────────────────────────────────────────────────────────
function getSafetyGuidance(category: string, type: string, level: AlertLevel, language: string): string[] {
  const cat = (category || type || '').toLowerCase();
  const mr = language === 'mr';
  if (cat.includes('thunder') || cat.includes('lightning') || cat.includes('storm')) {
    return mr
      ? ['घरात राहा, खिडक्या बंद ठेवा', 'विद्युत उपकरणे अनप्लग करा', 'झाडांपासून दूर राहा', 'धातूच्या वस्तू टाळा']
      : ['Stay indoors, close windows', 'Unplug electrical appliances', 'Stay away from trees', 'Avoid metallic objects'];
  }
  if (cat.includes('flood') || cat.includes('rain') || cat.includes('water')) {
    return mr
      ? ['पुरग्रस्त भागात जाऊ नका', 'वाहनांमध्ये राहू नका', 'उंच ठिकाणी जा', 'प्रशासनाच्या सूचना पाळा']
      : ['Do not enter flooded areas', 'Do not stay in vehicles', 'Move to higher ground', 'Follow official instructions'];
  }
  if (cat.includes('wind') || cat.includes('cyclone') || cat.includes('tornado')) {
    return mr
      ? ['मजबूत इमारतीत राहा', 'सैल वस्तू आत ठेवा', 'झाडांखाली जाऊ नका', 'खिडक्यांपासून दूर राहा']
      : ['Stay in a sturdy building', 'Bring loose objects indoors', 'Do not stand under trees', 'Stay away from windows'];
  }
  if (level === 'red') {
    return mr
      ? ['हे अत्यंत धोकादायक आहे', 'घराबाहेर पडू नका', 'आपत्कालीन सेवा: 112', 'NDRF: 1070']
      : ['This is extremely dangerous', 'Do not go outside', 'Emergency services: 112', 'NDRF: 1070'];
  }
  if (level === 'orange') {
    return mr
      ? ['सावधगिरी बाळगा', 'अनावश्यक प्रवास टाळा', 'सरकारी सूचना पाळा', 'पाणी साठवा']
      : ['Exercise caution', 'Avoid unnecessary travel', 'Follow government advisories', 'Store water'];
  }
  return mr
    ? ['परिस्थितीवर लक्ष ठेवा', 'अद्यतन बातम्या पाहा', 'तयारी ठेवा']
    : ['Monitor the situation', 'Watch for updates', 'Stay prepared'];
}

// ─── Official Alert Detail Modal ──────────────────────────────────────────────
function OfficialAlertModal({ alert, visible, language, onClose }: {
  alert: WeatherAlert; visible: boolean; language: string; onClose: () => void;
}) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const level = resolveAlertLevel(alert);

  const levelColors: Record<AlertLevel, { bg: string; border: string; text: string; badge: string }> = {
    red:    { bg: theme.alertRedBg,    border: theme.alertRed,    text: theme.alertRed,    badge: '#FF1744' },
    orange: { bg: theme.alertOrangeBg, border: theme.alertOrange, text: theme.alertOrange, badge: '#FF6D00' },
    yellow: { bg: theme.alertYellowBg, border: theme.alertYellow, text: theme.alertYellow, badge: '#FFD600' },
    green:  { bg: theme.alertGreenBg,  border: theme.alertGreen,  text: theme.alertGreen,  badge: '#00C853' },
  };
  const C = levelColors[level];

  const levelLabel: Record<AlertLevel, { en: string; mr: string }> = {
    red:    { en: 'RED ALERT',    mr: 'लाल इशारा' },
    orange: { en: 'ORANGE ALERT', mr: 'नारिंगी इशारा' },
    yellow: { en: 'YELLOW ALERT', mr: 'पिवळा इशारा' },
    green:  { en: 'GREEN STATUS', mr: 'हिरवी स्थिती' },
  };
  const levelIcon: Record<AlertLevel, string> = {
    red: 'error', orange: 'warning', yellow: 'warning-amber', green: 'check-circle',
  };

  const title = language === 'mr'
    ? (alert.Description?.Localized || alert.Type)
    : (alert.Description?.English || alert.Type);

  const formatDT = (dt?: string) => {
    if (!dt) return language === 'mr' ? 'अनुपलब्ध' : 'N/A';
    return new Date(dt).toLocaleString(language === 'mr' ? 'mr-IN' : 'en-IN', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose} statusBarTranslucent>
      <View style={[modalStyles.root, {
        backgroundColor: theme.background,
        paddingTop: Platform.OS === 'android' ? 28 : insets.top,
      }]}>
        {/* Header */}
        <View style={[modalStyles.header, { backgroundColor: C.bg, borderBottomColor: C.border + '50' }]}>
          <Pressable onPress={onClose} hitSlop={12} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
            <MaterialIcons name="arrow-back" size={24} color={C.text} />
          </Pressable>
          <View style={{ flex: 1, gap: 5 }}>
            <View style={[modalStyles.levelBadge, { backgroundColor: C.badge + '20', borderColor: C.border }]}>
              <MaterialIcons name={levelIcon[level] as any} size={13} color={C.text} />
              <Text style={[modalStyles.levelBadgeText, { color: C.text }]}>
                {language === 'mr' ? levelLabel[level].mr : levelLabel[level].en}
              </Text>
            </View>
            <Text style={[modalStyles.headerTitle, { color: C.text }]} numberOfLines={2}>{title}</Text>
          </View>
          <View style={[modalStyles.priorityBadge, { backgroundColor: C.badge + '25', borderColor: C.border + '60' }]}>
            <Text style={[modalStyles.priorityText, { color: C.text }]}>P{alert.Priority}</Text>
          </View>
        </View>

        {/* Scrollable content — this is the key fix: use ScrollView inside Modal correctly */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[modalStyles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
          bounces={true}
          alwaysBounceVertical={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Meta */}
          <View style={[modalStyles.metaCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder }]}>
            <Text style={[modalStyles.metaCardTitle, { color: theme.textTertiary }]}>
              {language === 'mr' ? 'इशारा माहिती' : 'Alert Information'}
            </Text>
            {[
              { icon: 'category', label: language === 'mr' ? 'श्रेणी' : 'Category', val: alert.Category || 'N/A' },
              { icon: 'label', label: language === 'mr' ? 'प्रकार' : 'Type', val: alert.Type },
              { icon: 'source', label: language === 'mr' ? 'स्रोत' : 'Source', val: alert.Source },
              { icon: 'priority-high', label: language === 'mr' ? 'प्राधान्य' : 'Priority', val: `${alert.Priority} / 7`, valColor: C.text },
            ].map((row, i) => (
              <View key={i} style={modalStyles.metaRow}>
                <MaterialIcons name={row.icon as any} size={14} color={theme.textTertiary} style={{ marginTop: 1 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[modalStyles.metaLabel, { color: theme.textTertiary }]}>{row.label}</Text>
                  <Text style={[modalStyles.metaVal, { color: row.valColor ?? theme.textPrimary }]}>{row.val}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Affected Areas */}
          {alert.Area?.length > 0 ? (
            <View style={{ gap: 10 }}>
              <View style={modalStyles.sectionRow}>
                <MaterialIcons name="place" size={16} color={theme.accentBlue} />
                <Text style={[modalStyles.sectionTitle, { color: theme.accentBlue }]}>
                  {language === 'mr' ? `प्रभावित क्षेत्रे (${alert.Area.length})` : `Affected Areas (${alert.Area.length})`}
                </Text>
              </View>
              {alert.Area.map((area, i) => (
                <View key={i} style={[modalStyles.areaCard, { backgroundColor: theme.surfaceElevated, borderColor: C.border + '40', borderLeftColor: C.border }]}>
                  {area.Name ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <MaterialIcons name="location-pin" size={14} color={C.text} />
                      <Text style={[{ fontSize: 15, fontWeight: '700' }, { color: theme.textPrimary }]}>{area.Name}</Text>
                    </View>
                  ) : null}
                  <View style={[modalStyles.timeBlock, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
                    <View style={modalStyles.timeRow}>
                      <MaterialIcons name="play-circle-outline" size={13} color={theme.alertGreen} />
                      <Text style={[{ fontSize: 11, fontWeight: '600', width: 50 }, { color: theme.textTertiary }]}>
                        {language === 'mr' ? 'प्रारंभ' : 'Start'}
                      </Text>
                      <Text style={[{ flex: 1, fontSize: 12, fontWeight: '500' }, { color: theme.textPrimary }]} numberOfLines={1}>
                        {formatDT(area.StartTime)}
                      </Text>
                    </View>
                    <View style={{ height: 1, backgroundColor: theme.surfaceBorder }} />
                    <View style={modalStyles.timeRow}>
                      <MaterialIcons name="stop-circle" size={13} color={theme.alertRed} />
                      <Text style={[{ fontSize: 11, fontWeight: '600', width: 50 }, { color: theme.textTertiary }]}>
                        {language === 'mr' ? 'समाप्ती' : 'End'}
                      </Text>
                      <Text style={[{ flex: 1, fontSize: 12, fontWeight: '500' }, { color: theme.textPrimary }]} numberOfLines={1}>
                        {formatDT(area.EndTime)}
                      </Text>
                    </View>
                  </View>
                  <View style={[modalStyles.alertTextBlock, { backgroundColor: C.bg, borderColor: C.border + '30' }]}>
                    <Text style={[{ fontSize: 11, fontWeight: '700', textTransform: 'uppercase' as const, letterSpacing: 0.5 }, { color: C.text }]}>
                      {language === 'mr' ? 'इशारा संदेश:' : 'Alert Message:'}
                    </Text>
                    <Text style={[{ fontSize: 14, lineHeight: 22 }, { color: theme.textPrimary }]}>
                      {area.Text || (language === 'mr' ? 'संदेश उपलब्ध नाही' : 'No message available')}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          {/* Safety Guidance */}
          <View style={[modalStyles.safetyCard, { backgroundColor: C.bg, borderColor: C.border + '50' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialIcons name="shield" size={18} color={C.text} />
              <Text style={[{ fontSize: 14, fontWeight: '700' }, { color: C.text }]}>
                {language === 'mr' ? 'सुरक्षा सूचना' : 'Safety Guidance'}
              </Text>
            </View>
            {getSafetyGuidance(alert.Category, alert.Type, level, language).map((tip, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                <View style={[{ width: 6, height: 6, borderRadius: 3, marginTop: 7, flexShrink: 0 }, { backgroundColor: C.text }]} />
                <Text style={[{ flex: 1, fontSize: 14, lineHeight: 21 }, { color: theme.textPrimary }]}>{tip}</Text>
              </View>
            ))}
          </View>

          {/* Source */}
          <View style={[modalStyles.sourceRow, { borderTopColor: theme.surfaceBorder }]}>
            <MaterialIcons name="verified" size={14} color={theme.accentBlue} />
            <Text style={[{ flex: 1, fontSize: 11, lineHeight: 17 }, { color: theme.textTertiary }]}>
              {language === 'mr'
                ? `स्रोत: AccuWeather अधिकृत | ID: ${alert.AlertID}`
                : `Source: AccuWeather Official Alert Service | ID: ${alert.AlertID}`}
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Official Alert Card (list item) ─────────────────────────────────────────
function OfficialAlertCard({ alert, language, onPress }: {
  alert: WeatherAlert; language: string; onPress: () => void;
}) {
  const { theme } = useTheme();
  const level = resolveAlertLevel(alert);

  const getColors = () => {
    switch (level) {
      case 'red':    return { bg: theme.alertRedBg,    border: theme.alertRed,    text: theme.alertRed };
      case 'orange': return { bg: theme.alertOrangeBg, border: theme.alertOrange, text: theme.alertOrange };
      case 'yellow': return { bg: theme.alertYellowBg, border: theme.alertYellow, text: theme.alertYellow };
      default:       return { bg: theme.alertGreenBg,  border: theme.alertGreen,  text: theme.alertGreen };
    }
  };
  const colors = getColors();
  const title = language === 'mr'
    ? (alert.Description?.Localized || alert.Type)
    : (alert.Description?.English || alert.Type);
  const levelIcon: Record<AlertLevel, string> = {
    red: 'error', orange: 'warning', yellow: 'warning-amber', green: 'check-circle',
  };
  const firstArea = alert.Area?.[0];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.officialCard,
        { backgroundColor: colors.bg, borderColor: colors.border + '40', borderLeftColor: colors.border, opacity: pressed ? 0.88 : 1 },
      ]}
    >
      <View style={styles.officialHeader}>
        <MaterialIcons name={levelIcon[level] as any} size={20} color={colors.text} />
        <Text style={[styles.officialTitle, { color: colors.text }]} numberOfLines={2}>{title}</Text>
        <View style={[styles.officialBadge, { backgroundColor: colors.border + '30', borderColor: colors.border }]}>
          <Text style={[styles.officialBadgeText, { color: colors.text }]}>
            {language === 'mr' ? 'अधिकृत' : 'Official'}
          </Text>
        </View>
        <MaterialIcons name="chevron-right" size={20} color={colors.text} />
      </View>
      <View style={styles.metaChips}>
        <View style={styles.metaChip}>
          <MaterialIcons name="category" size={11} color={colors.text} />
          <Text style={[styles.metaChipText, { color: colors.text }]}>{alert.Category || alert.Type}</Text>
        </View>
        <View style={styles.metaChip}>
          <MaterialIcons name="source" size={11} color={colors.text} />
          <Text style={[styles.metaChipText, { color: colors.text }]}>{alert.Source}</Text>
        </View>
        {alert.Area?.length > 0 ? (
          <View style={styles.metaChip}>
            <MaterialIcons name="place" size={11} color={colors.text} />
            <Text style={[styles.metaChipText, { color: colors.text }]}>
              {alert.Area.length} {language === 'mr' ? 'क्षेत्र' : 'areas'}
            </Text>
          </View>
        ) : null}
      </View>
      {firstArea?.StartTime ? (
        <Text style={[styles.alertTimePreview, { color: colors.text + 'CC' }]}>
          {language === 'mr' ? 'प्रारंभ: ' : 'From: '}
          {new Date(firstArea.StartTime).toLocaleString(language === 'mr' ? 'mr-IN' : 'en-IN', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
          })}
        </Text>
      ) : null}
      <Text style={[styles.tapHint, { color: colors.text + '70' }]}>
        {language === 'mr' ? '↓ संपूर्ण तपशील पाहण्यासाठी टॅप करा' : '↓ Tap to view full details'}
      </Text>
    </Pressable>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AlertsScreen() {
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  const { awmdAlerts, officialAlerts, loading, refreshing, error, refresh, lastUpdated } = useWeather();
  const [filterLevel, setFilterLevel] = useState<AlertLevel | 'all'>('all');
  const [selectedAlert, setSelectedAlert] = useState<WeatherAlert | null>(null);

  const filteredAWMD = filterLevel === 'all'
    ? awmdAlerts
    : awmdAlerts.filter((a) => a.level === filterLevel);

  const countByLevel = (level: AlertLevel) => awmdAlerts.filter((a) => a.level === level).length;

  const overallStatus: AlertLevel = (() => {
    if (awmdAlerts.some((a) => a.level === 'red' && a.type !== 'CLEAR')) return 'red';
    if (awmdAlerts.some((a) => a.level === 'orange')) return 'orange';
    if (awmdAlerts.some((a) => a.level === 'yellow')) return 'yellow';
    return 'green';
  })();

  const statusColors: Record<AlertLevel, string> = {
    red: theme.alertRed, orange: theme.alertOrange, yellow: theme.alertYellow, green: theme.alertGreen,
  };
  const statusBgs: Record<AlertLevel, string> = {
    red: theme.alertRedBg, orange: theme.alertOrangeBg, yellow: theme.alertYellowBg, green: theme.alertGreenBg,
  };
  const statusLabels: Record<AlertLevel, string> = {
    red: t.redAlert, orange: t.orangeAlert, yellow: t.yellowAlert, green: t.greenStatus,
  };
  const statusIcons: Record<AlertLevel, string> = {
    red: 'error', orange: 'warning', yellow: 'warning-amber', green: 'check-circle',
  };

  // Use FlatList to avoid nested scroll + scrolling issues with Modal
  const listData = [
    { key: 'status' },
    { key: 'filters' },
    { key: 'awmd_header' },
    ...filteredAWMD.map((a, i) => ({ key: `awmd_${i}`, alert: a })),
    { key: 'official_header' },
    ...officialAlerts.map((a, i) => ({ key: `official_${i}`, officialAlert: a })),
    { key: 'legend' },
  ];

  const renderItem = ({ item }: { item: any }) => {
    if (item.key === 'status') {
      return (
        <View style={[styles.statusBanner, { backgroundColor: statusBgs[overallStatus], borderColor: statusColors[overallStatus] }]}>
          <View style={[styles.statusIconCircle, { backgroundColor: statusColors[overallStatus] + '30' }]}>
            <MaterialIcons name={statusIcons[overallStatus] as any} size={32} color={statusColors[overallStatus]} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.statusLabel, { color: statusColors[overallStatus] }]}>
              {statusLabels[overallStatus].toUpperCase()}
            </Text>
            <Text style={[styles.statusSub, { color: theme.textSecondary }]}>
              {language === 'mr' ? 'AWMD हवामान स्थिती' : 'AWMD Weather Status'}
            </Text>
            {lastUpdated ? (
              <Text style={[styles.statusTime, { color: theme.textTertiary }]}>
                {t.lastUpdated}: {lastUpdated.toLocaleTimeString(language === 'mr' ? 'mr-IN' : 'en-IN', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            ) : null}
          </View>
        </View>
      );
    }

    if (item.key === 'filters') {
      return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
          <AlertFilterBtn label={language === 'mr' ? 'सर्व' : 'All'} level="all" active={filterLevel === 'all'} count={awmdAlerts.filter((a) => a.type !== 'CLEAR').length} onPress={() => setFilterLevel('all')} />
          <AlertFilterBtn label={t.redAlert}    level="red"    active={filterLevel === 'red'}    count={countByLevel('red')}    onPress={() => setFilterLevel('red')} />
          <AlertFilterBtn label={t.orangeAlert} level="orange" active={filterLevel === 'orange'} count={countByLevel('orange')} onPress={() => setFilterLevel('orange')} />
          <AlertFilterBtn label={t.yellowAlert} level="yellow" active={filterLevel === 'yellow'} count={countByLevel('yellow')} onPress={() => setFilterLevel('yellow')} />
          <AlertFilterBtn label={t.greenStatus} level="green"  active={filterLevel === 'green'}  count={countByLevel('green')}  onPress={() => setFilterLevel('green')} />
        </ScrollView>
      );
    }

    if (item.key === 'awmd_header') {
      return (
        <View style={styles.sectionHeaderBlock}>
          <View style={styles.sectionHeaderRow}>
            <MaterialCommunityIcons name="cpu-64-bit" size={16} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>{t.awmdAlertEngine}</Text>
          </View>
          <Text style={[styles.sectionSub, { color: theme.textTertiary }]}>
            {language === 'mr' ? 'थेट हवामान डेटावर आधारित स्वयंचलित इशारे' : 'Automatic alerts based on live weather data'}
          </Text>
          {loading && filteredAWMD.length === 0 ? (
            <View style={{ padding: 32, alignItems: 'center' }}>
              <LoadingSpinner message={t.loading} size="small" />
            </View>
          ) : filteredAWMD.length === 0 ? (
            <View style={[styles.noAlerts, { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder }]}>
              <MaterialIcons name="check-circle-outline" size={40} color={theme.alertGreen} />
              <Text style={[styles.noAlertsText, { color: theme.textPrimary }]}>{t.noAlerts}</Text>
            </View>
          ) : null}
        </View>
      );
    }

    if (item.alert) {
      return <AlertCard alert={item.alert} showAWMDBadge={true} />;
    }

    if (item.key === 'official_header') {
      return (
        <View style={styles.sectionHeaderBlock}>
          <View style={styles.sectionHeaderRow}>
            <MaterialIcons name="verified" size={16} color={theme.accentBlue} />
            <Text style={[styles.sectionTitle, { color: theme.accentBlue }]}>{t.officialAlerts}</Text>
            {officialAlerts.length > 0 ? (
              <View style={[styles.countPill, { backgroundColor: theme.accentBlue + '20', borderColor: theme.accentBlue + '40' }]}>
                <Text style={[styles.countPillText, { color: theme.accentBlue }]}>{officialAlerts.length}</Text>
              </View>
            ) : null}
          </View>
          <Text style={[styles.sectionSub, { color: theme.textTertiary }]}>
            {language === 'mr' ? 'AccuWeather अधिकृत इशारे · तपशीलासाठी टॅप करा' : 'AccuWeather Official Alerts · Tap for details'}
          </Text>
          {officialAlerts.length === 0 ? (
            <View style={[styles.noAlerts, { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder }]}>
              <MaterialIcons name="verified-user" size={36} color={theme.alertGreen} />
              <Text style={[styles.noAlertsText, { color: theme.textPrimary }]}>
                {language === 'mr' ? 'कोणतेही अधिकृत इशारे नाहीत' : 'No official alerts issued'}
              </Text>
            </View>
          ) : null}
        </View>
      );
    }

    if (item.officialAlert) {
      return (
        <OfficialAlertCard
          alert={item.officialAlert}
          language={language}
          onPress={() => setSelectedAlert(item.officialAlert)}
        />
      );
    }

    if (item.key === 'legend') {
      return (
        <View style={[styles.legendCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder }]}>
          <Text style={[styles.legendTitle, { color: theme.textPrimary }]}>
            {language === 'mr' ? 'AWMD इशारा रंग मार्गदर्शिका' : 'AWMD Alert Color Guide'}
          </Text>
          {([
            { level: 'red' as AlertLevel, en: 'Red Alert — Extreme Danger', mr: 'लाल इशारा — अत्यंत धोकादायक', icon: 'error' },
            { level: 'orange' as AlertLevel, en: 'Orange Alert — High Risk', mr: 'नारिंगी इशारा — उच्च धोका', icon: 'warning' },
            { level: 'yellow' as AlertLevel, en: 'Yellow Alert — Caution', mr: 'पिवळा इशारा — सावधगिरी', icon: 'warning-amber' },
            { level: 'green' as AlertLevel, en: 'Green Status — All Clear', mr: 'हिरवी स्थिती — सुरक्षित', icon: 'check-circle' },
          ]).map((item) => (
            <View key={item.level} style={styles.legendRow}>
              <MaterialIcons name={item.icon as any} size={20} color={statusColors[item.level]} />
              <Text style={[styles.legendText, { color: theme.textSecondary }]}>
                {language === 'mr' ? item.mr : item.en}
              </Text>
            </View>
          ))}
        </View>
      );
    }

    return null;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header />

      <FlatList
        data={listData}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
        removeClippedSubviews={true}
        initialNumToRender={10}
      />

      {selectedAlert ? (
        <OfficialAlertModal
          alert={selectedAlert}
          visible={true}
          language={language}
          onClose={() => setSelectedAlert(null)}
        />
      ) : null}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 },

  statusBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 16,
  },
  statusIconCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  statusLabel: { fontSize: 18, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  statusSub: { fontSize: 13, marginBottom: 3 },
  statusTime: { fontSize: 11 },

  filterRow: { marginBottom: 20 },
  filterContent: { flexDirection: 'row', gap: 8, paddingRight: 4 },
  filterBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  filterDot: { width: 8, height: 8, borderRadius: 4 },
  filterLabel: { fontSize: 12, fontWeight: '600' },
  filterBadge: { minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  filterBadgeText: { fontSize: 10, fontWeight: '700' },

  sectionHeaderBlock: { marginBottom: 12 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },
  sectionSub: { fontSize: 12, marginBottom: 8 },
  countPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, borderWidth: 1 },
  countPillText: { fontSize: 11, fontWeight: '700' },

  noAlerts: { alignItems: 'center', padding: 32, borderRadius: 14, borderWidth: 1, gap: 10, marginBottom: 16 },
  noAlertsText: { fontSize: 15, fontWeight: '500', textAlign: 'center' },

  officialCard: { borderRadius: 14, borderWidth: 1, borderLeftWidth: 4, padding: 14, marginBottom: 12 },
  officialHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  officialTitle: { flex: 1, fontSize: 14, fontWeight: '700', lineHeight: 20 },
  officialBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4, borderWidth: 1, flexShrink: 0 },
  officialBadgeText: { fontSize: 9, fontWeight: '800' },
  metaChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaChipText: { fontSize: 11, fontWeight: '500', opacity: 0.9 },
  alertTimePreview: { fontSize: 11, marginBottom: 4 },
  tapHint: { fontSize: 10, fontStyle: 'italic', textAlign: 'right' },

  legendCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 12, marginTop: 8 },
  legendTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  legendText: { fontSize: 13 },
});

const modalStyles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    padding: 16, paddingBottom: 18, borderBottomWidth: 1,
  },
  levelBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 12, borderWidth: 1,
  },
  levelBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  headerTitle: { fontSize: 16, fontWeight: '700', lineHeight: 22 },
  priorityBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  priorityText: { fontSize: 13, fontWeight: '800' },
  scrollContent: { padding: 16, gap: 14 },
  metaCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 12 },
  metaCardTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  metaLabel: { fontSize: 11, marginBottom: 2 },
  metaVal: { fontSize: 14, fontWeight: '600' },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '700' },
  areaCard: { borderRadius: 12, borderWidth: 1, borderLeftWidth: 4, padding: 14, gap: 10 },
  timeBlock: { borderRadius: 10, borderWidth: 1, overflow: 'hidden' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10 },
  alertTextBlock: { borderRadius: 10, borderWidth: 1, padding: 12, gap: 6 },
  safetyCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 12, borderTopWidth: 1, marginTop: 4 },
});
