import { AuthProvider } from "@/lib/community/AuthContext";
import type { ReactNode } from "react";

export default function CommunityLayout({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
