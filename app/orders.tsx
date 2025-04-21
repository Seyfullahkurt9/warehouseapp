import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar, 
  FlatList 
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';

// Sample order data
const orderData = [
  {
    id: '1',
    date: '01.11.2024',
    stockCode: 'STK002',
    productName: 'Çelik Matkap Ucu',
    quantity: '10',
    unit: 'Set',
  },
  // More orders can be added here later
];

export default function OrdersScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>TRACKIT</Text>
          </View>
          <View style={styles.headerBottom}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#222222" />
            </TouchableOpacity>
            <Text style={styles.screenTitle}>Siparişler</Text>
            <TouchableOpacity style={styles.cartButton}>
              <Feather name="shopping-cart" size={24} color="#222222" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Column Headers */}
        <View style={styles.columnHeaders}>
          <Text style={styles.columnHeader}>Tarih</Text>
          <Text style={styles.columnHeader}>Ürün/stok kodu</Text>
          <Text style={styles.columnHeader}>Ürün/stok adı</Text>
          <Text style={styles.columnHeader}>Miktarı</Text>
          <Text style={styles.columnHeader}>Birimi</Text>
        </View>

        {/* Order List */}
        <FlatList
          data={orderData}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.orderItem}>
              <Text style={styles.orderText}>{item.date}</Text>
              <Text style={styles.orderText}>{item.stockCode}</Text>
              <Text style={styles.orderText}>{item.productName}</Text>
              <Text style={styles.orderText}>{item.quantity}</Text>
              <Text style={styles.orderText}>{item.unit}</Text>
            </View>
          )}
          contentContainerStyle={styles.listContainer}
        />

        {/* Floating Action Button */}
        <TouchableOpacity 
          style={styles.fab}
          onPress={() => router.push('./create-order')}
        >
          <Ionicons name="add" size={30} color="#FFFFFF" />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Bottom Tab Navigation */}
      <View style={styles.tabBarContainer}>
        <View style={styles.tabBar}>
          <TouchableOpacity style={styles.tabItem}>
            <Ionicons name="grid-outline" size={24} color="#666666" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.tabItem}
            onPress={() => router.replace('/home')}
          >
            <Ionicons name="home-outline" size={24} color="#666666" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.tabItem}>
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerTop: {
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222222',
  },
  headerBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 5,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222222',
  },
  cartButton: {
    padding: 5,
  },
  columnHeaders: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  columnHeader: {
    flex: 1,
    fontSize: 12,
    color: '#888888',
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 80, // Give space for FAB
  },
  orderItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  orderText: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
  },
  fab: {
    position: 'absolute',
    bottom: 25,
    right: 25,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E6A05F',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1,
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
