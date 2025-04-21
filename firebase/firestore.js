import { collection, addDoc, doc, setDoc, Timestamp } from "firebase/firestore";
import { db } from './config';

// User related operations - kullanıcının auth uid'sini kullan
export const createUserDocument = async (userData, authUid) => {
  try {
    // addDoc yerine setDoc kullanarak, Firebase Auth ID'si ile eşleştir
    await setDoc(doc(db, "Kullanicilar", authUid), {
      ...userData,
      createdAt: Timestamp.now()
    });
    return doc(db, "Kullanicilar", authUid);
  } catch (error) {
    console.error("Error creating user document:", error);
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