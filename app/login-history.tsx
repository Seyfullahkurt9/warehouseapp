import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
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
}

export default function LoginHistoryScreen() {
  const { currentUser, userData } = useAuth();
  const [loginHistory, setLoginHistory] = useState<LoginRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLoginHistory = async () => {
      try {
        if (!currentUser) {
          setError("Kullanıcı bilgisi bulunamadı");
          setLoading(false);
          return;
        }

        // Firestore'dan kullanıcının giriş kayıtlarını getir
        const loginHistoryRef = collection(db, "Giris_Kayitlari");
        const q = query(
          loginHistoryRef,
          where("kullanici_id", "==", currentUser.uid),
          orderBy("eylem_tarihi", "desc") // En son giriş en üstte
        );

        const querySnapshot = await getDocs(q);
        const historyData: LoginRecord[] = [];
        
        querySnapshot.forEach((doc) => {
          historyData.push({
            id: doc.id,
            ...doc.data()
          } as LoginRecord);
        });

        setLoginHistory(historyData);
        setLoading(false);
      } catch (error) {
        console.error("Giriş geçmişi yüklenirken hata:", error);
        setError("Giriş bilgileri yüklenirken bir hata oluştu.");
        setLoading(false);
      }
    };

    fetchLoginHistory();
  }, [currentUser]);

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
      <Text style={styles.dateTimeText}>{formatDate(item.eylem_tarihi)}</Text>
      <Text style={item.durumu === 'başarılı' ? styles.successText : styles.failedText}>
        {item.durumu === 'başarılı' ? 'Başarılı giriş' : 'Başarısız giriş'}
      </Text>
    </View>
  );

  // Yükleme durumu
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#E6A05F" />
        <Text style={styles.loadingText}>Giriş bilgileri yükleniyor...</Text>
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
            <Text style={styles.headerSubTitle}>Son Giriş Bilgilerim</Text>
          </View>
          
          <View style={styles.headerRight}>
            <View style={styles.calendarIconContainer}>
              <Feather name="calendar" size={20} color="#666666" />
            </View>
          </View>
        </View>

        {/* Login History List */}
        {loginHistory.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="clock" size={50} color="#CCCCCC" />
            <Text style={styles.emptyText}>Henüz giriş kaydı bulunmuyor</Text>
          </View>
        ) : (
          <FlatList
            data={loginHistory}
            renderItem={renderLoginItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
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
  calendarIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
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
    padding: 20,
    paddingBottom: 40,
  },
  loginItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  dateTimeText: {
    fontSize: 15,
    color: '#666666',
  },
  successText: {
    fontSize: 15,
    color: '#4CAF50',
    fontWeight: '500',
  },
  failedText: {
    fontSize: 15,
    color: '#F44336',
    fontWeight: '500',
  },
});