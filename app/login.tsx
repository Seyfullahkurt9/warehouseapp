import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity,
         SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { Svg, Path, Rect } from 'react-native-svg';
import { router } from 'expo-router';
import { loginWithEmail, getUserData, logout } from '../firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { FirebaseError } from 'firebase/app';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // Form validasyonu
    if (!email || !password) {
      Alert.alert("Hata", "E-posta ve şifre alanlarını doldurun.");
      return;
    }

    setLoading(true);

    try {
      // 1. Sadece Firebase Authentication ile giriş yap
      const user = await loginWithEmail(email, password);
      
      // 2. E-posta doğrulama kontrolü
      if (!user.emailVerified) {
        //setLoading(false);
        
        // Küçük bir gecikme ekleyin
        setTimeout(() => {
          router.replace('/email-verification');
        }, 500);
        return;
      }

      // SADECE doğrulanmış kullanıcılar için devam et...

      // 3. Firestore'dan kullanıcı verilerini çek
      const userData = await getUserData(user.uid);
      const isAdmin = userData?.yetki_id === "admin";
      
      // 4. AsyncStorage'a gerekli verileri kaydet
      try {
        const safeUserData = {
          uid: user.uid,
          email: user.email,
          firma_id: userData?.firma_id || '',
          isAdmin: isAdmin || false,
        };
        await AsyncStorage.setItem('userData', JSON.stringify(safeUserData));
      } catch (storageError) {
        console.error("AsyncStorage kayıt hatası:", storageError);
        // Kritik olmadığı için devam et
      }

      // 5. Sadece başarılı giriş kaydı oluştur
      try {
        const timestamp = new Date().getTime();
        const randomId = Math.random().toString(36).substring(2, 10);
        const uniqueId = `${timestamp}_${randomId}`;
        
        await setDoc(doc(db, "Giris_Kayitlari", uniqueId), {
          eylem_tarihi: serverTimestamp(),
          eylem_turu: "giriş",
          durumu: "başarılı",
          kullanici_id: user.uid,
          firma_id: userData?.firma_id || '',
        });
      } catch (logError) {
        console.error("Giriş kaydı oluşturma hatası:", logError);
        // Kritik olmadığı için devam et
      }

      // 6. Firma ID ve yetki kontrolü yaparak yönlendirme
      if (!userData?.firma_id) {
        router.replace('/first-page');
      } else {
        if (isAdmin) {
          router.replace('/admin-home');
        } else {
          router.replace('/home');
        }
      }

    } catch (error) {
      let errorMessage = "Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin.";
    
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'auth/invalid-credential':
          case 'auth/invalid-email':
          case 'auth/user-not-found':
          case 'auth/wrong-password':
            errorMessage = "E-posta veya şifre hatalı. Lütfen bilgilerinizi kontrol edin.";
            break;
          case 'auth/too-many-requests':
            errorMessage = "Çok fazla başarısız giriş denemesi. Lütfen daha sonra tekrar deneyin.";
            break;
          case 'auth/user-disabled':
            errorMessage = "Bu hesap devre dışı bırakılmış. Lütfen yönetici ile iletişime geçin.";
            break;
        }
      }
    
      Alert.alert("Giriş Başarısız", errorMessage);
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
