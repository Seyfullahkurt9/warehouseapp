import React, { useState, useEffect } from 'react';
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
  Alert,
  ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { updateEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential, AuthError, sendEmailVerification } from 'firebase/auth';

// Kullanıcı verileri için tip tanımı
interface UserData {
  isim?: string;
  soyisim?: string;
  eposta?: string;
  telefon?: string;
  is_unvani?: string;
  firma_id?: string;
  yetki_id?: string;
}

// Form verileri için tip tanımı
interface FormData {
  eposta: string;
  telefon: string;
  password: string;
  currentPassword: string;
  confirmPassword: string;
}

export default function EditProfileScreen() {
  const { userData, currentUser, updateUserData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    eposta: '',
    telefon: '',
    password: '',
    currentPassword: '',
    confirmPassword: '',
  });
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  useEffect(() => {
    // Form verilerini userData'dan doldur
    if (userData) {
      setFormData(prevData => ({
        ...prevData,
        eposta: userData.eposta || '',
        telefon: userData.telefon || '',
      }));
    }
  }, [userData]);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const validateForm = () => {
    // E-posta doğrulama
    if (formData.eposta !== userData?.eposta) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.eposta)) {
        Alert.alert("Hata", "Geçerli bir e-posta adresi giriniz.");
        return false;
      }
    }

    // Şifre doğrulama
    if (showPasswordFields) {
      if (!formData.currentPassword) {
        Alert.alert("Hata", "Mevcut şifrenizi girmelisiniz.");
        return false;
      }
      
      if (formData.password !== formData.confirmPassword) {
        Alert.alert("Hata", "Yeni şifreler eşleşmiyor.");
        return false;
      }
      
      if (formData.password && formData.password.length < 6) {
        Alert.alert("Hata", "Şifre en az 6 karakter olmalıdır.");
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      // Değişiklik yapılacak alanları kontrol et
      const updatedData: Partial<UserData> = {};
      let needsReauthentication = false;
      
      // E-posta değişikliği
      if (formData.eposta !== userData?.eposta) {
        needsReauthentication = true;
      }
      
      // Şifre değişikliği
      if (showPasswordFields && formData.password) {
        needsReauthentication = true;
      }
      
      // Telefon değişikliği
      if (formData.telefon !== userData?.telefon) {
        updatedData.telefon = formData.telefon;
      }
      
      // Yeniden kimlik doğrulama gerektiren işlemler için
      if (needsReauthentication) {
        if (!formData.currentPassword) {
          Alert.alert("Hata", "E-posta veya şifre değişikliği için mevcut şifrenizi girmelisiniz.");
          setLoading(false);
          return;
        }
        
        try {
          // Kullanıcının yeniden kimlik doğrulaması
          if (!currentUser?.email) {
            throw new Error("Kullanıcı e-posta bilgisi bulunamadı");
          }

          const credential = EmailAuthProvider.credential(
            currentUser.email,
            formData.currentPassword
          );
          
          await reauthenticateWithCredential(currentUser, credential);
          
          // E-posta güncelleme
          if (formData.eposta !== userData?.eposta) {
            // E-posta doğrulama bağlantısı gönder
            await currentUser.verifyBeforeUpdateEmail(formData.eposta);
            
            // Kullanıcıya bilgi ver
            Alert.alert(
              "Doğrulama Gerekli",
              "Yeni e-posta adresinize bir doğrulama bağlantısı gönderdik. Lütfen e-postanızı kontrol edin ve bağlantıya tıklayarak değişikliği onaylayın.",
              [{ text: "Tamam", onPress: () => router.push('/profile') }]
            );
            
            // Not: Firestore güncellemesi otomatik olarak gerçekleşecek veya
            // kullanıcının bir sonraki girişinde yapılacak
            return; // İşlemi sonlandır çünkü e-posta değişikliği doğrulama bekliyor
          }
          
          // Şifre güncelleme
          if (showPasswordFields && formData.password) {
            await updatePassword(currentUser, formData.password);
          }
          
        } catch (error) {
          const authError = error as AuthError;
          console.error("Kimlik doğrulama veya güncelleme hatası:", authError);
          if (authError.code === 'auth/wrong-password') {
            Alert.alert("Hata", "Mevcut şifreniz yanlış.");
          } else {
            Alert.alert("Hata", "İşlem yapılırken bir sorun oluştu. Daha sonra tekrar deneyin.");
          }
          setLoading(false);
          return;
        }
      }
      
      // Firestore'da veri güncelleme (en az bir alan değiştiyse)
      if (Object.keys(updatedData).length > 0) {
        const success = await updateUserData(updatedData);
        if (!success) {
          Alert.alert("Hata", "Bilgileriniz güncellenemedi. Daha sonra tekrar deneyin.");
          setLoading(false);
          return;
        }
      }
      
      Alert.alert("Başarılı", "Bilgileriniz başarıyla güncellendi.", [
        { text: "Tamam", onPress: () => router.push('/profile') }
      ]);
      
    } catch (error) {
      console.error("Profil güncelleme hatası:", error);
      Alert.alert("Hata", "İşlem yapılırken bir sorun oluştu. Daha sonra tekrar deneyin.");
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
            <View style={styles.headerTitles}>
              <Text style={styles.headerTitle}>TRACKIT</Text>
              <Text style={styles.screenTitle}>Bilgileri düzenle</Text>
            </View>
            <View style={styles.editIconContainer}>
              <Feather name="edit" size={20} color="#666666" />
            </View>
          </View>

          {/* Form Content */}
          <ScrollView 
            style={styles.formContainer}
            contentContainerStyle={styles.formContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Kişisel Bilgiler (Sadece gösterim) */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Kişisel Bilgiler</Text>
              <Text style={styles.sectionDescription}>Bu bilgiler salt okunur</Text>
            </View>

            {/* İsim Soyisim (Değiştirilemez) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ad Soyad</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={`${userData?.isim || ''} ${userData?.soyisim || ''}`}
                editable={false}
              />
            </View>

            {/* İş Unvanı (Değiştirilemez) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>İş Unvanı</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={userData?.is_unvani || '-'}
                editable={false}
              />
            </View>

            {/* Firma ID (Değiştirilemez) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Firma ID</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={userData?.firma_id || '-'}
                editable={false}
              />
            </View>

            <View style={styles.divider} />

            {/* Değiştirilebilir Bilgiler */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>İletişim Bilgileri</Text>
              <Text style={styles.sectionDescription}>Bu bilgileri düzenleyebilirsiniz</Text>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>E-posta Adresi</Text>
              <TextInput
                style={styles.input}
                value={formData.eposta}
                onChangeText={(text) => handleChange('eposta', text)}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="E-posta adresiniz"
                placeholderTextColor="#AAAAAA"
              />
            </View>

            {/* Telefon */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Telefon Numarası</Text>
              <TextInput
                style={styles.input}
                value={formData.telefon}
                onChangeText={(text) => handleChange('telefon', text)}
                keyboardType="phone-pad"
                placeholder="Telefon numaranız"
                placeholderTextColor="#AAAAAA"
              />
            </View>

            {/* Şifre Değiştirme */}
            <TouchableOpacity 
              style={styles.passwordToggle}
              onPress={() => setShowPasswordFields(!showPasswordFields)}
            >
              <Text style={styles.passwordToggleText}>
                {showPasswordFields ? "Şifre değişikliğini iptal et" : "Şifremi değiştirmek istiyorum"}
              </Text>
              <Ionicons 
                name={showPasswordFields ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#E6A05F" 
              />
            </TouchableOpacity>

            {showPasswordFields && (
              <>
                {/* Mevcut Şifre */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Mevcut Şifre</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.currentPassword}
                    onChangeText={(text) => handleChange('currentPassword', text)}
                    secureTextEntry
                    placeholder="Mevcut şifrenizi girin"
                    placeholderTextColor="#AAAAAA"
                  />
                </View>

                {/* Yeni Şifre */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Yeni Şifre</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.password}
                    onChangeText={(text) => handleChange('password', text)}
                    secureTextEntry
                    placeholder="Yeni şifrenizi girin"
                    placeholderTextColor="#AAAAAA"
                  />
                </View>

                {/* Şifre Tekrar */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Yeni Şifre Tekrar</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.confirmPassword}
                    onChangeText={(text) => handleChange('confirmPassword', text)}
                    secureTextEntry
                    placeholder="Yeni şifrenizi tekrar girin"
                    placeholderTextColor="#AAAAAA"
                  />
                </View>
              </>
            )}

            {/* Not */}
            <Text style={styles.noteText}>
              E-posta veya şifre değişikliği için mevcut şifrenizi girmeniz gerekmektedir.
            </Text>

            {/* Save Button */}
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Kaydet</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>

      {/* Bottom Tab Navigation */}
      <View style={styles.tabBarContainer}>
        <View style={styles.tabBar}>
          <TouchableOpacity style={styles.tabItem}>
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
            <Ionicons name="person" size={24} color="#E6A05F" />
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  backButton: {
    padding: 5,
    marginRight: 12,
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222222',
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222222',
    marginTop: 2,
  },
  editIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  formContent: {
    paddingTop: 20,
    paddingBottom: 100, // Tab bar için ekstra alan
  },
  sectionHeader: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222222',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#777777',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 24,
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
  disabledInput: {
    backgroundColor: '#F5F5F5',
    color: '#999999',
  },
  passwordToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 18,
  },
  passwordToggleText: {
    color: '#E6A05F',
    fontWeight: 'bold',
    fontSize: 15,
  },
  noteText: {
    fontSize: 13,
    color: '#888888',
    fontStyle: 'italic',
    marginTop: 10,
    marginBottom: 20,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#E6A05F',
    borderRadius: 10,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
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
    justifyContent: 'center',
    alignItems: 'center',
  },
});