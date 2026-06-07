// AWMD Automatic Alert Engine
import { CurrentConditions, HourlyForecast, DailyForecast } from './accuweather';
import { CONFIG } from '@/constants/config';

export type AlertLevel = 'red' | 'orange' | 'yellow' | 'green';

export interface AWMDAlert {
  id: string;
  level: AlertLevel;
  type: string;
  titleEn: string;
  titleMr: string;
  descriptionEn: string;
  descriptionMr: string;
  generatedAt: Date;
  isAWMDGenerated: boolean;
  localIntelligenceNote?: string;
}

interface AlertInput {
  current?: CurrentConditions | null;
  hourly?: HourlyForecast[];
  daily?: DailyForecast[];
}

function generateId(type: string): string {
  return `awmd_${type}_${Date.now()}`;
}

export function generateAWMDAlerts(data: AlertInput): AWMDAlert[] {
  const alerts: AWMDAlert[] = [];
  const { current, hourly, daily } = data;
  const T = CONFIG.ALERT_THRESHOLDS;
  const localNote = `${CONFIG.LOCAL_INTELLIGENCE.PRIMARY_CLOUD_DIRECTION} | ${CONFIG.LOCAL_INTELLIGENCE.STRONGER_DEVELOPMENT_SECTOR}`;

  // ---------- WIND ALERTS ----------
  if (current) {
    const windKmph = current.Wind?.Speed?.Metric?.Value ?? 0;
    if (windKmph >= T.STRONG_WIND_KMPH) {
      alerts.push({
        id: generateId('strong_wind'),
        level: 'red',
        type: 'STRONG_WIND',
        titleEn: 'Strong Wind Warning',
        titleMr: 'तीव्र वारे इशारा',
        descriptionEn: `Current wind speed is ${windKmph} km/h. Dangerous conditions. Avoid outdoor activities.`,
        descriptionMr: `सध्याचा वारा वेग ${windKmph} किमी/तास आहे. धोकादायक परिस्थिती. बाहेर जाणे टाळा.`,
        generatedAt: new Date(),
        isAWMDGenerated: true,
        localIntelligenceNote: localNote,
      });
    } else if (windKmph >= T.MODERATE_WIND_KMPH) {
      alerts.push({
        id: generateId('moderate_wind'),
        level: 'orange',
        type: 'MODERATE_WIND',
        titleEn: 'Moderate Wind Advisory',
        titleMr: 'मध्यम वारे सूचना',
        descriptionEn: `Wind speed is ${windKmph} km/h. Exercise caution outdoors.`,
        descriptionMr: `वारा वेग ${windKmph} किमी/तास आहे. बाहेर सावधगिरी बाळगा.`,
        generatedAt: new Date(),
        isAWMDGenerated: true,
      });
    }
  }

  // ---------- UV ALERTS ----------
  if (current && (current.UVIndex ?? 0) >= T.HIGH_UV_INDEX) {
    alerts.push({
      id: generateId('high_uv'),
      level: 'orange',
      type: 'HIGH_UV',
      titleEn: 'High UV Index Warning',
      titleMr: 'तीव्र UV किरणे इशारा',
      descriptionEn: `UV Index is ${current.UVIndex} (${current.UVIndexText}). Use sunscreen and limit sun exposure.`,
      descriptionMr: `UV निर्देशांक ${current.UVIndex} (${current.UVIndexText}) आहे. सनस्क्रीन वापरा.`,
      generatedAt: new Date(),
      isAWMDGenerated: true,
    });
  }

  // ---------- HOURLY FORECAST ALERTS ----------
  if (hourly && hourly.length > 0) {
    const next6Hours = hourly.slice(0, 6);
    const maxRainProb = Math.max(...next6Hours.map((h) => h.RainProbability ?? h.PrecipitationProbability ?? 0));
    const maxThunderProb = Math.max(...next6Hours.map((h) => h.ThunderstormProbability ?? 0));

    if (maxRainProb >= T.HEAVY_RAIN_PROBABILITY) {
      alerts.push({
        id: generateId('heavy_rain'),
        level: 'red',
        type: 'HEAVY_RAIN',
        titleEn: 'Heavy Rain Warning',
        titleMr: 'जोरदार पाऊस इशारा',
        descriptionEn: `Heavy rain expected in the next 6 hours. Rain probability: ${maxRainProb}%. Stay indoors.`,
        descriptionMr: `पुढील ६ तासांत जोरदार पाऊस अपेक्षित. पाऊस संभावना: ${maxRainProb}%. घरात रहा.`,
        generatedAt: new Date(),
        isAWMDGenerated: true,
        localIntelligenceNote: localNote,
      });
    } else if (maxRainProb >= T.MODERATE_RAIN_PROBABILITY) {
      alerts.push({
        id: generateId('moderate_rain'),
        level: 'yellow',
        type: 'MODERATE_RAIN',
        titleEn: 'Rain Advisory',
        titleMr: 'पाऊस सूचना',
        descriptionEn: `Moderate rain expected in the next 6 hours. Rain probability: ${maxRainProb}%.`,
        descriptionMr: `पुढील ६ तासांत मध्यम पाऊस अपेक्षित. पाऊस संभावना: ${maxRainProb}%.`,
        generatedAt: new Date(),
        isAWMDGenerated: true,
        localIntelligenceNote: localNote,
      });
    }

    if (maxThunderProb >= T.THUNDERSTORM_PROBABILITY) {
      const level: AlertLevel = maxThunderProb >= 70 ? 'red' : 'orange';
      alerts.push({
        id: generateId('thunderstorm'),
        level,
        type: 'THUNDERSTORM',
        titleEn: 'Thunderstorm Warning',
        titleMr: 'वादळाचा इशारा',
        descriptionEn: `Thunderstorm probability: ${maxThunderProb}% in next 6 hours. Avoid open areas and tall structures.`,
        descriptionMr: `पुढील ६ तासांत वादळ संभावना: ${maxThunderProb}%. उघड्या जागा टाळा.`,
        generatedAt: new Date(),
        isAWMDGenerated: true,
        localIntelligenceNote: `${localNote} | Saswad-side thunderstorm development possible`,
      });
    }
  }

  // ---------- DAILY FORECAST ALERTS ----------
  if (daily && daily.length > 0) {
    const today = daily[0];
    const dayThunder = today.Day?.ThunderstormProbability ?? 0;
    const nightThunder = today.Night?.ThunderstormProbability ?? 0;
    const maxThunder = Math.max(dayThunder, nightThunder);

    const dayRain = today.Day?.RainProbability ?? 0;
    const nightRain = today.Night?.RainProbability ?? 0;
    const maxRain = Math.max(dayRain, nightRain);

    // Only add if not already covered by hourly alerts
    const hasThunderAlert = alerts.some((a) => a.type === 'THUNDERSTORM');
    const hasRainAlert = alerts.some((a) => a.type === 'HEAVY_RAIN' || a.type === 'MODERATE_RAIN');

    if (!hasThunderAlert && maxThunder >= T.THUNDERSTORM_PROBABILITY) {
      alerts.push({
        id: generateId('daily_thunder'),
        level: 'orange',
        type: 'THUNDERSTORM',
        titleEn: "Today's Thunderstorm Advisory",
        titleMr: 'आजच्या वादळाची सूचना',
        descriptionEn: `Thunderstorm possible today. Probability: ${maxThunder}%.`,
        descriptionMr: `आज वादळ शक्य. संभावना: ${maxThunder}%.`,
        generatedAt: new Date(),
        isAWMDGenerated: true,
      });
    }

    if (!hasRainAlert && maxRain >= T.HEAVY_RAIN_PROBABILITY) {
      alerts.push({
        id: generateId('daily_rain'),
        level: 'orange',
        type: 'HEAVY_RAIN',
        titleEn: "Today's Heavy Rain Advisory",
        titleMr: 'आजच्या जोरदार पावसाची सूचना',
        descriptionEn: `Heavy rain possible today. Probability: ${maxRain}%.`,
        descriptionMr: `आज जोरदार पाऊस शक्य. संभावना: ${maxRain}%.`,
        generatedAt: new Date(),
        isAWMDGenerated: true,
        localIntelligenceNote: localNote,
      });
    }

    // Heat wave
    const maxTemp = today.Temperature?.Maximum?.Value ?? 0;
    if (maxTemp >= T.EXTREME_HEAT_C) {
      alerts.push({
        id: generateId('heat_wave'),
        level: 'red',
        type: 'HEAT_WAVE',
        titleEn: 'Heat Wave Warning',
        titleMr: 'उष्णतेची लाट इशारा',
        descriptionEn: `Maximum temperature expected: ${maxTemp}°C. Avoid outdoor activities between 11am-4pm.`,
        descriptionMr: `कमाल तापमान अपेक्षित: ${maxTemp}°C. दुपारी ११ ते ४ बाहेर जाणे टाळा.`,
        generatedAt: new Date(),
        isAWMDGenerated: true,
      });
    }
  }

  // ---------- CURRENT CONDITIONS ALERTS ----------
  if (current) {
    const iconNum = current.WeatherIcon;
    // AccuWeather icon 15-17 = thunderstorms, 41-42 = night thunderstorms
    const isLightning = [15, 16, 17, 41, 42].includes(iconNum);
    if (isLightning && !alerts.some((a) => a.type === 'THUNDERSTORM')) {
      alerts.push({
        id: generateId('lightning_current'),
        level: 'red',
        type: 'LIGHTNING',
        titleEn: 'Lightning Risk - Active Thunderstorm',
        titleMr: 'विजेचा धोका - सक्रिय वादळ',
        descriptionEn: 'Active thunderstorm detected. Seek shelter immediately. Avoid open fields, trees and water.',
        descriptionMr: 'सक्रिय वादळ आढळले. तातडीने आश्रय घ्या. उघड्या जागा, झाडे आणि पाणी टाळा.',
        generatedAt: new Date(),
        isAWMDGenerated: true,
        localIntelligenceNote: `${localNote} | Active lightning detected in current conditions`,
      });
    }
  }

  // If no alerts, add green status
  if (alerts.length === 0) {
    alerts.push({
      id: generateId('green_status'),
      level: 'green',
      type: 'CLEAR',
      titleEn: 'All Clear - Normal Conditions',
      titleMr: 'सर्व सामान्य - सुरक्षित हवामान',
      descriptionEn: 'No significant weather hazards detected at this time. Conditions are safe.',
      descriptionMr: 'सध्या कोणतेही महत्त्वपूर्ण हवामान धोके आढळले नाहीत. परिस्थिती सुरक्षित आहे.',
      generatedAt: new Date(),
      isAWMDGenerated: true,
    });
  }

  // Sort: red first, then orange, yellow, green
  const order: AlertLevel[] = ['red', 'orange', 'yellow', 'green'];
  return alerts.sort((a, b) => order.indexOf(a.level) - order.indexOf(b.level));
}
