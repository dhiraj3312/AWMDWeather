import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: W, height: H } = Dimensions.get('window');

type WeatherBg =
  | 'sunny_day'
  | 'partly_cloudy_day'
  | 'cloudy'
  | 'rain'
  | 'thunderstorm'
  | 'fog'
  | 'night_clear'
  | 'night_cloudy'
  | 'night_rain';

function getWeatherBgType(iconCode: number, isDayTime: boolean): WeatherBg {
  if (!isDayTime) {
    if ([39, 40].includes(iconCode)) return 'night_rain';
    if ([33, 34].includes(iconCode)) return 'night_clear';
    return 'night_cloudy';
  }
  if ([1, 2].includes(iconCode)) return 'sunny_day';
  if ([3, 4, 5].includes(iconCode)) return 'partly_cloudy_day';
  if ([6, 7, 8].includes(iconCode)) return 'cloudy';
  if ([11].includes(iconCode)) return 'fog';
  if ([12, 13, 14, 18, 39, 40].includes(iconCode)) return 'rain';
  if ([15, 16, 17, 41, 42].includes(iconCode)) return 'thunderstorm';
  return isDayTime ? 'partly_cloudy_day' : 'night_cloudy';
}

function getGradientColors(bg: WeatherBg): string[] {
  switch (bg) {
    case 'sunny_day':        return ['#0A2A6E', '#1565C0', '#1976D2', '#2196F3'];
    case 'partly_cloudy_day': return ['#0D3B6E', '#1565C0', '#1976D2'];
    case 'cloudy':           return ['#1C2B3A', '#2E4057', '#37506A'];
    case 'rain':             return ['#0D1B2A', '#1A2B3C', '#243447'];
    case 'thunderstorm':     return ['#080F18', '#111A27', '#1C2B3A'];
    case 'fog':              return ['#2A3540', '#3A4855', '#4A5868'];
    case 'night_clear':      return ['#020816', '#050D1A', '#081020'];
    case 'night_cloudy':     return ['#0A0E1A', '#111827', '#1A2333'];
    case 'night_rain':       return ['#060C14', '#0E1722', '#141F2E'];
    default:                 return ['#050D1A', '#091525', '#0A1628'];
  }
}

// Floating particle
function FloatingParticle({ delay, duration, x }: { delay: number; duration: number; x: number }) {
  const y = useRef(new Animated.Value(H + 20)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(y, { toValue: -20, duration, easing: Easing.linear, useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(opacity, { toValue: 0.3, duration: 600, useNativeDriver: true }),
            Animated.delay(duration - 1200),
            Animated.timing(opacity, { toValue: 0, duration: 600, useNativeDriver: true }),
          ]),
        ]),
        Animated.timing(y, { toValue: H + 20, duration: 0, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        width: 2,
        height: 2,
        borderRadius: 1,
        backgroundColor: 'rgba(100, 200, 255, 0.6)',
        transform: [{ translateY: y }],
        opacity,
      }}
    />
  );
}

// Star for night
function Star({ x, y, delay }: { x: number; y: number; delay: number }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: 2,
        height: 2,
        borderRadius: 1,
        backgroundColor: '#FFFFFF',
        opacity,
      }}
    />
  );
}

interface WeatherBackgroundProps {
  iconCode: number;
  isDayTime: boolean;
  style?: any;
}

export default function WeatherBackground({ iconCode, isDayTime, style }: WeatherBackgroundProps) {
  const bgType = getWeatherBgType(iconCode, isDayTime);
  const gradientColors = getGradientColors(bgType);
  const isNight = bgType.startsWith('night');
  const isRainy = bgType === 'rain' || bgType === 'night_rain' || bgType === 'thunderstorm';

  const stars = isNight
    ? Array.from({ length: 40 }).map((_, i) => ({
        x: Math.random() * W * 0.9,
        y: Math.random() * H * 0.5,
        delay: Math.random() * 3000,
      }))
    : [];

  const particles = isRainy
    ? Array.from({ length: 15 }).map((_, i) => ({
        delay: Math.random() * 3000,
        duration: 2500 + Math.random() * 1500,
        x: Math.random() * W,
      }))
    : [];

  return (
    <View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <LinearGradient
        colors={gradientColors as any}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.3, y: 1 }}
      />

      {/* Stars for night */}
      {stars.map((s, i) => (
        <Star key={`star_${i}`} x={s.x} y={s.y} delay={s.delay} />
      ))}

      {/* Rain particles */}
      {particles.map((p, i) => (
        <FloatingParticle key={`particle_${i}`} delay={p.delay} duration={p.duration} x={p.x} />
      ))}

      {/* Subtle gradient overlay at bottom */}
      <LinearGradient
        colors={['transparent', 'rgba(5,13,26,0.6)']}
        style={[StyleSheet.absoluteFill, { top: H * 0.6 }]}
      />
    </View>
  );
}
