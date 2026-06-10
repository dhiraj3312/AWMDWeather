// IMD Satellite Images + District Warning WebView section
// Uses official IMD web sources via WebView
import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Linking,
  Modal,
  Platform,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Lazy require to avoid bundling issues on web
let WebView: any = null;
try {
  WebView = require('react-native-webview').WebView;
} catch {
  WebView = null;
}

interface Props {
  language: string;
  theme: any;
}

const IMD_SOURCES = [
  {
    id: 'satellite_ir',
    label: 'IR Satellite',
    labelMr: 'IR उपग्रह',
    url: 'https://mausam.imd.gov.in/imd_latest/contents/satellite.php',
    icon: 'satellite-alt',
    color: '#00E5FF',
    desc: 'Infrared Satellite Imagery',
    descMr: 'इन्फ्रारेड उपग्रह प्रतिमा',
  },
  {
    id: 'district_warning',
    label: 'District Warnings',
    labelMr: 'जिल्हा इशारे',
    url: 'https://mausam.imd.gov.in/imd_latest/contents/districtwarning.php',
    icon: 'warning',
    color: '#FF9500',
    desc: 'IMD District Weather Warnings',
    descMr: 'IMD जिल्हा हवामान इशारे',
  },
  {
    id: 'pune_forecast',
    label: 'Pune Forecast',
    labelMr: 'पुणे अंदाज',
    url: 'https://mausam.imd.gov.in/imd_latest/contents/pune_forecast.php',
    icon: 'wb-cloudy',
    color: '#4CAF50',
    desc: 'IMD Pune City Forecast',
    descMr: 'IMD पुणे शहर अंदाज',
  },
  {
    id: 'radar_live',
    label: 'IMD Radar',
    labelMr: 'IMD राडार',
    url: 'https://mausam.imd.gov.in/imd_latest/contents/radar.php',
    icon: 'radar',
    color: '#00C853',
    desc: 'IMD Live Doppler Radar',
    descMr: 'IMD थेट डॉप्लर राडार',
  },
];

interface IMDWebViewProps {
  source: typeof IMD_SOURCES[0];
  language: string;
  theme: any;
  onClose: () => void;
}

