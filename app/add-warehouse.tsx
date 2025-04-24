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
  Alert,
  Switch
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

// Depo için tip tanımı
interface WarehouseData {
  depo_adi: string;
  depo_turu: string;
  konum: string;
  aktif: boolean;
  telefon: string;
  firma_id: string;
}

export default function AddWarehouseScreen() {
  const { userData, currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // warehouseData state'i
  const [warehouseData, setWarehouseData] = useState<WarehouseData>({
    depo_adi: '',
    depo_turu: '',
    konum: '',
    aktif: true,
    telefon: '',
    firma_id: userData?.firma_id || '',
  });

  const handleChange = (field: keyof WarehouseData, value: string | boolean) => {
    setWarehouseData({
      ...warehouseData,
      [field]: value
    });
  };

  const validateForm = () => {
    // Zorunlu alanları kontrol et
    if (!warehouseData.depo_adi.trim()) {
      Alert.alert("Uyarı", "Depo adı zorunludur.");
      return false;
    }
    
    if (!warehouseData.depo_turu.trim()) {
      Alert.alert("Uyarı", "Depo türü zorunludur.");
      return false;
    }
    
    // Telefon formatını kontrol et (isteğe bağlı alan)
    if (warehouseData.telefon) {
      const phoneRegex = /^[0-9]{10,11}$/;
      if (!phoneRegex.test(warehouseData.telefon.replace(/\D/g, ''))) {
        Alert.alert("Uyarı", "Geçerli bir telefon numarası giriniz.");
        return false;
      }
    }
    
    return true;
  };

  const handleAddWarehouse = async () => {
    if (!validateForm()) return;
    
    if (!userData?.firma_id) {
      Alert.alert("Hata", "Depo eklemek için bir firmaya bağlı olmalısınız.");
      return;
    }
    
    setLoading(true);
    
    try {
      const depolarRef = collection(db, "Depolar");
      
      const newWarehouse = {
        ...warehouseData,
        firma_id: userData.firma_id,
        ekleyen_kullanici: userData?.isim + ' ' + userData?.soyisim || 'Bilinmeyen Kullanıcı',
        ekleyen_kullanici_id: currentUser?.uid || '',
        eklenme_tarihi: new Date()
      };
      
      try {
        const docRef = await addDoc(depolarRef, newWarehouse);
        console.log("Depo eklendi, ID:", docRef.id);
        
        // Eylemler tablosuna kayıt ekle
        const eylemlerRef = collection(db, "Eylemler");
        await addDoc(eylemlerRef, {
          eylem_tarihi: new Date(),
          eylem_aciklamasi: `"${warehouseData.depo_adi}" isimli depo eklendi.`,
          kullanici_id: currentUser?.uid || '',
          firma_id: userData.firma_id,
          islem_turu: 'depo_ekleme',
          ilgili_belge_id: docRef.id,
          kullanici_adi: userData?.isim + ' ' + userData?.soyisim || 'Bilinmeyen Kullanıcı'
        });
        
        // Başarı sayfasına yönlendir (oluşturulacak)
        router.push('/warehouse-success');
        
      } catch (firestoreError) {
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
      console.error("Depo eklenirken hata:", error);
      Alert.alert("Hata", "Depo eklenirken bir sorun oluştu. Lütfen tekrar deneyin.");
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
            <Text style={styles.screenTitle}>Yeni Depo Ekle</Text>
          </View>

          <ScrollView style={styles.formContainer}>
            {/* Firma Bilgisi - Sadece göstermek için */}
            <View style={styles.firmaBilgisi}>
              <Text style={styles.firmaLabel}>Firma:</Text>
              <Text style={styles.firmaValue}>{userData?.firma_id || 'Belirtilmemiş'}</Text>
            </View>

            {/* Depo Adı */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Depo Adı*</Text>
              <TextInput
                style={styles.input}
                value={warehouseData.depo_adi}
                onChangeText={(text) => handleChange('depo_adi', text)}
                placeholder="Depo adını giriniz"
                placeholderTextColor="#AAAAAA"
              />
            </View>

            {/* Depo Türü */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Depo Türü*</Text>
              <TextInput
                style={styles.input}
                value={warehouseData.depo_turu}
                onChangeText={(text) => handleChange('depo_turu', text)}
                placeholder="Depo türünü giriniz (örn. Ana Depo, Yedek Depo)"
                placeholderTextColor="#AAAAAA"
              />
            </View>

            {/* Telefon */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Telefon Numarası</Text>
              <TextInput
                style={styles.input}
                value={warehouseData.telefon}
                onChangeText={(text) => handleChange('telefon', text)}
                placeholder="Depo telefon numarasını giriniz"
                placeholderTextColor="#AAAAAA"
                keyboardType="phone-pad"
              />
            </View>

            {/* Aktif/Pasif */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Durum</Text>
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>{warehouseData.aktif ? 'Aktif' : 'Pasif'}</Text>
                <Switch
                  value={warehouseData.aktif}
                  onValueChange={(value) => handleChange('aktif', value)}
                  trackColor={{ false: '#D1D1D6', true: '#E6A05F' }}
                  thumbColor={warehouseData.aktif ? '#FFFFFF' : '#F4F3F4'}
                />
              </View>
            </View>

            {/* Konum */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Konum</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={warehouseData.konum}
                onChangeText={(text) => handleChange('konum', text)}
                placeholder="Depo konumunu giriniz"
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
              onPress={handleAddWarehouse}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.addButtonText}>Depo Ekle</Text>
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
  keyboardAvoidView: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222222',
  },
  formContainer: {
    padding: 16,
  },
  firmaBilgisi: {
    backgroundColor: '#FFF9F2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  firmaLabel: {
    fontSize: 14,
    color: '#666666',
    marginRight: 8,
  },
  firmaValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E6A05F',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    color: '#555555',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333333',
  },
  requiredNote: {
    fontSize: 14,
    color: '#999999',
    marginTop: 8,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  addButton: {
    backgroundColor: '#E6A05F',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});