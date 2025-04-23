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
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import { collection, query, where, getDocs, orderBy, getDoc, doc, updateDoc, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

// Sipariş için tip tanımı
interface Order {
  id: string;
  musteri_id: string;
  aciklama: string;
  olusturma_tarihi: Date;
  durum: string;
  firma_id: string;
  musteri_adi?: string;
}

// Sipariş geçmişi için tip tanımı
interface OrderHistory {
  id: string;
  siparis_id: string;
  tarih: Date;
  durum: string;
  aciklama: string;
}

export default function OrdersScreen() {
  const { userData, currentUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Popup için state değişkenleri
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  
  // Filtreleme için state değişkenleri
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  
  // Status güncelleme modalı için state
  const [statusModalVisible, setStatusModalVisible] = useState(false);

  const [deletingOrder, setDeletingOrder] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        if (!userData?.firma_id) {
          setError("Kullanıcı firma bilgisi bulunamadı");
          setLoading(false);
          return;
        }

        // Kullanıcının firma_id'si ile eşleşen siparişleri getir
        const ordersRef = collection(db, "Siparisler");
        const q = query(
          ordersRef, 
          where("firma_id", "==", userData.firma_id),
          orderBy("olusturma_tarihi", "desc")
        );
        
        const querySnapshot = await getDocs(q);

        const ordersList: Order[] = [];
        const customerPromises: Array<{ orderId: string; promise: Promise<string> }> = [];
        
        // Önce siparişleri al
        querySnapshot.forEach((doc) => {
          const orderData = doc.data();
          
          // Firestore'dan gelen timestamp'i JS Date'e çevir
          const olusturma_tarihi = orderData.olusturma_tarihi?.toDate() || new Date();
          
          ordersList.push({
            id: doc.id,
            musteri_id: orderData.musteri_id,
            aciklama: orderData.aciklama,
            olusturma_tarihi: olusturma_tarihi,
            durum: orderData.durum,
            firma_id: orderData.firma_id,
          });
          
          // Müşteri bilgilerini getirmek için promise'lar hazırla
          if (orderData.musteri_id) {
            const customerPromise = getCustomerInfo(orderData.musteri_id);
            customerPromises.push({ orderId: doc.id, promise: customerPromise });
          }
        });
        
        // Müşteri bilgilerini eşleştir
        if (customerPromises.length > 0) {
          for (const { orderId, promise } of customerPromises) {
            try {
              const customerName = await promise;
              // İlgili siparişe müşteri adını ekle
              const orderIndex = ordersList.findIndex(order => order.id === orderId);
              if (orderIndex !== -1) {
                ordersList[orderIndex].musteri_adi = customerName;
              }
            } catch (err) {
              console.warn(`Müşteri bilgisi getirilemedi: ${orderId}`, err);
            }
          }
        }

        setOrders(ordersList);
        setFilteredOrders(ordersList); // Başlangıçta tüm siparişleri göster
        setLoading(false);
      } catch (error) {
        console.error("Siparişler yüklenirken hata:", error);
        
        let errorMessage = "Bilinmeyen hata";
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
        
        setError("Siparişler yüklenemedi: " + errorMessage);
        setLoading(false);
      }
    };

    fetchOrders();
  }, [userData?.firma_id]);

  // Müşteri bilgilerini getiren yardımcı fonksiyon
  const getCustomerInfo = async (customerId: string): Promise<string> => {
    try {
      // Firestore'dan müşteri bilgisini çek
      const customerRef = doc(db, "Musteriler", customerId);
      const customerSnap = await getDoc(customerRef);
      
      if (customerSnap.exists()) {
        const customerData = customerSnap.data();
        return customerData.sirket_ismi || "İsimsiz Müşteri";
      }
      return "Bilinmeyen Müşteri";
    } catch (error) {
      console.error("Müşteri bilgisi getirilirken hata:", error);
      return "Müşteri Bilgisi Yüklenemedi";
    }
  };

  // Durum rengini belirleyen yardımcı fonksiyon
  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'beklemede':
        return '#F0B252';  // Turuncu/sarı
      case 'onaylandı':
      case 'onaylandi':
        return '#52B4F0';  // Mavi
      case 'tamamlandı':
      case 'tamamlandi':
        return '#4CAF50';  // Yeşil
      case 'reddedildi':
        return '#F44336';  // Kırmızı
      default:
        return '#888888';  // Gri
    }
  };

  // Tarihi formatla: GG.AA.YYYY
  const formatDate = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  // Sipariş detaylarını yükleme fonksiyonu
  const fetchOrderDetails = async (orderId: string) => {
    setDetailsLoading(true);
    try {
      // Siparişin detaylarını getir
      const orderRef = doc(db, "Siparisler", orderId);
      const orderSnap = await getDoc(orderRef);
      
      if (orderSnap.exists()) {
        const orderData = orderSnap.data();
        
        // Sipariş geçmişini getir (varsa)
        const historyRef = collection(db, "Siparis_Gecmisi");
        const historyQuery = query(
          historyRef, 
          where("siparis_id", "==", orderId), 
          orderBy("tarih", "desc")
        );
        
        const historySnap = await getDocs(historyQuery);
        
        const historyItems: OrderHistory[] = [];
        historySnap.forEach(doc => {
          const data = doc.data();
          historyItems.push({
            id: doc.id,
            siparis_id: data.siparis_id,
            tarih: data.tarih?.toDate() || new Date(),
            durum: data.durum,
            aciklama: data.aciklama
          });
        });
        
        // Müşteri bilgilerini getir
        let customerDetails: any = null;
        if (orderData.musteri_id) {
          const customerRef = doc(db, "Musteriler", orderData.musteri_id);
          const customerSnap = await getDoc(customerRef);
          if (customerSnap.exists()) {
            customerDetails = customerSnap.data();
          }
        }
        
        setOrderDetails({
          ...orderData,
          gecmis: historyItems,
          musteri: customerDetails
        });
      } else {
        console.log("Sipariş bulunamadı!");
        setOrderDetails(null);
      }
    } catch (error) {
      console.error("Sipariş detayları yüklenirken hata:", error);
      Alert.alert("Hata", "Sipariş detayları yüklenemedi.");
      setOrderDetails(null);
    }
    setDetailsLoading(false);
  };

  // Sipariş detay modalını açan fonksiyon
  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setModalVisible(true);
    fetchOrderDetails(order.id);
  };

  // Sipariş durumunu güncelleyen fonksiyon
  const updateOrderStatus = async (newStatus: string, explanation: string = '') => {
    if (!selectedOrder) return;
    
    setStatusUpdateLoading(true);
    
    try {
      const orderRef = doc(db, "Siparisler", selectedOrder.id);
      
      // Sipariş durumunu güncelle
      await updateDoc(orderRef, {
        durum: newStatus
      });
      
      // Sipariş geçmişine ekle
      const historyRef = collection(db, "Siparis_Gecmisi");
      await addDoc(historyRef, {
        siparis_id: selectedOrder.id,
        tarih: new Date(),
        durum: newStatus,
        aciklama: explanation || `Sipariş durumu "${selectedOrder.durum}" durumundan "${newStatus}" durumuna güncellendi.`
      });
      
      // Eylemler koleksiyonuna ekle
      const eylemlerRef = collection(db, "Eylemler");
      await addDoc(eylemlerRef, {
        eylem_tarihi: new Date(),
        eylem_aciklamasi: `Sipariş durumu "${selectedOrder.durum}" durumundan "${newStatus}" durumuna güncellendi.`,
        kullanici_id: currentUser?.uid || '',
        kullanici_adi: userData?.isim + ' ' + userData?.soyisim || 'Bilinmeyen Kullanıcı',
        firma_id: userData?.firma_id || '',
        islem_turu: 'siparis_guncelleme',
        ilgili_belge_id: selectedOrder.id
      });
      
      // Güncel sipariş detaylarını tekrar yükle
      Alert.alert("Başarılı", "Sipariş durumu güncellendi.");
      
      // Seçili siparişin durum bilgisini de güncelle
      setSelectedOrder({
        ...selectedOrder,
        durum: newStatus
      });
      
      // Sipariş listesini güncelle
      const updatedOrders = orders.map(order => 
        order.id === selectedOrder.id ? {...order, durum: newStatus} : order
      );
      setOrders(updatedOrders);
      
      // Filtrelenmiş siparişleri de güncelle
      const updatedFilteredOrders = filteredOrders.map(order => 
        order.id === selectedOrder.id ? {...order, durum: newStatus} : order
      );
      setFilteredOrders(updatedFilteredOrders);
      
      // Sipariş detaylarını yeniden yükle
      fetchOrderDetails(selectedOrder.id);
      setStatusModalVisible(false);
      
    } catch (error) {
      console.error("Sipariş durumu güncellenirken hata:", error);
      Alert.alert("Hata", "Sipariş durumu güncellenirken bir sorun oluştu.");
    }
    
    setStatusUpdateLoading(false);
  };

  // Sipariş silme fonksiyonu
  const handleDeleteOrder = async () => {
    if (!selectedOrder) return;
    
    setDeletingOrder(true);
    
    try {
      // Önce sipariş geçmişine silinme kaydı ekle
      const historyRef = collection(db, "Siparis_Gecmisi");
      await addDoc(historyRef, {
        siparis_id: selectedOrder.id,
        tarih: new Date(),
        durum: "Silindi",
        aciklama: `Sipariş "${userData?.isim} ${userData?.soyisim}" tarafından silindi.`
      });
      
      // Eylemler koleksiyonuna ekle
      const eylemlerRef = collection(db, "Eylemler");
      await addDoc(eylemlerRef, {
        eylem_tarihi: new Date(),
        eylem_aciklamasi: `"${selectedOrder.musteri_adi || 'Bilinmeyen Müşteri'}" müşterisine ait sipariş silindi.`,
        kullanici_id: currentUser?.uid || '',
        kullanici_adi: userData?.isim + ' ' + userData?.soyisim || 'Bilinmeyen Kullanıcı',
        firma_id: userData?.firma_id || '',
        islem_turu: 'siparis_silme',
        ilgili_belge_id: selectedOrder.id
      });
      
      // Siparişi sil
      const orderRef = doc(db, "Siparisler", selectedOrder.id);
      await deleteDoc(orderRef);
      
      // Sipariş listesinden kaldır
      const updatedOrders = orders.filter(order => order.id !== selectedOrder.id);
      setOrders(updatedOrders);
      setFilteredOrders(filteredOrders.filter(order => order.id !== selectedOrder.id));
      
      setDeleteConfirmVisible(false);
      setModalVisible(false);
      Alert.alert("Başarılı", "Sipariş başarıyla silindi.");
      
    } catch (error) {
      console.error("Sipariş silinirken hata:", error);
      Alert.alert("Hata", "Sipariş silinirken bir sorun oluştu.");
    }
    
    setDeletingOrder(false);
  };

  // Filtreleme işlevini uygula
  const applyFilter = (status: string | null) => {
    setActiveFilter(status);
    
    if (status === null) {
      // Filtre yok, tüm siparişleri göster
      setFilteredOrders(orders);
    } else {
      // Duruma göre filtrele
      const filtered = orders.filter(order => 
        order.durum.toLowerCase() === status.toLowerCase()
      );
      setFilteredOrders(filtered);
    }
    
    setFilterModalVisible(false);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#E6A05F" />
        <Text style={styles.loadingText}>Siparişler yükleniyor...</Text>
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
            <Text style={styles.screenTitle}>Siparişler</Text>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => setFilterModalVisible(true)}
            >
              <Feather name="filter" size={22} color="#666666" />
              {activeFilter && <View style={styles.filterDot} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Aktif Filtre Gösterimi */}
        {activeFilter && (
          <TouchableOpacity 
            style={styles.activeFilterContainer}
            onPress={() => applyFilter(null)}
          >
            <Text style={styles.activeFilterText}>
              Filtre: {activeFilter}
            </Text>
            <Feather name="x" size={16} color="#666666" />
          </TouchableOpacity>
        )}

        {/* Column Headers */}
        <View style={styles.columnHeaders}>
          <Text style={[styles.columnHeader, { flex: 0.8 }]}>Tarih</Text>
          <Text style={[styles.columnHeader, { flex: 1.5 }]}>Müşteri</Text>
          <Text style={[styles.columnHeader, { flex: 1.2 }]}>Açıklama</Text>
          <Text style={[styles.columnHeader, { flex: 0.8 }]}>Durum</Text>
        </View>

        {filteredOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="shopping-cart" size={40} color="#CCCCCC" />
            <Text style={styles.emptyText}>
              {activeFilter 
                ? `"${activeFilter}" durumunda sipariş bulunmuyor` 
                : "Henüz sipariş bulunmuyor"}
            </Text>
            <Text style={styles.emptySubText}>
              {activeFilter 
                ? "Filtreyi kaldırarak tüm siparişleri görebilirsiniz" 
                : "Sipariş oluşturmak için aşağıdaki butonu kullanabilirsiniz"}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredOrders}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.orderItem}
                onPress={() => openOrderDetails(item)}
              >
                <Text style={[styles.orderText, { flex: 0.8 }]}>{formatDate(item.olusturma_tarihi)}</Text>
                <Text style={[styles.orderText, { flex: 1.5 }]} numberOfLines={1}>{item.musteri_adi || 'Belirsiz'}</Text>
                <Text style={[styles.orderText, { flex: 1.2 }]} numberOfLines={1}>{item.aciklama}</Text>
                <View style={[styles.statusContainer, { flex: 0.8 }]}>
                  <Text 
                    style={[
                      styles.statusText, 
                      { backgroundColor: getStatusColor(item.durum) }
                    ]}
                  >
                    {item.durum}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={[
              styles.listContainer,
              filteredOrders.length === 0 && styles.emptyListContainer
            ]}
          />
        )}

        {/* Sipariş Detayları Modal */}
        <Modal
          visible={modalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Sipariş Detayları</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#222222" />
                </TouchableOpacity>
              </View>
              
              {/* Modal Body */}
              {detailsLoading ? (
                <View style={styles.detailsLoading}>
                  <ActivityIndicator size="large" color="#E6A05F" />
                  <Text style={styles.loadingText}>Detaylar yükleniyor...</Text>
                </View>
              ) : orderDetails ? (
                <ScrollView style={styles.modalBody}>
                  {/* Sipariş Özeti */}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Sipariş Bilgileri</Text>
                    
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Sipariş ID:</Text>
                      <Text style={styles.detailValue}>{selectedOrder?.id}</Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Tarih:</Text>
                      <Text style={styles.detailValue}>
                        {selectedOrder?.olusturma_tarihi ? formatDate(selectedOrder.olusturma_tarihi) : '-'}
                      </Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Durum:</Text>
                      <View style={styles.statusBadge}>
                        <Text 
                          style={[
                            styles.statusBadgeText, 
                            { backgroundColor: getStatusColor(selectedOrder?.durum || '') }
                          ]}
                        >
                          {selectedOrder?.durum}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Açıklama:</Text>
                      <Text style={styles.detailValue}>{selectedOrder?.aciklama || '-'}</Text>
                    </View>
                    
                    {/* Durumu güncelleme butonu */}
                    <TouchableOpacity
                      style={styles.updateStatusButton}
                      onPress={() => setStatusModalVisible(true)}
                    >
                      <Text style={styles.updateStatusButtonText}>Sipariş Durumunu Güncelle</Text>
                    </TouchableOpacity>
                    
                    {/* Silme butonu - Sadece admin için göster */}
                    {userData?.yetki_id === "admin" && (
                      <TouchableOpacity
                        style={styles.deleteOrderButton}
                        onPress={() => setDeleteConfirmVisible(true)}
                      >
                        <Text style={styles.deleteOrderButtonText}>Siparişi Sil</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Müşteri Bilgileri */}
                  {orderDetails.musteri && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>Müşteri Bilgileri</Text>
                      
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Firma:</Text>
                        <Text style={styles.detailValue}>{orderDetails.musteri.sirket_ismi}</Text>
                      </View>
                      
                      {orderDetails.musteri.telefon && (
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Telefon:</Text>
                          <Text style={styles.detailValue}>{orderDetails.musteri.telefon}</Text>
                        </View>
                      )}
                      
                      {orderDetails.musteri.eposta && (
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>E-posta:</Text>
                          <Text style={styles.detailValue}>{orderDetails.musteri.eposta}</Text>
                        </View>
                      )}
                    </View>
                  )}
                  
                  {/* Sipariş Geçmişi */}
                  {orderDetails.gecmis && orderDetails.gecmis.length > 0 && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>Sipariş Geçmişi</Text>
                      
                      {orderDetails.gecmis.map((item: OrderHistory, index: number) => (
                        <View key={item.id || index} style={styles.historyItem}>
                          <View style={styles.historyHeader}>
                            <Text style={styles.historyDate}>
                              {formatDate(item.tarih)}
                            </Text>
                            <View style={styles.statusBadge}>
                              <Text 
                                style={[
                                  styles.statusBadgeText, 
                                  { backgroundColor: getStatusColor(item.durum) }
                                ]}
                              >
                                {item.durum}
                              </Text>
                            </View>
                          </View>
                          
                          {item.aciklama && (
                            <Text style={styles.historyNote}>{item.aciklama}</Text>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                </ScrollView>
              ) : (
                <View style={styles.detailsError}>
                  <Feather name="alert-circle" size={50} color="#FF6B6B" />
                  <Text style={styles.errorText}>Sipariş detayları yüklenemedi.</Text>
                </View>
              )}
            </View>
          </View>
        </Modal>

        {/* Durum Güncelleme Modalı */}
        <Modal
          visible={statusModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setStatusModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, styles.statusModalContent]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Sipariş Durumunu Güncelle</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setStatusModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#222222" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.statusOptions}>
                <TouchableOpacity 
                  style={styles.statusOption}
                  onPress={() => updateOrderStatus('Beklemede')}
                  disabled={statusUpdateLoading}
                >
                  <View style={[styles.statusIconContainer, { backgroundColor: '#F0B252' }]}>
                    <MaterialIcons name="hourglass-empty" size={24} color="#FFFFFF" />
                  </View>
                  <Text style={styles.statusOptionText}>Beklemede</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.statusOption}
                  onPress={() => updateOrderStatus('Onaylandı')}
                  disabled={statusUpdateLoading}
                >
                  <View style={[styles.statusIconContainer, { backgroundColor: '#52B4F0' }]}>
                    <Feather name="check" size={24} color="#FFFFFF" />
                  </View>
                  <Text style={styles.statusOptionText}>Onaylandı</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.statusOption}
                  onPress={() => updateOrderStatus('Tamamlandı')}
                  disabled={statusUpdateLoading}
                >
                  <View style={[styles.statusIconContainer, { backgroundColor: '#4CAF50' }]}>
                    <Feather name="check-circle" size={24} color="#FFFFFF" />
                  </View>
                  <Text style={styles.statusOptionText}>Tamamlandı</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.statusOption}
                  onPress={() => updateOrderStatus('Reddedildi')}
                  disabled={statusUpdateLoading}
                >
                  <View style={[styles.statusIconContainer, { backgroundColor: '#F44336' }]}>
                    <Feather name="x" size={24} color="#FFFFFF" />
                  </View>
                  <Text style={styles.statusOptionText}>Reddedildi</Text>
                </TouchableOpacity>
              </View>
              
              {statusUpdateLoading && (
                <ActivityIndicator size="large" color="#E6A05F" style={styles.statusUpdateLoading} />
              )}
            </View>
          </View>
        </Modal>

        {/* Silme Onay Modalı */}
        <Modal
          visible={deleteConfirmVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setDeleteConfirmVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.confirmModalContent}>
              <View style={styles.confirmModalHeader}>
                <Text style={styles.confirmModalTitle}>Siparişi Sil</Text>
              </View>
              
              <View style={styles.confirmModalBody}>
                <Text style={styles.confirmText}>
                  Bu siparişi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                </Text>
                
                <View style={styles.confirmButtons}>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => setDeleteConfirmVisible(false)}
                    disabled={deletingOrder}
                  >
                    <Text style={styles.cancelButtonText}>İptal</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.confirmDeleteButton}
                    onPress={handleDeleteOrder}
                    disabled={deletingOrder}
                  >
                    {deletingOrder ? (
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

        {/* Filtre Modalı */}
        <Modal
          visible={filterModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setFilterModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, styles.filterModalContent]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Sipariş Filtrele</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setFilterModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#222222" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.filterOptions}>
                <TouchableOpacity 
                  style={[styles.filterOption, activeFilter === null && styles.activeFilterOption]}
                  onPress={() => applyFilter(null)}
                >
                  <Text style={styles.filterOptionText}>Tüm Siparişler</Text>
                  {activeFilter === null && <Feather name="check" size={20} color="#E6A05F" />}
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.filterOption, activeFilter === 'Beklemede' && styles.activeFilterOption]}
                  onPress={() => applyFilter('Beklemede')}
                >
                  <View style={styles.filterOptionInner}>
                    <View style={[styles.statusDot, { backgroundColor: '#F0B252' }]} />
                    <Text style={styles.filterOptionText}>Beklemede</Text>
                  </View>
                  {activeFilter === 'Beklemede' && <Feather name="check" size={20} color="#E6A05F" />}
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.filterOption, activeFilter === 'Onaylandı' && styles.activeFilterOption]}
                  onPress={() => applyFilter('Onaylandı')}
                >
                  <View style={styles.filterOptionInner}>
                    <View style={[styles.statusDot, { backgroundColor: '#52B4F0' }]} />
                    <Text style={styles.filterOptionText}>Onaylandı</Text>
                  </View>
                  {activeFilter === 'Onaylandı' && <Feather name="check" size={20} color="#E6A05F" />}
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.filterOption, activeFilter === 'Tamamlandı' && styles.activeFilterOption]}
                  onPress={() => applyFilter('Tamamlandı')}
                >
                  <View style={styles.filterOptionInner}>
                    <View style={[styles.statusDot, { backgroundColor: '#4CAF50' }]} />
                    <Text style={styles.filterOptionText}>Tamamlandı</Text>
                  </View>
                  {activeFilter === 'Tamamlandı' && <Feather name="check" size={20} color="#E6A05F" />}
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.filterOption, activeFilter === 'Reddedildi' && styles.activeFilterOption]}
                  onPress={() => applyFilter('Reddedildi')}
                >
                  <View style={styles.filterOptionInner}>
                    <View style={[styles.statusDot, { backgroundColor: '#F44336' }]} />
                    <Text style={styles.filterOptionText}>Reddedildi</Text>
                  </View>
                  {activeFilter === 'Reddedildi' && <Feather name="check" size={20} color="#E6A05F" />}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Floating Action Button */}
        <TouchableOpacity 
          style={styles.fab}
          onPress={() => router.push('/create-order')}
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerTop: {
    marginBottom: 10,
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
  iconButton: {
    padding: 5,
    position: 'relative',
  },
  // Aktif filtre gösterimi
  activeFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF9F2',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    padding: 10,
    borderRadius: 6,
  },
  activeFilterText: {
    fontSize: 14,
    color: '#E6A05F',
    fontWeight: '500',
  },
  // Filtre nokta göstergesi
  filterDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E6A05F',
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
    fontSize: 13,
    color: '#888888',
    fontWeight: '500',
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
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 80,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'center',
  },
  orderText: {
    fontSize: 14,
    color: '#333333',
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    textAlign: 'center',
    overflow: 'hidden',
  },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 16,
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
  
  // Modal styles
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
    maxHeight: '80%',
  },
  detailsLoading: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsError: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailSection: {
    marginBottom: 24,
    backgroundColor: '#F8F8F8',
    padding: 16,
    borderRadius: 8,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222222',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666666',
    width: 100,
  },
  detailValue: {
    fontSize: 14,
    color: '#222222',
    flex: 1,
  },
  statusBadge: {
    marginBottom: 4,
  },
  statusBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  historyItem: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyDate: {
    fontSize: 13,
    color: '#666666',
  },
  historyNote: {
    fontSize: 14,
    color: '#222222',
  },
  // Durum güncelleme butonu
  updateStatusButton: {
    backgroundColor: '#E6A05F',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateStatusButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Silme butonu stilleri
  deleteOrderButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteOrderButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Durum modal içeriği
  statusModalContent: {
    height: 'auto',
    paddingBottom: 20,
  },
  statusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    padding: 20,
  },
  statusOption: {
    width: '45%',
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  statusIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusOptionText: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
    marginTop: 6,
  },
  statusUpdateLoading: {
    marginTop: 10,
    marginBottom: 10,
  },
  // Filtre modal içeriği
  filterModalContent: {
    height: 'auto',
  },
  filterOptions: {
    padding: 16,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  activeFilterOption: {
    backgroundColor: '#FFF9F2',
  },
  filterOptionInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  filterOptionText: {
    fontSize: 16,
    color: '#333333',
  },
  // Onay modalı stilleri
  confirmModalContent: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    maxWidth: 400,
  },
  confirmModalHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    alignItems: 'center',
  },
  confirmModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222222',
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
    backgroundColor: '#EEEEEE',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmDeleteButton: {
    flex: 1,
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  confirmDeleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
