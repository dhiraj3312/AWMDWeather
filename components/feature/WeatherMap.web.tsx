// Web fallback — react-native-maps not supported on web; Windy uses iframe
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { CONFIG } from '@/constants/config';

interface Props {
  activeLayer: string;
  activeLayerConfig?: { label: string; labelMr: string } | undefined;
  tileUrl: string;
  mapRegion: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number };
  activeLocation: { lat: number; lon: number; name: string } | null;
  getLayerColor: (id: string) => string;
  isWindy?: boolean;
}

function WindyFrame({ lat, lon, isFullscreen }: { lat: number; lon: number; isFullscreen: boolean }) {
  const { theme } = useTheme();
  const windyUrl =
    `https://embed.windy.com/embed2.html` +
    `?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}` +
    `&detailLat=${lat.toFixed(4)}&detailLon=${lon.toFixed(4)}` +
    `&zoom=9&level=surface&overlay=wind&product=ecmwf` +
    `&menu=&message=true&marker=true&calendar=now` +
    `&pressure=true&type=map&location=coordinates` +
    `&detail=true&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1`;

  return (
    <View style={[styles.windyFrame, isFullscreen && styles.windyFrameFullscreen]}>
      {/*
        // @ts-ignore — iframe valid in web env
      */}
      <iframe
        src={windyUrl}
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="AWMD Windy Weather Map"
        allow="geolocation"
      />
    </View>
  );
}

function MapContent({
  activeLayer,
  activeLayerConfig,
  activeLocation,
  getLayerColor,
  isFullscreen,
  onToggleFullscreen,
  isWindy,
}: Props & { isFullscreen: boolean; onToggleFullscreen: () => void }) {
  const { theme } = useTheme();
  const { language } = useLanguage();

  const lat = activeLocation?.lat ?? CONFIG.DEFAULT_LOCATION.lat;
  const lon = activeLocation?.lon ?? CONFIG.DEFAULT_LOCATION.lon;
  const layerColor = isWindy ? theme.accentCyan : getLayerColor(activeLayer);
  const layerName = isWindy
    ? 'Windy'
    : (language === 'mr' ? activeLayerConfig?.labelMr : activeLayerConfig?.label);

  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 1},${lat - 1},${lon + 1},${lat + 1}&layer=mapnik&marker=${lat},${lon}`;

  return (
    <View style={[styles.container, isFullscreen && styles.containerFullscreen]}>
      {/* Layer Badge + Fullscreen */}
      <View style={[styles.layerBadge, { backgroundColor: layerColor + '20', borderColor: layerColor }]}>
        <View style={[styles.activeDot, { backgroundColor: layerColor }]} />
        <Text style={[styles.layerBadgeText, { color: layerColor }]}>
          {layerName} {isWindy ? '' : (language === 'mr' ? 'नकाशा' : 'Map')}
        </Text>
        <Pressable
          onPress={onToggleFullscreen}
          hitSlop={8}
          style={({ pressed }) => [styles.fsBtn, { backgroundColor: layerColor + '30', opacity: pressed ? 0.7 : 1 }]}
        >
          <MaterialIcons name={isFullscreen ? 'fullscreen-exit' : 'fullscreen'} size={18} color={layerColor} />
        </Pressable>
      </View>

      {/* Map frame */}
      <View style={[styles.mapFrame, { borderColor: theme.surfaceBorder }, isFullscreen && styles.mapFrameFullscreen]}>
        {isWindy ? (
          <WindyFrame lat={lat} lon={lon} isFullscreen={isFullscreen} />
        ) : (
          <>
            {/*
              // @ts-ignore — iframe valid in web env
            */}
            <iframe
              src={osmUrl}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="AWMD Weather Map"
              sandbox="allow-scripts allow-same-origin"
            />

            {/* Overlay info */}
            <View style={[styles.overlayInfo, { backgroundColor: theme.surface + 'D0', borderColor: theme.surfaceBorder }]}>
              <MaterialIcons name="location-on" size={13} color={theme.accentBlue} />
              <Text style={[styles.overlayText, { color: theme.textSecondary }]}>
                {activeLocation?.name ?? CONFIG.DEFAULT_LOCATION.name}
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Info note — hide in fullscreen */}
      {!isFullscreen ? (
        <View style={[styles.noteCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder }]}>
          <MaterialIcons name="info-outline" size={16} color={isWindy ? theme.accentCyan : theme.primary} />
          <Text style={[styles.noteText, { color: theme.textSecondary }]}>
            {isWindy
              ? (language === 'mr'
                ? 'Windy.com थेट हवामान नकाशा — वारा, पाऊस, ढग आणि अधिक पाहा'
                : 'Live Windy.com weather map — view wind, rain, clouds and more')
              : (language === 'mr'
                ? `${layerName} थर Android/iOS वर OpenWeatherMap द्वारे. वेब वर OpenStreetMap दाखवला आहे.`
                : `${layerName} layer by OpenWeatherMap on Android/iOS. Showing OpenStreetMap base on web.`)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export default function WeatherMap(props: Props) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const toggle = () => setIsFullscreen((v) => !v);

  return (
    <>
      {!isFullscreen ? (
        <MapContent {...props} isFullscreen={false} onToggleFullscreen={toggle} />
      ) : null}

      <Modal visible={isFullscreen} animationType="fade" transparent={false} onRequestClose={toggle}>
        <View style={[styles.fullscreenModal, { backgroundColor: theme.background, paddingTop: insets.top }]}>
          <MapContent {...props} isFullscreen={true} onToggleFullscreen={toggle} />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  containerFullscreen: { flex: 1 },
  layerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    alignSelf: 'flex-start', margin: 12,
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1,
  },
  activeDot: { width: 8, height: 8, borderRadius: 4 },
  layerBadgeText: { fontSize: 13, fontWeight: '700', flex: 1 },
  fsBtn: { width: 28, height: 28, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  mapFrame: {
    flex: 1, marginHorizontal: 12, borderRadius: 16,
    overflow: 'hidden', borderWidth: 1, position: 'relative',
  },
  mapFrameFullscreen: { marginHorizontal: 0, borderRadius: 0 },
  windyFrame: { flex: 1 },
  windyFrameFullscreen: { flex: 1 },
  overlayInfo: {
    position: 'absolute', top: 8, right: 8,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    padding: 7, borderRadius: 8, borderWidth: 1,
  },
  overlayText: { fontSize: 12, fontWeight: '500' },
  noteCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    margin: 12, padding: 12, borderRadius: 12, borderWidth: 1,
  },
  noteText: { flex: 1, fontSize: 12, lineHeight: 18 },
  fullscreenModal: { flex: 1 },
});
