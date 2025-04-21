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

export default function AddSupplierScreen() {
  const [supplierData, setSupplierData] = useState({
    code: '',
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    taxNumber: '',
  });

  const handleChange = (field, value) => {
    setSupplierData({
      ...supplierData,
      [field]: value
    });
  };

  const handleAddSupplier = () => {
    // Validate required fields
    if (!supplierData.code || !supplierData.name) {
      alert('Lütfen firma kodu ve firma unvanını giriniz.');
      return;
    }

    // Here you would normally send data to API/database
    // For demo purposes, we just navigate to success page
    router.push('/supplier-success');
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
            <Text style={styles.screenTitle}>Yeni Tedarikçi Ekle</Text>
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
            {/* Supplier Code */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Firma Kodu*</Text>
              <TextInput
                style={[styles.input, styles.shortInput]}
                value={supplierData.code}
                onChangeText={(text) => handleChange('code', text)}
                placeholder="Örn: 320.09"
                placeholderTextColor="#AAAAAA"
              />
            </View>

            {/* Supplier Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Firma Unvanı*</Text>
              <TextInput
                style={styles.input}
                value={supplierData.name}
                onChangeText={(text) => handleChange('name', text)}
                placeholder="Firma unvanını giriniz"
                placeholderTextColor="#AAAAAA"
              />
            </View>

            {/* Contact Person */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>İlgili Kişi</Text>
              <TextInput
                style={styles.input}
                value={supplierData.contactPerson}
                onChangeText={(text) => handleChange('contactPerson', text)}
                placeholder="İletişim kurulacak kişiyi giriniz"
                placeholderTextColor="#AAAAAA"
              />
            </View>

            {/* Phone */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Telefon Numarası</Text>
              <TextInput
                style={styles.input}
                value={supplierData.phone}
                onChangeText={(text) => handleChange('phone', text)}
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
                value={supplierData.email}
                onChangeText={(text) => handleChange('email', text)}
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
                value={supplierData.address}
                onChangeText={(text) => handleChange('address', text)}
                placeholder="Firma adresini giriniz"
                placeholderTextColor="#AAAAAA"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Tax Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Vergi Numarası</Text>
              <TextInput
                style={styles.input}
                value={supplierData.taxNumber}
                onChangeText={(text) => handleChange('taxNumber', text)}
                placeholder="Vergi numarasını giriniz"
                placeholderTextColor="#AAAAAA"
                keyboardType="numeric"
              />
            </View>

            {/* Required fields note */}
            <Text style={styles.requiredNote}>* işaretli alanların doldurulması zorunludur.</Text>

            {/* Add Button */}
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddSupplier}
            >
              <Text style={styles.addButtonText}>Tedarikçi Ekle</Text>
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