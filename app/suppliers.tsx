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

// Sample supplier data
const supplierData = [
  {
    id: '1',
    code: '320.01',
    name: 'Paneltech Elektrik A.Ş.',
  },
  {
    id: '2',
    code: '320.02',
    name: 'Aspen İnşaat Malzemeleri Ltd. Şti.',
  },
  {
    id: '3',
    code: '320.03',
    name: 'Metalsan Sanayi Ürünleri A.Ş.',
  },
  {
    id: '4',
    code: '320.04',
    name: 'Tesa Kimyasallar Ltd.',
  },
  {
    id: '5',
    code: '320.05',
    name: 'Güreller Plastik Sanayi',
  },
  {
    id: '6',
    code: '320.06',
    name: 'Hitit Tekstil Ürünleri',
  },
  {
    id: '7',
    code: '320.07',
    name: 'Akınsoft Bilişim Çözümleri',
  },
  {
    id: '8',
    code: '320.08',
    name: 'Erka Kağıt A.Ş.',
  },
];

export default function SuppliersScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#222222" />
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Tedarikçiler</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton}>
              <Feather name="search" size={22} color="#666666" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Feather name="filter" size={22} color="#666666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Column Headers */}
        <View style={styles.columnHeaders}>
          <Text style={styles.columnHeader}>Firma kodu</Text>
          <Text style={[styles.columnHeader, styles.nameColumn]}>Firma unvanı</Text>
          <Text style={[styles.columnHeader, styles.detailsColumn]}>Firma detayları</Text>
        </View>

        {/* Suppliers List */}
        <FlatList
          data={supplierData}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.supplierItem}>
              <Text style={styles.supplierCode}>{item.code}</Text>
              <Text style={[styles.supplierName, styles.nameColumn]}>{item.name}</Text>
              <TouchableOpacity style={styles.detailsButton}>
                <View style={styles.detailsIconContainer}>
                  <Feather name="user" size={18} color="#666666" />
                </View>
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={styles.listContainer}
        />

        {/* Floating Action Button */}
        <TouchableOpacity 
          style={styles.fab}
          onPress={() => router.push('/add-supplier')}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  backButton: {
    padding: 5,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222222',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    marginLeft: 8,
  },
  columnHeaders: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    backgroundColor: '#FAFAFA',
  },
  columnHeader: {
    flex: 1,
    fontSize: 14,
    color: '#888888',
    fontWeight: '500',
  },
  nameColumn: {
    flex: 2.5,
  },
  detailsColumn: {
    flex: 1,
    textAlign: 'right',
  },
  listContainer: {
    paddingBottom: 80, // Give space for FAB
  },
  supplierItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  supplierCode: {
    flex: 1,
    fontSize: 15,
    color: '#333333',
  },
  supplierName: {
    flex: 2.5,
    fontSize: 15,
    color: '#333333',
  },
  detailsButton: {
    flex: 1,
    alignItems: 'flex-end',
  },
  detailsIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#E6A05F',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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