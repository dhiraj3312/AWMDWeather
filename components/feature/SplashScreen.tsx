import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';

const { width: W, height: H } = Dimensions.get('window');

// Weather stage type
type WeatherStage = 'sun' | 'partly_cloudy' | 'cloudy' | 'rain' | 'clearing' | 'logo';

// ── Animated Sun ─────────────────────────────────────────────────────────────
function AnimatedSun({ opacity }: { opacity: Animated.Value }) {
  const rays = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0.7)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 4, tension: 40, useNativeDriver: true }),
      Animated.loop(
        Animated.timing(rays, { toValue: 1, duration: 6000, easing: Easing.linear, useNativeDriver: true })
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(glow, { toValue: 1, duration: 1500, useNativeDriver: true }),
          Animated.timing(glow, { toValue: 0.7, duration: 1500, useNativeDriver: true }),
        ])
      ),
    ]).start();
  }, []);

  const spin = rays.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View style={[styles.sunContainer, { opacity, transform: [{ scale }] }]}>
      {/* Glow ring */}
      <Animated.View style={[styles.sunGlow, { opacity: glow }]} />
      {/* Rotating rays */}
      <Animated.View style={[styles.sunRaysContainer, { transform: [{ rotate: spin }] }]}>
        {Array.from({ length: 8 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.sunRay,
              { transform: [{ rotate: `${i * 45}deg` }, { translateY: -60 }] },
            ]}
          />
        ))}
      </Animated.View>
      {/* Sun core */}
      <View style={styles.sunCore}>
        <MaterialCommunityIcons name="white-balance-sunny" size={72} color="#FFD700" />
      </View>
    </Animated.View>
  );
}

// ── Animated Cloud ────────────────────────────────────────────────────────────
function AnimatedCloud({ startX, delay, size = 1, opacity }: {
  startX: number; delay: number; size?: number; opacity?: number;
}) {
  const pos = useRef(new Animated.Value(startX)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(pos, {
          toValue: startX > 0 ? W + 200 : -200,
          duration: 12000 + delay,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(pos, {
          toValue: startX > 0 ? -200 : W + 200,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View style={[styles.cloud, {
      transform: [{ translateX: pos }, { scale: size }],
      opacity: opacity ?? 0.8,
    }]}>
      <MaterialCommunityIcons name="cloud" size={64 * size} color="rgba(255,255,255,0.85)" />
    </Animated.View>
  );
}

// ── Raindrop ──────────────────────────────────────────────────────────────────
function RainDrops({ visible }: { visible: boolean }) {
  const drops = Array.from({ length: 30 }).map((_, i) => ({
    x: Math.random() * W,
    delay: Math.random() * 1500,
    speed: 800 + Math.random() * 600,
    size: 0.5 + Math.random() * 0.8,
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {visible ? drops.map((drop, i) => (
        <RainDrop key={i} x={drop.x} delay={drop.delay} speed={drop.speed} size={drop.size} />
      )) : null}
    </View>
  );
}

function RainDrop({ x, delay, speed, size }: { x: number; delay: number; speed: number; size: number }) {
  const y = useRef(new Animated.Value(-30)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0.7, duration: 100, useNativeDriver: true }),
          Animated.timing(y, { toValue: H + 50, duration: speed, easing: Easing.linear, useNativeDriver: true }),
        ]),
        Animated.timing(opacity, { toValue: 0, duration: 100, useNativeDriver: true }),
        Animated.timing(y, { toValue: -30, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        width: 1.5 * size,
        height: 12 * size,
        borderRadius: 2,
        backgroundColor: 'rgba(100, 180, 255, 0.8)',
        transform: [{ translateY: y }, { rotate: '10deg' }],
        opacity,
      }}
    />
  );
}

// ── Lightning Flash ───────────────────────────────────────────────────────────
function LightningFlash({ visible }: { visible: boolean }) {
  const flashOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(2000 + Math.random() * 1000),
        Animated.timing(flashOpacity, { toValue: 0.3, duration: 60, useNativeDriver: true }),
        Animated.timing(flashOpacity, { toValue: 0, duration: 100, useNativeDriver: true }),
        Animated.timing(flashOpacity, { toValue: 0.2, duration: 60, useNativeDriver: true }),
        Animated.timing(flashOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [visible]);

  if (!visible) return null;
  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { backgroundColor: '#FFD700', opacity: flashOpacity }]}
      pointerEvents="none"
    />
  );
}

