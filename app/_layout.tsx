import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View, ActivityIndicator, useColorScheme } from 'react-native';
import { Slot, useRouter, useSegments, Stack } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import 'react-native-reanimated';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Yol kontrolleri için yardımcı fonksiyonlar
const isPublicPage = (path) => {
  const publicPages = ['/login', '/register', '/verification', '/forgot-password'];
  return publicPages.some(page => path === page);
};

const isAdminPage = (path) => {
  return path.startsWith('/admin-home') || 
         path.startsWith('/users') || 
         path.startsWith('/login-history') ||
         // Diğer admin sayfaları
         false;
};

// Auth routing wrapper
function AuthWrapper({ children }) {
  const { currentUser, isAdmin, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;
    
    const currentPath = '/' + segments.join('/');
    
    if (!currentUser) {
      // Kullanıcı giriş yapmamışsa ve korunmuş bir sayfada ise, login'e yönlendir
      if (!isPublicPage(currentPath)) {
        console.log("Yetkisiz erişim, login'e yönlendiriliyor");
        router.replace('/login');
      }
    } else {
      // Kullanıcı giriş yapmışsa
      
      // Admin sayfalarını koruma
      if (isAdminPage(currentPath) && !isAdmin) {
        console.log("Admin yetkisi yok, ana sayfaya yönlendiriliyor");
        router.replace('/home');
      }
      
      // Kullanıcı giriş yapmış ve auth sayfalarındaysa ana sayfaya yönlendir
      if (isPublicPage(currentPath)) {
        console.log("Zaten giriş yapılmış, ana sayfaya yönlendiriliyor");
        router.replace('/home');
      }
    }
  }, [currentUser, isAdmin, loading, segments]);

  if (loading) {
    // Loading ekranı göster
    return <LoadingScreen />; 
  }

  return children;
}

// Simple loading screen
function LoadingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <ActivityIndicator size="large" color="#E6A05F" />
    </View>
  );
}

// Root layout
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
    <AuthProvider>
      <AuthWrapper>
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
            <Stack.Screen name="customers" />
            <Stack.Screen name="add-customer" />
            <Stack.Screen name="customer-success" />
            <Stack.Screen name="forgot-password" />
            <Stack.Screen name="reset-password" />
            <Stack.Screen name="password-success" />
            <Stack.Screen name="menu" />
            <Stack.Screen name="stock-movement-general" />
            <Stack.Screen name="stock-movement-current" />
            <Stack.Screen name="users" />
            <Stack.Screen name="add-user" />
            <Stack.Screen name="login-history" />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </AuthWrapper>
    </AuthProvider>
  );
}
