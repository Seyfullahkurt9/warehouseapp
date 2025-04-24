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
  ScrollView
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

// Stok öğesi için tip tanımı
interface StockItem {
  id: string;
  urun_adi: string;
  birim: string;
  miktar: number;
  depo_id: string;
  firma_id: string;
}

// Depo detayları için tip tanımı
interface Warehouse {
  id: string;
  depo_adi: string;
  depo_turu: string;
  aktif: boolean;
}

// Birleştirilmiş stok görünümü için tip tanımı
interface AggregatedStock {
  urun_adi: string;
  birim: string;
  toplam_miktar: number;
  stok_detaylari: {
    depo_id: string;
    depo_adi?: string; // Depo bilgisi yüklendiğinde doldurulacak
    miktar: number;
  }[];
}

export default function StocksScreen() {
  const { userData } = useAuth();
  const [stocks, setStocks] = useState<AggregatedStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Detay modalı için state değişkenleri
  const [selectedStock, setSelectedStock] = useState<AggregatedStock | null>(null);
  const [stockDetailsVisible, setStockDetailsVisible] = useState(false);
  
  // Depo bilgilerini tutar
  const [warehouses, setWarehouses] = useState<Record<string, Warehouse>>({});

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        if (!userData?.firma_id) {
          setError("Kullanıcı firma bilgisi bulunamadı.");
          setLoading(false);
          return;
        }

        // 1. Önce tüm stokları getir
        const stocksRef = collection(db, "Stoklar");
        const q = query(stocksRef, where("firma_id", "==", userData.firma_id));
        const querySnapshot = await getDocs(q);

        const stockItems: StockItem[] = [];
        querySnapshot.forEach((doc) => {
          stockItems.push({
            id: doc.id,
            ...doc.data()
          } as StockItem);
        });

        // 2. Stokları ürün adına göre grupla
        const groupedStocks: Record<string, AggregatedStock> = {};

        stockItems.forEach(item => {
          if (!groupedStocks[item.urun_adi]) {
            groupedStocks[item.urun_adi] = {
              urun_adi: item.urun_adi,
              birim: item.birim,
              toplam_miktar: 0,
              stok_detaylari: []
            };
          }
          
          groupedStocks[item.urun_adi].toplam_miktar += item.miktar;
          groupedStocks[item.urun_adi].stok_detaylari.push({
            depo_id: item.depo_id,
            miktar: item.miktar
          });
        });

        // 3. Depo bilgilerini getir
        const depoIds = new Set<string>();
        stockItems.forEach(item => depoIds.add(item.depo_id));
        
        const warehousesData: Record<string, Warehouse> = {};
        const warehousePromises = Array.from(depoIds).map(async depoId => {
          const depoRef = doc(db, "Depolar", depoId);
          const depoSnap = await getDoc(depoRef);
          
          if (depoSnap.exists()) {
            const depoData = depoSnap.data();
            warehousesData[depoId] = {
              id: depoId,
              depo_adi: depoData.depo_adi || "Bilinmeyen Depo",
              depo_turu: depoData.depo_turu || "",
              aktif: depoData.aktif ?? true
            };
          }
        });

        // Tüm depo bilgilerinin getirilmesini bekle
        await Promise.all(warehousePromises);
        setWarehouses(warehousesData);

        // 4. Stok detaylarını depo bilgileriyle eşleştir
        Object.values(groupedStocks).forEach(stock => {
          stock.stok_detaylari.forEach(detail => {
            const warehouse = warehousesData[detail.depo_id];
            if (warehouse) {
              detail.depo_adi = warehouse.depo_adi;
            } else {
              detail.depo_adi = "Bilinmeyen Depo";
            }
          });
        });

        // 5. Sonuç listesini güncelle
        setStocks(Object.values(groupedStocks));
        setLoading(false);

      } catch (error) {
        console.error("Stoklar yüklenirken hata:", error);
        
        let errorMessage = "Bilinmeyen hata";
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
        
        setError("Stoklar yüklenemedi: " + errorMessage);
        setLoading(false);
      }
    };

    fetchStocks();
  }, [userData?.firma_id]);

  // Stok detaylarını gösterme fonksiyonu
  const showStockDetails = (stock: AggregatedStock) => {
    setSelectedStock(stock);
    setStockDetailsVisible(true);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#E6A05F" />
        <Text style={styles.loadingText}>Stoklar yükleniyor...</Text>
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
          <Text style={styles.screenTitle}>Stok Durumu</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton}>
              <Feather name="search" size={22} color="#666666" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Feather name="filter" size={22} color="#666666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Column Headers */}
        <View style={styles.columnHeaders}>
          <Text style={[styles.columnHeader, styles.productColumn]}>Ürün Adı</Text>
          <Text style={[styles.columnHeader, styles.unitColumn]}>Birim</Text>
          <Text style={[styles.columnHeader, styles.quantityColumn]}>Miktar</Text>
          <Text style={[styles.columnHeader, styles.detailsColumn]}>Detay</Text>
        </View>

        {/* Stock List or Empty State */}
        {stocks.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="package" size={60} color="#CCCCCC" />
            <Text style={styles.emptyText}>Henüz stok bulunmuyor</Text>
            <Text style={styles.emptySubText}>Ürün girişi yaparak stok oluşturabilirsiniz</Text>
          </View>
        ) : (
          <FlatList
            data={stocks}
            keyExtractor={(item) => item.urun_adi}
            renderItem={({ item }) => (
              <View style={styles.stockItem}>
                <Text style={[styles.stockText, styles.productColumn]} numberOfLines={2} ellipsizeMode="tail">{item.urun_adi}</Text>
                <Text style={[styles.stockText, styles.unitColumn]}>{item.birim}</Text>
                <Text style={[styles.stockText, styles.quantityColumn]}>{item.toplam_miktar}</Text>
                <TouchableOpacity 
                  style={styles.detailsButton}
                  onPress={() => showStockDetails(item)}
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

        {/* Stok Detayları Modal */}
        <Modal
          visible={stockDetailsVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setStockDetailsVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Stok Detayları</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setStockDetailsVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#222222" />
                </TouchableOpacity>
              </View>
              
              {/* Modal Body */}
              {selectedStock ? (
                <ScrollView style={styles.modalBody}>
                  {/* Ürün Özeti */}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Ürün Bilgileri</Text>
                    
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Ürün Adı:</Text>
                      <Text style={styles.detailValue}>{selectedStock.urun_adi}</Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Birim:</Text>
                      <Text style={styles.detailValue}>{selectedStock.birim}</Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Toplam Miktar:</Text>
                      <Text style={styles.detailValue}>{selectedStock.toplam_miktar}</Text>
                    </View>
                  </View>

                  {/* Depo Bazında Stoklar */}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Depo Bazında Stoklar</Text>
                    
                    {selectedStock.stok_detaylari.map((detail, index) => (
                      <View key={index} style={styles.warehouseStock}>
                        <View style={styles.warehouseInfo}>
                          <Text style={styles.warehouseName}>{detail.depo_adi || "Bilinmeyen Depo"}</Text>
                          <Text style={styles.warehouseStatus}>
                            {warehouses[detail.depo_id]?.aktif ? "Aktif" : "Pasif"}
                          </Text>
                        </View>
                        <View style={styles.warehouseQuantity}>
                          <Text style={styles.quantityValue}>{detail.miktar}</Text>
                          <Text style={styles.quantityUnit}>{selectedStock.birim}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
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
  columnHeaders: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#DDDDDD',
  },
  columnHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555555',
  },
  productColumn: {
    flex: 3,
  },
  unitColumn: {
    flex: 1,
    textAlign: 'center',
  },
  quantityColumn: {
    flex: 1,
    textAlign: 'center',
  },
  detailsColumn: {
    flex: 1,
    textAlign: 'center',
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
    paddingVertical: 10,
  },
  stockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  stockText: {
    fontSize: 14,
    color: '#333333',
  },
  detailsButton: {
    flex: 1,
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
  detailsLoading: {
    padding: 30,
    alignItems: 'center',
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
  warehouseStock: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  warehouseInfo: {
    flex: 2,
  },
  warehouseName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  warehouseStatus: {
    fontSize: 13,
    color: '#666',
  },
  warehouseQuantity: {
    flex: 1,
    alignItems: 'flex-end',
  },
  quantityValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E6A05F',
  },
  quantityUnit: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  }
});