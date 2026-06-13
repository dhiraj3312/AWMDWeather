import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useState } from 'react';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { WeatherProvider } from '@/contexts/WeatherContext';
import AWMDSplashScreen from '@/components/feature/SplashScreen';

function RootLayoutNav() {
  const { theme } = useTheme();
  return (
    <>
      <StatusBar style={theme.statusBar} backgroundColor={theme.surface} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageProvider>
          <WeatherProvider>
            <RootLayoutNav />
            {!splashDone ? (
              <AWMDSplashScreen onFinish={() => setSplashDone(true)} />
            ) : null}
          </WeatherProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
