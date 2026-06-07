import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface Props {
  message?: string;
  size?: 'small' | 'large';
}

export default function LoadingSpinner({ message, size = 'large' }: Props) {
  const { theme } = useTheme();
  const rotation = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.3, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const spin = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const outerSize = size === 'large' ? 56 : 32;
  const innerSize = size === 'large' ? 40 : 22;

  return (
    <View style={styles.container}>
      <View style={{ width: outerSize, height: outerSize, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View
          style={[
            styles.ring,
            {
              width: outerSize,
              height: outerSize,
              borderRadius: outerSize / 2,
              borderColor: theme.primary,
              transform: [{ rotate: spin }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.innerDot,
            {
              width: innerSize / 3,
              height: innerSize / 3,
              borderRadius: innerSize / 6,
              backgroundColor: theme.primary,
              opacity: pulse,
            },
          ]}
        />
      </View>
      {message ? (
        <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  ring: {
    borderWidth: 3,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    position: 'absolute',
  },
  innerDot: {
    position: 'absolute',
  },
  message: {
    fontSize: 14,
    fontWeight: '500',
  },
});
