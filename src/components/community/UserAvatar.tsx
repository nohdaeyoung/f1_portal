"use client";

type AvatarSize = "sm" | "md" | "lg";

const SIZE_CLASS: Record<AvatarSize, string> = {
  sm: "w-7 h-7 text-xs",
  md: "w-9 h-9 text-sm",
  lg: "w-12 h-12 text-base",
};

/** uid를 기반으로 결정론적 배경색 생성 */
function uidToColor(uid: string): string {
  const colors = [
    "bg-red-700",
    "bg-orange-600",
    "bg-amber-600",
    "bg-green-700",
    "bg-teal-600",
    "bg-blue-700",
    "bg-indigo-600",
    "bg-purple-700",
    "bg-pink-700",
  ];
  let hash = 0;
  for (let i = 0; i < uid.length; i++) {
    hash = uid.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

interface UserAvatarProps {
  uid: string;
  nickname: string;
  photoURL?: string | null;
  size?: AvatarSize;
}

export function UserAvatar({
  uid,
  nickname,
  photoURL,
  size = "md",
}: UserAvatarProps) {
  const sizeClass = SIZE_CLASS[size];
  const initial = nickname.charAt(0).toUpperCase() || "?";

  if (photoURL) {
    return (
      <img
        src={photoURL}
        alt={nickname}
        className={`${sizeClass} rounded-full object-cover flex-shrink-0`}
      />
    );
  }

  const bgColor = uidToColor(uid);
  return (
    <div
      className={`${sizeClass} ${bgColor} rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0 select-none`}
    >
      {initial}
    </div>
  );
}
