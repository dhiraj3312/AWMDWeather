import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Linking,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWeather } from '@/contexts/WeatherContext';
import { cancelAllNotifications } from '@/services/notificationService';

function SettingRow({
  icon, iconLib = 'material', iconColor, title, subtitle, rightElement, onPress, borderBottom = true,
}: {
  icon: string; iconLib?: 'material' | 'community'; iconColor: string; title: string; subtitle?: string;
  rightElement?: React.ReactNode; onPress?: () => void; borderBottom?: boolean;
}) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.settingRow,
        { borderBottomColor: theme.surfaceBorder, borderBottomWidth: borderBottom ? 1 : 0 },
        onPress && pressed ? { backgroundColor: theme.surfaceHighlight } : {},
      ]}
    >
      <View style={[styles.settingIconCircle, { backgroundColor: iconColor + '20' }]}>
        {iconLib === 'community'
          ? <MaterialCommunityIcons name={icon as any} size={19} color={iconColor} />
          : <MaterialIcons name={icon as any} size={19} color={iconColor} />}
      </View>
      <View style={styles.settingTextCol}>
        <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>{title}</Text>
        {subtitle ? <Text style={[styles.settingSubtitle, { color: theme.textTertiary }]}>{subtitle}</Text> : null}
      </View>
      {rightElement ?? (onPress ? <MaterialIcons name="chevron-right" size={18} color={theme.textTertiary} /> : null)}
    </Pressable>
  );
}

function SettingSection({ title, children }: { title: string; children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <View style={styles.sectionBlock}>
      <Text style={[styles.sectionLabel, { color: theme.textTertiary }]}>{title.toUpperCase()}</Text>
      <View style={[styles.sectionCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder }]}>
        {children}
      </View>
    </View>
  );
}

