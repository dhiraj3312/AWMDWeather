import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

interface Props {
  message?: string;
  size?: 'small' | 'large';
}

export default function LoadingSpinner({ message, size = 'large' }: Props) {
  const { theme } = useTheme();
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 1200, easing: Easing.linear, useNativeDriver: true })
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.8, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const iconSize = size === 'large' ? 36 : 22;

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ rotate }, { scale: pulse }] }}>
        <MaterialCommunityIcons
          name="weather-partly-cloudy"
          size={iconSize}
          color={theme.primary}
        />
      </Animated.View>
      {message ? (
        <Text style={[styles.message, { color: theme.textTertiary, fontSize: size === 'small' ? 12 : 14 }]}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 16,
  },
  message: {
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },
});
