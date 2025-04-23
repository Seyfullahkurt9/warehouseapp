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
  Alert
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

// Müşteri tipi tanımı
interface Customer {
  id: string;
  sirket_ismi: string;
  adres: string;
  telefon: string;
  eposta: string;
  firma_id: string;
}

export default function CustomersScreen() {
  const { userData, currentUser } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRetry, setIsRetry] = useState(false);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        if (!userData || !userData.firma_id) {
          // Kullanıcı firma bilgisi eksikse hata göster
          setError("Kullanıcı firma bilgisi bulunamadı");
          setLoading(false);
          return;
        }

        // Kullanıcının firma_id'si ile eşleşen müşterileri getir
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
        setLoading(false);

      } catch (error) {
        console.error("Müşteriler yüklenirken hata:", error);
        
        // Error tipinin kontrol edilmesi
        let errorMessage = "Bilinmeyen hata";
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
        
        setError("Müşteriler yüklenemedi: " + errorMessage);
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [userData?.firma_id]);

  const handleAddCustomer = () => {
    if (!userData || !userData.firma_id) {
      Alert.alert("Hata", "Müşteri ekleyebilmek için bir firmaya bağlı olmalısınız.");
      return;
    }

    router.push('/add-customer');
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#E6A05F" />
        <Text style={styles.loadingText}>Müşteriler yükleniyor...</Text>
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
          <Text style={styles.screenTitle}>Müşteriler</Text>
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

        {customers.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="inbox" size={40} color="#CCCCCC" />
            <Text style={styles.emptyText}>Henüz müşteri bulunmuyor</Text>
            <Text style={styles.emptySubText}>Müşteri eklemek için aşağıdaki butonu kullanabilirsiniz</Text>
          </View>
        ) : (
          <FlatList
            data={customers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.customerItem}>
                <Text style={[styles.customerName, styles.companyColumn]} numberOfLines={1} ellipsizeMode="tail">{item.sirket_ismi}</Text>
                <View style={[styles.contactInfo, styles.contactColumn]}>
                  <Text style={styles.contactText} numberOfLines={1} ellipsizeMode="tail">{item.telefon}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.detailsButton}
                  onPress={() => Alert.alert(
                    item.sirket_ismi,
                    `E-posta: ${item.eposta}\nTelefon: ${item.telefon}\nAdres: ${item.adres}`
                  )}
                >
                  <View style={styles.detailsIconContainer}>
                    <Feather name="eye" size={18} color="#666666" />
                  </View>
                </TouchableOpacity>
              </View>
            )}
            contentContainerStyle={[
              styles.listContainer,
              customers.length === 0 && styles.emptyListContainer
            ]}
          />
        )}

        {/* Floating Action Button */}
        <TouchableOpacity 
          style={styles.fab}
          onPress={handleAddCustomer}
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
  customerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  customerName: {
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
});