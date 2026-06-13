import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface SmartInsightsProps {
  currentConditions: any;
  dailyForecast: any;
  language: 'mr' | 'en';
  theme: any;
}

function getInsights(current: any, daily: any, language: string) {
  const isMr = language === 'mr';
  const insights: { icon: string; iconLib: 'material' | 'community'; title: string; text: string; color: string; iconName: string }[] = [];

  const temp = current?.Temperature?.Metric?.Value ?? 0;
  const humidity = current?.RelativeHumidity ?? 0;
  const windSpeed = current?.Wind?.Speed?.Metric?.Value ?? 0;
  const uv = current?.UVIndex ?? 0;
  const today = daily?.DailyForecasts?.[0];
  const rainProb = Math.max(today?.Day?.RainProbability ?? 0, today?.Night?.RainProbability ?? 0);
  const thunderProb = Math.max(today?.Day?.ThunderstormProbability ?? 0, today?.Night?.ThunderstormProbability ?? 0);

  // Rain insight
  if (rainProb >= 70) {
    insights.push({
      icon: 'weather-pouring',
      iconLib: 'community',
      iconName: 'weather-pouring',
      title: isMr ? 'पाऊस अपेक्षित' : 'Rain Expected',
      text: isMr
        ? `आज ${rainProb}% पावसाची शक्यता आहे. छत्री सोबत ठेवा आणि पूरग्रस्त भागांना टाळा.`
        : `${rainProb}% chance of rain today. Carry an umbrella and avoid low-lying areas.`,
      color: '#42A5F5',
    });
  } else if (rainProb >= 40) {
    insights.push({
      icon: 'weather-rainy',
      iconLib: 'community',
      iconName: 'weather-rainy',
      title: isMr ? 'सौम्य पाऊस शक्य' : 'Light Rain Possible',
      text: isMr
        ? `${rainProb}% पावसाची शक्यता. हलका पाऊस पडू शकतो.`
        : `${rainProb}% chance of rain. Light showers are possible.`,
      color: '#26C6DA',
    });
  }

  // Thunderstorm insight
  if (thunderProb >= 50) {
    insights.push({
      icon: 'thunderstorm',
      iconLib: 'material',
      iconName: 'thunderstorm',
      title: isMr ? 'वादळाचा धोका' : 'Thunderstorm Risk',
      text: isMr
        ? `${thunderProb}% वादळाची शक्यता. घरात राहणे सुरक्षित आहे. विद्युत उपकरणे बंद ठेवा.`
        : `${thunderProb}% thunderstorm probability. Stay indoors. Unplug electrical appliances.`,
      color: '#FF9800',
    });
  }

  // UV insight
  if (uv >= 8) {
    insights.push({
      icon: 'white-balance-sunny',
      iconLib: 'community',
      iconName: 'white-balance-sunny',
      title: isMr ? 'तीव्र UV किरणे' : 'High UV Radiation',
      text: isMr
        ? `UV निर्देशांक ${uv} — अतिशय तीव्र. बाहेर जाताना सनस्क्रीन आणि टोपी वापरा.`
        : `UV Index ${uv} — Very high. Use sunscreen (SPF 30+) and wear a hat when outdoors.`,
      color: '#FF5722',
    });
  } else if (uv >= 6) {
    insights.push({
      icon: 'white-balance-sunny',
      iconLib: 'community',
      iconName: 'white-balance-sunny',
      title: isMr ? 'मध्यम UV किरणे' : 'Moderate UV',
      text: isMr
        ? `UV निर्देशांक ${uv}. दुपारी बाहेर जाताना सनस्क्रीन वापरा.`
        : `UV Index ${uv}. Apply sunscreen for midday outdoor activities.`,
      color: '#FF9800',
    });
  }

  // Heat insight
  if (temp >= 38) {
    insights.push({
      icon: 'thermometer-high',
      iconLib: 'community',
      iconName: 'thermometer-high',
      title: isMr ? 'उष्णतेची लाट' : 'Heat Wave Conditions',
      text: isMr
        ? `तापमान ${Math.round(temp)}°C आहे. जास्त पाणी प्या. दुपारी बाहेर जाणे टाळा.`
        : `Temperature is ${Math.round(temp)}°C. Stay hydrated. Avoid outdoor activity between noon-4pm.`,
      color: '#F44336',
    });
  }

  // Farming insight
  if (rainProb >= 60 || humidity >= 75) {
    insights.push({
      icon: 'sprout',
      iconLib: 'community',
      iconName: 'sprout',
      title: isMr ? 'शेती सल्ला' : 'Farming Advisory',
      text: isMr
        ? `जास्त आर्द्रता (${humidity}%) — रोपांमध्ये बुरशी होण्याची शक्यता. फवारणी टाळा.`
        : `High humidity (${humidity}%) — Risk of fungal growth in crops. Avoid pesticide spraying.`,
      color: '#4CAF50',
    });
  } else if (uv >= 6 && rainProb < 30) {
    insights.push({
      icon: 'sprout',
      iconLib: 'community',
      iconName: 'sprout',
      title: isMr ? 'शेती सल्ला' : 'Farming Advisory',
      text: isMr
        ? 'कोरडे व उष्ण हवामान. पिकांना पुरेसे पाणी द्या. संरक्षक झाडे लावण्याचा विचार करा.'
        : 'Dry and warm conditions. Ensure adequate irrigation. Consider shade protection for sensitive crops.',
      color: '#8BC34A',
    });
  }

  // Outdoor activity
  if (rainProb < 20 && thunderProb < 20 && temp >= 18 && temp <= 32 && windSpeed < 30) {
    insights.push({
      icon: 'walk',
      iconLib: 'material',
      iconName: 'walk',
      title: isMr ? 'बाहेर जाण्यासाठी चांगले' : 'Good for Outdoors',
      text: isMr
        ? 'आजचे हवामान बाहेरच्या उपक्रमांसाठी अनुकूल आहे. सकाळी किंवा संध्याकाळी फिरण्याची उत्तम संधी.'
        : 'Great weather for outdoor activities. Consider a morning walk or evening picnic.',
      color: '#26A69A',
    });
  }

  // Wind advisory
  if (windSpeed >= 50) {
    insights.push({
      icon: 'weather-windy',
      iconLib: 'community',
      iconName: 'weather-windy',
      title: isMr ? 'तीव्र वारे' : 'Strong Winds',
      text: isMr
        ? `${Math.round(windSpeed)} km/h वेगाने वारे वाहत आहेत. सैल वस्तू सुरक्षित ठिकाणी ठेवा.`
        : `Winds at ${Math.round(windSpeed)} km/h. Secure loose outdoor objects and be cautious while driving.`,
      color: '#78909C',
    });
  }

  // Fallback insight
  if (insights.length === 0) {
    insights.push({
      icon: 'check-circle',
      iconLib: 'material',
      iconName: 'check-circle',
      title: isMr ? 'सामान्य हवामान' : 'Favorable Conditions',
      text: isMr
        ? 'आजचे हवामान सामान्य आणि अनुकूल आहे. दैनंदिन कामांसाठी कोणती विशेष खबरदारी आवश्यक नाही.'
        : 'Weather conditions are normal and favorable today. No special precautions needed for daily activities.',
      color: '#4CAF50',
    });
  }

  return insights.slice(0, 4);
}

