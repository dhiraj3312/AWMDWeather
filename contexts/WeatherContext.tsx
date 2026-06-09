import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  accuWeatherService,
  CurrentConditions,
  HourlyForecast,
  DailyForecastResponse,
  WeatherAlert,
  LocationResult,
} from '@/services/accuweather';
import { generateAWMDAlerts, AWMDAlert } from '@/services/alertEngine';
import { scheduleWeatherAlert } from '@/services/notificationService';
import { CONFIG } from '@/constants/config';

export interface SavedLocation {
  key: string;
  name: string;
  lat: number;
  lon: number;
  isFavorite: boolean;
}

interface WeatherContextType {
  currentConditions: CurrentConditions | null;
  hourlyForecast: HourlyForecast[];
  dailyForecast: DailyForecastResponse | null;
  officialAlerts: WeatherAlert[];
  awmdAlerts: AWMDAlert[];
  activeLocation: SavedLocation | null;
  favorites: SavedLocation[];
  locationError: string | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
  setActiveLocation: (loc: SavedLocation) => void;
  searchLocations: (query: string) => Promise<LocationResult[]>;
  addFavorite: (loc: SavedLocation) => void;
  removeFavorite: (key: string) => void;
  useCurrentLocation: () => Promise<void>;
}

const WeatherContext = createContext<WeatherContextType | undefined>(undefined);

const FAVORITES_KEY = '@awmd_favorites';
const ACTIVE_LOC_KEY = '@awmd_active_location';

// Hardcoded fallback: Alandi / Pune area AccuWeather location key
// This prevents a double-API-call failure on first launch
const ALANDI_FALLBACK: SavedLocation = {
  key: '202396', // Alandi / Pune region AccuWeather key
  name: 'Alandi Mhatobachi',
  lat: CONFIG.DEFAULT_LOCATION.lat,
  lon: CONFIG.DEFAULT_LOCATION.lon,
  isFavorite: false,
};

