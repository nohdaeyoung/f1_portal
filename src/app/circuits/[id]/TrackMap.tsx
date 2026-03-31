// Server component — fetches GeoJSON at build time (ISR daily)
import { TrackMapClient, type CornerData, type Projection } from "./TrackMapClient";

// bacinger/f1-circuits uses {country_code}-{year_opened} naming
const GEOJSON_ID: Record<string, string> = {
  "albert-park": "au-1953",
  "bahrain":     "bh-2002",
  "jeddah":      "sa-2021",
  "shanghai":    "cn-2004",
  "suzuka":      "jp-1962",
  "miami":       "us-2022",
  "montreal":    "ca-1978",
  "monaco":      "mc-1929",
  "barcelona":   "es-1991",
  "spielberg":   "at-1969",
  "silverstone": "gb-1948",
  "spa":         "be-1925",
  "hungaroring": "hu-1986",
  "zandvoort":   "nl-1948",
  "monza":       "it-1922",
  "madrid":      "es-2026",
  "baku":        "az-2016",
  "singapore":   "sg-2008",
  "cota":        "us-2012",
  "mexico-city": "mx-1962",
  "interlagos":  "br-1940",
  "las-vegas":   "us-2023",
  "lusail":      "qa-2004",
  "yas-marina":  "ae-2009",
};

// Start/Finish line position as fraction of total coord count
const SF_POSITIONS: Record<string, number> = {
  "albert-park": 0.00,
  "bahrain":     0.00,
  "jeddah":      0.00,
  "shanghai":    0.00,
  "suzuka":      0.00,
  "miami":       0.00,
  "montreal":    0.00,
  "monaco":      0.00,
  "barcelona":   0.00,
  "spielberg":   0.00,
  "silverstone": 0.00,
  "spa":         0.00,
  "hungaroring": 0.00,
  "zandvoort":   0.00,
  "monza":       0.00,
  "madrid":      0.00,
  "baku":        0.00,
  "singapore":   0.00,
  "cota":        0.00,
  "mexico-city": 0.00,
  "interlagos":  0.00,
  "las-vegas":   0.00,
  "lusail":      0.00,
  "yas-marina":  0.00,
};

// Sector split fractions:
//   [s1End, s2End]                              — old 2-val (s0Start from SF_POSITIONS)
//   [s1End, s2End, s3End]                       — old 3-val
//   [s0Start, s1End, s2End, s3End]              — 4-val (s0Start overrides SF_POSITIONS)
//   [[s1s,s1e],[s2s,s2e],[s3s,s3e]]             — new independent-start/end format
type SectorSplitValue =
  | [number, number]
  | [number, number, number]
  | [number, number, number, number]
  | [[number, number], [number, number], [number, number]];
const SECTOR_SPLITS: Record<string, SectorSplitValue> = {
  "albert-park": [0.30, 0.62],
  "bahrain":     [0.33, 0.65],
  "jeddah":      [0.35, 0.65],
  "shanghai":    [0.30, 0.65],
  "suzuka":      [0.40, 0.70],
  "miami":       [0.35, 0.65],
  "montreal":    [0.40, 0.70],
  "monaco":      [0.35, 0.65],
  "barcelona":   [0.30, 0.65],
  "spielberg":   [0.30, 0.65],
  "silverstone": [0.35, 0.65],
  "spa":         [0.18, 0.58],
  "hungaroring": [0.30, 0.65],
  "zandvoort":   [0.30, 0.65],
  "monza":       [0.25, 0.55],
  "madrid":      [0.30, 0.65],
  "baku":        [0.40, 0.70],
  "singapore":   [0.35, 0.65],
  "cota":        [0.30, 0.60],
  "mexico-city": [0.30, 0.65],
  "interlagos":  [0.30, 0.65],
  "las-vegas":   [0.30, 0.65],
  "lusail":      [0.35, 0.65],
  "yas-marina":  [0.35, 0.65],
};

