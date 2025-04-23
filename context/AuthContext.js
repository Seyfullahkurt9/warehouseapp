import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthChange, auth, logout } from '../firebase/auth'; // auth'u burada import edin
import { collection, query, where, getDocs, setDoc, doc, getDoc } from "firebase/firestore";
import { db } from '../firebase/config';
import { onIdTokenChanged } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create context
export const AuthContext = createContext();

// Context provider component
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setLoading(true);
      console.log("Auth state changed, user:", user ? user.email : "null");
      
      if (user) {
        // Kullanıcı bilgilerini her zaman ayarla, emailVerified kontrolü yapmadan
        setCurrentUser(user);
        setEmailVerified(user.emailVerified);
        await fetchAndUpdateUserData(user);
      } else {
        // Kullanıcı çıkış yaptı
        setCurrentUser(null);
        setUserData(null);
        setIsAdmin(false);
        setEmailVerified(false);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Token değişikliklerini dinle
  useEffect(() => {
    if (!auth) return; // auth yoksa çalışma
    
    const unsubscribeToken = onIdTokenChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          console.log("Token yenilendi");
        } catch (error) {
          console.error("Token yenileme hatası:", error);
        }
      }
    });

    return () => unsubscribeToken();
  }, []);

  // Kullanıcı verilerini yükleme
  const fetchAndUpdateUserData = async (user) => {
    try {
      console.log("Güncel kullanıcı:", {
        uid: user?.uid,
        email: user?.email
      });
      
      if (!user || !user.email) {
        console.log("Kullanıcı bilgisi eksik, veri alınamıyor");
        return;
      }
      
      // İlk önce UID ile dene - bu daha güvenilir bir yöntem
      const userDocRef = doc(db, "Kullanicilar", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        console.log("Kullanıcı UID ile bulundu", userData);
        
        // Context'i güncelle
        setUserData(userData);
        setIsAdmin(userData.yetki_id === "admin");
        
        // Önbellekte sakla
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        return;
      }
      
      // UID ile bulunamadıysa, e-posta ile dene
      console.log("UID ile kullanıcı bulunamadı, e-posta ile deneniyor");
      const usersRef = collection(db, "Kullanicilar");
      const q = query(usersRef, where("eposta", "==", user.email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        console.log("Kullanıcı e-posta ile bulundu");
        
        // Context'i güncelle
        setUserData(userData);
        setIsAdmin(userData.yetki_id === "admin");
        
        // Önbellekte sakla
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
      } else {
        console.log("Kullanıcı hiçbir şekilde bulunamadı");
      }
    } catch (error) {
      console.error("Kullanıcı verisi alınırken hata oluştu:", error);
    }
  };

  // Yeni fonksiyon - Profilden erişilebilen veri yenileme fonksiyonu
  const fetchUserData = async (user) => {
    try {
      // Debug: Güncel kullanıcı bilgilerini yazdır
      console.log("Yeniden yüklenen kullanıcı:", {
        uid: user?.uid,
        email: user?.email,
        emailVerified: user?.emailVerified
      });

      if (!user || !user.email) {
        console.log("Kullanıcı bilgisi eksik, veri alınamıyor");
        return false;
      }
      
      console.log("Firestore'dan kullanıcı verisi tekrar çekiliyor:", user.email);
      
      // İlk yöntem: E-posta ile sorgulama
      let userData = null;
      const usersRef = collection(db, "Kullanicilar");
      const q = query(usersRef, where("eposta", "==", user.email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        userData = userDoc.data();
        console.log("Kullanıcı e-posta ile bulundu");
      } else {
        // İkinci yöntem: UID ile doğrudan belge kontrolü
        console.log("E-posta ile kullanıcı bulunamadı, UID ile deneniyor");
        const userDocRef = doc(db, "Kullanicilar", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          userData = userDocSnap.data();
          console.log("Kullanıcı UID ile bulundu");
        } else {
          console.log("Kullanıcı hiçbir şekilde bulunamadı");
          return false;
        }
      }
      
      // Context'i güncelle
      console.log("Kullanıcı verisi yenilendi:", userData);
      setUserData(userData);
      setIsAdmin(userData.yetki_id === "admin");
      
      // Önbellekte sakla
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      
      return true;
    } catch (error) {
      console.error("Kullanıcı verisi yenilenirken hata oluştu:", error);
      return false;
    }
  };

  // Önbellekten yükle
  const loadCachedUserData = async () => {
    try {
      const cachedData = await AsyncStorage.getItem('userData');
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        setUserData(parsedData);
        // Yetki kontrolü boş değer için güvenli hale getirildi
        setIsAdmin(parsedData.yetki_id === "admin");
        console.log("Önbellekten yüklenen veri:", parsedData);
      }
    } catch (error) {
      console.error("Önbellek okuma hatası:", error);
    }
  };

  const updateUserData = async (newData) => {
    if (!currentUser) return false;
    
    try {
      // Firestore'da güncelleme
      await setDoc(doc(db, "Kullanicilar", currentUser.uid), newData, { merge: true });
      
      // Context'i güncelle
      setUserData((prevData) => ({...prevData, ...newData}));
      
      // Önbelleği güncelle
      const updatedData = {...userData, ...newData};
      await AsyncStorage.setItem('userData', JSON.stringify(updatedData));
      
      return true;
    } catch (error) {
      console.error("Error updating user data:", error);
      return false;
    }
  };

  const handleLogout = async () => {
    try {
      // Firebase Auth'tan çıkış yap
      await logout();
      
      // AsyncStorage'dan kullanıcı verilerini temizle
      await AsyncStorage.removeItem('userData');
      
      // Context durumunu sıfırla
      setCurrentUser(null);
      setUserData(null);
      setIsAdmin(false);
      setEmailVerified(false);
      
      return true;
    } catch (error) {
      console.error("Logout error:", error);
      return false;
    }
  };

  const value = {
    currentUser,
    userData,
    isAdmin,
    loading,
    emailVerified,
    updateUserData,
    fetchUserData,  // Yeni eklenen fonksiyonu burada dışa açıyoruz
    logout: handleLogout  // Özel logout fonksiyonunu kullan
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook for using auth context
export function useAuth() {
  return useContext(AuthContext);
}

export default function UserHomeScreen() {
  const { isAdmin, currentUser, logout } = useAuth(); // Burada logout'u da alın
  
  const handleLogout = async () => {
    try {
      await logout(); // Hook'tan gelen logout fonksiyonunu doğrudan kullanın
      router.replace('/login');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };
  
  // ... geri kalan kodlar aynı
}