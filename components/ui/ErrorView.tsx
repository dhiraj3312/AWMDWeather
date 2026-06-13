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
  const { language } = useLanguage();

  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: theme.alertRed + '20' }]}>
        <MaterialIcons name="cloud-off" size={44} color={theme.alertRed} />
      </View>
      <Text style={[styles.title, { color: theme.textPrimary }]}>
        {language === 'mr' ? 'डेटा उपलब्ध नाही' : 'Data Unavailable'}
      </Text>
      {message ? (
        <Text style={[styles.message, { color: theme.textTertiary }]}>
          {message}
        </Text>
      ) : null}
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          style={({ pressed }) => [styles.retryBtn, { backgroundColor: theme.primary, opacity: pressed ? 0.8 : 1 }]}
        >
          <MaterialIcons name="refresh" size={16} color="#000" />
          <Text style={styles.retryText}>
            {language === 'mr' ? 'पुन्हा प्रयत्न करा' : 'Retry'}
          </Text>
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
    gap: 14,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 8,
  },
  retryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },
});
