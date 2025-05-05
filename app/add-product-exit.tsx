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
  Alert
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { Picker } from '@react-native-picker/picker';
import { useLocalSearchParams } from 'expo-router';

// Müşteri tipi tanımı
interface Customer {
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

// Sipariş tipi tanımı
interface Order {
  id: string;
  musteri_id: string;
  aciklama: string;
  olusturma_tarihi: any;
  durum: string;
  firma_id: string;
}

export default function AddProductExitScreen() {
  const { userData, currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form verileri
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [selectedStock, setSelectedStock] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  
  // Veriler
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<Stock[]>([]);
  
  // Seçili öğelerin tam verileri
  const [selectedStockData, setSelectedStockData] = useState<Stock | null>(null);
  const [selectedCustomerData, setSelectedCustomerData] = useState<Customer | null>(null);
  const [selectedWarehouseData, setSelectedWarehouseData] = useState<Warehouse | null>(null);

  // Siparişlerle ilgili state'ler
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<string>('');
  const [selectedOrderData, setSelectedOrderData] = useState<Order | null>(null);

  // Parametreleri al
  const params = useLocalSearchParams();
  const preSelectedCustomerId = params.customerId as string;
  const preSelectedOrderId = params.orderId as string;
  const fromOrder = params.fromOrder === 'true';

  // Müşterileri, depoları ve stokları yükle
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        if (!userData?.firma_id) {
          setError("Kullanıcı firma bilgisi bulunamadı.");
          setInitialLoading(false);
          return;
        }
        
        // Müşterileri yükle
        const customersRef = collection(db, "Musteriler");
        const customersQuery = query(customersRef, where("firma_id", "==", userData.firma_id));
        const customersSnapshot = await getDocs(customersQuery);
        
        const customersData: Customer[] = [];
        customersSnapshot.forEach((doc) => {
          customersData.push({
            id: doc.id,
            sirket_ismi: doc.data().sirket_ismi,
            adres: doc.data().adres,
            telefon: doc.data().telefon,
            eposta: doc.data().eposta
          });
        });
        setCustomers(customersData);
        
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
        
        // Yükleme tamamlandıktan sonra, eğer sipariş sayfasından geldiyse
        // önceden seçilen değerleri ayarla
        if (fromOrder && preSelectedCustomerId) {
          setSelectedCustomer(preSelectedCustomerId);
          // Müşteri seçildiğinde setSelectedCustomerData otomatik olarak çalışacak
          
          // Sipariş için biraz gecikme ekleyerek müşteri onaylanmış siparişlerinin
          // yüklenmesini bekleyelim
          setTimeout(() => {
            if (preSelectedOrderId) {
              setSelectedOrder(preSelectedOrderId);
            }
          }, 500);
        }

        setInitialLoading(false);
      } catch (error) {
        console.error("Veri yüklenirken hata:", error);
        setError("Veriler yüklenirken bir hata oluştu.");
        setInitialLoading(false);
      }
    };
    
    fetchInitialData();
  }, [userData?.firma_id, preSelectedCustomerId, preSelectedOrderId, fromOrder]);
  
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
  
  // Seçili müşteriyi izle
  useEffect(() => {
    if (selectedCustomer) {
      const customer = customers.find(c => c.id === selectedCustomer);
      setSelectedCustomerData(customer || null);
    } else {
      setSelectedCustomerData(null);
    }
  }, [selectedCustomer, customers]);
  
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
  
  // Müşteri seçildiğinde onaylanmış siparişleri yükle
  useEffect(() => {
    const fetchCustomerOrders = async () => {
      if (selectedCustomer && userData?.firma_id) {
        try {
          const ordersRef = collection(db, "Siparisler");
          const q = query(
            ordersRef,
            where("musteri_id", "==", selectedCustomer),
            where("firma_id", "==", userData.firma_id),
            where("durum", "==", "Onaylandı")
          );
          
          const querySnapshot = await getDocs(q);
          const ordersList: Order[] = [];
          
          querySnapshot.forEach((doc) => {
            const orderData = doc.data();
            ordersList.push({
              id: doc.id,
              musteri_id: orderData.musteri_id,
              aciklama: orderData.aciklama,
              olusturma_tarihi: orderData.olusturma_tarihi,
              durum: orderData.durum,
              firma_id: orderData.firma_id
            });
          });
          
          setOrders(ordersList);
          
          // Mevcut seçimi temizle
          setSelectedOrder('');
          setSelectedOrderData(null);
        } catch (error) {
          console.error("Siparişler yüklenirken hata:", error);
          Alert.alert("Hata", "Müşterinin siparişleri yüklenirken bir hata oluştu.");
        }
      } else {
        setOrders([]);
        setSelectedOrder('');
        setSelectedOrderData(null);
      }
    };
    
    fetchCustomerOrders();
  }, [selectedCustomer, userData?.firma_id]);
  
  // Seçili siparişi izle
