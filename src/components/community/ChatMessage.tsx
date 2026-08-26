"use client";

import { type ChatMessageWithId } from "@/lib/community/chat";
import { UserAvatar } from "./UserAvatar";

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface ChatMessageProps {
  message: ChatMessageWithId;
  currentUid?: string | null;
}

export function ChatMessage({ message, currentUid }: ChatMessageProps) {
  const isMine = currentUid === message.uid;

  if (isMine) {
    return (
      <div className="flex items-end gap-2 justify-end">
        <span className="text-xs text-[#64748B] flex-shrink-0 mb-1">
          {formatTime(message.timestamp)}
        </span>
        <div className="max-w-[70%]">
          <div className="bg-[#E8002D] text-white text-sm rounded-2xl rounded-br-sm px-3 py-2 break-words">
            {message.body}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2">
      <UserAvatar uid={message.uid} nickname={message.nickname} size="sm" />
      <div className="max-w-[70%]">
        <span className="text-xs text-[#64748B] mb-1 block">
          {message.nickname}
        </span>
        <div className="bg-[#1E1E2E] border border-[#2D2D3A] text-[#E2E8F0] text-sm rounded-2xl rounded-tl-sm px-3 py-2 break-words">
          {message.body}
        </div>
      </div>
      <span className="text-xs text-[#64748B] flex-shrink-0 mt-auto mb-1">
        {formatTime(message.timestamp)}
      </span>
    </div>
  );
}
