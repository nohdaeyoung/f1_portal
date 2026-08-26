import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";

const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId:     process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  ...(databaseURL && { databaseURL }),
};

// API 키가 없으면 초기화 건너뜀 (빌드 환경에서 env 미설정 시 크래시 방지)
const app = firebaseConfig.apiKey
  ? (getApps().length ? getApps()[0] : initializeApp(firebaseConfig))
  : null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const auth    = app ? getAuth(app)      : null as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db      = app ? getFirestore(app) : null as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const storage = app ? getStorage(app)   : null as any;
// Realtime DB는 databaseURL 설정된 경우에만 초기화
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const rtdb    = (app && databaseURL) ? getDatabase(app) : null as any;
