import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthChange } from '../firebase/auth';
import { collection, query, where, getDocs, setDoc, doc } from "firebase/firestore";
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
      
      if (user) {
        // E-posta doğrulanmış mı kontrol et
        if (!user.emailVerified) {
          // Kullanıcıyı doğrulama sayfasına yönlendirebilirsiniz
          // veya kısıtlı bir görünüm sunabilirsiniz
          setEmailVerified(false);
        } else {
          setEmailVerified(true);
          setCurrentUser(user);
          await fetchAndUpdateUserData(user);
        }
      } else {
        // User is signed out
        setCurrentUser(null);
        setUserData(null);
        setIsAdmin(false);
        setEmailVerified(false);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Token değişikliklerini dinle
    const unsubscribeToken = onIdTokenChanged(auth, async (user) => {
      if (user) {
        try {
          // Token yenilendiğinde
          const token = await user.getIdToken();
          console.log("Token yenilendi");
          
          // Burada API istekleriniz için token'ı ayarlayabilirsiniz
          // Örneğin: AsyncStorage.setItem('userToken', token);
        } catch (error) {
          console.error("Token yenileme hatası:", error);
        }
      }
    });

    return () => unsubscribeToken();
  }, []);

  useEffect(() => {
    loadCachedUserData();
  }, []);

  const fetchAndUpdateUserData = async (user) => {
    try {
      const usersRef = collection(db, "Kullanicilar");
      const q = query(usersRef, where("eposta", "==", user.email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userDataFromDB = userDoc.data();
        
        // Context'i güncelle
        setUserData(userDataFromDB);
        setIsAdmin(userDataFromDB.yetki_id === "admin");
        
        // Önbellekte sakla
        await AsyncStorage.setItem('userData', JSON.stringify(userDataFromDB));
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const loadCachedUserData = async () => {
    try {
      const cachedData = await AsyncStorage.getItem('userData');
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        setUserData(parsedData);
        setIsAdmin(parsedData.yetki_id === "admin");
      }
    } catch (error) {
      console.error("Error loading cached data:", error);
    }
  };

  const updateUserData = async (newData) => {
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

  const value = {
    currentUser,
    userData,
    isAdmin,
    loading,
    emailVerified,
    updateUserData
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook for using auth context
export function useAuth() {
  return useContext(AuthContext);
}