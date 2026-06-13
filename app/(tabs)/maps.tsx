import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWeather } from '@/contexts/WeatherContext';
import Header from '@/components/layout/Header';
import WeatherMap from '@/components/feature/WeatherMap';
import IMDSatellite from '@/components/feature/IMDSatellite';
import { CONFIG } from '@/constants/config';

const ALANDI_REGION = {
  latitude: 18.6834,
  longitude: 73.9009,
  latitudeDelta: 1.2,
  longitudeDelta: 1.2,
};

const LAYER_META: Record<string, { icon: string; lib: 'material' | 'community'; color: string; desc: string; descMr: string }> = {
  radar:     { icon: 'radar', lib: 'material', color: '#00E5FF', desc: 'Live weather radar', descMr: 'थेट हवामान राडार' },
  rain:      { icon: 'weather-pouring', lib: 'community', color: '#42A5F5', desc: 'Rainfall intensity', descMr: 'पर्जन्यमान तीव्रता' },
  wind:      { icon: 'weather-windy', lib: 'community', color: '#26C6DA', desc: 'Wind speed & direction', descMr: 'वारा वेग व दिशा' },
  clouds:    { icon: 'cloud', lib: 'material', color: '#90A4AE', desc: 'Cloud cover', descMr: 'ढग आवरण' },
  temp:      { icon: 'thermometer', lib: 'community', color: '#FF7043', desc: 'Temperature map', descMr: 'तापमान नकाशा' },
  lightning: { icon: 'lightning-bolt', lib: 'community', color: '#FFD600', desc: 'Lightning strikes', descMr: 'विजांचे ठिकाण' },
};

