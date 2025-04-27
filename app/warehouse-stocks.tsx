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
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

// Stok tipi tanımı
interface Stock {
  id: string;
  urun_adi: string;
  birim: string;
  miktar: number;
  depo_id: string;
  firma_id: string;
}

export default function WarehouseStocksScreen() {
  const { userData } = useAuth();
  const params = useLocalSearchParams();
  const warehouseId = params.warehouseId as string;
  const warehouseName = params.warehouseName as string;
  
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchStocks = async () => {
      if (!warehouseId || !userData?.firma_id) {
        setError("Gerekli bilgiler eksik");
        setLoading(false);
        return;
      }
      
      try {
        // Belirli bir depoya ait stokları getir ve firma_id ile filtrele
        const stocksRef = collection(db, "Stoklar");
        const q = query(
          stocksRef, 
          where("depo_id", "==", warehouseId),
          where("firma_id", "==", userData.firma_id)
        );
        
        const querySnapshot = await getDocs(q);
        
        const stocksList: Stock[] = [];
        querySnapshot.forEach((doc) => {
          stocksList.push({
            id: doc.id,
            ...doc.data()
          } as Stock);
        });
        
        setStocks(stocksList);
        setLoading(false);
      } catch (error) {
        console.error("Stoklar yüklenirken hata:", error);
        setError("Stoklar yüklenemedi");
        setLoading(false);
      }
    };
    
    fetchStocks();
  }, [warehouseId, userData?.firma_id]);
  
  // Birim ve miktar formatlaması
  const formatQuantity = (quantity: number, unit: string): string => {
    return `${quantity} ${unit}`;
  };
  
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#E6A05F" />
        <Text style={styles.loadingText}>Stok bilgileri yükleniyor...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
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
          <Text style={styles.screenTitle}>{warehouseName} Stok Durumu</Text>
        </View>
        
        {/* Depo Bilgisi */}
        <View style={styles.warehouseInfoContainer}>
          <Feather name="home" size={18} color="#E6A05F" style={styles.warehouseIcon} />
          <Text style={styles.warehouseInfo}>{warehouseName}</Text>
        </View>
        
        {/* Stok Listesi veya Boş Durum */}
        {stocks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="box" size={60} color="#CCCCCC" />
            <Text style={styles.emptyText}>Bu depoda henüz stok bulunmuyor</Text>
          </View>
        ) : (
          <>
            {/* Stok Özeti */}
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryText}>
                Toplam {stocks.length} farklı ürün
              </Text>
            </View>
            
            {/* Liste Başlıkları */}
            <View style={styles.headerRow}>
              <Text style={[styles.headerCell, { flex: 2 }]}>Ürün Adı</Text>
              <Text style={[styles.headerCell, { flex: 1 }]}>Miktar</Text>
              <Text style={[styles.headerCell, { flex: 1 }]}>Birim</Text>
            </View>
            
            {/* Stok Listesi */}
            <FlatList
              data={stocks}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.stockItem}>
                  <View style={[styles.stockCell, { flex: 2 }]}>
                    <Text style={styles.stockName} numberOfLines={2}>{item.urun_adi}</Text>
                  </View>
                  <View style={[styles.stockCell, { flex: 1 }]}>
                    <Text style={styles.stockQuantity}>{item.miktar}</Text>
                  </View>
                  <View style={[styles.stockCell, { flex: 1 }]}>
                    <Text style={styles.stockUnit}>{item.birim}</Text>
                  </View>
                </View>
              )}
              contentContainerStyle={styles.listContainer}
            />
          </>
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
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222222',
    flex: 1,
  },
  warehouseInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9F2',
    padding: 12,
    margin: 16,
    borderRadius: 8,
  },
  warehouseIcon: {
    marginRight: 8,
  },
  warehouseInfo: {
    fontSize: 15,
    color: '#666666',
    fontWeight: '500',
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
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#666666',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F1F1',
    padding: 10,
    marginHorizontal: 16,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  headerCell: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#555555',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  stockItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  stockCell: {
    justifyContent: 'center',
  },
  stockName: {
    fontSize: 15,
    color: '#333333',
  },
  stockQuantity: {
    fontSize: 15,
    color: '#333333',
    fontWeight: '500',
  },
  stockUnit: {
    fontSize: 14,
    color: '#666666',
  }
});