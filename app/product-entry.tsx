import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar, 
  FlatList,
  Modal,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { collection, query, where, getDocs, doc, getDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

// Define stock movement type
interface StockMovement {
  id: string;
  tarih: any;
  islem_turu: string;
  aciklama: string;
  miktar: number;
  sonuc_miktar: number;
  stok_id: string;
  depo_id: string;
  firma_id: string;
  kaynak_id?: string; // Tedarikçi ID'si
  urun_adi?: string;
  birim?: string;
  depo_adi?: string;
  tedarikci_adi?: string;
}

export default function ProductEntryScreen() {
  const { userData, currentUser } = useAuth();
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search and filter states
  const [filteredMovements, setFilteredMovements] = useState<StockMovement[]>([]);
  const [searchText, setSearchText] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  
  // Filter values
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });
  const [warehouseFilter, setWarehouseFilter] = useState<string | null>(null);
  const [supplierFilter, setSupplierFilter] = useState<string | null>(null);
  
  // Filter options data
  const [warehouses, setWarehouses] = useState<{id: string, name: string}[]>([]);
  const [suppliers, setSuppliers] = useState<{id: string, name: string}[]>([]);
  
  // Details modal state
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState<StockMovement | null>(null);
  
  // Delete confirmation
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [deletingMovement, setDeletingMovement] = useState(false);

  // Format date function
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

  // Update filteredMovements when stockMovements changes
  useEffect(() => {
    setFilteredMovements(stockMovements);
  }, [stockMovements]);

  // Fetch filter options (warehouses and suppliers)
  useEffect(() => {
    const fetchFilterOptions = async () => {
      if (!userData?.firma_id) return;
      
      try {
        // Fetch warehouses
        const warehousesRef = collection(db, "Depolar");
        const warehousesQuery = query(warehousesRef, where("firma_id", "==", userData.firma_id));
        const warehousesSnapshot = await getDocs(warehousesQuery);
        
        const warehousesList = warehousesSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().depo_adi || `Depo ${doc.id}`
        }));
        setWarehouses(warehousesList);
        
        // Fetch suppliers
        const suppliersRef = collection(db, "Tedarikciler");
        const suppliersQuery = query(suppliersRef, where("firma_id", "==", userData.firma_id));
        const suppliersSnapshot = await getDocs(suppliersQuery);
        
        const suppliersList = suppliersSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().sirket_ismi || `Tedarikçi ${doc.id}`
        }));
        setSuppliers(suppliersList);
      } catch (error) {
        console.error("Filter options yüklenirken hata:", error);
      }
    };
    
    fetchFilterOptions();
  }, [userData?.firma_id]);

  // Fetch stock movements on component mount
  useEffect(() => {
    const fetchStockMovements = async () => {
      try {
        if (!userData?.firma_id) {
          setError("Kullanıcı firma bilgisi bulunamadı");
          setLoading(false);
          return;
        }

        // Query stock movements where operation type is 'ürün_girişi'
        const movementsRef = collection(db, "Stok_Hareketleri");
        const q = query(
          movementsRef, 
          where("firma_id", "==", userData.firma_id),
          where("islem_turu", "==", "ürün_girişi")
        );
        
        const querySnapshot = await getDocs(q);
        const movementsList: StockMovement[] = [];
        
        // For each movement, fetch additional data from Stoklar table
        const fetchPromises = querySnapshot.docs.map(async (docSnap) => {
          const movementData = docSnap.data() as StockMovement;
          const movement: StockMovement = {
            ...movementData,
            id: docSnap.id
          };
          
          try {
            // Get product details from Stoklar
            if (movement.stok_id) {
              const stockRef = doc(db, "Stoklar", movement.stok_id);
              const stockSnap = await getDoc(stockRef);
              
              if (stockSnap.exists()) {
                const stockData = stockSnap.data();
                movement.urun_adi = stockData.urun_adi;
                movement.birim = stockData.birim;
              }
            }
            
            // Get warehouse name
            if (movement.depo_id) {
              const warehouseRef = doc(db, "Depolar", movement.depo_id);
              const warehouseSnap = await getDoc(warehouseRef);
              
              if (warehouseSnap.exists()) {
                movement.depo_adi = warehouseSnap.data().depo_adi;
              }
            }
            
            // Get supplier name
            if (movement.kaynak_id) {
              const supplierRef = doc(db, "Tedarikciler", movement.kaynak_id);
              const supplierSnap = await getDoc(supplierRef);
              
              if (supplierSnap.exists()) {
                movement.tedarikci_adi = supplierSnap.data().sirket_ismi;
              }
            }
            
            movementsList.push(movement);
          } catch (err) {
            console.error("Error fetching related data:", err);
            movementsList.push(movement);
          }
        });
        
        await Promise.all(fetchPromises);
        
        // Sort movements by date, newest first
        movementsList.sort((a, b) => {
          const dateA = a.tarih?.toDate ? a.tarih.toDate() : new Date(a.tarih);
          const dateB = b.tarih?.toDate ? b.tarih.toDate() : new Date(b.tarih);
          return dateB - dateA;
        });
        
        setStockMovements(movementsList);
        setFilteredMovements(movementsList);
        setLoading(false);
      } catch (error) {
        console.error("Stock movements yüklenirken hata:", error);
        
        let errorMessage = "Bilinmeyen hata";
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
        
        setError("Stok hareketleri yüklenemedi: " + errorMessage);
        setLoading(false);
      }
    };

    fetchStockMovements();
  }, [userData?.firma_id]);

  // Search function
  const handleSearch = (text: string) => {
    setSearchText(text);
    
    if (!text.trim()) {
      // If search is empty, reset to current filters
      applyFilters();
      return;
    }
    
    // Filter by search text
    const searchLower = text.toLowerCase();
    const filtered = stockMovements.filter(movement => 
      (movement.urun_adi && movement.urun_adi.toLowerCase().includes(searchLower)) ||
      (movement.depo_adi && movement.depo_adi.toLowerCase().includes(searchLower)) ||
      (movement.tedarikci_adi && movement.tedarikci_adi.toLowerCase().includes(searchLower)) ||
      (movement.aciklama && movement.aciklama.toLowerCase().includes(searchLower))
    );
    
    setFilteredMovements(filtered);
  };
  
  // Apply all filters
  const applyFilters = () => {
    let filtered = [...stockMovements];
    
    // Apply date filter
    if (dateFilter.startDate || dateFilter.endDate) {
      filtered = filtered.filter(movement => {
        const movementDate = movement.tarih?.toDate ? movement.tarih.toDate() : new Date(movement.tarih);
        
        // Convert dates for comparison
        const startDate = dateFilter.startDate ? new Date(dateFilter.startDate) : null;
        const endDate = dateFilter.endDate ? new Date(dateFilter.endDate) : null;
        
        // Set end date to end of day
        if (endDate) {
          endDate.setHours(23, 59, 59, 999);
        }
        
        if (startDate && endDate) {
          return movementDate >= startDate && movementDate <= endDate;
        } else if (startDate) {
          return movementDate >= startDate;
        } else if (endDate) {
          return movementDate <= endDate;
        }
        
        return true;
      });
    }
    
    // Apply warehouse filter
    if (warehouseFilter) {
      filtered = filtered.filter(movement => movement.depo_id === warehouseFilter);
    }
    
    // Apply supplier filter
    if (supplierFilter) {
      filtered = filtered.filter(movement => movement.kaynak_id === supplierFilter);
    }
    
    setFilteredMovements(filtered);
    setFilterModalVisible(false);
  };
  
  // Reset all filters
  const resetFilters = () => {
    setDateFilter({ startDate: '', endDate: '' });
    setWarehouseFilter(null);
    setSupplierFilter(null);
    setFilteredMovements(stockMovements);
    setFilterModalVisible(false);
  };

  // Show movement details
  const showMovementDetails = (movement: StockMovement) => {
    setSelectedMovement(movement);
    setDetailsModalVisible(true);
  };

  // Delete stock movement
  const handleDeleteMovement = async () => {
    if (!selectedMovement) return;
    
    try {
      setDeletingMovement(true);
      
      // Delete from Firestore
      const movementRef = doc(db, "Stok_Hareketleri", selectedMovement.id);
      await deleteDoc(movementRef);
      
      // Add to Eylemler
      const eylemlerRef = collection(db, "Eylemler");
      await addDoc(eylemlerRef, {
        eylem_tarihi: new Date(),
        eylem_aciklamasi: `"${selectedMovement.urun_adi || 'Bilinmeyen ürün'}" ürününe ait ${selectedMovement.miktar} ${selectedMovement.birim} giriş kaydı silindi.`,
        kullanici_id: currentUser?.uid || '',
        kullanici_adi: userData?.isim + ' ' + userData?.soyisim || 'Bilinmeyen Kullanıcı',
        firma_id: userData?.firma_id || '',
        islem_turu: 'stok_hareketi_silme',
        ilgili_belge_id: selectedMovement.id
      });
      
      // Update state
      const updatedMovements = stockMovements.filter(m => m.id !== selectedMovement.id);
      setStockMovements(updatedMovements);
      setFilteredMovements(filteredMovements.filter(m => m.id !== selectedMovement.id));
      
      // Close modals
      setDeleteConfirmVisible(false);
      setDetailsModalVisible(false);
      
      Alert.alert('Başarılı', 'Stok hareketi başarıyla silindi.');
      
    } catch (error) {
      console.error('Stok hareketi silinirken hata:', error);
      Alert.alert('Hata', 'Stok hareketi silinirken bir sorun oluştu.');
    } finally {
      setDeletingMovement(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#E6A05F" />
        <Text style={styles.loadingText}>Stok hareketleri yükleniyor...</Text>
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
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>TRACKIT</Text>
          </View>
          <View style={styles.headerBottom}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#222222" />
            </TouchableOpacity>
            <Text style={styles.screenTitle}>Hizmet/Ürünler Girişi</Text>
            <View style={styles.headerIcons}>
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={() => setSearchVisible(!searchVisible)}
              >
                <Feather name="search" size={22} color="#222222" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={() => setFilterModalVisible(true)}
              >
                <Feather name="filter" size={22} color="#222222" />
                {/* Filtreleme aktifse nokta göster */}
                {(warehouseFilter || supplierFilter || dateFilter.startDate || dateFilter.endDate) && (
                  <View style={styles.filterDot} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        {searchVisible && (
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Ara..."
              placeholderTextColor="#999"
              value={searchText}
              onChangeText={handleSearch}
              autoFocus
            />
            <TouchableOpacity 
              style={styles.searchClearButton}
              onPress={() => {
                setSearchText('');
                handleSearch('');
              }}
            >
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          </View>
        )}

        {/* Column Headers */}
        <View style={styles.columnHeaders}>
          <Text style={[styles.columnHeader, styles.dateColumn]}>Tarih</Text>
          <Text style={[styles.columnHeader, styles.productColumn]}>Ürün Adı</Text>
          <Text style={[styles.columnHeader, styles.warehouseColumn]}>Depo</Text>
          <Text style={[styles.columnHeader, styles.quantityColumn]}>Miktar</Text>
          <Text style={[styles.columnHeader, styles.detailsColumn]}>Detay</Text>
        </View>

        {filteredMovements.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="package" size={60} color="#CCCCCC" />
            <Text style={styles.emptyText}>
              {stockMovements.length > 0 
                ? "Arama kriterlerine uygun hareket bulunamadı" 
                : "Henüz ürün girişi bulunmuyor"}
            </Text>
            <Text style={styles.emptySubText}>
              {stockMovements.length > 0 
                ? "Filtre kriterlerini değiştirmeyi deneyin" 
                : "Yeni ürün girişi yapılması gerekiyor"}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredMovements}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.movementItem}>
                <Text style={[styles.movementDate, styles.dateColumn]}>{formatDate(item.tarih)}</Text>
                <Text style={[styles.movementProduct, styles.productColumn]} numberOfLines={1} ellipsizeMode="tail">
                  {item.urun_adi || 'Bilinmeyen Ürün'}
                </Text>
                <Text style={[styles.movementWarehouse, styles.warehouseColumn]} numberOfLines={1}>
                  {item.depo_adi || 'Depo ' + item.depo_id}
                </Text>
                <View style={[styles.movementQuantity, styles.quantityColumn]}>
                  <Text style={styles.quantityText}>
                    {item.miktar} {item.birim}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.detailsButton}
                  onPress={() => showMovementDetails(item)}
                >
                  <View style={styles.detailsIconContainer}>
                    <Feather name="eye" size={18} color="#666666" />
                  </View>
                </TouchableOpacity>
              </View>
            )}
            contentContainerStyle={styles.listContainer}
          />
        )}

        {/* Floating Action Button - Tüm kullanıcılar için */}
        <TouchableOpacity 
          style={styles.fab}
          onPress={() => router.push('/add-product-entry')}
        >
          <Ionicons name="add" size={30} color="#FFFFFF" />
        </TouchableOpacity>

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

        {/* Movement Details Modal */}
        <Modal
          visible={detailsModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setDetailsModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Stok Hareketi Detayları</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setDetailsModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#222222" />
                </TouchableOpacity>
              </View>

              {selectedMovement && (
                <ScrollView style={styles.modalBody}>
                  {/* Movement Details */}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Hareket Bilgileri</Text>
                    
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>İşlem Türü:</Text>
                      <Text style={styles.detailValue}>Ürün Girişi</Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Tarih:</Text>
                      <Text style={styles.detailValue}>{formatDate(selectedMovement.tarih)}</Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Açıklama:</Text>
                      <Text style={styles.detailValue}>{selectedMovement.aciklama || 'Açıklama yok'}</Text>
                    </View>
                  </View>

                  {/* Product Details */}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Ürün Bilgileri</Text>
                    
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Ürün Adı:</Text>
                      <Text style={styles.detailValue}>{selectedMovement.urun_adi || 'Bilinmeyen Ürün'}</Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Depo:</Text>
                      <Text style={styles.detailValue}>{selectedMovement.depo_adi || 'Depo ' + selectedMovement.depo_id}</Text>
                    </View>
                  </View>

                  {/* Quantity Details */}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Miktar Bilgileri</Text>
                    
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Giriş Miktarı:</Text>
                      <Text style={styles.detailValue}>
                        {selectedMovement.miktar} {selectedMovement.birim}
                      </Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Sonuç Miktar:</Text>
                      <Text style={styles.detailValue}>
                        {selectedMovement.sonuc_miktar} {selectedMovement.birim}
                      </Text>
                    </View>
                  </View>

                  {/* Supplier Information (if available) */}
                  {selectedMovement.kaynak_id && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>Tedarikçi Bilgileri</Text>
                      
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Tedarikçi:</Text>
                        <Text style={styles.detailValue}>{selectedMovement.tedarikci_adi || 'Bilinmeyen Tedarikçi'}</Text>
                      </View>
                    </View>
                  )}
                  
                  {/* Delete Button - Only for admin */}
                  {userData?.yetki_id === "admin" && (
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => setDeleteConfirmVisible(true)}
                    >
                      <Text style={styles.deleteButtonText}>Hareketi Sil</Text>
                    </TouchableOpacity>
                  )}
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>

        {/* Filter Modal */}
        <Modal
          visible={filterModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setFilterModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, styles.filterModalContent]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Filtreleme</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setFilterModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#222222" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalBody}>
                {/* Date Range Filter */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Tarih Aralığı</Text>
                  
                  <View style={styles.dateInputContainer}>
                    <Text style={styles.dateInputLabel}>Başlangıç:</Text>
                    <TextInput
                      style={styles.dateInput}
                      value={dateFilter.startDate}
                      onChangeText={(text) => setDateFilter({...dateFilter, startDate: text})}
                      placeholder="GG.AA.YYYY"
                      placeholderTextColor="#AAAAAA"
                    />
                  </View>
                  
                  <View style={styles.dateInputContainer}>
                    <Text style={styles.dateInputLabel}>Bitiş:</Text>
                    <TextInput
                      style={styles.dateInput}
                      value={dateFilter.endDate}
                      onChangeText={(text) => setDateFilter({...dateFilter, endDate: text})}
                      placeholder="GG.AA.YYYY"
                      placeholderTextColor="#AAAAAA"
                    />
                  </View>
                </View>
                
                {/* Warehouse Filter */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Depo</Text>
                  
                  <ScrollView style={styles.optionList} nestedScrollEnabled={true}>
                    <TouchableOpacity 
                      style={[
                        styles.filterOption, 
                        warehouseFilter === null && styles.selectedFilterOption
                      ]}
                      onPress={() => setWarehouseFilter(null)}
                    >
                      <Text style={styles.filterOptionText}>Tümü</Text>
                      {warehouseFilter === null && (
                        <Ionicons name="checkmark" size={20} color="#E6A05F" />
                      )}
                    </TouchableOpacity>
                    
                    {warehouses.map(warehouse => (
                      <TouchableOpacity 
                        key={warehouse.id}
                        style={[
                          styles.filterOption, 
                          warehouseFilter === warehouse.id && styles.selectedFilterOption
                        ]}
                        onPress={() => setWarehouseFilter(warehouse.id)}
                      >
                        <Text style={styles.filterOptionText}>{warehouse.name}</Text>
                        {warehouseFilter === warehouse.id && (
                          <Ionicons name="checkmark" size={20} color="#E6A05F" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                
                {/* Supplier Filter */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Tedarikçi</Text>
                  
                  <ScrollView style={styles.optionList} nestedScrollEnabled={true}>
                    <TouchableOpacity 
                      style={[
                        styles.filterOption, 
                        supplierFilter === null && styles.selectedFilterOption
                      ]}
                      onPress={() => setSupplierFilter(null)}
                    >
                      <Text style={styles.filterOptionText}>Tümü</Text>
                      {supplierFilter === null && (
                        <Ionicons name="checkmark" size={20} color="#E6A05F" />
                      )}
                    </TouchableOpacity>
                    
                    {suppliers.map(supplier => (
                      <TouchableOpacity 
                        key={supplier.id}
                        style={[
                          styles.filterOption, 
                          supplierFilter === supplier.id && styles.selectedFilterOption
                        ]}
                        onPress={() => setSupplierFilter(supplier.id)}
                      >
                        <Text style={styles.filterOptionText}>{supplier.name}</Text>
                        {supplierFilter === supplier.id && (
                          <Ionicons name="checkmark" size={20} color="#E6A05F" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                
                {/* Filter Actions */}
                <View style={styles.filterActions}>
                  <TouchableOpacity 
                    style={styles.resetButton}
                    onPress={resetFilters}
                  >
                    <Text style={styles.resetButtonText}>Filtreleri Temizle</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.applyButton}
                    onPress={applyFilters}
                  >
                    <Text style={styles.applyButtonText}>Uygula</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          visible={deleteConfirmVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setDeleteConfirmVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.confirmModalContent}>
              <View style={styles.confirmModalHeader}>
                <Text style={styles.confirmModalTitle}>Stok Hareketini Sil</Text>
              </View>
              
              <View style={styles.confirmModalBody}>
                <Text style={styles.confirmText}>
                  Bu stok hareketini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                </Text>
                
                <View style={styles.confirmButtons}>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => setDeleteConfirmVisible(false)}
                    disabled={deletingMovement}
                  >
                    <Text style={styles.cancelButtonText}>İptal</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.confirmDeleteButton}
                    onPress={handleDeleteMovement}
                    disabled={deletingMovement}
                  >
                    {deletingMovement ? (
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
    position: 'relative',
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
  dateColumn: {
    flex: 1.2,
  },
  productColumn: {
    flex: 2,
  },
  warehouseColumn: {
    flex: 1,
  },
  quantityColumn: {
    flex: 1.2,
    alignItems: 'center',
  },
  detailsColumn: {
    width: 50,
    alignItems: 'center',
  },
  emptyState: {
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
    paddingBottom: 80,
  },
  movementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  movementDate: {
    flex: 1.2,
    fontSize: 14,
    color: '#666666',
  },
  movementProduct: {
    flex: 2,
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },
  movementWarehouse: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
  },
  movementQuantity: {
    flex: 1.2,
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 14,
    color: '#E6A05F',
    fontWeight: '500',
  },
  detailsButton: {
    width: 50,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  fab: {
    position: 'absolute',
    bottom: 75, // Tab bar'ın üzerinde konumlanması için
    right: 25,
    width: 56,
    height: 56,
    borderRadius: 28,
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
  
  // Search styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  searchInput: {
    flex: 1,
    height: 36,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    color: '#333333',
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  searchClearButton: {
    padding: 8,
    marginLeft: 5,
  },
  
  // Filter dot indicator
  filterDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E6A05F',
  },
  
  // Filter modal styles
  filterModalContent: {
    maxHeight: '80%',
  },
  filterSection: {
    marginBottom: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222222',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    paddingBottom: 8,
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dateInputLabel: {
    width: 80,
    fontSize: 15,
    color: '#666666',
  },
  dateInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 14,
    color: '#333333',
  },
  optionList: {
    maxHeight: 150,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectedFilterOption: {
    backgroundColor: '#FFF9F2',
  },
  filterOptionText: {
    fontSize: 15,
    color: '#333333',
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 10,
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#666666',
    fontSize: 15,
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#E6A05F',
    borderRadius: 8,
    padding: 12,
    marginLeft: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  
  // Delete button in details
  deleteButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    paddingVertical: 14,
    marginTop: 24,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Confirmation modal
  confirmModalContent: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  confirmModalHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  confirmModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222222',
    textAlign: 'center',
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
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#666666',
    fontSize: 16,
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
    fontWeight: 'bold',
  },
});