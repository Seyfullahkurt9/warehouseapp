import React, { useState, useEffect } from 'react';
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
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

// Company data interface
interface CompanyData {
  firma_ismi: string;
  vergi_no: string;
  telefon_no: string;
  eposta: string;
  adres: string;
}

export default function EditCompanyInfoScreen() {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form data state
  const [formData, setFormData] = useState<CompanyData>({
    firma_ismi: '',
    vergi_no: '',
    telefon_no: '',
    eposta: '',
    adres: ''
  });

  // Load company data
  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        if (!userData?.firma_id) {
          setError("Kullanıcı firma bilgisi bulunamadı.");
          setLoading(false);
          return;
        }

        // Get company data from Firestore
        const companyRef = doc(db, "Firmalar", userData.firma_id);
        const companySnapshot = await getDoc(companyRef);

        if (companySnapshot.exists()) {
          const data = companySnapshot.data() as CompanyData;
          setFormData({
            firma_ismi: data.firma_ismi || '',
            vergi_no: data.vergi_no || '',
            telefon_no: data.telefon_no || '',
            eposta: data.eposta || '',
            adres: data.adres || ''
          });
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

  // Handle form changes
  const handleInputChange = (field: keyof CompanyData, value: string) => {
    setFormData({
      ...formData,
      [field]: value
    });
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

    if (!userData?.firma_id) {
      Alert.alert("Hata", "Firma bilgisi bulunamadı.");
      return;
    }

    setSaving(true);

    try {
      const companyRef = doc(db, "Firmalar", userData.firma_id);
      await updateDoc(companyRef, {
        firma_ismi: formData.firma_ismi,
        vergi_no: formData.vergi_no,
        telefon_no: formData.telefon_no,
        eposta: formData.eposta,
        adres: formData.adres
      });

      Alert.alert(
        "Başarılı", 
        "Firma bilgileri başarıyla güncellendi.", 
        [{ text: "Tamam", onPress: () => router.back() }]
      );
    } catch (error) {
      console.error("Firma bilgileri güncellenirken hata:", error);
      Alert.alert("Hata", "Firma bilgileri güncellenirken bir sorun oluştu.");
    } finally {
      setSaving(false);
    }
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
            
            <Text style={styles.headerTitle}>Firma Bilgilerini Düzenle</Text>
            
            <View style={styles.headerRight}>
              <Feather name="edit-2" size={20} color="#666666" />
            </View>
          </View>

          {/* Form Content */}
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
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

            {/* Save Button */}
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Değişiklikleri Kaydet</Text>
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