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
  TextInput,
  Platform
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import { collection, query, where, getDocs, doc, getDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

// Transfer hareketi tipi
interface TransferMovement {
  id: string;
  tarih: any;
  islem_turu: string;
  aciklama: string;
  miktar: number;
  sonuc_miktar: number;
  stok_id: string;
  depo_id: string;      // Kaynak depo
  hedef_depo_id: string; // Hedef depo
  firma_id: string;
  kaynak_id?: string;
  urun_adi?: string;
  birim?: string;
  depo_adi?: string;
  hedef_depo_adi?: string;
}

export default function StockTransferScreen() {
  const { userData, currentUser } = useAuth();
  const [transfers, setTransfers] = useState<TransferMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search and filter states
  const [filteredTransfers, setFilteredTransfers] = useState<TransferMovement[]>([]);
  const [searchText, setSearchText] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  
  // Filter values
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });
  const [warehouseFilter, setWarehouseFilter] = useState<string | null>(null);
  const [destinationWarehouseFilter, setDestinationWarehouseFilter] = useState<string | null>(null);
  
  // Filter options data
  const [warehouses, setWarehouses] = useState<{id: string, name: string}[]>([]);
  
  // Details modal state
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<TransferMovement | null>(null);
  
  // Delete confirmation
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [deletingTransfer, setDeletingTransfer] = useState(false);

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

  // Fetch transfer movements on component mount
  useEffect(() => {
    const fetchTransferMovements = async () => {
      try {
        if (!userData?.firma_id) {
          setError("Kullanıcı firma bilgisi bulunamadı");
          setLoading(false);
          return;
        }

        // Query stock movements where operation type is 'transfer'
        const movementsRef = collection(db, "Stok_Hareketleri");
        const q = query(
          movementsRef, 
          where("firma_id", "==", userData.firma_id),
          where("islem_turu", "==", "transfer")
        );
        
        const querySnapshot = await getDocs(q);
        const transfersList: TransferMovement[] = [];
        
        // For each movement, fetch additional data
        const fetchPromises = querySnapshot.docs.map(async (docSnap) => {
          const movementData = docSnap.data() as TransferMovement;
          const transfer: TransferMovement = {
            ...movementData,
            id: docSnap.id
          };
          
          try {
            // Get product details from Stoklar
            if (transfer.stok_id) {
              const stockRef = doc(db, "Stoklar", transfer.stok_id);
              const stockSnap = await getDoc(stockRef);
              
              if (stockSnap.exists()) {
                const stockData = stockSnap.data();
                transfer.urun_adi = stockData.urun_adi;
                transfer.birim = stockData.birim;
              }
            }
            
            // Get source warehouse name
            if (transfer.depo_id) {
              const warehouseRef = doc(db, "Depolar", transfer.depo_id);
              const warehouseSnap = await getDoc(warehouseRef);
              
              if (warehouseSnap.exists()) {
                transfer.depo_adi = warehouseSnap.data().depo_adi;
              }
            }
            
            // Get destination warehouse name
            if (transfer.hedef_depo_id) {
              const destWarehouseRef = doc(db, "Depolar", transfer.hedef_depo_id);
              const destWarehouseSnap = await getDoc(destWarehouseRef);
              
              if (destWarehouseSnap.exists()) {
                transfer.hedef_depo_adi = destWarehouseSnap.data().depo_adi;
              }
            }
            
            transfersList.push(transfer);
          } catch (err) {
            console.error("Error fetching related data:", err);
            transfersList.push(transfer);
          }
        });
        
        await Promise.all(fetchPromises);
        
        // Sort transfers by date, newest first
        transfersList.sort((a, b) => {
          const dateA = a.tarih?.toDate ? a.tarih.toDate() : new Date(a.tarih);
          const dateB = b.tarih?.toDate ? b.tarih.toDate() : new Date(b.tarih);
          return dateB - dateA;
        });
        
        setTransfers(transfersList);
        setLoading(false);
      } catch (error) {
        console.error("Transfer hareketleri yüklenirken hata:", error);
        
        let errorMessage = "Bilinmeyen hata";
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
        
        setError("Transfer hareketleri yüklenemedi: " + errorMessage);
        setLoading(false);
      }
    };

    fetchTransferMovements();
  }, [userData?.firma_id]);

  // Update filteredTransfers when transfers changes
  useEffect(() => {
    setFilteredTransfers(transfers);
  }, [transfers]);

  // Fetch filter options (warehouses)
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
      } catch (error) {
        console.error("Filter options yüklenirken hata:", error);
      }
    };
    
    fetchFilterOptions();
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
    const filtered = transfers.filter(transfer => 
      (transfer.urun_adi && transfer.urun_adi.toLowerCase().includes(searchLower)) ||
      (transfer.depo_adi && transfer.depo_adi.toLowerCase().includes(searchLower)) ||
      (transfer.hedef_depo_adi && transfer.hedef_depo_adi.toLowerCase().includes(searchLower)) ||
      (transfer.aciklama && transfer.aciklama.toLowerCase().includes(searchLower))
    );
    
    setFilteredTransfers(filtered);
  };
  
  // Apply all filters
  const applyFilters = () => {
    let filtered = [...transfers];
    
    // Apply date filter
    if (dateFilter.startDate || dateFilter.endDate) {
      filtered = filtered.filter(transfer => {
        const transferDate = transfer.tarih?.toDate ? transfer.tarih.toDate() : new Date(transfer.tarih);
        
        // Convert dates for comparison
        const startDate = dateFilter.startDate ? new Date(dateFilter.startDate) : null;
        const endDate = dateFilter.endDate ? new Date(dateFilter.endDate) : null;
        
        // Set end date to end of day
        if (endDate) {
          endDate.setHours(23, 59, 59, 999);
        }
        
        if (startDate && endDate) {
          return transferDate >= startDate && transferDate <= endDate;
        } else if (startDate) {
          return transferDate >= startDate;
        } else if (endDate) {
          return transferDate <= endDate;
        }
        
        return true;
      });
    }
    
    // Apply source warehouse filter
    if (warehouseFilter) {
      filtered = filtered.filter(transfer => transfer.depo_id === warehouseFilter);
    }
    
    // Apply destination warehouse filter
    if (destinationWarehouseFilter) {
      filtered = filtered.filter(transfer => transfer.hedef_depo_id === destinationWarehouseFilter);
    }
    
    setFilteredTransfers(filtered);
    setFilterModalVisible(false);
  };
  
  // Reset all filters
  const resetFilters = () => {
    setDateFilter({ startDate: '', endDate: '' });
    setWarehouseFilter(null);
    setDestinationWarehouseFilter(null);
    setFilteredTransfers(transfers);
    setFilterModalVisible(false);
  };

  // Show transfer details
  const showTransferDetails = (transfer: TransferMovement) => {
    setSelectedTransfer(transfer);
    setDetailsModalVisible(true);
  };

  // Delete transfer movement
  const handleDeleteTransfer = async () => {
    if (!selectedTransfer) return;
    
    try {
      setDeletingTransfer(true);
      
      // Delete from Firestore
      const movementRef = doc(db, "Stok_Hareketleri", selectedTransfer.id);
      await deleteDoc(movementRef);
      
      // Add to Eylemler
      const eylemlerRef = collection(db, "Eylemler");
      await addDoc(eylemlerRef, {
        eylem_tarihi: new Date(),
        eylem_aciklamasi: `"${selectedTransfer.urun_adi || 'Bilinmeyen ürün'}" ürününe ait ${selectedTransfer.depo_adi} -> ${selectedTransfer.hedef_depo_adi} transfer kaydı silindi.`,
        kullanici_id: currentUser?.uid || '',
        kullanici_adi: userData?.isim + ' ' + userData?.soyisim || 'Bilinmeyen Kullanıcı',
        firma_id: userData?.firma_id || '',
        islem_turu: 'stok_hareketi_silme',
        ilgili_belge_id: selectedTransfer.id
      });
      
      // Update state
      const updatedTransfers = transfers.filter(t => t.id !== selectedTransfer.id);
      setTransfers(updatedTransfers);
      setFilteredTransfers(filteredTransfers.filter(t => t.id !== selectedTransfer.id));
      
      // Close modals
      setDeleteConfirmVisible(false);
      setDetailsModalVisible(false);
      
      Alert.alert('Başarılı', 'Transfer hareketi başarıyla silindi.');
      
    } catch (error) {
      console.error('Transfer hareketi silinirken hata:', error);
      Alert.alert('Hata', 'Transfer hareketi silinirken bir sorun oluştu.');
    } finally {
      setDeletingTransfer(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#E6A05F" />
        <Text style={styles.loadingText}>Transfer hareketleri yükleniyor...</Text>
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
            <Text style={styles.screenTitle}>Depolar Arası Transferler</Text>
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
                {(warehouseFilter || destinationWarehouseFilter || dateFilter.startDate || dateFilter.endDate) && (
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
          <Text style={[styles.columnHeader, styles.productColumn]}>Ürün</Text>
          <Text style={[styles.columnHeader, styles.warehouseColumn]}>Kaynak-Hedef</Text>
          <Text style={[styles.columnHeader, styles.quantityColumn]}>Miktar</Text>
          <Text style={[styles.columnHeader, styles.detailsColumn]}>Detay</Text>
        </View>

        {filteredTransfers.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="repeat" size={60} color="#CCCCCC" />
            <Text style={styles.emptyText}>
              {transfers.length > 0 
                ? "Arama kriterlerine uygun transfer bulunamadı" 
                : "Henüz depolar arası transfer bulunmuyor"}
            </Text>
            <Text style={styles.emptySubText}>
              {transfers.length > 0 
                ? "Filtre kriterlerini değiştirmeyi deneyin" 
                : "Yeni stok transferi yapılması gerekiyor"}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredTransfers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.transferItem}>
                <Text style={[styles.transferDate, styles.dateColumn]}>{formatDate(item.tarih)}</Text>
                <Text style={[styles.transferProduct, styles.productColumn]} numberOfLines={1} ellipsizeMode="tail">
                  {item.urun_adi || 'Bilinmeyen Ürün'}
                </Text>
                <Text style={[styles.transferWarehouse, styles.warehouseColumn]} numberOfLines={1}>
                  {`${item.depo_adi || ''} → ${item.hedef_depo_adi || ''}`}
                </Text>
                <View style={[styles.transferQuantity, styles.quantityColumn]}>
                  <Text style={styles.quantityText}>
                    {item.miktar} {item.birim}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.detailsButton}
                  onPress={() => showTransferDetails(item)}
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

        {/* Floating Action Button - Admin için */}
        {userData?.yetki_id === "admin" && (
          <TouchableOpacity 
            style={styles.fab}
            onPress={() => router.push('/add-stock-transfer')}
          >
            <Ionicons name="add" size={30} color="#FFFFFF" />
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
              onPress={() => router.replace('/home')}
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

        {/* Transfer Details Modal */}
        <Modal
          visible={detailsModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setDetailsModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Transfer Detayları</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setDetailsModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#222222" />
                </TouchableOpacity>
              </View>

              {selectedTransfer && (
                <ScrollView style={styles.modalBody}>
                  {/* Transfer Details */}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Transfer Bilgileri</Text>
                    
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>İşlem Türü:</Text>
                      <Text style={styles.detailValue}>Depolar Arası Transfer</Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Tarih:</Text>
                      <Text style={styles.detailValue}>{formatDate(selectedTransfer.tarih)}</Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Açıklama:</Text>
                      <Text style={styles.detailValue}>{selectedTransfer.aciklama || 'Açıklama yok'}</Text>
                    </View>
                  </View>

                  {/* Product Details */}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Ürün Bilgileri</Text>
                    
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Ürün Adı:</Text>
                      <Text style={styles.detailValue}>{selectedTransfer.urun_adi || 'Bilinmeyen Ürün'}</Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Kaynak Depo:</Text>
                      <Text style={styles.detailValue}>{selectedTransfer.depo_adi || 'Depo ' + selectedTransfer.depo_id}</Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Hedef Depo:</Text>
                      <Text style={styles.detailValue}>{selectedTransfer.hedef_depo_adi || 'Depo ' + selectedTransfer.hedef_depo_id}</Text>
                    </View>
                  </View>

                  {/* Quantity Details */}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Miktar Bilgileri</Text>
                    
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Transfer Miktarı:</Text>
                      <Text style={styles.detailValue}>
                        {selectedTransfer.miktar} {selectedTransfer.birim}
                      </Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Kaynak Kalan:</Text>
                      <Text style={styles.detailValue}>
                        {selectedTransfer.sonuc_miktar} {selectedTransfer.birim}
                      </Text>
                    </View>
                  </View>

                  {/* Delete Button - Only for admin */}
                  {userData?.yetki_id === "admin" && (
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => setDeleteConfirmVisible(true)}
                    >
                      <Text style={styles.deleteButtonText}>Transferi Sil</Text>
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
                
                {/* Source Warehouse Filter */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Kaynak Depo</Text>
                  
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
                
                {/* Destination Warehouse Filter */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Hedef Depo</Text>
                  
                  <ScrollView style={styles.optionList} nestedScrollEnabled={true}>
                    <TouchableOpacity 
                      style={[
                        styles.filterOption, 
                        destinationWarehouseFilter === null && styles.selectedFilterOption
                      ]}
                      onPress={() => setDestinationWarehouseFilter(null)}
                    >
                      <Text style={styles.filterOptionText}>Tümü</Text>
                      {destinationWarehouseFilter === null && (
                        <Ionicons name="checkmark" size={20} color="#E6A05F" />
                      )}
                    </TouchableOpacity>
                    
                    {warehouses.map(warehouse => (
                      <TouchableOpacity 
                        key={warehouse.id}
                        style={[
                          styles.filterOption, 
                          destinationWarehouseFilter === warehouse.id && styles.selectedFilterOption
                        ]}
                        onPress={() => setDestinationWarehouseFilter(warehouse.id)}
                      >
                        <Text style={styles.filterOptionText}>{warehouse.name}</Text>
                        {destinationWarehouseFilter === warehouse.id && (
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
                <Text style={styles.confirmModalTitle}>Stok Transferini Sil</Text>
              </View>
              
              <View style={styles.confirmModalBody}>
                <Text style={styles.confirmText}>
                  Bu stok transferini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                </Text>
                
                <View style={styles.confirmButtons}>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => setDeleteConfirmVisible(false)}
                    disabled={deletingTransfer}
                  >
                    <Text style={styles.cancelButtonText}>İptal</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.confirmDeleteButton}
                    onPress={handleDeleteTransfer}
                    disabled={deletingTransfer}
                  >
                    {deletingTransfer ? (
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
    flex: 1.5,
  },
  warehouseColumn: {
    flex: 1.5,
  },
  quantityColumn: {
    flex: 1,
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
  transferItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  transferDate: {
    flex: 1.2,
    fontSize: 14,
    color: '#666666',
  },
  transferProduct: {
    flex: 1.5,
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },
  transferWarehouse: {
    flex: 1.5,
    fontSize: 14,
    color: '#333333',
  },
  transferQuantity: {
    flex: 1,
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 14,
    color: '#5A67D8',
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