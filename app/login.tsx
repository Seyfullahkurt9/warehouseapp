import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, 
         SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { Svg, Path, Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { loginWithEmail } from '../firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { FirebaseError } from 'firebase/app';
import { serverTimestamp } from 'firebase/firestore';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Hata", "E-posta ve şifre alanlarını doldurun.");
      return;
    }
    
    setLoading(true);
    
    try {
      // Giriş yap
      const { user, userData, isAdmin } = await loginWithEmail(email, password);
      
      try {
        // Başarılı giriş kaydı ekle - timeout kullanmadan direkt ekle
        const timestamp = new Date().getTime();
        const randomId = Math.random().toString(36).substring(2, 10);
        const uniqueId = `${timestamp}_${randomId}`;
        
        const girisKayitRef = doc(db, "Giris_Kayitlari", uniqueId);
        
        // Türkiye saati oluştur (UTC+3)
        const now = new Date();
        // Saat dilimi farkını ekle (UTC+3)
        const turkeyTime = new Date(now.getTime() + (3 * 60 * 60 * 1000));

        // Firestore'a kayıt ekle
        await setDoc(girisKayitRef, {
          eylem_tarihi: serverTimestamp(),  // Let Firestore handle the timestamp
          eylem_turu: "giriş",
          durumu: "başarılı",
          kullanici_id: user.uid,
          firma_id: userData?.firma_id || '',
        });
        
        console.log("Başarılı giriş kaydı oluşturuldu:", uniqueId);
        
        // Kullanıcı verilerini güvenli bir şekilde sakla
        const safeUserData = {
          uid: user.uid,
          email: user.email,
          firma_id: userData?.firma_id || '',
          isAdmin: isAdmin || false,
        };
        console.log("💾 AsyncStorage'a kaydediliyor:", Object.keys(safeUserData));

        // AsyncStorage'a kaydet
        await AsyncStorage.setItem('userData', JSON.stringify(safeUserData));
        console.log("✅ AsyncStorage kaydı tamamlandı");

        // Yönlendirme Mantığı: firma_id kontrolü
        if (!safeUserData.firma_id) {
          console.log("🔄 Kullanıcının firma ID'si yok, first-page'e yönlendiriliyor...");
          router.replace('/first-page'); 
        } else {
          console.log(`🔄 Kullanıcının firma ID'si var (${safeUserData.firma_id}), isAdmin: ${isAdmin}`);
          // Mevcut yönlendirme mantığı (admin veya normal kullanıcı)
          if (isAdmin) { // Use the 'isAdmin' variable directly
            router.replace('/admin-home');
          } else {
            router.replace('/home');
          }
        }
        console.log("✅ Yönlendirme tamamlandı");
        
      } catch (logError) {
        console.error("Giriş kaydı eklenirken hata:", logError);
        // Kayıt hatası olsa bile, giriş işlemi başarılı olduğu için yine de yönlendir
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        if (isAdmin) {
          router.replace('/admin-home');
        } else {
          router.replace('/home');
        }
      }
    } catch (caughtError: unknown) {
      // Sadece konsola loglama yap, kullanıcı arayüzünde hiç hata gösterme
      console.log("Giriş başarısız, hata:", caughtError);
      
      // Alert kısmını tamamen kaldırıyoruz
      // if (error instanceof FirebaseError) {
      //   Alert.alert("Giriş Başarısız", errorMessage);
      // }
    } finally {
      setLoading(false);
    }
  };

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
          <Rect x="50" y="70" width="8" height="8" fill="#E6A05F" />
          <Rect x="62" y="70" width="8" height="8" fill="#E6A05F" />
          <Rect x="50" y="82" width="8" height="8" fill="#E6A05F" />
          <Rect x="62" y="82" width="8" height="8" fill="#E6A05F" />
        </Svg>
        
        <Text style={styles.logoText}>TRACKIT</Text>
        <Text style={styles.subLogoText}>DEPO TAKİP SİSTEMİ</Text>
      </View>

      {/* Title */}
      <Text style={styles.title}>Giriş Yap</Text>
      
      {/* Input fields */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="E-posta"
          placeholderTextColor="#AAAAAA"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Şifre"
          placeholderTextColor="#AAAAAA"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>
      
      {/* Forgot password */}
      <TouchableOpacity style={styles.forgotPassword} onPress={() => router.push('/forgot-password')}>
        <Text style={styles.forgotPasswordText}>Şifremi Unuttum</Text>
      </TouchableOpacity>
      
      {/* Login button */}
      <TouchableOpacity 
        style={styles.loginButton}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.loginButtonText}>Giriş Yap</Text>
        )}
      </TouchableOpacity>
      
      {/* Register link */}
      <TouchableOpacity 
        style={styles.registerLinkContainer}
        onPress={() => router.push('/register')}
      >
        <Text style={styles.registerLinkText}>
          Hesabın yok mu? <Text style={styles.registerLinkBold}>Üye Ol</Text>
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
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222222',
    textAlign: 'center',
    marginBottom: 25,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    height: 50,
    marginBottom: 15,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  forgotPassword: {
    alignItems: 'flex-end',
    marginBottom: 25,
  },
  forgotPasswordText: {
    color: '#E6A05F',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#E6A05F',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  registerLinkContainer: {
    alignItems: 'center',
    marginTop: 15,
  },
  registerLinkText: {
    color: '#555555',
    fontSize: 16,
  },
  registerLinkBold: {
    fontWeight: 'bold',
    color: '#333333',
  },
});
