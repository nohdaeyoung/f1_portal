"use client";

import { useState, useEffect, useRef } from "react";
import type { FF1DriverTelemetry } from "@/lib/api/fastf1";

interface UseDriverTelemetryReturn {
  telemetry: FF1DriverTelemetry | null;
  loading: boolean;
  error: string | null;
}

export function useDriverTelemetry(
  year: number,
  gp: string,
  session: string,
  driver: string | null,
  fps = 5
): UseDriverTelemetryReturn {
  const [telemetry, setTelemetry] = useState<FF1DriverTelemetry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<Map<string, FF1DriverTelemetry>>(new Map());

  useEffect(() => {
    if (!driver) {
      setTelemetry(null);
      return;
    }

    const cacheKey = `${year}/${gp}/${session}/${driver}/${fps}`;
    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      setTelemetry(cached);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(
      `/api/fastf1/driver-telemetry?year=${year}&gp=${encodeURIComponent(gp)}&session=${session}&driver=${driver}&fps=${fps}`
    )
      .then((r) => {
        if (!r.ok) throw new Error(`서버 오류 (${r.status})`);
        return r.json() as Promise<FF1DriverTelemetry>;
      })
      .then((data) => {
        cacheRef.current.set(cacheKey, data);
        setTelemetry(data);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [year, gp, session, driver, fps]);

  return { telemetry, loading, error };
}
