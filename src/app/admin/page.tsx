"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, pw }),
      });
      if (res.ok) {
        router.push("/admin/dashboard");
      } else {
        setError("아이디 또는 비밀번호가 올바르지 않습니다.");
      }
    } catch {
      setError("서버 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-2xl font-black text-white">
            <span className="text-[#E8002D]">F1</span> by 324.ing
          </p>
          <p className="text-xs text-[#64748B] mt-1 uppercase tracking-widest">Admin</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[#141420] border border-[#2D2D3A] rounded-2xl p-6 space-y-4"
        >
          <div>
            <label className="block text-xs text-[#64748B] uppercase tracking-widest mb-1.5">
              아이디
            </label>
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="w-full bg-[#0D0D14] border border-[#2D2D3A] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#475569] focus:outline-none focus:border-[#E8002D] transition-colors"
              placeholder="ID"
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-[#64748B] uppercase tracking-widest mb-1.5">
              비밀번호
            </label>
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className="w-full bg-[#0D0D14] border border-[#2D2D3A] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#475569] focus:outline-none focus:border-[#E8002D] transition-colors"
              placeholder="Password"
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <p className="text-xs text-[#E8002D]">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#E8002D] hover:bg-[#C0001F] disabled:opacity-50 text-white font-bold text-sm rounded-lg px-4 py-2.5 transition-colors"
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>
      </div>
    </div>
  );
}
