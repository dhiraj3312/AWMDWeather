import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  FlatList,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWeather, SavedLocation } from '@/contexts/WeatherContext';
import { LocationResult } from '@/services/accuweather';

interface Props {
  showSearch?: boolean;
  showSettings?: boolean;
  onSettingsPress?: () => void;
}

export default function Header({ showSearch = true, showSettings = true, onSettingsPress }: Props) {
  const { theme, isDark, toggleTheme } = useTheme();
  const { t, language, setLanguage } = useLanguage();
  const { activeLocation, favorites, searchLocations, setActiveLocation, addFavorite, removeFavorite, useCurrentLocation } = useWeather();
  const insets = useSafeAreaInsets();

  const [searchVisible, setSearchVisible] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationResult[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (text: string) => {
    setQuery(text);
    if (text.length < 2) { setResults([]); return; }
    setSearching(true);
    const found = await searchLocations(text);
    setResults(found);
    setSearching(false);
  };

  const handleSelectLocation = (result: LocationResult) => {
    const loc: SavedLocation = {
      key: result.Key,
      name: result.LocalizedName,
      lat: result.GeoPosition?.Latitude ?? 0,
      lon: result.GeoPosition?.Longitude ?? 0,
      isFavorite: favorites.some((f) => f.key === result.Key),
    };
    setActiveLocation(loc);
    setSearchVisible(false);
    setQuery('');
    setResults([]);
  };

  const isFavorite = activeLocation ? favorites.some((f) => f.key === activeLocation.key) : false;

  const toggleFavorite = () => {
    if (!activeLocation) return;
    if (isFavorite) removeFavorite(activeLocation.key);
    else addFavorite(activeLocation);
  };

  return (
    <>
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.surface,
            paddingTop: insets.top + 8,
            borderBottomColor: theme.surfaceBorder,
          },
        ]}
      >
        {/* Left: Logo + Dept name */}
        <View style={styles.leftSection}>
          <View style={[styles.logoBadge, { backgroundColor: theme.primary }]}>
            <MaterialCommunityIcons name="weather-partly-rainy" size={16} color="#000" />
          </View>
          <View>
            <Text style={[styles.deptName, { color: theme.primary }]}>AWMD</Text>
            <Text style={[styles.deptSubtitle, { color: theme.textTertiary }]} numberOfLines={1}>
              {language === 'mr' ? 'आळंदी हवामान विभाग' : 'Alandi Met Dept.'}
            </Text>
          </View>
        </View>

        {/* Center: Location */}
        {activeLocation ? (
          <Pressable
            onPress={() => setSearchVisible(true)}
            style={styles.locationCenter}
            hitSlop={8}
          >
            <MaterialIcons name="location-on" size={14} color={theme.accentBlue} />
            <Text style={[styles.locationName, { color: theme.textPrimary }]} numberOfLines={1}>
              {activeLocation.name}
            </Text>
            <MaterialIcons name="keyboard-arrow-down" size={16} color={theme.textSecondary} />
          </Pressable>
        ) : null}

        {/* Right: Actions */}
        <View style={styles.rightSection}>
          <Pressable
            onPress={() => setLanguage(language === 'mr' ? 'en' : 'mr')}
            style={[styles.iconBtn, { backgroundColor: theme.surfaceElevated }]}
            hitSlop={8}
          >
            <Text style={[styles.langText, { color: theme.textSecondary }]}>
              {language === 'mr' ? 'EN' : 'मर'}
            </Text>
          </Pressable>
          <Pressable
            onPress={toggleTheme}
            style={[styles.iconBtn, { backgroundColor: theme.surfaceElevated }]}
            hitSlop={8}
          >
            <MaterialIcons name={isDark ? 'light-mode' : 'dark-mode'} size={18} color={theme.textSecondary} />
          </Pressable>
          {showSearch ? (
            <Pressable
              onPress={() => setSearchVisible(true)}
              style={[styles.iconBtn, { backgroundColor: theme.surfaceElevated }]}
              hitSlop={8}
            >
              <MaterialIcons name="search" size={18} color={theme.textSecondary} />
            </Pressable>
          ) : null}
          {activeLocation ? (
            <Pressable onPress={toggleFavorite} style={styles.iconBtn} hitSlop={8}>
              <MaterialIcons
                name={isFavorite ? 'star' : 'star-outline'}
                size={20}
                color={isFavorite ? theme.primary : theme.textSecondary}
              />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Search Modal */}
      <Modal visible={searchVisible} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
          <View style={[styles.searchModal, { backgroundColor: theme.surface, paddingTop: insets.top + 16 }]}>
            {/* Search bar */}
            <View style={styles.searchBarRow}>
              <View style={[styles.searchInput, { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder }]}>
                <MaterialIcons name="search" size={20} color={theme.textSecondary} />
                <TextInput
                  style={[styles.searchText, { color: theme.textPrimary }]}
                  placeholder={t.searchPlaceholder}
                  placeholderTextColor={theme.textTertiary}
                  value={query}
                  onChangeText={handleSearch}
                  autoFocus
                  returnKeyType="search"
                />
                {searching ? <ActivityIndicator size="small" color={theme.primary} /> : null}
              </View>
              <Pressable onPress={() => { setSearchVisible(false); setQuery(''); setResults([]); }} style={styles.cancelBtn}>
                <Text style={{ color: theme.primary, fontWeight: '600', fontSize: 15 }}>
                  {language === 'mr' ? 'रद्द करा' : 'Cancel'}
                </Text>
              </Pressable>
            </View>

            {/* Current location button */}
            <Pressable
              style={[styles.currentLocBtn, { borderColor: theme.surfaceBorder }]}
              onPress={() => { useCurrentLocation(); setSearchVisible(false); }}
            >
              <MaterialIcons name="my-location" size={20} color={theme.accentBlue} />
              <Text style={[styles.currentLocText, { color: theme.accentBlue }]}>{t.currentLocation}</Text>
            </Pressable>

            {/* Favorites */}
            {favorites.length > 0 ? (
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: theme.textTertiary }]}>{t.favorites}</Text>
                {favorites.map((fav) => (
                  <Pressable
                    key={fav.key}
                    style={({ pressed }) => [
                      styles.resultItem,
                      { backgroundColor: pressed ? theme.surfaceElevated : 'transparent' },
                    ]}
                    onPress={() => { setActiveLocation(fav); setSearchVisible(false); }}
                  >
                    <MaterialIcons name="star" size={16} color={theme.primary} />
                    <Text style={[styles.resultName, { color: theme.textPrimary }]}>{fav.name}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            {/* Search results */}
            {results.length > 0 ? (
              <FlatList
                data={results}
                keyExtractor={(item) => item.Key}
                renderItem={({ item }) => (
                  <Pressable
                    style={({ pressed }) => [
                      styles.resultItem,
                      { backgroundColor: pressed ? theme.surfaceElevated : 'transparent' },
                    ]}
                    onPress={() => handleSelectLocation(item)}
                  >
                    <MaterialIcons name="location-on" size={16} color={theme.textSecondary} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.resultName, { color: theme.textPrimary }]}>{item.LocalizedName}</Text>
                      <Text style={[styles.resultSub, { color: theme.textTertiary }]}>
                        {item.AdministrativeArea?.LocalizedName}, {item.Country?.LocalizedName}
                      </Text>
                    </View>
                  </Pressable>
                )}
                style={{ flex: 1 }}
              />
            ) : null}

            {query.length > 1 && results.length === 0 && !searching ? (
              <Text style={[styles.noResults, { color: theme.textTertiary }]}>{t.noResults}</Text>
            ) : null}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deptName: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  deptSubtitle: {
    fontSize: 9,
    letterSpacing: 0.5,
  },
  locationCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  locationName: {
    fontSize: 14,
    fontWeight: '600',
    maxWidth: 120,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langText: {
    fontSize: 11,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
  },
  searchModal: {
    flex: 1,
    paddingHorizontal: 16,
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    gap: 8,
  },
  searchText: {
    flex: 1,
    fontSize: 16,
  },
  cancelBtn: {
    paddingVertical: 8,
  },
  currentLocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  currentLocText: {
    fontSize: 15,
    fontWeight: '500',
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  resultName: {
    fontSize: 15,
    fontWeight: '500',
  },
  resultSub: {
    fontSize: 12,
    marginTop: 2,
  },
  noResults: {
    textAlign: 'center',
    marginTop: 48,
    fontSize: 15,
  },
});
