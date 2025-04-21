import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { Svg, Path, Rect } from 'react-native-svg';
import { router } from 'expo-router';

export default function HomeScreen() {
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
        
        {/* Original buttons (commented out) */}
        {/*
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigateToLogin('user')}
        >
          <Text style={styles.buttonText}>Kullanıcı Giriş</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigateToLogin('admin')}
        >
          <Text style={styles.buttonText}>Admin Giriş</Text>
        </TouchableOpacity>
        */}
        
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
