import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { Svg, Path, Rect } from 'react-native-svg';
import { router } from 'expo-router';
import { sendEmailVerification, getAuth } from 'firebase/auth';
import { logout } from '../firebase/auth';

export default function EmailVerificationScreen() {
  const [loading, setLoading] = useState(false);
  const auth = getAuth();
  const user = auth.currentUser;

  const handleResendVerification = async () => {
    if (!user) {
      Alert.alert("Hata", "Kullanıcı oturumu bulunamadı. Lütfen tekrar giriş yapınız.");
      router.replace('/login');
      return;
    }

    setLoading(true);
    try {
      await sendEmailVerification(user);
      Alert.alert(
        "Doğrulama E-postası Gönderildi", 
        "Lütfen e-posta kutunuzu kontrol ediniz ve doğrulama bağlantısına tıklayınız."
      );
    } catch (error) {
      console.error("Verification email error:", error);
      Alert.alert("Hata", "Doğrulama e-postası gönderilemedi. Lütfen daha sonra tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await logout();
      router.replace('/login');
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert("Hata", "Çıkış yapılırken bir sorun oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
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
          <Rect x="50" y="70" width="8" height="8" fill="#E6A05F" />
          <Rect x="62" y="70" width="8" height="8" fill="#E6A05F" />
          <Rect x="50" y="82" width="8" height="8" fill="#E6A05F" />
          <Rect x="62" y="82" width="8" height="8" fill="#E6A05F" />
        </Svg>
        
        <Text style={styles.logoText}>TRACKIT</Text>
        <Text style={styles.subLogoText}>DEPO TAKİP SİSTEMİ</Text>
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.title}>E-posta Doğrulama Gerekli</Text>
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Hesabınızı kullanabilmek için e-posta adresinizi doğrulamanız gerekmektedir.
            Lütfen e-posta kutunuzu kontrol edin ve gönderilen doğrulama bağlantısına tıklayın.
          </Text>
          
          <Text style={styles.emailText}>
            Doğrulama için e-posta adresi: <Text style={styles.emailHighlight}>{user?.email || "..."}</Text>
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.resendButton}
          onPress={handleResendVerification}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.resendButtonText}>Doğrulama E-postasını Tekrar Gönder</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleSignOut}
          disabled={loading}
        >
          <Text style={styles.backButtonText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
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
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222222',
    textAlign: 'center',
    marginBottom: 25,
  },
  infoContainer: {
    backgroundColor: '#FFF9F2',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#FFE8D2',
  },
  infoText: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  emailText: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
  },
  emailHighlight: {
    color: '#E6A05F',
    fontWeight: 'bold',
  },
  resendButton: {
    backgroundColor: '#E6A05F',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  resendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: 'bold',
  }
});