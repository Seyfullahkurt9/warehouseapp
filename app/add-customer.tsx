import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar, 
  TextInput, 
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

// Müşteri için tip tanımı
interface CustomerData {
  sirket_ismi: string;
  adres: string;
  telefon: string;
  eposta: string;
  firma_id: string;
}

export default function AddCustomerScreen() {
  const { userData, currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [customerData, setCustomerData] = useState<CustomerData>({
    sirket_ismi: '',
    adres: '',
    telefon: '',
    eposta: '',
    firma_id: userData?.firma_id || '',
  });

  const handleChange = (field: keyof CustomerData, value: string) => {
    setCustomerData({
      ...customerData,
      [field]: value
    });
  };

  const validateForm = () => {
    if (!customerData.sirket_ismi.trim()) {
      Alert.alert("Uyarı", "Firma unvanı zorunludur.");
      return false;
    }
    
    if (customerData.eposta) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customerData.eposta)) {
        Alert.alert("Uyarı", "Geçerli bir e-posta adresi giriniz.");
        return false;
      }
    }
    
    return true;
  };

  // Başarı alert'i yerine yeni oluşturduğumuz sayfaya yönlendir
  const handleAddCustomer = async () => {
    if (!validateForm()) return;
    
    if (!userData?.firma_id) {
      Alert.alert("Hata", "Müşteri eklemek için bir firmaya bağlı olmalısınız.");
      return;
    }
    
    setLoading(true);
    
    try {
      const musterilerRef = collection(db, "Musteriler");
      
      const newCustomer = {
        sirket_ismi: customerData.sirket_ismi,
        adres: customerData.adres,
        telefon: customerData.telefon,
        eposta: customerData.eposta,
        firma_id: userData.firma_id,
        ekleyen_kullanici: userData?.isim + ' ' + userData?.soyisim || 'Bilinmeyen Kullanıcı',
        ekleyen_kullanici_id: currentUser?.uid || '',
        eklenme_tarihi: new Date()
      };
      
      try {
        const docRef = await addDoc(musterilerRef, newCustomer);
        console.log("Müşteri eklendi, ID:", docRef.id);
        
        // Eylemler tablosuna kayıt ekle
        const eylemlerRef = collection(db, "Eylemler");
        await addDoc(eylemlerRef, {
          eylem_tarihi: new Date(),
          eylem_aciklamasi: `"${customerData.sirket_ismi}" isimli müşteri eklendi.`,
          kullanici_id: currentUser?.uid || '',
          firma_id: userData.firma_id,
          islem_turu: 'musteri_ekleme',
          ilgili_belge_id: docRef.id,
          kullanici_adi: userData?.isim + ' ' + userData?.soyisim || 'Bilinmeyen Kullanıcı'
        });
        
        // Alert yerine success sayfasına yönlendir
        router.push('/customer-success');
        
      } catch (firestoreError) {
        // Hata işlemleri aynen kalıyor
        const fbError = firestoreError as Error;
        
        if (fbError.message && fbError.message.includes("permission")) {
          Alert.alert("Yetki Hatası", 
            "Bu işlemi gerçekleştirmek için yetkiniz yok. Yöneticiniz ile iletişime geçiniz.",
            [
              { text: "Tamam", onPress: () => router.push('/home') }
            ]
          );
        } else {
          throw firestoreError;
        }
      }
    } catch (error) {
      console.error("Müşteri eklenirken hata:", error);
      Alert.alert("Hata", "Müşteri eklenirken bir sorun oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidView}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#222222" />
            </TouchableOpacity>
            <Text style={styles.screenTitle}>Yeni Müşteri Ekle</Text>
            <TouchableOpacity style={styles.iconButton}>
              <Feather name="help-circle" size={24} color="#666666" />
            </TouchableOpacity>
          </View>

          {/* Form Content */}
          <ScrollView 
            style={styles.formContainer}
            contentContainerStyle={styles.formContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Firma ID Display (Non-editable) */}
            <View style={styles.infoContainer}>
              <Text style={styles.infoLabel}>Firma ID</Text>
              <Text style={styles.infoValue}>{userData?.firma_id || 'Belirtilmemiş'}</Text>
            </View>
            
            {/* Customer Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Firma Unvanı*</Text>
              <TextInput
                style={styles.input}
                value={customerData.sirket_ismi}
                onChangeText={(text) => handleChange('sirket_ismi', text)}
                placeholder="Firma unvanını giriniz"
                placeholderTextColor="#AAAAAA"
              />
            </View>

            {/* Phone */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Telefon Numarası</Text>
              <TextInput
                style={styles.input}
                value={customerData.telefon}
                onChangeText={(text) => handleChange('telefon', text)}
                placeholder="Firma telefon numarasını giriniz"
                placeholderTextColor="#AAAAAA"
                keyboardType="phone-pad"
              />
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>E-posta Adresi</Text>
              <TextInput
                style={styles.input}
                value={customerData.eposta}
                onChangeText={(text) => handleChange('eposta', text)}
                placeholder="Firma e-posta adresini giriniz"
                placeholderTextColor="#AAAAAA"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Address */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Adres</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={customerData.adres}
                onChangeText={(text) => handleChange('adres', text)}
                placeholder="Firma adresini giriniz"
                placeholderTextColor="#AAAAAA"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Required fields note */}
            <Text style={styles.requiredNote}>* işaretli alanların doldurulması zorunludur.</Text>

            {/* Add Button */}
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddCustomer}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.addButtonText}>Müşteri Ekle</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>

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
  keyboardAvoidView: {
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
  iconButton: {
    padding: 5,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  formContent: {
    paddingTop: 20,
    paddingBottom: 100, // To account for the tab bar
  },
  infoContainer: {
    backgroundColor: '#FFF9F2',
    padding: 12,
    borderRadius: 10,
    marginBottom: 18,
  },
  infoLabel: {
    fontSize: 14,
    color: '#777777',
    marginBottom: 6,
  },
  infoValue: {
    fontSize: 16,
    color: '#222222',
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    color: '#777777',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    height: 50,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  requiredNote: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  addButton: {
    backgroundColor: '#E6A05F',
    borderRadius: 10,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
});