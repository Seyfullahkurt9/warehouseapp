import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar, 
  TextInput, 
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Modal
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { Picker } from '@react-native-picker/picker';

// Tedarikçi tipi tanımı
interface Supplier {
  id: string;
  sirket_ismi: string;
  adres?: string;
  telefon?: string;
  eposta?: string;
}

// Depo tipi tanımı
interface Warehouse {
  id: string;
  depo_adi: string;
  aktif: boolean;
}

// Stok tipi tanımı
interface Stock {
  id: string;
  urun_adi: string;
  birim: string;
  miktar: number;
  depo_id: string;
}

export default function AddProductEntryScreen() {
  const { userData, currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form verileri
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [selectedStock, setSelectedStock] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  
  // Veriler
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<Stock[]>([]);
  
  // Seçili öğelerin tam verileri
  const [selectedStockData, setSelectedStockData] = useState<Stock | null>(null);
  const [selectedSupplierData, setSelectedSupplierData] = useState<Supplier | null>(null);
  const [selectedWarehouseData, setSelectedWarehouseData] = useState<Warehouse | null>(null);

  // Yeni ürün ekleme
  const [newProductModalVisible, setNewProductModalVisible] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductUnit, setNewProductUnit] = useState('');
  const [creatingProduct, setCreatingProduct] = useState(false);

  // Tedarikçileri, depoları ve stokları yükle
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        if (!userData?.firma_id) {
          setError("Kullanıcı firma bilgisi bulunamadı.");
          setInitialLoading(false);
          return;
        }
        
        // Tedarikçileri yükle
        const suppliersRef = collection(db, "Tedarikciler");
        const suppliersQuery = query(suppliersRef, where("firma_id", "==", userData.firma_id));
        const suppliersSnapshot = await getDocs(suppliersQuery);
        
        const suppliersData: Supplier[] = [];
        suppliersSnapshot.forEach((doc) => {
          suppliersData.push({
            id: doc.id,
            sirket_ismi: doc.data().sirket_ismi,
            adres: doc.data().adres,
            telefon: doc.data().telefon,
            eposta: doc.data().eposta
          });
        });
        setSuppliers(suppliersData);
        
        // Aktif depoları yükle
        const warehousesRef = collection(db, "Depolar");
        const warehousesQuery = query(
          warehousesRef, 
          where("firma_id", "==", userData.firma_id),
          where("aktif", "==", true)
        );
        const warehousesSnapshot = await getDocs(warehousesQuery);
        
        const warehousesData: Warehouse[] = [];
        warehousesSnapshot.forEach((doc) => {
          warehousesData.push({
            id: doc.id,
            depo_adi: doc.data().depo_adi,
            aktif: doc.data().aktif
          });
        });
        setWarehouses(warehousesData);
        
        // Tüm stokları yükle
        const stocksRef = collection(db, "Stoklar");
        const stocksQuery = query(stocksRef, where("firma_id", "==", userData.firma_id));
        const stocksSnapshot = await getDocs(stocksQuery);
        
        const stocksData: Stock[] = [];
        stocksSnapshot.forEach((doc) => {
          stocksData.push({
            id: doc.id,
            urun_adi: doc.data().urun_adi,
            birim: doc.data().birim,
            miktar: doc.data().miktar,
            depo_id: doc.data().depo_id
          });
        });
        setStocks(stocksData);
        
        setInitialLoading(false);
      } catch (error) {
        console.error("Veri yüklenirken hata:", error);
        setError("Veriler yüklenirken bir hata oluştu.");
        setInitialLoading(false);
      }
    };
    
    fetchInitialData();
  }, [userData?.firma_id]);
  
  // Depo seçildiğinde stokları filtrele
  useEffect(() => {
    if (selectedWarehouse) {
      const filtered = stocks.filter(stock => stock.depo_id === selectedWarehouse);
      setFilteredStocks(filtered);
      setSelectedStock(''); // Stok seçimini sıfırla
      setSelectedStockData(null);
    } else {
      setFilteredStocks([]);
    }
  }, [selectedWarehouse, stocks]);
  
  // Seçili tedarikçiyi izle
  useEffect(() => {
    if (selectedSupplier) {
      const supplier = suppliers.find(s => s.id === selectedSupplier);
      setSelectedSupplierData(supplier || null);
    } else {
      setSelectedSupplierData(null);
    }
  }, [selectedSupplier, suppliers]);
  
  // Seçili depoyu izle
  useEffect(() => {
    if (selectedWarehouse) {
      const warehouse = warehouses.find(w => w.id === selectedWarehouse);
      setSelectedWarehouseData(warehouse || null);
    } else {
      setSelectedWarehouseData(null);
    }
  }, [selectedWarehouse, warehouses]);
  
  // Seçili stoku izle
  useEffect(() => {
    if (selectedStock) {
      const stock = filteredStocks.find(s => s.id === selectedStock);
      setSelectedStockData(stock || null);
    } else {
      setSelectedStockData(null);
    }
  }, [selectedStock, filteredStocks]);

  // Yeni ürün oluşturma
  const handleCreateNewProduct = async () => {
    // Validasyon
    if (!newProductName.trim()) {
      Alert.alert("Hata", "Ürün adı girmelisiniz.");
      return;
    }

    if (!newProductUnit.trim()) {
      Alert.alert("Hata", "Birim girmelisiniz.");
      return;
    }

    if (!selectedWarehouse) {
      Alert.alert("Hata", "Önce depo seçmelisiniz.");
      return;
    }

    try {
      setCreatingProduct(true);

      // Stoklar koleksiyonuna yeni ürün ekle
      const stocksRef = collection(db, "Stoklar");
      const newStockRef = await addDoc(stocksRef, {
        urun_adi: newProductName.trim(),
        birim: newProductUnit.trim(),
        miktar: 0, // Başlangıçta 0 olacak, giriş yapılınca artacak
        depo_id: selectedWarehouse,
        firma_id: userData?.firma_id
      });

      // Tüm stokları güncelle
      const stocksQuery = query(
        collection(db, "Stoklar"), 
        where("firma_id", "==", userData?.firma_id)
      );
      const stocksSnapshot = await getDocs(stocksQuery);
      
      const stocksData: Stock[] = [];
      stocksSnapshot.forEach((doc) => {
        stocksData.push({
          id: doc.id,
          urun_adi: doc.data().urun_adi,
          birim: doc.data().birim,
          miktar: doc.data().miktar,
          depo_id: doc.data().depo_id
        });
      });
      setStocks(stocksData);
      
      // Filtrelenmiş stokları güncelle
      const filtered = stocksData.filter(stock => stock.depo_id === selectedWarehouse);
      setFilteredStocks(filtered);

      // Yeni oluşturulan ürünü seç
      setSelectedStock(newStockRef.id);

      // Eylemler tablosuna kayıt ekle
      const eylemlerRef = collection(db, "Eylemler");
      await addDoc(eylemlerRef, {
        eylem_tarihi: serverTimestamp(),
        eylem_aciklamasi: `"${newProductName.trim()}" yeni ürünü oluşturuldu.`,
        kullanici_id: currentUser?.uid,
        kullanici_adi: userData?.isim + ' ' + userData?.soyisim,
        firma_id: userData?.firma_id,
        islem_turu: "urun_olusturma",
        ilgili_belge_id: newStockRef.id
      });

      // Modal'ı kapat ve input alanlarını temizle
      setNewProductModalVisible(false);
      setNewProductName('');
      setNewProductUnit('');

      Alert.alert("Başarılı", "Yeni ürün başarıyla oluşturuldu.");
    } catch (error) {
      console.error("Yeni ürün oluşturulurken hata:", error);
      Alert.alert("Hata", "Yeni ürün oluşturulurken bir sorun oluştu.");
    } finally {
      setCreatingProduct(false);
    }
  };
  
  // Form doğrulama
  const validateForm = () => {
    if (!selectedSupplier) {
      Alert.alert("Hata", "Lütfen bir tedarikçi seçin.");
      return false;
    }
    
    if (!selectedWarehouse) {
      Alert.alert("Hata", "Lütfen bir depo seçin.");
      return false;
    }
    
    if (!selectedStock) {
      Alert.alert("Hata", "Lütfen bir stok kalemini seçin.");
      return false;
    }
    
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      Alert.alert("Hata", "Lütfen geçerli bir miktar girin.");
      return false;
    }
    
    if (!selectedStockData) {
      Alert.alert("Hata", "Stok bilgileri yüklenemedi.");
      return false;
    }
    
    return true;
  };
  
  // Ürün girişi kaydetme
  const handleSaveEntry = async () => {
    if (!validateForm()) return;
    
    try {
      setSaving(true);
      
      // Stok hareketini kaydet
      const stockMovementRef = collection(db, "Stok_Hareketleri");
      const stockRef = doc(db, "Stoklar", selectedStock);
      
      // Güncel stok miktarını al
      const stockDoc = await getDoc(stockRef);
      if (!stockDoc.exists()) {
        Alert.alert("Hata", "Seçilen stok artık mevcut değil.");
        setSaving(false);
        return;
      }
      
      // Yeni stok miktarını hesapla
      const currentStock = stockDoc.data().miktar;
      const entryQuantity = Number(quantity);
      const newStock = currentStock + entryQuantity;
      
      // Stok hareketini ekle
      const movementDoc = await addDoc(stockMovementRef, {
        tarih: serverTimestamp(),
        islem_turu: "ürün_girişi",
        aciklama: description || `${selectedStockData!.urun_adi} ürün girişi`,
        miktar: entryQuantity,
        sonuc_miktar: newStock,
        stok_id: selectedStock,
        depo_id: selectedWarehouse,
        firma_id: userData?.firma_id,
        kaynak_id: selectedSupplier // Tedarikçi ID'si
      });
      
      // Stok miktarını güncelle
      await updateDoc(stockRef, {
        miktar: newStock
      });
      
      // Eylemler tablosuna kaydet
      const eylemlerRef = collection(db, "Eylemler");
      await addDoc(eylemlerRef, {
        eylem_tarihi: serverTimestamp(),
        eylem_aciklamasi: `"${selectedStockData!.urun_adi}" ürününe ${entryQuantity} ${selectedStockData!.birim} "${selectedSupplierData!.sirket_ismi}" tedarikçisinden girişi yapıldı.`,
        kullanici_id: currentUser?.uid,
        kullanici_adi: userData?.isim + ' ' + userData?.soyisim,
        firma_id: userData?.firma_id,
        islem_turu: "urun_girisi",
        ilgili_belge_id: movementDoc.id
      });
      
      // Başarılı mesajı göster
      Alert.alert(
        "Başarılı",
        `"${selectedStockData!.urun_adi}" ürününe ${entryQuantity} ${selectedStockData!.birim} girişi başarıyla kaydedildi.`,
        [
          { 
            text: "Tamam", 
            onPress: () => router.push('/product-entry-success')
          }
        ]
      );
      
    } catch (error) {
      console.error("Ürün girişi kaydederken hata:", error);
      Alert.alert("Hata", "Ürün girişi kaydedilirken bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  if (initialLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#E6A05F" />
        <Text style={styles.loadingText}>Veriler yükleniyor...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Feather name="alert-circle" size={50} color="#FF6B6B" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.replace('/product-entry')}>
          <Text style={styles.retryButtonText}>Geri Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#222222" />
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Yeni Ürün Girişi</Text>
          <View style={{width: 40}}></View> {/* Balance için boş view */}
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.formContainer}
        >
          <ScrollView style={styles.scrollView}>
            {/* Tedarikçi Seçimi */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Tedarikçi Seçin</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedSupplier}
                  onValueChange={(itemValue) => setSelectedSupplier(itemValue)}
                  style={styles.picker}
                >
                  <Picker.Item label="Tedarikçi seçin" value="" color="#AAAAAA" />
                  {suppliers.map((supplier) => (
                    <Picker.Item 
                      key={supplier.id} 
                      label={supplier.sirket_ismi} 
                      value={supplier.id} 
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Depo Seçimi */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Giriş Yapılacak Depo</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedWarehouse}
                  onValueChange={(itemValue) => setSelectedWarehouse(itemValue)}
                  style={styles.picker}
                >
                  <Picker.Item label="Depo seçin" value="" color="#AAAAAA" />
                  {warehouses.map((warehouse) => (
                    <Picker.Item 
                      key={warehouse.id} 
                      label={warehouse.depo_adi} 
                      value={warehouse.id} 
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Stok Seçimi */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Giriş Yapılacak Ürün</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedStock}
                  onValueChange={(itemValue) => setSelectedStock(itemValue)}
                  style={styles.picker}
                  enabled={selectedWarehouse !== ''}
                >
                  <Picker.Item 
                    label={selectedWarehouse ? "Ürün seçin" : "Önce depo seçin"} 
                    value="" 
                    color="#AAAAAA" 
                  />
                  {filteredStocks.map((stock) => (
                    <Picker.Item 
                      key={stock.id} 
                      label={`${stock.urun_adi} (${stock.miktar} ${stock.birim})`} 
                      value={stock.id} 
                    />
                  ))}
                </Picker>
              </View>
              
              {selectedWarehouse && (
                <TouchableOpacity 
                  style={styles.newProductButton}
                  onPress={() => setNewProductModalVisible(true)}
                >
                  <Text style={styles.newProductButtonText}>Aradığım Ürün Listede Yok</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Miktar Girişi */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Giriş Miktarı 
                {selectedStockData ? ` (Mevcut Stok: ${selectedStockData.miktar} ${selectedStockData.birim})` : ''}
              </Text>
              <TextInput
                style={styles.input}
                value={quantity}
                onChangeText={setQuantity}
                placeholder="Giriş miktarını girin"
                placeholderTextColor="#AAAAAA"
                keyboardType="numeric"
              />
            </View>

            {/* Açıklama */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Açıklama</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Ürün girişi ile ilgili açıklama girin (isteğe bağlı)"
                placeholderTextColor="#AAAAAA"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Özet - Seçilenler */}
            {(selectedSupplierData || selectedWarehouseData || selectedStockData) && (
              <View style={styles.summaryContainer}>
                <Text style={styles.summaryTitle}>Özet Bilgiler</Text>
                
                {selectedSupplierData && (
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Tedarikçi:</Text>
                    <Text style={styles.summaryValue}>{selectedSupplierData.sirket_ismi}</Text>
                  </View>
                )}
                
                {selectedWarehouseData && (
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Depo:</Text>
                    <Text style={styles.summaryValue}>{selectedWarehouseData.depo_adi}</Text>
                  </View>
                )}
                
                {selectedStockData && (
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Ürün:</Text>
                    <Text style={styles.summaryValue}>{selectedStockData.urun_adi}</Text>
                  </View>
                )}
                
                {(selectedStockData && quantity && !isNaN(Number(quantity))) && (
                  <>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Giriş Miktarı:</Text>
                      <Text style={styles.summaryValue}>
                        {quantity} {selectedStockData.birim}
                      </Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>İşlem Sonrası Stok:</Text>
                      <Text style={styles.summaryValue}>
                        {selectedStockData.miktar + Number(quantity)} {selectedStockData.birim}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            )}

            {/* Kaydetme Butonu */}
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSaveEntry}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Ürün Girişini Kaydet</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Yeni Ürün Oluşturma Modal */}
        <Modal
          visible={newProductModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setNewProductModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Yeni Ürün Oluştur</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setNewProductModalVisible(false)}
                  disabled={creatingProduct}
                >
                  <Ionicons name="close" size={24} color="#222222" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalBody}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Ürün Adı</Text>
                  <TextInput
                    style={styles.input}
                    value={newProductName}
                    onChangeText={setNewProductName}
                    placeholder="Ürün adını girin"
                    placeholderTextColor="#AAAAAA"
                    editable={!creatingProduct}
                  />
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Birim (adet, kg, lt vb.)</Text>
                  <TextInput
                    style={styles.input}
                    value={newProductUnit}
                    onChangeText={setNewProductUnit}
                    placeholder="Ölçü birimini girin"
                    placeholderTextColor="#AAAAAA"
                    editable={!creatingProduct}
                  />
                </View>
                
                <TouchableOpacity
                  style={[styles.saveButton, creatingProduct && styles.saveButtonDisabled]}
                  onPress={handleCreateNewProduct}
                  disabled={creatingProduct}
                >
                  {creatingProduct ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.saveButtonText}>Ürünü Oluştur</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666666',
  },
  errorText: {
    fontSize: 16,
    color: '#FF6B6B',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#E6A05F',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  safeArea: {
    flex: 1,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    padding: 5,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222222',
  },
  formContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    color: '#333333',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#333333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  newProductButton: {
    marginTop: 10,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
  },
  newProductButtonText: {
    color: '#E6A05F',
    fontWeight: 'bold',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#E6A05F',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  saveButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  summaryContainer: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    paddingBottom: 8,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
    flex: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '90%',
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
  modalBody: {
    padding: 16,
  }
});