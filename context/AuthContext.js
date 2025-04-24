import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthChange, auth, logout } from '../firebase/auth'; // auth'u burada import edin
import { collection, query, where, getDocs, setDoc, doc, getDoc, updateDoc } from "firebase/firestore";
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

  // Kullanıcı verilerini yükleme (onAuthChange tarafından çağrılır)
  const fetchAndUpdateUserData = async (user) => {
    try {
      console.log("Güncel kullanıcı (Auth State):", { // Log mesajını netleştirelim
        uid: user?.uid,
        email: user?.email
      });

      if (!user || !user.uid) { // UID kontrolü daha güvenli
        console.log("Kullanıcı UID bilgisi eksik, veri alınamıyor");
        setUserData(null); // Veri alınamıyorsa userData'yı temizle
        setIsAdmin(false);
        return; // return false yerine sadece return
      }

      // Firestore'dan UID ile veri çek
      const userDocRef = doc(db, "Kullanicilar", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userDataFromFirestore = userDocSnap.data(); // Yeni değişken ismi
        console.log("Kullanıcı UID ile bulundu (Auth State)", userDataFromFirestore);

        // Context'i güncelle
        setUserData(userDataFromFirestore);
        setIsAdmin(userDataFromFirestore.yetki_id === "admin");

        // --- BURAYA TAŞINAN GÜNCELLEME KONTROLÜ ---
        try {
          // Kullanıcı durumunu Firebase'den yeniden yükle
          await user.reload();
          const refreshedUser = auth.currentUser;

          // Kontrol edilecek değerleri logla
          console.log("E-posta güncelleme kontrolü (Auth State):", {
            authEmail: refreshedUser?.email,
            firestoreEmail: userDataFromFirestore?.eposta, // Doğru userData değişkenini kullan
            isVerified: refreshedUser?.emailVerified
          });

          // Firestore'u güncelleme kontrolü
          if (refreshedUser && userDataFromFirestore && refreshedUser.email !== userDataFromFirestore.eposta && refreshedUser.emailVerified) {
            console.log(`Auth e-postası (${refreshedUser.email}) Firestore e-posta alanından (${userDataFromFirestore.eposta}) farklı ve DOĞRULANMIŞ. Firestore güncelleniyor (Auth State)...`);
            try {
              // userDocRef zaten yukarıda tanımlı, tekrar kullanabiliriz
              await updateDoc(userDocRef, {
                eposta: refreshedUser.email
              });
              // Context'teki userData'yı da hemen güncelle
              setUserData(prevData => ({ ...prevData, eposta: refreshedUser.email }));
              console.log("Firestore e-posta alanı güncellendi (Auth State).");
            } catch (updateError) {
              console.error("Firestore e-posta güncellenirken hata (Auth State):", updateError);
            }
          }
        } catch (reloadError) {
          console.error("Kullanıcı durumu yeniden yüklenirken hata (Auth State):", reloadError);
        }
        // --- KONTROL SONU ---

        // Önbellekte sakla
        await AsyncStorage.setItem('userData', JSON.stringify(userDataFromFirestore));

      } else {
        console.log("Kullanıcı UID ile Firestore'da bulunamadı (Auth State)");
        setUserData(null); // Kullanıcı Firestore'da yoksa temizle
        setIsAdmin(false);
        // İsteğe bağlı: E-posta ile tekrar deneme burada da yapılabilir ama UID olmalı.
      }
    } catch (error) {
      console.error("Kullanıcı verisi alınırken hata oluştu (Auth State):", error);
      setUserData(null); // Hata durumunda temizle
      setIsAdmin(false);
    }
  }; // fetchAndUpdateUserData fonksiyonunun sonu

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

      // --- GÜNCELLEME KONTROLÜ ÖNCESİ ---
      try {
        // Kullanıcı durumunu Firebase'den yeniden yükle (emailVerified'ı güncellemek için)
        await user.reload();
        // Yeniden yüklenen kullanıcı nesnesini kullanmak daha güvenli olabilir
        const refreshedUser = auth.currentUser; // auth objesini import ettiğinizden emin olun

        // Kontrol edilecek değerleri logla
        console.log("E-posta güncelleme kontrolü:", {
          authEmail: refreshedUser?.email,
          firestoreEmail: userData?.eposta, // userData burada tanımlı mı? Dikkat!
          isVerified: refreshedUser?.emailVerified
        });

        // Auth e-postası ile Firestore e-postası farklıysa ve Auth e-postası doğrulanmışsa,
        // Firestore'u güncelle.
        // userData'nın bu kapsamda doğru olduğundan emin olunmalı.
        if (refreshedUser && userData && refreshedUser.email !== userData.eposta && refreshedUser.emailVerified) {
          console.log(`Auth e-postası (${refreshedUser.email}) Firestore e-posta alanından (${userData.eposta}) farklı ve DOĞRULANMIŞ. Firestore güncelleniyor...`);
          try {
            const userDocRef = doc(db, "Kullanicilar", refreshedUser.uid);
            await updateDoc(userDocRef, {
              eposta: refreshedUser.email // Firestore'u yeni e-posta ile güncelle
            });
            // Context'teki userData'yı da hemen güncelle
            setUserData(prevData => ({ ...prevData, eposta: refreshedUser.email }));
            console.log("Firestore e-posta alanı güncellendi.");
          } catch (updateError) {
            console.error("Firestore e-posta güncellenirken hata:", updateError);
          }
        }
      } catch (reloadError) {
        console.error("Kullanıcı durumu yeniden yüklenirken hata:", reloadError);
      }
      // --- KONTROL SONU ---

      // Önbellekte sakla
      await AsyncStorage.setItem('userData', JSON.stringify(userData));

      return true; // Fonksiyonun geri kalanı
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