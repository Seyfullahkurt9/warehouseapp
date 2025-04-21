import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>TRACKIT</Text>
        </View>
        
        <View style={styles.subHeader}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#222222" />
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Bilgilerim</Text>
          <View style={{ width: 24 }} /> {/* Empty view for centering */}
        </View>

        {/* Profile Card */}
        <View style={styles.cardContainer}>
          <View style={styles.card}>
            {/* User Header */}
            <View style={styles.userHeader}>
              <Text style={styles.userName}>AHMET GÜNER</Text>
              <View style={styles.userIconContainer}>
                <Ionicons name="person" size={28} color="#E6A05F" />
              </View>
            </View>

            {/* User Information */}
            <View style={styles.infoContainer}>
              {/* User No */}
              <View style={styles.infoGroup}>
                <Text style={styles.infoLabel}>Kullanıcı No</Text>
                <Text style={styles.infoValue}>2</Text>
              </View>

              {/* ID No */}
              <View style={styles.infoGroup}>
                <Text style={styles.infoLabel}>Kimlik No</Text>
                <Text style={styles.infoValue}>12345678911</Text>
              </View>

              {/* Phone */}
              <View style={styles.infoGroup}>
                <Text style={styles.infoLabel}>Telefon Numarası</Text>
                <Text style={styles.infoValue}>+905555555555</Text>
              </View>

              {/* Email */}
              <View style={styles.infoGroup}>
                <Text style={styles.infoLabel}>E-posta Adresi</Text>
                <Text style={styles.infoValue}>ahmet55@gmail.com</Text>
              </View>

              {/* Edit Button */}
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => router.push('/edit-profile')}
              >
                <Text style={styles.editButtonText}>Düzenle</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>

      {/* Bottom Tab Navigation */}
      <View style={styles.tabBarContainer}>
        <View style={styles.tabBar}>
          <TouchableOpacity style={styles.tabItem}>
            <Ionicons name="grid-outline" size={24} color="#666666" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.tabItem}
            onPress={() => router.push('/home')}
          >
            <Ionicons name="home-outline" size={24} color="#666666" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.tabItem}>
            <Ionicons name="person" size={24} color="#E6A05F" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  safeArea: {
    flex: 1,
    paddingTop: 10,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222222',
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 5,
    marginBottom: 10,
  },
  backButton: {
    padding: 5,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222222',
  },
  cardContainer: {
    flex: 1,
    padding: 16,
    paddingBottom: 80, // To account for the tab bar
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222222',
  },
  userIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoContainer: {
    marginTop: 5,
  },
  infoGroup: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 13,
    color: '#999999',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  editButton: {
    backgroundColor: '#E6A05F',
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
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