// AWMD Weather - Notification Service
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { AWMDAlert } from './alertEngine';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function scheduleWeatherAlert(alert: AWMDAlert): Promise<void> {
  try {
    const granted = await requestNotificationPermissions();
    if (!granted) return;

    const levelEmoji: Record<string, string> = {
      red: '🔴',
      orange: '🟠',
      yellow: '🟡',
      green: '🟢',
    };

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${levelEmoji[alert.level] ?? ''} AWMD: ${alert.titleEn}`,
        body: alert.descriptionEn,
        data: { alertId: alert.id, level: alert.level, type: alert.type },
        sound: alert.level === 'red' || alert.level === 'orange' ? 'default' : undefined,
      },
      trigger: null, // immediate
    });
  } catch (error) {
    console.warn('Notification error:', error);
  }
}

export async function sendDailyForecastNotification(
  locationName: string,
  highTemp: number,
  lowTemp: number,
  condition: string,
  rainProb: number
): Promise<void> {
  try {
    const granted = await requestNotificationPermissions();
    if (!granted) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `AWMD: ${locationName} - Daily Forecast`,
        body: `${condition} | H:${highTemp}°C L:${lowTemp}°C | Rain: ${rainProb}%`,
        data: { type: 'DAILY_FORECAST' },
      },
      trigger: null,
    });
  } catch (error) {
    console.warn('Daily forecast notification error:', error);
  }
}

export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // ignore
  }
}

export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}