export default function SmartInsights({ currentConditions, dailyForecast, language, theme }: SmartInsightsProps) {
  const [expanded, setExpanded] = useState(false);
  const insights = getInsights(currentConditions, dailyForecast, language);
  const displayed = expanded ? insights : insights.slice(0, 2);
  const isMr = language === 'mr';

  return (
    <View style={[styles.container, { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder }]}>
      {/* Header */}
      <LinearGradient
        colors={[theme.primary + '18', theme.primary + '06']}
        style={styles.headerGrad}
      >
        <View style={styles.headerRow}>
          <View style={[styles.headerIcon, { backgroundColor: theme.primary + '25' }]}>
            <MaterialCommunityIcons name="brain" size={18} color={theme.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: theme.primary }]}>
              {isMr ? 'AWMD स्मार्ट अंतर्दृष्टी' : 'AWMD Smart Insights'}
            </Text>
            <Text style={[styles.headerSub, { color: theme.textTertiary }]}>
              {isMr ? 'थेट डेटावर आधारित विश्लेषण' : 'Analysis based on live weather data'}
            </Text>
          </View>
          <View style={[styles.aiBadge, { backgroundColor: theme.primary + '20', borderColor: theme.primary + '40' }]}>
            <Text style={[styles.aiBadgeText, { color: theme.primary }]}>AI</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Insights */}
      <View style={styles.insightsList}>
        {displayed.map((insight, i) => (
          <View key={i} style={[styles.insightRow, i < displayed.length - 1 && { borderBottomColor: theme.surfaceBorder, borderBottomWidth: 1 }]}>
            <View style={[styles.insightIconCircle, { backgroundColor: insight.color + '20' }]}>
              {insight.iconLib === 'community'
                ? <MaterialCommunityIcons name={insight.iconName as any} size={20} color={insight.color} />
                : <MaterialIcons name={insight.iconName as any} size={20} color={insight.color} />
              }
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={[styles.insightTitle, { color: insight.color }]}>{insight.title}</Text>
              <Text style={[styles.insightText, { color: theme.textSecondary }]}>{insight.text}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Expand/Collapse */}
      {insights.length > 2 ? (
        <Pressable
          onPress={() => setExpanded(!expanded)}
          style={({ pressed }) => [styles.expandBtn, { borderTopColor: theme.surfaceBorder, opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={[styles.expandText, { color: theme.primary }]}>
            {expanded
              ? (isMr ? 'कमी दाखवा' : 'Show Less')
              : (isMr ? `आणखी ${insights.length - 2} अंतर्दृष्टी पाहा` : `See ${insights.length - 2} more insights`)}
          </Text>
          <MaterialIcons name={expanded ? 'expand-less' : 'expand-more'} size={18} color={theme.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  headerGrad: {
    padding: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  headerSub: {
    fontSize: 11,
    marginTop: 2,
  },
  aiBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  insightsList: {
    gap: 0,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
  },
  insightIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  insightTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  insightText: {
    fontSize: 13,
    lineHeight: 20,
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  expandText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