// Famous corner annotations (lat/lng in WGS84)
const CIRCUIT_CORNERS: Record<string, CornerData[]> = {
  "albert-park": [
    { name: "T1 브라밤",    lat: -37.8497, lng: 144.9693, anchor: "right"  },
    { name: "T3 존스",      lat: -37.8515, lng: 144.9742, anchor: "below"  },
    { name: "T6 린트",      lat: -37.8558, lng: 144.9742, anchor: "below"  },
    { name: "T9-10 치케인", lat: -37.8562, lng: 144.9648, anchor: "left"   },
    { name: "T11 아스카리", lat: -37.8505, lng: 144.9624, anchor: "left"   },
    { name: "T13 세나",     lat: -37.8472, lng: 144.9658, anchor: "above"  },
    { name: "T15-16 팬지오",lat: -37.8473, lng: 144.9685, anchor: "above"  },
  ],
  "spa": [
    { name: "라 소스",    lat: 50.4363, lng: 5.9714, anchor: "right"  },
    { name: "오루주",     lat: 50.4358, lng: 5.9726, anchor: "below"  },
    { name: "푸옹",       lat: 50.4241, lng: 5.9651, anchor: "left"   },
    { name: "블랑슈몽",   lat: 50.4263, lng: 5.9857, anchor: "right"  },
    { name: "버스 스탑",  lat: 50.4374, lng: 5.9764, anchor: "above"  },
  ],
  "monaco": [
    { name: "생 드보트",     lat: 43.7349, lng: 7.4156, anchor: "right"  },
    { name: "카지노",        lat: 43.7393, lng: 7.4278, anchor: "above"  },
    { name: "페어몬 헤어핀", lat: 43.7373, lng: 7.4206, anchor: "left"   },
    { name: "수영장",        lat: 43.7318, lng: 7.4256, anchor: "below"  },
    { name: "라 라스카스",   lat: 43.7337, lng: 7.4194, anchor: "right"  },
  ],
  "silverstone": [
    { name: "코프스",        lat: 52.0782, lng: -1.0225, anchor: "above" },
    { name: "매곳/베켓츠",   lat: 52.0834, lng: -1.0291, anchor: "above" },
    { name: "채플",          lat: 52.0819, lng: -1.0306, anchor: "left"  },
    { name: "스토우",        lat: 52.0769, lng: -1.0302, anchor: "below" },
    { name: "클럽",          lat: 52.0750, lng: -1.0219, anchor: "below" },
  ],
  "suzuka": [
    { name: "퍼스트 코너",   lat: 34.8448, lng: 136.5418, anchor: "right" },
    { name: "스푼 커브",     lat: 34.8389, lng: 136.5360, anchor: "below" },
    { name: "130R",          lat: 34.8529, lng: 136.5331, anchor: "above" },
    { name: "헤어핀",        lat: 34.8490, lng: 136.5410, anchor: "right" },
  ],
  "monza": [
    { name: "프리마 바리안테", lat: 45.6190, lng: 9.2817, anchor: "right" },
    { name: "레스모",          lat: 45.6184, lng: 9.2880, anchor: "right" },
    { name: "아스카리",        lat: 45.6098, lng: 9.2897, anchor: "below" },
    { name: "파라볼리카",      lat: 45.6086, lng: 9.2811, anchor: "left"  },
  ],
  "interlagos": [
    { name: "세나 S",        lat: -23.7020, lng: -46.6999, anchor: "above" },
    { name: "쿠르바 두 솔",  lat: -23.7043, lng: -46.6979, anchor: "right" },
    { name: "쥬시셀라 S",    lat: -23.7036, lng: -46.6997, anchor: "left"  },
  ],
};

// ─── GeoJSON fetch ────────────────────────────────────────────

interface GeoFeature {
  geometry: { type: string; coordinates: number[][] | number[][][] };
}

async function fetchCoords(circuitId: string): Promise<[number, number][] | null> {
  const fileId = GEOJSON_ID[circuitId];
  if (!fileId) return null;
  const url = `https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/${fileId}.geojson`;
  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const json = await res.json() as { features?: GeoFeature[] };
    const feature = json.features?.[0];
    if (!feature) return null;
    const { type, coordinates } = feature.geometry;
    if (type === "LineString") return coordinates as [number, number][];
    if (type === "MultiLineString")
      return (coordinates as number[][][]).flat() as [number, number][];
    return null;
  } catch {
    return null;
  }
}

// ─── Projection ───────────────────────────────────────────────

