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
import { Ionicons, Feather } from '@expo/vector-icons'; // Ionicons'u buraya ekleyin
import {
  updateEmail, // updateEmail'i burada kullanmıyoruz, verifyBeforeUpdateEmail kullanılıyor
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  AuthError,
  sendEmailVerification, // Bunu da kullanmıyoruz
  verifyBeforeUpdateEmail
} from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc } from "firebase/firestore";
import { db } from '../firebase/config';

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
  const { currentUser, userData, logout } = useAuth(); // logout fonksiyonunu alın
  const [formData, setFormData] = useState<FormData>({
    eposta: '',
    telefon: '',
    password: '',
    currentPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [errors, setErrors] = useState({
    eposta: '',
    telefon: '',
    password: '',
    currentPassword: '',
    confirmPassword: '',
  });

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

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const togglePasswordFields = () => {
    setShowPasswordFields(!showPasswordFields);
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      eposta: '',
      telefon: '',
      password: '',
      currentPassword: '',
      confirmPassword: '',
    };

    // E-posta doğrulama
    if (formData.eposta !== userData?.eposta) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.eposta)) {
        newErrors.eposta = "Geçerli bir e-posta adresi giriniz.";
        isValid = false;
      }
    }

    // Şifre doğrulama
    if (showPasswordFields) {
      if (!formData.currentPassword) {
        newErrors.currentPassword = "Mevcut şifrenizi girmelisiniz.";
        isValid = false;
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.password = "Yeni şifreler eşleşmiyor.";
        newErrors.confirmPassword = "Yeni şifreler eşleşmiyor.";
        isValid = false;
      }

      if (formData.password && formData.password.length < 6) {
        newErrors.password = "Şifre en az 6 karakter olmalıdır.";
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    // Değişkenleri try bloğunun dışına taşı
    let needsReauthentication = false;
    let emailChanged = false;
    let passwordChanged = false;
    const updatedData: Partial<UserData> = {}; // Bunu da dışarı alabiliriz

    try {
      // Değişiklikleri belirle
      if (formData.eposta !== userData?.eposta) {
        needsReauthentication = true;
        emailChanged = true;
      }
      if (showPasswordFields && formData.password) {
        needsReauthentication = true;
        passwordChanged = true;
      }
      if (formData.telefon !== userData?.telefon) {
        updatedData.telefon = formData.telefon;
      }

      // Yeniden kimlik doğrulama gerekiyorsa
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

          // E-posta güncelleme (Doğrulama gönder)
          if (emailChanged) {
            await verifyBeforeUpdateEmail(currentUser, formData.eposta);
            Alert.alert(
              "Doğrulama Gerekli",
              "Yeni e-posta adresinize bir doğrulama bağlantısı gönderdik. Değişikliğin tamamlanması için çıkış yapacaksınız. Lütfen e-postanızı kontrol edip doğruladıktan sonra tekrar giriş yapın.",
              [{
                text: "Tamam",
                onPress: async () => {
                  try {
                    await logout(); // Çıkış yap
                    router.replace('/'); // Login ekranına yönlendir
                  } catch (logoutError) {
                    console.error("Otomatik çıkış hatası:", logoutError);
                    Alert.alert("Hata", "Çıkış yapılırken bir sorun oluştu.");
                    setLoading(false); // Yükleniyor durumunu kapat
                  }
                }
              }]
            );
            // E-posta değişikliği sonrası başka işlem yapmadan çıkış yapılacağı için return
            return;
          }

          // Şifre güncelleme
          if (passwordChanged) {
            await updatePassword(currentUser, formData.password);
            // Firestore'daki diğer alanları (telefon vb.) güncelle
            if (Object.keys(updatedData).length > 0) {
              const userDocRef = doc(db, "Kullanicilar", currentUser.uid);
              await updateDoc(userDocRef, updatedData);
              console.log("Firestore'daki diğer alanlar güncellendi (şifre sonrası).");
            }
            Alert.alert(
              "Başarılı",
              "Şifreniz başarıyla güncellendi. Değişikliğin tamamlanması için çıkış yapacaksınız. Lütfen yeni şifrenizle tekrar giriş yapın.",
              [{
                text: "Tamam",
                onPress: async () => {
                  try {
                    await logout(); // Çıkış yap
                    router.replace('/'); // Login ekranına yönlendir
                  } catch (logoutError) {
                    console.error("Otomatik çıkış hatası:", logoutError);
                    Alert.alert("Hata", "Çıkış yapılırken bir sorun oluştu.");
                    setLoading(false); // Yükleniyor durumunu kapat
                  }
                }
              }]
            );
            // Şifre değişikliği sonrası başka işlem yapmadan çıkış yapılacağı için return
            return;
          }

        } catch (error) {
          // ... (Re-authentication veya güncelleme hata yönetimi) ...
          const authError = error as AuthError;
          let errorMessage = "Kimlik doğrulama veya güncelleme sırasında bir hata oluştu.";
          if (authError.code === 'auth/wrong-password') {
            errorMessage = "Mevcut şifreniz yanlış.";
          } else if (authError.code === 'auth/too-many-requests') {
            errorMessage = "Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin.";
          } else if (authError.code === 'auth/email-already-in-use') {
             errorMessage = "Bu e-posta adresi zaten başka bir hesap tarafından kullanılıyor.";
          }
          console.error("Kimlik doğrulama veya güncelleme hatası:", authError);
          Alert.alert("Hata", errorMessage);
          setLoading(false);
          return; // Hata durumunda işlemi durdur
        }
      }

      // Sadece Firestore'daki diğer alanlar güncelleniyorsa (telefon gibi)
      if (Object.keys(updatedData).length > 0 && !needsReauthentication) {
        const userDocRef = doc(db, "Kullanicilar", currentUser.uid);
        await updateDoc(userDocRef, updatedData);
        Alert.alert("Başarılı", "Bilgileriniz güncellendi.");
        router.push('/profile'); // Profile geri dön
      } else if (!needsReauthentication && Object.keys(updatedData).length === 0 && !emailChanged && !passwordChanged) { // Koşulu biraz daha netleştirelim
        // Hiçbir değişiklik yapılmadıysa (ve e-posta/şifre de değişmediyse)
        Alert.alert("Bilgi", "Herhangi bir değişiklik yapılmadı.");
      }

    } catch (error) {
      console.error("Profil kaydetme hatası:", error);
      Alert.alert("Hata", "İşlem yapılırken bir sorun oluştu.");
      // Hata durumunda da loading'i kapatmak iyi olur
      setLoading(false);
    } finally {
      // Artık 'needsReauthentication' burada erişilebilir
      // Eğer otomatik çıkış yapılmadıysa (yani needsReauthentication false ise veya
      // reauth/update içinde bir hata oluşmadıysa ve sadece telefon güncellendiyse)
      // loading durumunu kapat.
      // Not: Otomatik çıkış durumlarında loading zaten Alert'in onPress'inde yönetiliyor.
      // Hata durumunda catch bloğunda yönetiliyor. Bu kontrol sadece başarılı telefon güncellemesi için.
      if (!needsReauthentication && Object.keys(updatedData).length > 0) {
         setLoading(false);
      } else if (!needsReauthentication && Object.keys(updatedData).length === 0 && !emailChanged && !passwordChanged) {
         // Hiçbir değişiklik yapılmadıysa da kapat
         setLoading(false);
      }
      // Diğer durumlarda (reauth gerektirenler veya catch'e düşenler) setLoading zaten yönetiliyor.
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
                onChangeText={(text) => handleInputChange('eposta', text)}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="E-posta adresiniz"
                placeholderTextColor="#AAAAAA"
              />
              {errors.eposta ? <Text style={styles.errorText}>{errors.eposta}</Text> : null}
            </View>

            {/* Telefon */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Telefon Numarası</Text>
              <TextInput
                style={styles.input}
                value={formData.telefon}
                onChangeText={(text) => handleInputChange('telefon', text)}
                keyboardType="phone-pad"
                placeholder="Telefon numaranız"
                placeholderTextColor="#AAAAAA"
              />
              {errors.telefon ? <Text style={styles.errorText}>{errors.telefon}</Text> : null}
            </View>

            {/* Şifre Değiştirme */}
            <TouchableOpacity
              style={styles.passwordToggle}
              onPress={togglePasswordFields}
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
                    onChangeText={(text) => handleInputChange('currentPassword', text)}
                    secureTextEntry
                    placeholder="Mevcut şifrenizi girin"
                    placeholderTextColor="#AAAAAA"
                  />
                  {errors.currentPassword ? <Text style={styles.errorText}>{errors.currentPassword}</Text> : null}
                </View>

                {/* Yeni Şifre */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Yeni Şifre</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.password}
                    onChangeText={(text) => handleInputChange('password', text)}
                    secureTextEntry
                    placeholder="Yeni şifrenizi girin"
                    placeholderTextColor="#AAAAAA"
                  />
                  {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
                </View>

                {/* Şifre Tekrar */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Yeni Şifre Tekrar</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.confirmPassword}
                    onChangeText={(text) => handleInputChange('confirmPassword', text)}
                    secureTextEntry
                    placeholder="Yeni şifrenizi tekrar girin"
                    placeholderTextColor="#AAAAAA"
                  />
                  {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
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
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  },
});