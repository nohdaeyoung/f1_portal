/**
 * 2026 F1 규정 콘텐츠
 * 출처: FIA 공식 기술·스포팅·파워유닛 규정 (2026)
 */

export interface RegulationItem {
  id: string;
  title: string;
  summary: string;
  details: string[];
  tag?: string;
}

export interface RegulationSection {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  color: string;
  items: RegulationItem[];
}

export const regulations2026: RegulationSection[] = [
  {
    id: "power-unit",
    icon: "⚡",
    title: "파워유닛 규정",
    subtitle: "2026 시즌 최대의 변혁 — 내연기관과 전기 동력의 50:50 균형",
    color: "#E8002D",
    items: [
      {
        id: "pu-overview",
        title: "파워유닛 구조 개편",
        tag: "핵심 변경",
        summary: "내연기관(ICE) 출력과 전기모터(MGU-K) 출력의 비율이 사상 최초로 50:50에 도달합니다.",
        details: [
          "내연기관(ICE): 약 400kW(544마력)",
          "전기모터(MGU-K): 약 350kW(476마력)",
          "총 출력: 약 750kW(1,020마력)",
          "MGU-H(열 에너지 회수 시스템) 완전 폐지 — 복잡성 대폭 감소",
          "MGU-K는 이전 대비 약 6배 강력해진 신형 시스템 채택",
        ],
      },
      {
        id: "sustainable-fuel",
        title: "100% 지속가능연료(SAF) 의무화",
        tag: "환경 규정",
        summary: "2026년부터 모든 F1 팀은 화석연료 없이 100% 지속가능한 연료만 사용해야 합니다.",
        details: [
          "기존 E10(에탄올 10% 혼합) → 100% 지속가능연료로 전환",
          "합성연료(e-fuel) 또는 바이오연료 기반",
          "탄소 중립 달성을 위한 핵심 요소",
          "FIA 인증을 받은 연료 공급사만 참여 가능",
        ],
      },
      {
        id: "pu-homologation",
        title: "파워유닛 동결 및 공급 규정",
        summary: "신규 공급사 진입을 장려하기 위해 파워유닛 동결 규정이 완화됩니다.",
        details: [
          "2026~2030년 사용할 파워유닛을 시즌 개막 전 FIA에 제출·인증",
          "시즌 중 개발은 안전성·신뢰성 이슈에 한해 제한적으로 허용",
          "Honda(Aston Martin), Ferrari, Mercedes, Renault(Alpine), Red Bull Powertrains 공급",
          "포드(Ford)와 Red Bull의 협력으로 'Ford' 브랜드 엔진 복귀",
        ],
      },
      {
        id: "ers-deployment",
        title: "ERS 배치 전략 변경",
        summary: "전기 출력이 크게 늘어나면서 에너지 관리가 레이스 전략의 핵심이 됩니다.",
        details: [
          "배터리 용량 증가로 더 긴 구간에서 풀 전기 파워 사용 가능",
          "브레이킹 회생 에너지(KERS)와 MGU-K 간 에너지 흐름 최적화 중요",
          "과거 MGU-H가 담당하던 터보 스풀업 기능은 삭제 — 터보렉 발생 가능성",
          "에너지 관리 소프트웨어 전략이 랩타임에 더 큰 영향",
        ],
      },
    ],
  },
  {
    id: "aerodynamics",
    icon: "💨",
    title: "공기역학 규정",
    subtitle: "액티브 에어로 도입 — F1 역사상 가장 큰 공기역학 혁신",
    color: "#0EA5E9",
    items: [
      {
        id: "active-aero",
        title: "액티브 에어로다이내믹스 (FDD·RAD)",
        tag: "핵심 변경",
        summary: "드라이버가 조작하는 이동식 에어로 파츠 시스템이 도입되어 직선 구간 최고속도가 크게 향상됩니다.",
        details: [
          "FDD(Front Drag Device): 앞날개 플랩이 고속 구간에서 자동으로 접혀 항력 감소",
          "RAD(Rear Aero Device): 뒷날개도 동일한 방식으로 개방·폐쇄",
          "기존 DRS(Drag Reduction System) 완전 대체",
          "저속 구간: 최대 다운포스 모드 / 고속 구간: 최소 항력 모드로 자동 전환",
          "드라이버가 수동 조작하는 것이 아닌, 속도·조향 각도 기반 자동 제어",
        ],
      },
      {
        id: "downforce-reduction",
        title: "전체 다운포스 30% 감소",
        tag: "차체 규정",
        summary: "차량 주변 공기 흐름을 단순화해 후방 차량의 공기역학적 영향(더티 에어)을 최소화합니다.",
        details: [
          "2022년 규정 대비 다운포스 추가 감소 — 추월 용이성 향상 목표",
          "언더플로어(그라운드 이펙트) 의존도 유지, 상부 날개 단순화",
          "앞날개 폭 확대 및 형상 단순화",
          "사이드포드 형상 규제 강화",
          "디퓨저 높이 및 형상 변경",
        ],
      },
      {
        id: "car-dimensions",
        title: "차체 치수 변경",
        summary: "2026 F1 머신은 2022~2025 규정 대비 더 좁고 가벼워집니다.",
        details: [
          "차폭: 2,000mm → 1,900mm (100mm 축소)",
          "최소 중량: 798kg → 768kg (30kg 감소, 연료 제외)",
          "휠베이스 제한 규정 강화",
          "최소 지상고 규정 유지",
        ],
      },
    ],
  },
  {
    id: "sporting",
    icon: "🏁",
    title: "스포팅 규정",
    subtitle: "레이스 포맷, 페널티, 피트스탑 관련 주요 규정",
    color: "#7C3AED",
    items: [
      {
        id: "race-format",
        title: "레이스 포맷 유지",
        summary: "기본 레이스 포맷은 2025년과 동일하게 유지됩니다.",
        details: [
          "레이스 거리: 305km 이상 (모나코 제외)",
          "스프린트 이벤트: 시즌 중 6라운드 유지",
          "스프린트 주말: FP1 → 스프린트 예선(SQ) → FP2 → 스프린트 → 예선 → 레이스",
          "일반 주말: FP1 → FP2 → FP3 → 예선 → 레이스",
          "레이스 시간 제한: 2시간 (안전차 구간 별도 적용)",
        ],
      },
      {
        id: "parc-ferme",
        title: "파르크 페르메 규정",
        summary: "예선 이후 차량 세팅 변경에 대한 규정이 더욱 엄격해집니다.",
        details: [
          "예선 Q3 종료 후 ~ 레이스 시작까지 파르크 페르메 적용",
          "허용 작업: 타이어 교체, 차량 청소, 기본 유체 보충",
          "불허 작업: 에어로 세팅 변경, 서스펜션 조정, 기어비 변경",
          "위반 시 피트레인 스타트 또는 실격 처리",
        ],
      },
      {
        id: "tire-rules",
        title: "타이어 규정",
        summary: "피렐리가 2026년에도 단독 타이어 공급사로 유지됩니다.",
        details: [
          "18인치 로우프로파일 타이어 유지 (2022년 도입)",
          "컴파운드 구성: C1(하드)~C5(소프트) 중 3가지 선택 공급",
          "레이스 중 최소 2가지 다른 컴파운드 사용 의무",
          "스프린트 레이스: 컴파운드 선택 제한 없음",
          "웨트 조건: 풀웻(그린)/인터미디엇(옐로우) 구분 유지",
        ],
      },
      {
        id: "cost-cap",
        title: "비용 상한제 (Cost Cap)",
        summary: "팀 간 경쟁 균형을 위한 예산 상한 규정이 계속 적용됩니다.",
        details: [
          "2026 시즌 예산 상한: $1억 3,500만 달러 (CPI 연동 조정)",
          "제외 항목: 드라이버 급여 상위 3인, 마케팅 비용, 시설 투자",
          "FIA 재무부서(Cost Cap Administration)가 연간 감사",
          "위반 등급: 소액 위반(5% 미만), 중대 위반(5% 이상)",
          "제재: 과징금, 포인트 삭감, 예산 추가 삭감, 실격",
        ],
      },
    ],
  },
  {
    id: "technical",
    icon: "🔧",
    title: "기술 규정",
    subtitle: "안전, 구조, 재료에 관한 기술적 규정",
    color: "#F59E0B",
    items: [
      {
        id: "safety",
        title: "안전 장치 강화",
        summary: "2026년에도 드라이버 안전을 위한 규정이 지속 강화됩니다.",
        details: [
          "헤일로(Halo) 유지: 2018년 도입 후 표준 안전 장치로 자리잡음",
          "측면 충돌 구조물(Side Impact Structure) 강도 기준 상향",
          "FIA 8865-2019 헬멧 기준 유지",
          "HANS 장치 착용 의무",
          "충돌 테스트 기준 강화: 정면·후면·측면 충격 시험",
        ],
      },
      {
        id: "materials",
        title: "재료 및 제조 규정",
        summary: "탄소섬유 사용 범위와 3D 프린팅 부품에 대한 규정이 명확해집니다.",
        details: [
          "탄소섬유 복합재 사용 범위 유지 (모노코크, 날개 구조물 등)",
          "3D 프린팅(적층 제조) 부품: 비구조적 부품에 한해 허용",
          "생체 모방 구조(Bionic Structure) 도입 제한",
          "재활용 재료 사용 비율 목표치 설정 (FIA 지속가능성 계획)",
        ],
      },
      {
        id: "electronics",
        title: "전자 장비 규정",
        summary: "FIA 표준 전자 장비(ECU) 사용 의무가 유지됩니다.",
        details: [
          "FIA 표준 ECU(McLaren Applied Technologies 제공) 의무 사용",
          "텔레메트리: 실시간 데이터 FIA 전송 의무",
          "드라이버 보조 시스템 금지: 트랙션 컨트롤, ABS, 능동 서스펜션",
          "ERS 에너지 배치: 드라이버 직접 제어 + 자동 안전 한계 내 운용",
          "무선 통신: 레이스 중 피트-투-카 통신 FIA 채널 경유",
        ],
      },
    ],
  },
];

