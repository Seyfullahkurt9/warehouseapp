import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, TextInput, TouchableWithoutFeedback } from 'react-native';
import { Svg, Path, Rect } from 'react-native-svg';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; 

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const params = useLocalSearchParams();
  const userType = params.userType as string || 'user';

  const handleLogin = () => {
    // In a real app, you would validate credentials here
    if (userType === 'admin') {
      router.replace('./admin-home');
    } else {
      router.replace('./home');
    }
  };

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
      <Text style={styles.title}>
        {userType === 'admin' ? 'Admin Giriş' : 'Kullanıcı Giriş'}
      </Text>
      
      {/* Input fields */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Kullanıcı No"
          placeholderTextColor="#AAAAAA"
          value={username}
          onChangeText={setUsername}
        />
        
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Şifre"
            placeholderTextColor="#AAAAAA"
            secureTextEntry={!passwordVisible}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity 
            style={styles.eyeIcon} 
            onPress={() => setPasswordVisible(!passwordVisible)}
          >
            <Ionicons 
              name={passwordVisible ? "eye-off" : "eye-off-outline"} 
              size={20} 
              color="#AAAAAA" 
            />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.forgotPassword}
          onPress={() => router.push('/forgot-password')}
        >
          <Text style={styles.forgotPasswordText}>Şifremi unuttum</Text>
        </TouchableOpacity>
      </View>
      
      {/* Login button */}
      <TouchableOpacity 
        style={styles.loginButton}
        onPress={handleLogin}
      >
        <Text style={styles.loginButtonText}>Giriş yap</Text>
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
      
      {/* Fingerprint icon */}
      <TouchableOpacity style={styles.fingerprintContainer}>
        <Ionicons name="finger-print-outline" size={36} color="#888888" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

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
    marginTop: 30,
    marginBottom: 30,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 30,
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    height: 50,
    marginBottom: 5,
  },
  passwordInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  eyeIcon: {
    paddingHorizontal: 15,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 5,
  },
  forgotPasswordText: {
    color: '#888888',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#E6A05F',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  registerLinkContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  registerLinkText: {
    color: '#555555',
    fontSize: 16,
  },
  registerLinkBold: {
    fontWeight: 'bold',
    color: '#333333',
  },
  fingerprintContainer: {
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 40,
  },
});
