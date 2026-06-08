// AWMD Weather - Configuration
export const CONFIG = {
  API_KEY: 'zpka_ea468e5f4a484eb4bbfb9468e78e7e44_2b4e74fb',
  BASE_URL: 'https://dataservice.accuweather.com',
  MAPS_TILE_URL: 'https://maps.accuweather.com/maps/TileServer/tile.aspx',

  // OpenWeatherMap — used exclusively for map tile layers
  OWM_API_KEY: '919a4443bfbed7470cbc5d64b0b28b3f',
  OWM_TILE_BASE: 'https://tile.openweathermap.org/map',
  REFRESH_INTERVAL: 5 * 60 * 1000, // 5 minutes in ms
  DEFAULT_LOCATION: {
    name: 'Alandi Mhatobachi',
    nameMarathi: 'आळंदी म्हातोबाची',
    lat: 18.6834,
    lon: 73.9009,
    key: '',
  },
  ALERT_THRESHOLDS: {
    HEAVY_RAIN_PROBABILITY: 80,
    MODERATE_RAIN_PROBABILITY: 60,
    THUNDERSTORM_PROBABILITY: 50,
    LIGHTNING_PROBABILITY: 40,
    STRONG_WIND_KMPH: 60,
    MODERATE_WIND_KMPH: 40,
    HIGH_UV_INDEX: 8,
    EXTREME_HEAT_C: 42,
  },
  LOCAL_INTELLIGENCE: {
    // Alandi Mhatobachi local cloud movement knowledge
    PRIMARY_CLOUD_DIRECTION: 'W/NW/SW → E/ESE',
    STRONGER_DEVELOPMENT_SECTOR: 'Saswad-side (SE)',
    NOTES: [
      'Local cloud movement primarily from W/NW/SW towards E/ESE',
      'Stronger cloud development observed from Saswad-side sectors',
      'Local observations used as supportive indicators only',
    ],
  },
  // OWM layer IDs map to: https://tile.openweathermap.org/map/{owmLayer}/{z}/{x}/{y}.png?appid=KEY
  MAP_LAYERS: [
    { id: 'precipitation_new',  owmLayer: 'precipitation_new',  label: 'Rainfall',      labelMr: 'पर्जन्यमान' },
    { id: 'wind_new',           owmLayer: 'wind_new',           label: 'Wind',          labelMr: 'वारा' },
    { id: 'clouds_new',         owmLayer: 'clouds_new',         label: 'Clouds',        labelMr: 'ढग' },
    { id: 'temp_new',           owmLayer: 'temp_new',           label: 'Temperature',   labelMr: 'तापमान' },
    { id: 'pressure_new',       owmLayer: 'pressure_new',       label: 'Pressure',      labelMr: 'दाब' },
    { id: 'snow',               owmLayer: 'snow',               label: 'Snow',          labelMr: 'हिमवर्षाव' },
    // Windy — special layer: renders live Windy.com embed instead of tile overlay
    { id: 'windy',              owmLayer: '',                   label: 'Windy Live',    labelMr: 'Windy थेट' },
  ],
};

export type MapLayerId = 'sat' | 'satrad' | 'stormsurf_rainrate' | 'wind' | 'clouds' | 'lightning';
