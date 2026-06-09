// Native — react-native-webview embedding Windy.com
// SDK 53 compatible, new-arch safe (newArchEnabled: false)
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { CONFIG } from '@/constants/config';

// Lazy-require WebView so Metro doesn't bundle it on web
let WebView: any = null;
try {
  WebView = require('react-native-webview').WebView;
} catch {
  WebView = null;
}

interface LayerConfig {
  label: string;
  labelMr: string;
  windyOverlay: string;
  windyProduct: string;
}

interface Props {
  activeLayer: string;
  activeLayerConfig?: LayerConfig;
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
  // Build manually to avoid URLSearchParams encoding issues on older Android
  const base = CONFIG.WINDY_EMBED_BASE;
  return (
    `${base}?lat=${lat}&lon=${lon}&zoom=${zoom}` +
    `&level=surface&overlay=${overlay}&product=${product}` +
    `&menu=&message=true&marker=true&calendar=now` +
    `&pressure=&type=map&location=coordinates&detail=` +
    `&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1`
  );
}

// Fallback when WebView is unavailable (open in browser)
function MapFallback({
  windyUrl,
  layerColor,
  layerName,
  language,
}: {
  windyUrl: string;
  layerColor: string;
  layerName: string;
  language: string;
}) {
  const { theme } = useTheme();
  return (
    <View style={[styles.fallback, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
      <MaterialCommunityIcons name="radar" size={48} color={layerColor} />
      <Text style={[styles.fallbackTitle, { color: theme.textPrimary }]}>{layerName}</Text>
      <Text style={[styles.fallbackSub, { color: theme.textSecondary }]}>
        {language === 'mr'
          ? 'नकाशा उघडण्यासाठी खालील बटण दाबा'
          : 'Tap below to open the map'}
      </Text>
      <Pressable
        style={({ pressed }) => [
          styles.fallbackBtn,
          { backgroundColor: layerColor, opacity: pressed ? 0.8 : 1 },
        ]}
        onPress={() => Linking.openURL(windyUrl)}
      >
        <MaterialIcons name="open-in-new" size={18} color="#000" />
        <Text style={styles.fallbackBtnText}>
          {language === 'mr' ? 'Windy.com उघडा' : 'Open Windy.com'}
        </Text>
      </Pressable>
    </View>
  );
}

interface ContentProps extends Props {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

function MapContent(props: ContentProps) {
  const { activeLayer, activeLayerConfig, mapRegion, activeLocation, getLayerColor, isFullscreen, onToggleFullscreen } = props;
  const { theme } = useTheme();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [webViewError, setWebViewError] = useState(false);

  const lat = activeLocation?.lat ?? mapRegion.latitude;
  const lon = activeLocation?.lon ?? mapRegion.longitude;
  const overlay = activeLayerConfig?.windyOverlay ?? 'rain';
  const product = activeLayerConfig?.windyProduct ?? 'ecmwf';
  const windyUrl = buildWindyUrl(lat, lon, overlay, product, isFullscreen ? 8 : 7);
  const layerColor = getLayerColor(activeLayer);
  const layerName = language === 'mr' ? (activeLayerConfig?.labelMr ?? activeLayer) : (activeLayerConfig?.label ?? activeLayer);

  const handleLoadEnd = useCallback(() => setLoading(false), []);
  const handleError = useCallback(() => {
    setLoading(false);
    setWebViewError(true);
  }, []);

  return (
    <View style={[styles.mapContainer, isFullscreen && styles.mapFull]}>

      {/* Header bar */}
      <View style={[styles.topBar, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
        <View style={[styles.layerDot, { backgroundColor: layerColor }]} />
        <Text style={[styles.layerName, { color: layerColor }]}>{layerName}</Text>
        <View style={[styles.windyBadge, { backgroundColor: layerColor + '20', borderColor: layerColor + '50' }]}>
          <MaterialIcons name="radar" size={11} color={layerColor} />
          <Text style={[styles.windyBadgeText, { color: layerColor }]}>Windy.com</Text>
        </View>
        <Pressable
          onPress={onToggleFullscreen}
          hitSlop={10}
          style={({ pressed }) => [styles.fsBtn, { backgroundColor: layerColor + '20', opacity: pressed ? 0.7 : 1 }]}
        >
          <MaterialIcons
            name={isFullscreen ? 'fullscreen-exit' : 'fullscreen'}
            size={22}
            color={layerColor}
          />
        </Pressable>
      </View>

      {/* Map area */}
      <View style={styles.webviewContainer}>
        {WebView && !webViewError ? (
          <WebView
            key={`${windyUrl}_${isFullscreen}`}
            source={{ uri: windyUrl }}
            style={styles.webview}
            onLoadEnd={handleLoadEnd}
            onError={handleError}
            onHttpError={handleError}
            allowsInlineMediaPlayback
            javaScriptEnabled
            domStorageEnabled
            mixedContentMode="compatibility"
            originWhitelist={['*']}
            // Required for Android SDK 53 stability
            setSupportMultipleWindows={false}
            androidLayerType="hardware"
            cacheEnabled={false}
            thirdPartyCookiesEnabled={true}
          />
        ) : (
          <MapFallback
            windyUrl={windyUrl}
            layerColor={layerColor}
            layerName={layerName}
            language={language}
          />
        )}

        {loading && WebView && !webViewError ? (
          <View style={[styles.loadingOverlay, { backgroundColor: theme.background + 'CC' }]}>
            <ActivityIndicator size="large" color={layerColor} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              {language === 'mr' ? 'Windy नकाशा लोड होत आहे...' : 'Loading Windy map...'}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export default function WeatherMap(props: Props) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const toggle = useCallback(() => setIsFullscreen((v) => !v), []);

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
              paddingTop: Platform.OS === 'android' ? 0 : insets.top,
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
    overflow: 'hidden',
  },
  mapFull: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  layerDot: { width: 9, height: 9, borderRadius: 5 },
  layerName: { fontSize: 13, fontWeight: '700', flex: 1 },
  windyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  windyBadgeText: { fontSize: 10, fontWeight: '700' },
  fsBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webviewContainer: {
    flex: 1,
    position: 'relative',
  },
  webview: {
    flex: 1,
    backgroundColor: '#0A1628',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Fallback styles
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 32,
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  fallbackTitle: { fontSize: 18, fontWeight: '700' },
  fallbackSub: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  fallbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  fallbackBtnText: { fontSize: 15, fontWeight: '700', color: '#000' },
  fullscreenModal: { flex: 1 },
});
