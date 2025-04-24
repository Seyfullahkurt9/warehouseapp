import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Svg, Path, Rect } from 'react-native-svg';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
// Import our custom modules
import { registerUser } from '../firebase/auth';
import { createUserDocument, logUserAction } from '../firebase/firestore';
import { collection, addDoc } from 'firebase/firestore'; // Firestore fonksiyonlarını import et
import { db } from '../firebase/config'; // Firestore bağlantısını import et

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // Validate inputs
    if (!fullName || !phoneNumber || !email || !password || !confirmPassword) {
      Alert.alert("Hata", "Lütfen tüm alanları doldurunuz.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Hata", "Şifreler eşleşmiyor.");
      return;
    }

    setLoading(true);

    try {
      // Register with Firebase Authentication
      const user = await registerUser(email, password);
      
      // Ad ve soyadı ayırmak için basit bir mantık (boşluktan böl)
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Add user data to Firestore using our helper function
      // Auth UID'sini Firestore'a geçir
      const userDocRef = await createUserDocument({
        isim: firstName,
        soyisim: lastName,
        eposta: email,
        telefon: phoneNumber,
        is_unvani: "",
        firma_id: "", // Set firma_id to empty string
        yetki_id: ""
      }, user.uid);  // Auth UID'sini burada kullan
      
      // Log the action using our helper function
      await logUserAction(user.uid, "Kullanıcı kaydı");
      
      // Giris_Kayitlari tablosuna kayıt oluşturma kodunu kaldır veya firma_id'yi boş bırak
      /* 
      try {
        const girisKayitlariRef = collection(db, "Giris_Kayitlari");
        await addDoc(girisKayitlariRef, {
          eylem_tarihi: new Date(),
          eylem_turu: "kayıt",
          durumu: "başarılı",
          kullanici_id: user.uid,
          firma_id: "" // Ensure this is also empty or remove the log entry
        });
        console.log("Kayıt işlemi Giris_Kayitlari tablosuna eklendi");
      } catch (logError) {
        console.error("Kayıt işlemi Giris_Kayitlari tablosuna eklenirken hata:", logError);
      }
      */

      // Redirect to verification page
      router.push('/verification');
      
    } catch (error) {
      // Handle errors
      let errorMessage = "Kayıt sırasında bir hata oluştu.";
      if (error && typeof error === 'object' && 'code' in error) {
        if (error.code === 'auth/email-already-in-use') {
          errorMessage = "Bu e-posta adresi zaten kullanılıyor.";
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = "Geçersiz e-posta formatı.";
        } else if (error.code === 'auth/weak-password') {
          errorMessage = "Şifre çok zayıf.";
        }
      }
      Alert.alert("Hata", errorMessage);
      console.error("Registration error:", error);
    } finally {
      setLoading(false);
    }
  };

  // JSX return kısmı değişmedi
  return (
    <SafeAreaView style={styles.container}>
      {/* Back button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#222222" />
      </TouchableOpacity>

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

      {/* Title */}
      <Text style={styles.title}>Üye Ol</Text>
      
      {/* Input fields */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ad Soyad"
          placeholderTextColor="#AAAAAA"
          value={fullName}
          onChangeText={setFullName}
        />
        
        <View style={styles.phoneContainer}>
          <View style={styles.countryCode}>
            <Text style={styles.countryCodeText}>+90</Text>
          </View>
          <TextInput
            style={styles.phoneInput}
            placeholder="Telefon Numarası"
            placeholderTextColor="#AAAAAA"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />
        </View>
        
        <TextInput
          style={styles.input}
          placeholder="E-posta adresinizi girin"
          placeholderTextColor="#AAAAAA"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Şifre oluşturun"
          placeholderTextColor="#AAAAAA"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Şifrenizi tekrar girin"
          placeholderTextColor="#AAAAAA"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
      </View>
      
      {/* Register button */}
      <TouchableOpacity 
        style={styles.registerButton}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.registerButtonText}>Üye Ol</Text>
        )}
      </TouchableOpacity>
      
      {/* Login link */}
      <TouchableOpacity 
        style={styles.loginLinkContainer}
        onPress={() => router.push('/login')}
      >
        <Text style={styles.loginLinkText}>
          Hesabın var mı? <Text style={styles.loginLinkBold}>Giriş Yap</Text>
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// Mevcut stiller korundu
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 80,
    marginBottom: 20,
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
    marginBottom: 25,
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
  phoneContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    width: '100%',
  },
  countryCode: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    height: 50,
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  countryCodeText: {
    fontSize: 16,
    color: '#333333',
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    height: 50,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  registerButton: {
    backgroundColor: '#E6A05F',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  registerButtonText: {
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
