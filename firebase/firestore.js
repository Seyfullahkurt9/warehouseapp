import { collection, addDoc, getDoc, query, where, getDocs, updateDoc, doc, Timestamp, deleteDoc } from "firebase/firestore";
import { db } from './config';

// User related operations
export const createUserDocument = async (userData) => {
  try {
    const userDocRef = await addDoc(collection(db, "Kullanicilar"), {
      ...userData,
      createdAt: Timestamp.now()
    });
    return userDocRef;
  } catch (error) {
    throw error;
  }
};

export const logUserAction = async (userId, actionDesc) => {
  try {
    const actionRef = await addDoc(collection(db, "Eylemler"), {
      eylem_aciklamasi: actionDesc,
      eylem_tarihi: Timestamp.now(),
      kullanici_id: userId
    });
    return actionRef;
  } catch (error) {
    throw error;
  }
};

// Diğer Firestore işlemleri için fonksiyonlar ekleyebilirsiniz