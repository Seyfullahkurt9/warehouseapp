import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { Picker } from '@react-native-picker/picker';

interface FirmaData {
  id: string;
  firma_ismi: string;
  vergi_no?: string;
  telefon_no?: string;
  eposta?: string;
  adres?: string;
  davet_kodu: string;
}

export default function JoinCompanyScreen() {
  const { userData, currentUser, updateUserData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  
  // Form states
  const [inviteCode, setInviteCode] = useState('');
  const [position, setPosition] = useState('depo_gorevlisi');
  
  // Verification states
  const [verifiedCompany, setVerifiedCompany] = useState<FirmaData | null>(null);
  const [codeVerified, setCodeVerified] = useState(false);
  
  // Position options
  const positionOptions = [
    { label: 'Depo Görevlisi', value: 'depo_gorevlisi' },
    { label: 'Depo Sorumlusu', value: 'depo_sorumlusu' },
    { label: 'Depo Yöneticisi', value: 'depo_yoneticisi' }
  ];

  // Davet kodunu doğrulama
  const verifyInviteCode = async () => {
    if (!inviteCode.trim()) {
      Alert.alert("Uyarı", "Lütfen bir davet kodu girin.");
      return;
    }
    
    setVerifying(true);
    
    try {
      // Davet kodunun geçerli olup olmadığını kontrol et
      const firmalarRef = collection(db, "Firmalar");
      const q = query(firmalarRef, where("davet_kodu", "==", inviteCode.trim()));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        Alert.alert("Hata", "Geçersiz davet kodu. Lütfen doğru kodu girdiğinizden emin olun.");
        setVerifying(false);
        return;
      }
      
      // Doğrulanmış firma bilgilerini al
      const firmaDoc = querySnapshot.docs[0];
      const firmaData = firmaDoc.data();
      
      setVerifiedCompany({
        id: firmaDoc.id,
        firma_ismi: firmaData.firma_ismi,
        vergi_no: firmaData.vergi_no,
        telefon_no: firmaData.telefon_no,
        eposta: firmaData.eposta,
        adres: firmaData.adres,
        davet_kodu: firmaData.davet_kodu
      });
      
      setCodeVerified(true);
      setVerifying(false);
      
    } catch (error) {
      console.error("Davet kodu doğrulanırken hata:", error);
      Alert.alert("Hata", "Davet kodu doğrulanırken bir sorun oluştu.");
      setVerifying(false);
    }
  };
  
  // Yeni davet kodu üretme (orijinal algoritma)
  const generateUniqueInviteCode = (): string => {
    // Son 5 haneli timestamp
    const timestamp = Date.now().toString().slice(-5);
    
    // Firma ID'sinin son 1 karakteri
    const firmaIdChar = (verifiedCompany?.id || 'X').slice(-1);
    const firmaIdValue = firmaIdChar.charCodeAt(0) % 10; // 0-9 arası değer
    
    // 2 haneli rastgele sayı
    const random = Math.floor(10 + Math.random() * 90).toString();
    
    // 8 haneli kod (5 + 1 + 2)
    return timestamp + firmaIdValue + random;
  };
  
  // Firmaya katılma
  const handleJoinCompany = async () => {
    if (!verifiedCompany || !currentUser) {
      Alert.alert("Hata", "Firma bilgileri veya kullanıcı bilgileri eksik.");
      return;
    }
    
    setLoading(true);
    
    try {
      // Seçilen pozisyona göre iş unvanı belirleme
      let isUnvani = "";
      switch (position) {
        case 'depo_yoneticisi':
          isUnvani = "Depo Yöneticisi";
          break;
        case 'depo_sorumlusu':
          isUnvani = "Depo Sorumlusu";
          break;
        case 'depo_gorevlisi':
        default:
          isUnvani = "Depo Görevlisi";
          break;
      }
      
      // Kullanıcı bilgilerini güncelle
      const userRef = doc(db, "Kullanicilar", currentUser.uid);
      const userSnap = await getDoc(userRef);
      const currentUserData = userSnap.data();

      const userUpdates = {
        // Mevcut bilgileri koru
        isim: currentUserData?.isim || userData?.isim || "",
        soyisim: currentUserData?.soyisim || userData?.soyisim || "",
        telefon: currentUserData?.telefon || userData?.telefon || "",
        eposta: currentUserData?.eposta || userData?.eposta || "",
        // Yeni bilgileri ekle
        firma_id: verifiedCompany.id,
        yetki_id: "kullanici",
        is_unvani: isUnvani
      };
      
      // Firestore'da kullanıcıyı güncelle
      await updateDoc(userRef, userUpdates);
      
      // Context'te kullanıcı bilgilerini güncelle (şimdi tüm bilgiler tam)
      await updateUserData({
        ...userData,
        ...userUpdates
      });
      
      // Yeni davet kodu oluştur ve firma bilgilerini güncelle
      const newInviteCode = generateUniqueInviteCode();
      const firmaRef = doc(db, "Firmalar", verifiedCompany.id);
      await updateDoc(firmaRef, {
        davet_kodu: newInviteCode
      });
      
      // Eylemler tablosuna kayıt ekle
      const eylemlerRef = collection(db, "Eylemler");
      const eylemDoc = {
        eylem_tarihi: new Date(),
        eylem_aciklamasi: `${userData?.isim || ''} ${userData?.soyisim || ''} "${verifiedCompany.firma_ismi}" firmasına ${isUnvani} olarak katıldı.`,
        kullanici_id: currentUser.uid,
        kullanici_adi: `${userData?.isim || ''} ${userData?.soyisim || ''}`.trim() || 'Bilinmeyen Kullanıcı',
        firma_id: verifiedCompany.id,
        islem_turu: 'firmaya_katilim'
      };
      
      // Firestore'a eylem kaydını ekle
      await addDoc(collection(db, "Eylemler"), eylemDoc);
      
      // Başarılı mesajı göster ve yönlendir
      Alert.alert(
        "Başarılı",
        `"${verifiedCompany.firma_ismi}" firmasına başarıyla katıldınız.`,
        [{ 
          text: "Tamam", 
          onPress: () => {
            // Ana sayfaya yönlendir (AuthWrapper uygun sayfaya yönlendirecek)
            router.replace('/home');
          }
        }]
      );
    } catch (error) {
      console.error("Firmaya katılırken hata:", error);
      Alert.alert("Hata", "Firmaya katılırken bir sorun oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#222222" />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>Firmaya Katıl</Text>
            
            <View style={styles.headerRight}>
              <Feather name="users" size={20} color="#666666" />
            </View>
          </View>

          {/* Form Content */}
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Info Text */}
            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>
                Bir firmaya katılmak için, firma yöneticisinden aldığınız 8 haneli davet kodunu girin.
                Kod doğrulandıktan sonra, firmadaki pozisyonunuzu seçebilirsiniz.
              </Text>
            </View>
            
            {!codeVerified ? (
              // Davet Kodu Giriş Formu
              <View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Davet Kodu*</Text>
                  <View style={styles.codeInputContainer}>
                    <TextInput
                      style={styles.codeInput}
                      value={inviteCode}
                      onChangeText={setInviteCode}
                      placeholder="8 haneli davet kodunu girin"
                      placeholderTextColor="#AAAAAA"
                      maxLength={8}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={styles.verifyButton}
                  onPress={verifyInviteCode}
                  disabled={verifying || !inviteCode.trim()}
                >
                  {verifying ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.verifyButtonText}>Kodu Doğrula</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              // Firma Bilgileri ve Pozisyon Seçimi
              <View>
                {/* Firma Bilgileri */}
                <View style={styles.companyInfoCard}>
                  <Text style={styles.companyCardTitle}>Firma Bilgileri</Text>
                  
                  <View style={styles.companyInfoRow}>
                    <Text style={styles.companyInfoLabel}>Firma Adı:</Text>
                    <Text style={styles.companyInfoValue}>
                      {verifiedCompany?.firma_ismi}
                    </Text>
                  </View>
                  
                  {verifiedCompany?.vergi_no && (
                    <View style={styles.companyInfoRow}>
                      <Text style={styles.companyInfoLabel}>Vergi No:</Text>
                      <Text style={styles.companyInfoValue}>
                        {verifiedCompany.vergi_no}
                      </Text>
                    </View>
                  )}
                </View>
                
                {/* Pozisyon Seçimi */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Pozisyonunuzu Seçin*</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={position}
                      onValueChange={(itemValue) => setPosition(itemValue)}
                      style={styles.picker}
                    >
                      {positionOptions.map(option => (
                        <Picker.Item 
                          key={option.value} 
                          label={option.label} 
                          value={option.value} 
                        />
                      ))}
                    </Picker>
                  </View>
                </View>
                
                {/* Katılım Butonları */}
                <View style={styles.actionButtonsContainer}>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => {
                      setCodeVerified(false);
                      setVerifiedCompany(null);
                      setInviteCode('');
                    }}
                  >
                    <Text style={styles.cancelButtonText}>İptal</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.joinButton}
                    onPress={handleJoinCompany}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.joinButtonText}>Firmaya Katıl</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  keyboardAvoidingView: {
    flex: 1,
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
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222222',
    flex: 1,
    textAlign: 'center',
    marginRight: 30,
  },
  headerRight: {
    width: 30,
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  infoContainer: {
    backgroundColor: '#FFF9F2',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    color: '#333333',
    marginBottom: 8,
    fontWeight: '500',
  },
  codeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 20,
    color: '#333333',
    letterSpacing: 2,
    textAlign: 'center',
    fontWeight: '600',
  },
  verifyButton: {
    backgroundColor: '#4A6FA5',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  companyInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  companyCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  companyInfoRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  companyInfoLabel: {
    fontSize: 14,
    color: '#666666',
    width: 85,
  },
  companyInfoValue: {
    fontSize: 14,
    color: '#333333',
    flex: 1,
    fontWeight: '500',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#EEEEEE',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  joinButton: {
    flex: 2,
    backgroundColor: '#4A6FA5',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});