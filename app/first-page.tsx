import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function FirstPage() {
  // Şimdilik sadece butonların varlığını göstereceğiz, gerçek fonksiyonları sonra eklenecek
  const handleCreateCompany = () => {
    // İleride create-company sayfasına yönlendirme yapılacak
    alert('Firma Oluştur sayfası yapım aşamasında');
  };

  const handleJoinCompany = () => {
    // İleride join-company sayfasına yönlendirme yapılacak
    alert('Firmaya Katıl sayfası yapım aşamasında');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>TRACKIT</Text>
          <Text style={styles.headerSubtitle}>Firma Seçimi</Text>
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.welcomeText}>Hoş Geldiniz!</Text>
          <Text style={styles.instructionText}>
            Devam etmek için lütfen yeni bir firma oluşturun veya mevcut bir firmaya katılın.
          </Text>

          {/* Firma Oluştur Butonu */}
          <TouchableOpacity 
            style={[styles.actionButton, styles.createButton]}
            onPress={handleCreateCompany}
          >
            <Ionicons name="business-outline" size={32} color="#FFFFFF" style={styles.buttonIcon} />
            <View style={styles.buttonTextContainer}>
              <Text style={styles.buttonTitle}>Firma Oluştur</Text>
              <Text style={styles.buttonDescription}>Yeni bir firma hesabı oluşturun</Text>
            </View>
          </TouchableOpacity>

          {/* Firmaya Katıl Butonu */}
          <TouchableOpacity 
            style={[styles.actionButton, styles.joinButton]}
            onPress={handleJoinCompany}
          >
            <Ionicons name="people-outline" size={32} color="#FFFFFF" style={styles.buttonIcon} />
            <View style={styles.buttonTextContainer}>
              <Text style={styles.buttonTitle}>Firmaya Katıl</Text>
              <Text style={styles.buttonDescription}>Davet kodu ile mevcut bir firmaya katılın</Text>
            </View>
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
    paddingTop: 20,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222222',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E6A05F',
    marginTop: 4,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222222',
    textAlign: 'center',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  createButton: {
    backgroundColor: '#E6A05F',
  },
  joinButton: {
    backgroundColor: '#4A6FA5',
  },
  buttonIcon: {
    marginRight: 20,
  },
  buttonTextContainer: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  buttonDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
});