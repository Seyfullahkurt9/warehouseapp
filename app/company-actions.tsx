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
  TextInput,
  Modal,
  ScrollView
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { collection, query, where, orderBy, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

// Eylem kaydı için tip tanımı
interface ActionRecord {
  id: string;
  eylem_tarihi: any; // Firestore timestamp
  eylem_aciklamasi: string;
  kullanici_id: string; 
  firma_id: string;
  kullanici_adi?: string;
  islem_turu?: string;
  ilgili_belge_id?: string;
}

export default function CompanyActionsScreen() {
  const { userData, currentUser } = useAuth();
  const [actionRecords, setActionRecords] = useState<ActionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [filteredRecords, setFilteredRecords] = useState<ActionRecord[]>([]);
  const [userNames, setUserNames] = useState<{[key: string]: string}>({});
  
  // Kullanıcı filtresi için state'ler
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userFilterModalVisible, setUserFilterModalVisible] = useState(false);
  const [uniqueUsers, setUniqueUsers] = useState<{id: string, name: string}[]>([]);

  // İşlem türü filtresi için state'ler
  const [selectedActionType, setSelectedActionType] = useState<string | null>(null);
  const [actionTypeModalVisible, setActionTypeModalVisible] = useState(false);
  const [uniqueActionTypes, setUniqueActionTypes] = useState<string[]>([]);

  useEffect(() => {
    const fetchCompanyActions = async () => {
      try {
        if (!userData?.firma_id) {
          setError("Firma bilgisi bulunamadı");
          setLoading(false);
          return;
        }

        // Firestore'dan firmanın tüm eylemlerini getir
        const actionsRef = collection(db, "Eylemler");
        const q = query(
          actionsRef,
          where("firma_id", "==", userData.firma_id),
          orderBy("eylem_tarihi", "desc") // En yeni eylem en üstte
        );

        const querySnapshot = await getDocs(q);
        const actionsData: ActionRecord[] = [];
        const userIds = new Set<string>();
        const actionTypes = new Set<string>();
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          
          userIds.add(data.kullanici_id);
          
          // İşlem türlerini topla
          if (data.islem_turu) {
            actionTypes.add(data.islem_turu);
          }
          
          actionsData.push({
            id: doc.id,
            ...data
          } as ActionRecord);
        });

        // Kullanıcı adlarını getir
        const userNames: {[key: string]: string} = {};
        for (const userId of userIds) {
          try {
            const userDoc = await getDoc(doc(db, "Kullanicilar", userId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              userNames[userId] = `${userData.isim || ''} ${userData.soyisim || ''}`.trim() || userId;
            } else {
              // Kullanıcı belgesi bulunamadıysa direkt kullanıcı ID'si gösterilir
              userNames[userId] = "Bilinmeyen Kullanıcı";
            }
          } catch (error) {
            console.error("Kullanıcı bilgisi alınırken hata:", error);
            userNames[userId] = "Bilinmeyen Kullanıcı";
          }
        }
        
        // Benzersiz kullanıcıları hazırla
        const usersList = Array.from(userIds).map(id => ({
          id,
          name: userNames[id] || "Bilinmeyen Kullanıcı"
        }));
        
        // İsme göre sırala
        usersList.sort((a, b) => a.name.localeCompare(b.name));
        
        // İşlem türlerini alfabetik sırala
        const sortedActionTypes = Array.from(actionTypes).sort();
        
        setUniqueUsers(usersList);
        setUniqueActionTypes(sortedActionTypes);
        setUserNames(userNames);
        setActionRecords(actionsData);
        setFilteredRecords(actionsData);
        setLoading(false);
      } catch (error) {
        console.error("Firma eylemleri yüklenirken hata:", error);
        setError("Eylem bilgileri yüklenirken bir hata oluştu.");
        setLoading(false);
      }
    };

    fetchCompanyActions();
  }, [userData?.firma_id]);

  // Filtreleme fonksiyonu - hem arama metni hem kullanıcı hem de işlem türü filtresini uygular
  useEffect(() => {
    let filtered = actionRecords;
    
    // Metin araması uygula
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(record => {
        const userName = userNames[record.kullanici_id] || '';
        return userName.toLowerCase().includes(searchLower) ||
               (record.eylem_aciklamasi && record.eylem_aciklamasi.toLowerCase().includes(searchLower)) ||
               (record.islem_turu && record.islem_turu.toLowerCase().includes(searchLower));
      });
    }
    
    // Kullanıcı filtresi uygula
    if (selectedUserId) {
      filtered = filtered.filter(record => record.kullanici_id === selectedUserId);
    }
    
    // İşlem türü filtresi uygula
    if (selectedActionType) {
      filtered = filtered.filter(record => record.islem_turu === selectedActionType);
    }
    
    setFilteredRecords(filtered);
  }, [searchText, actionRecords, userNames, selectedUserId, selectedActionType]);

  // Tarih formatla
  const formatDate = (dateObject: any): string => {
    if (!dateObject) return '-';
    
    try {
      const date = dateObject.toDate ? dateObject.toDate() : new Date(dateObject);
      
      // Gün.Ay.Yıl - Saat:Dakika formatında
      return date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).replace(',', ' -');
    } catch (error) {
      return '-';
    }
  };

  // İşlem türünü formatla
  const formatActionType = (actionType: string | undefined): string => {
    if (!actionType) return 'Bilinmeyen İşlem';
    
    switch (actionType) {
      case 'depo_ekleme': return 'Depo Ekleme';
      case 'depo_silme': return 'Depo Silme';
      case 'depo_durum_degistirme': return 'Depo Durum Değiştirme';
      case 'musteri_ekleme': return 'Müşteri Ekleme';
      case 'musteri_silme': return 'Müşteri Silme';
      case 'tedarikci_ekleme': return 'Tedarikçi Ekleme';
      case 'tedarikci_silme': return 'Tedarikçi Silme';
      case 'urun_cikisi': return 'Ürün Çıkışı';
      case 'urun_girisi': return 'Ürün Girişi';
      case 'stok_transferi': return 'Stok Transferi';
      case 'stok_hareketi_silme': return 'Stok Hareketi Silme';
      case 'siparis_olusturma': return 'Sipariş Oluşturma';
      case 'siparis_guncelleme': return 'Sipariş Güncelleme';
      case 'siparis_silme': return 'Sipariş Silme';
      case 'firmaya_katilim': return 'Firmaya Katılım';
      default: return actionType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }
  };

  // İşlem türü bazlı renk atamaları
  const getActionTypeColor = (actionType: string | undefined): string => {
    if (!actionType) return '#666666'; // Varsayılan gri
    
    switch (actionType) {
      case 'depo_ekleme':
      case 'stok_girisi':
      case 'firmaya_katilim':
        return '#4CAF50'; // Yeşil (oluşturma işlemleri)
        
      case 'depo_silme':
      case 'stok_hareketi_silme':
      case 'siparis_silme':
      case 'musteri_silme':
      case 'tedarikci_silme':
        return '#F44336'; // Kırmızı (silme işlemleri)
        
      case 'depo_durum_degistirme':
      case 'siparis_guncelleme':
        return '#2196F3'; // Mavi (güncelleme işlemleri)
        
      case 'stok_transferi':
        return '#FF9800'; // Turuncu (transfer işlemleri)
        
      default:
        return '#E6A05F'; // Varsayılan tema rengi
    }
  };

  // Eylem öğesi render fonksiyonu - Görsellik güncellendi
  const renderActionItem = ({ item }: { item: ActionRecord }) => (
    <View style={styles.actionItem}>
      <View style={styles.actionHeader}>
        <Text style={styles.userName}>{userNames[item.kullanici_id] || "Bilinmeyen Kullanıcı"}</Text>
        {item.islem_turu && (
          <View style={[styles.actionTypeBadge, { backgroundColor: getActionTypeColor(item.islem_turu) + '20' }]}>
            <Text style={[styles.actionTypeText, { color: getActionTypeColor(item.islem_turu) }]}>
              {formatActionType(item.islem_turu)}
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.actionDescription}>
        <Text style={styles.descriptionText}>{item.eylem_aciklamasi}</Text>
      </View>
      
      <View style={styles.actionDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Tarih:</Text>
          <Text style={styles.detailValue}>{formatDate(item.eylem_tarihi)}</Text>
        </View>
        {item.ilgili_belge_id && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Belge ID:</Text>
            <Text style={styles.detailValue} numberOfLines={1} ellipsizeMode="middle">{item.ilgili_belge_id}</Text>
          </View>
        )}
      </View>
      
      <View style={[styles.actionDot, { backgroundColor: getActionTypeColor(item.islem_turu) }]} />
    </View>
  );

  // Filtre temizleme
  const clearFilters = () => {
    setSelectedUserId(null);
    setSelectedActionType(null);
  };

  // Yükleme durumu
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#E6A05F" />
        <Text style={styles.loadingText}>Firma hareketleri yükleniyor...</Text>
      </View>
    );
  }

  // Hata durumu
  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <StatusBar barStyle="dark-content" />
        <Feather name="alert-circle" size={50} color="#FF6B6B" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
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
          
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerMainTitle}>TRACKIT</Text>
            <Text style={styles.headerSubTitle}>Firma Hareketleri</Text>
          </View>
        </View>

        {/* Search and Filter Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Feather name="search" size={20} color="#666666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Ara..."
              value={searchText}
              onChangeText={setSearchText}
            />
            {searchText ? (
              <TouchableOpacity 
                style={styles.clearButton} 
                onPress={() => setSearchText('')}
              >
                <Feather name="x" size={20} color="#666666" />
              </TouchableOpacity>
            ) : null}
          </View>
          
          <TouchableOpacity 
            style={[styles.filterButton, { marginLeft: 8 }]}
            onPress={() => setUserFilterModalVisible(true)}
          >
            <Feather name="users" size={20} color={selectedUserId ? "#E6A05F" : "#666666"} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterButton, { marginLeft: 8 }]}
            onPress={() => setActionTypeModalVisible(true)}
          >
            <Feather name="tag" size={20} color={selectedActionType ? "#E6A05F" : "#666666"} />
          </TouchableOpacity>
        </View>

        {/* Active Filters Indicator */}
        {(selectedUserId || selectedActionType) && (
          <View style={styles.activeFiltersContainer}>
            {selectedUserId && (
              <TouchableOpacity 
                style={styles.activeFilterBadge}
                onPress={() => setSelectedUserId(null)}
              >
                <Text style={styles.activeFilterText}>
                  Kullanıcı: {userNames[selectedUserId] || "Bilinmeyen"}
                </Text>
                <Feather name="x" size={16} color="#E6A05F" />
              </TouchableOpacity>
            )}
            
            {selectedActionType && (
              <TouchableOpacity 
                style={styles.activeFilterBadge}
                onPress={() => setSelectedActionType(null)}
              >
                <Text style={styles.activeFilterText}>
                  İşlem: {formatActionType(selectedActionType)}
                </Text>
                <Feather name="x" size={16} color="#E6A05F" />
              </TouchableOpacity>
            )}
            
            {(selectedUserId || selectedActionType) && (
              <TouchableOpacity 
                style={styles.clearAllFiltersButton}
                onPress={clearFilters}
              >
                <Text style={styles.clearAllFiltersText}>Tümünü Temizle</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Action Records List */}
        {filteredRecords.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="activity" size={50} color="#CCCCCC" />
            <Text style={styles.emptyText}>
              {searchText || selectedUserId || selectedActionType 
                ? "Filtre sonucu bulunamadı" 
                : "Henüz hareket kaydı bulunmuyor"}
            </Text>
            {(searchText || selectedUserId || selectedActionType) && (
              <TouchableOpacity 
                style={styles.clearAllFiltersButton}
                onPress={() => {
                  setSearchText('');
                  clearFilters();
                }}
              >
                <Text style={styles.clearAllFiltersText}>Filtreleri Temizle</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={filteredRecords}
            renderItem={renderActionItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>

      {/* User Filter Modal */}
      <Modal
        visible={userFilterModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setUserFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Kullanıcıya Göre Filtrele</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setUserFilterModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#222222" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <TouchableOpacity 
                style={[styles.filterOption, selectedUserId === null && styles.selectedOption]}
                onPress={() => {
                  setSelectedUserId(null);
                  setUserFilterModalVisible(false);
                }}
              >
                <Text style={styles.filterOptionText}>Tüm Kullanıcılar</Text>
                {selectedUserId === null && (
                  <Feather name="check" size={20} color="#E6A05F" />
                )}
              </TouchableOpacity>

              {uniqueUsers.map(user => (
                <TouchableOpacity 
                  key={user.id}
                  style={[styles.filterOption, selectedUserId === user.id && styles.selectedOption]}
                  onPress={() => {
                    setSelectedUserId(user.id);
                    setUserFilterModalVisible(false);
                  }}
                >
                  <Text style={styles.filterOptionText}>{user.name}</Text>
                  {selectedUserId === user.id && (
                    <Feather name="check" size={20} color="#E6A05F" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Action Type Filter Modal */}
      <Modal
        visible={actionTypeModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setActionTypeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>İşlem Türüne Göre Filtrele</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setActionTypeModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#222222" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <TouchableOpacity 
                style={[styles.filterOption, selectedActionType === null && styles.selectedOption]}
                onPress={() => {
                  setSelectedActionType(null);
                  setActionTypeModalVisible(false);
                }}
              >
                <Text style={styles.filterOptionText}>Tüm İşlemler</Text>
                {selectedActionType === null && (
                  <Feather name="check" size={20} color="#E6A05F" />
                )}
              </TouchableOpacity>

              {uniqueActionTypes.map(actionType => (
                <TouchableOpacity 
                  key={actionType}
                  style={[styles.filterOption, selectedActionType === actionType && styles.selectedOption]}
                  onPress={() => {
                    setSelectedActionType(actionType);
                    setActionTypeModalVisible(false);
                  }}
                >
                  <Text style={styles.filterOptionText}>{formatActionType(actionType)}</Text>
                  {selectedActionType === actionType && (
                    <Feather name="check" size={20} color="#E6A05F" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    marginTop: 10,
    fontSize: 16,
    color: '#FF6B6B',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#E6A05F',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
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
  headerTitleContainer: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 10,
  },
  headerMainTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222222',
  },
  headerSubTitle: {
    fontSize: 16,
    color: '#222222',
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    marginBottom: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
  },
  clearButton: {
    padding: 5,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activeFiltersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  activeFilterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9F2',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  activeFilterText: {
    fontSize: 14,
    color: '#E6A05F',
    marginRight: 6,
  },
  clearAllFiltersButton: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    marginBottom: 8,
  },
  clearAllFiltersText: {
    fontSize: 14,
    color: '#666666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 10,
    marginBottom: 15,
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  actionItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222222',
    flex: 1,
  },
  actionTypeBadge: {
    borderRadius: 4,
  },
  actionTypeText: {
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionDescription: {
    marginBottom: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
  },
  descriptionText: {
    fontSize: 15,
    color: '#333333',
    lineHeight: 22,
  },
  actionDetails: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666666',
    width: 60,
  },
  detailValue: {
    fontSize: 14,
    color: '#333333',
    flex: 1,
  },
  actionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 10,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
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
    maxHeight: '60%',
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectedOption: {
    backgroundColor: '#FFF9F2',
  },
  filterOptionText: {
    fontSize: 16,
    color: '#333333',
  },
});