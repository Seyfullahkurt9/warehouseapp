import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  TextInput, 
  StatusBar 
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Svg, Path, Rect } from 'react-native-svg';

export default function ForgotPasswordScreen() {
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);

  const handleSendCode = () => {
    // In a real app, this would send a verification code to the email
    if (userId && email) {
      setCodeSent(true);
      // Here you would call an API to send the actual code
    } else {
      alert('Lütfen kullanıcı no ve e-posta adresinizi girin.');
    }
  };

  const handleContinue = () => {
    // In a real app, this would validate the code and proceed to password reset
    if (code) {
      // Here you would call an API to verify the code
      router.push('/reset-password'); // This would be a new screen for setting a new password
    } else {
      alert('Lütfen kodu girin.');
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
          <Text style={styles.instructionText}>
            Yeni şifreyi almak için e-posta adresinizi girin
          </Text>
          
          <TextInput
            style={styles.input}
            placeholder="Kullanıcı No"
            placeholderTextColor="#AAAAAA"
            value={userId}
            onChangeText={setUserId}
            keyboardType="numeric"
          />
          
          <TextInput
            style={styles.input}
            placeholder="E-posta adresinizi girin"
            placeholderTextColor="#AAAAAA"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <TouchableOpacity 
            style={styles.sendCodeLink}
            onPress={handleSendCode}
          >
            <Text style={styles.sendCodeText}>Kod gönder</Text>
          </TouchableOpacity>
          
          <TextInput
            style={styles.input}
            placeholder="Kodu gir"
            placeholderTextColor="#AAAAAA"
            value={code}
            onChangeText={setCode}
            keyboardType="numeric"
          />
        </View>

        {/* Continue Button */}
        <TouchableOpacity 
          style={styles.continueButton}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>Devam et</Text>
        </TouchableOpacity>
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
  },
  instructionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222222',
    marginBottom: 20,
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
  sendCodeLink: {
    alignSelf: 'flex-end',
    marginTop: -5,
    marginBottom: 15,
  },
  sendCodeText: {
    color: '#888888',
    fontSize: 14,
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
});