"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

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

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      const res = await fetch("/api/admin/google-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (res.ok) {
        router.push("/admin/dashboard");
      } else {
        const data = await res.json();
        if (data.error === "Unauthorized email") {
          setError("관리자 Google 계정이 아닙니다.");
        } else {
          setError("Google 로그인에 실패했습니다.");
        }
      }
    } catch (e) {
      console.error(e);
      setError("Google 로그인 중 오류가 발생했습니다.");
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

        <div className="bg-[#141420] border border-[#2D2D3A] rounded-2xl p-6 space-y-4">
          {/* Google 로그인 */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 disabled:opacity-50 text-gray-800 font-semibold text-sm rounded-lg px-4 py-2.5 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.6 2.5 30.1 0 24 0 14.7 0 6.7 5.4 2.7 13.3l7.8 6C12.3 13.1 17.7 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.5 2.9-2.2 5.3-4.7 6.9l7.3 5.7c4.3-3.9 6.7-9.7 6.7-16.6z"/>
              <path fill="#FBBC05" d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.9-6z"/>
              <path fill="#34A853" d="M24 48c6.1 0 11.2-2 14.9-5.4l-7.3-5.7c-2 1.4-4.6 2.1-7.6 2.1-6.3 0-11.6-3.6-13.5-9.3l-7.9 6C6.7 42.6 14.7 48 24 48z"/>
            </svg>
            Google로 로그인
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#2D2D3A]" />
            <span className="text-xs text-[#475569]">또는</span>
            <div className="flex-1 h-px bg-[#2D2D3A]" />
          </div>

          {/* ID/PW 로그인 */}
          <form onSubmit={handleSubmit} className="space-y-4">
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
    </div>
  );
}