function LanguagePicker() {
  const { theme } = useTheme();
  const { language, setLanguage } = useLanguage();
  return (
    <View style={styles.langRow}>
      {(['mr', 'en'] as const).map((lang) => (
        <Pressable
          key={lang}
          onPress={() => setLanguage(lang)}
          style={({ pressed }) => [
            styles.langBtn,
            {
              backgroundColor: language === lang ? theme.primary : theme.surface,
              borderColor: language === lang ? theme.primary : theme.surfaceBorder,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Text style={[
            styles.langBtnText,
            { color: language === lang ? '#000' : theme.textSecondary, fontWeight: language === lang ? '700' : '500' },
          ]}>
            {lang === 'mr' ? 'मराठी' : 'English'}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function SettingsScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const { t, language } = useLanguage();
  const { refresh, lastUpdated } = useWeather();
  const insets = useSafeAreaInsets();
  const [notifRain, setNotifRain] = useState(true);
  const [notifThunder, setNotifThunder] = useState(true);
  const [notifDaily, setNotifDaily] = useState(true);
  const isMr = language === 'mr';

  const handleNotifToggle = async (type: 'rain' | 'thunder' | 'daily', value: boolean) => {
    if (type === 'rain') setNotifRain(value);
    if (type === 'thunder') setNotifThunder(value);
    if (type === 'daily') setNotifDaily(value);
    if (!value && !notifRain && !notifThunder && !notifDaily) {
      await cancelAllNotifications();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <LinearGradient
        colors={[theme.surface, theme.background]}
        style={[styles.header, { paddingTop: insets.top + 10, borderBottomColor: theme.surfaceBorder }]}
      >
        <View style={[styles.headerIconBg, { backgroundColor: theme.primary }]}>
          <MaterialIcons name="settings" size={17} color="#000" />
        </View>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          {isMr ? 'सेटिंग्ज' : 'Settings'}
        </Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Banner */}
        <LinearGradient
          colors={[theme.surfaceElevated, theme.surface]}
          style={[styles.profileBanner, { borderColor: theme.primary + '40' }]}
        >
          <View style={[styles.logoCircle, { backgroundColor: theme.primary + '20', borderColor: theme.primary + '40' }]}>
            <Image
              source={require('@/assets/images/awmd-logo.png')}
              style={styles.profileLogo}
              contentFit="contain"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.profileTitle, { color: theme.primary }]}>AWMD Weather</Text>
            <Text style={[styles.profileSubtitle, { color: theme.textSecondary }]}>
              {isMr ? 'आळंदी हवामान व मौसमविभाग' : 'Alandi Weather & Meteorological Dept.'}
            </Text>
            {lastUpdated ? (
              <View style={styles.updatedRow}>
                <MaterialIcons name="update" size={11} color={theme.accentGreen} />
                <Text style={[styles.profileUpdated, { color: theme.accentGreen }]}>
                  {lastUpdated.toLocaleTimeString(isMr ? 'mr-IN' : 'en-IN', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            ) : null}
          </View>
          <View style={[styles.versionBadge, { backgroundColor: theme.primary + '15', borderColor: theme.primary + '30' }]}>
            <Text style={[styles.versionText, { color: theme.primary }]}>v1.0</Text>
          </View>
        </LinearGradient>

        {/* ── Language ── */}
        <SettingSection title={isMr ? 'भाषा' : 'Language'}>
          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <View style={[styles.settingIconCircle, { backgroundColor: theme.accentBlue + '20' }]}>
              <MaterialIcons name="language" size={19} color={theme.accentBlue} />
            </View>
            <View style={styles.settingTextCol}>
              <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>
                {isMr ? 'अॅप भाषा' : 'App Language'}
              </Text>
            </View>
            <LanguagePicker />
          </View>
        </SettingSection>

        {/* ── Appearance ── */}
        <SettingSection title={isMr ? 'देखावा' : 'Appearance'}>
          <SettingRow
            icon={isDark ? 'light-mode' : 'dark-mode'}
            iconColor={isDark ? '#FFD700' : '#546E7A'}
            title={isDark ? (isMr ? 'गडद मोड चालू' : 'Dark Mode On') : (isMr ? 'प्रकाश मोड चालू' : 'Light Mode On')}
            subtitle={isMr ? 'थीम बदलण्यासाठी टॉगल करा' : 'Toggle to switch theme'}
            borderBottom={false}
            rightElement={
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: theme.surfaceBorder, true: theme.primary }}
                thumbColor={isDark ? '#000' : '#fff'}
              />
            }
          />
        </SettingSection>

        {/* ── Notifications ── */}
        <SettingSection title={isMr ? 'सूचना' : 'Notifications'}>
          <SettingRow
            icon="weather-pouring"
            iconLib="community"
            iconColor={theme.alertRed}
            title={isMr ? 'जोरदार पाऊस इशारा' : 'Heavy Rain Alert'}
            subtitle={isMr ? 'जोरदार पावसाची सूचना' : 'Notify on heavy rainfall'}
            rightElement={
              <Switch value={notifRain} onValueChange={(v) => handleNotifToggle('rain', v)}
                trackColor={{ false: theme.surfaceBorder, true: theme.alertRed }}
                thumbColor="#fff" />
            }
          />
          <SettingRow
            icon="weather-lightning"
            iconLib="community"
            iconColor={theme.alertOrange}
            title={isMr ? 'वादळाचा इशारा' : 'Thunderstorm Alert'}
            subtitle={isMr ? 'वादळ आढळल्यावर सूचना' : 'Notify on thunderstorm detection'}
            rightElement={
              <Switch value={notifThunder} onValueChange={(v) => handleNotifToggle('thunder', v)}
                trackColor={{ false: theme.surfaceBorder, true: theme.alertOrange }}
                thumbColor="#fff" />
            }
          />
          <SettingRow
            icon="wb-sunny"
            iconColor={theme.primary}
            title={isMr ? 'दैनिक हवामान अंदाज' : 'Daily Forecast'}
            subtitle={isMr ? 'दररोज सकाळी हवामान अंदाज' : 'Morning weather forecast daily'}
            borderBottom={false}
            rightElement={
              <Switch value={notifDaily} onValueChange={(v) => handleNotifToggle('daily', v)}
                trackColor={{ false: theme.surfaceBorder, true: theme.primary }}
                thumbColor="#fff" />
            }
          />
        </SettingSection>

        {/* ── Data ── */}
        <SettingSection title={isMr ? 'डेटा' : 'Data'}>
          <SettingRow
            icon="refresh"
            iconColor={theme.accentCyan}
            title={isMr ? 'आत्ता ताजे करा' : 'Refresh Now'}
            subtitle={isMr ? 'हवामान डेटा अद्यतनित करा' : 'Update weather data immediately'}
            onPress={refresh}
          />
          <SettingRow
            icon="timer"
            iconColor={theme.accentGreen}
            title={isMr ? 'स्वयं-ताजे अंतर' : 'Auto-Refresh Interval'}
            subtitle={isMr ? 'दर ५ मिनिटांनी' : 'Every 5 minutes'}
            borderBottom={false}
          />
        </SettingSection>

        {/* ── Data Sources ── */}
        <SettingSection title={isMr ? 'डेटा स्रोत' : 'Data Sources'}>
          <SettingRow
            icon="cloud"
            iconColor={theme.accentBlue}
            title="AccuWeather API"
            subtitle={isMr ? 'थेट हवामान डेटा · अधिकृत AccuWeather' : 'Live weather data · Official AccuWeather'}
            onPress={() => Linking.openURL('https://developer.accuweather.com')}
          />
          <SettingRow
            icon="radar"
            iconColor="#00E5FF"
            title="Windy.com Radar"
            subtitle={isMr ? 'थेट राडार, पाऊस, वारा, वीज नकाशे' : 'Live radar, rain, wind, lightning maps'}
            onPress={() => Linking.openURL('https://windy.com')}
          />
          <SettingRow
            icon="satellite-alt"
            iconColor={theme.accentGreen}
            title="IMD Satellite"
            subtitle={isMr ? 'IMD अधिकृत उपग्रह प्रतिमा' : 'IMD official satellite imagery'}
            borderBottom={false}
            onPress={() => Linking.openURL('https://mausam.imd.gov.in')}
          />
        </SettingSection>

        {/* ── About ── */}
        <SettingSection title={isMr ? 'AWMD बद्दल' : 'About AWMD'}>
          <SettingRow
            icon="place"
            iconColor={theme.alertGreen}
            title={isMr ? 'मुख्य क्षेत्र' : 'Primary Area'}
            subtitle={isMr ? 'आळंदी म्हातोबाची, पुणे, महाराष्ट्र' : 'Alandi Mhatobachi, Pune, Maharashtra'}
          />
          <SettingRow
            icon="code"
            iconColor={theme.textTertiary}
            title={isMr ? 'आवृत्ती' : 'Version'}
            subtitle="AWMD Weather v1.0 · Expo SDK 53"
            borderBottom={false}
          />
        </SettingSection>

        {/* ── More ── */}
        <SettingSection title={isMr ? 'इतर' : 'More'}>
          <SettingRow
            icon="privacy-tip"
            iconColor={theme.accentBlue}
            title={isMr ? 'गोपनीयता धोरण' : 'Privacy Policy'}
            onPress={() => Linking.openURL('https://accuweather.com/en/privacy')}
            borderBottom={false}
          />
        </SettingSection>

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: theme.surfaceBorder }]}>
          <Text style={[styles.footerText, { color: theme.textTertiary }]}>
            {isMr
              ? '© AWMD · AccuWeather डेटा · Windy.com राडार\nIMD उपग्रह प्रतिमा'
              : '© AWMD · AccuWeather Data · Windy.com Radar\nIMD Satellite Imagery'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1,
  },
  headerIconBg: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },

  scrollContent: { padding: 16, gap: 8 },

  profileBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 8,
  },
  logoCircle: {
    width: 58, height: 58, borderRadius: 16, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  profileLogo: { width: 46, height: 46 },
  profileTitle: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  profileSubtitle: { fontSize: 11, lineHeight: 17 },
  updatedRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  profileUpdated: { fontSize: 11, fontWeight: '600' },
  versionBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, alignSelf: 'flex-start' },
  versionText: { fontSize: 10, fontWeight: '700' },

  sectionBlock: { marginBottom: 16 },
  sectionLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.2,
    marginBottom: 8, marginLeft: 4,
  },
  sectionCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },

  settingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 13,
  },
  settingIconCircle: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  settingTextCol: { flex: 1, gap: 2 },
  settingTitle: { fontSize: 14, fontWeight: '500' },
  settingSubtitle: { fontSize: 11, lineHeight: 17 },

  langRow: { flexDirection: 'row', gap: 6 },
  langBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1 },
  langBtnText: { fontSize: 12 },

  footer: { paddingTop: 20, borderTopWidth: 1, alignItems: 'center', marginTop: 8 },
  footerText: { fontSize: 10, textAlign: 'center', lineHeight: 18 },
});
