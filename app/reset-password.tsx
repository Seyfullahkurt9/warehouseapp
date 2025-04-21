import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  TextInput, 
  StatusBar, 
  Alert 
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Svg, Path, Rect } from 'react-native-svg';

export default function ResetPasswordScreen() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleConfirm = () => {
    // Basic validation
    if (!newPassword || !confirmPassword) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor.');
      return;
    }
    
    if (newPassword.length < 6) {
      Alert.alert('Hata', 'Şifre en az 6 karakter olmalıdır.');
      return;
    }
    
    // In a real app, this would update the password in the backend
    // For now, just navigate to the success screen
    router.push('/password-success');
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
          <Text style={styles.headerTitle}>Yeni şifre oluştur</Text>
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
          <Text style={styles.formTitle}>Şifre oluşturun</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Yeni şifre oluşturun"
            placeholderTextColor="#AAAAAA"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />
          
          <TextInput
            style={styles.input}
            placeholder="Şifrenizi tekrar girin"
            placeholderTextColor="#AAAAAA"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
        </View>

        {/* Confirm Button */}
        <TouchableOpacity 
          style={styles.confirmButton}
          onPress={handleConfirm}
        >
          <Text style={styles.confirmButtonText}>Onayla</Text>
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
    alignItems: 'center',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222222',
    marginBottom: 25,
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
    width: '100%',
  },
  confirmButton: {
    backgroundColor: '#E6A05F',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});