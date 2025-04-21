import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { Svg, Path, Rect, Circle } from 'react-native-svg';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function VerificationScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Svg width="100" height="100" viewBox="0 0 120 120" fill="none">
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
        
        <Text style={styles.logoText}>TRACKIT</Text>
        <Text style={styles.subLogoText}>DEPO TAKİP SİSTEMİ</Text>
      </View>

      {/* Email icon */}
      <View style={styles.emailIconContainer}>
        <Svg height="120" width="120" viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="11" fill="#E6F3FF" />
          <Path 
            d="M5 8L12 13L19 8M5 8V16H19V8M5 8H19" 
            stroke="#E6A05F" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          <Path 
            d="M5 16L10 12M19 16L14 12" 
            stroke="#E6A05F" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </Svg>
      </View>

      {/* Success message */}
      <View style={styles.messageContainer}>
        <Text style={styles.title}>Kayıt Başarılı!</Text>
        <Text style={styles.message}>
          E-posta adresinize doğrulama bağlantısı gönderdik.
          Lütfen gelen kutunuzu kontrol ediniz ve hesabınızı doğrulayınız.
        </Text>
      </View>

      {/* Continue button */}
      <TouchableOpacity 
        style={styles.continueButton}
        onPress={() => router.push('/')}
      >
        <Text style={styles.continueButtonText}>Anasayfaya Dön</Text>
      </TouchableOpacity>

      {/* Login link */}
      <TouchableOpacity 
        style={styles.loginLinkContainer}
        onPress={() => router.push('/login')}
      >
        <Text style={styles.loginLinkText}>
          Hesabınızı doğruladınız mı? <Text style={styles.loginLinkBold}>Giriş Yap</Text>
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 30,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222222',
    marginTop: 8,
  },
  subLogoText: {
    fontSize: 16,
    color: '#E6A05F',
    marginTop: 4,
  },
  emailIconContainer: {
    marginBottom: 30,
  },
  messageContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222222',
    textAlign: 'center',
    marginBottom: 15,
  },
  message: {
    fontSize: 16,
    color: '#555555',
    textAlign: 'center',
    lineHeight: 24,
  },
  continueButton: {
    backgroundColor: '#E6A05F',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    width: '100%',
    paddingHorizontal: 20,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginLinkContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  loginLinkText: {
    color: '#555555',
    fontSize: 16,
  },
  loginLinkBold: {
    fontWeight: 'bold',
    color: '#333333',
  },
});