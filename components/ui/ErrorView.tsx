import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorView({ message, onRetry }: Props) {
  const { theme } = useTheme();
  const { t } = useLanguage();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.iconCircle, { backgroundColor: theme.surfaceElevated, borderColor: theme.alertRed + '40' }]}>
        <MaterialIcons name="cloud-off" size={40} color={theme.alertOrange} />
      </View>
      <Text style={[styles.title, { color: theme.textPrimary }]}>{t.error}</Text>
      <Text style={[styles.message, { color: theme.textSecondary }]}>
        {message || t.networkError}
      </Text>
      {onRetry ? (
        <Pressable
          style={({ pressed }) => [
            styles.retryButton,
            { backgroundColor: theme.primary, opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={onRetry}
        >
          <MaterialIcons name="refresh" size={18} color="#000" />
          <Text style={styles.retryText}>{t.retry}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  retryText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 15,
  },
});
