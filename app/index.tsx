import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { Svg, Path, Rect } from 'react-native-svg';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, logout } from '../firebase/auth'; // Burada değişiklik

export default function HomeScreen() {
  const [loading, setLoading] = useState(false);

  // Original function to navigate based on user type (kept but commented)
  const navigateToLogin = (userType: 'user' | 'admin') => {
    router.push({
      pathname: '/login',
      params: { userType }
    });
  };

  // Simplified navigation to login page
  const handleLogin = () => {
    router.push('/login');
  };

  // Dev test için logout işlemi
  const handleDevLogout = async () => {
    try {
      setLoading(true);
      console.log("DEV TEST: Logout işlemi başlatılıyor...");
      
      // AsyncStorage temizle
      await AsyncStorage.clear();
      console.log("DEV TEST: AsyncStorage temizlendi");
      
      // Firebase logout - logout fonksiyonunu kullan
      try {
        await logout(); // signOut(auth) yerine logout() kullanın
        console.log("DEV TEST: Firebase auth oturumu kapatıldı");
      } catch (firebaseError) {
        console.error("DEV TEST: Firebase çıkış hatası:", firebaseError);
      }
      
      Alert.alert("Başarılı", "Tüm oturum verileri temizlendi");
    } catch (error) {
      console.error("DEV TEST: Logout hatası:", error);
      Alert.alert("Hata", "İşlem sırasında bir sorun oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logoContainer}>
        {/* Logo Icon */}
        <Svg width="120" height="120" viewBox="0 0 120 120" fill="none">
          <Path
            d="M60 20L20 50V100H100V50L60 20Z"
            stroke="#E6A05F"
            strokeWidth="6"
            fill="none"
          />
          <Path
            d="M40 60L80 60"
            stroke="#E6A05F"
            strokeWidth="4"
          />
          <Path
            d="M60 40L60 80"
            stroke="#E6A05F"
            strokeWidth="4"
          />
          {/* Window detail at bottom center */}
          <Rect x="50" y="70" width="8" height="8" fill="#E6A05F" />
          <Rect x="62" y="70" width="8" height="8" fill="#E6A05F" />
          <Rect x="50" y="82" width="8" height="8" fill="#E6A05F" />
          <Rect x="62" y="82" width="8" height="8" fill="#E6A05F" />
        </Svg>
        
        {/* Text Logo */}
        <Text style={styles.logoText}>TRACKIT</Text>
        <Text style={styles.subLogoText}>DEPO TAKİP SİSTEMİ</Text>
      </View>
      
      <View style={styles.buttonContainer}>
        {/* New simplified login button */}
        <TouchableOpacity 
          style={styles.button}
          onPress={handleLogin}
        >
          <Text style={styles.buttonText}>Giriş</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => router.push('/register')}>
          <Text style={styles.linkText}>Yeni bir hesap oluştur</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF0E6',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#222222',
    marginTop: 10,
  },
  subLogoText: {
    fontSize: 18,
    color: '#E6A05F',
    marginTop: 5,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  button: {
    backgroundColor: '#E6A05F',
    width: '85%',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  devButton: {
    backgroundColor: '#FF6B6B',
    width: '85%',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkText: {
    color: '#555555',
    fontSize: 16,
    marginTop: 10,
  },
});
