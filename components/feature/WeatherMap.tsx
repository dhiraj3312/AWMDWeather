// Native — uses react-native-webview to embed Windy.com radar/weather maps
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { CONFIG } from '@/constants/config';

interface Props {
  activeLayer: string;
  activeLayerConfig?: { label: string; labelMr: string; windyOverlay: string; windyProduct: string } | undefined;
  mapRegion: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number };
  activeLocation: { lat: number; lon: number; name: string } | null;
  getLayerColor: (id: string) => string;
}

function buildWindyUrl(
  lat: number,
  lon: number,
  overlay: string,
  product: string,
  zoom = 7
): string {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    zoom: String(zoom),
    level: 'surface',
    overlay,
    product,
    menu: '',
    message: 'true',
    marker: 'true',
    calendar: 'now',
    pressure: '',
    type: 'map',
    location: 'coordinates',
    detail: '',
    metricWind: 'km%2Fh',
    metricTemp: '%C2%B0C',
    radarRange: '-1',
  });
  return `${CONFIG.WINDY_EMBED_BASE}?${params.toString()}`;
}

function MapContent({
  activeLayer,
  activeLayerConfig,
  mapRegion,
  activeLocation,
  getLayerColor,
  isFullscreen,
  onToggleFullscreen,
}: Props & { isFullscreen: boolean; onToggleFullscreen: () => void }) {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const [webLoading, setWebLoading] = useState(true);

  const lat = activeLocation?.lat ?? mapRegion.latitude;
  const lon = activeLocation?.lon ?? mapRegion.longitude;
  const overlay = activeLayerConfig?.windyOverlay ?? 'rain';
  const product = activeLayerConfig?.windyProduct ?? 'ecmwf';
  const windyUrl = buildWindyUrl(lat, lon, overlay, product, isFullscreen ? 8 : 7);
  const layerColor = getLayerColor(activeLayer);
  const layerName = language === 'mr' ? activeLayerConfig?.labelMr : activeLayerConfig?.label;

  return (
    <View style={[styles.mapContainer, isFullscreen && styles.mapContainerFullscreen]}>
      <WebView
        source={{ uri: windyUrl }}
        style={styles.webview}
        onLoadStart={() => setWebLoading(true)}
        onLoadEnd={() => setWebLoading(false)}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState={false}
        mixedContentMode="compatibility"
        originWhitelist={['*']}
      />

      {webLoading ? (
        <View style={[styles.loadingOverlay, { backgroundColor: theme.background + 'CC' }]}>
          <ActivityIndicator size="large" color={layerColor} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            {language === 'mr' ? 'Windy नकाशा लोड होत आहे...' : 'Loading Windy map...'}
          </Text>
        </View>
      ) : null}

      {/* Layer info — top left */}
      <View
        style={[styles.layerInfo, { backgroundColor: theme.surface + 'EE', borderColor: theme.surfaceBorder }]}
        pointerEvents="none"
      >
        <View style={styles.layerInfoRow}>
          <View style={[styles.layerActiveDot, { backgroundColor: layerColor }]} />
          <Text style={[styles.layerInfoText, { color: theme.textPrimary }]}>{layerName}</Text>
        </View>
        <Text style={[styles.layerInfoSub, { color: theme.textTertiary }]}>
          Windy.com
        </Text>
      </View>

      {/* Fullscreen toggle — top right */}
      <Pressable
        onPress={onToggleFullscreen}
        style={({ pressed }) => [
          styles.fullscreenBtn,
          {
            backgroundColor: theme.surface + 'EE',
            borderColor: theme.surfaceBorder,
            opacity: pressed ? 0.75 : 1,
          },
        ]}
        hitSlop={8}
      >
        <MaterialIcons
          name={isFullscreen ? 'fullscreen-exit' : 'fullscreen'}
          size={22}
          color={theme.textPrimary}
        />
      </Pressable>
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
            {
              backgroundColor: '#000',
              paddingTop:
                Platform.OS === 'android'
                  ? StatusBar.currentHeight ?? 0
                  : insets.top,
            },
          ]}
        >
          <MapContent {...props} isFullscreen={true} onToggleFullscreen={toggle} />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  mapContainerFullscreen: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  layerInfo: {
    position: 'absolute',
    top: 12,
    left: 12,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    gap: 3,
  },
  layerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  layerActiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  layerInfoText: {
    fontSize: 13,
    fontWeight: '600',
  },
  layerInfoSub: {
    fontSize: 10,
  },
  fullscreenBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenModal: {
    flex: 1,
  },
});
