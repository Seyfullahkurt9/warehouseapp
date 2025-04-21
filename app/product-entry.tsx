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
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

// Sample product data
const initialProductData = [
  {
    id: '1',
    code: 'STK001',
    name: 'Çelik Matkap Ucu',
    unit: 'Adet',
    warehouseNo: '1',
    quantity: '40',
  },
  {
    id: '2',
    code: 'STK002',
    name: 'Endüstriyel Boya',
    unit: 'Litre',
    warehouseNo: '2',
    quantity: '25',
  },
  {
    id: '3',
    code: 'STK003',
    name: 'Ahşap Panel',
    unit: 'm²',
    warehouseNo: '1',
    quantity: '120',
  },
  {
    id: '4',
    code: 'STK004',
    name: 'Elektrik Kablosu',
    unit: 'Metre',
    warehouseNo: '3',
    quantity: '500',
  },
  {
    id: '5',
    code: 'STK005',
    name: 'LED Aydınlatma',
    unit: 'Adet',
    warehouseNo: '2',
    quantity: '75',
  },
];

export default function ProductEntryScreen() {
  const [productData, setProductData] = useState(initialProductData);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    code: '',
    name: '',
    barcode: '',  // Add this new property
    unit: '',
    warehouseNo: '',
    quantity: '',
    image: null as string | null,   // Update to allow string or null
  });
  
  const addProduct = () => {
    if (newProduct.code && newProduct.name && newProduct.unit) {
      setProductData([
        ...productData,
        {
          id: (productData.length + 1).toString(),
          ...newProduct
        }
      ]);
      
      // Reset form
      setNewProduct({
        code: '',
        name: '',
        barcode: '',  // Add this new property
        unit: '',
        warehouseNo: '',
        quantity: '',
        image: null,   // Add this new property
      });
      
      // Close modal
      setShowAddProduct(false);
      
      // Navigate to success screen
      router.push('./product-success');
    } else {
      alert('Lütfen gerekli alanları doldurun');
    }
  };

  const pickImage = async () => {
    // Request permission
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      alert("Görsel seçmek için izin vermeniz gerekmektedir!");
      return;
    }
  
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
  
    if (!result.canceled) {
      setNewProduct({...newProduct, image: result.assets[0].uri});
    }
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
            <Text style={styles.screenTitle}>Hizmet/Ürünler Girişi</Text>
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
          <View style={styles.cameraColumn} />
        </View>

        {/* Products List */}
        <FlatList
          data={productData}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.productItem}>
              <Text style={styles.productCode}>{item.code}</Text>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productUnit}>{item.unit}</Text>
              <Text style={[styles.productWarehouse, styles.warehouseColumn]}>{item.warehouseNo}</Text>
              <Text style={[styles.productQuantity, styles.quantityColumn]}>{item.quantity}</Text>
              <TouchableOpacity style={styles.cameraColumn}>
                <Feather name="camera" size={18} color="#666666" />
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={styles.listContainer}
        />

        {/* Floating Action Button */}
        <TouchableOpacity 
          style={styles.fab}
          onPress={() => setShowAddProduct(true)}
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

      {/* Add Product Modal */}
      <Modal
        visible={showAddProduct}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddProduct(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yeni Ürün/Hizmet Ekle</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowAddProduct(false)}
              >
                <Ionicons name="close" size={24} color="#222222" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Ürün/stok kodu</Text>
                <TextInput
                  style={styles.input}
                  value={newProduct.code}
                  onChangeText={(text) => setNewProduct({...newProduct, code: text})}
                  placeholder="Örn: STK006"
                  placeholderTextColor="#AAAAAA"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Ürün/stok adı</Text>
                <TextInput
                  style={styles.input}
                  value={newProduct.name}
                  onChangeText={(text) => setNewProduct({...newProduct, name: text})}
                  placeholder="Ürün adını girin"
                  placeholderTextColor="#AAAAAA"
                />
              </View>
              
              {/* New Barcode field */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Barkod numarası</Text>
                <TextInput
                  style={styles.input}
                  value={newProduct.barcode}
                  onChangeText={(text) => setNewProduct({...newProduct, barcode: text})}
                  placeholder="Barkod numarasını girin"
                  placeholderTextColor="#AAAAAA"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Alış/Satış birimi</Text>
                <TextInput
                  style={styles.input}
                  value={newProduct.unit}
                  onChangeText={(text) => setNewProduct({...newProduct, unit: text})}
                  placeholder="Örn: Adet, Kg, Litre"
                  placeholderTextColor="#AAAAAA"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Depo no</Text>
                <TextInput
                  style={styles.input}
                  value={newProduct.warehouseNo}
                  onChangeText={(text) => setNewProduct({...newProduct, warehouseNo: text})}
                  placeholder="Depo numarası"
                  placeholderTextColor="#AAAAAA"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Stoktaki miktar</Text>
                <TextInput
                  style={styles.input}
                  value={newProduct.quantity}
                  onChangeText={(text) => setNewProduct({...newProduct, quantity: text})}
                  placeholder="Başlangıç miktarını girin"
                  placeholderTextColor="#AAAAAA"
                  keyboardType="numeric"
                />
              </View>

              {/* New Product Image Upload section */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Ürün görseli ekle</Text>
                <TouchableOpacity 
                  style={styles.imageUploadButton}
                  onPress={pickImage}
                >
                  {newProduct.image ? (
                    <Image 
                      source={{ uri: newProduct.image }} 
                      style={{ width: '100%', height: '100%', borderRadius: 8 }} 
                    />
                  ) : (
                    <View style={styles.imageUploadContent}>
                      <Feather name="camera" size={24} color="#666666" />
                      <Text style={styles.imageUploadText}>Ürün görseli seçin</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={styles.saveButton}
                onPress={addProduct}
              >
                <Text style={styles.saveButtonText}>Kaydet</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
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
  cameraColumn: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    paddingBottom: 80, // Give space for FAB
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
  fab: {
    position: 'absolute',
    bottom: 25,
    right: 25,
    width: 56,
    height: 56,
    borderRadius: 16,
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
    maxHeight: '85%',
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
  },
  imageUploadButton: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  imageUploadContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageUploadText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#666666',
  },
});