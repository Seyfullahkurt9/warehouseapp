import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar,
  ScrollView,
  FlatList
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';

export default function LoginHistoryScreen() {
  // Sample login history data
  const loginHistory = [
    {
      id: '1',
      dateTime: '13.04.2025 - 09:45',
      status: 'success',
    },
    {
      id: '2',
      dateTime: '12.04.2025 - 18:22',
      status: 'success',
    },
    {
      id: '3',
      dateTime: '11.04.2025 - 14:10',
      status: 'failed',
    },
    {
      id: '4',
      dateTime: '10.04.2025 - 08:55',
      status: 'success',
    },
    {
      id: '5',
      dateTime: '09.04.2025 - 16:33',
      status: 'failed',
    },
    {
      id: '6',
      dateTime: '08.04.2025 - 10:15',
      status: 'success',
    },
    {
      id: '7',
      dateTime: '07.04.2025 - 19:47',
      status: 'success',
    },
    {
      id: '8',
      dateTime: '06.04.2025 - 11:30',
      status: 'failed',
    },
  ];

  // Render individual login history item
  const renderLoginItem = ({ item }) => (
    <View style={styles.loginItem}>
      <Text style={styles.dateTimeText}>{item.dateTime}</Text>
      <Text style={item.status === 'success' ? styles.successText : styles.failedText}>
        {item.status === 'success' ? 'Başarılı giriş' : 'Başarısız giriş'}
      </Text>
    </View>
  );

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
            <Text style={styles.headerSubTitle}>Son Giriş Bilgilerim</Text>
          </View>
          
          <View style={styles.headerRight}>
            <View style={styles.calendarIconContainer}>
              <Feather name="calendar" size={20} color="#666666" />
            </View>
          </View>
        </View>

        {/* Login History List */}
        <FlatList
          data={loginHistory}
          renderItem={renderLoginItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
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
  calendarIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  loginItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dateTimeText: {
    fontSize: 15,
    color: '#666666',
  },
  successText: {
    fontSize: 15,
    color: '#4CAF50',
    fontWeight: '500',
  },
  failedText: {
    fontSize: 15,
    color: '#F44336',
    fontWeight: '500',
  },
});