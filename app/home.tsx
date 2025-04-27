import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, StatusBar, Alert, ActivityIndicator, BackHandler } from 'react-native';
import { router } from 'expo-router';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useFocusEffect } from '@react-navigation/native';

export default function HomeScreen() {
  const { isAdmin, currentUser, userData, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Geri tuşu davranışını kontrol etme
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        // Eğer firma ID'si varsa, geri tuşuna basınca çıkış yapmadan ana sayfada kal
        if (userData?.firma_id) {
          return true; // Geri gitme işlemini engelle
        }
        return false; // Varsayılan davranışa izin ver
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      
      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [userData?.firma_id])
  );
  
  const handleLogout = async () => {
    try {
      setLoading(true);
      console.log("Logout işlemi başladı...");
      
      // İsteğe bağlı: Önce çıkış kaydı oluştur
      try {
        if (currentUser?.uid) {
          const timestamp = new Date().getTime();
          const randomId = Math.random().toString(36).substring(2, 10);
          const uniqueId = `${timestamp}_${randomId}`;
          
          const logoutRecordRef = doc(db, "Giris_Kayitlari", uniqueId);
          await setDoc(logoutRecordRef, {
            eylem_tarihi: new Date(), // Veya serverTimestamp()
            eylem_turu: "çıkış",
            durumu: "başarılı",
            kullanici_id: currentUser.uid,
            firma_id: userData?.firma_id || '',
          });
          console.log("Çıkış kaydı oluşturuldu");
        }
      } catch (logError) {
        console.error("Çıkış kaydı oluşturulurken hata:", logError);
      }
      
      // AuthContext'teki logout fonksiyonunu çağır
      const success = await logout();
      console.log("AuthContext logout tamamlandı:", success);
      
    } catch (error) {
      console.error("Logout error in component:", error);
      Alert.alert("Hata", "Çıkış yapılırken bir sorun oluştu.");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>TRACKIT</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton}>
              <Feather name="bell" size={24} color="#666666" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.iconButton} 
              onPress={handleLogout}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#666666" />
              ) : (
                <Feather name="power" size={24} color="#666666" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Grid Menu */}
        <View style={styles.gridContainer}>
          <View style={styles.gridRow}>
            <TouchableOpacity 
              style={styles.gridCard}
              onPress={() => router.push('/product-entry')}
            >
              <View style={styles.cardContent}>
                <Feather name="box" size={40} color="#666666" />
                <MaterialIcons name="arrow-downward" size={20} color="#666666" style={styles.overlayIcon} />
                <Text style={styles.cardText}>HİZMET/{'\n'}ÜRÜNLER{'\n'}GİRİŞİ</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.gridCard}
              onPress={() => router.push('/product-exit')}
            >
              <View style={styles.cardContent}>
                <Feather name="box" size={40} color="#666666" />
                <MaterialIcons name="arrow-upward" size={20} color="#666666" style={styles.overlayIcon} />
                <Text style={styles.cardText}>HİZMET/{'\n'}ÜRÜNLER{'\n'}ÇIKIŞI</Text>
              </View>
            </TouchableOpacity>
          </View>
          
          <View style={styles.gridRow}>
            <TouchableOpacity 
              style={styles.gridCard}
              onPress={() => router.push('/orders')}
            >
              <View style={styles.cardContent}>
                <Feather name="shopping-cart" size={40} color="#666666" />
                <Text style={styles.cardText}>SİPARİŞLER</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.gridCard}
              onPress={() => router.push('/stocks')}
            >
              <View style={styles.cardContent}>
                <Feather name="package" size={40} color="#666666" />
                <Text style={styles.cardText}>STOKLAR</Text>
              </View>
            </TouchableOpacity>
          </View>
          
          <View style={styles.gridRow}>
            <TouchableOpacity 
              style={styles.gridCard}
              onPress={() => router.push('/suppliers')}
            >
              <View style={styles.cardContent}>
                <Feather name="users" size={40} color="#666666" />
                <Text style={styles.cardText}>TEDARİKÇİLER</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.gridCard}
              onPress={() => router.push('/customers')}
            >
              <View style={styles.cardContent}>
                <Feather name="user-check" size={40} color="#666666" />
                <Text style={styles.cardText}>MÜŞTERİLER</Text>
              </View>
            </TouchableOpacity>
          </View>
          
          <View style={styles.gridRow}>
            <TouchableOpacity 
              style={[styles.gridCard, styles.fullWidthCard]}  // fullWidthCard stili eklendi
              onPress={() => router.push('/warehouses')}
            >
              <View style={styles.cardContent}>
                <Feather name="home" size={40} color="#666666" />
                <Text style={styles.cardText}>DEPOLAR</Text>
              </View>
            </TouchableOpacity>
            
            {/* Boş kart kaldırıldı */}
          </View>
        </View>
        
        {/* Admin Button - only show if user is admin */}
        {isAdmin && (
          <TouchableOpacity 
            style={styles.adminCornerButton}
            onPress={() => router.push('/admin-home')}
          >
            <View style={styles.adminButtonContent}>
              <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
              <Text style={styles.adminButtonText}>Admin Panel</Text>
            </View>
          </TouchableOpacity>
        )}
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
          
          <TouchableOpacity style={styles.tabItem}>
            <Ionicons name="home" size={26} color="#E6A05F" />
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
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222222',
  },
  headerIcons: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 8,
    marginLeft: 10,
  },
  gridContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  gridCard: {
    width: '48%',
    height: 140,
    backgroundColor: 'white',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 10,
    elevation: 3, // for Android
    shadowColor: '#000', // for iOS
    shadowOffset: { width: 0, height: 2 }, // for iOS
    shadowOpacity: 0.1, // for iOS
    shadowRadius: 4, // for iOS
    justifyContent: 'center',
  },
  cardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  overlayIcon: {
    position: 'absolute',
    top: 30,
    right: 42,
  },
  cardText: {
    marginTop: 15,
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    textAlign: 'center',
  },
  // New Admin Corner Button Styles
  adminCornerButton: {
    position: 'absolute',
    bottom: 80, // Positioned above the tab bar
    left: 0,
    backgroundColor: '#E6A05F',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 999,
  },
  adminButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 5,
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
  fullWidthCard: {
    width: '100%',
  },
});