useEffect(() => {
  if (selectedOrder) {
    const order = orders.find(o => o.id === selectedOrder);
    setSelectedOrderData(order || null);
  } else {
    setSelectedOrderData(null);
  }
}, [selectedOrder, orders]);
  
  // Form doğrulama
  const validateForm = () => {
    if (!selectedCustomer) {
      Alert.alert("Hata", "Lütfen bir müşteri seçin.");
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
    
    const qtyNum = Number(quantity);
    
    if (qtyNum > selectedStockData.miktar) {
      Alert.alert("Yetersiz Stok", `Seçtiğiniz stok kaleminde yalnızca ${selectedStockData.miktar} ${selectedStockData.birim} bulunmaktadır.`);
      return false;
    }
    
    return true;
  };
  
  // Ürün çıkışı kaydetme
  const handleSaveExit = async () => {
    if (!validateForm()) return;
    
    try {
      setSaving(true);
      
      // Stok hareketini kaydet
      const stockMovementRef = collection(db, "Stok_Hareketleri");
      const stockRef = doc(db, "Stoklar", selectedStock);
      
      // Kalan stok miktarını hesapla
      const currentStock = selectedStockData!.miktar;
      const exitQuantity = Number(quantity);
      const remainingStock = currentStock - exitQuantity;
      
      // Stok hareketini ekle
      const movementDoc = await addDoc(stockMovementRef, {
        tarih: serverTimestamp(),
        islem_turu: "ürün_çıkışı",
        aciklama: description || `${selectedStockData!.urun_adi} ürün çıkışı`,
        miktar: exitQuantity,
        sonuc_miktar: remainingStock,
        stok_id: selectedStock,
        depo_id: selectedWarehouse,
        firma_id: userData?.firma_id,
        kaynak_id: selectedCustomer // Müşteri ID'si
      });
      
      // Stok miktarını güncelle
      await updateDoc(stockRef, {
        miktar: remainingStock
      });
      
      // Eylemler tablosuna kaydet
      const eylemlerRef = collection(db, "Eylemler");
      await addDoc(eylemlerRef, {
        eylem_tarihi: serverTimestamp(),
        eylem_aciklamasi: `"${selectedStockData!.urun_adi}" ürününden ${exitQuantity} ${selectedStockData!.birim} "${selectedCustomerData!.sirket_ismi}" müşterisine çıkışı yapıldı.`,
        kullanici_id: currentUser?.uid,
        kullanici_adi: userData?.isim + ' ' + userData?.soyisim,
        firma_id: userData?.firma_id,
        islem_turu: "urun_cikisi",
        ilgili_belge_id: movementDoc.id
      });
      
      // Eğer sipariş seçilmişse, siparişi "Tamamlandı" olarak güncelle
      if (selectedOrderData) {
        // Siparişi güncelle
        const orderRef = doc(db, "Siparisler", selectedOrderData.id);
        await updateDoc(orderRef, {
          durum: "Tamamlandı"
        });
        
        // Sipariş geçmişine ekle
        const historyRef = collection(db, "Siparis_Gecmisi");
        await addDoc(historyRef, {
          siparis_id: selectedOrderData.id,
          tarih: new Date(),
          durum: "Tamamlandı",
          aciklama: `Ürün çıkışı yapıldı. ${selectedStockData!.urun_adi}, miktar: ${exitQuantity} ${selectedStockData!.birim}`
        });
        
        // Eylemler tablosuna sipariş güncellemesi kaydı ekle
        await addDoc(eylemlerRef, {
          eylem_tarihi: serverTimestamp(),
          eylem_aciklamasi: `"${selectedCustomerData!.sirket_ismi}" müşterisine ait sipariş tamamlandı.`,
          kullanici_id: currentUser?.uid,
          kullanici_adi: userData?.isim + ' ' + userData?.soyisim,
          firma_id: userData?.firma_id,
          islem_turu: "siparis_guncelleme",
          ilgili_belge_id: selectedOrderData.id
        });
      }
      
      // Başarılı mesajı göster
      let successMessage = `"${selectedStockData!.urun_adi}" ürününden ${exitQuantity} ${selectedStockData!.birim} çıkışı başarıyla kaydedildi.`;
      if (selectedOrderData) {
        successMessage += ` Sipariş durumu "Tamamlandı" olarak güncellendi.`;
      }
      
      Alert.alert(
        "Başarılı",
        successMessage,
        [
          { 
            text: "Tamam", 
            onPress: () => router.push('/product-exit-success')
          }
        ]
      );
      
    } catch (error) {
      console.error("Ürün çıkışı kaydederken hata:", error);
      Alert.alert("Hata", "Ürün çıkışı kaydedilirken bir hata oluştu.");
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
        <TouchableOpacity style={styles.retryButton} onPress={() => router.replace('/product-exit')}>
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
          <Text style={styles.screenTitle}>Yeni Ürün Çıkışı</Text>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.formContainer}
        >
          <ScrollView style={styles.scrollView}>
            {/* Müşteri Seçimi */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Müşteri Seçin</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedCustomer}
                  onValueChange={(itemValue) => setSelectedCustomer(itemValue)}
                  style={styles.picker}
                >
                  <Picker.Item label="Müşteri seçin" value="" color="#AAAAAA" />
                  {customers.map((customer) => (
                    <Picker.Item 
                      key={customer.id} 
                      label={customer.sirket_ismi} 
                      value={customer.id} 
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Depo Seçimi */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Çıkış Yapılacak Depo</Text>
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
              <Text style={styles.label}>Çıkış Yapılacak Ürün</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedStock}
                  onValueChange={(itemValue) => setSelectedStock(itemValue)}
                  style={styles.picker}
                  enabled={filteredStocks.length > 0}
                >
                  <Picker.Item 
                    label={filteredStocks.length > 0 ? "Ürün seçin" : "Önce depo seçin"} 
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
            </View>

            {/* Sipariş Seçimi - Sadece müşteri seçildiğinde görünür */}
            {selectedCustomer && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Onaylanmış Sipariş {orders.length === 0 ? "(Mevcut sipariş yok)" : ""}
                </Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={selectedOrder}
                    onValueChange={(itemValue) => setSelectedOrder(itemValue)}
                    style={styles.picker}
                    enabled={orders.length > 0}
                  >
                    <Picker.Item 
                      label={orders.length > 0 ? "Sipariş seçin (isteğe bağlı)" : "Onaylanmış sipariş bulunmuyor"} 
                      value="" 
                      color="#AAAAAA" 
                    />
                    {orders.map((order) => {
                      // Tarihi formatla
                      let dateText = "Tarih yok";
                      if (order.olusturma_tarihi) {
                        const date = order.olusturma_tarihi.toDate ? 
                                    order.olusturma_tarihi.toDate() : 
                                    new Date(order.olusturma_tarihi);
                        dateText = date.toLocaleDateString('tr-TR');
                      }
                      
                      return (
                        <Picker.Item 
                          key={order.id} 
                          label={`${dateText} - ${order.aciklama.substring(0, 30)}${order.aciklama.length > 30 ? '...' : ''}`} 
                          value={order.id} 
                        />
                      );
                    })}
                  </Picker>
                </View>
              </View>
            )}

            {/* Miktar Girişi */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Çıkış Miktarı 
                {selectedStockData ? ` (Stok: ${selectedStockData.miktar} ${selectedStockData.birim})` : ''}
              </Text>
              <TextInput
                style={styles.input}
                value={quantity}
                onChangeText={setQuantity}
                placeholder="Çıkış miktarını girin"
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
                placeholder="Ürün çıkışı ile ilgili açıklama girin (isteğe bağlı)"
                placeholderTextColor="#AAAAAA"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Özet - Seçilenler */}
            {(selectedCustomerData || selectedWarehouseData || selectedStockData || selectedOrderData) && (
              <View style={styles.summaryContainer}>
                <Text style={styles.summaryTitle}>Özet Bilgiler</Text>
                
                {selectedCustomerData && (
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Müşteri:</Text>
                    <Text style={styles.summaryValue}>{selectedCustomerData.sirket_ismi}</Text>
                  </View>
                )}
                
                {selectedOrderData && (
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Sipariş:</Text>
                    <Text style={styles.summaryValue}>
                      {selectedOrderData.aciklama.substring(0, 50)}
                      {selectedOrderData.aciklama.length > 50 ? '...' : ''}
                    </Text>
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
                      <Text style={styles.summaryLabel}>Çıkış Miktarı:</Text>
                      <Text style={styles.summaryValue}>
                        {quantity} {selectedStockData.birim}
                      </Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>İşlem Sonrası Kalan:</Text>
                      <Text style={styles.summaryValue}>
                        {Math.max(0, selectedStockData.miktar - Number(quantity))} {selectedStockData.birim}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            )}

            {/* Kaydetme Butonu */}
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSaveExit}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Ürün Çıkışını Kaydet</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
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
    flex: 1,
    textAlign: 'center',
    marginRight: 40, // Geri butonu ile dengelemek için sağdan margin
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
  }
});