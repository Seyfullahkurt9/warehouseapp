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
import { collection, doc, setDoc, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

// Company data interface
interface CompanyData {
  firma_ismi: string;
  vergi_no: string;
  telefon_no: string;
  eposta: string;
  adres: string;
  davet_kodu: string;
}

export default function CreateCompanyScreen() {
  const { userData, currentUser, updateUserData } = useAuth(); // updateUserData'ı da alın
  const [loading, setLoading] = useState(false);
  
  // Form data state
  const [formData, setFormData] = useState<CompanyData>({
    firma_ismi: '',
    vergi_no: '',
    telefon_no: '',
    eposta: '',
    adres: '',
    davet_kodu: ''
  });

  // Handle form changes
  const handleInputChange = (field: keyof CompanyData, value: string) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  // Generate unique invite code (8 digits)
  const generateUniqueInviteCode = (): string => {
    // Last 5 digits of timestamp
    const timestamp = Date.now().toString().slice(-5);
    
    // Get a character from current user's ID (if available) or use X
    const userIdChar = (currentUser?.uid || 'X').slice(-1);
    const userIdValue = userIdChar.charCodeAt(0) % 10; // 0-9 value
    
    // 2 digit random number
    const random = Math.floor(10 + Math.random() * 90).toString();
    
    // 8 digit code (5 + 1 + 2)
    return timestamp + userIdValue + random;
  };

  // Form validation
  const validateForm = () => {
    if (!formData.firma_ismi.trim()) {
      Alert.alert("Uyarı", "Firma adı zorunludur.");
      return false;
    }

    // Email validation if provided
    if (formData.eposta) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.eposta)) {
        Alert.alert("Uyarı", "Geçerli bir e-posta adresi giriniz.");
        return false;
      }
    }

    // Phone validation if provided
    if (formData.telefon_no) {
      const phoneRegex = /^[0-9]{10,11}$/;
      if (!phoneRegex.test(formData.telefon_no.replace(/\D/g, ''))) {
        Alert.alert("Uyarı", "Geçerli bir telefon numarası giriniz.");
        return false;
      }
    }

    return true;
  };

  // Save company data
  const handleSave = async () => {
    if (!validateForm()) return;
    if (!currentUser) {
      Alert.alert("Hata", "Oturum açık değil. Lütfen tekrar giriş yapın.");
      return;
    }

    setLoading(true);

    try {
      // Generate invite code
      const inviteCode = generateUniqueInviteCode();
      
      // Create company document
      const companiesRef = collection(db, "Firmalar");
      const newCompanyRef = doc(companiesRef);
      const firmaId = newCompanyRef.id;
      
      // Set company data with invite code
      await setDoc(newCompanyRef, {
        firma_ismi: formData.firma_ismi,
        vergi_no: formData.vergi_no,
        telefon_no: formData.telefon_no,
        eposta: formData.eposta,
        adres: formData.adres,
        davet_kodu: inviteCode
      });
      
      // Kullanıcı için güncellenecek bilgiler
      const userUpdates = {
        firma_id: firmaId,
        yetki_id: "admin",
        is_unvani: "Firma Yöneticisi"
      };
      
      // Kullanıcı belgesini güncelle
      const userRef = doc(db, "Kullanicilar", currentUser.uid);
      await updateDoc(userRef, userUpdates);
      
      // ÖNEMLİ: AuthContext'teki kullanıcı durumunu da güncelle
      await updateUserData({
        ...userData,
        ...userUpdates
      });
      
      // Log action
      const eylemlerRef = collection(db, "Eylemler");
      await addDoc(eylemlerRef, {
        eylem_tarihi: new Date(),
        eylem_aciklamasi: `"${formData.firma_ismi}" isimli firma oluşturuldu.`,
        kullanici_id: currentUser.uid,
        firma_id: firmaId,
        kullanici_adi: `${userData?.isim || ''} ${userData?.soyisim || ''}`.trim() || 'Bilinmeyen Kullanıcı'
      });

      // Show success message with more detailed information
      Alert.alert(
        "Başarılı", 
        `"${formData.firma_ismi}" firması başarıyla oluşturuldu.\nArtık firma yöneticisisiniz.`, 
        [{ text: "Tamam", onPress: () => router.replace('/admin-home') }] // admin-home'a yönlendir!
      );
    } catch (error) {
      console.error("Firma oluşturulurken hata:", error);
      Alert.alert("Hata", "Firma oluşturulurken bir sorun oluştu.");
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
            
            <Text style={styles.headerTitle}>Firma Oluştur</Text>
            
            <View style={styles.headerRight}>
              <Feather name="briefcase" size={20} color="#666666" />
            </View>
          </View>

          {/* Form Content */}
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Info text */}
            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>
                Oluşturacağınız firmayı yönetici olarak yönetebileceksiniz. 
                Firma bilgileri ileride güncellenebilir.
              </Text>
            </View>
            
            {/* Firma Adı */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Firma Adı*</Text>
              <TextInput
                style={styles.input}
                value={formData.firma_ismi}
                onChangeText={(text) => handleInputChange('firma_ismi', text)}
                placeholder="Firma adını giriniz"
                placeholderTextColor="#AAAAAA"
              />
            </View>

            {/* Vergi Numarası */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Vergi Numarası</Text>
              <TextInput
                style={styles.input}
                value={formData.vergi_no}
                onChangeText={(text) => handleInputChange('vergi_no', text)}
                placeholder="Vergi numarasını giriniz"
                placeholderTextColor="#AAAAAA"
                keyboardType="numeric"
              />
            </View>

            {/* Telefon */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Telefon</Text>
              <TextInput
                style={styles.input}
                value={formData.telefon_no}
                onChangeText={(text) => handleInputChange('telefon_no', text)}
                placeholder="Telefon numarasını giriniz"
                placeholderTextColor="#AAAAAA"
                keyboardType="phone-pad"
              />
            </View>

            {/* E-posta */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>E-posta</Text>
              <TextInput
                style={styles.input}
                value={formData.eposta}
                onChangeText={(text) => handleInputChange('eposta', text)}
                placeholder="E-posta adresini giriniz"
                placeholderTextColor="#AAAAAA"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Adres */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Adres</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.adres}
                onChangeText={(text) => handleInputChange('adres', text)}
                placeholder="Adres bilgilerini giriniz"
                placeholderTextColor="#AAAAAA"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
            
            {/* Role Info */}
            <View style={styles.roleInfoContainer}>
              <Feather name="info" size={18} color="#E6A05F" style={styles.infoIcon} />
              <Text style={styles.roleInfoText}>
                Firma oluşturulduğunda otomatik olarak "Firma Yöneticisi" rolünüz etkinleştirilecektir.
              </Text>
            </View>

            {/* Create Button */}
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Firmayı Oluştur</Text>
              )}
            </TouchableOpacity>
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
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333333',
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  roleInfoContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF9F2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginTop: 2,
    marginRight: 10,
  },
  roleInfoText: {
    flex: 1,
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  saveButton: {
    backgroundColor: '#E6A05F',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});