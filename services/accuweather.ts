// AWMD Weather - AccuWeather API Service
import { Platform } from 'react-native';
import { CONFIG } from '@/constants/config';

const BASE = CONFIG.BASE_URL;
const KEY = CONFIG.API_KEY;

// CORS proxies tried in order on web
const CORS_PROXIES = [
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://thingproxy.freeboard.io/fetch/${url}`,
];

function buildUrl(path: string): string {
  return `${BASE}${path}`;
}

export interface LocationResult {
  Key: string;
  LocalizedName: string;
  Country: { LocalizedName: string };
  AdministrativeArea: { LocalizedName: string };
  GeoPosition?: { Latitude: number; Longitude: number; Elevation: { Metric: { Value: number } } };
}

export interface CurrentConditions {
  LocalObservationDateTime: string;
  EpochTime: number;
  WeatherText: string;
  WeatherIcon: number;
  HasPrecipitation: boolean;
  IsDayTime: boolean;
  Temperature: { Metric: { Value: number; Unit: string } };
  RealFeelTemperature: { Metric: { Value: number; Unit: string } };
  RelativeHumidity: number;
  Wind: {
    Direction: { Degrees: number; English: string; Localized: string };
    Speed: { Metric: { Value: number; Unit: string } };
  };
  WindGust?: { Speed: { Metric: { Value: number; Unit: string } } };
  Pressure: { Metric: { Value: number; Unit: string } };
  Visibility: { Metric: { Value: number; Unit: string } };
  UVIndex: number;
  UVIndexText: string;
  CloudCover: number;
  DewPoint?: { Metric: { Value: number; Unit: string } };
  Precip1hr?: { Metric: { Value: number; Unit: string } };
}

export interface HourlyForecast {
  DateTime: string;
  EpochDateTime: number;
  WeatherIcon: number;
  IconPhrase: string;
  HasPrecipitation: boolean;
  PrecipitationType?: string;
  PrecipitationProbability?: number;
  ThunderstormProbability?: number;
  RainProbability?: number;
  IsDaylight: boolean;
  Temperature: { Value: number; Unit: string };
  Wind?: { Direction: { Degrees: number; English: string }; Speed: { Value: number; Unit: string } };
}

export interface DailyForecast {
  Date: string;
  EpochDate: number;
  Sun?: { Rise: string; Set: string };
  Moon?: { Rise: string; Set: string };
  Temperature: { Minimum: { Value: number; Unit: string }; Maximum: { Value: number; Unit: string } };
  RealFeelTemperature?: { Minimum: { Value: number; Unit: string }; Maximum: { Value: number; Unit: string } };
  Day: {
    Icon: number;
    IconPhrase: string;
    HasPrecipitation: boolean;
    PrecipitationType?: string;
    PrecipitationIntensity?: string;
    ThunderstormProbability?: number;
    RainProbability?: number;
    TotalLiquid?: { Value: number; Unit: string };
  };
  Night: {
    Icon: number;
    IconPhrase: string;
    HasPrecipitation: boolean;
    ThunderstormProbability?: number;
    RainProbability?: number;
  };
  Sources?: string[];
  MobileLink?: string;
}

export interface DailyForecastResponse {
  Headline: {
    EffectiveDate: string;
    EffectiveEpochDate: number;
    Severity: number;
    Text: string;
    Category: string;
    EndDate: string;
  };
  DailyForecasts: DailyForecast[];
}

export interface WeatherAlert {
  AlertID: number;
  Description: { Localized: string; English: string };
  Category: string;
  Priority: number;
  Type: string;
  TypeID: string;
  Source: string;
  Area: {
    Name: string;
    StartTime?: string;
    EndTime?: string;
    Text: string;
  }[];
}

class AccuWeatherService {
  private async fetch<T>(directUrl: string): Promise<T> {
    // On native — direct call
    if (Platform.OS !== 'web') {
      const response = await fetch(directUrl);
      if (!response.ok) {
        if (response.status === 401) throw new Error('INVALID_API_KEY');
        if (response.status === 403) throw new Error('API_LIMIT_EXCEEDED');
        if (response.status === 404) throw new Error('NOT_FOUND');
        throw new Error(`HTTP_ERROR_${response.status}`);
      }
      return response.json();
    }

    // On web — try CORS proxies in order
    let lastError: any;
    for (const makeProxy of CORS_PROXIES) {
      try {
        const proxyUrl = makeProxy(directUrl);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);
        const response = await fetch(proxyUrl, { signal: controller.signal });
        clearTimeout(timeout);
        if (!response.ok) {
          if (response.status === 401) throw new Error('INVALID_API_KEY');
          if (response.status === 403) throw new Error('API_LIMIT_EXCEEDED');
          if (response.status === 404) throw new Error('NOT_FOUND');
          throw new Error(`HTTP_ERROR_${response.status}`);
        }
        const text = await response.text();
        return JSON.parse(text) as T;
      } catch (err: any) {
        // AbortError or network error — try next proxy
        lastError = err;
        if (err.message === 'INVALID_API_KEY' || err.message === 'API_LIMIT_EXCEEDED') throw err;
        continue;
      }
    }
    throw lastError ?? new Error('All CORS proxies failed');
  }

  async getLocationByGeoPosition(lat: number, lon: number): Promise<LocationResult> {
    const url = `${BASE}/locations/v1/cities/geoposition/search?apikey=${KEY}&q=${lat},${lon}&toplevel=false`;
    return this.fetch<LocationResult>(url);
  }

  async searchLocations(query: string, language = 'en-us'): Promise<LocationResult[]> {
    const encoded = encodeURIComponent(query);
    const url = `${BASE}/locations/v1/cities/search?apikey=${KEY}&q=${encoded}&language=${language}`;
    return this.fetch<LocationResult[]>(url);
  }

  async getCurrentConditions(locationKey: string): Promise<CurrentConditions[]> {
    const url = `${BASE}/currentconditions/v1/${locationKey}?apikey=${KEY}&details=true`;
    return this.fetch<CurrentConditions[]>(url);
  }

  async getHourlyForecast(locationKey: string, hours: 12 | 24 = 12): Promise<HourlyForecast[]> {
    const url = `${BASE}/forecasts/v1/hourly/${hours}hour/${locationKey}?apikey=${KEY}&details=true&metric=true`;
    return this.fetch<HourlyForecast[]>(url);
  }

  async getDailyForecast(locationKey: string, days: 5 | 10 | 15 = 15): Promise<DailyForecastResponse> {
    const url = `${BASE}/forecasts/v1/daily/${days}day/${locationKey}?apikey=${KEY}&details=true&metric=true`;
    return this.fetch<DailyForecastResponse>(url);
  }

  async getAlerts(locationKey: string): Promise<WeatherAlert[]> {
    const url = `${BASE}/alerts/v1/${locationKey}?apikey=${KEY}&details=true`;
    return this.fetch<WeatherAlert[]>(url);
  }

  getWeatherIconUrl(iconNumber: number): string {
    const padded = String(iconNumber).padStart(2, '0');
    return `https://developer.accuweather.com/sites/default/files/${padded}-s.png`;
  }

  getMapTileUrl(layer: string): string {
    return `${CONFIG.MAPS_TILE_URL}?apikey=${KEY}&layer=${layer}&zoom={z}&x={x}&y={y}`;
  }
}

export const accuWeatherService = new AccuWeatherService();
