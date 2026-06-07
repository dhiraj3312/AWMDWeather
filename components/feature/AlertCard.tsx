import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AWMDAlert, AlertLevel } from '@/services/alertEngine';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  alert: AWMDAlert;
  showAWMDBadge?: boolean;
}

const ALERT_CONFIG: Record<AlertLevel, { icon: string; iconLib: 'material' | 'community'; label: string }> = {
  red: { icon: 'warning', iconLib: 'material', label: 'Red Alert' },
  orange: { icon: 'weather-lightning-rainy', iconLib: 'community', label: 'Orange Alert' },
  yellow: { icon: 'warning-amber', iconLib: 'material', label: 'Yellow Alert' },
  green: { icon: 'check-circle', iconLib: 'material', label: 'All Clear' },
};

export default function AlertCard({ alert, showAWMDBadge = false }: Props) {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const [expanded, setExpanded] = useState(false);

  const title = language === 'mr' ? alert.titleMr : alert.titleEn;
  const description = language === 'mr' ? alert.descriptionMr : alert.descriptionEn;

  const getColors = () => {
    switch (alert.level) {
      case 'red': return { bg: theme.alertRedBg, border: theme.alertRed, text: theme.alertRed };
      case 'orange': return { bg: theme.alertOrangeBg, border: theme.alertOrange, text: theme.alertOrange };
      case 'yellow': return { bg: theme.alertYellowBg, border: theme.alertYellow, text: theme.alertYellow };
      case 'green': return { bg: theme.alertGreenBg, border: theme.alertGreen, text: theme.alertGreen };
    }
  };

  const colors = getColors();
  const config = ALERT_CONFIG[alert.level];

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(language === 'mr' ? 'mr-IN' : 'en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Pressable
      onPress={() => setExpanded(!expanded)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.bg,
          borderLeftColor: colors.border,
          borderColor: colors.border + '40',
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      {/* Header row */}
      <View style={styles.headerRow}>
        <View style={[styles.levelDot, { backgroundColor: colors.border }]} />
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            {showAWMDBadge ? (
              <View style={[styles.awmdBadge, { backgroundColor: colors.border + '30', borderColor: colors.border }]}>
                <Text style={[styles.awmdBadgeText, { color: colors.text }]}>AWMD</Text>
              </View>
            ) : null}
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={expanded ? 0 : 2}>
              {title}
            </Text>
          </View>
          {!expanded ? (
            <Text style={[styles.descPreview, { color: theme.textSecondary }]} numberOfLines={2}>
              {description}
            </Text>
          ) : null}
        </View>
        <MaterialIcons
          name={expanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
          size={20}
          color={colors.text}
        />
      </View>

      {/* Expanded content */}
      {expanded ? (
        <View style={styles.expandedContent}>
          <Text style={[styles.description, { color: theme.textPrimary }]}>{description}</Text>

          {alert.localIntelligenceNote ? (
            <View style={[styles.localNote, { backgroundColor: theme.surfaceElevated, borderColor: theme.surfaceBorder }]}>
              <MaterialIcons name="info-outline" size={14} color={theme.accentBlue} />
              <Text style={[styles.localNoteText, { color: theme.textSecondary }]}>
                {language === 'mr' ? 'स्थानिक: ' : 'Local: '}{alert.localIntelligenceNote}
              </Text>
            </View>
          ) : null}

          <View style={styles.footer}>
            <Text style={[styles.timestamp, { color: theme.textTertiary }]}>
              {language === 'mr' ? 'वेळ: ' : 'Time: '}{formatTime(alert.generatedAt)}
            </Text>
            {alert.isAWMDGenerated ? (
              <Text style={[styles.source, { color: theme.textTertiary }]}>
                {language === 'mr' ? 'AWMD स्वयं-यंत्रणा' : 'AWMD Auto Engine'}
              </Text>
            ) : null}
          </View>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
    marginBottom: 12,
    overflow: 'hidden',
    padding: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  levelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    flexShrink: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  awmdBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  awmdBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  descPreview: {
    fontSize: 12,
    lineHeight: 18,
  },
  expandedContent: {
    marginTop: 12,
    gap: 10,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
  },
  localNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  localNoteText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 11,
  },
  source: {
    fontSize: 11,
    fontStyle: 'italic',
  },
});
