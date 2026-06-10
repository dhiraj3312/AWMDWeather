import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Platform,
  Linking,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWeather } from '@/contexts/WeatherContext';
import { cancelAllNotifications } from '@/services/notificationService';

// ─── Setting Row ──────────────────────────────────────────────────────────────
function SettingRow({
  icon, iconColor, title, subtitle, rightElement, onPress, borderBottom = true,
}: {
  icon: string; iconColor: string; title: string; subtitle?: string;
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
        <MaterialIcons name={icon as any} size={20} color={iconColor} />
      </View>
      <View style={styles.settingTextCol}>
        <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>{title}</Text>
        {subtitle ? <Text style={[styles.settingSubtitle, { color: theme.textTertiary }]}>{subtitle}</Text> : null}
      </View>
      {rightElement ? rightElement : onPress ? (
        <MaterialIcons name="chevron-right" size={20} color={theme.textTertiary} />
      ) : null}
    </Pressable>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SettingSection({ title, children }: { title: string; children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <View style={styles.sectionBlock}>
      <Text style={[styles.sectionLabel, { color: theme.textTertiary }]}>{title}</Text>
      <View style={[styles.sectionCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder }]}>
        {children}
      </View>
    </View>
  );
}

// ─── Language Picker ─────────────────────────────────────────────────────────
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

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const { t, language } = useLanguage();
  const { refresh, lastUpdated } = useWeather();
  const insets = useSafeAreaInsets();
  const [notifEnabled, setNotifEnabled] = useState(true);

  const handleNotifToggle = async (value: boolean) => {
    setNotifEnabled(value);
    if (!value) {
      await cancelAllNotifications();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, {
        backgroundColor: theme.surface,
        borderBottomColor: theme.surfaceBorder,
        paddingTop: insets.top + 10,
      }]}>
        <View style={[styles.logoBadge, { backgroundColor: theme.primary }]}>
          <MaterialCommunityIcons name="cog" size={16} color="#000" />
        </View>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          {language === 'mr' ? 'सेटिंग्ज' : 'Settings'}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Banner */}
        <View style={[styles.profileBanner, { backgroundColor: theme.surfaceElevated, borderColor: theme.primary + '40' }]}>
          <Image
            source={require('@/assets/images/awmd-logo.png')}
            style={styles.profileLogo}
            contentFit="contain"
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.profileTitle, { color: theme.primary }]}>AWMD Weather</Text>
            <Text style={[styles.profileSubtitle, { color: theme.textSecondary }]}>
              {language === 'mr' ? 'आळंदी हवामान व मौसमविभाग' : 'Alandi Weather & Meteorological Dept.'}
            </Text>
            {lastUpdated ? (
              <Text style={[styles.profileUpdated, { color: theme.textTertiary }]}>
                {language === 'mr' ? 'शेवटचे अद्यतन: ' : 'Last updated: '}
                {lastUpdated.toLocaleTimeString(language === 'mr' ? 'mr-IN' : 'en-IN', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            ) : null}
          </View>
        </View>

        {/* ── Language ── */}
        <SettingSection title={language === 'mr' ? 'भाषा' : 'Language'}>
          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <View style={[styles.settingIconCircle, { backgroundColor: theme.accentBlue + '20' }]}>
              <MaterialIcons name="language" size={20} color={theme.accentBlue} />
            </View>
            <View style={styles.settingTextCol}>
              <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>
                {language === 'mr' ? 'अॅप भाषा' : 'App Language'}
              </Text>
              <Text style={[styles.settingSubtitle, { color: theme.textTertiary }]}>
                {language === 'mr' ? 'मराठी / English' : 'English / Marathi'}
              </Text>
            </View>
            <LanguagePicker />
          </View>
        </SettingSection>

        {/* ── Appearance ── */}
        <SettingSection title={language === 'mr' ? 'देखावा' : 'Appearance'}>
          <SettingRow
            icon={isDark ? 'light-mode' : 'dark-mode'}
            iconColor={isDark ? '#FFD700' : '#546E7A'}
            title={isDark ? (language === 'mr' ? 'गडद मोड चालू' : 'Dark Mode On') : (language === 'mr' ? 'प्रकाश मोड चालू' : 'Light Mode On')}
            subtitle={language === 'mr' ? 'थीम बदलण्यासाठी टॉगल करा' : 'Toggle to switch theme'}
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
        <SettingSection title={language === 'mr' ? 'सूचना' : 'Notifications'}>
          <SettingRow
            icon="notifications-active"
            iconColor={theme.alertRed}
            title={language === 'mr' ? 'जोरदार पाऊस इशारा' : 'Heavy Rain Alert'}
            subtitle={language === 'mr' ? 'जोरदार पावसाची सूचना' : 'Get notified about heavy rainfall'}
            rightElement={
              <Switch value={notifEnabled} onValueChange={handleNotifToggle}
                trackColor={{ false: theme.surfaceBorder, true: theme.alertRed }}
                thumbColor="#fff" />
            }
          />
          <SettingRow
            icon="thunderstorm"
            iconColor={theme.alertOrange}
            title={language === 'mr' ? 'वादळाचा इशारा' : 'Thunderstorm Alert'}
            subtitle={language === 'mr' ? 'वादळ आढळल्यावर सूचना' : 'Notification on thunderstorm detection'}
            rightElement={
              <Switch value={notifEnabled} onValueChange={handleNotifToggle}
                trackColor={{ false: theme.surfaceBorder, true: theme.alertOrange }}
                thumbColor="#fff" />
            }
          />
          <SettingRow
            icon="wb-sunny"
            iconColor={theme.primary}
            title={language === 'mr' ? 'दैनिक हवामान अंदाज' : 'Daily Forecast'}
            subtitle={language === 'mr' ? 'दररोज सकाळी हवामान अंदाज' : 'Morning weather forecast every day'}
            borderBottom={false}
            rightElement={
              <Switch value={notifEnabled} onValueChange={handleNotifToggle}
                trackColor={{ false: theme.surfaceBorder, true: theme.primary }}
                thumbColor="#fff" />
            }
          />
        </SettingSection>

        {/* ── Data & Refresh ── */}
        <SettingSection title={language === 'mr' ? 'डेटा' : 'Data'}>
          <SettingRow
            icon="refresh"
            iconColor={theme.accentCyan}
            title={language === 'mr' ? 'आत्ता ताजे करा' : 'Refresh Now'}
            subtitle={language === 'mr' ? 'हवामान डेटा अद्यतनित करा' : 'Update weather data immediately'}
            onPress={refresh}
          />
          <SettingRow
            icon="timer"
            iconColor={theme.accentGreen}
            title={language === 'mr' ? 'स्वयं-ताजे अंतर' : 'Auto-Refresh Interval'}
            subtitle={language === 'mr' ? 'दर ५ मिनिटांनी' : 'Every 5 minutes'}
            borderBottom={false}
          />
        </SettingSection>

        {/* ── About AWMD ── */}
        <SettingSection title={language === 'mr' ? 'AWMD बद्दल' : 'About AWMD'}>
          <SettingRow
            icon="business"
            iconColor={theme.primary}
            title={language === 'mr' ? 'आळंदी हवामान विभाग' : 'Alandi Met. Department'}
            subtitle={language === 'mr' ? 'AWMD अधिकृत हवामान सेवा' : 'AWMD Official Weather Service'}
          />
          <SettingRow
            icon="cloud"
            iconColor={theme.accentBlue}
            title={language === 'mr' ? 'डेटा स्रोत' : 'Data Source'}
            subtitle="AccuWeather API — Real-time meteorological data"
          />
          <SettingRow
            icon="map"
            iconColor="#00E5FF"
            title={language === 'mr' ? 'राडार स्रोत' : 'Radar Source'}
            subtitle="Windy.com — Live weather radar & layers"
          />
          <SettingRow
            icon="place"
            iconColor={theme.alertGreen}
            title={language === 'mr' ? 'मुख्य क्षेत्र' : 'Primary Area'}
            subtitle={language === 'mr' ? 'आळंदी म्हातोबाची, पुणे, महाराष्ट्र' : 'Alandi Mhatobachi, Pune, Maharashtra'}
          />
          <SettingRow
            icon="code"
            iconColor={theme.textTertiary}
            title={language === 'mr' ? 'आवृत्ती' : 'Version'}
            subtitle="AWMD Weather v1.0 · Expo SDK 53"
            borderBottom={false}
          />
        </SettingSection>

        {/* ── Developer / Legal ── */}
        <SettingSection title={language === 'mr' ? 'इतर' : 'More'}>
          <SettingRow
            icon="privacy-tip"
            iconColor={theme.accentBlue}
            title={language === 'mr' ? 'गोपनीयता धोरण' : 'Privacy Policy'}
            onPress={() => Linking.openURL('https://accuweather.com/en/privacy')}
          />
          <SettingRow
            icon="open-in-new"
            iconColor={theme.accentCyan}
            title={language === 'mr' ? 'AccuWeather' : 'AccuWeather'}
            subtitle="dataservice.accuweather.com"
            onPress={() => Linking.openURL('https://developer.accuweather.com')}
            borderBottom={false}
          />
        </SettingSection>

        {/* AWMD Footer */}
        <View style={[styles.footer, { borderTopColor: theme.surfaceBorder }]}>
          <Text style={[styles.footerText, { color: theme.textTertiary }]}>
            {language === 'mr'
              ? '© AWMD · आळंदी हवामान व मौसमविभाग\nReal AccuWeather Data · Windy.com Radar'
              : '© AWMD · Alandi Weather & Meteorological Dept.\nReal AccuWeather Data · Windy.com Radar'}
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
  logoBadge: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  scrollContent: { padding: 16, gap: 8 },

  profileBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 8,
  },
  profileLogo: { width: 56, height: 56, borderRadius: 12 },
  profileTitle: { fontSize: 17, fontWeight: '800', marginBottom: 2 },
  profileSubtitle: { fontSize: 12, lineHeight: 18 },
  profileUpdated: { fontSize: 11, marginTop: 4 },

  sectionBlock: { marginBottom: 16 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 },
  sectionCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },

  settingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 14,
  },
  settingIconCircle: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  settingTextCol: { flex: 1, gap: 2 },
  settingTitle: { fontSize: 15, fontWeight: '500' },
  settingSubtitle: { fontSize: 12, lineHeight: 18 },

  langRow: { flexDirection: 'row', gap: 8 },
  langBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  langBtnText: { fontSize: 13 },

  footer: { paddingTop: 20, borderTopWidth: 1, alignItems: 'center', marginTop: 8 },
  footerText: { fontSize: 11, textAlign: 'center', lineHeight: 18 },
});
