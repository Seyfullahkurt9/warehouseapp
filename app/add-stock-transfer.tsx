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
import { collection, query, where, getDocs, doc, getDoc, updateDoc, setDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { Picker } from '@react-native-picker/picker';

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

export default function AddStockTransferScreen() {
  const { userData, currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form verileri
  const [sourceWarehouse, setSourceWarehouse] = useState<string>('');
  const [destinationWarehouse, setDestinationWarehouse] = useState<string>('');
  const [selectedStock, setSelectedStock] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  
  // Veriler
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [availableStocks, setAvailableStocks] = useState<Stock[]>([]);
  
  // Seçili öğelerin tam verileri
  const [selectedStockData, setSelectedStockData] = useState<Stock | null>(null);
  const [sourceWarehouseData, setSourceWarehouseData] = useState<Warehouse | null>(null);
  const [destinationWarehouseData, setDestinationWarehouseData] = useState<Warehouse | null>(null);

  // Depoları ve stokları yükle
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        if (!userData?.firma_id) {
          setError("Kullanıcı firma bilgisi bulunamadı.");
          setInitialLoading(false);
          return;
        }
        
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
  
  // Kaynak depo seçildiğinde stokları filtrele
  useEffect(() => {
    if (sourceWarehouse) {
      // Seçilen depodaki ve miktarı sıfırdan büyük olan stokları filtrele
      const filtered = stocks.filter(stock => 
        stock.depo_id === sourceWarehouse && stock.miktar > 0
      );
      setAvailableStocks(filtered);
      setSelectedStock(''); // Stok seçimini sıfırla
      setSelectedStockData(null);
      
      // Eğer hedef depo, kaynak depo ile aynıysa, hedef depoyu sıfırla
      if (destinationWarehouse === sourceWarehouse) {
        setDestinationWarehouse('');
        setDestinationWarehouseData(null);
      }
    } else {
      setAvailableStocks([]);
    }
  }, [sourceWarehouse, stocks]);
  
  // Seçili kaynak depoyu izle
  useEffect(() => {
    if (sourceWarehouse) {
      const warehouse = warehouses.find(w => w.id === sourceWarehouse);
      setSourceWarehouseData(warehouse || null);
    } else {
      setSourceWarehouseData(null);
    }
  }, [sourceWarehouse, warehouses]);
  
  // Seçili hedef depoyu izle
  useEffect(() => {
    if (destinationWarehouse) {
      const warehouse = warehouses.find(w => w.id === destinationWarehouse);
      setDestinationWarehouseData(warehouse || null);
    } else {
      setDestinationWarehouseData(null);
    }
  }, [destinationWarehouse, warehouses]);
  
  // Seçili stoku izle
  useEffect(() => {
    if (selectedStock) {
      const stock = availableStocks.find(s => s.id === selectedStock);
      setSelectedStockData(stock || null);
    } else {
      setSelectedStockData(null);
    }
  }, [selectedStock, availableStocks]);
  
  // Form doğrulama
  const validateForm = () => {
    if (!sourceWarehouse) {
      Alert.alert("Hata", "Lütfen bir kaynak depo seçin.");
      return false;
    }
    
    if (!destinationWarehouse) {
      Alert.alert("Hata", "Lütfen bir hedef depo seçin.");
      return false;
    }
    
    if (sourceWarehouse === destinationWarehouse) {
      Alert.alert("Hata", "Kaynak ve hedef depo aynı olamaz.");
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
  
  // Stok transferini kaydet
  const handleSaveTransfer = async () => {
    if (!validateForm()) return;
    
    try {
      setSaving(true);
      
      // Gerekli referansları al
      const sourceStockRef = doc(db, "Stoklar", selectedStock);
      
      // Kaynak stok dokümanını al
      const sourceStockDoc = await getDoc(sourceStockRef);
      if (!sourceStockDoc.exists()) {
        Alert.alert("Hata", "Seçilen stok artık mevcut değil.");
        setSaving(false);
        return;
      }
      
      const currentSourceStock = sourceStockDoc.data();
      const transferQuantity = Number(quantity);
      const remainingSourceStock = currentSourceStock.miktar - transferQuantity;
      
      // Hedef depodaki aynı ürünü bul (varsa)
      const targetStocksQuery = query(
        collection(db, "Stoklar"), 
        where("firma_id", "==", userData?.firma_id),
        where("depo_id", "==", destinationWarehouse),
        where("urun_adi", "==", currentSourceStock.urun_adi),
        where("birim", "==", currentSourceStock.birim)
      );
      
      const targetStocksSnapshot = await getDocs(targetStocksQuery);
      let targetStockRef;
      let newTargetQuantity;
      let existingTargetStock = false;
      let currentTargetStock = { miktar: 0 };
            
      if (!targetStocksSnapshot.empty) {
      // Hedef depoda bu ürün var, miktarını arttır
      const targetStockDoc = targetStocksSnapshot.docs[0];
      targetStockRef = doc(db, "Stoklar", targetStockDoc.id);
      currentTargetStock = targetStockDoc.data() as Stock;
      newTargetQuantity = currentTargetStock.miktar + transferQuantity;
      existingTargetStock = true;
      } else {
        // Hedef depoda bu ürün yok, yeni oluştur
        targetStockRef = doc(collection(db, "Stoklar"));
        newTargetQuantity = transferQuantity;
      }
      
      // Firestore işlemlerini başlat
      const stockMovementRef = collection(db, "Stok_Hareketleri");
      
      // 1. Kaynak depodan çıkış hareketi
      const sourceMovementDoc = await addDoc(stockMovementRef, {
        tarih: serverTimestamp(),
        islem_turu: "transfer", // Standartlaştırılmış değer
        aciklama: `${currentSourceStock.urun_adi} ürünü ${sourceWarehouseData?.depo_adi} deposundan ${destinationWarehouseData?.depo_adi} deposuna transfer (Çıkış)`,
        miktar: -transferQuantity, // Eksi değer (çıkış olduğu için)
        sonuc_miktar: remainingSourceStock,
        stok_id: selectedStock,
        depo_id: sourceWarehouse,
        firma_id: userData?.firma_id,
        kaynak_id: destinationWarehouse // Hedef depo bilgisi için kaynak_id kullanılıyor
      });
      
      // 2. Hedef depoya giriş hareketi
      const targetMovementDoc = await addDoc(stockMovementRef, {
        tarih: serverTimestamp(),
        islem_turu: "transfer", // Standartlaştırılmış değer
        aciklama: `${currentSourceStock.urun_adi} ürünü ${sourceWarehouseData?.depo_adi} deposundan ${destinationWarehouseData?.depo_adi} deposuna transfer (Giriş)`,
        miktar: transferQuantity, // Artı değer (giriş olduğu için)
        sonuc_miktar: newTargetQuantity,
        stok_id: existingTargetStock ? targetStockRef.id : null,
        depo_id: destinationWarehouse,
        firma_id: userData?.firma_id,
        kaynak_id: sourceWarehouse // Kaynak depo bilgisi için kaynak_id kullanılıyor
      });
      
      // 3. Kaynak depodaki stok miktarını azalt
      await updateDoc(sourceStockRef, {
        miktar: remainingSourceStock
      });
      
      // 4. Hedef depodaki stok miktarını arttır (veya yeni oluştur)
      if (existingTargetStock) {
        await updateDoc(targetStockRef, {
          miktar: newTargetQuantity
        });
      } else {
        // Yeni stok oluşturma - setDoc kullanıyoruz (updateDoc yerine)
        await setDoc(targetStockRef, {
          urun_adi: currentSourceStock.urun_adi,
          birim: currentSourceStock.birim,
          miktar: newTargetQuantity,
          depo_id: destinationWarehouse,
          firma_id: userData?.firma_id
        });
        
        // Yeni stok belgesinin ID'sini hedef stok hareketine ekle
        await updateDoc(doc(stockMovementRef, targetMovementDoc.id), {
          stok_id: targetStockRef.id
        });
      }
      
      // 5. Eylemler tablosuna kaydet
      const eylemlerRef = collection(db, "Eylemler");
      await addDoc(eylemlerRef, {
        eylem_tarihi: serverTimestamp(),
        eylem_aciklamasi: `"${currentSourceStock.urun_adi}" ürününden ${transferQuantity} ${currentSourceStock.birim} "${sourceWarehouseData!.depo_adi}" deposundan "${destinationWarehouseData!.depo_adi}" deposuna transfer edildi.`,
        kullanici_id: currentUser?.uid,
        kullanici_adi: userData?.isim + ' ' + userData?.soyisim,
        firma_id: userData?.firma_id,
        islem_turu: "stok_transferi",
        ilgili_belge_id: sourceMovementDoc.id
      });
      
      // Başarılı mesajı göster
      Alert.alert(
        "Başarılı",
        `"${currentSourceStock.urun_adi}" ürününden ${transferQuantity} ${currentSourceStock.birim} başarıyla transfer edildi.`,
        [
          { 
            text: "Tamam", 
            onPress: () => router.push('/transfer-success')
          }
        ]
      );
      
    } catch (error) {
      console.error("Stok transferi kaydederken hata:", error);
      Alert.alert("Hata", "Stok transferi kaydedilirken bir hata oluştu.");
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
        <TouchableOpacity style={styles.retryButton} onPress={() => router.replace('/menu')}>
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
          <Text style={styles.screenTitle}>Depolar Arası Transfer</Text>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.formContainer}
        >
          <ScrollView style={styles.scrollView}>
            {/* Kaynak Depo Seçimi */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Kaynak Depo</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={sourceWarehouse}
                  onValueChange={(itemValue) => setSourceWarehouse(itemValue)}
                  style={styles.picker}
                >
                  <Picker.Item label="Kaynak depo seçin" value="" color="#AAAAAA" />
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
              <Text style={styles.label}>Transfer Edilecek Ürün</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedStock}
                  onValueChange={(itemValue) => setSelectedStock(itemValue)}
                  style={styles.picker}
                  enabled={availableStocks.length > 0}
                >
                  <Picker.Item 
                    label={availableStocks.length > 0 ? "Ürün seçin" : "Önce kaynak depo seçin"} 
                    value="" 
                    color="#AAAAAA" 
                  />
                  {availableStocks.map((stock) => (
                    <Picker.Item 
                      key={stock.id} 
                      label={`${stock.urun_adi} (${stock.miktar} ${stock.birim})`} 
                      value={stock.id} 
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Hedef Depo Seçimi */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Hedef Depo</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={destinationWarehouse}
                  onValueChange={(itemValue) => setDestinationWarehouse(itemValue)}
                  style={styles.picker}
                  enabled={sourceWarehouse !== ''}
                >
                  <Picker.Item label="Hedef depo seçin" value="" color="#AAAAAA" />
                  {warehouses
                    .filter(warehouse => warehouse.id !== sourceWarehouse) // Kaynak depoyu hariç tut
                    .map((warehouse) => (
                      <Picker.Item 
                        key={warehouse.id} 
                        label={warehouse.depo_adi} 
                        value={warehouse.id} 
                      />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Miktar Girişi */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Transfer Miktarı 
                {selectedStockData ? ` (Mevcut: ${selectedStockData.miktar} ${selectedStockData.birim})` : ''}
              </Text>
              <TextInput
                style={styles.input}
                value={quantity}
                onChangeText={setQuantity}
                placeholder="Transfer miktarını girin"
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
                placeholder="Transfer ile ilgili açıklama girin (isteğe bağlı)"
                placeholderTextColor="#AAAAAA"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Özet - Seçilenler */}
            {(sourceWarehouseData || destinationWarehouseData || selectedStockData) && (
              <View style={styles.summaryContainer}>
                <Text style={styles.summaryTitle}>Özet Bilgiler</Text>
                
                {sourceWarehouseData && (
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Kaynak Depo:</Text>
                    <Text style={styles.summaryValue}>{sourceWarehouseData.depo_adi}</Text>
                  </View>
                )}
                
                {destinationWarehouseData && (
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Hedef Depo:</Text>
                    <Text style={styles.summaryValue}>{destinationWarehouseData.depo_adi}</Text>
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
                      <Text style={styles.summaryLabel}>Transfer Miktarı:</Text>
                      <Text style={styles.summaryValue}>
                        {quantity} {selectedStockData.birim}
                      </Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Kaynakta Kalan:</Text>
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
              onPress={handleSaveTransfer}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Transferi Kaydet</Text>
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