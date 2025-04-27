import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthChange, auth } from '../firebase/auth';
import { signOut } from 'firebase/auth'; // Direkt import edin
import { collection, query, where, getDocs, setDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from '../firebase/config';
import { onIdTokenChanged } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
// En üstte import ekleyin
import { router } from 'expo-router';

// Create context
export const AuthContext = createContext();
console.log("AuthContext: Context oluşturuldu"); // Log: Context oluşturma

// Context provider component
export function AuthProvider({ children }) {
  console.log("AuthProvider: Bileşen render ediliyor"); // Log: Bileşen render başlangıcı
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);

  useEffect(() => {
    console.log("AuthProvider: onAuthChange listener'ı ayarlanıyor"); // Log: Listener ayarlama
    const unsubscribe = onAuthChange(async (user) => {
      console.log("AuthProvider (onAuthChange): Auth state değişti, user:", user ? user.email : "null"); // Log: State değişimi
      setLoading(true);
      console.log("AuthProvider (onAuthChange): Loading true olarak ayarlandı"); // Log: Loading state

      if (user) {
        console.log("AuthProvider (onAuthChange): Kullanıcı giriş yaptı, state ayarlanıyor"); // Log: Kullanıcı giriş yaptı
        // Kullanıcı bilgilerini her zaman ayarla
        setCurrentUser(user);
        setEmailVerified(user.emailVerified);
        console.log("AuthProvider (onAuthChange): currentUser ve emailVerified ayarlandı"); // Log: State ayarlandı

        // Any operations here before fetchAndUpdateUserData completes
        // could cause permissions issues
        // ...

        try {
          console.log("AuthProvider (onAuthChange): fetchAndUpdateUserData çağrılıyor..."); // Log: Fonksiyon çağrısı
          const success = await fetchAndUpdateUserData(user);
          console.log("AuthProvider (onAuthChange): fetchAndUpdateUserData tamamlandı, success:", success); // Log: Fonksiyon tamamlandı

          if (success) {
            console.log("AuthProvider (onAuthChange): Kullanıcı bilgileri başarıyla güncellendi (fetchAndUpdateUserData başarılı)"); // Log: Başarı
            
            // Eylemlere log ekleme işlemini try-catch bloğu içine al
            try {
              console.log("AuthProvider (onAuthChange): Eylem loglama bloğu (şu an boş)"); // Log: Eylem loglama
              // Eylemler koleksiyonuna yazma kodu varsa buraya
              // ...
            } catch (logError) {
              console.error("AuthProvider (onAuthChange): Eylem log hatası, devam ediliyor:", logError); // Log: Eylem log hatası
              // Bu hatayı yut, uygulama akışını etkilemesin
            }
          } else {
            console.log("AuthProvider (onAuthChange): Kullanıcı bilgileri güncellenemedi (fetchAndUpdateUserData başarısız)"); // Log: Başarısızlık
          }
        } catch (authError) {
          console.error("AuthProvider (onAuthChange): fetchAndUpdateUserData içinde HATA:", authError); // Log: Hata
          // Bu hatayı da yut, çünkü kullanıcı zaten giriş yapmış durumda
        }
      } else {
        console.log("AuthProvider (onAuthChange): Kullanıcı çıkış yaptı, state temizleniyor"); // Log: Kullanıcı çıkış yaptı
        // Kullanıcı çıkış yaptı
        setCurrentUser(null);
        setUserData(null);
        setIsAdmin(false);
        setEmailVerified(false);
        console.log("AuthProvider (onAuthChange): State temizlendi"); // Log: State temizlendi
      }
      
      setLoading(false);
      console.log("AuthProvider (onAuthChange): Loading false olarak ayarlandı"); // Log: Loading state
    });

    console.log("AuthProvider: onAuthChange listener'ı ayarlandı, unsubscribe fonksiyonu dönülüyor"); // Log: Listener ayarlandı
    return () => {
      console.log("AuthProvider: onAuthChange listener'ı kaldırılıyor"); // Log: Listener kaldırma
      unsubscribe();
    };
  }, []);

  // Token değişikliklerini dinle
  useEffect(() => {
    console.log("AuthProvider: onIdTokenChanged listener'ı ayarlanıyor"); // Log: Token listener ayarlama
    if (!auth) {
      console.log("AuthProvider (onIdTokenChanged): Auth objesi yok, listener ayarlanmıyor"); // Log: Auth yok
      return;
    }
    
    const unsubscribeToken = onIdTokenChanged(auth, async (user) => {
      console.log("AuthProvider (onIdTokenChanged): Token state değişti, user:", user ? user.email : "null"); // Log: Token state değişimi
      if (user) {
        try {
          console.log("AuthProvider (onIdTokenChanged): getIdToken çağrılıyor..."); // Log: Token alma başlangıcı
          // SADECE token yenileme, başka işlem yok
          const token = await user.getIdToken();
          console.log("AuthProvider (onIdTokenChanged): Token yenilendi"); // Log: Token yenilendi
          
          // Aşağıdaki kodları tamamen yorum satırına alın
          try {
            console.log("AuthProvider (onIdTokenChanged): Ek Firestore sorgu bloğu (şu an yorumlu)"); // Log: Ek sorgu bloğu
          // Herhangi bir Firestore sorgusu veya işlemi
            // const someCollection = collection(db, "BirKoleksiyon");
            // ...diğer işlemler
           } catch (error) {
             console.error("AuthProvider (onIdTokenChanged): Ek Firestore sorgu hatası:", error); // Log: Ek sorgu hatası
           }
        } catch (error) {
          console.error("AuthProvider (onIdTokenChanged): Token yenileme hatası:", error); // Log: Token yenileme hatası
        }
      }
    });

    console.log("AuthProvider: onIdTokenChanged listener'ı ayarlandı, unsubscribe fonksiyonu dönülüyor"); // Log: Token listener ayarlandı
    return () => {
      console.log("AuthProvider: onIdTokenChanged listener'ı kaldırılıyor"); // Log: Token listener kaldırma
      unsubscribeToken();
    };
  }, []);

  // Kullanıcı verilerini yükleme (onAuthChange tarafından çağrılır)
  const fetchAndUpdateUserData = async (user) => {
    console.log("fetchAndUpdateUserData: Başladı"); // Log: Fonksiyon başlangıcı
    try {
      console.log("fetchAndUpdateUserData: Güncel kullanıcı (Auth State):", {
        uid: user?.uid,
        email: user?.email
      }); // Log: Kullanıcı bilgisi

      if (!user || !user.uid) {
        console.log("fetchAndUpdateUserData: Kullanıcı UID bilgisi eksik, veri alınamıyor"); // Log: UID eksik
        setUserData(null);
        setIsAdmin(false);
        return false;
      }
      
      // Comment out or check any potential operations here
      // ...

      // Firestore'dan kullanıcı belgesini almayı dene
      try {
        const userDocRef = doc(db, "Kullanicilar", user.uid);
        console.log("fetchAndUpdateUserData: DEBUG - userDocRef oluşturuldu:", userDocRef.path); // Log: Ref oluşturuldu

        console.log("fetchAndUpdateUserData: DEBUG - getDoc ÇAĞRISI BAŞLIYOR:", userDocRef.path); // Log: getDoc başlangıcı
        const userDocSnap = await getDoc(userDocRef);
        console.log("fetchAndUpdateUserData: DEBUG - getDoc ÇAĞRISI TAMAMLANDI:", userDocRef.path); // Log: getDoc tamamlandı

        console.log("fetchAndUpdateUserData: DEBUG - userDocSnap alındı"); // Log: Snap alındı

        if (userDocSnap.exists()) {
          console.log("fetchAndUpdateUserData: Kullanıcı Firestore'da bulundu"); // Log: Kullanıcı bulundu
          const userDataFromFirestore = userDocSnap.data();
          console.log("fetchAndUpdateUserData: Firestore verisi:", userDataFromFirestore); // Log: Firestore verisi
          setUserData(userDataFromFirestore);
          setIsAdmin(userDataFromFirestore.yetki_id === "admin");
          console.log("fetchAndUpdateUserData: Context state (userData, isAdmin) güncellendi"); // Log: State güncellendi
          
          // Önbellekte sakla
          console.log("fetchAndUpdateUserData: AsyncStorage'a kaydetme başlıyor..."); // Log: AsyncStorage başlangıcı
          await AsyncStorage.setItem('userData', JSON.stringify(userDataFromFirestore));
          console.log("fetchAndUpdateUserData: AsyncStorage'a kaydedildi"); // Log: AsyncStorage tamamlandı
          
          console.log("fetchAndUpdateUserData: Kullanıcı bilgileri başarıyla güncellendi (mevcut kullanıcı)"); // Log: Başarı
          return true;
        } else {
          // Kullanıcı kayıtlı değilse, otomatik kayıt oluştur
          console.log("fetchAndUpdateUserData: DEBUG - Kullanıcı Firestore'da bulunamadı, yeni kayıt oluşturuluyor..."); // Log: Yeni kayıt başlangıcı
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
          console.log("fetchAndUpdateUserData: Yeni kullanıcı verisi:", newUserData); // Log: Yeni veri
          
          // Kullanıcıyı kaydet
          console.log("fetchAndUpdateUserData: setDoc çağrılıyor (yeni kullanıcı)..."); // Log: setDoc başlangıcı
          await setDoc(doc(db, "Kullanicilar", user.uid), newUserData);
          console.log("fetchAndUpdateUserData: DEBUG - Yeni kullanıcı kaydı Firestore'a yazıldı."); // Log: setDoc tamamlandı
          // State'i güncelle
          setUserData(newUserData);
          setIsAdmin(false);
          console.log("fetchAndUpdateUserData: Context state (userData, isAdmin) güncellendi (yeni kullanıcı)"); // Log: State güncellendi
          
          // Önbelleğe kaydet
          console.log("fetchAndUpdateUserData: AsyncStorage'a kaydetme başlıyor (yeni kullanıcı)..."); // Log: AsyncStorage başlangıcı
          await AsyncStorage.setItem('userData', JSON.stringify(newUserData));
          console.log("fetchAndUpdateUserData: DEBUG - Yeni kullanıcı verisi AsyncStorage'a yazıldı."); // Log: AsyncStorage tamamlandı
          console.log("fetchAndUpdateUserData: Yeni kullanıcı başarıyla oluşturuldu ve güncellendi"); // Log: Başarı (yeni kullanıcı)
          return true; // Yeni kullanıcı da başarıyla oluşturuldu
        }
      } catch (firestoreError) {
        // Bu catch bloğuna özel bir log ekleyelim
        console.error("fetchAndUpdateUserData: DEBUG - Firestore getDoc/setDoc HATASI:", firestoreError); // Log: Firestore hatası
        
        // Kritik hata durumunda önbellek verilerini kontrol et
        try {
          console.log("fetchAndUpdateUserData: Firestore hatası sonrası önbellek kontrolü başlıyor..."); // Log: Önbellek kontrolü
          const cachedData = await AsyncStorage.getItem('userData');
          if (cachedData) {
            const parsedData = JSON.parse(cachedData);
            setUserData(parsedData);
            setIsAdmin(parsedData.yetki_id === "admin");
            console.log("fetchAndUpdateUserData: Önbellekten veri kullanıldı:", parsedData); // Log: Önbellek kullanıldı
            return true; // Önbellekten başarıyla yüklendi
          } else {
            console.log("fetchAndUpdateUserData: Önbellekte veri bulunamadı"); // Log: Önbellek boş
          }
        } catch (cacheError) {
          console.error("fetchAndUpdateUserData: Önbellek okuma hatası:", cacheError); // Log: Önbellek hatası
        }
        
        // Minimal bir kullanıcı nesnesi oluştur (Fallback)
        console.log("fetchAndUpdateUserData: Fallback kullanıcı verisi oluşturuluyor"); // Log: Fallback
        const fallbackData = {
          isim: "",
          soyisim: "",
          eposta: user.email || "",
          firma_id: "",
          yetki_id: "kullanici"
        };
        
        setUserData(fallbackData);
        setIsAdmin(false);
        console.log("fetchAndUpdateUserData: Fallback kullanıcı verisi ile state güncellendi"); // Log: Fallback state
        return false; // Hata oluştu ve önbellek de kullanılamadı
      }
    } catch (error) {
      console.error("fetchAndUpdateUserData: Genel HATA:", error); // Log: Genel hata
      return false;
    }
  }; // fetchAndUpdateUserData fonksiyonunun sonu

  // Yeni fonksiyon - Profilden erişilebilen veri yenileme fonksiyonu
  const fetchUserData = async (user) => {
    console.log("fetchUserData: Başladı"); // Log: Fonksiyon başlangıcı
    try {
      // Debug: Güncel kullanıcı bilgilerini yazdır
      console.log("fetchUserData: Yeniden yüklenen kullanıcı:", {
        uid: user?.uid,
        email: user?.email,
        emailVerified: user?.emailVerified
      }); // Log: Kullanıcı bilgisi

      if (!user || !user.email) {
        console.log("fetchUserData: Kullanıcı bilgisi eksik, veri alınamıyor"); // Log: Bilgi eksik
        return false;
      }
      
      console.log("fetchUserData: Firestore'dan kullanıcı verisi tekrar çekiliyor:", user.email); // Log: Firestore sorgu başlangıcı
      
      // İlk yöntem: E-posta ile sorgulama
      let userDataResult = null; // Değişken adını değiştirdim (scope çakışması olmasın diye)
      const usersRef = collection(db, "Kullanicilar");
      console.log("fetchUserData: E-posta ile sorgu oluşturuluyor..."); // Log: E-posta sorgusu
      const q = query(usersRef, where("eposta", "==", user.email));
      console.log("fetchUserData: getDocs çağrılıyor (e-posta ile)..."); // Log: getDocs başlangıcı
      const querySnapshot = await getDocs(q);
      console.log("fetchUserData: getDocs tamamlandı (e-posta ile)"); // Log: getDocs tamamlandı
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        userDataResult = userDoc.data();
        console.log("fetchUserData: Kullanıcı e-posta ile bulundu:", userDataResult); // Log: E-posta ile bulundu
      } else {
        // İkinci yöntem: UID ile doğrudan belge kontrolü
        console.log("fetchUserData: E-posta ile kullanıcı bulunamadı, UID ile deneniyor"); // Log: UID denemesi
        const userDocRef = doc(db, "Kullanicilar", user.uid);
        console.log("fetchUserData: getDoc çağrılıyor (UID ile)..."); // Log: getDoc başlangıcı
        const userDocSnap = await getDoc(userDocRef);
        console.log("fetchUserData: getDoc tamamlandı (UID ile)"); // Log: getDoc tamamlandı
        
        if (userDocSnap.exists()) {
          userDataResult = userDocSnap.data();
          console.log("fetchUserData: Kullanıcı UID ile bulundu:", userDataResult); // Log: UID ile bulundu
        } else {
          console.log("fetchUserData: Kullanıcı hiçbir şekilde bulunamadı"); // Log: Bulunamadı
          return false; // Kullanıcı bulunamadıysa false dön
        }
      }
      
      // Context'i güncelle
      console.log("fetchUserData: Context state güncelleniyor:", userDataResult); // Log: State güncelleme
      setUserData(userDataResult);
      setIsAdmin(userDataResult.yetki_id === "admin");
      console.log("fetchUserData: Context state güncellendi"); // Log: State güncellendi

      // --- GÜNCELLEME KONTROLÜ ÖNCESİ ---
      try {
        console.log("fetchUserData: user.reload() çağrılıyor..."); // Log: reload başlangıcı
        // Kullanıcı durumunu Firebase'den yeniden yükle (emailVerified'ı güncellemek için)
        await user.reload();
        console.log("fetchUserData: user.reload() tamamlandı"); // Log: reload tamamlandı
        // Yeniden yüklenen kullanıcı nesnesini kullanmak daha güvenli olabilir
        const refreshedUser = auth.currentUser; // auth objesini import ettiğinizden emin olun
        console.log("fetchUserData: refreshedUser alındı:", refreshedUser?.email); // Log: refreshedUser

        // Kontrol edilecek değerleri logla
        console.log("fetchUserData: E-posta güncelleme kontrolü:", {
          authEmail: refreshedUser?.email,
          firestoreEmail: userDataResult?.eposta,
          isVerified: refreshedUser?.emailVerified
        }); // Log: E-posta kontrolü

        // Auth e-postası ile Firestore e-postası farklıysa ve Auth e-postası doğrulanmışsa,
        // Firestore'u güncelle.
        if (refreshedUser && userDataResult && refreshedUser.email !== userDataResult.eposta && refreshedUser.emailVerified) {
          console.log(`fetchUserData: Auth e-posta (${refreshedUser.email}) Firestore e-posta alanından (${userDataResult.eposta}) farklı ve DOĞRULANMIŞ. Firestore güncelleniyor...`); // Log: E-posta farkı
          try {
            const userDocRef = doc(db, "Kullanicilar", refreshedUser.uid);
            console.log("fetchUserData: updateDoc çağrılıyor (e-posta güncelleme)..."); // Log: updateDoc başlangıcı
            await updateDoc(userDocRef, {
              eposta: refreshedUser.email // Firestore'u yeni e-posta ile güncelle
            });
            console.log("fetchUserData: updateDoc tamamlandı (e-posta güncelleme)"); // Log: updateDoc tamamlandı
            // Context'teki userData'yı da hemen güncelle
            setUserData(prevData => {
              const updated = { ...prevData, eposta: refreshedUser.email };
              console.log("fetchUserData: Context state (eposta) güncellendi:", updated); // Log: State e-posta güncelleme
              return updated;
            });
            console.log("fetchUserData: Firestore e-posta alanı güncellendi."); // Log: Başarı (e-posta güncelleme)
          } catch (updateError) {
            console.error("fetchUserData: Firestore e-posta güncellenirken hata:", updateError); // Log: E-posta güncelleme hatası
          }
        } else {
          console.log("fetchUserData: E-posta güncellemesi gerekmiyor veya koşullar sağlanmadı"); // Log: Güncelleme gerekmiyor
        }
      } catch (reloadError) {
        console.error("fetchUserData: Kullanıcı durumu yeniden yüklenirken hata:", reloadError); // Log: reload hatası
      }
      // --- KONTROL SONU ---

      // Önbellekte sakla
      console.log("fetchUserData: AsyncStorage'a kaydetme başlıyor..."); // Log: AsyncStorage başlangıcı
      await AsyncStorage.setItem('userData', JSON.stringify(userDataResult));
      console.log("fetchUserData: AsyncStorage'a kaydedildi"); // Log: AsyncStorage tamamlandı

      console.log("fetchUserData: Başarıyla tamamlandı"); // Log: Fonksiyon sonu (başarılı)
      return true; // Fonksiyonun geri kalanı
    } catch (error) {
      console.error("fetchUserData: Genel HATA:", error); // Log: Genel hata
      return false;
    }
  };

  // Önbellekten yükle
  const loadCachedUserData = async () => {
    console.log("loadCachedUserData: Başladı"); // Log: Fonksiyon başlangıcı
    try {
      console.log("loadCachedUserData: AsyncStorage'dan veri okunuyor..."); // Log: AsyncStorage okuma
      const cachedData = await AsyncStorage.getItem('userData');
      if (cachedData) {
        console.log("loadCachedUserData: Önbellekte veri bulundu"); // Log: Önbellek bulundu
        const parsedData = JSON.parse(cachedData);
        console.log("loadCachedUserData: Önbellekten yüklenen veri:", parsedData); // Log: Önbellek verisi
        setUserData(parsedData);
        // Yetki kontrolü boş değer için güvenli hale getirildi
        setIsAdmin(parsedData.yetki_id === "admin");
        console.log("loadCachedUserData: Context state (userData, isAdmin) güncellendi"); // Log: State güncellendi
      } else {
        console.log("loadCachedUserData: Önbellekte veri bulunamadı"); // Log: Önbellek boş
      }
      // Check if there are any Firestore calls here
    } catch (error) {
      console.error("loadCachedUserData: Önbellek okuma hatası:", error); // Log: Önbellek hatası
    }
    console.log("loadCachedUserData: Tamamlandı"); // Log: Fonksiyon sonu
  };

  const updateUserData = async (newData) => {
    console.log("updateUserData: Başladı, newData:", newData); // Log: Fonksiyon başlangıcı
    if (!currentUser) {
      console.log("updateUserData: currentUser yok, işlem yapılamıyor"); // Log: Kullanıcı yok
      return false;
    }
    
    try {
      console.log("updateUserData: Firestore'da güncelleme başlıyor..."); // Log: Firestore güncelleme başlangıcı
      // Firestore'da güncelleme
      await setDoc(doc(db, "Kullanicilar", currentUser.uid), newData, { merge: true });
      console.log("updateUserData: Firestore'da güncelleme tamamlandı"); // Log: Firestore güncelleme tamamlandı
      
      // Context'i güncelle
      console.log("updateUserData: Context state güncelleniyor..."); // Log: State güncelleme
      setUserData((prevData) => {
        const updatedData = {...prevData, ...newData};
        console.log("updateUserData: Yeni state verisi:", updatedData); // Log: Yeni state
        // isAdmin değerini özel olarak güncelle
        setIsAdmin(updatedData.yetki_id === "admin");
        console.log("updateUserData: isAdmin state güncellendi:", updatedData.yetki_id === "admin"); // Log: isAdmin güncelleme
        return updatedData;
      });
      
      // Önbelleği güncelle
      console.log("updateUserData: AsyncStorage güncelleniyor..."); // Log: AsyncStorage güncelleme
      const updatedDataForCache = {...userData, ...newData}; // userData'nın güncel halini kullanmak daha doğru olabilir ama state update sonrası hemen yansımayabilir.
      await AsyncStorage.setItem('userData', JSON.stringify(updatedDataForCache));
      console.log("updateUserData: AsyncStorage güncellendi"); // Log: AsyncStorage tamamlandı
      
      console.log("updateUserData: Başarıyla tamamlandı"); // Log: Başarı
      return true;
    } catch (error) {
      console.error("updateUserData: HATA:", error); // Log: Hata
      return false;
    }
  };

  const handleLogout = async () => {
    console.log("handleLogout: Başladı"); // Log: Fonksiyon başlangıcı
    try {
      console.log("handleLogout: AsyncStorage temizleniyor..."); // Log: AsyncStorage temizleme
      try {
        // Önce AsyncStorage'i tamamen temizle
        await AsyncStorage.clear();
        console.log("handleLogout: AsyncStorage tamamen temizlendi"); // Log: AsyncStorage temizlendi
      } catch (storageError) {
        console.error("handleLogout: AsyncStorage temizleme hatası:", storageError); // Log: AsyncStorage hatası
      }
      
      console.log("handleLogout: Firebase signOut çağrılıyor..."); // Log: signOut başlangıcı
      // Firebase'den çıkış yap
      await signOut(auth);
      console.log("handleLogout: Firebase auth'tan çıkış yapıldı"); // Log: signOut tamamlandı
      
      // State'i temizle
      console.log("handleLogout: Context state temizleniyor..."); // Log: State temizleme
      setCurrentUser(null);
      setUserData(null);
      setIsAdmin(false);
      setEmailVerified(false);
      console.log("handleLogout: Context state temizlendi"); // Log: State temizlendi
      
      try {
        console.log("handleLogout: Yönlendirme deneniyor (/) ..."); // Log: Yönlendirme denemesi
        // Ana sayfaya yönlendirmeyi dene, hata olursa yut
        if (typeof router !== 'undefined' && router.replace) {
          router.replace('/');
          console.log("handleLogout: Yönlendirme başarılı (/)"); // Log: Yönlendirme başarılı
        } else {
          console.log("handleLogout: Router objesi bulunamadı, yönlendirme yapılamıyor"); // Log: Router yok
        }
      } catch (routerError) {
        console.error("handleLogout: Yönlendirme hatası:", routerError); // Log: Yönlendirme hatası
      }
      
      console.log("handleLogout: Başarıyla tamamlandı"); // Log: Başarı
      return true;
    } catch (error) {
      console.error("handleLogout: HATA:", error); // Log: Hata
      return false; // Hata fırlatmak yerine false döndür
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
  console.log("AuthProvider: Context değeri oluşturuldu:", value); // Log: Context değeri

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook for using auth context
export function useAuth() {
  // console.log("useAuth: Hook çağrıldı"); // Bu çok fazla log üretebilir, dikkatli kullanın
  return useContext(AuthContext);
}

// Bu kısım muhtemelen başka bir dosyada olmalı, UserHomeScreen gibi.
// Eğer buradaysa, export default AuthProvider olmalı.
// export default function UserHomeScreen() {
//   const { isAdmin, currentUser, logout } = useAuth(); // Burada logout'u da alın
  
//   const handleLogout = async () => {
//     try {
//       await logout(); // Hook'tan gelen logout fonksiyonunu doğrudan kullanın
//       router.replace('/login');
//     } catch (error) {
//       console.error("Logout error:", error);
//     }
//   };
  
//   // ... geri kalan kodlar aynı
// }