export default function MapsScreen() {
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  const { activeLocation } = useWeather();
  const [activeLayerId, setActiveLayerId] = useState('radar');
  const [activeMapSection, setActiveMapSection] = useState<'windy' | 'satellite'>('windy');

  const layers = CONFIG.MAP_LAYERS;
  const activeLayerConfig = layers.find((l) => l.id === activeLayerId);
  const activeMeta = LAYER_META[activeLayerId] ?? LAYER_META.radar;

  const mapRegion = activeLocation?.lat
    ? { latitude: activeLocation.lat, longitude: activeLocation.lon, latitudeDelta: 1.2, longitudeDelta: 1.2 }
    : ALANDI_REGION;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header />

      {/* ── Section Toggle ── */}
      <View style={[styles.sectionToggle, { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder }]}>
        <Pressable
          onPress={() => setActiveMapSection('windy')}
          style={[
            styles.sectionBtn,
            activeMapSection === 'windy' && { backgroundColor: '#00E5FF20', borderColor: '#00E5FF' },
          ]}
        >
          <MaterialIcons name="radar" size={15} color={activeMapSection === 'windy' ? '#00E5FF' : theme.textTertiary} />
          <Text style={[styles.sectionBtnLabel, { color: activeMapSection === 'windy' ? '#00E5FF' : theme.textTertiary }]}>
            {language === 'mr' ? 'Windy राडार' : 'Windy Radar'}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveMapSection('satellite')}
          style={[
            styles.sectionBtn,
            activeMapSection === 'satellite' && { backgroundColor: theme.accentGreen + '20', borderColor: theme.accentGreen },
          ]}
        >
          <MaterialIcons name="satellite-alt" size={15} color={activeMapSection === 'satellite' ? theme.accentGreen : theme.textTertiary} />
          <Text style={[styles.sectionBtnLabel, { color: activeMapSection === 'satellite' ? theme.accentGreen : theme.textTertiary }]}>
            {language === 'mr' ? 'IMD उपग्रह' : 'IMD Satellite'}
          </Text>
        </Pressable>
      </View>

      {activeMapSection === 'windy' ? (
        <>
          {/* ── Layer Selector ── */}
          <View style={[styles.layerBar, { backgroundColor: theme.surface, borderBottomColor: theme.surfaceBorder }]}>
            <Text style={[styles.layerBarTitle, { color: theme.textTertiary }]}>
              {language === 'mr' ? 'थर:' : 'Layer:'}
            </Text>
            <ScrollView
              horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.layerScroll}
            >
              {layers.map((layer) => {
                const isActive = layer.id === activeLayerId;
                const meta = LAYER_META[layer.id] ?? LAYER_META.radar;
                return (
                  <Pressable
                    key={layer.id}
                    style={({ pressed }) => [
                      styles.layerBtn,
                      {
                        backgroundColor: isActive ? meta.color + '28' : theme.surfaceElevated,
                        borderColor: isActive ? meta.color : theme.surfaceBorder,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                    onPress={() => setActiveLayerId(layer.id)}
                  >
                    {meta.lib === 'community'
                      ? <MaterialCommunityIcons name={meta.icon as any} size={14} color={isActive ? meta.color : theme.textTertiary} />
                      : <MaterialIcons name={meta.icon as any} size={14} color={isActive ? meta.color : theme.textTertiary} />
                    }
                    <Text style={[styles.layerBtnLabel, { color: isActive ? meta.color : theme.textTertiary }]}>
                      {language === 'mr' ? layer.labelMr : layer.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Active layer info */}
          <View style={[styles.layerInfoBar, { backgroundColor: activeMeta.color + '15', borderBottomColor: activeMeta.color + '30' }]}>
            <View style={[styles.layerInfoDot, { backgroundColor: activeMeta.color }]} />
            <Text style={[styles.layerInfoText, { color: activeMeta.color }]}>
              {language === 'mr' ? activeMeta.descMr : activeMeta.desc}
            </Text>
            <View style={[styles.windyBadge, { backgroundColor: '#00E5FF15', borderColor: '#00E5FF40' }]}>
              <MaterialIcons name="radar" size={9} color="#00E5FF" />
              <Text style={[styles.windyBadgeText, { color: '#00E5FF' }]}>Windy.com</Text>
            </View>
          </View>

          {/* Map */}
          <WeatherMap
            activeLayer={activeLayerId}
            activeLayerConfig={activeLayerConfig}
            mapRegion={mapRegion}
            activeLocation={
              activeLocation
                ? { lat: activeLocation.lat, lon: activeLocation.lon, name: activeLocation.name }
                : null
            }
            getLayerColor={(id: string) => LAYER_META[id]?.color ?? '#00E5FF'}
          />

          {/* Bottom info */}
          <View style={[styles.infoPanel, { backgroundColor: theme.surface, borderTopColor: theme.surfaceBorder }]}>
            <View style={styles.infoPanelRow}>
              <MaterialIcons name="location-on" size={14} color={theme.accentBlue} />
              <Text style={[styles.infoPanelText, { color: theme.textSecondary }]}>
                {language === 'mr' ? 'केंद्र: आळंदी म्हातोबाची, पुणे' : 'Center: Alandi Mhatobachi, Pune'}
              </Text>
            </View>
          </View>
        </>
      ) : (
        <IMDSatellite language={language} theme={theme} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  sectionToggle: {
    flexDirection: 'row', margin: 12, borderRadius: 12, borderWidth: 1, padding: 4, gap: 4,
  },
  sectionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 9, borderRadius: 8, borderWidth: 1, borderColor: 'transparent',
  },
  sectionBtnLabel: { fontSize: 12, fontWeight: '600' },

  layerBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingLeft: 12, borderBottomWidth: 1, gap: 8,
  },
  layerBarTitle: { fontSize: 11, fontWeight: '600', flexShrink: 0 },
  layerScroll: { flexDirection: 'row', gap: 8, paddingRight: 12 },
  layerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1,
  },
  layerBtnLabel: { fontSize: 11, fontWeight: '600' },

  layerInfoBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 7, borderBottomWidth: 1,
  },
  layerInfoDot: { width: 6, height: 6, borderRadius: 3 },
  layerInfoText: { flex: 1, fontSize: 12, fontWeight: '500' },
  windyBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, borderWidth: 1,
  },
  windyBadgeText: { fontSize: 9, fontWeight: '700' },

  infoPanel: { paddingHorizontal: 14, paddingVertical: 9, borderTopWidth: 1 },
  infoPanelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoPanelText: { fontSize: 12, fontWeight: '500', flex: 1 },
});
