import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar 
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function PasswordSuccessScreen() {
  const handleGoToLogin = () => {
    // Navigate back to login
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>TRACKIT</Text>
          </View>
        </View>

        {/* Success Content */}
        <View style={styles.contentContainer}>
          <View style={styles.successIconContainer}>
            <View style={styles.successIconOuterRing}>
              <View style={styles.successIconInnerCircle}>
                <Ionicons name="checkmark" size={60} color="#FFFFFF" />
              </View>
            </View>
          </View>
          
          <Text style={styles.successTitle}>Şifre Değiştirildi!</Text>
          
          <Text style={styles.successMessage}>
            Şifreniz başarıyla değiştirildi. Yeni şifrenizle giriş yapabilirsiniz.
          </Text>
          
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={handleGoToLogin}
          >
            <Text style={styles.loginButtonText}>Giriş Yap</Text>
          </TouchableOpacity>
        </View>
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
    paddingVertical: 10,
  },
  headerContent: {
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222222',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: -40, // To center the content a bit higher than exact center
  },
  successIconContainer: {
    marginBottom: 30,
  },
  successIconOuterRing: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(75, 181, 67, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIconInnerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4BB543', // Vibrant green
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222222',
    marginBottom: 15,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  loginButton: {
    backgroundColor: '#E6A05F',
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    width: '100%',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});