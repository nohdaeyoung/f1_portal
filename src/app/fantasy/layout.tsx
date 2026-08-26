import { AuthProvider } from "@/lib/community/AuthContext";
import type { ReactNode } from "react";

export default function FantasyLayout({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
