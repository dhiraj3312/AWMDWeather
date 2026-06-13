import { Tabs } from 'expo-router';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWeather } from '@/contexts/WeatherContext';

function AlertBadge({ count }: { count: number }) {
  const { theme } = useTheme();
  if (count === 0) return null;
  return (
    <View style={[styles.badge, { backgroundColor: theme.alertRed }]}>
      <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { awmdAlerts } = useWeather();

  const criticalAlerts = awmdAlerts.filter(
    (a) => (a.level === 'red' || a.level === 'orange') && a.type !== 'CLEAR'
  ).length;

  const tabBarHeight = Platform.select({
    ios: insets.bottom + 58,
    android: insets.bottom + 58,
    default: 66,
  });

  const tabBarStyle = {
    height: tabBarHeight,
    paddingTop: 8,
    paddingBottom: Platform.select({
      ios: insets.bottom + 6,
      android: insets.bottom + 6,
      default: 8,
    }),
    paddingHorizontal: 4,
    backgroundColor: theme.surface,
    borderTopWidth: 1,
    borderTopColor: theme.surfaceBorder,
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textTertiary,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.home,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home-variant" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="forecast"
        options={{
          title: t.forecast,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar-month" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="maps"
        options={{
          title: t.maps,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="earth" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: t.alerts,
          tabBarIcon: ({ color, size }) => (
            <View>
              <MaterialIcons name="notifications-active" size={size} color={color} />
              <AlertBadge count={criticalAlerts} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t.settings,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
});
