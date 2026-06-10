import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
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

export default function MapsScreen() {
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  const { activeLocation } = useWeather();
  const [activeLayerId, setActiveLayerId] = useState('radar');
  const [activeMapSection, setActiveMapSection] = useState<'windy' | 'satellite'>('windy');

  const layers = CONFIG.MAP_LAYERS;
  const activeLayerConfig = layers.find((l) => l.id === activeLayerId);

  const mapRegion = activeLocation?.lat
    ? {
        latitude: activeLocation.lat,
        longitude: activeLocation.lon,
        latitudeDelta: 1.2,
        longitudeDelta: 1.2,
      }
    : ALANDI_REGION;

  const getLayerIcon = (id: string): { name: string; lib: 'material' | 'community' } => {
    switch (id) {
      case 'radar':     return { name: 'radar', lib: 'material' };
      case 'rain':      return { name: 'weather-pouring', lib: 'community' };
      case 'wind':      return { name: 'weather-windy', lib: 'community' };
      case 'clouds':    return { name: 'cloud', lib: 'material' };
      case 'temp':      return { name: 'thermometer', lib: 'community' };
      case 'lightning': return { name: 'lightning-bolt', lib: 'community' };
      default:          return { name: 'layers', lib: 'material' };
    }
  };

  const getLayerColor = (id: string): string => {
    switch (id) {
      case 'radar':     return '#00E5FF';
      case 'rain':      return '#42A5F5';
      case 'wind':      return theme.accentCyan;
      case 'clouds':    return '#90A4AE';
      case 'temp':      return theme.alertOrange;
      case 'lightning': return '#FFD600';
      default:          return theme.textSecondary;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header />

      {/* ── Section Toggle: Windy / Satellite ── */}
      <View style={[styles.sectionToggle, { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder }]}>
        <Pressable
          onPress={() => setActiveMapSection('windy')}
          style={[
            styles.sectionToggleBtn,
            activeMapSection === 'windy' && { backgroundColor: '#00E5FF' + '20', borderColor: '#00E5FF' },
          ]}
        >
          <MaterialIcons name="radar" size={15} color={activeMapSection === 'windy' ? '#00E5FF' : theme.textTertiary} />
          <Text style={[styles.sectionToggleLabel, { color: activeMapSection === 'windy' ? '#00E5FF' : theme.textTertiary }]}>
            {language === 'mr' ? 'रडार / हवामान' : 'Radar / Weather'}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveMapSection('satellite')}
          style={[
            styles.sectionToggleBtn,
            activeMapSection === 'satellite' && { backgroundColor: theme.accentGreen + '20', borderColor: theme.accentGreen },
          ]}
        >
          <MaterialIcons name="satellite-alt" size={15} color={activeMapSection === 'satellite' ? theme.accentGreen : theme.textTertiary} />
          <Text style={[styles.sectionToggleLabel, { color: activeMapSection === 'satellite' ? theme.accentGreen : theme.textTertiary }]}>
            {language === 'mr' ? 'IMD उपग्रह / इशारे' : 'IMD Satellite / Warnings'}
          </Text>
        </Pressable>
      </View>

      {/* ── WINDY RADAR SECTION ── */}
      {activeMapSection === 'windy' ? (
        <>
          {/* Layer Selector */}
          <View style={[styles.layerBar, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
            <Text style={[styles.layerBarTitle, { color: theme.textTertiary }]}>
              {language === 'mr' ? 'थर:' : 'Layer:'}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.layerScroll}
            >
              {layers.map((layer) => {
                const isActive = layer.id === activeLayerId;
                const icon = getLayerIcon(layer.id);
                const color = getLayerColor(layer.id);
                return (
                  <Pressable
                    key={layer.id}
                    style={({ pressed }) => [
                      styles.layerBtn,
                      {
                        backgroundColor: isActive ? color + '28' : theme.surfaceElevated,
                        borderColor: isActive ? color : theme.surfaceBorder,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                    onPress={() => setActiveLayerId(layer.id)}
                  >
                    {icon.lib === 'community' ? (
                      <MaterialCommunityIcons name={icon.name as any} size={15} color={isActive ? color : theme.textTertiary} />
                    ) : (
                      <MaterialIcons name={icon.name as any} size={15} color={isActive ? color : theme.textTertiary} />
                    )}
                    <Text style={[styles.layerLabel, { color: isActive ? color : theme.textTertiary }]}>
                      {language === 'mr' ? layer.labelMr : layer.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Windy Map */}
          <WeatherMap
            activeLayer={activeLayerId}
            activeLayerConfig={activeLayerConfig}
            mapRegion={mapRegion}
            activeLocation={
              activeLocation
                ? { lat: activeLocation.lat, lon: activeLocation.lon, name: activeLocation.name }
                : null
            }
            getLayerColor={getLayerColor}
          />

          {/* Info Panel */}
          <View style={[styles.infoPanel, { backgroundColor: theme.surface, borderTopColor: theme.surfaceBorder }]}>
            <View style={styles.infoPanelRow}>
              <MaterialIcons name="location-on" size={15} color={theme.accentBlue} />
              <Text style={[styles.infoPanelText, { color: theme.textSecondary }]}>
                {language === 'mr' ? 'केंद्र: आळंदी म्हातोबाची' : 'Center: Alandi Mhatobachi'}
              </Text>
              <View style={[styles.windyBadge, { backgroundColor: '#00E5FF18', borderColor: '#00E5FF50' }]}>
                <MaterialIcons name="radar" size={10} color="#00E5FF" />
                <Text style={[styles.windyBadgeText, { color: '#00E5FF' }]}>Windy.com</Text>
              </View>
            </View>
          </View>
        </>
      ) : (
        /* ── IMD SATELLITE SECTION ── */
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
  sectionToggleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 9, borderRadius: 8, borderWidth: 1, borderColor: 'transparent',
  },
  sectionToggleLabel: { fontSize: 12, fontWeight: '600' },

  layerBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingLeft: 12, borderBottomWidth: 1, gap: 8,
  },
  layerBarTitle: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, flexShrink: 0 },
  layerScroll: { flexDirection: 'row', gap: 8, paddingRight: 12 },
  layerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 11, paddingVertical: 7, borderRadius: 20, borderWidth: 1,
  },
  layerLabel: { fontSize: 12, fontWeight: '600' },

  infoPanel: { paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1 },
  infoPanelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoPanelText: { fontSize: 13, fontWeight: '500', flex: 1 },
  windyBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, borderWidth: 1,
  },
  windyBadgeText: { fontSize: 9, fontWeight: '700' },
});