function IMDWebViewModal({ source, language, theme, onClose }: IMDWebViewProps) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <Modal
      visible={true}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[modalStyles.root, {
        backgroundColor: theme.background,
        paddingTop: Platform.OS === 'android' ? 28 : insets.top,
      }]}>
        {/* Header */}
        <View style={[modalStyles.header, { backgroundColor: source.color + '15', borderBottomColor: source.color + '40' }]}>
          <Pressable onPress={onClose} hitSlop={12} style={({ pressed }) => [modalStyles.backBtn, { opacity: pressed ? 0.6 : 1 }]}>
            <MaterialIcons name="arrow-back" size={24} color={source.color} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <View style={[modalStyles.sourceBadge, { backgroundColor: source.color + '20', borderColor: source.color }]}>
              <MaterialIcons name="verified" size={12} color={source.color} />
              <Text style={[modalStyles.sourceBadgeText, { color: source.color }]}>IMD Official</Text>
            </View>
            <Text style={[modalStyles.headerTitle, { color: source.color }]}>
              {language === 'mr' ? source.labelMr : source.label}
            </Text>
          </View>
          <Pressable
            onPress={() => Linking.openURL(source.url)}
            hitSlop={8}
            style={({ pressed }) => [modalStyles.openExtBtn, { backgroundColor: source.color + '20', opacity: pressed ? 0.7 : 1 }]}
          >
            <MaterialIcons name="open-in-new" size={18} color={source.color} />
          </Pressable>
        </View>

        {/* WebView or Fallback */}
        {WebView && !error ? (
          <View style={{ flex: 1, position: 'relative' }}>
            <WebView
              source={{ uri: source.url }}
              style={{ flex: 1, backgroundColor: theme.background }}
              onLoadEnd={() => setLoading(false)}
              onError={() => { setLoading(false); setError(true); }}
              onHttpError={() => { setLoading(false); setError(true); }}
              javaScriptEnabled
              domStorageEnabled
              originWhitelist={['*']}
              setSupportMultipleWindows={false}
              androidLayerType="hardware"
              startInLoadingState={false}
            />
            {loading ? (
              <View style={[modalStyles.loadingOverlay, { backgroundColor: theme.background + 'DD' }]}>
                <ActivityIndicator size="large" color={source.color} />
                <Text style={[modalStyles.loadingText, { color: theme.textSecondary }]}>
                  {language === 'mr' ? 'IMD डेटा लोड होत आहे...' : 'Loading IMD data...'}
                </Text>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={[modalStyles.fallback, { backgroundColor: theme.surfaceElevated, margin: 16, borderColor: theme.surfaceBorder }]}>
            <MaterialIcons name="open-in-browser" size={52} color={source.color} />
            <Text style={[modalStyles.fallbackTitle, { color: theme.textPrimary }]}>
              {language === 'mr' ? 'ब्राउझरमध्ये उघडा' : 'Open in Browser'}
            </Text>
            <Text style={[modalStyles.fallbackDesc, { color: theme.textSecondary }]}>
              {language === 'mr' ? source.descMr : source.desc}
            </Text>
            <Pressable
              style={({ pressed }) => [modalStyles.fallbackBtn, { backgroundColor: source.color, opacity: pressed ? 0.85 : 1 }]}
              onPress={() => Linking.openURL(source.url)}
            >
              <MaterialIcons name="open-in-new" size={18} color="#000" />
              <Text style={modalStyles.fallbackBtnText}>
                {language === 'mr' ? 'IMD वेबसाइट उघडा' : 'Open IMD Website'}
              </Text>
            </Pressable>
            <Text style={[modalStyles.fallbackUrl, { color: theme.textTertiary }]}>
              {source.url}
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function IMDSatellite({ language, theme }: Props) {
  const [selectedSource, setSelectedSource] = useState<typeof IMD_SOURCES[0] | null>(null);

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* IMD Header */}
      <View style={[styles.imdHeader, { backgroundColor: theme.surfaceElevated, borderColor: theme.accentGreen + '40' }]}>
        <View style={[styles.imdBadge, { backgroundColor: theme.accentGreen + '20', borderColor: theme.accentGreen }]}>
          <MaterialIcons name="verified" size={14} color={theme.accentGreen} />
          <Text style={[styles.imdBadgeText, { color: theme.accentGreen }]}>India Meteorological Department</Text>
        </View>
        <Text style={[styles.imdTitle, { color: theme.textPrimary }]}>
          {language === 'mr' ? 'IMD अधिकृत साधने' : 'IMD Official Tools'}
        </Text>
        <Text style={[styles.imdSubtitle, { color: theme.textSecondary }]}>
          {language === 'mr'
            ? 'भारतीय हवामान विभागाची थेट माहिती · उपग्रह प्रतिमा, जिल्हा इशारे'
            : 'Live data from India Met Dept. · Satellite imagery, district warnings, radar'}
        </Text>
      </View>

      {/* IMD Source Cards */}
      <Text style={[styles.sectionLabel, { color: theme.textTertiary }]}>
        {language === 'mr' ? 'IMD स्रोत निवडा' : 'Select IMD Source'}
      </Text>

      <View style={styles.sourceGrid}>
        {IMD_SOURCES.map((source) => (
          <Pressable
            key={source.id}
            onPress={() => setSelectedSource(source)}
            style={({ pressed }) => [
              styles.sourceCard,
              {
                backgroundColor: theme.surfaceElevated,
                borderColor: source.color + '50',
                opacity: pressed ? 0.88 : 1,
              },
            ]}
          >
            <View style={[styles.sourceIconCircle, { backgroundColor: source.color + '20' }]}>
              <MaterialIcons name={source.icon as any} size={24} color={source.color} />
            </View>
            <Text style={[styles.sourceLabel, { color: theme.textPrimary }]}>
              {language === 'mr' ? source.labelMr : source.label}
            </Text>
            <Text style={[styles.sourceDesc, { color: theme.textTertiary }]} numberOfLines={2}>
              {language === 'mr' ? source.descMr : source.desc}
            </Text>
            <View style={[styles.sourceOpenBtn, { backgroundColor: source.color + '15', borderColor: source.color + '40' }]}>
              <MaterialIcons name="open-in-new" size={12} color={source.color} />
              <Text style={[styles.sourceOpenText, { color: source.color }]}>
                {language === 'mr' ? 'उघडा' : 'Open'}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>

      {/* Direct Links Section */}
      <Text style={[styles.sectionLabel, { color: theme.textTertiary, marginTop: 8 }]}>
        {language === 'mr' ? 'थेट दुवे' : 'Direct Links'}
      </Text>
      <View style={[styles.linksCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder }]}>
        {[
          {
            label: language === 'mr' ? 'IMD मुख्य वेबसाइट' : 'IMD Main Website',
            url: 'https://mausam.imd.gov.in',
            color: '#00E5FF',
          },
          {
            label: language === 'mr' ? 'महाराष्ट्र हवामान अंदाज' : 'Maharashtra Forecast',
            url: 'https://mausam.imd.gov.in/imd_latest/contents/maharashtra.php',
            color: '#FF9500',
          },
          {
            label: language === 'mr' ? 'आज हवामान (पुणे)' : 'Today Weather (Pune)',
            url: 'https://mausam.imd.gov.in/imd_latest/contents/pune_forecast.php',
            color: '#4CAF50',
          },
          {
            label: language === 'mr' ? 'चक्रीवादळ चेतावणी' : 'Cyclone Warnings',
            url: 'https://mausam.imd.gov.in/imd_latest/contents/cyclone.php',
            color: '#F44336',
          },
        ].map((link, i, arr) => (
          <Pressable
            key={i}
            onPress={() => Linking.openURL(link.url)}
            style={({ pressed }) => [
              styles.linkRow,
              { borderBottomColor: theme.surfaceBorder, borderBottomWidth: i < arr.length - 1 ? 1 : 0 },
              pressed ? { backgroundColor: theme.surfaceHighlight } : {},
            ]}
          >
            <View style={[styles.linkDot, { backgroundColor: link.color }]} />
            <Text style={[styles.linkLabel, { color: theme.textPrimary }]}>{link.label}</Text>
            <MaterialIcons name="open-in-new" size={16} color={theme.textTertiary} />
          </Pressable>
        ))}
      </View>

      {/* Disclaimer */}
      <View style={[styles.disclaimer, { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder }]}>
        <MaterialIcons name="info-outline" size={14} color={theme.textTertiary} />
        <Text style={[styles.disclaimerText, { color: theme.textTertiary }]}>
          {language === 'mr'
            ? 'IMD डेटा थेट भारतीय हवामान विभागाच्या अधिकृत वेबसाइटवरून येतो. AWMD हे त्याचे केवळ संदर्भ घेते.'
            : 'IMD data sourced directly from India Meteorological Department\'s official website. AWMD references it for informational purposes.'}
        </Text>
      </View>

      <View style={{ height: 24 }} />

      {/* Modal */}
      {selectedSource ? (
        <IMDWebViewModal
          source={selectedSource}
          language={language}
          theme={theme}
          onClose={() => setSelectedSource(null)}
        />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },

  imdHeader: {
    borderRadius: 16, borderWidth: 1, padding: 16, gap: 8, marginBottom: 4,
  },
  imdBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 12, borderWidth: 1,
  },
  imdBadgeText: { fontSize: 11, fontWeight: '700' },
  imdTitle: { fontSize: 18, fontWeight: '800' },
  imdSubtitle: { fontSize: 13, lineHeight: 20 },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1.1,
    textTransform: 'uppercase', marginLeft: 2,
  },

  sourceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  sourceCard: {
    width: '47%', borderRadius: 16, borderWidth: 1,
    padding: 14, gap: 8, alignItems: 'flex-start',
  },
  sourceIconCircle: {
    width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
  },
  sourceLabel: { fontSize: 14, fontWeight: '700' },
  sourceDesc: { fontSize: 11, lineHeight: 17 },
  sourceOpenBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, marginTop: 4,
  },
  sourceOpenText: { fontSize: 11, fontWeight: '700' },

  linksCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  linkRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 14,
  },
  linkDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  linkLabel: { flex: 1, fontSize: 14, fontWeight: '500' },

  disclaimer: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    borderRadius: 10, borderWidth: 1, padding: 12,
  },
  disclaimerText: { flex: 1, fontSize: 11, lineHeight: 18 },
});

const modalStyles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, paddingBottom: 16, borderBottomWidth: 1,
  },
  backBtn: { paddingTop: 2 },
  sourceBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8, borderWidth: 1, marginBottom: 4,
  },
  sourceBadgeText: { fontSize: 10, fontWeight: '800' },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  openExtBtn: {
    width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center', gap: 14,
  },
  loadingText: { fontSize: 14, fontWeight: '500' },
  fallback: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: 16, padding: 32, borderRadius: 16, borderWidth: 1,
  },
  fallbackTitle: { fontSize: 18, fontWeight: '700' },
  fallbackDesc: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  fallbackBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 8,
  },
  fallbackBtnText: { fontSize: 15, fontWeight: '700', color: '#000' },
  fallbackUrl: { fontSize: 10, textAlign: 'center', marginTop: 8 },
});
