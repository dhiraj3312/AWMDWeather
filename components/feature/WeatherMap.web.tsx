// Web — uses iframe to embed Windy.com radar/weather maps
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
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
  return (
    `${CONFIG.WINDY_EMBED_BASE}` +
    `?lat=${lat}&lon=${lon}&zoom=${zoom}` +
    `&level=surface&overlay=${overlay}&product=${product}` +
    `&menu=&message=true&marker=true&calendar=now` +
    `&pressure=&type=map&location=coordinates&detail=` +
    `&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1`
  );
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

  const lat = activeLocation?.lat ?? mapRegion.latitude;
  const lon = activeLocation?.lon ?? mapRegion.longitude;
  const overlay = activeLayerConfig?.windyOverlay ?? 'rain';
  const product = activeLayerConfig?.windyProduct ?? 'ecmwf';
  const windyUrl = buildWindyUrl(lat, lon, overlay, product, isFullscreen ? 8 : 7);
  const layerColor = getLayerColor(activeLayer);
  const layerName = language === 'mr' ? activeLayerConfig?.labelMr : activeLayerConfig?.label;

  return (
    <View style={[styles.container, isFullscreen && styles.containerFullscreen]}>
      {/* Layer badge + fullscreen toggle */}
      <View style={[styles.topBar, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
        <View style={[styles.layerDot, { backgroundColor: layerColor }]} />
        <Text style={[styles.layerName, { color: layerColor }]}>{layerName}</Text>
        <View style={[styles.windyBadge, { backgroundColor: layerColor + '18', borderColor: layerColor + '50' }]}>
          <MaterialIcons name="radar" size={11} color={layerColor} />
          <Text style={[styles.windyBadgeText, { color: layerColor }]}>Windy.com</Text>
        </View>
        <Pressable
          onPress={onToggleFullscreen}
          hitSlop={8}
          style={({ pressed }) => [
            styles.fsBtn,
            { backgroundColor: layerColor + '20', opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <MaterialIcons
            name={isFullscreen ? 'fullscreen-exit' : 'fullscreen'}
            size={20}
            color={layerColor}
          />
        </Pressable>
      </View>

      {/* Windy iframe */}
      <View style={[styles.iframeWrapper, isFullscreen && styles.iframeWrapperFullscreen]}>
        {/*
          // @ts-ignore — iframe valid in web
        */}
        <iframe
          src={windyUrl}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title={`AWMD ${layerName} Map`}
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-popups"
        />
      </View>
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
        transparent={false}
        onRequestClose={toggle}
      >
        <View
          style={[
            styles.fullscreenModal,
            { backgroundColor: theme.background, paddingTop: insets.top },
          ]}
        >
          <MapContent {...props} isFullscreen={true} onToggleFullscreen={toggle} />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  containerFullscreen: { flex: 1 },
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
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iframeWrapper: {
    flex: 1,
    overflow: 'hidden' as any,
  },
  iframeWrapperFullscreen: {
    flex: 1,
  },
  fullscreenModal: { flex: 1 },
});
