import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin | F1 by 324.ing",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0D0D14] text-white">
      {children}
    </div>
  );
}
