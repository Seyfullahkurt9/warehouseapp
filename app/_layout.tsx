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
  const { currentUser, isAdmin, loading, userData } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const isLoading = loading; // boolean
    // Array boş mu kontrolü
    const hasNoSegments = (segments.length as number) === 0;

    // Yükleniyorsa veya segmentler henüz hazır değilse bekle
    // Ayrı ayrı kontrol et
    if (isLoading) { 
      console.log("AuthWrapper: Loading is true, returning.");
      return;
    }
    if (hasNoSegments) {
      console.log("AuthWrapper: Segments array is empty, returning.");
      return;
    }

    // Eğer buraya ulaşıldıysa, isLoading false VE hasNoSegments false demektir.
    const currentPath = '/' + segments.join('/');
    console.log(`AuthWrapper Check: currentUser=${!!currentUser}, isAdmin=${isAdmin}, loading=${loading}, path=${currentPath}, userData=${JSON.stringify(userData)}`);

    if (!currentUser) {
      // Kullanıcı giriş yapmamış (logged out)
      // Eğer korunmuş bir sayfadaysa (public değil VE index değilse), login'e yönlendir
      if (!isPublicPage(currentPath) && currentPath !== '/') {
         console.log(`AuthWrapper: Logged out user on protected page (${currentPath}), redirecting to /login`);
         router.replace('/login');
      } else {
         console.log(`AuthWrapper: Logged out user on public page or index (${currentPath}), allowing navigation.`);
         // Kullanıcı çıkış yapmış ve public bir sayfada veya index'te, dokunma.
      }
    } else {
      // Kullanıcı giriş yapmış (logged in)
      
      // Eğer kullanıcı public bir sayfadaysa (login, register vb.)
      if (isPublicPage(currentPath)) {
        // Onu firma durumuna ve rolüne göre yönlendir
        if (!userData?.firma_id) {
          console.log(`AuthWrapper: Logged in user on public page (${currentPath}), no firma_id, redirecting to /first-page`);
          router.replace('/first-page');
        } else {
          console.log(`AuthWrapper: Logged in user on public page (${currentPath}), has firma_id, redirecting based on role`);
          if (isAdmin) {
            router.replace('/admin-home');
          } else {
            router.replace('/home');
          }
        }
      }
      // Eğer kullanıcı admin olmayan bir sayfada ve admin yetkisi yoksa
      else if (isAdminPage(currentPath) && !isAdmin) {
        console.log(`AuthWrapper: Non-admin user on admin page (${currentPath}), redirecting to /home`);
        // Firma ID'si olmayan kullanıcıyı first-page'e yönlendirmek daha mantıklı olabilir
        if (!userData?.firma_id) {
           router.replace('/first-page');
        } else {
           router.replace('/home');
        }
      }
      // Kullanıcı giriş yapmış ve uygun bir sayfada (veya index'te), dokunma.
      else {
         console.log(`AuthWrapper: Logged in user on appropriate page (${currentPath}), allowing navigation.`);
      }
    }
  }, [currentUser, isAdmin, loading, segments, userData]); // Bağımlılıklar doğru

  if (loading) {
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
