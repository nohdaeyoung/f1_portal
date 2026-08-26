export type CornerType = "fast" | "medium" | "slow" | "hairpin" | "chicane";

export interface CornerInfo {
  num: string;    // e.g. "T1", "T6–7"
  name: string;   // Korean corner name
  type: CornerType;
  note: string;   // Key characteristic in Korean
}

const CIRCUIT_CORNERS: Record<string, CornerInfo[]> = {

  "Australian Grand Prix": [
    { num: "T1",    name: "T1 제동",        type: "slow",    note: "개막전 첫 제동 포인트, 스타트 후 주요 추월 핫스팟" },
    { num: "T3",    name: "롤리팝 코너",     type: "slow",    note: "좌우로 이어지는 기술적 복합 구간" },
    { num: "T6",    name: "T6 헤어핀",      type: "hairpin", note: "타이트한 헤어핀, 레이트 브레이킹 승부처" },
    { num: "T9–10", name: "에스 구간",       type: "fast",    note: "2022 개조 후 생긴 고속 연결 구간" },
    { num: "T13",   name: "T13",            type: "medium",  note: "DRS 존 진입 직전 고속 코너" },
    { num: "T15–16",name: "파이널 에스",     type: "chicane", note: "메인 스트레이트 직전 리듬 구간" },
  ],

  "Bahrain Grand Prix": [
    { num: "T1",    name: "T1",             type: "slow",    note: "사막 레이아웃 첫 코너, 강한 제동 포인트" },
    { num: "T3–4",  name: "T3–4 복합",      type: "medium",  note: "연결 구간, 타이어 가열에 중요" },
    { num: "T10",   name: "T10 헤어핀",     type: "hairpin", note: "레이스 최대 추월 포인트, 아웃-인-아웃" },
    { num: "T11–12",name: "T11–12 에스",    type: "medium",  note: "헤어핀 이후 기술적 연속 코너" },
    { num: "T14–15",name: "내부 루프",       type: "slow",    note: "타이어 관리 승부처, 언더컷 결정 구간" },
  ],

  "Saudi Arabian Grand Prix": [
    { num: "T12–13",name: "블라인드 고속 복합", type: "fast",  note: "320km/h+ 블라인드 코너, 벽까지 2m 이내 극한 긴장" },
    { num: "T22–23",name: "T22–23 에스",    type: "fast",    note: "방호벽 근접 고속 연속 코너, 세계 최고 평균속도" },
    { num: "T25–26",name: "피트 진입 에스",  type: "medium",  note: "피트레인 입구 인접, 정밀 조종 필요" },
    { num: "T27",   name: "최종 치카네",     type: "chicane", note: "마지막 DRS 존 활성 직전 저속 구간" },
  ],

  "Japanese Grand Prix": [
    { num: "T1–2",  name: "퍼스트 코너",    type: "medium",  note: "스타트 후 첫 브레이킹, 선두 자리 쟁탈전" },
    { num: "T3–7",  name: "S 커브",         type: "fast",    note: "스즈카 명물 고속 에스 구간, 공기역학 세팅 척도" },
    { num: "T11",   name: "스푼 커브",       type: "medium",  note: "완만한 우회전, 타이어에 큰 횡력 작용" },
    { num: "T13",   name: "130R",           type: "fast",    note: "반경 130m 초고속 코너, 드라이버 용기의 시험대" },
    { num: "T14–15",name: "카시오 삼각형",   type: "chicane", note: "스즈카 최대 추월 포인트, 레이트 브레이킹 유효" },
    { num: "T16",   name: "최종 코너",       type: "medium",  note: "메인 스트레이트 진입 전 가속 포인트" },
  ],

  "Chinese Grand Prix": [
    { num: "T1–2",  name: "장발 헤어핀",     type: "hairpin", note: "긴 호를 그리는 더블 에이펙스 헤어핀, 언더컷 핵심" },
    { num: "T3–5",  name: "에스 구간",       type: "fast",    note: "고속 좌우 연속, 균형 잡기 어려운 구간" },
    { num: "T6",    name: "T6 헤어핀",       type: "hairpin", note: "핵심 추월 포인트, 긴 백 스트레이트 끝" },
    { num: "T13–16",name: "백 섹션",         type: "medium",  note: "DRS 존 앞 스네이크 구간, 타이어 마모 가속" },
  ],

  "Miami Grand Prix": [
    { num: "T1",    name: "T1 제동",         type: "slow",    note: "고속 진입 후 급감속, 스타트 주요 OT 포인트" },
    { num: "T11–13",name: "마리나 구간",      type: "medium",  note: "하버 구역 연속 코너, 범프 심한 구간" },
    { num: "T16",   name: "T16 헤어핀",      type: "hairpin", note: "중반 섹션 직전 타이트한 헤어핀" },
    { num: "T17–18",name: "파이널 에스",      type: "medium",  note: "메인 스트레이트 앞 역류 구간" },
  ],

  "Canadian Grand Prix": [
    { num: "T1–3",  name: "T1–3 복합",       type: "slow",    note: "시작 후 첫 기술 구간, 내벽 근접" },
    { num: "T6",    name: "파이트 헤어핀",    type: "hairpin", note: "언더컷 전략 핵심, 레이트 브레이킹 경쟁" },
    { num: "T8",    name: "일 노트르담 커브",  type: "medium",  note: "섬 내부 중반 고속 우회전" },
    { num: "T13–14",name: "챔피언들의 벽",    type: "chicane", note: "역대 챔피언들이 처박힌 악명 높은 벽, 레이스 다크호스 구간" },
  ],

  "Monaco Grand Prix": [
    { num: "T1",    name: "생 데보테",        type: "slow",    note: "스타트 직후 첫 코너, 벽 충돌 잦은 위험 구간" },
    { num: "T3",    name: "마세네",           type: "fast",    note: "카지노 광장으로 이어지는 고속 구간" },
    { num: "T5",    name: "카지노",           type: "medium",  note: "카지노 앞 우회전, 범프 심한 코너" },
    { num: "T6",    name: "그랑 오텔 헤어핀", type: "hairpin", note: "F1 최저속 코너 약 40km/h — 역사적으로 추월 불가" },
    { num: "T9",    name: "포르티에",         type: "medium",  note: "터널 진입 직전 좌회전, 부드러운 연결" },
    { num: "T10–11",name: "누벨 치카네",      type: "chicane", note: "터널 이후 추월 포인트, 다이브 봄브 승부처" },
    { num: "T12",   name: "타박",             type: "fast",    note: "수영장 구간 고속 진입 코너" },
    { num: "T15–16",name: "수영장 구간",      type: "chicane", note: "좁은 에스 구간, 극한 정밀성 요구" },
    { num: "T18",   name: "라스카스",         type: "hairpin", note: "내벽 직격 사고 다수, 최종 헤어핀" },
    { num: "T19",   name: "앙토니 노게스",    type: "medium",  note: "최종 코너, 메인 스트레이트 가속 포인트" },
  ],

  "Spanish Grand Prix": [
    { num: "T1",    name: "L'엑시다",         type: "slow",    note: "스타트 후 첫 헤어핀, 주요 추월 포인트" },
    { num: "T3–4",  name: "워스 코너",        type: "medium",  note: "고속 연결 구간, 공기역학 의존도 높음" },
    { num: "T5",    name: "렙솔 코너",        type: "fast",    note: "고속 우회전, F1 세팅 테스트 기준 코너" },
    { num: "T9",    name: "르노 코너",        type: "medium",  note: "중반 기술 구간 시작" },
    { num: "T10",   name: "캄프사",           type: "fast",    note: "빠른 우회전, 공기역학 핵심 테스트 코너" },
    { num: "T12",   name: "라 카이샤",        type: "slow",    note: "타이트한 헤어핀형 코너, 레이트 브레이킹 유효" },
  ],

  "Austrian Grand Prix": [
    { num: "T1",    name: "T1 제동",          type: "slow",    note: "긴 직선 후 강한 제동, DRS 추월 포인트" },
    { num: "T3",    name: "레무스 코너",       type: "medium",  note: "오르막 고속 우회전, 언더스티어 위험" },
    { num: "T4",    name: "슈피츠케레 헤어핀", type: "hairpin", note: "레드불링 최저속 코너, 피트 언더컷 핵심" },
    { num: "T6–7",  name: "에스 구간",        type: "medium",  note: "연속 코너, 리듬이 중요" },
    { num: "T9",    name: "린트 코너",        type: "medium",  note: "마지막 섹터 진입 코너" },
  ],

  "Styrian Grand Prix": [
    { num: "T1",    name: "T1 제동",          type: "slow",    note: "긴 직선 후 강한 제동, DRS 추월 포인트" },
    { num: "T3",    name: "레무스 코너",       type: "medium",  note: "오르막 고속 우회전, 언더스티어 위험" },
    { num: "T4",    name: "슈피츠케레 헤어핀", type: "hairpin", note: "레드불링 최저속 코너, 피트 언더컷 핵심" },
    { num: "T9",    name: "린트 코너",        type: "medium",  note: "마지막 섹터 진입 코너" },
  ],

  "British Grand Prix": [
    { num: "T1",    name: "코프스",           type: "fast",    note: "실버스톤 첫 고속 우회전, 용기의 코너" },
    { num: "T5–7",  name: "매곳-베켓-채플",   type: "fast",    note: "F1 최고 고속 S구간 중 하나, 드라이버들이 꼽는 최고 코너" },
    { num: "T8–9",  name: "브룩랜즈-러플드",  type: "slow",    note: "느린 헤어핀형 연속, 추월 포인트" },
    { num: "T14",   name: "스토우",           type: "medium",  note: "하반부 진입 코너, 타이어 부하 높음" },
    { num: "T18",   name: "루프 코너",        type: "slow",    note: "최종 구간 시작, 내부 라인 선택 유리" },
  ],

  "Belgian Grand Prix": [
    { num: "T1",    name: "라 소스",          type: "hairpin", note: "스타트 후 첫 헤어핀, 1라운드 다중 충돌 사고 발생 지점" },
    { num: "T2–4",  name: "에로우쥐/로에이옹", type: "fast",   note: "F1 역사상 가장 유명한 구간, 풀 스로틀로 통과" },
    { num: "T8",    name: "리바즈",           type: "medium",  note: "오르막 헤어핀, 긴 백 스트레이트 브레이킹 시작" },
    { num: "T11–12",name: "푸온",             type: "fast",    note: "고속 더블 우회전, 다운포스 손실 시 위험" },
    { num: "T17–18",name: "버스 스톱 치카네", type: "chicane", note: "스타트-피니시 직전 마지막 추월 포인트" },
  ],

  "Hungarian Grand Prix": [
    { num: "T1",    name: "T1 외부 선택",     type: "slow",    note: "스타트 첫 제동, 외부 라인이 추월에 유리" },
    { num: "T4",    name: "T4 헤어핀",        type: "hairpin", note: "헝가로링 최대 추월 포인트, 레이트 브레이킹 경쟁" },
    { num: "T6–7",  name: "에스 구간",        type: "medium",  note: "중반 기술 구간, 타이어 관리 핵심" },
    { num: "T11",   name: "T11 고속",         type: "fast",    note: "하반부 고속 구간 시작, 공기역학 중요" },
    { num: "T13–14",name: "파이널 치카네",     type: "chicane", note: "마지막 치카네, 메인 스트레이트 가속 준비" },
  ],

  "Dutch Grand Prix": [
    { num: "T3",    name: "T3 뱅크 코너",     type: "fast",    note: "경사각이 있는 고속 우회전, 잔드포르트 명물" },
    { num: "T7",    name: "후겐호르스트",      type: "hairpin", note: "주요 OT 포인트, 브레이킹 깊게" },
    { num: "T11",   name: "파라볼라 뱅크",    type: "fast",    note: "고속 뱅크 구간, 파라볼리카 스타일" },
    { num: "T14",   name: "마지막 뱅크 코너", type: "medium",  note: "경사각 마지막 구간, 메인 스트레이트 진입" },
  ],

  "Italian Grand Prix": [
    { num: "T1–2",  name: "바리안테 델 레티필로", type: "chicane", note: "첫 치카네, 스타트 후 경쟁이 가장 치열한 구간" },
    { num: "T3",    name: "쿠르바 그란데",    type: "fast",    note: "풀 스로틀 고속 우회전, 공기역학 민감 구간" },
    { num: "T4–5",  name: "바리안테 델라 로자", type: "chicane", note: "레이트 브레이킹 추월 포인트" },
    { num: "T6–7",  name: "레스모 1·2",       type: "medium",  note: "나무 터널 속 연속 우회전" },
    { num: "T8–10", name: "바리안테 아스카리", type: "chicane", note: "아스카리 복합 치카네, 리듬이 중요" },
    { num: "T11",   name: "파라볼리카",       type: "medium",  note: "최종 코너, 이탈리아 팬들이 사랑하는 포물선 코너" },
  ],

  "Azerbaijan Grand Prix": [
    { num: "T1",    name: "T1 제동",          type: "slow",    note: "DRS 직선 끝 급제동, 레이스 최대 OT 포인트" },
    { num: "T3",    name: "T3 타이트 헤어핀", type: "hairpin", note: "성 구역 진입 직전 가장 느린 코너" },
    { num: "T4–5",  name: "성 구역",          type: "slow",    note: "좁은 구시가지 성벽 구간, 벽까지 1m 이내" },
    { num: "T8",    name: "성 스트레이트 끝", type: "slow",    note: "성 직선 후 좌회전, 사고 다발 지점" },
    { num: "T15",   name: "최종 치카네",       type: "chicane", note: "홈 스트레이트 직전 마지막 추월 기회" },
  ],

  "Singapore Grand Prix": [
    { num: "T1",    name: "앤더슨 브릿지",    type: "slow",    note: "야간 개막 코너, 느린 속도에서 정밀 조종" },
    { num: "T3",    name: "래플스 불레바드",  type: "medium",  note: "상징적인 도심 고층빌딩 배경 구간" },
    { num: "T10",   name: "T10 헤어핀",       type: "hairpin", note: "싱가포르 최대 추월 포인트, 브레이킹 깊이 승부" },
    { num: "T14",   name: "에스플라나드 구간", type: "medium",  note: "마리나 베이 수변 야경 구역" },
    { num: "T18",   name: "마리나 베이 코너", type: "slow",    note: "내부 루프 슬로우 구간" },
  ],

  "United States Grand Prix": [
    { num: "T1",    name: "T1 제동",          type: "slow",    note: "언덕 꼭대기에서 급하강 후 급제동, 시각적 착각 유발" },
    { num: "T2–11", name: "에스 구간",        type: "fast",    note: "COTA의 명물 고속 에스 연속, 스즈카 S커브 오마주" },
    { num: "T12",   name: "헤어핀",           type: "hairpin", note: "가장 느린 코너, 언더컷 전략 핵심" },
    { num: "T16",   name: "T16 고속",         type: "fast",    note: "고속 우회전, 내리막 진입 구간" },
    { num: "T19–20",name: "최종 복합",        type: "medium",  note: "마지막 복합 코너, 메인 스트레이트 진입 준비" },
  ],

  "Mexico City Grand Prix": [
    { num: "T1–3",  name: "페랄타다 인피엘도", type: "medium", note: "고도 2,285m에서 공기 저항 감소로 초고속 달성" },
    { num: "T4",    name: "T4 헤어핀",        type: "hairpin", note: "주요 추월 포인트, 타이어 로크업 발생 잦음" },
    { num: "T6",    name: "기술 구간",         type: "slow",    note: "느린 기술 구간, 트랙션 중요" },
    { num: "T16–17",name: "포로 솔 스타디움", type: "hairpin", note: "야구 경기장 안을 통과하는 독특한 F1 구간" },
  ],

  "São Paulo Grand Prix": [
    { num: "T1–2",  name: "세나 S",           type: "medium",  note: "세나를 기리는 첫 S코너, 스타트 충돌 다발 지점" },
    { num: "T3",    name: "데시다 도 라구",    type: "fast",    note: "내리막 고속 구간, 강한 원심력" },
    { num: "T4–7",  name: "페하두라 구간",     type: "medium",  note: "인터라고스 중반 테크니컬 구간" },
    { num: "T12–13",name: "메르훌류",          type: "medium",  note: "좁은 내리막, 추월 리스크 높음" },
    { num: "T14–15",name: "준상",              type: "medium",  note: "레이스 최대 추월 포인트, 긴 직선 끝" },
  ],

  "Brazilian Grand Prix": [
    { num: "T1–2",  name: "세나 S",           type: "medium",  note: "세나를 기리는 첫 S코너, 스타트 충돌 다발 지점" },
    { num: "T3",    name: "데시다 도 라구",    type: "fast",    note: "내리막 고속 구간, 강한 원심력" },
    { num: "T4–7",  name: "페하두라 구간",     type: "medium",  note: "인터라고스 중반 테크니컬 구간" },
    { num: "T14–15",name: "준상",              type: "medium",  note: "레이스 최대 추월 포인트, 긴 직선 끝" },
  ],

  "Las Vegas Grand Prix": [
    { num: "T1",    name: "T1 제동",          type: "slow",    note: "라스베이거스 스트립 야간 첫 코너" },
    { num: "T12",   name: "시저스팰리스 헤어핀", type: "hairpin", note: "레이스 최대 추월 포인트, 나이트 레이스 명소" },
    { num: "T14",   name: "T14 치카네",        type: "chicane", note: "마지막 기술 구간, 메인 스트레이트 진입 전" },
  ],

  "Qatar Grand Prix": [
    { num: "T1",    name: "T1 제동",          type: "slow",    note: "루사일 첫 코너, 주요 OT 포인트" },
    { num: "T4",    name: "T4 고속 우회전",   type: "fast",    note: "고속 장발 우회전, 높은 횡G 작용" },
    { num: "T12–13",name: "T12–13 복합",      type: "medium",  note: "중반 기술적 연속 코너" },
    { num: "T16",   name: "최종 헤어핀",      type: "hairpin", note: "최후 추월 기회, 레이트 브레이킹 유효" },
  ],

  "Abu Dhabi Grand Prix": [
    { num: "T5–7",  name: "호텔 섹션",        type: "medium",  note: "호텔 구조물 아래를 지나는 독특한 구간" },
    { num: "T11",   name: "T11 헤어핀",       type: "hairpin", note: "시즌 피날레 최대 OT 포인트" },
    { num: "T14–15",name: "마리나 섹션",      type: "slow",    note: "야스 마리나 내부 슬로우 섹션, 포지션 지키기" },
  ],

  "Emilia Romagna Grand Prix": [
    { num: "T1",    name: "탐부렐로",         type: "medium",  note: "세나 사고로 변형된 역사적 구간, 현재는 시케인형" },
    { num: "T2",    name: "빌뇌브 코너",      type: "slow",    note: "빌뇌브를 기리는 저속 좌회전" },
    { num: "T3–4",  name: "토사 헤어핀",      type: "hairpin", note: "이몰라 최대 OT 포인트" },
    { num: "T7–8",  name: "아퀘 미네랄리",    type: "medium",  note: "중반 기술 치카네 구간" },
    { num: "T14–15",name: "바리안테 알타",    type: "chicane", note: "고속 구간 후 치카네, 레이트 브레이킹" },
    { num: "T16–17",name: "리바차",           type: "medium",  note: "마지막 더블 코너, 메인 스트레이트 진입" },
  ],

  "Turkish Grand Prix": [
    { num: "T1",    name: "T1 제동",          type: "slow",    note: "이스탄불 첫 코너, 오프캠버 위험" },
    { num: "T8",    name: "T8 더블 에이펙스", type: "fast",    note: "이스탄불 파크 명물, 극한 다운포스 요구 고속 좌회전" },
    { num: "T12",   name: "T12 헤어핀",       type: "hairpin", note: "레이스 최대 추월 포인트" },
  ],

  "Portuguese Grand Prix": [
    { num: "T1–2",  name: "T1–2 복합",        type: "slow",    note: "포르티망 첫 기술 구간, 경사면 변화 심함" },
    { num: "T5",    name: "T5 고속",           type: "fast",    note: "오르막 고속 코너, 시각적 착각 발생" },
    { num: "T10–11",name: "다운힐 에스",       type: "fast",    note: "내리막 고속 S구간, F1 세팅 민감" },
    { num: "T13",   name: "최종 코너",         type: "medium",  note: "메인 스트레이트 진입 전 마지막 코너" },
  ],

};

