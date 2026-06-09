// AWMD Weather - Configuration
export const CONFIG = {
  // AccuWeather API — used for ALL weather data
  API_KEY: 'zpka_ea468e5f4a484eb4bbfb9468e78e7e44_2b4e74fb',
  BASE_URL: 'https://dataservice.accuweather.com',

  // Windy.com embed — used for all map/radar layers (no API key required)
  WINDY_EMBED_BASE: 'https://embed.windy.com/embed2.html',

  REFRESH_INTERVAL: 5 * 60 * 1000, // 5 minutes in ms

  DEFAULT_LOCATION: {
    name: 'Alandi Mhatobachi',
    nameMarathi: 'आळंदी म्हातोबाची',
    lat: 18.6834,
    lon: 73.9009,
    key: '202396', // AccuWeather location key for Alandi/Pune area
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
    PRIMARY_CLOUD_DIRECTION: 'W/NW/SW → E/ESE',
    STRONGER_DEVELOPMENT_SECTOR: 'Saswad-side (SE)',
    NOTES: [
      'Local cloud movement primarily from W/NW/SW towards E/ESE',
      'Stronger cloud development observed from Saswad-side sectors',
      'Local observations used as supportive indicators only',
    ],
  },

  // Windy map layers — overlay= param values
  MAP_LAYERS: [
    { id: 'radar',       windyOverlay: 'radar',    windyProduct: 'radar',  label: 'Radar',        labelMr: 'रडार' },
    { id: 'rain',        windyOverlay: 'rain',     windyProduct: 'ecmwf',  label: 'Rainfall',     labelMr: 'पर्जन्यमान' },
    { id: 'wind',        windyOverlay: 'wind',     windyProduct: 'ecmwf',  label: 'Wind',         labelMr: 'वारा' },
    { id: 'clouds',      windyOverlay: 'clouds',   windyProduct: 'ecmwf',  label: 'Clouds',       labelMr: 'ढग' },
    { id: 'temp',        windyOverlay: 'temp',     windyProduct: 'ecmwf',  label: 'Temperature',  labelMr: 'तापमान' },
    { id: 'lightning',   windyOverlay: 'lightning',windyProduct: 'ecmwf',  label: 'Lightning',    labelMr: 'विजा' },
  ],
};
