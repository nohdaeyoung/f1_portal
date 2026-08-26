"use client";

import { useEffect, useRef, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { sessionSchedules } from "@/data/f1-data";
import {
  sendMessage,
  subscribeChat,
  type ChatMessageWithId,
} from "@/lib/community/chat";
import { ChatMessage } from "./ChatMessage";

/** GP 주말(목~일) 여부 체크: 해당 라운드의 FP1 시작 ~ 레이스 종료 */
function isGpWeekend(round: number): boolean {
  const schedule = sessionSchedules[round];
  if (!schedule) return false;

  const fp1Start = schedule.fp1 ? new Date(schedule.fp1) : null;
  const raceEnd = new Date(schedule.race);
  // 레이스 종료 후 3시간까지 채팅 유지
  raceEnd.setHours(raceEnd.getHours() + 3);

  const now = new Date();
  if (!fp1Start) return false;
  return now >= fp1Start && now <= raceEnd;
}

/** 다음 GP 주말 오픈 날짜 포맷 */
function getNextOpenDate(round: number): string {
  const schedule = sessionSchedules[round];
  if (!schedule?.fp1) return "다음 GP";
  return new Date(schedule.fp1).toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

interface ChatRoomProps {
  round: number;
}

export function ChatRoom({ round }: ChatRoomProps) {
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessageWithId[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auth 상태 구독
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return unsub;
  }, []);

  // GP 주말 여부 초기화
  useEffect(() => {
    setIsActive(isGpWeekend(round));
  }, [round]);

  // 실시간 채팅 구독
  useEffect(() => {
    if (!isActive) return;
    const unsub = subscribeChat(round, (msgs) => {
      setMessages(msgs);
    });
    return unsub;
  }, [round, isActive]);

  // 새 메시지 올 때마다 스크롤 하단 고정
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSend() {
    if (!user || !inputValue.trim() || sending) return;
    const body = inputValue.trim();
    setInputValue("");
    setSending(true);
    try {
      const nickname =
        user.displayName ?? user.email?.split("@")[0] ?? "익명";
      await sendMessage(round, user.uid, nickname, body);
    } catch (e) {
      console.error("채팅 전송 실패:", e);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (!isActive) {
    return (
      <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-6 text-center">
        <p className="text-[#64748B] text-sm">
          GP 채팅은 레이스 주말(목~일)에만 오픈됩니다.
        </p>
        <p className="text-[#94A3B8] text-xs mt-1">
          다음 오픈: {getNextOpenDate(round)}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl flex flex-col h-96">
      {/* 메시지 목록 */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#2D2D3A]"
      >
        {messages.length === 0 && (
          <p className="text-center text-[#64748B] text-sm pt-8">
            첫 메시지를 남겨보세요!
          </p>
        )}
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            currentUid={user?.uid ?? null}
          />
        ))}
      </div>

      {/* 입력창 */}
      <div className="border-t border-[#2D2D3A] p-3 flex gap-2">
        {user ? (
          <>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="메시지를 입력하세요..."
              maxLength={200}
              className="flex-1 bg-[#1E1E2E] border border-[#2D2D3A] rounded-lg px-3 py-2 text-sm text-white placeholder-[#64748B] focus:outline-none focus:border-[#E8002D] transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || sending}
              className="px-4 py-2 bg-[#E8002D] text-white text-sm font-medium rounded-lg hover:bg-[#C0001F] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              전송
            </button>
          </>
        ) : (
          <p className="flex-1 text-center text-[#64748B] text-sm py-1">
            채팅에 참여하려면 로그인하세요.
          </p>
        )}
      </div>
    </div>
  );
}