export function getCircuitCorners(gpName: string): CornerInfo[] {
  return CIRCUIT_CORNERS[gpName] ?? [];
}

// circuitId → GP name mapping
const CIRCUIT_ID_TO_GP: Record<string, string> = {
  "albert-park": "Australian Grand Prix",
  "bahrain":     "Bahrain Grand Prix",
  "jeddah":      "Saudi Arabian Grand Prix",
  "suzuka":      "Japanese Grand Prix",
  "shanghai":    "Chinese Grand Prix",
  "miami":       "Miami Grand Prix",
  "imola":       "Emilia Romagna Grand Prix",
  "monaco":      "Monaco Grand Prix",
  "montreal":    "Canadian Grand Prix",
  "barcelona":   "Spanish Grand Prix",
  "spielberg":   "Austrian Grand Prix",
  "silverstone": "British Grand Prix",
  "hungaroring": "Hungarian Grand Prix",
  "spa":         "Belgian Grand Prix",
  "zandvoort":   "Dutch Grand Prix",
  "monza":       "Italian Grand Prix",
  "baku":        "Azerbaijan Grand Prix",
  "singapore":   "Singapore Grand Prix",
  "cota":        "United States Grand Prix",
  "mexico":      "Mexico City Grand Prix",
  "interlagos":  "São Paulo Grand Prix",
  "las-vegas":   "Las Vegas Grand Prix",
  "lusail":      "Qatar Grand Prix",
  "yas-marina":  "Abu Dhabi Grand Prix",
  "istanbul":    "Turkish Grand Prix",
  "portimao":    "Portuguese Grand Prix",
};

export function getCornersByCircuitId(circuitId: string): CornerInfo[] {
  const gpName = CIRCUIT_ID_TO_GP[circuitId];
  return gpName ? (CIRCUIT_CORNERS[gpName] ?? []) : [];
}
