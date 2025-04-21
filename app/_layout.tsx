import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="home" options={{ gestureEnabled: false }} />
        <Stack.Screen name="admin-home" options={{ gestureEnabled: false }} />
        <Stack.Screen name="orders" />
        <Stack.Screen name="create-order" />
        <Stack.Screen name="order-success" />
        <Stack.Screen name="product-entry" />
        <Stack.Screen name="product-success" />
        <Stack.Screen name="product-exit" />
        <Stack.Screen name="product-exit-success" />
        <Stack.Screen name="+not-found" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="suppliers" />
        <Stack.Screen name="add-supplier" />
        <Stack.Screen name="supplier-success" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="reset-password" />
        <Stack.Screen name="password-success" />
        <Stack.Screen name="menu" />
        <Stack.Screen name="stock-movement-general" />
        <Stack.Screen name="stock-movement-current" />
        <Stack.Screen name="users" />
        <Stack.Screen name="add-user" />
        <Stack.Screen name="user-success" />
        <Stack.Screen name="login-history" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
