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

// Giriş kaydı için tip tanımı
interface LoginRecord {
  id: string;
  eylem_tarihi: any; // Firestore timestamp
  eylem_turu: string;
  durumu: string;
  kullanici_id: string; 
  firma_id: string;
  kullanici_adi?: string; // İsteğe bağlı - kullanıcı adını saklayabiliriz
}

export default function CompanyActionsScreen() {
  const { userData, currentUser } = useAuth();
  const [loginRecords, setLoginRecords] = useState<LoginRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [filteredRecords, setFilteredRecords] = useState<LoginRecord[]>([]);
  const [userNames, setUserNames] = useState<{[key: string]: string}>({});
  
  // Kullanıcı filtresi için yeni state'ler
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userFilterModalVisible, setUserFilterModalVisible] = useState(false);
  const [uniqueUsers, setUniqueUsers] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    const fetchLoginHistory = async () => {
      try {
        if (!userData?.firma_id) {
          setError("Firma bilgisi bulunamadı");
          setLoading(false);
          return;
        }

        // Firestore'dan firmanın tüm giriş kayıtlarını getir
        const loginHistoryRef = collection(db, "Giris_Kayitlari");
        const q = query(
          loginHistoryRef,
          where("firma_id", "==", userData.firma_id),
          orderBy("eylem_tarihi", "desc") // En son giriş en üstte
        );

        const querySnapshot = await getDocs(q);
        const historyData: LoginRecord[] = [];
        const userIds = new Set<string>();
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          
          // Normal string ise ve e-posta formatındaysa kullanıcı ID olarak kabul et
          if (typeof data.kullanici_id === 'string' && 
              data.kullanici_id.includes('@')) {
            userIds.add(data.kullanici_id);
          } else {
            userIds.add(data.kullanici_id);
          }
          
          historyData.push({
            id: doc.id,
            ...data
          } as LoginRecord);
        });

        // Kullanıcı adlarını getir
        const userNames: {[key: string]: string} = {};
        for (const userId of userIds) {
          try {
            // Eğer bu bir e-posta ise kullanıcı olarak göster
            if (typeof userId === 'string' && userId.includes('@')) {
              userNames[userId] = userId;
            } else {
              // Firestore'dan kullanıcı belgesini al
              const userDoc = await getDoc(doc(db, "Kullanicilar", userId));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                userNames[userId] = `${userData.isim || ''} ${userData.soyisim || ''}`.trim() || userId;
              } else {
                userNames[userId] = "Bilinmeyen Kullanıcı";
              }
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
        
        setUniqueUsers(usersList);
        setUserNames(userNames);
        setLoginRecords(historyData);
        setFilteredRecords(historyData);
        setLoading(false);
      } catch (error) {
        console.error("Firma giriş geçmişi yüklenirken hata:", error);
        setError("Giriş bilgileri yüklenirken bir hata oluştu.");
        setLoading(false);
      }
    };

    fetchLoginHistory();
  }, [userData?.firma_id]);

  // Birleşik filtreleme fonksiyonu - hem arama metni hem de kullanıcı filtresini uygular
  useEffect(() => {
    let filtered = loginRecords;
    
    // Metin araması uygula
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(record => {
        const userName = userNames[record.kullanici_id] || '';
        return userName.toLowerCase().includes(searchLower) ||
               (record.eylem_turu && record.eylem_turu.toLowerCase().includes(searchLower)) ||
               (record.durumu && record.durumu.toLowerCase().includes(searchLower));
      });
    }
    
    // Kullanıcı filtresi uygula
    if (selectedUserId) {
      filtered = filtered.filter(record => record.kullanici_id === selectedUserId);
    }
    
    setFilteredRecords(filtered);
  }, [searchText, loginRecords, userNames, selectedUserId]);

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

  // Giriş öğesi render fonksiyonu
  const renderLoginItem = ({ item }: { item: LoginRecord }) => (
    <View style={styles.loginItem}>
      <View style={styles.loginHeader}>
        <Text style={styles.userName}>{userNames[item.kullanici_id] || "Bilinmeyen Kullanıcı"}</Text>
        <Text style={item.durumu === 'başarılı' ? styles.successText : styles.failedText}>
          {item.durumu === 'başarılı' ? 'Başarılı' : 'Başarısız'}
        </Text>
      </View>
      
      <View style={styles.loginDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>İşlem:</Text>
          <Text style={styles.detailValue}>{item.eylem_turu || 'Giriş'}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Tarih:</Text>
          <Text style={styles.detailValue}>{formatDate(item.eylem_tarihi)}</Text>
        </View>
      </View>
    </View>
  );

  // Filtre temizleme
  const clearFilter = () => {
    setSelectedUserId(null);
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
            style={styles.filterButton}
            onPress={() => setUserFilterModalVisible(true)}
          >
            <Feather name="users" size={20} color={selectedUserId ? "#E6A05F" : "#666666"} />
          </TouchableOpacity>
        </View>

        {/* Active User Filter Indicator */}
        {selectedUserId && (
          <TouchableOpacity 
            style={styles.activeFilterContainer}
            onPress={clearFilter}
          >
            <Text style={styles.activeFilterText}>
              Kullanıcı: {userNames[selectedUserId] || "Bilinmeyen Kullanıcı"}
            </Text>
            <Feather name="x" size={16} color="#666666" />
          </TouchableOpacity>
        )}

        {/* Login Records List */}
        {filteredRecords.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="activity" size={50} color="#CCCCCC" />
            <Text style={styles.emptyText}>
              {searchText || selectedUserId ? "Filtre sonucu bulunamadı" : "Henüz hareket kaydı bulunmuyor"}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredRecords}
            renderItem={renderLoginItem}
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
                style={[styles.userOption, selectedUserId === null && styles.selectedOption]}
                onPress={() => {
                  setSelectedUserId(null);
                  setUserFilterModalVisible(false);
                }}
              >
                <Text style={styles.userOptionText}>Tüm Kullanıcılar</Text>
                {selectedUserId === null && (
                  <Feather name="check" size={20} color="#E6A05F" />
                )}
              </TouchableOpacity>

              {uniqueUsers.map(user => (
                <TouchableOpacity 
                  key={user.id}
                  style={[styles.userOption, selectedUserId === user.id && styles.selectedOption]}
                  onPress={() => {
                    setSelectedUserId(user.id);
                    setUserFilterModalVisible(false);
                  }}
                >
                  <Text style={styles.userOptionText}>{user.name}</Text>
                  {selectedUserId === user.id && (
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
    marginLeft: 8,
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
  activeFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF9F2',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 10,
    borderRadius: 6,
  },
  activeFilterText: {
    fontSize: 14,
    color: '#E6A05F',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  loginItem: {
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
  loginHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222222',
  },
  successText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 4,
  },
  failedText: {
    fontSize: 14,
    color: '#F44336',
    fontWeight: '500',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: 4,
  },
  loginDetails: {
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
  userOption: {
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
  userOptionText: {
    fontSize: 16,
    color: '#333333',
  },
});