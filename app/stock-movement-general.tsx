import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar,
  ScrollView, 
  FlatList 
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';

export default function StockMovementGeneralScreen() {
  // Sample stock data
  const stockData = [
    {
      id: '1',
      code: 'STK001',
      name: 'Çelik Matkap Ucu',
      unit: 'Adet',
      warehouse: '1',
      quantity: '40',
    },
    {
      id: '2',
      code: 'STK002',
      name: 'Çekiç (350gr)',
      unit: 'Adet',
      warehouse: '2',
      quantity: '15',
    },
    {
      id: '3',
      code: 'STK003',
      name: 'Silikon Yapıştırıcı (310ml)',
      unit: 'Tüp',
      warehouse: '1',
      quantity: '83',
    },
    {
      id: '4',
      code: 'STK004',
      name: 'İnşaat Demiri (12mm)',
      unit: 'Metre',
      warehouse: '3',
      quantity: '250',
    },
    {
      id: '5',
      code: 'STK005',
      name: 'Elektrik Kablosu (3x1.5mm²)',
      unit: 'Metre',
      warehouse: '2',
      quantity: '320',
    },
    {
      id: '6',
      code: 'STK006',
      name: 'Beton Harcı',
      unit: 'Torba',
      warehouse: '3',
      quantity: '46',
    },
    {
      id: '7',
      code: 'STK007',
      name: 'Kontrplak (18mm)',
      unit: 'm²',
      warehouse: '1',
      quantity: '28',
    },
    {
      id: '8',
      code: 'STK008',
      name: 'Pense (200mm)',
      unit: 'Adet',
      warehouse: '2',
      quantity: '12',
    },
    {
      id: '9',
      code: 'STK009',
      name: 'Boya (15L) - Beyaz',
      unit: 'Kova',
      warehouse: '1',
      quantity: '9',
    },
    {
      id: '10',
      code: 'STK010',
      name: 'PVC Boru (100mm)',
      unit: 'Metre',
      warehouse: '3',
      quantity: '65',
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#222222" />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerMainTitle}>TRACKIT</Text>
            <Text style={styles.headerSubTitle}>Genel Stok Hareket Föyü</Text>
          </View>
          
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
          <Text style={[styles.columnHeader, styles.codeColumn]}>Ürün/stok{'\n'}kodu</Text>
          <Text style={[styles.columnHeader, styles.nameColumn]}>Ürün/stok{'\n'}adı</Text>
          <Text style={[styles.columnHeader, styles.unitColumn]}>Alış/Satış{'\n'}birimi</Text>
          <Text style={[styles.columnHeader, styles.warehouseColumn]}>Depo{'\n'}no</Text>
          <Text style={[styles.columnHeader, styles.quantityColumn]}>Stoktaki{'\n'}miktar</Text>
        </View>

        {/* Stock List */}
        <FlatList
          data={stockData}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.stockItem}>
              <Text style={[styles.stockItemText, styles.codeColumn]}>{item.code}</Text>
              <Text style={[styles.stockItemText, styles.nameColumn]} numberOfLines={2} ellipsizeMode="tail">{item.name}</Text>
              <Text style={[styles.stockItemText, styles.unitColumn]}>{item.unit}</Text>
              <Text style={[styles.stockItemText, styles.warehouseColumn]}>{item.warehouse}</Text>
              <Text style={[styles.stockItemText, styles.quantityColumn]}>{item.quantity}</Text>
              <TouchableOpacity style={styles.imageButton}>
                <View style={styles.imageIconContainer}>
                  <Feather name="camera" size={18} color="#666666" />
                </View>
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
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
  headerTitleContainer: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 10,
  },
  headerMainTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222222',
  },
  headerSubTitle: {
    fontSize: 14,
    color: '#222222',
    marginTop: 2,
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
    fontSize: 12,
    color: '#888888',
    fontWeight: '500',
  },
  codeColumn: {
    width: '15%',
  },
  nameColumn: {
    width: '30%',
  },
  unitColumn: {
    width: '15%',
  },
  warehouseColumn: {
    width: '10%',
  },
  quantityColumn: {
    width: '15%',
  },
  listContainer: {
    paddingBottom: 80, // Give space for tab bar
  },
  stockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  stockItemText: {
    fontSize: 14,
    color: '#333333',
  },
  imageButton: {
    width: '15%',
    alignItems: 'center',
  },
  imageIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
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