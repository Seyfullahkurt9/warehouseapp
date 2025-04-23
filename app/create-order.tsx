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
  Modal,
  FlatList,
  ActivityIndicator,
  Alert
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

// Müşteri tipi tanımı
interface Customer {
  id: string;
  sirket_ismi: string;
  adres?: string;
  telefon?: string;
  eposta?: string;
  firma_id: string;
}

// Sipariş tipi tanımı
interface Order {
  musteri_id: string;
  aciklama: string;
  olusturma_tarihi: Date;
  durum: string;
  firma_id: string;
  ekleyen_kullanici_id?: string;
  ekleyen_kullanici_adi?: string;
}

export default function CreateOrderScreen() {
  const { userData, currentUser } = useAuth();
  
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  
  // Müşteri seçimi için state değişkenleri
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [customerSearchText, setCustomerSearchText] = useState('');
  
  // Müşterileri getirme
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        if (!userData?.firma_id) {
          setLoadingCustomers(false);
          return;
        }

        const customersRef = collection(db, "Musteriler");
        const q = query(customersRef, where("firma_id", "==", userData.firma_id));
        const querySnapshot = await getDocs(q);

        const customersList: Customer[] = [];
        querySnapshot.forEach((doc) => {
          customersList.push({
            id: doc.id,
            ...doc.data()
          } as Customer);
        });

        setCustomers(customersList);
        setLoadingCustomers(false);
      } catch (error) {
        console.error("Müşteriler yüklenirken hata:", error);
        setLoadingCustomers(false);
        Alert.alert("Hata", "Müşteri listesi yüklenemedi");
      }
    };

    fetchCustomers();
  }, [userData?.firma_id]);

  // Siparişi kaydetme
  const handleSave = async () => {
    // Girişleri doğrula
    if (!selectedCustomer) {
      Alert.alert("Uyarı", "Lütfen bir müşteri seçiniz");
      return;
    }
    
    if (!description.trim()) {
      Alert.alert("Uyarı", "Lütfen sipariş açıklaması giriniz");
      return;
    }

    if (!userData?.firma_id) {
      Alert.alert("Hata", "Kullanıcı firma bilgisi bulunamadı");
      return;
    }

    setLoading(true);

    try {
      // Sipariş nesnesini oluştur
      const newOrder: Order = {
        musteri_id: selectedCustomer.id,
        aciklama: description.trim(),
        olusturma_tarihi: new Date(),
        durum: "Beklemede", // Varsayılan durum
        firma_id: userData.firma_id,
        ekleyen_kullanici_id: currentUser?.uid || '',
        ekleyen_kullanici_adi: userData?.isim + ' ' + userData?.soyisim || 'Bilinmeyen Kullanıcı'
      };

      // Siparişi Firestore'a kaydet
      const siparislerRef = collection(db, "Siparisler");
      const docRef = await addDoc(siparislerRef, newOrder);
      
      // Sipariş geçmişi oluştur
      const siparis_gecmisiRef = collection(db, "Siparis_Gecmisi");
      await addDoc(siparis_gecmisiRef, {
        siparis_id: docRef.id,
        tarih: new Date(),
        durum: "Beklemede",
        aciklama: "Sipariş oluşturuldu"
      });
      
      // Eylemler koleksiyonuna kayıt ekle
      const eylemlerRef = collection(db, "Eylemler");
      await addDoc(eylemlerRef, {
        eylem_tarihi: new Date(),
        eylem_aciklamasi: `"${selectedCustomer.sirket_ismi}" müşterisi için yeni sipariş oluşturuldu.`,
        kullanici_id: currentUser?.uid || '',
        kullanici_adi: userData?.isim + ' ' + userData?.soyisim || 'Bilinmeyen Kullanıcı',
        firma_id: userData.firma_id,
        islem_turu: 'siparis_olusturma',
        ilgili_belge_id: docRef.id
      });

      setLoading(false);
      router.push('/order-success');
      
    } catch (error) {
      console.error("Sipariş kaydedilirken hata:", error);
      setLoading(false);
      Alert.alert("Hata", "Sipariş kaydedilirken bir sorun oluştu. Lütfen tekrar deneyiniz.");
    }
  };

  // Filtrelenmiş müşterileri döndür
  const filteredCustomers = customers.filter(customer => 
    customer.sirket_ismi.toLowerCase().includes(customerSearchText.toLowerCase())
  );

  // Müşteri seçimi yap
  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerPicker(false);
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
            <Text style={styles.screenTitle}>Sipariş Oluşturma</Text>
            <View style={styles.headerRight}></View>
          </View>
        </View>

        {/* Form Content */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView 
            style={styles.scrollView} 
            contentContainerStyle={styles.formContainer}
            keyboardShouldPersistTaps="handled"
          >
            {/* Firma bilgisi */}
            {userData?.firma_id && (
              <View style={styles.firmaBilgisi}>
                <Text style={styles.firmaLabel}>Firma ID:</Text>
                <Text style={styles.firmaValue}>{userData.firma_id}</Text>
              </View>
            )}
            
            {/* Müşteri Seçimi */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Müşteri Seçimi*</Text>
              <TouchableOpacity
                style={[
                  styles.input, 
                  styles.selectInput, 
                  loadingCustomers && styles.disabledInput
                ]}
                onPress={() => {
                  if (!loadingCustomers) setShowCustomerPicker(true);
                }}
                disabled={loadingCustomers}
              >
                {loadingCustomers ? (
                  <ActivityIndicator size="small" color="#E6A05F" />
                ) : selectedCustomer ? (
                  <Text style={styles.inputText}>{selectedCustomer.sirket_ismi}</Text>
                ) : (
                  <Text style={styles.placeholderText}>Müşteri seçiniz</Text>
                )}
                <Feather name="chevron-down" size={20} color="#666666" />
              </TouchableOpacity>
            </View>

            {/* Açıklama Alanı */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Sipariş Açıklaması*</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Sipariş detaylarını giriniz"
                placeholderTextColor="#AAAAAA"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Durum Bilgisi */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Durum</Text>
              <View style={styles.statusContainer}>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>Beklemede</Text>
                </View>
                <Text style={styles.statusHint}>
                  Sipariş durumu otomatik olarak "Beklemede" olarak ayarlanır
                </Text>
              </View>
            </View>

            {/* Kaydetme Butonu */}
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Sipariş Oluştur</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Müşteri Seçme Modalı */}
        <Modal
          visible={showCustomerPicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowCustomerPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Müşteri Seçin</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setShowCustomerPicker(false)}
                >
                  <Ionicons name="close" size={24} color="#222222" />
                </TouchableOpacity>
              </View>

              {/* Arama Çubuğu */}
              <View style={styles.searchContainer}>
                <Feather name="search" size={20} color="#999999" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  value={customerSearchText}
                  onChangeText={setCustomerSearchText}
                  placeholder="Müşteri ara..."
                  placeholderTextColor="#AAAAAA"
                />
              </View>

              {/* Müşteri Listesi */}
              <FlatList
                data={filteredCustomers}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.customerItem}
                    onPress={() => handleSelectCustomer(item)}
                  >
                    <Text style={styles.customerName}>{item.sirket_ismi}</Text>
                    {item.telefon && <Text style={styles.customerInfo}>{item.telefon}</Text>}
                    {item.eposta && <Text style={styles.customerInfo}>{item.eposta}</Text>}
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyListContainer}>
                    <Text style={styles.emptyText}>
                      {customerSearchText ? "Arama kriterinize uygun müşteri bulunamadı" : "Müşteri listesi boş"}
                    </Text>
                  </View>
                }
                contentContainerStyle={styles.listContainer}
              />
            </View>
          </View>
        </Modal>
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
  headerRight: {
    width: 34, // Dengeleme için backButton ile aynı genişlik
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
    paddingBottom: 100,
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
    minHeight: 50,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#222222',
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  disabledInput: {
    backgroundColor: '#F5F5F5',
    borderColor: '#EEEEEE',
  },
  inputText: {
    fontSize: 16,
    color: '#222222',
    flex: 1,
  },
  placeholderText: {
    fontSize: 16,
    color: '#AAAAAA',
    flex: 1,
  },
  textArea: {
    paddingTop: 12,
    height: 120,
    textAlignVertical: 'top',
  },
  firmaBilgisi: {
    backgroundColor: '#FFF9F2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  firmaLabel: {
    fontSize: 14,
    color: '#666666',
    marginRight: 8,
  },
  firmaValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E6A05F',
  },
  statusContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    padding: 15,
  },
  statusBadge: {
    backgroundColor: '#F0B252', // Beklemede durumu için sarı
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusHint: {
    fontSize: 14,
    color: '#888888',
    fontStyle: 'italic',
  },
  saveButton: {
    backgroundColor: '#E6A05F',
    borderRadius: 8,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    margin: 16,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 45,
    fontSize: 16,
    color: '#222222',
  },
  listContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  customerItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222222',
    marginBottom: 4,
  },
  customerInfo: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#888888',
    textAlign: 'center',
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
