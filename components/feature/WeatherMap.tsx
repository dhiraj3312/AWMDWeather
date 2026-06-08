// Native implementation — react-native-maps with OWM tiles + Windy WebView
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Platform, StatusBar } from 'react-native';
import MapView, { UrlTile, Marker } from 'react-native-maps';
import { WebView } from 'react-native-webview';
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

function WindyView({ lat, lon, isFullscreen }: { lat: number; lon: number; isFullscreen: boolean }) {
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
    <View style={[styles.windyContainer, isFullscreen && styles.windyContainerFullscreen]}>
      <WebView
        source={{ uri: windyUrl }}
        style={styles.windyWebView}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        renderLoading={() => (
          <View style={[styles.windyLoading, { backgroundColor: theme.background }]}>
            <MaterialIcons name="wind-power" size={40} color={theme.accentCyan} />
            <Text style={[styles.windyLoadingText, { color: theme.textSecondary }]}>
              Loading Windy...
            </Text>
          </View>
        )}
      />
    </View>
  );
}

function MapContent({
  activeLayer,
  activeLayerConfig,
  tileUrl,
  mapRegion,
  activeLocation,
  getLayerColor,
  isFullscreen,
  onToggleFullscreen,
  isWindy,
}: Props & { isFullscreen: boolean; onToggleFullscreen: () => void }) {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const layerColor = isWindy ? theme.accentCyan : getLayerColor(activeLayer);

  const lat = activeLocation?.lat ?? CONFIG.DEFAULT_LOCATION.lat;
  const lon = activeLocation?.lon ?? CONFIG.DEFAULT_LOCATION.lon;

  return (
    <View style={styles.mapContainer}>
      {isWindy ? (
        <WindyView lat={lat} lon={lon} isFullscreen={isFullscreen} />
      ) : (
        <MapView
          style={styles.map}
          initialRegion={mapRegion}
          mapType="satellite"
          showsUserLocation={true}
          showsMyLocationButton={true}
          showsCompass={true}
          showsScale={true}
          rotateEnabled={true}
          zoomEnabled={true}
          scrollEnabled={true}
        >
          <UrlTile
            urlTemplate={tileUrl}
            maximumZ={12}
            minimumZ={3}
            flipY={false}
            opacity={0.7}
          />
          {activeLocation ? (
            <Marker
              coordinate={{ latitude: activeLocation.lat, longitude: activeLocation.lon }}
              title={activeLocation.name}
              description={language === 'mr' ? 'AWMD निरीक्षण केंद्र' : 'AWMD Observation Point'}
              pinColor={layerColor}
            />
          ) : null}
        </MapView>
      )}

      {/* Layer Info Overlay — top left */}
      <View style={[styles.layerInfo, { backgroundColor: theme.surface + 'EE', borderColor: theme.surfaceBorder }]}>
        <View style={styles.layerInfoRow}>
          <View style={[styles.layerActiveDot, { backgroundColor: layerColor }]} />
          <Text style={[styles.layerInfoText, { color: theme.textPrimary }]}>
            {isWindy
              ? 'Windy'
              : (language === 'mr' ? activeLayerConfig?.labelMr : activeLayerConfig?.label)}
          </Text>
        </View>
        <Text style={[styles.layerInfoSub, { color: theme.textTertiary }]}>
          {isWindy ? 'windy.com' : 'OpenWeatherMap'}
        </Text>
      </View>

      {/* Fullscreen toggle — top right */}
      <Pressable
        onPress={onToggleFullscreen}
        style={({ pressed }) => [
          styles.fullscreenBtn,
          { backgroundColor: theme.surface + 'EE', borderColor: theme.surfaceBorder, opacity: pressed ? 0.75 : 1 },
        ]}
        hitSlop={8}
      >
        <MaterialIcons
          name={isFullscreen ? 'fullscreen-exit' : 'fullscreen'}
          size={22}
          color={theme.textPrimary}
        />
      </Pressable>

      {/* Attribution */}
      {!isWindy ? (
        <View style={[styles.attribution, { backgroundColor: theme.surface + 'CC' }]}>
          <Text style={[styles.attributionText, { color: theme.textTertiary }]}>
            © OpenWeatherMap | © OpenStreetMap
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

      <Modal
        visible={isFullscreen}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={toggle}
        hardwareAccelerated
      >
        <View
          style={[
            styles.fullscreenModal,
            { backgroundColor: '#000', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : insets.top },
          ]}
        >
          <MapContent {...props} isFullscreen={true} onToggleFullscreen={toggle} />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  mapContainer: { flex: 1, position: 'relative' },
  map: { ...StyleSheet.absoluteFillObject },

  windyContainer: { flex: 1, overflow: 'hidden' },
  windyContainerFullscreen: { flex: 1 },
  windyWebView: { flex: 1 },
  windyLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  windyLoadingText: { fontSize: 14 },

  layerInfo: {
    position: 'absolute', top: 12, left: 12,
    borderRadius: 10, padding: 10, borderWidth: 1, gap: 3,
  },
  layerInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  layerActiveDot: { width: 8, height: 8, borderRadius: 4 },
  layerInfoText: { fontSize: 13, fontWeight: '600' },
  layerInfoSub: { fontSize: 10 },
  fullscreenBtn: {
    position: 'absolute', top: 12, right: 12,
    width: 40, height: 40, borderRadius: 10,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  attribution: { position: 'absolute', bottom: 4, right: 8, borderRadius: 4, padding: 4 },
  attributionText: { fontSize: 9 },
  fullscreenModal: { flex: 1 },
});
