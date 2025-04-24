import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar,
  Alert // Import Alert
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext'; // Import useAuth

export default function FirstPageScreen() {
  const { logout, currentUser } = useAuth(); // Get logout function and currentUser

  const handleLogout = async () => {
    try {
      await logout();
      // AuthWrapper should handle the redirection to index or login
      console.log("Logout successful from first-page");
    } catch (error) {
      console.error("Logout error from first-page:", error);
      Alert.alert("Hata", "Çıkış yapılırken bir sorun oluştu.");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>TRACKIT</Text>
          {/* Add Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={26} color="#E6A05F" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          <Text style={styles.welcomeText}>Hoş Geldiniz!</Text>
          <Text style={styles.instructionText}>
            Devam etmek için lütfen bir firma oluşturun veya mevcut bir firmaya katılın.
          </Text>

          {/* Action Buttons */}
          <TouchableOpacity 
            style={[styles.actionButton, styles.createButton]}
            onPress={() => router.push('/create-company')} // Assuming you have this route
          >
            <Ionicons name="business-outline" size={30} color="#FFFFFF" style={styles.buttonIcon} />
            <View style={styles.buttonTextContainer}>
              <Text style={styles.buttonTitle}>Firma Oluştur</Text>
              <Text style={styles.buttonDescription}>Yeni bir firma hesabı başlatın.</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.joinButton]}
            onPress={() => router.push('/join-company')} // Assuming you have this route
          >
            <Ionicons name="person-add-outline" size={30} color="#FFFFFF" style={styles.buttonIcon} />
            <View style={styles.buttonTextContainer}>
              <Text style={styles.buttonTitle}>Firmaya Katıl</Text>
              <Text style={styles.buttonDescription}>Mevcut bir firmaya davet kodu ile katılın.</Text>
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
    paddingTop: 20, // Adjusted padding
  },
  header: {
    flexDirection: 'row', // Make header items align horizontally
    justifyContent: 'center', // Center title horizontally
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20, // Add horizontal padding
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    position: 'relative', // Needed for absolute positioning of logout button
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222222',
  },
  // Removed headerSubtitle as it wasn't in the original code snippet
  logoutButton: {
    position: 'absolute', // Position button absolutely
    right: 20, // Align to the right
    padding: 5, // Add padding for easier tapping
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