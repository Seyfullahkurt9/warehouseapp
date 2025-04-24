import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

// Kullanıcı tipi tanımı
interface User {
  id: string;
  isim: string;
  soyisim: string;
  eposta: string;
  telefon: string;
  is_unvani: string;
  firma_id: string;
  yetki_id: string;
}

export default function UsersScreen() {
  const { userData } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingUser, setUpdatingUser] = useState(false);
  
  // Detay modalı için state değişkenleri
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // Kullanıcıları yükleme
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        if (!userData?.firma_id) {
          setError("Kullanıcı firma bilgisi bulunamadı");
          setLoading(false);
          return;
        }

        // Kullanıcının firma_id'si ile eşleşen kullanıcıları getir
        const usersRef = collection(db, "Kullanicilar");
        const q = query(usersRef, where("firma_id", "==", userData.firma_id));
        const querySnapshot = await getDocs(q);

        const usersList: User[] = [];
        querySnapshot.forEach((doc) => {
          usersList.push({
            id: doc.id,
            ...doc.data()
          } as User);
        });

        setUsers(usersList);
        setLoading(false);

      } catch (error) {
        console.error("Kullanıcılar yüklenirken hata:", error);
        
        let errorMessage = "Bilinmeyen hata";
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
        
        setError("Kullanıcılar yüklenemedi: " + errorMessage);
        setLoading(false);
      }
    };

    fetchUsers();
  }, [userData?.firma_id]);

  // Kullanıcı detaylarını gösterme fonksiyonu
  const showUserDetails = (user: User) => {
    setSelectedUser(user);
    setDetailModalVisible(true);
  };
  
  // Kullanıcıya admin yetkisi verme fonksiyonu
  const handleGrantAdminPermission = async () => {
    if (!selectedUser) return;
    
    setUpdatingUser(true);
    
    try {
      // Firestore'da kullanıcıyı güncelle
      const userRef = doc(db, "Kullanicilar", selectedUser.id);
      await updateDoc(userRef, {
        yetki_id: "admin"
      });
      
      // Kullanıcı listesini güncelle
      const updatedUsers = users.map(user => {
        if (user.id === selectedUser.id) {
          return {...user, yetki_id: "admin"};
        }
        return user;
      });
      
      setUsers(updatedUsers);
      
      // Seçili kullanıcıyı güncelle (modal içerisinde gösterilen)
      setSelectedUser({...selectedUser, yetki_id: "admin"});
      
      Alert.alert("Başarılı", `${selectedUser.isim} ${selectedUser.soyisim} kullanıcısına yönetici yetkisi verildi.`);
      
    } catch (error) {
      console.error("Yetkilendirme hatası:", error);
      Alert.alert("Hata", "Yetkilendirme işlemi sırasında bir sorun oluştu.");
    } finally {
      setUpdatingUser(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#E6A05F" />
        <Text style={styles.loadingText}>Kullanıcılar yükleniyor...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Feather name="alert-circle" size={50} color="#FF6B6B" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.replace('/admin-home')}>
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
          
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerMainTitle}>TRACKIT</Text>
            <Text style={styles.headerSubTitle}>Kullanıcılar</Text>
          </View>
          
          <View style={styles.headerRight}>
            <Feather name="users" size={24} color="#666666" />
          </View>
        </View>

        {/* User List */}
        <ScrollView 
          style={styles.userListContainer}
          contentContainerStyle={styles.userListContent}
          showsVerticalScrollIndicator={false}
        >
          {users.map((user) => (
            <View key={user.id} style={styles.userCard}>
              <View style={styles.userIconContainer}>
                <Feather name="user" size={28} color="#444444" />
              </View>
              
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.isim} {user.soyisim}</Text>
                <Text style={styles.userPosition}>{user.is_unvani || 'Pozisyon belirtilmemiş'}</Text>
                <Text style={styles.userEmail}>{user.eposta}</Text>
              </View>
              
              <View style={styles.userActions}>
                <TouchableOpacity 
                  style={styles.actionIcon}
                  onPress={() => showUserDetails(user)}
                >
                  <Feather name="eye" size={20} color="#666666" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>

      {/* Kullanıcı Detayları Modal */}
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
              <Text style={styles.modalTitle}>Kullanıcı Detayları</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setDetailModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#222222" />
              </TouchableOpacity>
            </View>
            
            {/* Modal Body */}
            {selectedUser ? (
              <ScrollView style={styles.modalBody}>
                {/* Kullanıcı Özeti */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Kişisel Bilgiler</Text>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Ad:</Text>
                    <Text style={styles.detailValue}>{selectedUser.isim}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Soyad:</Text>
                    <Text style={styles.detailValue}>{selectedUser.soyisim}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>İş Ünvanı:</Text>
                    <Text style={styles.detailValue}>{selectedUser.is_unvani || 'Belirtilmemiş'}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Yetki:</Text>
                    <Text style={styles.detailValue}>
                      {selectedUser.yetki_id === 'admin' ? 'Yönetici' : 'Kullanıcı'}
                    </Text>
                  </View>
                </View>

                {/* İletişim Bilgileri */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>İletişim Bilgileri</Text>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>E-posta:</Text>
                    <Text style={styles.detailValue}>{selectedUser.eposta}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Telefon:</Text>
                    <Text style={styles.detailValue}>{selectedUser.telefon || 'Belirtilmemiş'}</Text>
                  </View>
                </View>
                
                {/* Admin Yetkisi Verme Butonu - Sadece admin olmayan kullanıcılar için göster */}
                {selectedUser.yetki_id !== 'admin' && userData?.yetki_id === 'admin' && (
                  <TouchableOpacity 
                    style={styles.grantAdminButton}
                    onPress={handleGrantAdminPermission}
                    disabled={updatingUser}
                  >
                    {updatingUser ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.grantAdminButtonText}>Yönetici Yetkisi Ver</Text>
                    )}
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
  headerRight: {
    padding: 5,
  },
  userListContainer: {
    flex: 1,
    marginTop: 16,
  },
  userListContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  userCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  userPosition: {
    fontSize: 14,
    color: '#777777',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#777777',
  },
  userActions: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIcon: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
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
  detailsLoading: {
    padding: 20,
    alignItems: 'center',
  },
  detailSection: {
    marginBottom: 24,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E6A05F',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  detailLabel: {
    width: 100,
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
  },
  // Yeni yetki verme butonu için stiller
  grantAdminButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grantAdminButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  }
});