import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar,
  TextInput 
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';

export default function StockMovementCurrentScreen() {
  // State for form fields
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [companyName, setCompanyName] = useState('');

  // Handle form submission to view report
  const handleViewReport = () => {
    console.log('View Report', { startDate, endDate, companyCode, companyName });
    // Here you would implement logic to generate and display the report
  };

  // Handle PDF download
  const handleDownloadPdf = () => {
    console.log('Download PDF', { startDate, endDate, companyCode, companyName });
    // Here you would implement logic to generate and download the PDF
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
            <Text style={styles.headerSubTitle}>Cari Stok Hareket Föyü</Text>
          </View>
          
          {/* No icons on the right side as specified */}
          <View style={styles.headerRightSpace}></View>
        </View>

        {/* Form Container */}
        <View style={styles.formContainer}>
          {/* Date Selection - Side by Side */}
          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <Text style={styles.fieldLabel}>Başlangıç tarihi</Text>
              <View style={styles.inputWithIcon}>
                <TextInput
                  style={styles.dateInput}
                  placeholder="GG/AA/YYYY"
                  value={startDate}
                  onChangeText={setStartDate}
                />
                <TouchableOpacity style={styles.calendarIcon}>
                  <Feather name="calendar" size={18} color="#999999" />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.dateField}>
              <Text style={styles.fieldLabel}>Bitiş tarihi</Text>
              <View style={styles.inputWithIcon}>
                <TextInput
                  style={styles.dateInput}
                  placeholder="GG/AA/YYYY"
                  value={endDate}
                  onChangeText={setEndDate}
                />
                <TouchableOpacity style={styles.calendarIcon}>
                  <Feather name="calendar" size={18} color="#999999" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Company Code */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Firma kodu</Text>
            <TextInput
              style={styles.input}
              placeholder="Firma kodu girin"
              value={companyCode}
              onChangeText={setCompanyCode}
            />
          </View>

          {/* Company Name */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Firma unvanı</Text>
            <TextInput
              style={styles.input}
              placeholder="Firma unvanı girin"
              value={companyName}
              onChangeText={setCompanyName}
            />
          </View>

          {/* Action Buttons - Side by Side */}
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleViewReport}
            >
              <Text style={styles.buttonText}>Görüntüle</Text>
              <Feather name="list" size={18} color="#FFFFFF" style={styles.buttonIcon} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleDownloadPdf}
            >
              <Text style={styles.buttonText}>Pdf indir</Text>
              <MaterialCommunityIcons name="file-pdf-box" size={18} color="#FFFFFF" style={styles.buttonIcon} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

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
    width: 40,
  },
  headerTitleContainer: {
    alignItems: 'center',
    flex: 1,
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
  headerRightSpace: {
    width: 40, // Match width of back button for symmetry
  },
  formContainer: {
    backgroundColor: '#FFF8E6', // Light cream/yellowish background
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateField: {
    width: '48%',
  },
  fieldLabel: {
    fontSize: 14,
    color: '#777777',
    marginBottom: 6,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    height: 45,
  },
  dateInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#333333',
  },
  calendarIcon: {
    padding: 10,
  },
  fieldContainer: {
    marginBottom: 16,
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
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionButton: {
    backgroundColor: '#E6A05F',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '48%',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginLeft: 8,
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