export interface ChangeHighlight {
  icon: string;
  title: string;
  description: string;
  beginner: string;
  stat?: string;
  statLabel?: string;
  impact: "high" | "medium" | "low";
  category: string;
  color: string;
}

export const changes2026: ChangeHighlight[] = [
  {
    icon: "⚡",
    title: "전기 출력 350kW — 진짜 하이브리드의 시대",
    description: "MGU-K가 ICE와 동급 출력을 내며 F1 사상 최초의 50:50 하이브리드 실현",
    beginner: "기존 F1은 전기모터가 가솔린 엔진을 살짝 도와주는 역할만 했어요. 2026년부터는 전기모터가 가솔린 엔진과 거의 같은 힘을 냅니다. 총 출력은 약 1,020마력! 여러분의 자동차(보통 100~200마력)의 10배가 넘는 힘이에요.",
    stat: "50:50",
    statLabel: "전기 : 가솔린 출력 비율",
    impact: "high",
    category: "파워유닛",
    color: "#E8002D",
  },
  {
    icon: "🌿",
    title: "100% 지속가능연료(SAF) 의무화",
    description: "화석연료 완전 탈피, F1 탄소 중립 로드맵의 핵심 이정표",
    beginner: "일반 자동차 주유소의 휘발유 대신, 쓰레기·식물·탄소 포집으로 만든 친환경 연료를 씁니다. '불을 피우면서 탄소를 내뿜지 않는다'는 목표를 향한 F1의 첫 번째 큰 발걸음이에요. 연료는 달라도 성능은 그대로 유지됩니다.",
    stat: "100%",
    statLabel: "지속가능연료 사용 비율",
    impact: "high",
    category: "환경",
    color: "#22C55E",
  },
  {
    icon: "💨",
    title: "액티브 에어로 — DRS의 진화판",
    description: "앞뒤 날개가 자동으로 열리고 닫히며 직선에서 항력 55% 감소",
    beginner: "기존 DRS는 '앞차 1초 이내'라는 조건을 만족해야만 뒷날개를 펼 수 있었어요. 2026년부터는 모든 직선 구간에서 앞뒤 날개가 자동으로 납작해집니다. 새가 빨리 날 때 날개를 접듯이 차도 직선에서는 저항을 줄이고, 코너에서는 날개를 최대한 펼쳐 그립을 유지해요.",
    stat: "55%",
    statLabel: "직선 구간 항력 감소",
    impact: "high",
    category: "공기역학",
    color: "#0EA5E9",
  },
  {
    icon: "🔩",
    title: "MGU-H 폐지 — 단순해진 파워유닛",
    description: "F1 역사상 가장 복잡한 파워유닛 부품이 사라지며 신규 참가 장벽 대폭 하락",
    beginner: "MGU-H는 배기가스의 열을 전기로 바꾸는 장치인데, 너무 복잡하고 비싸서 일부 대형 제조사만 만들 수 있었어요. 이걸 없애면서 파워유닛이 훨씬 단순해졌고, 덕분에 Ford나 Cadillac 같은 신규 업체가 F1에 진입할 수 있게 됐습니다.",
    stat: "−1",
    statLabel: "부품 수 (MGU-H 제거)",
    impact: "high",
    category: "파워유닛",
    color: "#F59E0B",
  },
  {
    icon: "📐",
    title: "차폭 100mm 축소 + 30kg 경량화",
    description: "더 좁고 가벼운 머신 — 2,000mm → 1,900mm, 최소 중량 798kg → 768kg",
    beginner: "F1 차가 약 10cm 더 좁아지고 30kg 가벼워져요. 10cm가 별거 아닌 것 같지만, 차에서 10cm는 굉장히 크답니다. 가벼워질수록 가속과 코너링이 더 예리해져서 드라이버 실력이 더 중요해질 수 있어요.",
    stat: "−30kg",
    statLabel: "최저 중량 감소",
    impact: "medium",
    category: "차체",
    color: "#7C3AED",
  },
  {
    icon: "🏎️",
    title: "다운포스 30% 감소 — 추월이 쉬워진다",
    description: "더티 에어 감소로 뒤따르는 차량의 공기역학적 손실 최소화",
    beginner: "다운포스는 차를 바닥에 눌러 주는 공기의 힘이에요. 줄면 코너를 좀 더 천천히 돌아야 하지만, 앞차가 만드는 '더러운 공기(더티 에어)'도 줄어서 뒤따라가기가 훨씬 쉬워져요. 앞차 바짝 붙어 추월 기회를 노리기 좋은 환경이 만들어집니다.",
    stat: "−30%",
    statLabel: "전체 다운포스 감소",
    impact: "medium",
    category: "공기역학",
    color: "#0EA5E9",
  },
  {
    icon: "🏭",
    title: "Ford 엔진 20년 만의 귀환",
    description: "Red Bull Powertrains + Ford 협력, 2026~2030 Red Bull·Racing Bulls에 공급",
    beginner: "미국의 자동차 회사 Ford가 약 20년 만에 F1으로 돌아옵니다. Red Bull의 자체 엔진 개발팀과 협력해 2026년부터 엔진을 공급해요. 한때 마이클 슈마허와 경쟁하던 미국 브랜드가 드디어 F1에 복귀하는 것입니다.",
    stat: "~20년",
    statLabel: "Ford의 F1 공백기",
    impact: "medium",
    category: "팀/제조사",
    color: "#3B82F6",
  },
  {
    icon: "🇺🇸",
    title: "Cadillac F1 — 11번째 팀 참전",
    description: "GM 산하 Cadillac이 2026년부터 신규 팀으로 F1 그리드에 합류",
    beginner: "미국의 고급 자동차 브랜드 Cadillac이 F1에 새 팀으로 참가합니다. 이로써 F1 그리드는 10팀에서 11팀으로 늘어나요. Ford와 함께 미국 브랜드 두 곳이 동시에 F1에 등장하는 역사적인 시즌이 됩니다.",
    stat: "11번째",
    statLabel: "신규 참전 팀",
    impact: "medium",
    category: "팀/제조사",
    color: "#6366F1",
  },
  {
    icon: "🎮",
    title: "오버테이크 모드 & 부스트 버튼",
    description: "드라이버가 전략적으로 전기 출력을 추가 배치할 수 있는 새 도구 도입",
    beginner: "앞차 1초 이내에 접근하면 '오버테이크 모드'가 활성화돼 추가 전기 에너지를 쓸 수 있어요. '부스트 버튼'을 누르면 어느 구간에서든 엔진+배터리 최대 출력을 순간적으로 낼 수 있습니다. 마치 게임의 니트로 버튼처럼요!",
    stat: "NEW",
    statLabel: "2026 신규 도입",
    impact: "medium",
    category: "드라이버 도구",
    color: "#EC4899",
  },
];
