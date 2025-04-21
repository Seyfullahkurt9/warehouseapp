import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { Feather, MaterialIcons } from '@expo/vector-icons';

export default function AdminHomeScreen() {
  const handleLogout = () => {
    router.replace('/');
  };

  const handleSwitchToUser = () => {
    router.replace('/home');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>TRACKIT</Text>
        </View>

        {/* Menu List */}
        <View style={styles.menuContainer}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/profile')}
          >
            <View style={styles.menuItemContent}>
              <Feather name="user" size={24} color="#666666" style={styles.menuIcon} />
              <Text style={styles.menuText}>Bilgilerim</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/users')}
          >
            <View style={styles.menuItemContent}>
              <Feather name="users" size={24} color="#666666" style={styles.menuIcon} />
              <Text style={styles.menuText}>Kullanıcılar</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/login-history')}
          >
            <View style={styles.menuItemContent}>
              <Feather name="calendar" size={24} color="#666666" style={styles.menuIcon} />
              <Text style={styles.menuText}>Son Giriş Bilgilerim</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemContent}>
              <MaterialIcons name="store" size={24} color="#666666" style={styles.menuIcon} />
              <Text style={styles.menuText}>Depolar</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Bottom Buttons */}
        <View style={styles.bottomButtonContainer}>
          <View style={styles.buttonWrapper}>
            <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
              <Feather name="chevron-left" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.buttonLabel}>Çıkış</Text>
          </View>

          <View style={styles.buttonWrapper}>
            <TouchableOpacity style={styles.actionButton} onPress={handleSwitchToUser}>
              <Feather name="chevron-right" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.buttonLabel}>Kullanıcı Giriş</Text>
          </View>
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
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222222',
  },
  menuContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  menuItem: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 3, // for Android
    shadowColor: '#000', // for iOS
    shadowOffset: { width: 0, height: 2 }, // for iOS
    shadowOpacity: 0.1, // for iOS
    shadowRadius: 4, // for iOS
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    marginRight: 15,
  },
  menuText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222222',
  },
  bottomButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  buttonWrapper: {
    alignItems: 'center',
  },
  actionButton: {
    backgroundColor: '#E6A05F',
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonLabel: {
    fontSize: 14,
    color: '#222222',
  },
});
