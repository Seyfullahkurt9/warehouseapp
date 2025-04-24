import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar,
  ScrollView
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function MenuScreen() {
  // Menu items data
  const menuItems = [
    {
      id: '1',
      title: 'Stok Hareket Geçmişi',
      route: '/stock-history',
    },
    {
      id: '2',
      title: 'Depolar Arası Stok Aktarımı',
      route: '/stock-transfer',
    },
    {
      id: '3',
      title: 'Son Giriş Bilgilerim',
      route: '/login-history',
    },
    {
      id: '4',
      title: 'Hareketlerim',
      route: '/my-actions',
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>TRACKIT</Text>
        </View>

        {/* Page Title */}
        <Text style={styles.pageTitle}>MENÜ</Text>

        {/* Menu Items */}
        <ScrollView 
          style={styles.menuContainer}
          contentContainerStyle={styles.menuContent}
          showsVerticalScrollIndicator={false}
        >
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => router.push(item.route as any)}
            >
              <Text style={styles.menuItemText}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>

      {/* Bottom Tab Navigation */}
      <View style={styles.tabBarContainer}>
        <View style={styles.tabBar}>
          <TouchableOpacity style={styles.tabItem}>
            <Ionicons name="grid" size={24} color="#E6A05F" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.tabItem}
            onPress={() => router.push('/home')}
          >
            <Ionicons name="home-outline" size={24} color="#666666" />
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
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222222',
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222222',
    textAlign: 'center',
    marginTop: 25,
    marginBottom: 30,
  },
  menuContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  menuContent: {
    paddingBottom: 100, // To account for the tab bar
  },
  menuItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  menuItemText: {
    fontSize: 16,
    color: '#222222',
    fontWeight: '500',
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