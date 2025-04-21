import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { logout } from '../firebase/auth';

export default function UserHomeScreen() {
  const { isAdmin, currentUser } = useAuth();
  
  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/login');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>TRACKIT</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton}>
              <Feather name="bell" size={24} color="#666666" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
              <Feather name="power" size={24} color="#666666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Grid Menu */}
        <View style={styles.gridContainer}>
          <View style={styles.gridRow}>
            <TouchableOpacity 
              style={styles.gridCard}
              onPress={() => router.push('/product-entry')}
            >
              <View style={styles.cardContent}>
                <Feather name="box" size={40} color="#666666" />
                <MaterialIcons name="arrow-downward" size={20} color="#666666" style={styles.overlayIcon} />
                <Text style={styles.cardText}>HİZMET/{'\n'}ÜRÜNLER{'\n'}GİRİŞİ</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.gridCard}
              onPress={() => router.push('/product-exit')}
            >
              <View style={styles.cardContent}>
                <Feather name="box" size={40} color="#666666" />
                <MaterialIcons name="arrow-upward" size={20} color="#666666" style={styles.overlayIcon} />
                <Text style={styles.cardText}>HİZMET/{'\n'}ÜRÜNLER{'\n'}ÇIKIŞI</Text>
              </View>
            </TouchableOpacity>
          </View>
          
          <View style={styles.gridRow}>
            <TouchableOpacity 
              style={styles.gridCard}
              onPress={() => router.push('/orders')}
            >
              <View style={styles.cardContent}>
                <Feather name="shopping-cart" size={40} color="#666666" />
                <Text style={styles.cardText}>SİPARİŞLER</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.gridCard}
              onPress={() => router.push('/suppliers')}
            >
              <View style={styles.cardContent}>
                <Feather name="users" size={40} color="#666666" />
                <Text style={styles.cardText}>TEDARİKÇİLER</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Admin Button - only show if user is admin */}
        {isAdmin && (
          <TouchableOpacity 
            style={styles.adminCornerButton}
            onPress={() => router.push('/admin-home')}
          >
            <View style={styles.adminButtonContent}>
              <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
              <Text style={styles.adminButtonText}>Admin Panel</Text>
            </View>
          </TouchableOpacity>
        )}
      </SafeAreaView>

      {/* Bottom Tab Navigation */}
      <View style={styles.tabBarContainer}>
        <View style={styles.tabBar}>
          <TouchableOpacity 
            style={styles.tabItem}
            onPress={() => router.push('/menu')}
          >
            <Ionicons name="grid-outline" size={24} color="#666666" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.tabItem}>
            <Ionicons name="home" size={26} color="#E6A05F" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.tabItem}
            onPress={() => router.push('/profile')}
          >
            <Ionicons name="person-outline" size={24} color="#666666" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  safeArea: {
    flex: 1,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222222',
  },
  headerIcons: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 8,
    marginLeft: 10,
  },
  gridContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  gridCard: {
    width: '48%',
    height: 140,
    backgroundColor: 'white',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 10,
    elevation: 3, // for Android
    shadowColor: '#000', // for iOS
    shadowOffset: { width: 0, height: 2 }, // for iOS
    shadowOpacity: 0.1, // for iOS
    shadowRadius: 4, // for iOS
    justifyContent: 'center',
  },
  cardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  overlayIcon: {
    position: 'absolute',
    top: 30,
    right: 42,
  },
  cardText: {
    marginTop: 15,
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    textAlign: 'center',
  },
  // New Admin Corner Button Styles
  adminCornerButton: {
    position: 'absolute',
    bottom: 80, // Positioned above the tab bar
    left: 0,
    backgroundColor: '#E6A05F',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 999,
  },
  adminButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 5,
  },
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    height: 60,
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