export function WeatherProvider({ children }: { children: ReactNode }) {
  const [currentConditions, setCurrentConditions] = useState<CurrentConditions | null>(null);
  const [hourlyForecast, setHourlyForecast] = useState<HourlyForecast[]>([]);
  const [dailyForecast, setDailyForecast] = useState<DailyForecastResponse | null>(null);
  const [officialAlerts, setOfficialAlerts] = useState<WeatherAlert[]>([]);
  const [awmdAlerts, setAwmdAlerts] = useState<AWMDAlert[]>([]);

  const [activeLocation, setActiveLocationState] = useState<SavedLocation | null>(null);
  const [favorites, setFavorites] = useState<SavedLocation[]>([]);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fetchingRef = useRef(false);

  useEffect(() => {
    loadInitialData();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (activeLocation?.key) {
      intervalRef.current = setInterval(() => {
        fetchWeatherData(activeLocation.key, false);
      }, CONFIG.REFRESH_INTERVAL);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeLocation?.key]);

  const loadInitialData = async () => {
    try {
      const favsJson = await AsyncStorage.getItem(FAVORITES_KEY);
      if (favsJson) setFavorites(JSON.parse(favsJson));

      const activeJson = await AsyncStorage.getItem(ACTIVE_LOC_KEY);
      if (activeJson) {
        const loc: SavedLocation = JSON.parse(activeJson);
        if (loc?.key) {
          setActiveLocationState(loc);
          await fetchWeatherData(loc.key, true);
          return;
        }
      }

      // Try GPS first, fall back to hardcoded Alandi key
      await useCurrentLocation();
    } catch {
      await fetchWithFallbackKey();
    }
  };

  /** Use the hardcoded Alandi key directly — no geoposition API call needed */
  const fetchWithFallbackKey = async () => {
    try {
      // First try to resolve the key via geoposition (works on native)
      const locResult = await accuWeatherService.getLocationByGeoPosition(
        CONFIG.DEFAULT_LOCATION.lat,
        CONFIG.DEFAULT_LOCATION.lon
      );
      const loc: SavedLocation = {
        key: locResult.Key,
        name: locResult.LocalizedName || CONFIG.DEFAULT_LOCATION.name,
        lat: CONFIG.DEFAULT_LOCATION.lat,
        lon: CONFIG.DEFAULT_LOCATION.lon,
        isFavorite: false,
      };
      setActiveLocationState(loc);
      await fetchWeatherData(loc.key, true);
    } catch {
      // Ultimate fallback: use hardcoded Pune/Alandi key
      setActiveLocationState(ALANDI_FALLBACK);
      await fetchWeatherData(ALANDI_FALLBACK.key, true);
    }
  };

  const fetchWeatherData = useCallback(
    async (locationKey: string, isInitial = false) => {
      if (!locationKey) return;
      if (fetchingRef.current && !isInitial) return;
      fetchingRef.current = true;

      try {
        setError(null);

        const [current, hourly, daily, alerts] = await Promise.allSettled([
          accuWeatherService.getCurrentConditions(locationKey),
          accuWeatherService.getHourlyForecast(locationKey, 12),
          accuWeatherService.getDailyForecast(locationKey, 15),
          accuWeatherService.getAlerts(locationKey),
        ]);

        const currentData =
          current.status === 'fulfilled' && current.value?.length > 0
            ? current.value[0]
            : null;
        const hourlyData =
          hourly.status === 'fulfilled' ? hourly.value : [];
        const dailyData =
          daily.status === 'fulfilled' ? daily.value : null;
        const alertsData =
          alerts.status === 'fulfilled' ? alerts.value : [];

        // If ALL calls failed, surface an error
        if (
          current.status === 'rejected' &&
          hourly.status === 'rejected' &&
          daily.status === 'rejected'
        ) {
          const err = (current.reason as Error)?.message ?? 'FETCH_FAILED';
          if (err === 'INVALID_API_KEY') {
            setError('Invalid API key. Check configuration.');
          } else if (err === 'API_LIMIT_EXCEEDED') {
            setError('AccuWeather daily limit reached. Try again later.');
          } else {
            setError(
              'Weather data unavailable.\n\n' +
                '• On real device (APK): works perfectly\n' +
                '• Web preview: AccuWeather blocks browser requests (CORS)\n\n' +
                'Download the APK for live data.'
            );
          }
          // Still generate alerts with empty data (shows green/clear status)
          setAwmdAlerts(
            generateAWMDAlerts({ current: null, hourly: [], daily: [] })
          );
          return;
        }

        setCurrentConditions(currentData);
        setHourlyForecast(hourlyData);
        setDailyForecast(dailyData);
        setOfficialAlerts(alertsData);

        const generatedAlerts = generateAWMDAlerts({
          current: currentData,
          hourly: hourlyData,
          daily: dailyData?.DailyForecasts,
        });
        setAwmdAlerts(generatedAlerts);

        const criticalAlerts = generatedAlerts.filter(
          (a) => (a.level === 'red' || a.level === 'orange') && a.type !== 'CLEAR'
        );
        for (const alert of criticalAlerts.slice(0, 2)) {
          await scheduleWeatherAlert(alert);
        }

        setLastUpdated(new Date());
        setError(null);
      } catch (err: any) {
        const msg =
          err.message === 'INVALID_API_KEY'
            ? 'Invalid API key. Check configuration.'
            : err.message === 'API_LIMIT_EXCEEDED'
            ? 'API limit reached. Try again later.'
            : 'Data fetch failed. Please retry.';
        setError(msg);
      } finally {
        setLoading(false);
        setRefreshing(false);
        fetchingRef.current = false;
      }
    },
    []
  );

  const refresh = useCallback(async () => {
    if (!activeLocation) return;
    setRefreshing(true);
    await fetchWeatherData(activeLocation.key, true);
  }, [activeLocation, fetchWeatherData]);

  const setActiveLocation = useCallback(
    async (loc: SavedLocation) => {
      setActiveLocationState(loc);
      setLoading(true);
      await AsyncStorage.setItem(ACTIVE_LOC_KEY, JSON.stringify(loc));
      await fetchWeatherData(loc.key, true);
    },
    [fetchWeatherData]
  );

  const searchLocations = useCallback(async (query: string): Promise<LocationResult[]> => {
    try {
      return await accuWeatherService.searchLocations(query);
    } catch {
      return [];
    }
  }, []);

  const addFavorite = useCallback(
    async (loc: SavedLocation) => {
      const updated = [
        ...favorites.filter((f) => f.key !== loc.key),
        { ...loc, isFavorite: true },
      ];
      setFavorites(updated);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    },
    [favorites]
  );

  const removeFavorite = useCallback(
    async (key: string) => {
      const updated = favorites.filter((f) => f.key !== key);
      setFavorites(updated);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    },
    [favorites]
  );

  const useCurrentLocation = useCallback(async () => {
    try {
      setLocationError(null);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied');
        await fetchWithFallbackKey();
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = position.coords;

      let loc: SavedLocation;
      try {
        const locResult = await accuWeatherService.getLocationByGeoPosition(latitude, longitude);
        loc = {
          key: locResult.Key,
          name: locResult.LocalizedName,
          lat: latitude,
          lon: longitude,
          isFavorite: false,
        };
      } catch {
        // CORS/network blocked — use fallback key with actual GPS coords
        loc = {
          ...ALANDI_FALLBACK,
          lat: latitude,
          lon: longitude,
        };
      }

      setActiveLocationState(loc);
      await AsyncStorage.setItem(ACTIVE_LOC_KEY, JSON.stringify(loc));
      await fetchWeatherData(loc.key, true);
    } catch {
      setLocationError('Could not determine location');
      await fetchWithFallbackKey();
    }
  }, [fetchWeatherData]);

  return (
    <WeatherContext.Provider
      value={{
        currentConditions,
        hourlyForecast,
        dailyForecast,
        officialAlerts,
        awmdAlerts,
        activeLocation,
        favorites,
        locationError,
        loading,
        refreshing,
        error,
        lastUpdated,
        refresh,
        setActiveLocation,
        searchLocations,
        addFavorite,
        removeFavorite,
        useCurrentLocation,
      }}
    >
      {children}
    </WeatherContext.Provider>
  );
}

export function useWeather(): WeatherContextType {
  const ctx = useContext(WeatherContext);
  if (!ctx) throw new Error('useWeather must be used within WeatherProvider');
  return ctx;
}
