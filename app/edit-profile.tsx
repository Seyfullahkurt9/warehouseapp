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
  Platform
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';

export default function EditProfileScreen() {
  const [userInfo, setUserInfo] = useState({
    userId: '2',
    fullName: 'AHMET GÜNER',
    idNumber: '12345678911',
    phoneAreaCode: '0',
    phoneNumber: '5555555555',
    email: 'ahmet55@gmail.com',
    password: '••••••••',
    confirmPassword: '••••••••',
  });

  const handleChange = (field, value) => {
    setUserInfo({
      ...userInfo,
      [field]: value
    });
  };

  const handleSave = () => {
    // In a real app, this would update the user's info in the backend
    // For now, we'll just navigate back to the profile page
    router.push('/profile');
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
            {/* User ID */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Kullanıcı No</Text>
              <TextInput
                style={[styles.input, styles.shortInput]}
                value={userInfo.userId}
                onChangeText={(text) => handleChange('userId', text)}
                keyboardType="number-pad"
              />
            </View>

            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ad Soyad</Text>
              <TextInput
                style={styles.input}
                value={userInfo.fullName}
                onChangeText={(text) => handleChange('fullName', text)}
              />
            </View>

            {/* ID Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Kimlik No</Text>
              <TextInput
                style={styles.input}
                value={userInfo.idNumber}
                onChangeText={(text) => handleChange('idNumber', text)}
                keyboardType="number-pad"
                maxLength={11}
              />
            </View>

            {/* Phone Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Telefon Numarası</Text>
              <View style={styles.phoneContainer}>
                <TextInput
                  style={[styles.input, styles.phoneAreaCode]}
                  value={userInfo.phoneAreaCode}
                  onChangeText={(text) => handleChange('phoneAreaCode', text)}
                  keyboardType="number-pad"
                  maxLength={1}
                />
                <TextInput
                  style={[styles.input, styles.phoneNumber]}
                  value={userInfo.phoneNumber}
                  onChangeText={(text) => handleChange('phoneNumber', text)}
                  keyboardType="number-pad"
                  maxLength={10}
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>E-posta Adresi</Text>
              <TextInput
                style={styles.input}
                value={userInfo.email}
                onChangeText={(text) => handleChange('email', text)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Şifre</Text>
              <TextInput
                style={styles.input}
                value={userInfo.password}
                onChangeText={(text) => handleChange('password', text)}
                secureTextEntry
              />
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Şifrenizi Tekrar Girin</Text>
              <TextInput
                style={styles.input}
                value={userInfo.confirmPassword}
                onChangeText={(text) => handleChange('confirmPassword', text)}
                secureTextEntry
              />
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Kaydet</Text>
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
    paddingBottom: 100, // To account for the tab bar
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
  shortInput: {
    width: '35%',
  },
  phoneContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  phoneAreaCode: {
    width: '15%',
    marginRight: 10,
  },
  phoneNumber: {
    width: '82%',
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