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
  Linking,
  Switch
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import { collection, query, where, getDocs, doc, deleteDoc, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

// Depo tipi tanımı
interface Warehouse {
  id: string;
  depo_adi: string;
  depo_turu: string;
  konum: string;
  aktif: boolean;
  telefon: string;
  firma_id: string;
  eklenme_tarihi?: any;
  ekleyen_kullanici?: string;
}

export default function WarehousesScreen() {
  const { userData, currentUser } = useAuth();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRetry, setIsRetry] = useState(false);
  
  // Detay modalı için state değişkenleri
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  
  // Silme işlemleri için state değişkenleri
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [deletingWarehouse, setDeletingWarehouse] = useState(false);

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        if (!userData || !userData.firma_id) {
          // Kullanıcı firma bilgisi eksikse hata göster
          if (!isRetry && currentUser) {
            console.log("Kullanıcı firma bilgisi yok, yeniden yükleniyor...");
            setIsRetry(true);
            return;
          }
          
          setError("Kullanıcı firma bilgisi bulunamadı");
          setLoading(false);
          return;
        }

        // Kullanıcının firma_id'si ile eşleşen depoları getir
        const warehousesRef = collection(db, "Depolar");
        const q = query(warehousesRef, where("firma_id", "==", userData.firma_id));
        const querySnapshot = await getDocs(q);

        const warehousesList: Warehouse[] = [];
        querySnapshot.forEach((doc) => {
          warehousesList.push({
            id: doc.id,
            ...doc.data()
          } as Warehouse);
        });

        setWarehouses(warehousesList);
        setLoading(false);

      } catch (error) {
        console.error("Depolar yüklenirken hata:", error);
        
        // Error tipinin kontrol edilmesi
        let errorMessage = "Bilinmeyen hata";
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
        
        setError("Depolar yüklenemedi: " + errorMessage);
        setLoading(false);
      }
    };

    fetchWarehouses();
  }, [userData?.firma_id]);

  const handleAddWarehouse = () => {
    if (!userData || !userData.firma_id) {
      Alert.alert("Hata", "Depo ekleyebilmek için bir firmaya bağlı olmalısınız.");
      return;
    }

    router.push('/add-warehouse');
  };

  // Depo detaylarını gösterme fonksiyonu
  const showWarehouseDetails = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setDetailModalVisible(true);
  };

  // Telefon numarasını arama fonksiyonu
  const handleCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
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

  // Depo silme fonksiyonu
  const handleDeleteWarehouse = async () => {
    if (!selectedWarehouse) return;
    
    setDeletingWarehouse(true);
    
    try {
      // Firestore'dan depoyu sil
      const warehouseRef = doc(db, "Depolar", selectedWarehouse.id);
      await deleteDoc(warehouseRef);
      
      // Eylemler tablosuna silme kaydı ekle
      const eylemlerRef = collection(db, "Eylemler");
      await addDoc(eylemlerRef, {
        eylem_tarihi: new Date(),
        eylem_aciklamasi: `"${selectedWarehouse.depo_adi}" isimli depo silindi.`,
        kullanici_id: currentUser?.uid || '',
        kullanici_adi: userData?.isim + ' ' + userData?.soyisim || 'Bilinmeyen Kullanıcı',
        firma_id: userData?.firma_id || '',
        islem_turu: 'depo_silme',
        ilgili_belge_id: selectedWarehouse.id
      });
      
      // Listeden depoyu kaldır
      setWarehouses(warehouses.filter(warehouse => warehouse.id !== selectedWarehouse.id));
      
      // Modalları kapat
      setDeleteConfirmVisible(false);
      setDetailModalVisible(false);
      
      Alert.alert("Başarılı", `"${selectedWarehouse.depo_adi}" deposu başarıyla silindi.`);
      
    } catch (error) {
      console.error("Depo silinirken hata:", error);
      Alert.alert("Hata", "Depo silinirken bir sorun oluştu.");
    }
    
    setDeletingWarehouse(false);
  };

  // Depo durumunu güncelleme fonksiyonu ekleyin
  const toggleWarehouseStatus = async () => {
    if (!selectedWarehouse) return;
    
    try {
      // Yeni durumu belirle (mevcut durumun tersi)
      const newStatus = !selectedWarehouse.aktif;
      
      // Firestore'da güncelleme
      const warehouseRef = doc(db, "Depolar", selectedWarehouse.id);
      await updateDoc(warehouseRef, {
        aktif: newStatus
      });
      
      // Eylemler tablosuna kayıt ekle
      const eylemlerRef = collection(db, "Eylemler");
      await addDoc(eylemlerRef, {
        eylem_tarihi: new Date(),
        eylem_aciklamasi: `"${selectedWarehouse.depo_adi}" depo durumu "${selectedWarehouse.aktif ? 'Aktif' : 'Pasif'}" durumundan "${newStatus ? 'Aktif' : 'Pasif'}" durumuna güncellendi.`,
        kullanici_id: currentUser?.uid || '',
        kullanici_adi: userData?.isim + ' ' + userData?.soyisim || 'Bilinmeyen Kullanıcı',
        firma_id: userData?.firma_id || '',
        islem_turu: 'depo_durum_degistirme',
        ilgili_belge_id: selectedWarehouse.id
      });
      
      // Seçili depoyu güncelle (UI için)
      setSelectedWarehouse({
        ...selectedWarehouse,
        aktif: newStatus
      });
      
      // Ana listede de güncelleme yap
      setWarehouses(warehouses.map(warehouse => 
        warehouse.id === selectedWarehouse.id 
          ? {...warehouse, aktif: newStatus} 
          : warehouse
      ));
      
      // Başarı mesajı göster
      Alert.alert(
        "Başarılı", 
        `"${selectedWarehouse.depo_adi}" deposu ${newStatus ? 'aktif' : 'pasif'} duruma getirildi.`
      );
      
    } catch (error) {
      console.error("Depo durumu güncellenirken hata:", error);
      Alert.alert("Hata", "Depo durumu güncellenirken bir sorun oluştu.");
    }
  };
  
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#E6A05F" />
        <Text style={styles.loadingText}>Depolar yükleniyor...</Text>
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
          <Text style={styles.screenTitle}>Depolar</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton}>
              <Feather name="search" size={22} color="#666666" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Feather name="filter" size={22} color="#666666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Depo Listesi veya Boş Durum */}
        {warehouses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="home" size={60} color="#CCCCCC" />
            <Text style={styles.emptyText}>Henüz depo bulunmuyor</Text>
            <Text style={styles.emptySubText}>Depo eklemek için aşağıdaki butonu kullanabilirsiniz</Text>
          </View>
        ) : (
          <FlatList
            data={warehouses}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.warehouseItem}>
                <Text style={[styles.warehouseName, styles.nameColumn]} numberOfLines={1} ellipsizeMode="tail">{item.depo_adi}</Text>
                <View style={[styles.typeInfo, styles.typeColumn]}>
                  <Text style={styles.typeText} numberOfLines={1} ellipsizeMode="tail">{item.depo_turu}</Text>
                </View>
                <View style={[styles.statusColumn]}>
                  <View style={[styles.statusIndicator, {backgroundColor: item.aktif ? '#4CAF50' : '#F44336'}]} />
                </View>
                <TouchableOpacity 
                  style={styles.detailsButton}
                  onPress={() => showWarehouseDetails(item)}
                >
                  <View style={styles.detailsIconContainer}>
                    <Feather name="eye" size={18} color="#666666" />
                  </View>
                </TouchableOpacity>
              </View>
            )}
            contentContainerStyle={[
              styles.listContainer,
              warehouses.length === 0 && styles.emptyListContainer
            ]}
          />
        )}

        {/* Depo Detayları Modal */}
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
                <Text style={styles.modalTitle}>Depo Detayları</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setDetailModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#222222" />
                </TouchableOpacity>
              </View>
              
              {/* Modal Body */}
              {selectedWarehouse ? (
                <ScrollView style={styles.modalBody}>
                  {/* Depo Bilgileri */}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Depo Bilgileri</Text>
                    
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Depo Adı:</Text>
                      <Text style={styles.detailValue}>{selectedWarehouse.depo_adi}</Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Depo Türü:</Text>
                      <Text style={styles.detailValue}>{selectedWarehouse.depo_turu}</Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Durumu:</Text>
                      <View style={styles.statusDetailRow}>
                        <Text style={styles.detailValue}>{selectedWarehouse.aktif ? 'Aktif' : 'Pasif'}</Text>
                        <View style={[styles.statusDetailIndicator, {backgroundColor: selectedWarehouse.aktif ? '#4CAF50' : '#F44336'}]} />
                      </View>
                    </View>
                    
                    {/* Durum değiştirme butonu - Sadece adminler görebilir */}
                    {userData?.yetki_id === "admin" && (
                      <TouchableOpacity 
                        style={styles.statusToggleButton}
                        onPress={toggleWarehouseStatus}
                      >
                        <Text style={styles.statusToggleButtonText}>
                          Durumu {selectedWarehouse.aktif ? 'Pasif' : 'Aktif'} Yap
                        </Text>
                      </TouchableOpacity>
                    )}
                    
                    <View style={styles.addressContainer}>
                      <Text style={styles.detailLabel}>Konum:</Text>
                      <Text style={styles.addressValue}>{selectedWarehouse.konum || 'Belirtilmemiş'}</Text>
                    </View>
                  </View>

                  {/* İletişim Bilgileri */}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>İletişim Bilgileri</Text>
                    
                    <View style={styles.contactDetailRow}>
                      <View style={styles.contactDetailText}>
                        <Text style={styles.detailLabel}>Telefon:</Text>
                        <Text style={styles.detailValue}>{selectedWarehouse.telefon || 'Belirtilmemiş'}</Text>
                      </View>
                      {selectedWarehouse.telefon && (
                        <TouchableOpacity 
                          style={styles.actionButton}
                          onPress={() => handleCall(selectedWarehouse.telefon)}
                        >
                          <Feather name="phone" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  {/* Kayıt Bilgileri */}
                  {(selectedWarehouse.eklenme_tarihi || selectedWarehouse.ekleyen_kullanici) && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>Kayıt Bilgileri</Text>
                      
                      {selectedWarehouse.eklenme_tarihi && (
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Eklenme Tarihi:</Text>
                          <Text style={styles.detailValue}>{formatDate(selectedWarehouse.eklenme_tarihi)}</Text>
                        </View>
                      )}
                      
                      {selectedWarehouse.ekleyen_kullanici && (
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Ekleyen:</Text>
                          <Text style={styles.detailValue}>{selectedWarehouse.ekleyen_kullanici}</Text>
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
                      <Text style={styles.deleteButtonText}>Depoyu Sil</Text>
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
                <Text style={styles.confirmModalTitle}>Depoyu Sil</Text>
              </View>
              
              <View style={styles.confirmModalBody}>
                <Text style={styles.confirmText}>
                  "{selectedWarehouse?.depo_adi}" deposunu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                </Text>
                
                <View style={styles.confirmButtons}>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => setDeleteConfirmVisible(false)}
                    disabled={deletingWarehouse}
                  >
                    <Text style={styles.cancelButtonText}>İptal</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.confirmDeleteButton}
                    onPress={handleDeleteWarehouse}
                    disabled={deletingWarehouse}
                  >
                    {deletingWarehouse ? (
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

        {/* Add Button - Sadece Admin için göster */}
        {userData?.yetki_id === "admin" && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddWarehouse}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}

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
      </SafeAreaView>
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
    paddingBottom: 10,
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
  headerIcons: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 5,
    marginLeft: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666666',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  warehouseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  warehouseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  nameColumn: {
    flex: 2,
  },
  typeInfo: {
    flex: 1,
  },
  typeColumn: {
    marginLeft: 10,
  },
  typeText: {
    fontSize: 14,
    color: '#666666',
  },
  statusColumn: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  detailsButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
  },
  detailSection: {
    marginBottom: 24,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222222',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 15,
    color: '#666666',
    width: 120,
  },
  detailValue: {
    fontSize: 15,
    color: '#333333',
    flex: 1,
  },
  statusDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDetailIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 8,
  },
  addressContainer: {
    marginTop: 5,
  },
  addressValue: {
    fontSize: 15,
    color: '#333333',
    marginTop: 5,
    lineHeight: 20,
  },
  contactDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  contactDetailText: {
    flex: 1,
    flexDirection: 'row',
  },
  actionButton: {
    backgroundColor: '#E6A05F',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsLoading: {
    padding: 30,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    paddingVertical: 14,
    marginTop: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Onay modali stilleri
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
    color: '#FF6B6B',
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
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 8,
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
    paddingVertical: 12,
    alignItems: 'center',
    marginLeft: 8,
  },
  confirmDeleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 80,  // Tab bar'ın üzerinde konumlanması için
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E6A05F',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  // Durum değiştirme butonu için stil ekle
  statusToggleButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 10,
    marginBottom: 5,
    alignSelf: 'flex-start',
  },
  statusToggleButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});