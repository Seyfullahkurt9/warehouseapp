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

export default function ProductSuccessScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>TRACKIT</Text>
          </View>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#222222" />
          </TouchableOpacity>
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
          
          <Text style={styles.successMessage}>
            Yeni ürün başarıyla eklenmiştir.
          </Text>
          
          <TouchableOpacity 
            onPress={() => router.push('/product-entry')}
            style={styles.viewOrdersLink}
          >
            <Text style={styles.viewOrdersText}>
              Ürün listesini görüntülemek için tıklayın
            </Text>
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
    paddingTop: 10,
  },
  header: {
    paddingHorizontal: 16,
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
  backButton: {
    position: 'absolute',
    top: 15,
    left: 16,
    padding: 5,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
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
  successMessage: {
    fontSize: 18,
    color: '#333333',
    textAlign: 'center',
    marginBottom: 20,
  },
  viewOrdersLink: {
    padding: 10,
  },
  viewOrdersText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222222',
    textAlign: 'center',
  },
});