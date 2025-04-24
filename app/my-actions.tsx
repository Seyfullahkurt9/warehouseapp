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
  TextInput,
  ScrollView
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

// Define Action type
interface Action {
  id: string;
  eylem_tarihi: any;
  eylem_aciklamasi: string;
  kullanici_id: string;
  kullanici_adi?: string;
  firma_id: string;
  islem_turu?: string;
  ilgili_belge_id?: string;
}

export default function MyActionsScreen() {
  const { userData, currentUser } = useAuth();
  const [actions, setActions] = useState<Action[]>([]);
  const [filteredActions, setFilteredActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search and filter states
  const [searchText, setSearchText] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  
  // Filter values
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });
  const [actionTypeFilter, setActionTypeFilter] = useState<string | null>(null);
  
  // Details modal state
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  
  // Action types for filtering
  const [actionTypes, setActionTypes] = useState<string[]>([]);

  // Format date function
  const formatDate = (dateObject: any): string => {
    if (!dateObject) return '-';
    
    try {
      const date = dateObject.toDate ? dateObject.toDate() : new Date(dateObject);
      return date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return '-';
    }
  };

  // Fetch user's actions
  useEffect(() => {
    const fetchActions = async () => {
      try {
        if (!currentUser?.uid || !userData?.firma_id) {
          setError("Kullanıcı bilgisi bulunamadı");
          setLoading(false);
          return;
        }

        // Query actions where kullanici_id matches current user
        const actionsRef = collection(db, "Eylemler");
        const q = query(
          actionsRef, 
          where("kullanici_id", "==", currentUser.uid),
          where("firma_id", "==", userData.firma_id),
          orderBy("eylem_tarihi", "desc")
        );
        
        const querySnapshot = await getDocs(q);
        const actionsList: Action[] = [];
        const typesSet = new Set<string>();
        
        querySnapshot.forEach((docSnap) => {
          const actionData = docSnap.data() as Action;
          const action: Action = {
            ...actionData,
            id: docSnap.id
          };
          
          // Collect unique action types for filter
          if (action.islem_turu) {
            typesSet.add(action.islem_turu);
          }
          
          actionsList.push(action);
        });
        
        setActions(actionsList);
        setFilteredActions(actionsList);
        setActionTypes(Array.from(typesSet));
        setLoading(false);
      } catch (error) {
        console.error("Eylemler yüklenirken hata:", error);
        
        let errorMessage = "Bilinmeyen hata";
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
        
        setError("Eylemler yüklenemedi: " + errorMessage);
        setLoading(false);
      }
    };

    fetchActions();
  }, [currentUser?.uid, userData?.firma_id]);

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
    const filtered = actions.filter(action => 
      (action.eylem_aciklamasi && action.eylem_aciklamasi.toLowerCase().includes(searchLower)) ||
      (action.islem_turu && action.islem_turu.toLowerCase().includes(searchLower))
    );
    
    setFilteredActions(filtered);
  };
  
  // Apply all filters
  const applyFilters = () => {
    let filtered = [...actions];
    
    // Apply date filter
    if (dateFilter.startDate || dateFilter.endDate) {
      filtered = filtered.filter(action => {
        const actionDate = action.eylem_tarihi?.toDate ? action.eylem_tarihi.toDate() : new Date(action.eylem_tarihi);
        
        // Convert dates for comparison
        const startDate = dateFilter.startDate ? new Date(dateFilter.startDate) : null;
        const endDate = dateFilter.endDate ? new Date(dateFilter.endDate) : null;
        
        // Set end date to end of day
        if (endDate) {
          endDate.setHours(23, 59, 59, 999);
        }
        
        if (startDate && endDate) {
          return actionDate >= startDate && actionDate <= endDate;
        } else if (startDate) {
          return actionDate >= startDate;
        } else if (endDate) {
          return actionDate <= endDate;
        }
        
        return true;
      });
    }
    
    // Apply action type filter
    if (actionTypeFilter) {
      filtered = filtered.filter(action => action.islem_turu === actionTypeFilter);
    }
    
    setFilteredActions(filtered);
    setFilterModalVisible(false);
  };
  
  // Reset all filters
  const resetFilters = () => {
    setDateFilter({ startDate: '', endDate: '' });
    setActionTypeFilter(null);
    setFilteredActions(actions);
    setFilterModalVisible(false);
  };

  // Show action details
  const showActionDetails = async (action: Action) => {
    setSelectedAction(action);
    setDetailsModalVisible(true);
  };

  // Get color based on action type
  const getActionTypeColor = (type: string | undefined): string => {
    if (!type) return '#777777';
    
    // Define colors based on action types
    switch (type) {
      case 'urun_girisi':
        return '#4CAF50'; // Green
      case 'urun_cikisi':
        return '#FF5722'; // Orange
      case 'siparis_olusturma':
        return '#2196F3'; // Blue
      case 'siparis_guncelleme':
        return '#03A9F4'; // Light Blue
      case 'siparis_silme':
        return '#F44336'; // Red
      case 'stok_hareketi_silme':
        return '#FF5252'; // Light Red
      case 'tedarikci_silme':
      case 'musteri_silme':
      case 'depo_silme':
        return '#D32F2F'; // Dark Red
      case 'tedarikci_ekleme':
      case 'musteri_ekleme':
      case 'depo_ekleme':
        return '#388E3C'; // Dark Green
      case 'depo_durum_degistirme':
        return '#673AB7'; // Purple
      case 'urun_olusturma':
        return '#009688'; // Teal
      default:
        return '#757575'; // Grey
    }
  };

  // Get friendly name for action type
  const getActionTypeName = (type: string | undefined): string => {
    if (!type) return 'Bilinmeyen İşlem';
    
    // Define friendly names for action types
    switch (type) {
      case 'urun_girisi':
        return 'Ürün Girişi';
      case 'urun_cikisi':
        return 'Ürün Çıkışı';
      case 'siparis_olusturma':
        return 'Sipariş Oluşturma';
      case 'siparis_guncelleme':
        return 'Sipariş Güncelleme';
      case 'siparis_silme':
        return 'Sipariş Silme';
      case 'stok_hareketi_silme':
        return 'Stok Hareketi Silme';
      case 'tedarikci_silme':
        return 'Tedarikçi Silme';
      case 'tedarikci_ekleme':
        return 'Tedarikçi Ekleme';
      case 'musteri_silme':
        return 'Müşteri Silme';
      case 'musteri_ekleme':
        return 'Müşteri Ekleme';
      case 'depo_silme':
        return 'Depo Silme';
      case 'depo_ekleme':
        return 'Depo Ekleme';
      case 'depo_durum_degistirme':
        return 'Depo Durum Değiştirme';
      case 'urun_olusturma':
        return 'Ürün Oluşturma';
      default:
        return type.replace(/_/g, ' ');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#E6A05F" />
        <Text style={styles.loadingText}>Eylemleriniz yükleniyor...</Text>
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
            <Text style={styles.screenTitle}>Hareketlerim</Text>
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
                {(actionTypeFilter || dateFilter.startDate || dateFilter.endDate) && (
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
          <Text style={[styles.columnHeader, styles.typeColumn]}>İşlem</Text>
          <Text style={[styles.columnHeader, styles.descriptionColumn]}>Açıklama</Text>
          <Text style={[styles.columnHeader, styles.detailsColumn]}>Detay</Text>
        </View>

        {filteredActions.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="activity" size={60} color="#CCCCCC" />
            <Text style={styles.emptyText}>
              {actions.length > 0 
                ? "Arama kriterlerine uygun eylem bulunamadı" 
                : "Henüz kaydedilmiş bir eyleminiz bulunmuyor"}
            </Text>
            <Text style={styles.emptySubText}>
              {actions.length > 0 
                ? "Filtre kriterlerini değiştirmeyi deneyin" 
                : "Eylemler gerçekleştirdikçe burada listelenecektir"}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredActions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.actionItem}>
                <Text style={[styles.actionDate, styles.dateColumn]}>{formatDate(item.eylem_tarihi)}</Text>
                
                <View style={[styles.actionType, styles.typeColumn]}>
                  <View style={[
                    styles.typeBadge,
                    { backgroundColor: getActionTypeColor(item.islem_turu) + '20' }
                  ]}>
                    <Text style={[
                      styles.typeBadgeText,
                      { color: getActionTypeColor(item.islem_turu) }
                    ]}>
                      {getActionTypeName(item.islem_turu).split(' ')[0]}
                    </Text>
                  </View>
                </View>
                
                <Text style={[styles.actionDescription, styles.descriptionColumn]} numberOfLines={2}>
                  {item.eylem_aciklamasi}
                </Text>
                
                <TouchableOpacity 
                  style={styles.detailsButton}
                  onPress={() => showActionDetails(item)}
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

        {/* Action Details Modal */}
        <Modal
          visible={detailsModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setDetailsModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Eylem Detayları</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setDetailsModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#222222" />
                </TouchableOpacity>
              </View>

              {selectedAction && (
                <ScrollView style={styles.modalBody}>
                  {/* Action Details */}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Eylem Bilgileri</Text>
                    
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>İşlem:</Text>
                      <View style={[
                        styles.detailTypeBadge,
                        { backgroundColor: getActionTypeColor(selectedAction.islem_turu) + '20' }
                      ]}>
                        <Text style={[
                          styles.detailTypeBadgeText,
                          { color: getActionTypeColor(selectedAction.islem_turu) }
                        ]}>
                          {getActionTypeName(selectedAction.islem_turu)}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Tarih:</Text>
                      <Text style={styles.detailValue}>{formatDate(selectedAction.eylem_tarihi)}</Text>
                    </View>
                    
                    <View style={styles.detailRowColumn}>
                      <Text style={styles.detailLabel}>Açıklama:</Text>
                      <Text style={[styles.detailValue, styles.descriptionValue]}>
                        {selectedAction.eylem_aciklamasi || 'Açıklama yok'}
                      </Text>
                    </View>
                  </View>

                  {/* Additional Info */}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Ek Bilgiler</Text>
                    
                    {selectedAction.kullanici_adi && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>İşlemi Yapan:</Text>
                        <Text style={styles.detailValue}>{selectedAction.kullanici_adi}</Text>
                      </View>
                    )}
                    
                    {selectedAction.ilgili_belge_id && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>İlgili Belge ID:</Text>
                        <Text style={styles.detailValue}>{selectedAction.ilgili_belge_id}</Text>
                      </View>
                    )}
                  </View>
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
                
                {/* Action Type Filter */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>İşlem Türü</Text>
                  
                  <ScrollView style={styles.optionList} nestedScrollEnabled={true}>
                    <TouchableOpacity 
                      style={[
                        styles.filterOption, 
                        actionTypeFilter === null && styles.selectedFilterOption
                      ]}
                      onPress={() => setActionTypeFilter(null)}
                    >
                      <Text style={styles.filterOptionText}>Tümü</Text>
                      {actionTypeFilter === null && (
                        <Ionicons name="checkmark" size={20} color="#E6A05F" />
                      )}
                    </TouchableOpacity>
                    
                    {actionTypes.map(type => (
                      <TouchableOpacity 
                        key={type}
                        style={[
                          styles.filterOption, 
                          actionTypeFilter === type && styles.selectedFilterOption
                        ]}
                        onPress={() => setActionTypeFilter(type)}
                      >
                        <View style={styles.filterOptionWithBadge}>
                          <View style={[
                            styles.filterTypeBadge, 
                            { backgroundColor: getActionTypeColor(type) + '20' }
                          ]}>
                            <Text style={[
                              styles.filterTypeBadgeText,
                              { color: getActionTypeColor(type) }
                            ]}>
                              {getActionTypeName(type)}
                            </Text>
                          </View>
                        </View>
                        
                        {actionTypeFilter === type && (
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
    flex: 1.5,
  },
  typeColumn: {
    flex: 1,
    alignItems: 'center',
  },
  descriptionColumn: {
    flex: 2.5,
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
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  actionDate: {
    flex: 1.5,
    fontSize: 13,
    color: '#666666',
  },
  actionType: {
    flex: 1,
    alignItems: 'center',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionDescription: {
    flex: 2.5,
    fontSize: 14,
    color: '#333333',
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
  
  // Modal styles
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
    alignItems: 'center',
  },
  detailRowColumn: {
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
  descriptionValue: {
    marginTop: 6,
  },
  detailTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  detailTypeBadgeText: {
    fontSize: 14,
    fontWeight: '500',
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
    maxHeight: 200,
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
  filterOptionWithBadge: {
    flex: 1,
  },
  filterTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  filterTypeBadgeText: {
    fontSize: 13,
    fontWeight: '500',
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
});