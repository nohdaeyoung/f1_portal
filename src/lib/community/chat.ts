import {
  ref,
  push,
  query,
  limitToLast,
  onValue,
  off,
  type DatabaseReference,
} from "firebase/database";
import { rtdb } from "@/lib/firebase";

export interface ChatMessage {
  uid: string;
  nickname: string;
  body: string;
  timestamp: number;
}

export interface ChatMessageWithId extends ChatMessage {
  id: string;
}

/** 채팅 메시지 전송 (Realtime DB: chat/{round}/{messageId}) */
export async function sendMessage(
  round: number,
  uid: string,
  nickname: string,
  body: string
): Promise<void> {
  const chatRef = ref(rtdb, `chat/${round}`);
  await push(chatRef, {
    uid,
    nickname,
    body: body.slice(0, 200), // 최대 200자
    timestamp: Date.now(),
  });
}

/** 실시간 채팅 구독 (limitToLast로 최신 N개) */
export function subscribeChat(
  round: number,
  callback: (messages: ChatMessageWithId[]) => void,
  limit: number = 100
): () => void {
  const chatRef = ref(rtdb, `chat/${round}`);
  const chatQuery = query(chatRef, limitToLast(limit));

  const listener = onValue(chatQuery, (snapshot) => {
    const messages: ChatMessageWithId[] = [];
    snapshot.forEach((child) => {
      messages.push({
        id: child.key!,
        ...(child.val() as ChatMessage),
      });
    });
    callback(messages);
  });

  // unsubscribe 함수 반환
  return () => off(chatQuery as unknown as DatabaseReference, "value", listener);
}
