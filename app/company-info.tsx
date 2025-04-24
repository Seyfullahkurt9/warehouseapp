import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Alert,
  Clipboard
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

// Firma için tip tanımı - davet_kodu eklendi
interface CompanyData {
  firma_ismi: string;
  vergi_no: string;
  telefon_no: string;
  eposta: string;
  adres: string;
  davet_kodu?: string;
}

export default function CompanyInfoScreen() {
  const { userData } = useAuth();
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshingCode, setRefreshingCode] = useState(false);

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        if (!userData?.firma_id) {
          setError("Kullanıcı firma bilgisi bulunamadı.");
          setLoading(false);
          return;
        }

        // Firestore'dan firma bilgilerini getir
        const companyRef = doc(db, "Firmalar", userData.firma_id);
        const companySnapshot = await getDoc(companyRef);

        if (companySnapshot.exists()) {
          const data = companySnapshot.data() as CompanyData;
          
          // Eğer davet kodu yoksa, otomatik olarak oluştur
          if (!data.davet_kodu) {
            const newCode = await generateUniqueInviteCode();
            await updateDoc(companyRef, { davet_kodu: newCode });
            data.davet_kodu = newCode;
          }
          
          setCompanyData(data);
        } else {
          setError("Firma bilgileri bulunamadı.");
        }
      } catch (error) {
        console.error("Firma bilgileri yüklenirken hata:", error);
        
        let errorMessage = "Bilinmeyen hata";
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
        
        setError("Firma bilgileri yüklenemedi: " + errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyData();
  }, [userData?.firma_id]);

  // 8 haneli benzersiz davet kodu oluşturma
  const generateUniqueInviteCode = (): string => {
    // Son 5 haneli timestamp (saniyeler)
    const timestamp = Date.now().toString().slice(-5);
    
    // Firma ID'sinin son 1 karakteri (varsa)
    const firmaIdChar = (userData?.firma_id || 'X').slice(-1);
    const firmaIdValue = firmaIdChar.charCodeAt(0) % 10; // 0-9 arası bir değer
    
    // 2 haneli rastgele sayı
    const random = Math.floor(10 + Math.random() * 90).toString();
    
    // 8 haneli kod (5 + 1 + 2)
    return timestamp + firmaIdValue + random;
  };

  // Davet kodunu yenileme
  const refreshInviteCode = async () => {
    if (!userData?.firma_id || !companyData) return;
    
    try {
      setRefreshingCode(true);
      
      const newCode = await generateUniqueInviteCode();
      const companyRef = doc(db, "Firmalar", userData.firma_id);
      await updateDoc(companyRef, { davet_kodu: newCode });
      
      // UI'ı güncelle
      setCompanyData({
        ...companyData,
        davet_kodu: newCode
      });
      
      Alert.alert("Başarılı", "Davet kodu başarıyla yenilendi.");
    } catch (error) {
      console.error("Davet kodu yenilenirken hata:", error);
      Alert.alert("Hata", "Davet kodu yenilenirken bir sorun oluştu.");
    } finally {
      setRefreshingCode(false);
    }
  };

  // Davet kodunu panoya kopyalama
  const copyInviteCode = () => {
    if (!companyData?.davet_kodu) return;
    
    Clipboard.setString(companyData.davet_kodu);
    Alert.alert("Kopyalandı", "Davet kodu panoya kopyalandı.");
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#E6A05F" />
        <Text style={styles.loadingText}>Firma bilgileri yükleniyor...</Text>
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
          
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerMainTitle}>TRACKIT</Text>
            <Text style={styles.headerSubTitle}>Firma Bilgileri</Text>
          </View>
          
          <View style={styles.headerRight}>
            <MaterialIcons name="business" size={24} color="#666666" />
          </View>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {companyData && (
            <View style={styles.companyCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.companyName}>{companyData.firma_ismi}</Text>
                <View style={styles.companyBadge}>
                  <Text style={styles.companyBadgeText}>Aktif</Text>
                </View>
              </View>

              {/* Davet Kodu Bölümü */}
              <View style={styles.cardSection}>
                <Text style={styles.sectionTitle}>Davet Kodu</Text>
                <View style={styles.inviteCodeContainer}>
                  <Text style={styles.inviteCodeText}>
                    {companyData.davet_kodu || 'Davet kodu yok'}
                  </Text>
                  <View style={styles.inviteCodeActions}>
                    <TouchableOpacity 
                      style={styles.inviteCodeButton}
                      onPress={copyInviteCode}
                    >
                      <Feather name="copy" size={20} color="#FFFFFF" />
                      <Text style={styles.inviteCodeButtonText}>Kopyala</Text>
                    </TouchableOpacity>
                    
                    {userData?.yetki_id === "admin" && (
                      <TouchableOpacity 
                        style={[styles.inviteCodeButton, styles.refreshButton]}
                        onPress={refreshInviteCode}
                        disabled={refreshingCode}
                      >
                        {refreshingCode ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <Feather name="refresh-cw" size={20} color="#FFFFFF" />
                            <Text style={styles.inviteCodeButtonText}>Yenile</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>

              <View style={styles.cardSection}>
                <Text style={styles.sectionTitle}>Vergi Bilgileri</Text>
                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <Feather name="file-text" size={20} color="#666666" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Vergi Numarası</Text>
                    <Text style={styles.infoValue}>{companyData.vergi_no || 'Belirtilmemiş'}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.cardSection}>
                <Text style={styles.sectionTitle}>İletişim</Text>
                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <Feather name="phone" size={20} color="#666666" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Telefon</Text>
                    <Text style={styles.infoValue}>{companyData.telefon_no || 'Belirtilmemiş'}</Text>
                  </View>
                </View>
                
                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <Feather name="mail" size={20} color="#666666" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>E-posta</Text>
                    <Text style={styles.infoValue}>{companyData.eposta || 'Belirtilmemiş'}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.cardSection}>
                <Text style={styles.sectionTitle}>Adres Bilgileri</Text>
                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <Feather name="map-pin" size={20} color="#666666" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Adres</Text>
                    <Text style={styles.addressValue}>{companyData.adres || 'Belirtilmemiş'}</Text>
                  </View>
                </View>
              </View>

              {/* Edit Button - Only show for admin users */}
              {userData?.yetki_id === "admin" && (
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={() => router.push('/edit-company-info')}
                >
                  <Text style={styles.editButtonText}>Firma Bilgilerini Düzenle</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  companyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
  },
  companyBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 50,
  },
  companyBadgeText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  cardSection: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E6A05F',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    color: '#333333',
    fontWeight: '500',
  },
  addressValue: {
    fontSize: 15,
    color: '#333333',
    lineHeight: 22,
  },
  editButton: {
    backgroundColor: '#E6A05F',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Davet kodu için yeni stiller
  inviteCodeContainer: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 16,
  },
  inviteCodeText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 2,
    color: '#333333',
    marginBottom: 16,
  },
  inviteCodeActions: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  inviteCodeButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  refreshButton: {
    backgroundColor: '#E6A05F',
  },
  inviteCodeButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 8,
  }
});