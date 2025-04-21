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
  Modal,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';

// Firebase imports - uncomment when ready to use
// import firestore from '@react-native-firebase/firestore';
// import auth from '@react-native-firebase/auth';

// Order type definition
interface Order {
  id?: string;
  date: string;
  productCode: string;
  productName: string;
  unit: string;
  quantity: string;
  companyCode: string;
  companyName: string;
  createdAt: Date;
  updatedAt?: Date;
  userId?: string;
  status?: 'pending' | 'completed' | 'cancelled';
}

export default function CreateOrderScreen() {
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [productCode, setProductCode] = useState('');
  const [productName, setProductName] = useState('');
  const [unit, setUnit] = useState('');
  const [quantity, setQuantity] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);

  // For custom date picker
  const [selectedDay, setSelectedDay] = useState(date.getDate());
  const [selectedMonth, setSelectedMonth] = useState(date.getMonth());
  const [selectedYear, setSelectedYear] = useState(date.getFullYear());
  const [activeTab, setActiveTab] = useState('day');

  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];
  
  const formatDate = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  // Generate array of days in the current month/year
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Generate years list (5 years before and 5 years after current year)
  const getYearsList = () => {
    const currentYear = new Date().getFullYear();
    const years: number[] = []; // Add explicit type here
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      years.push(i);
    }
    return years;
  };

  const years = getYearsList();
  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Update date value when date picker selections change
  useEffect(() => {
    // Make sure the day is valid for the selected month
    const maxDays = getDaysInMonth(selectedYear, selectedMonth);
    let validDay = selectedDay;
    if (validDay > maxDays) {
      validDay = maxDays;
      setSelectedDay(maxDays);
    }
    
    setDate(new Date(selectedYear, selectedMonth, validDay));
  }, [selectedDay, selectedMonth, selectedYear]);

  const confirmDateSelection = () => {
    setShowDatePicker(false);
  };

  // Function to save order to Firebase
  const saveOrderToFirebase = async (order: Order) => {
    try {
      // This is a placeholder function that will be implemented when Firebase is integrated
      console.log("Saving order to Firebase:", order);
      
      // Example implementation for reference:
      // const userId = auth().currentUser?.uid;
      // if (!userId) {
      //   throw new Error("Kullanıcı oturum açmamış!");
      // }
      // 
      // await firestore()
      //   .collection('orders')
      //   .add({
      //     ...order,
      //     userId,
      //     createdAt: firestore.FieldValue.serverTimestamp(),
      //     updatedAt: firestore.FieldValue.serverTimestamp(),
      //     status: 'pending'
      //   });
      
      // Success
      return true;
    } catch (error) {
      console.error("Firebase save error:", error);
      return false;
    }
  };

  const handleSave = async () => {
    // Validate input fields
    if (!productCode || !productName || !unit || !quantity || !companyCode || !companyName) {
      // You might want to show an error message to the user
      alert("Lütfen tüm alanları doldurunuz.");
      return;
    }

    setLoading(true);

    try {
      const newOrder: Order = {
        date: formatDate(date),
        productCode,
        productName,
        unit,
        quantity,
        companyCode,
        companyName,
        createdAt: new Date()
      };

      // When Firebase is integrated, uncomment this:
      // const success = await saveOrderToFirebase(newOrder);
      // if (success) {
      //   router.push('/order-success');
      // } else {
      //   alert("Sipariş kaydedilemedi. Lütfen tekrar deneyiniz.");
      // }
      
      // For now, just simulate a successful save
      setTimeout(() => {
        setLoading(false);
        router.push('/order-success');
      }, 1000);
    } catch (error) {
      console.error("Save error:", error);
      setLoading(false);
      alert("Bir hata oluştu. Lütfen tekrar deneyiniz.");
    }
  };

  const renderDatePickerContent = () => {
    switch(activeTab) {
      case 'day':
        return (
          <FlatList
            data={days}
            numColumns={7}
            keyExtractor={(item) => `day-${item}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.datePickerItem,
                  selectedDay === item && styles.datePickerItemSelected
                ]}
                onPress={() => setSelectedDay(item)}
              >
                <Text 
                  style={[
                    styles.datePickerItemText,
                    selectedDay === item && styles.datePickerItemTextSelected
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.datePickerGrid}
          />
        );
      case 'month':
        return (
          <FlatList
            data={months}
            numColumns={3}
            keyExtractor={(item, index) => `month-${index}`}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[
                  styles.datePickerItem,
                  styles.monthItem,
                  selectedMonth === index && styles.datePickerItemSelected
                ]}
                onPress={() => setSelectedMonth(index)}
              >
                <Text 
                  style={[
                    styles.datePickerItemText,
                    selectedMonth === index && styles.datePickerItemTextSelected
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.datePickerGrid}
          />
        );
      case 'year':
        return (
          <FlatList
            data={years}
            numColumns={3}
            keyExtractor={(item) => `year-${item}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.datePickerItem,
                  styles.yearItem,
                  selectedYear === item && styles.datePickerItemSelected
                ]}
                onPress={() => setSelectedYear(item)}
              >
                <Text 
                  style={[
                    styles.datePickerItemText,
                    selectedYear === item && styles.datePickerItemTextSelected
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.datePickerGrid}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>TRACKIT</Text>
          </View>
          <View style={styles.headerBottom}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#222222" />
            </TouchableOpacity>
            <Text style={styles.screenTitle}>Sipariş Oluşturma</Text>
            <TouchableOpacity style={styles.calendarButton}>
              <View style={styles.calendarIconContainer}>
                <Feather name="calendar" size={24} color="#222222" />
                <View style={styles.addIconBadge}>
                  <Feather name="plus" size={12} color="#222222" />
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Form Content */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView 
            style={styles.scrollView} 
            contentContainerStyle={styles.formContainer}
            keyboardShouldPersistTaps="handled"
          >
            {/* Date Field */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Tarih</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.inputText}>{formatDate(date)}</Text>
                <Feather name="calendar" size={20} color="#666666" />
              </TouchableOpacity>
            </View>

            {/* Product Code Field */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Ürün/stok kodu</Text>
              <TextInput
                style={[styles.input, styles.textInput]}
                value={productCode}
                onChangeText={setProductCode}
                placeholder="Ürün veya stok kodunu girin"
                placeholderTextColor="#AAAAAA"
              />
            </View>

            {/* Product Name Field */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Ürün/stok adı</Text>
              <TextInput
                style={[styles.input, styles.textInput]}
                value={productName}
                onChangeText={setProductName}
                placeholder="Ürün veya stok adını girin"
                placeholderTextColor="#AAAAAA"
              />
            </View>

            {/* Unit Field */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Alış/Satış birimi</Text>
              <TextInput
                style={[styles.input, styles.textInput]}
                value={unit}
                onChangeText={setUnit}
                placeholder="Örn: Adet, Kg, Litre"
                placeholderTextColor="#AAAAAA"
              />
            </View>

            {/* Quantity Field */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Miktarı</Text>
              <TextInput
                style={[styles.input, styles.textInput]}
                value={quantity}
                onChangeText={setQuantity}
                placeholder="Miktar girin"
                placeholderTextColor="#AAAAAA"
                keyboardType="numeric"
              />
            </View>

            {/* Company Code Field */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Firma kodu</Text>
              <TextInput
                style={[styles.input, styles.textInput]}
                value={companyCode}
                onChangeText={setCompanyCode}
                placeholder="Firma kodunu girin"
                placeholderTextColor="#AAAAAA"
              />
            </View>

            {/* Company Name Field */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Firma unvanı</Text>
              <TextInput
                style={[styles.input, styles.textInput]}
                value={companyName}
                onChangeText={setCompanyName}
                placeholder="Firma unvanını girin"
                placeholderTextColor="#AAAAAA"
              />
            </View>

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
        </KeyboardAvoidingView>

        {/* Custom Date Picker Modal */}
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowDatePicker(false)}
          >
            <View 
              style={styles.datePickerContainer}
              onStartShouldSetResponder={() => true}
              onTouchEnd={(e) => e.stopPropagation()}
            >
              {/* Date picker header */}
              <View style={styles.datePickerHeader}>
                <Text style={styles.datePickerTitle}>Tarih Seçin</Text>
                <Text style={styles.datePickerCurrentDate}>{formatDate(date)}</Text>
              </View>
              
              {/* Tab switcher */}
              <View style={styles.datePickerTabs}>
                <TouchableOpacity 
                  style={[
                    styles.datePickerTab, 
                    activeTab === 'day' && styles.datePickerTabActive
                  ]}
                  onPress={() => setActiveTab('day')}
                >
                  <Text style={[
                    styles.datePickerTabText,
                    activeTab === 'day' && styles.datePickerTabTextActive
                  ]}>Gün</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.datePickerTab, 
                    activeTab === 'month' && styles.datePickerTabActive
                  ]}
                  onPress={() => setActiveTab('month')}
                >
                  <Text style={[
                    styles.datePickerTabText,
                    activeTab === 'month' && styles.datePickerTabTextActive
                  ]}>Ay</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.datePickerTab, 
                    activeTab === 'year' && styles.datePickerTabActive
                  ]}
                  onPress={() => setActiveTab('year')}
                >
                  <Text style={[
                    styles.datePickerTabText,
                    activeTab === 'year' && styles.datePickerTabTextActive
                  ]}>Yıl</Text>
                </TouchableOpacity>
              </View>
              
              {/* Date picker content */}
              <View style={styles.datePickerContent}>
                {renderDatePickerContent()}
              </View>
              
              {/* Date picker actions */}
              <View style={styles.datePickerActions}>
                <TouchableOpacity 
                  style={styles.datePickerButton} 
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.datePickerButtonText}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.datePickerButton, styles.datePickerConfirmButton]} 
                  onPress={confirmDateSelection}
                >
                  <Text style={[styles.datePickerButtonText, styles.datePickerConfirmButtonText]}>
                    Tamam
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>

      {/* Bottom Tab Navigation */}
      <View style={styles.tabBarContainer}>
        <View style={styles.tabBar}>
          <TouchableOpacity style={styles.tabItem}>
            <Ionicons name="grid-outline" size={24} color="#666666" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.tabItem}
            onPress={() => router.replace('/home')}
          >
            <Ionicons name="home-outline" size={24} color="#666666" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.tabItem}>
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
  safeArea: {
    flex: 1,
    paddingTop: 10,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerTop: {
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222222',
  },
  headerBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 5,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222222',
  },
  calendarButton: {
    padding: 5,
  },
  calendarIconContainer: {
    position: 'relative',
  },
  addIconBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 2,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    height: 50,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textInput: {
    fontSize: 16,
    color: '#222222',
    paddingVertical: 0, // Fix for Android text input padding
  },
  inputText: {
    fontSize: 16,
    color: '#222222',
  },
  saveButton: {
    backgroundColor: '#E6A05F',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
    width: '100%',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
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
  
  // Date picker modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  datePickerHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    alignItems: 'center',
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222222',
    marginBottom: 4,
  },
  datePickerCurrentDate: {
    fontSize: 16,
    color: '#666666',
  },
  datePickerTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  datePickerTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  datePickerTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#E6A05F',
  },
  datePickerTabText: {
    fontSize: 16,
    color: '#666666',
  },
  datePickerTabTextActive: {
    color: '#E6A05F',
    fontWeight: 'bold',
  },
  datePickerContent: {
    paddingVertical: 16,
    maxHeight: 300,
  },
  datePickerGrid: {
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  datePickerItem: {
    width: '14.28%', // 7 columns for days
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 1,
  },
  monthItem: {
    width: '33.33%', // 3 columns for months
    aspectRatio: 2,
  },
  yearItem: {
    width: '33.33%', // 3 columns for years
    aspectRatio: 2,
  },
  datePickerItemSelected: {
    backgroundColor: '#E6A05F20',
    borderRadius: 100,
  },
  datePickerItemText: {
    fontSize: 16,
    color: '#333333',
  },
  datePickerItemTextSelected: {
    color: '#E6A05F',
    fontWeight: 'bold',
  },
  datePickerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  datePickerButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 8,
  },
  datePickerButtonText: {
    fontSize: 16,
    color: '#666666',
  },
  datePickerConfirmButton: {
    backgroundColor: '#E6A05F',
  },
  datePickerConfirmButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
