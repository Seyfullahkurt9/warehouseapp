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
  Alert
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';

export default function AddUserScreen() {
  // State for form fields
  const [userNumber, setUserNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [phoneAreaCode, setPhoneAreaCode] = useState('+90');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Handle form submission
  const handleAddUser = () => {
    // Basic validation
    if (!userNumber || !fullName || !idNumber || !phoneNumber || !email || !password || !confirmPassword) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor.');
      return;
    }

    // Here you would typically send the data to your backend
    console.log('Adding new user:', { 
      userNumber, 
      fullName, 
      idNumber, 
      phone: `${phoneAreaCode}${phoneNumber}`, 
      email, 
      password 
    });

    // Show success message and navigate back
    router.push('/user-success');
  };

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
            <Text style={styles.headerSubTitle}>Yeni Kullanıcı Ekle</Text>
          </View>
          
          <View style={styles.headerRight}>
            <Feather name="user-plus" size={22} color="#666666" />
          </View>
        </View>

        {/* Form */}
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingContainer}
        >
          <ScrollView 
            style={styles.formScrollContainer}
            contentContainerStyle={styles.formContentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* User Number */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Kullanıcı No</Text>
              <TextInput
                style={styles.shortInput}
                placeholder="Kullanıcı numarası"
                value={userNumber}
                onChangeText={setUserNumber}
                keyboardType="numeric"
              />
            </View>

            {/* Full Name */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Ad Soyad</Text>
              <TextInput
                style={styles.input}
                placeholder="Ad ve soyad"
                value={fullName}
                onChangeText={setFullName}
              />
            </View>

            {/* ID Number */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Kimlik No</Text>
              <TextInput
                style={styles.input}
                placeholder="Kimlik numarası"
                value={idNumber}
                onChangeText={setIdNumber}
                keyboardType="numeric"
                maxLength={11}
              />
            </View>

            {/* Phone Number - Side by side */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Telefon Numarası</Text>
              <View style={styles.phoneInputContainer}>
                <TextInput
                  style={styles.areaCodeInput}
                  value={phoneAreaCode}
                  onChangeText={setPhoneAreaCode}
                  keyboardType="phone-pad"
                />
                
                <TextInput
                  style={styles.phoneNumberInput}
                  placeholder="Telefon numarası"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>E-posta Adresi</Text>
              <TextInput
                style={styles.input}
                placeholder="E-posta adresi"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Şifre</Text>
              <TextInput
                style={styles.input}
                placeholder="Şifre"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={true}
              />
            </View>

            {/* Confirm Password */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Şifrenizi Tekrar Girin</Text>
              <TextInput
                style={styles.input}
                placeholder="Şifre tekrarı"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={true}
              />
            </View>

            {/* Add Button */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={handleAddUser}
              >
                <Text style={styles.addButtonText}>Ekle</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  safeArea: {
    flex: 1,
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
  keyboardAvoidingContainer: {
    flex: 1,
  },
  formScrollContainer: {
    flex: 1,
  },
  formContentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    color: '#777777',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    height: 45,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#333333',
  },
  shortInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    height: 45,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#333333',
    width: '50%',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  areaCodeInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    height: 45,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#333333',
    width: '20%',
    textAlign: 'center',
  },
  phoneNumberInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    height: 45,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#333333',
    width: '78%',
  },
  buttonContainer: {
    marginTop: 20,
  },
  addButton: {
    backgroundColor: '#E6A05F',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});