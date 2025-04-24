import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthChange, auth } from '../firebase/auth';
import { signOut } from 'firebase/auth'; // Direkt import edin
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
        // Kullanıcı bilgilerini her zaman ayarla
        setCurrentUser(user);
        setEmailVerified(user.emailVerified);
        const success = await fetchAndUpdateUserData(user);
        
        // Önceki UX sorununu çöz
        if (success) {
          console.log("Kullanıcı bilgileri başarıyla güncellendi");
        } else {
          console.log("Kullanıcı bilgileri güncellenemedi");
          // Çıkış yapma mesajını kaldırın veya değiştirin
        }
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
      console.log("Güncel kullanıcı (Auth State):", {
        uid: user?.uid,
        email: user?.email
      });

      if (!user || !user.uid) {
        console.log("Kullanıcı UID bilgisi eksik, veri alınamıyor");
        setUserData(null);
        setIsAdmin(false);
        return false;
      }

      // Firestore'dan kullanıcı belgesini almayı dene
      try {
        const userDocRef = doc(db, "Kullanicilar", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userDataFromFirestore = userDocSnap.data();
          setUserData(userDataFromFirestore);
          setIsAdmin(userDataFromFirestore.yetki_id === "admin");
          
          // Önbellekte sakla
          await AsyncStorage.setItem('userData', JSON.stringify(userDataFromFirestore));
          
          console.log("Kullanıcı bilgileri başarıyla güncellendi");
          return true;
        } else {
          // Kullanıcı kayıtlı değilse, otomatik kayıt oluştur
          console.log("Kullanıcı UID ile Firestore'da bulunamadı, yeni kayıt oluşturuluyor...");
          
          const newUserData = {
            isim: "",
            soyisim: "",
            eposta: user.email || "",
            telefon: "",
            is_unvani: "",
            firma_id: "",
            yetki_id: "kullanici",
            createdAt: new Date()
          };
          
          // Kullanıcıyı kaydet
          await setDoc(doc(db, "Kullanicilar", user.uid), newUserData);
          
          // State'i güncelle
          setUserData(newUserData);
          setIsAdmin(false);
          
          // Önbelleğe kaydet
          await AsyncStorage.setItem('userData', JSON.stringify(newUserData));
          
          console.log("Yeni kullanıcı kaydı oluşturuldu");
          return true;
        }
      } catch (firestoreError) {
        console.error("Firestore erişim hatası:", firestoreError);
        
        // Kritik hata durumunda önbellek verilerini kontrol et
        try {
          const cachedData = await AsyncStorage.getItem('userData');
          if (cachedData) {
            const parsedData = JSON.parse(cachedData);
            setUserData(parsedData);
            setIsAdmin(parsedData.yetki_id === "admin");
            console.log("Önbellekten veri kullanıldı:", parsedData);
            return true;
          }
        } catch (cacheError) {
          console.error("Önbellek okuma hatası:", cacheError);
        }
        
        // Minimal bir kullanıcı nesnesi oluştur
        const fallbackData = {
          isim: "",
          soyisim: "",
          eposta: user.email || "",
          firma_id: "",
          yetki_id: "kullanici"
        };
        
        setUserData(fallbackData);
        setIsAdmin(false);
        return false;
      }
    } catch (error) {
      console.error("Kullanıcı verisi işlenirken beklenmeyen hata:", error);
      return false;
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
      setUserData((prevData) => {
        const updatedData = {...prevData, ...newData};
        // isAdmin değerini özel olarak güncelle
        setIsAdmin(updatedData.yetki_id === "admin");
        return updatedData;
      });
      
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
      console.log("Logout işlemi başlatıldı...");
      
      // Önce AsyncStorage'i tamamen temizle
      await AsyncStorage.clear();
      console.log("AsyncStorage tamamen temizlendi");
      
      // Firebase'den çıkış yap
      await signOut(auth);
      console.log("Firebase auth'tan çıkış yapıldı");
      
      // State'i temizle
      setCurrentUser(null);
      setUserData(null);
      setIsAdmin(false);
      setEmailVerified(false);
      
      return true;
    } catch (error) {
      console.error("Logout hatası:", error);
      throw error;
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