// ── Main Splash Screen ─────────────────────────────────────────────────────────
interface SplashScreenProps {
  onFinish: () => void;
}

export default function AWMDSplashScreen({ onFinish }: SplashScreenProps) {
  const [stage, setStage] = useState<WeatherStage>('sun');
  const masterOpacity = useRef(new Animated.Value(1)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const loadingOpacity = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;

  // Per-stage opacities
  const sunOpacity = useRef(new Animated.Value(0)).current;
  const cloudOpacity = useRef(new Animated.Value(0)).current;
  const rainOpacity = useRef(new Animated.Value(0)).current;
  const blueOpacity = useRef(new Animated.Value(0)).current;

  const fade = (anim: Animated.Value, toValue: number, duration: number) =>
    Animated.timing(anim, { toValue, duration, useNativeDriver: true });

  useEffect(() => {
    const sequence = Animated.sequence([
      // Stage 1: Sun rises (0-2s)
      Animated.parallel([
        fade(sunOpacity, 1, 800),
      ]),
      Animated.delay(1000),

      // Stage 2: Partly cloudy (2-4s)
      Animated.parallel([
        fade(cloudOpacity, 0.6, 700),
      ]),

      // Stage 3: Clouds increase (4-5.5s)
      Animated.parallel([
        fade(cloudOpacity, 1, 600),
        fade(sunOpacity, 0.3, 600),
      ]),

      // Stage 4: Rain (5.5-8s)
      Animated.parallel([
        fade(rainOpacity, 1, 500),
        fade(sunOpacity, 0, 500),
      ]),
      Animated.delay(1500),

      // Stage 5: Clearing (8-9.5s)
      Animated.parallel([
        fade(rainOpacity, 0, 700),
        fade(cloudOpacity, 0, 700),
        fade(blueOpacity, 1, 800),
        fade(sunOpacity, 0.8, 800),
      ]),
      Animated.delay(200),

      // Stage 6: Logo reveal (9.5-11s)
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }),
        fade(logoOpacity, 1, 600),
        fade(loadingOpacity, 1, 400),
        Animated.timing(progressWidth, { toValue: 1, duration: 1200, useNativeDriver: false }),
      ]),
      Animated.delay(800),

      // Fade out
      fade(masterOpacity, 0, 500),
    ]);

    // Update stages based on timing
    setTimeout(() => setStage('partly_cloudy'), 1800);
    setTimeout(() => setStage('cloudy'), 3200);
    setTimeout(() => setStage('rain'), 4800);
    setTimeout(() => setStage('clearing'), 7200);
    setTimeout(() => setStage('logo'), 9000);
    setTimeout(() => onFinish(), 11800);

    sequence.start();
  }, []);

  const getGradientColors = (): [string, string, string] => {
    switch (stage) {
      case 'sun': return ['#1A4B8A', '#2E7BD6', '#87CEEB'];
      case 'partly_cloudy': return ['#1A4B8A', '#3A7BD5', '#87CEEB'];
      case 'cloudy': return ['#2C3E50', '#4A6080', '#718EA4'];
      case 'rain': return ['#1A2332', '#2C3E50', '#34495E'];
      case 'clearing': return ['#1A3A5C', '#2E7BD6', '#87CEEB'];
      case 'logo': return ['#050D1A', '#091525', '#0A1628'];
      default: return ['#050D1A', '#091525', '#0A1628'];
    }
  };

  const isRaining = stage === 'rain';
  const showClouds = ['partly_cloudy', 'cloudy', 'rain'].includes(stage);
  const showSun = ['sun', 'partly_cloudy', 'clearing'].includes(stage);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.splash, { opacity: masterOpacity }]}>
      <LinearGradient colors={getGradientColors()} style={StyleSheet.absoluteFill} />

      {/* Lightning flash during rain */}
      <LightningFlash visible={isRaining} />

      {/* Blue sky clearing overlay */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: '#87CEEB20', opacity: blueOpacity }]}
        pointerEvents="none"
      />

      {/* Sun */}
      {showSun ? <AnimatedSun opacity={sunOpacity} /> : null}

      {/* Clouds */}
      {showClouds ? (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: cloudOpacity }]} pointerEvents="none">
          <View style={styles.cloudsLayer}>
            <AnimatedCloud startX={-100} delay={0} size={1.2} />
            <AnimatedCloud startX={W * 0.4} delay={2000} size={0.9} opacity={0.7} />
            <AnimatedCloud startX={W * 0.7} delay={4000} size={1.0} />
          </View>
          <View style={[styles.cloudsLayer, { top: H * 0.25 }]}>
            <AnimatedCloud startX={W * 0.2} delay={1000} size={0.8} opacity={0.6} />
            <AnimatedCloud startX={W * 0.6} delay={3000} size={1.1} />
          </View>
        </Animated.View>
      ) : null}

      {/* Rain */}
      <RainDrops visible={isRaining} />

      {/* Rain cloud layer */}
      {isRaining ? (
        <Animated.View style={[styles.darkCloudBand, { opacity: rainOpacity }]} pointerEvents="none">
          <MaterialCommunityIcons name="weather-pouring" size={80} color="rgba(180,200,255,0.4)" />
        </Animated.View>
      ) : null}

      {/* Logo reveal */}
      <Animated.View
        style={[
          styles.logoContainer,
          { opacity: logoOpacity, transform: [{ scale: logoScale }] },
        ]}
      >
        <View style={styles.logoBadge}>
          <Image
            source={require('@/assets/images/awmd-logo.png')}
            style={styles.logoImage}
            contentFit="contain"
          />
        </View>
        <Text style={styles.logoTitle}>AWMD Weather</Text>
        <Text style={styles.logoSubtitle}>Alandi Meteorological Dept.</Text>
      </Animated.View>

      {/* Loading bar */}
      <Animated.View style={[styles.loadingContainer, { opacity: loadingOpacity }]}>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressWidth.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <Text style={styles.loadingText}>Loading...</Text>
      </Animated.View>

      {/* Stage indicator icons */}
      <View style={styles.stageRow}>
        {(['sun', 'partly_cloudy', 'cloudy', 'rain', 'clearing', 'logo'] as WeatherStage[]).map((s, i) => (
          <View
            key={s}
            style={[
              styles.stageDot,
              stage === s && styles.stageDotActive,
              { backgroundColor: stage === s ? '#F0A500' : 'rgba(255,255,255,0.25)' },
            ]}
          />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  splash: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Sun
  sunContainer: {
    position: 'absolute',
    top: H * 0.12,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    width: 160,
    height: 160,
  },
  sunGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 200, 50, 0.25)',
  },
  sunRaysContainer: {
    position: 'absolute',
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sunRay: {
    position: 'absolute',
    width: 3,
    height: 20,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 220, 80, 0.7)',
  },
  sunCore: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Clouds
  cloudsLayer: {
    position: 'absolute',
    top: H * 0.15,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 20,
  },
  cloud: {
    position: 'absolute',
  },
  // Dark cloud band
  darkCloudBand: {
    position: 'absolute',
    top: H * 0.1,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  // Logo
  logoContainer: {
    alignItems: 'center',
    gap: 12,
  },
  logoBadge: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: 'rgba(240, 165, 0, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(240, 165, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: 80,
    height: 80,
  },
  logoTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 1,
  },
  logoSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  // Loading
  loadingContainer: {
    position: 'absolute',
    bottom: 80,
    left: 48,
    right: 48,
    alignItems: 'center',
    gap: 12,
  },
  progressTrack: {
    width: '100%',
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#F0A500',
  },
  loadingText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 1,
  },
  // Stage dots
  stageRow: {
    position: 'absolute',
    bottom: 52,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  stageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stageDotActive: {
    width: 18,
    borderRadius: 3,
  },
});