function computeProjection(
  coords: [number, number][],
  W: number, H: number, pad: number
): { path: string; proj: Projection } {
  const xs = coords.map(([lng]) => lng);
  const ys = coords.map(([, lat]) => lat);
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const y0 = Math.min(...ys), y1 = Math.max(...ys);
  const rx = x1 - x0 || 1e-9;
  const ry = y1 - y0 || 1e-9;
  const iw = W - 2 * pad, ih = H - 2 * pad;
  const s = Math.min(iw / rx, ih / ry);
  const ox = pad + (iw - rx * s) / 2;
  const oy = pad + (ih - ry * s) / 2;

  const path = coords
    .map(([lng, lat], i) => {
      const cx = (ox + (lng - x0) * s).toFixed(1);
      const cy = (oy + (y1 - lat) * s).toFixed(1);
      return `${i ? "L" : "M"} ${cx} ${cy}`;
    })
    .join(" ");

  return { path, proj: { x0, y1, s, ox, oy } };
}

// ─── Firestore circuit override ───────────────────────────────

async function fetchCircuitOverride(circuitId: string): Promise<{
  corners?: CornerData[];
  sectors?: [[number, number], [number, number], [number, number]];
  sfPosition?: number;
  dirReversed?: boolean;
} | null> {
  try {
    const { initializeApp, getApps, cert } = await import("firebase-admin/app");
    const { getFirestore } = await import("firebase-admin/firestore");
    if (!getApps().length) {
      initializeApp({
        credential: cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
      });
    }
    const snap = await getFirestore().doc(`circuits/${circuitId}`).get();
    if (!snap.exists) return null;
    const data = snap.data() as Record<string, unknown>;
    // Firestore doesn't support nested arrays — sectors stored as [{s,e},...] objects
    let sectors: [[number, number], [number, number], [number, number]] | undefined;
    if (Array.isArray(data.sectors) && data.sectors.length === 3) {
      const raw = data.sectors as { s: number; e: number }[];
      sectors = raw.map(({ s, e }) => [s, e]) as [[number,number],[number,number],[number,number]];
    }
    return {
      corners: data.corners as CornerData[] | undefined,
      sectors,
      sfPosition: data.sfPosition as number | undefined,
      dirReversed: data.dirReversed as boolean | undefined,
    };
  } catch {
    return null;
  }
}

// ─── Server component ─────────────────────────────────────────

export async function TrackMap({ circuitId }: { circuitId: string }) {
  const coords = await fetchCoords(circuitId);
  if (!coords?.length) return null;

  // Firestore override (admin saved values take precedence over hardcoded defaults)
  const override = await fetchCircuitOverride(circuitId);

  const W = 900, H = 540, pad = 48;
  const { path, proj } = computeProjection(coords, W, H, pad);

  // Corners: Firestore override → hardcoded default
  const corners = override?.corners ?? (CIRCUIT_CORNERS[circuitId] ?? []);

  // Sectors
  const savedSectors = override?.sectors;
  const rawSplits = SECTOR_SPLITS[circuitId];
  const isPairs = Array.isArray(rawSplits?.[0]);
  const initialSectors: [[number, number], [number, number], [number, number]] | undefined =
    savedSectors ?? (isPairs ? rawSplits as [[number, number], [number, number], [number, number]] : undefined);
  // Legacy flat formats (only used if no saved/pairs format)
  const has4 = !isPairs && !savedSectors && rawSplits?.length === 4;
  const initialSplits = initialSectors ? undefined : has4
    ? [(rawSplits as number[])[1], (rawSplits as number[])[2], (rawSplits as number[])[3]] as [number, number, number]
    : (rawSplits as [number, number] | [number, number, number] | undefined);
  const initialSfPosition = override?.sfPosition
    ?? (has4 ? (rawSplits as number[])[0] : (SF_POSITIONS[circuitId] ?? 0));
  const initialDirReversed = override?.dirReversed ?? false;

  return (
    <TrackMapClient
      path={path}
      W={W}
      H={H}
      proj={proj}
      circuitId={circuitId}
      initialCorners={corners}
      rawCoords={coords}
      initialSplits={initialSplits}
      initialSectors={initialSectors}
      initialSfPosition={initialSfPosition}
      initialDirReversed={initialDirReversed}
    />
  );
}
