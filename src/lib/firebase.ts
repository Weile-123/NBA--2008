import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';
import { RetiredPlayerRecord } from '../types';
import { validateSensitiveName } from '../utils/sensitiveWords';

interface FirebaseAppletConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  firestoreDatabaseId?: string;
}

const firebaseConfig: FirebaseAppletConfig = firebaseConfigData || {
  apiKey: "AIzaSyD-mock-key-12345",
  authDomain: "cloud-dev-ai-studio-applet-web.firebaseapp.com",
  projectId: "cloud-dev-ai-studio-applet-web",
  storageBucket: "cloud-dev-ai-studio-applet-web.firebasestorage.app",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

const isMockConfig =
  !firebaseConfig.apiKey ||
  firebaseConfig.apiKey.includes('mock-key') ||
  firebaseConfig.projectId === 'cloud-dev-ai-studio-applet-web';

let app: any = null;
let db: any = null;

if (!isMockConfig) {
  try {
    app = initializeApp(firebaseConfig);
    db = firebaseConfig.firestoreDatabaseId
      ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
      : getFirestore(app);
  } catch (err) {
    console.warn('Firebase init warning:', err);
  }
}

const GLOBAL_HOF_COLLECTION = 'global_hall_of_fame';
const LOCAL_GLOBAL_FALLBACK_KEY = 'nba2k_global_hall_of_fame_fallback';

// Timeout helper to prevent getDocs hanging indefinitely
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Firestore request timed out')), timeoutMs)
    ),
  ]);
}

// Upload retired legend to Firestore Global Hall of Fame
export async function uploadToGlobalHallOfFame(record: RetiredPlayerRecord): Promise<boolean> {
  // First, save to local fallback array so it is preserved even offline
  try {
    const existingStr = localStorage.getItem(LOCAL_GLOBAL_FALLBACK_KEY);
    const existingList: RetiredPlayerRecord[] = existingStr ? JSON.parse(existingStr) : [];
    if (!existingList.some((r) => r.id === record.id)) {
      existingList.push(record);
      localStorage.setItem(LOCAL_GLOBAL_FALLBACK_KEY, JSON.stringify(existingList));
    }
  } catch (e) {
    console.error('Local fallback save error:', e);
  }

  if (!db || isMockConfig) return false;

  try {
    const docRef = doc(db, GLOBAL_HOF_COLLECTION, record.id);
    await withTimeout(
      setDoc(docRef, {
        ...record,
        uploadedAt: Date.now(),
      }),
      3000
    );
    return true;
  } catch (err) {
    console.warn('Failed to upload to Firestore global hall of fame, saved to local cache:', err);
    return false;
  }
}

export class GlobalHofTimeoutError extends Error {
  constructor(message = 'Firestore request timed out') {
    super(message);
    this.name = 'GlobalHofTimeoutError';
  }
}

// Fetch global legend records sorted by goatScore desc
export async function fetchGlobalHallOfFame(timeoutMs = 3500): Promise<RetiredPlayerRecord[]> {
  const filterValidRecords = (list: RetiredPlayerRecord[]): RetiredPlayerRecord[] => {
    return list.filter((item) => {
      const name = item.player?.name;
      if (!name) return false;
      const targetBadNames = ['阴蒂', '阴囊', '阴茎', '白带'];
      if (targetBadNames.some((bad) => name.includes(bad))) return false;
      return validateSensitiveName(name).isValid;
    });
  };

  if (db && !isMockConfig) {
    try {
      const q = query(
        collection(db, GLOBAL_HOF_COLLECTION),
        orderBy('goatScore', 'desc'),
        limit(100)
      );
      const querySnapshot = await withTimeout(getDocs(q), timeoutMs);
      const firestoreRecords: RetiredPlayerRecord[] = [];
      querySnapshot.forEach((docSnap: any) => {
        firestoreRecords.push(docSnap.data() as RetiredPlayerRecord);
      });
      return filterValidRecords(firestoreRecords);
    } catch (err: any) {
      if (err?.message?.includes('timed out') || err?.name === 'GlobalHofTimeoutError') {
        console.warn('Fetch from Firestore global hall of fame timed out');
        throw new GlobalHofTimeoutError(err?.message || 'Firestore request timed out');
      }
      console.warn('Failed to fetch from Firestore global hall of fame, fallback to offline uploaded list:', err);
    }
  }

  // Fallback to locally stored global submissions when offline/mock/error
  try {
    const fallbackStr = localStorage.getItem(LOCAL_GLOBAL_FALLBACK_KEY);
    const fallbackList: RetiredPlayerRecord[] = fallbackStr ? JSON.parse(fallbackStr) : [];
    fallbackList.sort((a, b) => (b.goatScore || 0) - (a.goatScore || 0));
    return filterValidRecords(fallbackList);
  } catch (e) {
    return [];
  }
}
