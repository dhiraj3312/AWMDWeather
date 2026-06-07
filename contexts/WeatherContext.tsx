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
  // Current data
  currentConditions: CurrentConditions | null;
  hourlyForecast: HourlyForecast[];
  dailyForecast: DailyForecastResponse | null;
  officialAlerts: WeatherAlert[];
  awmdAlerts: AWMDAlert[];

  // Location
  activeLocation: SavedLocation | null;
  favorites: SavedLocation[];
  locationError: string | null;

  // State flags
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  lastUpdated: Date | null;

  // Actions
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

  // Load saved data on mount
  useEffect(() => {
    loadInitialData();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (activeLocation) fetchWeatherData(activeLocation.key);
    }, CONFIG.REFRESH_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeLocation]);

  const loadInitialData = async () => {
    try {
      // Load favorites
      const favsJson = await AsyncStorage.getItem(FAVORITES_KEY);
      if (favsJson) setFavorites(JSON.parse(favsJson));

      // Load active location
      const activeJson = await AsyncStorage.getItem(ACTIVE_LOC_KEY);
      if (activeJson) {
        const loc: SavedLocation = JSON.parse(activeJson);
        setActiveLocationState(loc);
        await fetchWeatherData(loc.key);
      } else {
        // Default: use current location or Alandi
        await useCurrentLocation();
      }
    } catch (err) {
      // Fall back to Alandi
      await loadDefaultLocation();
    }
  };

  const loadDefaultLocation = async () => {
    try {
      const def = CONFIG.DEFAULT_LOCATION;
      const locResult = await accuWeatherService.getLocationByGeoPosition(def.lat, def.lon);
      const loc: SavedLocation = {
        key: locResult.Key,
        name: locResult.LocalizedName || def.name,
        lat: def.lat,
        lon: def.lon,
        isFavorite: false,
      };
      setActiveLocationState(loc);
      await fetchWeatherData(loc.key);
    } catch (err) {
      setError('Could not load weather data. Check your connection.');
      setLoading(false);
    }
  };

  const fetchWeatherData = useCallback(async (locationKey: string) => {
    if (!locationKey) return;
    try {
      setError(null);

      const [current, hourly, daily, alerts] = await Promise.allSettled([
        accuWeatherService.getCurrentConditions(locationKey),
        accuWeatherService.getHourlyForecast(locationKey, 12),
        accuWeatherService.getDailyForecast(locationKey, 15),
        accuWeatherService.getAlerts(locationKey),
      ]);

      const currentData = current.status === 'fulfilled' ? current.value[0] ?? null : null;
      const hourlyData = hourly.status === 'fulfilled' ? hourly.value : [];
      const dailyData = daily.status === 'fulfilled' ? daily.value : null;
      const alertsData = alerts.status === 'fulfilled' ? alerts.value : [];

      setCurrentConditions(currentData);
      setHourlyForecast(hourlyData);
      setDailyForecast(dailyData);
      setOfficialAlerts(alertsData);

      // Generate AWMD alerts
      const generatedAlerts = generateAWMDAlerts({
        current: currentData,
        hourly: hourlyData,
        daily: dailyData?.DailyForecasts,
      });
      setAwmdAlerts(generatedAlerts);

      // Send notifications for high-priority alerts
      const criticalAlerts = generatedAlerts.filter(
        (a) => (a.level === 'red' || a.level === 'orange') && a.type !== 'CLEAR'
      );
      for (const alert of criticalAlerts.slice(0, 2)) {
        await scheduleWeatherAlert(alert);
      }

      setLastUpdated(new Date());
      setError(null);
    } catch (err: any) {
      const msg = err.message === 'INVALID_API_KEY'
        ? 'Invalid API key. Check configuration.'
        : err.message === 'API_LIMIT_EXCEEDED'
        ? 'API limit exceeded. Try again later.'
        : 'Weather data unavailable. Check connection.';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!activeLocation) return;
    setRefreshing(true);
    await fetchWeatherData(activeLocation.key);
  }, [activeLocation, fetchWeatherData]);

  const setActiveLocation = useCallback(
    async (loc: SavedLocation) => {
      setActiveLocationState(loc);
      setLoading(true);
      await AsyncStorage.setItem(ACTIVE_LOC_KEY, JSON.stringify(loc));
      await fetchWeatherData(loc.key);
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
      const updated = [...favorites.filter((f) => f.key !== loc.key), { ...loc, isFavorite: true }];
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
        await loadDefaultLocation();
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = position.coords;
      const locResult = await accuWeatherService.getLocationByGeoPosition(latitude, longitude);
      const loc: SavedLocation = {
        key: locResult.Key,
        name: locResult.LocalizedName,
        lat: latitude,
        lon: longitude,
        isFavorite: false,
      };
      setActiveLocationState(loc);
      await AsyncStorage.setItem(ACTIVE_LOC_KEY, JSON.stringify(loc));
      await fetchWeatherData(loc.key);
    } catch {
      setLocationError('Could not determine location');
      await loadDefaultLocation();
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
