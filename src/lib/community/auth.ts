"use client";

import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export type { User };

export interface Profile {
  uid: string;
  nickname: string;
  avatarUrl: string | null;
  isBot: boolean;
  createdAt: unknown;
}

/** Google 팝업 로그인 + 프로필 자동 생성 */
export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  const { user } = await signInWithPopup(auth, provider);
  await ensureProfile(user);
  return user;
}

/** 로그아웃 */
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

/** Firestore profiles 문서 없으면 생성 */
async function ensureProfile(user: User): Promise<void> {
  const ref = doc(db, "profiles", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      nickname: user.displayName ?? `팬_${user.uid.slice(0, 6)}`,
      avatarUrl: user.photoURL ?? null,
      isBot: false,
      createdAt: serverTimestamp(),
    } satisfies Omit<Profile, "createdAt"> & { createdAt: unknown });
  }
}

/** Auth 상태 구독 */
export function subscribeAuth(cb: (user: User | null) => void) {
  return onAuthStateChanged(auth, cb);
}
