import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  TextInput, 
  StatusBar,
  ActivityIndicator,
  Alert
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Svg, Path, Rect } from 'react-native-svg';
import { resetPassword } from '../firebase/auth';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert("Hata", "Lütfen e-posta adresinizi girin.");
      return;
    }

    setLoading(true);
    
    try {
      // Firebase auth modülündeki resetPassword fonksiyonunu çağır
      await resetPassword(email);
      
      // Başarılı olduğunda
      setEmailSent(true);
      Alert.alert(
        "Bağlantı Gönderildi", 
        "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen e-postanızı kontrol edin."
      );
    } catch (error) {
      // Hata durumunu yönet
      let errorMessage = "Şifre sıfırlama bağlantısı gönderilemedi.";
      
      if (error && typeof error === 'object' && 'code' in error) {
        if (error.code === 'auth/invalid-email') {
          errorMessage = "Geçersiz e-posta formatı.";
        } else if (error.code === 'auth/user-not-found') {
          errorMessage = "Bu e-posta ile kayıtlı bir kullanıcı bulunamadı.";
        }
      }
      
      Alert.alert("Hata", errorMessage);
      console.error("Password reset error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#222222" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Şifremi unuttum</Text>
        </View>

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

        {/* Form */}
        <View style={styles.formContainer}>
          {emailSent ? (
            // Bağlantı gönderildikten sonraki görünüm
            <View style={styles.successContainer}>
              <Ionicons name="mail" size={60} color="#E6A05F" />
              <Text style={styles.successTitle}>E-posta Gönderildi</Text>
              <Text style={styles.successMessage}>
                Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen e-postanızı kontrol ediniz 
                ve bağlantıya tıklayarak şifrenizi sıfırlayınız.
              </Text>
            </View>
          ) : (
            // Bağlantı gönderilmeden önceki form
            <>
              <Text style={styles.instructionText}>
                Şifrenizi sıfırlamak için e-posta adresinizi girin. Size bir sıfırlama bağlantısı göndereceğiz.
              </Text>
              
              <TextInput
                style={styles.input}
                placeholder="E-posta adresinizi girin"
                placeholderTextColor="#AAAAAA"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </>
          )}
        </View>

        {/* Buttons */}
        {emailSent ? (
          <TouchableOpacity 
            style={styles.continueButton}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.continueButtonText}>Giriş Sayfasına Dön</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.continueButton}
            onPress={handleResetPassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.continueButtonText}>Şifre Sıfırlama Bağlantısı Gönder</Text>
            )}
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222222',
    marginLeft: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
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
  formContainer: {
    marginBottom: 30,
    flex: 1,
  },
  instructionText: {
    fontSize: 16,
    color: '#222222',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    height: 50,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  continueButton: {
    backgroundColor: '#E6A05F',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222222',
    marginTop: 20,
    marginBottom: 10,
  },
  successMessage: {
    fontSize: 16,
    color: '#555555',
    textAlign: 'center',
    lineHeight: 22,
  },
});