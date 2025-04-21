import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, 
         SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { Svg, Path, Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { loginWithEmail } from '../firebase/auth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Hata", "E-posta ve şifre alanları boş olamaz.");
      return;
    }

    setLoading(true);

    try {
      // Call our custom login function that checks user role
      const { user, userData, isAdmin } = await loginWithEmail(email, password);
      
      // Check if email is verified (optional)
      if (!user.emailVerified) {
        Alert.alert(
          "E-posta Doğrulanmadı", 
          "Lütfen e-posta adresinize gönderilen doğrulama linkini kullanarak hesabınızı doğrulayın.",
          [
            { text: "Tamam" },
            { 
              text: "Yeniden Gönder", 
              onPress: () => {
                // Implement resend verification email functionality here
                console.log("Resend verification");
              }
            }
          ]
        );
        setLoading(false);
        return;
      }
      
      // Log user role information
      console.log("User login successful:", user.email);
      console.log("User role:", isAdmin ? "Admin" : "Normal User");
      
      // Redirect based on user role
      if (isAdmin) {
        router.replace('/admin-home');
      } else {
        router.replace('/home');
      }

    } catch (error) {
      // Handle login errors
      let errorMessage = "Giriş sırasında bir hata oluştu.";
      
      if (error && typeof error === 'object' && 'code' in error) {
        if (error.code === 'auth/invalid-email') {
          errorMessage = "Geçersiz e-posta formatı.";
        } else if (error.code === 'auth/user-disabled') {
          errorMessage = "Bu kullanıcı hesabı devre dışı bırakıldı.";
        } else if (error.code === 'auth/user-not-found') {
          errorMessage = "Bu e-posta adresi ile kayıtlı bir kullanıcı bulunamadı.";
        } else if (error.code === 'auth/wrong-password') {
          errorMessage = "Yanlış şifre girdiniz.";
        }
      }
      
      Alert.alert("Giriş Hatası", errorMessage);
      console.error("Login error:", error);
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
