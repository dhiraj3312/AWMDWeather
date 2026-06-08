// AWMD Weather - AccuWeather API Service
import { Platform } from 'react-native';
import { CONFIG } from '@/constants/config';

const BASE = CONFIG.BASE_URL;
const KEY = CONFIG.API_KEY;

// On web the Live Preview iframe is blocked by CORS — proxy via allorigins
function buildUrl(path: string): string {
  const direct = `${BASE}${path}`;
  if (Platform.OS !== 'web') return direct;
  return `https://api.allorigins.win/raw?url=${encodeURIComponent(direct)}`;
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
  private async fetch<T>(url: string): Promise<T> {
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 401) throw new Error('INVALID_API_KEY');
      if (response.status === 403) throw new Error('API_LIMIT_EXCEEDED');
      if (response.status === 404) throw new Error('NOT_FOUND');
      throw new Error(`HTTP_ERROR_${response.status}`);
    }
    return response.json();
  }

  async getLocationByGeoPosition(lat: number, lon: number): Promise<LocationResult> {
    const url = buildUrl(`/locations/v1/cities/geoposition/search?apikey=${KEY}&q=${lat},${lon}&toplevel=false`);
    return this.fetch<LocationResult>(url);
  }

  async searchLocations(query: string, language = 'en-us'): Promise<LocationResult[]> {
    const encoded = encodeURIComponent(query);
    const url = buildUrl(`/locations/v1/cities/search?apikey=${KEY}&q=${encoded}&language=${language}`);
    return this.fetch<LocationResult[]>(url);
  }

  async getCurrentConditions(locationKey: string): Promise<CurrentConditions[]> {
    const url = buildUrl(`/currentconditions/v1/${locationKey}?apikey=${KEY}&details=true`);
    return this.fetch<CurrentConditions[]>(url);
  }

  async getHourlyForecast(locationKey: string, hours: 12 | 24 = 12): Promise<HourlyForecast[]> {
    const url = buildUrl(`/forecasts/v1/hourly/${hours}hour/${locationKey}?apikey=${KEY}&details=true&metric=true`);
    return this.fetch<HourlyForecast[]>(url);
  }

  async getDailyForecast(locationKey: string, days: 5 | 10 | 15 = 15): Promise<DailyForecastResponse> {
    const url = buildUrl(`/forecasts/v1/daily/${days}day/${locationKey}?apikey=${KEY}&details=true&metric=true`);
    return this.fetch<DailyForecastResponse>(url);
  }

  async getAlerts(locationKey: string): Promise<WeatherAlert[]> {
    const url = buildUrl(`/alerts/v1/${locationKey}?apikey=${KEY}&details=true`);
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
