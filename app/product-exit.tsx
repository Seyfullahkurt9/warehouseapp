import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar, 
  FlatList,
  TextInput,
  Modal,
  Alert
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';

// Define product type to fix TypeScript errors
interface Product {
  id: string;
  code: string;
  name: string;
  unit: string;
  warehouseNo: string;
  quantity: number;
}

// Sample product data with proper typing
const initialProducts: Product[] = [
  {
    id: '1',
    code: 'STK001',
    name: 'Çelik Matkap Ucu',
    unit: 'Adet',
    warehouseNo: '1',
    quantity: 40,
  },
  {
    id: '2',
    code: 'STK002',
    name: 'Endüstriyel Boya',
    unit: 'Litre',
    warehouseNo: '2',
    quantity: 25,
  },
  {
    id: '3',
    code: 'STK003',
    name: 'Ahşap Panel',
    unit: 'm²',
    warehouseNo: '1',
    quantity: 120,
  },
  {
    id: '4',
    code: 'STK004',
    name: 'Elektrik Kablosu',
    unit: 'Metre',
    warehouseNo: '3',
    quantity: 500,
  },
  {
    id: '5',
    code: 'STK005',
    name: 'LED Aydınlatma',
    unit: 'Adet',
    warehouseNo: '2',
    quantity: 75,
  },
];

export default function ProductExitScreen() {
  // Use proper typing for state variables
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [exitAmount, setExitAmount] = useState('');
  const [exitDate, setExitDate] = useState(formatDate(new Date()));

  // Format date in DD.MM.YYYY format
  function formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  // Open modal with the selected product
  const openExitModal = (product: Product): void => {
    setCurrentProduct(product);
    setExitAmount('');
    setModalVisible(true);
  };

  // Handle the product exit
  const handleExitConfirm = (): void => {
    // Make sure currentProduct exists
    if (!currentProduct) {
      Alert.alert('Hata', 'Ürün bulunamadı.');
      return;
    }
    
    // Convert to number and validate
    const amount = Number(exitAmount);
    
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Hata', 'Geçerli bir çıkış miktarı giriniz.');
      return;
    }
    
    if (amount > currentProduct.quantity) {
      Alert.alert('Hata', 'Çıkış miktarı stok miktarından büyük olamaz.');
      return;
    }
    
    // Update the product
    const updatedProducts = products.map(p => {
      if (p.id === currentProduct.id) {
        return {
          ...p,
          quantity: p.quantity - amount
        };
      }
      return p;
    });
    
    // Update state and close modal
    setProducts(updatedProducts);
    setModalVisible(false);
    
    // Navigate to success screen
    router.push('/product-exit-success');
  };

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
            <Text style={styles.screenTitle}>Hizmet/Ürünler Çıkışı</Text>
            <View style={styles.headerIcons}>
              <TouchableOpacity style={styles.iconButton}>
                <Feather name="message-square" size={22} color="#222222" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton}>
                <Feather name="filter" size={22} color="#222222" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Column Headers */}
        <View style={styles.columnHeaders}>
          <Text style={styles.columnHeader}>Ürün/stok kodu</Text>
          <Text style={styles.columnHeader}>Ürün/stok adı</Text>
          <Text style={styles.columnHeader}>Alış/Satış birimi</Text>
          <Text style={[styles.columnHeader, styles.warehouseColumn]}>Depo no</Text>
          <Text style={[styles.columnHeader, styles.quantityColumn]}>Stoktaki miktar</Text>
          <View style={styles.actionColumn} />
        </View>

        {/* Products List */}
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.productItem}>
              <Text style={styles.productCode}>{item.code}</Text>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productUnit}>{item.unit}</Text>
              <Text style={[styles.productWarehouse, styles.warehouseColumn]}>{item.warehouseNo}</Text>
              <Text style={[styles.productQuantity, styles.quantityColumn]}>{item.quantity}</Text>
              <TouchableOpacity 
                style={styles.actionColumn}
                onPress={() => openExitModal(item)}
              >
                <MaterialIcons name="arrow-upward" size={20} color="#E6A05F" />
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={styles.listContainer}
        />
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

      {/* Product Exit Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ürün Çıkışı</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#222222" />
              </TouchableOpacity>
            </View>

            {currentProduct && (
              <View style={styles.modalForm}>
                <View style={styles.productInfo}>
                  <Text style={styles.productInfoTitle}>{currentProduct.name}</Text>
                  <Text style={styles.productInfoDetail}>Kod: {currentProduct.code}</Text>
                  <Text style={styles.productInfoDetail}>Mevcut Stok: {currentProduct.quantity} {currentProduct.unit}</Text>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Çıkış Tarihi</Text>
                  <TextInput
                    style={styles.input}
                    value={exitDate}
                    onChangeText={setExitDate}
                    placeholder="GG.AA.YYYY"
                    placeholderTextColor="#AAAAAA"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Çıkış Miktarı</Text>
                  <TextInput
                    style={styles.input}
                    value={exitAmount}
                    onChangeText={setExitAmount}
                    placeholder={`Maksimum: ${currentProduct.quantity} ${currentProduct.unit}`}
                    placeholderTextColor="#AAAAAA"
                    keyboardType="numeric"
                  />
                </View>

                <TouchableOpacity 
                  style={styles.saveButton}
                  onPress={handleExitConfirm}
                >
                  <Text style={styles.saveButtonText}>Çıkışı Onayla</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerTop: {
    marginBottom: 8,
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
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 6,
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
    flex: 2,
    fontSize: 12,
    color: '#888888',
    fontWeight: '500',
    marginRight: 8,
  },
  warehouseColumn: {
    flex: 1,
    textAlign: 'center',
  },
  quantityColumn: {
    flex: 1.5,
    textAlign: 'right',
  },
  actionColumn: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    paddingBottom: 80,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  productCode: {
    flex: 2,
    fontSize: 14,
    color: '#333333',
    marginRight: 8,
  },
  productName: {
    flex: 2,
    fontSize: 14,
    color: '#333333',
    marginRight: 8,
  },
  productUnit: {
    flex: 2,
    fontSize: 14,
    color: '#333333',
    marginRight: 8,
  },
  productWarehouse: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
    textAlign: 'center',
  },
  productQuantity: {
    flex: 1.5,
    fontSize: 14,
    color: '#333333',
    textAlign: 'right',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222222',
  },
  closeButton: {
    padding: 5,
  },
  modalForm: {
    padding: 16,
  },
  productInfo: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  productInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222222',
    marginBottom: 4,
  },
  productInfoDetail: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 2,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    height: 50,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#E6A05F',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  }
});