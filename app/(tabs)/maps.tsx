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
  const [activeLayer, setActiveLayer] = useState('satrad');

  const layers = CONFIG.MAP_LAYERS;
  const activeLayerConfig = layers.find((l) => l.id === activeLayer);
  const tileUrl = `${CONFIG.MAPS_TILE_URL}?apikey=${CONFIG.API_KEY}&layer=${activeLayer}&zoom={z}&x={x}&y={y}`;

  const mapRegion = activeLocation?.lat
    ? {
        latitude: activeLocation.lat,
        longitude: activeLocation.lon,
        latitudeDelta: 1.2,
        longitudeDelta: 1.2,
      }
    : ALANDI_REGION;

  const getLayerIcon = (id: string) => {
    switch (id) {
      case 'sat': return { name: 'satellite', lib: 'material' };
      case 'satrad': return { name: 'radar', lib: 'material' };
      case 'stormsurf_rainrate': return { name: 'weather-rainy', lib: 'community' };
      case 'wind': return { name: 'weather-windy', lib: 'community' };
      case 'clouds': return { name: 'cloud', lib: 'material' };
      case 'lightning': return { name: 'weather-lightning', lib: 'community' };
      default: return { name: 'layers', lib: 'material' };
    }
  };

  const getLayerColor = (id: string) => {
    switch (id) {
      case 'sat': return theme.textSecondary;
      case 'satrad': return theme.accentBlue;
      case 'stormsurf_rainrate': return '#42A5F5';
      case 'wind': return theme.accentCyan;
      case 'clouds': return '#90A4AE';
      case 'lightning': return theme.alertYellow;
      default: return theme.textSecondary;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header />

      {/* Layer Selector */}
      <View style={[styles.layerBar, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
        <Text style={[styles.layerBarTitle, { color: theme.textTertiary }]}>
          {t.selectLayer}:
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.layerScroll}>
          {layers.map((layer) => {
            const isActive = layer.id === activeLayer;
            const icon = getLayerIcon(layer.id);
            const color = getLayerColor(layer.id);
            return (
              <Pressable
                key={layer.id}
                style={({ pressed }) => [
                  styles.layerBtn,
                  {
                    backgroundColor: isActive ? color + '30' : theme.surfaceElevated,
                    borderColor: isActive ? color : theme.surfaceBorder,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                onPress={() => setActiveLayer(layer.id)}
              >
                {icon.lib === 'community' ? (
                  <MaterialCommunityIcons name={icon.name as any} size={16} color={isActive ? color : theme.textTertiary} />
                ) : (
                  <MaterialIcons name={icon.name as any} size={16} color={isActive ? color : theme.textTertiary} />
                )}
                <Text style={[styles.layerLabel, { color: isActive ? color : theme.textTertiary }]}>
                  {language === 'mr' ? layer.labelMr : layer.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Map - platform-specific component */}
      <WeatherMap
        activeLayer={activeLayer}
        activeLayerConfig={activeLayerConfig}
        tileUrl={tileUrl}
        mapRegion={mapRegion}
        activeLocation={activeLocation ? { lat: activeLocation.lat, lon: activeLocation.lon, name: activeLocation.name } : null}
        getLayerColor={getLayerColor}
      />

      {/* AWMD Info Panel */}
      <View style={[styles.infoPanel, { backgroundColor: theme.surface, borderTopColor: theme.surfaceBorder }]}>
        <View style={styles.infoPanelRow}>
          <MaterialIcons name="location-on" size={16} color={theme.accentBlue} />
          <Text style={[styles.infoPanelText, { color: theme.textSecondary }]}>
            {language === 'mr' ? 'केंद्र: आळंदी म्हातोबाची' : 'Center: Alandi Mhatobachi'}
          </Text>
        </View>
        <View style={styles.infoPanelRow}>
          <MaterialIcons name="info-outline" size={14} color={theme.textTertiary} />
          <Text style={[styles.infoPanelSub, { color: theme.textTertiary }]}>
            {language === 'mr'
              ? 'W/NW/SW → E/ESE ढग हालचाल | सासवड क्षेत्रातून ढग विकास'
              : 'W/NW/SW → E/ESE cloud movement | Development from Saswad sector'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  layerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingLeft: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  layerBarTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    flexShrink: 0,
  },
  layerScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 12,
  },
  layerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  layerLabel: {
    fontSize: 12,
    fontWeight: '600',
  },


  infoPanel: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 4,
  },
  infoPanelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoPanelText: { fontSize: 13, fontWeight: '500' },
  infoPanelSub: { fontSize: 11, flex: 1, lineHeight: 16 },
});
