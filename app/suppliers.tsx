import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar, 
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Linking
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import { collection, query, where, getDocs, doc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

// Tedarikçi tipi tanımı
interface Supplier {
  id: string;
  sirket_ismi: string;
  adres: string;
  telefon: string;
  eposta: string;
  firma_id: string;
  eklenme_tarihi?: any;
  ekleyen_kullanici?: string;
}

export default function SuppliersScreen() {
  const { userData, currentUser, fetchUserData } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRetry, setIsRetry] = useState(false);
  
  // Detay modalı için state değişkenleri
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  
  // Silme işlemleri için state değişkenleri
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [deletingSupplier, setDeletingSupplier] = useState(false);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        if (!userData || !userData.firma_id) {
          // Bir kez daha kullanıcı verilerini yüklemeyi dene
          if (!isRetry && currentUser) {
            console.log("Kullanıcı firma bilgisi yok, yeniden yükleniyor...");
            setIsRetry(true);
            const success = await fetchUserData(currentUser);
            if (!success) {
              setError("Kullanıcı firma bilgisi bulunamadı. Lütfen çıkış yapıp tekrar giriş yapınız.");
            }
            setLoading(false);
            return;
          }
          
          setError("Kullanıcı firma bilgisi bulunamadı");
          setLoading(false);
          return;
        }

        // Kullanıcının firma_id'si ile eşleşen tedarikçileri getir
        const suppliersRef = collection(db, "Tedarikciler");
        const q = query(suppliersRef, where("firma_id", "==", userData.firma_id));
        const querySnapshot = await getDocs(q);

        const suppliersList: Supplier[] = [];
        querySnapshot.forEach((doc) => {
          suppliersList.push({
            id: doc.id,
            ...doc.data()
          } as Supplier);
        });

        setSuppliers(suppliersList);
        setLoading(false);

      } catch (error) {
        console.error("Tedarikçiler yüklenirken hata:", error);
        
        // Error tipinin kontrol edilmesi
        let errorMessage = "Bilinmeyen hata";
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
        
        setError("Tedarikçiler yüklenemedi: " + errorMessage);
        setLoading(false);
      }
    };

    fetchSuppliers();
  }, [userData?.firma_id, isRetry, currentUser, fetchUserData]);

  const handleAddSupplier = () => {
    if (!userData || !userData.firma_id) {
      Alert.alert("Hata", "Tedarikçi ekleyebilmek için bir firmaya bağlı olmalısınız.");
      return;
    }

    router.push('/add-supplier');
  };
  
  // Tedarikçi detaylarını gösterme fonksiyonu
  const showSupplierDetails = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setDetailModalVisible(true);
  };

  // Telefon numarasını arama fonksiyonu
  const handleCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  // E-posta gönderme fonksiyonu
  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  // Tarih formatlama fonksiyonu
  const formatDate = (dateObject: any): string => {
    if (!dateObject) return '-';
    
    try {
      const date = dateObject.toDate ? dateObject.toDate() : new Date(dateObject);
      return date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return '-';
    }
  };
  
  // Tedarikçi silme fonksiyonu
  const handleDeleteSupplier = async () => {
    if (!selectedSupplier) return;
    
    setDeletingSupplier(true);
    
    try {
      // Firestore'dan tedarikçiyi sil
      const supplierRef = doc(db, "Tedarikciler", selectedSupplier.id);
      await deleteDoc(supplierRef);
      
      // Eylemler tablosuna silme kaydı ekle
      const eylemlerRef = collection(db, "Eylemler");
      await addDoc(eylemlerRef, {
        eylem_tarihi: new Date(),
        eylem_aciklamasi: `"${selectedSupplier.sirket_ismi}" isimli tedarikçi silindi.`,
        kullanici_id: currentUser?.uid || '',
        kullanici_adi: userData?.isim + ' ' + userData?.soyisim || 'Bilinmeyen Kullanıcı',
        firma_id: userData?.firma_id || '',
        islem_turu: 'tedarikci_silme',
        ilgili_belge_id: selectedSupplier.id
      });
      
      // Listeden tedarikçiyi kaldır
      setSuppliers(suppliers.filter(supplier => supplier.id !== selectedSupplier.id));
      
      // Modalları kapat
      setDeleteConfirmVisible(false);
      setDetailModalVisible(false);
      
      Alert.alert("Başarılı", `"${selectedSupplier.sirket_ismi}" tedarikçisi başarıyla silindi.`);
      
    } catch (error) {
      console.error("Tedarikçi silinirken hata:", error);
      Alert.alert("Hata", "Tedarikçi silinirken bir sorun oluştu.");
    }
    
    setDeletingSupplier(false);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#E6A05F" />
        <Text style={styles.loadingText}>Tedarikçiler yükleniyor...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Feather name="alert-circle" size={50} color="#FF6B6B" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.replace('/home')}>
          <Text style={styles.retryButtonText}>Ana Sayfaya Dön</Text>
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

        {/* Company Name Display */}
        <View style={styles.companyContainer}>
          <Text style={styles.companyLabel}>Şirket:</Text>
          <Text style={styles.companyName}>{userData?.firma_id || "Belirtilmemiş"}</Text>
        </View>

        {/* Column Headers */}
        <View style={styles.columnHeaders}>
          <Text style={[styles.columnHeader, styles.companyColumn]}>Firma Adı</Text>
          <Text style={[styles.columnHeader, styles.contactColumn]}>İletişim</Text>
          <Text style={[styles.columnHeader, styles.detailsColumn]}>Detay</Text>
        </View>

        {suppliers.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="inbox" size={40} color="#CCCCCC" />
            <Text style={styles.emptyText}>Henüz tedarikçi bulunmuyor</Text>
            <Text style={styles.emptySubText}>Tedarikçi eklemek için aşağıdaki butonu kullanabilirsiniz</Text>
          </View>
        ) : (
          <FlatList
            data={suppliers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.supplierItem}>
                <Text style={[styles.supplierName, styles.companyColumn]} numberOfLines={1} ellipsizeMode="tail">{item.sirket_ismi}</Text>
                <View style={[styles.contactInfo, styles.contactColumn]}>
                  <Text style={styles.contactText} numberOfLines={1} ellipsizeMode="tail">{item.telefon}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.detailsButton}
                  onPress={() => showSupplierDetails(item)}
                >
                  <View style={styles.detailsIconContainer}>
                    <Feather name="eye" size={18} color="#666666" />
                  </View>
                </TouchableOpacity>
              </View>
            )}
            contentContainerStyle={[
              styles.listContainer,
              suppliers.length === 0 && styles.emptyListContainer
            ]}
          />
        )}

        {/* Tedarikçi Detayları Modal */}
        <Modal
          visible={detailModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setDetailModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Tedarikçi Detayları</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setDetailModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#222222" />
                </TouchableOpacity>
              </View>
              
              {/* Modal Body */}
              {selectedSupplier ? (
                <ScrollView style={styles.modalBody}>
                  {/* Tedarikçi Özeti */}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Firma Bilgileri</Text>
                    
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Firma Adı:</Text>
                      <Text style={styles.detailValue}>{selectedSupplier.sirket_ismi}</Text>
                    </View>
                    
                    <View style={styles.addressContainer}>
                      <Text style={styles.detailLabel}>Adres:</Text>
                      <Text style={styles.addressValue}>{selectedSupplier.adres || 'Belirtilmemiş'}</Text>
                    </View>
                  </View>

                  {/* İletişim Bilgileri */}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>İletişim Bilgileri</Text>
                    
                    <View style={styles.contactDetailRow}>
                      <View style={styles.contactDetailText}>
                        <Text style={styles.detailLabel}>Telefon:</Text>
                        <Text style={styles.detailValue}>{selectedSupplier.telefon || 'Belirtilmemiş'}</Text>
                      </View>
                      {selectedSupplier.telefon && (
                        <TouchableOpacity 
                          style={styles.actionButton}
                          onPress={() => handleCall(selectedSupplier.telefon)}
                        >
                          <Feather name="phone" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                      )}
                    </View>
                    
                    <View style={styles.contactDetailRow}>
                      <View style={styles.contactDetailText}>
                        <Text style={styles.detailLabel}>E-posta:</Text>
                        <Text style={styles.detailValue}>{selectedSupplier.eposta || 'Belirtilmemiş'}</Text>
                      </View>
                      {selectedSupplier.eposta && (
                        <TouchableOpacity 
                          style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
                          onPress={() => handleEmail(selectedSupplier.eposta)}
                        >
                          <Feather name="mail" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  {/* Kayıt Bilgileri */}
                  {(selectedSupplier.eklenme_tarihi || selectedSupplier.ekleyen_kullanici) && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>Kayıt Bilgileri</Text>
                      
                      {selectedSupplier.eklenme_tarihi && (
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Eklenme Tarihi:</Text>
                          <Text style={styles.detailValue}>{formatDate(selectedSupplier.eklenme_tarihi)}</Text>
                        </View>
                      )}
                      
                      {selectedSupplier.ekleyen_kullanici && (
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Ekleyen:</Text>
                          <Text style={styles.detailValue}>{selectedSupplier.ekleyen_kullanici}</Text>
                        </View>
                      )}
                    </View>
                  )}
                  
                  {/* Silme Butonu - Sadece admin için göster */}
                  {userData?.yetki_id === "admin" && (
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => setDeleteConfirmVisible(true)}
                    >
                      <Text style={styles.deleteButtonText}>Tedarikçiyi Sil</Text>
                    </TouchableOpacity>
                  )}
                </ScrollView>
              ) : (
                <View style={styles.detailsLoading}>
                  <ActivityIndicator size="large" color="#E6A05F" />
                  <Text style={styles.loadingText}>Yükleniyor...</Text>
                </View>
              )}
            </View>
          </View>
        </Modal>

        {/* Silme Onay Modalı */}
        <Modal
          visible={deleteConfirmVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setDeleteConfirmVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.confirmModalContent}>
              <View style={styles.confirmModalHeader}>
                <Text style={styles.confirmModalTitle}>Tedarikçiyi Sil</Text>
              </View>
              
              <View style={styles.confirmModalBody}>
                <Text style={styles.confirmText}>
                  "{selectedSupplier?.sirket_ismi}" tedarikçisini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                </Text>
                
                <View style={styles.confirmButtons}>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => setDeleteConfirmVisible(false)}
                    disabled={deletingSupplier}
                  >
                    <Text style={styles.cancelButtonText}>İptal</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.confirmDeleteButton}
                    onPress={handleDeleteSupplier}
                    disabled={deletingSupplier}
                  >
                    {deletingSupplier ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.confirmDeleteButtonText}>Sil</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>

        {/* Floating Action Button */}
        <TouchableOpacity 
          style={styles.fab}
          onPress={handleAddSupplier}
        >
          <Ionicons name="add" size={30} color="#FFFFFF" />
        </TouchableOpacity>
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666666',
    fontSize: 16,
  },
  errorText: {
    marginTop: 10,
    color: '#FF6B6B',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#E6A05F',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
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
  companyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFF9F2',
  },
  companyLabel: {
    fontSize: 14,
    color: '#666666',
    marginRight: 6,
  },
  companyName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E6A05F',
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
    fontSize: 14,
    color: '#888888',
    fontWeight: '500',
  },
  companyColumn: {
    flex: 2,
  },
  contactColumn: {
    flex: 1.5,
  },
  detailsColumn: {
    flex: 0.8,
    textAlign: 'right',
  },
  listContainer: {
    paddingBottom: 80,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 10,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    paddingHorizontal: 40,
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
  supplierName: {
    fontSize: 15,
    color: '#333333',
    fontWeight: '500',
  },
  contactInfo: {
    justifyContent: 'center',
  },
  contactText: {
    fontSize: 14,
    color: '#666666',
  },
  detailsButton: {
    flex: 0.8,
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
  
  // Modal ve detay için yeni stiller
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '90%',
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
    maxHeight: '80%',
  },
  detailsLoading: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailSection: {
    marginBottom: 24,
    backgroundColor: '#F8F8F8',
    padding: 16,
    borderRadius: 8,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222222',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666666',
    width: 100,
  },
  detailValue: {
    fontSize: 14,
    color: '#222222',
    flex: 1,
  },
  addressContainer: {
    marginTop: 8,
  },
  addressValue: {
    fontSize: 14,
    color: '#222222',
    marginTop: 6,
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  contactDetailRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contactDetailText: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    backgroundColor: '#52B4F0',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  deleteButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmModalContent: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    maxWidth: 400,
  },
  confirmModalHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    alignItems: 'center',
  },
  confirmModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222222',
  },
  confirmModalBody: {
    padding: 20,
  },
  confirmText: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
    marginBottom: 20,
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#EEEEEE',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmDeleteButton: {
    flex: 1,
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  confirmDeleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});