// Native implementation — uses react-native-maps with fullscreen support
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Platform, StatusBar } from 'react-native';
import MapView, { UrlTile, Marker } from 'react-native-maps';
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
}: Props & { isFullscreen: boolean; onToggleFullscreen: () => void }) {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const layerColor = getLayerColor(activeLayer);

  return (
    <View style={styles.mapContainer}>
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

      {/* Layer Info Overlay — top left */}
      <View style={[styles.layerInfo, { backgroundColor: theme.surface + 'EE', borderColor: theme.surfaceBorder }]}>
        <View style={styles.layerInfoRow}>
          <View style={[styles.layerActiveDot, { backgroundColor: layerColor }]} />
          <Text style={[styles.layerInfoText, { color: theme.textPrimary }]}>
            {language === 'mr' ? activeLayerConfig?.labelMr : activeLayerConfig?.label}
          </Text>
        </View>
        <Text style={[styles.layerInfoSub, { color: theme.textTertiary }]}>
          {language === 'mr' ? 'AccuWeather डेटा' : 'AccuWeather Data'}
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
      <View style={[styles.attribution, { backgroundColor: theme.surface + 'CC' }]}>
        <Text style={[styles.attributionText, { color: theme.textTertiary }]}>
          © AccuWeather | © OpenStreetMap
        </Text>
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
      {/* Normal mode */}
      {!isFullscreen ? (
        <MapContent {...props} isFullscreen={false} onToggleFullscreen={toggle} />
      ) : null}

      {/* Fullscreen Modal */}
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
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
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
  attribution: {
    position: 'absolute',
    bottom: 4,
    right: 8,
    borderRadius: 4,
    padding: 4,
  },
  attributionText: { fontSize: 9 },
  fullscreenModal: {
    flex: 1,
  },
});
