
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '@/config/firebase';

// Types pour les données de l'app
export interface UserProfile {
  id: string;
  userId: string;
  height: number;
  weight: number;
  age: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goals: string[];
  createdAt: string;
  updatedAt: string;
}

export interface NutritionEntry {
  id: string;
  userId: string;
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meals: any[];
  createdAt: string;
}

export interface WorkoutEntry {
  id: string;
  userId: string;
  date: string;
  type: string;
  duration: number;
  intensity: number;
  exercises: any[];
  createdAt: string;
}

export interface ProgressEntry {
  id: string;
  userId: string;
  date: string;
  steps: number;
  weight?: number;
  fatigue: number;
  sleepHours: number;
  createdAt: string;
}

// Fonctions génériques pour les collections
export async function createDocument(collectionName: string, data: any) {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error(`Erreur création document ${collectionName}:`, error);
    throw error;
  }
}

export async function updateDocument(collectionName: string, docId: string, data: any) {
  try {
    await updateDoc(doc(db, collectionName, docId), {
      ...data,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Erreur mise à jour document ${collectionName}:`, error);
    throw error;
  }
}

export async function deleteDocument(collectionName: string, docId: string) {
  try {
    await deleteDoc(doc(db, collectionName, docId));
  } catch (error) {
    console.error(`Erreur suppression document ${collectionName}:`, error);
    throw error;
  }
}

export async function getDocument(collectionName: string, docId: string) {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error(`Erreur récupération document ${collectionName}:`, error);
    throw error;
  }
}

export async function getUserDocuments(collectionName: string, userId: string) {
  try {
    const q = query(
      collection(db, collectionName),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error(`Erreur récupération documents utilisateur ${collectionName}:`, error);
    throw error;
  }
}

// Fonctions spécifiques pour l'application
export async function saveProgressEntry(userId: string, progressData: Omit<ProgressEntry, 'id' | 'userId' | 'createdAt'>) {
  return createDocument('progress', { ...progressData, userId });
}

export async function getTodayProgress(userId: string) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const q = query(
      collection(db, 'progress'),
      where('userId', '==', userId),
      where('date', '==', today)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as ProgressEntry;
    }
    return null;
  } catch (error) {
    console.error('Erreur récupération progrès du jour:', error);
    return null;
  }
}

export async function updateTodayProgress(userId: string, progressData: Partial<ProgressEntry>) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const existingProgress = await getTodayProgress(userId);
    
    if (existingProgress) {
      await updateDocument('progress', existingProgress.id, progressData);
    } else {
      await createDocument('progress', {
        ...progressData,
        userId,
        date: today,
        steps: 0,
        fatigue: 0,
        sleepHours: 0,
        ...progressData
      });
    }
  } catch (error) {
    console.error('Erreur mise à jour progrès:', error);
    throw error;
  }
}
