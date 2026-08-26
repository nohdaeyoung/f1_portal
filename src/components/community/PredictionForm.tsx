"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { drivers, sessionSchedules } from "@/data/f1-data";
import {
  createPrediction,
  getPrediction,
  type Prediction,
} from "@/lib/community/predictions";

/** 레이스 시작 전인지 확인 */
function isBeforeDeadline(round: number): boolean {
  const schedule = sessionSchedules[round];
  if (!schedule?.race) return false;
  const raceStart = new Date(schedule.race);
  // 레이스 시작 1시간 전까지 제출 가능
  raceStart.setHours(raceStart.getHours() - 1);
  return new Date() < raceStart;
}

const DRIVER_OPTIONS = drivers.map((d) => ({
  id: d.id,
  label: `${d.firstName} ${d.lastName}`,
}));

interface PredictionFormProps {
  round: number;
  year?: number;
}

export function PredictionForm({ round, year = 2026 }: PredictionFormProps) {
  const [user, setUser] = useState<User | null>(null);
  const [existing, setExisting] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [p3, setP3] = useState("");
  const [fastestLap, setFastestLap] = useState("");
  const [safetyCar, setSafetyCar] = useState(false);

  const deadline = isBeforeDeadline(round);

  // Auth 구독
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return unsub;
  }, []);

  // 기존 예측 조회
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getPrediction(user.uid, round)
      .then((pred) => {
        setExisting(pred);
        if (pred) {
          setP1(pred.p1);
          setP2(pred.p2);
          setP3(pred.p3);
          setFastestLap(pred.fastestLap);
          setSafetyCar(pred.safetyCar);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, round]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!p1 || !p2 || !p3 || !fastestLap) {
      setError("모든 항목을 선택해주세요.");
      return;
    }
    if (new Set([p1, p2, p3]).size !== 3) {
      setError("P1, P2, P3는 서로 다른 드라이버를 선택해야 합니다.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await createPrediction({
        userId: user.uid,
        round,
        year,
        p1,
        p2,
        p3,
        fastestLap,
        safetyCar,
      });
      setSubmitted(true);
      setExisting({
        userId: user.uid,
        round,
        year,
        p1,
        p2,
        p3,
        fastestLap,
        safetyCar,
        score: null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        createdAt: null as any,
      });
    } catch (e) {
      console.error(e);
      setError("제출 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) {
    return (
      <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-6 text-center">
        <p className="text-[#94A3B8] text-sm">
          예측 게임에 참여하려면 로그인하세요.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-white/5 rounded w-1/3" />
          <div className="h-10 bg-white/5 rounded" />
          <div className="h-10 bg-white/5 rounded" />
          <div className="h-10 bg-white/5 rounded" />
        </div>
      </div>
    );
  }

  // 이미 제출 완료 (기존 예측 있거나 방금 제출)
  if (existing || submitted) {
    return (
      <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-6 space-y-4">
        <h3 className="font-semibold text-white">내 예측</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-[#64748B] text-xs mb-1">P1</p>
            <p className="text-white">{DRIVER_OPTIONS.find((d) => d.id === (existing?.p1 ?? p1))?.label ?? "-"}</p>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-[#64748B] text-xs mb-1">P2</p>
            <p className="text-white">{DRIVER_OPTIONS.find((d) => d.id === (existing?.p2 ?? p2))?.label ?? "-"}</p>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-[#64748B] text-xs mb-1">P3</p>
            <p className="text-white">{DRIVER_OPTIONS.find((d) => d.id === (existing?.p3 ?? p3))?.label ?? "-"}</p>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-[#64748B] text-xs mb-1">패스티스트 랩</p>
            <p className="text-white">{DRIVER_OPTIONS.find((d) => d.id === (existing?.fastestLap ?? fastestLap))?.label ?? "-"}</p>
          </div>
          <div className="bg-white/5 rounded-lg p-3 col-span-2">
            <p className="text-[#64748B] text-xs mb-1">세이프티카</p>
            <p className="text-white">{(existing?.safetyCar ?? safetyCar) ? "예 (출동)" : "아니오"}</p>
          </div>
        </div>
        {existing?.score !== null && existing?.score !== undefined && (
          <div className="bg-[#E8002D]/10 border border-[#E8002D]/30 rounded-lg p-3 text-center">
            <p className="text-[#E8002D] font-semibold">
              점수: {existing.score}점
            </p>
          </div>
        )}
        <p className="text-xs text-[#64748B] text-center">
          제출 후 수정이 불가합니다.
        </p>
      </div>
    );
  }

  if (!deadline) {
    return (
      <div className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-6 text-center">
        <p className="text-[#94A3B8] text-sm">
          예측 제출 마감이 지났습니다. (레이스 시작 1시간 전 마감)
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[#141420] border border-[#2D2D3A] rounded-xl p-6 space-y-4"
    >
      <h3 className="font-semibold text-white">GP 예측 게임</h3>
      <p className="text-xs text-[#64748B]">
        레이스 결과를 예측하고 점수를 획득하세요. 제출 후 수정 불가.
      </p>

      {error && (
        <p className="text-sm text-[#E8002D] bg-[#E8002D]/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* P1 */}
      <div>
        <label className="block text-xs text-[#64748B] mb-1">P1 (우승자)</label>
        <select
          value={p1}
          onChange={(e) => setP1(e.target.value)}
          required
          className="w-full bg-[#1E1E2E] border border-[#2D2D3A] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#E8002D] transition-colors"
        >
          <option value="">드라이버 선택</option>
          {DRIVER_OPTIONS.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      {/* P2 */}
      <div>
        <label className="block text-xs text-[#64748B] mb-1">P2 (2위)</label>
        <select
          value={p2}
          onChange={(e) => setP2(e.target.value)}
          required
          className="w-full bg-[#1E1E2E] border border-[#2D2D3A] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#E8002D] transition-colors"
        >
          <option value="">드라이버 선택</option>
          {DRIVER_OPTIONS.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      {/* P3 */}
      <div>
        <label className="block text-xs text-[#64748B] mb-1">P3 (3위)</label>
        <select
          value={p3}
          onChange={(e) => setP3(e.target.value)}
          required
          className="w-full bg-[#1E1E2E] border border-[#2D2D3A] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#E8002D] transition-colors"
        >
          <option value="">드라이버 선택</option>
          {DRIVER_OPTIONS.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      {/* 패스티스트 랩 */}
      <div>
        <label className="block text-xs text-[#64748B] mb-1">
          패스티스트 랩
        </label>
        <select
          value={fastestLap}
          onChange={(e) => setFastestLap(e.target.value)}
          required
          className="w-full bg-[#1E1E2E] border border-[#2D2D3A] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#E8002D] transition-colors"
        >
          <option value="">드라이버 선택</option>
          {DRIVER_OPTIONS.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      {/* 세이프티카 토글 */}
      <div className="flex items-center justify-between bg-[#1E1E2E] border border-[#2D2D3A] rounded-lg px-4 py-3">
        <span className="text-sm text-white">세이프티카 출동 여부</span>
        <button
          type="button"
          onClick={() => setSafetyCar((v) => !v)}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            safetyCar ? "bg-[#E8002D]" : "bg-[#2D2D3A]"
          }`}
        >
          <span
            className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
              safetyCar ? "translate-x-7" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 bg-[#E8002D] text-white font-semibold rounded-lg hover:bg-[#C0001F] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? "제출 중..." : "예측 제출"}
      </button>
    </form>
  );
}
