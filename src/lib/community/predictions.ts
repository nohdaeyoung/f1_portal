import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Prediction {
  userId: string;
  round: number;
  year: number;
  p1: string;
  p2: string;
  p3: string;
  fastestLap: string;
  safetyCar: boolean;
  score: number | null;
  createdAt: Timestamp;
}

export interface LeaderboardEntry {
  userId: string;
  nickname: string;
  totalScore: number;
  roundScore: number | null;
}

/** 예측 제출 (Firestore: predictions/{uid}_{round}) */
export async function createPrediction(data: {
  userId: string;
  round: number;
  year: number;
  p1: string;
  p2: string;
  p3: string;
  fastestLap: string;
  safetyCar: boolean;
}): Promise<void> {
  const docId = `${data.userId}_${data.round}`;
  await setDoc(doc(db, "predictions", docId), {
    ...data,
    score: null,
    createdAt: serverTimestamp(),
  });
}

/** 특정 유저의 라운드 예측 조회 */
export async function getPrediction(
  userId: string,
  round: number
): Promise<Prediction | null> {
  const docId = `${userId}_${round}`;
  const snap = await getDoc(doc(db, "predictions", docId));
  if (!snap.exists()) return null;
  return snap.data() as Prediction;
}

/** 라운드별 리더보드 조회 */
export async function getLeaderboard(
  round: number
): Promise<LeaderboardEntry[]> {
  const q = query(
    collection(db, "predictions"),
    where("round", "==", round),
    orderBy("score", "desc")
  );
  const snap = await getDocs(q);

  const entries: LeaderboardEntry[] = [];
  for (const docSnap of snap.docs) {
    const data = docSnap.data() as Prediction & { nickname?: string };
    // 점수가 채점된 항목만 리더보드에 포함
    if (data.score !== null) {
      // 시즌 누적 점수 계산
      const seasonQ = query(
        collection(db, "predictions"),
        where("userId", "==", data.userId),
        where("year", "==", data.year)
      );
      const seasonSnap = await getDocs(seasonQ);
      const totalScore = seasonSnap.docs.reduce((sum, d) => {
        const s = d.data().score as number | null;
        return sum + (s ?? 0);
      }, 0);

      entries.push({
        userId: data.userId,
        nickname: data.nickname ?? data.userId,
        totalScore,
        roundScore: data.score,
      });
    }
  }

  return entries.sort((a, b) => b.roundScore! - a.roundScore!);
}
