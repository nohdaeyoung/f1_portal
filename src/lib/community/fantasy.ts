"use client";

import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface FantasySave {
  drivers: string[];
  teams: string[];
  updatedAt: unknown;
}

export async function loadFantasySave(uid: string): Promise<{ drivers: string[]; teams: string[] } | null> {
  try {
    const snap = await getDoc(doc(db, "fantasy", uid));
    if (!snap.exists()) return null;
    const data = snap.data() as FantasySave;
    return { drivers: data.drivers ?? [], teams: data.teams ?? [] };
  } catch {
    return null;
  }
}

export async function saveFantasy(uid: string, drivers: string[], teams: string[]): Promise<void> {
  await setDoc(doc(db, "fantasy", uid), {
    drivers,
    teams,
    updatedAt: serverTimestamp(),
  });
}
