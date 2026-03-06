// PitLane F1 - Mock Data (2026 Season)

// ─── Interfaces ───────────────────────────────────────────────

export interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  number: number;
  team: string;
  teamId: string;
  teamColor: string;
  nationality: string;
  flag: string;
  dateOfBirth: string;
  wins: number;
  podiums: number;
  poles: number;
  championships: number;
  points: number;
  bio: string;                  // Korean biography (2–3 sentences)
  strengths: string[];          // Driving strengths / traits (3–4 items)
  careerHighlights: string[];   // Notable career moments in Korean (3–5 items)
}

export interface DriverChampionship {
  year: number;
  driver: string;
  circuit: string;    // 영문 서킷명
  circuitKo: string;  // 한국어 서킷명
}

export interface Team {
  id: string;
  name: string;
  koreanName: string;
  primaryColor: string;
  base: string;
  principal: string;
  powerUnit: string;
  wins: number;
  podiums: number;
  poles: number;
  constructorTitles: number;
  constructorTitleYears: number[];
  driverIds: string[];
  driverChampionships: DriverChampionship[];
}

export interface Circuit {
  id: string;
  name: string;
  koreanName: string;
  city: string;
  country: string;
  flag: string;
  length: string;
  turns: number;
  drsZones: number;
  laps: number;
  type: "permanent" | "street";
  firstGrandPrix: number;
  lapRecord: { time: string; driver: string; year: number };
  coordinates: { lat: number; lng: number };
  description: string;          // Korean circuit overview (2–3 sentences)
  highlights: string[];         // Korean notable facts / features (3–5 items)
}

export interface SessionSchedule {
  fp1?: string;        // ISO UTC (FP1)
  fp2?: string;        // ISO UTC (FP2 — regular weekends only)
  fp3?: string;        // ISO UTC (FP3 — regular weekends only)
  sq?: string;         // ISO UTC (Sprint Qualifying — sprint weekends only)
  sprint?: string;     // ISO UTC (Sprint Race — sprint weekends only)
  qualifying: string;  // ISO UTC
  race: string;        // ISO UTC
  isSprint: boolean;
}

export interface RaceCalendar {
  round: number;
  name: string;
  koreanName: string;
  circuitId: string;
  date: string;
  status: "completed" | "next" | "upcoming";
  winner?: string;
  sessions?: SessionSchedule; // populated by live API or static fallback
}

export interface Standing {
  position: number;
  driverId: string;
  points: number;
  wins: number;
}

export interface ConstructorStanding {
  position: number;
  teamId: string;
  points: number;
  wins: number;
}

export interface NewsArticle {
  id: string;
  title: string;
  titleKo: string;
  link: string;
  sourceName: string;
  publishedAt: string;
}

export interface Topic {
  title: string;
  articles: NewsArticle[];
  tags: string[];
}

export interface DailyDigest {
  date: string;
  summary: string;
  totalArticles: number;
  topics: Topic[];
  generatedAt: string;
}

// ─── Teams (11 teams) ─────────────────────────────────────────

export const teams: Team[] = [
  {
    id: "red-bull",
    name: "Red Bull Racing",
    koreanName: "레드불 레이싱",
    primaryColor: "#3671C6",
    base: "Milton Keynes, UK",
    principal: "Laurent Mekies",
    powerUnit: "Ford",
    wins: 130,
    podiums: 233,
    poles: 111,
    constructorTitles: 6,
    constructorTitleYears: [2010, 2011, 2012, 2013, 2022, 2023],
    driverIds: ["verstappen", "hadjar"],
    driverChampionships: [
      { year: 2010, driver: "Sebastian Vettel",  circuit: "Yas Marina Circuit",              circuitKo: "야스 마리나 서킷" },
      { year: 2011, driver: "Sebastian Vettel",  circuit: "Suzuka International Racing Course", circuitKo: "스즈카 서킷" },
      { year: 2012, driver: "Sebastian Vettel",  circuit: "Autódromo José Carlos Pace",      circuitKo: "인터라고스 서킷" },
      { year: 2013, driver: "Sebastian Vettel",  circuit: "Buddh International Circuit",     circuitKo: "부드 인터내셔널 서킷" },
      { year: 2021, driver: "Max Verstappen",    circuit: "Yas Marina Circuit",              circuitKo: "야스 마리나 서킷" },
      { year: 2022, driver: "Max Verstappen",    circuit: "Suzuka International Racing Course", circuitKo: "스즈카 서킷" },
      { year: 2023, driver: "Max Verstappen",    circuit: "Lusail International Circuit",    circuitKo: "루사일 인터내셔널 서킷" },
      { year: 2024, driver: "Max Verstappen",    circuit: "Las Vegas Strip Circuit",         circuitKo: "라스베이거스 스트립 서킷" },
    ],
  },
  {
    id: "mclaren",
    name: "McLaren",
    koreanName: "맥라렌",
    primaryColor: "#FF8000",
    base: "Woking, UK",
    principal: "Andrea Stella",
    powerUnit: "Mercedes",
    wins: 203,
    podiums: 445,
    poles: 177,
    constructorTitles: 10,
    constructorTitleYears: [1974, 1984, 1985, 1988, 1989, 1990, 1991, 1998, 2024, 2025],
    driverIds: ["norris", "piastri"],
    driverChampionships: [
      { year: 1974, driver: "Emerson Fittipaldi", circuit: "Watkins Glen",                    circuitKo: "왓킨스 글렌" },
      { year: 1984, driver: "Niki Lauda",         circuit: "Estoril Circuit",                 circuitKo: "에스토릴 서킷" },
      { year: 1985, driver: "Alain Prost",        circuit: "Brands Hatch",                    circuitKo: "브랜즈 해치" },
      { year: 1988, driver: "Ayrton Senna",       circuit: "Suzuka International Racing Course", circuitKo: "스즈카 서킷" },
      { year: 1989, driver: "Alain Prost",        circuit: "Suzuka International Racing Course", circuitKo: "스즈카 서킷" },
      { year: 1990, driver: "Ayrton Senna",       circuit: "Suzuka International Racing Course", circuitKo: "스즈카 서킷" },
      { year: 1991, driver: "Ayrton Senna",       circuit: "Suzuka International Racing Course", circuitKo: "스즈카 서킷" },
      { year: 1998, driver: "Mika Häkkinen",      circuit: "Suzuka International Racing Course", circuitKo: "스즈카 서킷" },
      { year: 1999, driver: "Mika Häkkinen",      circuit: "Suzuka International Racing Course", circuitKo: "스즈카 서킷" },
      { year: 2025, driver: "Lando Norris",       circuit: "Las Vegas Strip Circuit",         circuitKo: "라스베이거스 스트립 서킷" },
    ],
  },
  {
    id: "ferrari",
    name: "Scuderia Ferrari",
    koreanName: "스쿠데리아 페라리",
    primaryColor: "#E8002D",
    base: "Maranello, Italy",
    principal: "Frédéric Vasseur",
    powerUnit: "Ferrari",
    wins: 249,
    podiums: 639,
    poles: 254,
    constructorTitles: 16,
    constructorTitleYears: [1961, 1964, 1975, 1976, 1977, 1979, 1982, 1983, 1999, 2000, 2001, 2002, 2003, 2004, 2007, 2008],
    driverIds: ["hamilton", "leclerc"],
    driverChampionships: [
      { year: 1952, driver: "Alberto Ascari",     circuit: "Rouen-les-Essarts",               circuitKo: "루앙 레 에사르" },
      { year: 1953, driver: "Alberto Ascari",     circuit: "Bremgarten Circuit",              circuitKo: "브렘가르텐 서킷" },
      { year: 1958, driver: "Mike Hawthorn",      circuit: "Ain Diab Circuit",                circuitKo: "아인 디아브 서킷" },
      { year: 1961, driver: "Phil Hill",          circuit: "Autodromo Nazionale Monza",       circuitKo: "몬자 서킷" },
      { year: 1964, driver: "John Surtees",       circuit: "Autódromo Hermanos Rodríguez",    circuitKo: "에르마노스 로드리게스 서킷" },
      { year: 1975, driver: "Niki Lauda",         circuit: "Autodromo Nazionale Monza",       circuitKo: "몬자 서킷" },
      { year: 1977, driver: "Niki Lauda",         circuit: "Circuit Zandvoort",               circuitKo: "잔드보르트 서킷" },
      { year: 1979, driver: "Jody Scheckter",     circuit: "Autodromo Nazionale Monza",       circuitKo: "몬자 서킷" },
      { year: 2000, driver: "Michael Schumacher", circuit: "Suzuka International Racing Course", circuitKo: "스즈카 서킷" },
      { year: 2001, driver: "Michael Schumacher", circuit: "Hungaroring",                     circuitKo: "헝가로링" },
      { year: 2002, driver: "Michael Schumacher", circuit: "Circuit de Nevers Magny-Cours",   circuitKo: "마니 쿠르 서킷" },
      { year: 2003, driver: "Michael Schumacher", circuit: "Suzuka International Racing Course", circuitKo: "스즈카 서킷" },
      { year: 2004, driver: "Michael Schumacher", circuit: "Circuit de Spa-Francorchamps",    circuitKo: "스파 프랑코르샹 서킷" },
      { year: 2007, driver: "Kimi Räikkönen",     circuit: "Autódromo José Carlos Pace",      circuitKo: "인터라고스 서킷" },
    ],
  },
  {
    id: "mercedes",
    name: "Mercedes-AMG Petronas",
    koreanName: "메르세데스",
    primaryColor: "#27F4D2",
    base: "Brackley, UK",
    principal: "Toto Wolff",
    powerUnit: "Mercedes",
    wins: 122,
    podiums: 201,
    poles: 135,
    constructorTitles: 8,
    constructorTitleYears: [2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021],
    driverIds: ["russell", "antonelli"],
    driverChampionships: [
      { year: 2014, driver: "Lewis Hamilton", circuit: "Yas Marina Circuit",              circuitKo: "야스 마리나 서킷" },
      { year: 2015, driver: "Lewis Hamilton", circuit: "Circuit of the Americas",         circuitKo: "서킷 오브 디 아메리카스" },
      { year: 2016, driver: "Nico Rosberg",   circuit: "Yas Marina Circuit",              circuitKo: "야스 마리나 서킷" },
      { year: 2017, driver: "Lewis Hamilton", circuit: "Autódromo Hermanos Rodríguez",    circuitKo: "에르마노스 로드리게스 서킷" },
      { year: 2018, driver: "Lewis Hamilton", circuit: "Autódromo Hermanos Rodríguez",    circuitKo: "에르마노스 로드리게스 서킷" },
      { year: 2019, driver: "Lewis Hamilton", circuit: "Suzuka International Racing Course", circuitKo: "스즈카 서킷" },
      { year: 2020, driver: "Lewis Hamilton", circuit: "Intercity Istanbul Park",         circuitKo: "이스탄불 파크" },
    ],
  },
  {
    id: "aston-martin",
    name: "Aston Martin",
    koreanName: "애스턴 마틴",
    primaryColor: "#229971",
    base: "Silverstone, UK",
    principal: "Adrian Newey",
    powerUnit: "Honda",
    wins: 1,
    podiums: 12,
    poles: 1,
    constructorTitles: 0,
    constructorTitleYears: [],
    driverIds: ["alonso", "stroll"],
    driverChampionships: [],
  },
  {
    id: "alpine",
    name: "Alpine F1 Team",
    koreanName: "알핀",
    primaryColor: "#FF87BC",
    base: "Enstone, UK",
    principal: "Flavio Briatore",
    powerUnit: "Mercedes",
    wins: 21,
    podiums: 60,
    poles: 20,
    constructorTitles: 2,
    constructorTitleYears: [2005, 2006],
    driverIds: ["gasly", "colapinto"],
    driverChampionships: [
      { year: 2005, driver: "Fernando Alonso", circuit: "Autódromo José Carlos Pace", circuitKo: "인터라고스 서킷" },
      { year: 2006, driver: "Fernando Alonso", circuit: "Autódromo José Carlos Pace", circuitKo: "인터라고스 서킷" },
    ],
  },
  {
    id: "williams",
    name: "Williams Racing",
    koreanName: "윌리엄스",
    primaryColor: "#1868DB",
    base: "Grove, UK",
    principal: "James Vowles",
    powerUnit: "Mercedes",
    wins: 114,
    podiums: 245,
    poles: 128,
    constructorTitles: 9,
    constructorTitleYears: [1980, 1981, 1986, 1987, 1992, 1993, 1994, 1996, 1997],
    driverIds: ["sainz", "albon"],
    driverChampionships: [
      { year: 1980, driver: "Alan Jones",          circuit: "Circuit Gilles Villeneuve",        circuitKo: "질 빌뇌브 서킷" },
      { year: 1982, driver: "Keke Rosberg",        circuit: "Caesars Palace Grand Prix Circuit", circuitKo: "시저스 팰리스 서킷" },
      { year: 1987, driver: "Nelson Piquet",       circuit: "Suzuka International Racing Course", circuitKo: "스즈카 서킷" },
      { year: 1992, driver: "Nigel Mansell",       circuit: "Hungaroring",                     circuitKo: "헝가로링" },
      { year: 1993, driver: "Alain Prost",         circuit: "Estoril Circuit",                 circuitKo: "에스토릴 서킷" },
      { year: 1996, driver: "Damon Hill",          circuit: "Suzuka International Racing Course", circuitKo: "스즈카 서킷" },
      { year: 1997, driver: "Jacques Villeneuve",  circuit: "Jerez Circuit",                   circuitKo: "헤레스 서킷" },
    ],
  },
  {
    id: "rb",
    name: "Racing Bulls",
    koreanName: "레이싱 불스",
    primaryColor: "#6692FF",
    base: "Faenza, Italy",
    principal: "Alan Permane",
    powerUnit: "Ford",
    wins: 2,
    podiums: 6,
    poles: 1,
    constructorTitles: 0,
    constructorTitleYears: [],
    driverIds: ["lawson", "lindblad"],
    driverChampionships: [],
  },
  {
    id: "haas",
    name: "Haas F1 Team",
    koreanName: "하스",
    primaryColor: "#B6BABD",
    base: "Kannapolis, USA",
    principal: "Ayao Komatsu",
    powerUnit: "Ferrari",
    wins: 0,
    podiums: 0,
    poles: 1,
    constructorTitles: 0,
    constructorTitleYears: [],
    driverIds: ["ocon", "bearman"],
    driverChampionships: [],
  },
  {
    id: "sauber",
    name: "Audi F1 Team",
    koreanName: "아우디",
    primaryColor: "#52E252",
    base: "Hinwil, Switzerland",
    principal: "Mattia Binotto",
    powerUnit: "Audi",
    wins: 1,
    podiums: 28,
    poles: 1,
    constructorTitles: 0,
    constructorTitleYears: [],
    driverIds: ["hulkenberg", "bortoleto"],
    driverChampionships: [],
  },
  {
    id: "cadillac",
    name: "Cadillac F1 Team",
    koreanName: "캐딜락",
    primaryColor: "#C0A44D",
    base: "Silverstone, UK",
    principal: "Graeme Lowdon",
    powerUnit: "Ferrari",
    wins: 0,
    podiums: 0,
    poles: 0,
    constructorTitles: 0,
    constructorTitleYears: [],
    driverIds: ["bottas", "perez"],
    driverChampionships: [],
  },
];

// ─── Drivers (22 drivers) ─────────────────────────────────────

export const drivers: Driver[] = [
  // ── Red Bull Racing ───────────────────────────────────────────
  {
    id: "verstappen", firstName: "Max", lastName: "Verstappen",
    number: 3, team: "Red Bull Racing", teamId: "red-bull", teamColor: "#3671C6",
    nationality: "Netherlands", flag: "🇳🇱", dateOfBirth: "1997-09-30",
    wins: 71, podiums: 127, poles: 48, championships: 4, points: 3445,
    bio: "현대 F1의 지배자. 17세에 데뷔해 역대 최연소 포인트 스코어러 기록을 세운 막스 베르스타펜은 2021~2024년 4연속 세계 챔피언에 오르며 미하엘 슈마허, 루이스 해밀턴과 어깨를 나란히 하는 최정상급 레이서로 자리매김했다. 거침없는 공격적 레이싱 스타일과 비 오는 날 압도적인 퍼포먼스로 '레인 마스터'라는 별명도 갖고 있다.",
    strengths: ["압도적인 원랩 페이스", "레인 컨디션 마스터", "타이어 관리 & 페이스 조절", "극한 압박 속 냉정한 판단력"],
    careerHighlights: [
      "2015년 17세 170일 — 역대 최연소 F1 데뷔 (토로 로소, 호주 GP)",
      "2016년 스페인 GP — 레드불 이적 첫 레이스에서 생애 첫 우승",
      "2021년 아부다비 GP — 마지막 랩 해밀턴 추월로 극적인 첫 월드 챔피언십 획득",
      "2023년 시즌 — 22승으로 단일 시즌 최다 우승 기록 경신 (종전 슈마허·베텔 13승)",
      "2024년 라스베이거스 GP — 노리스와 치열한 타이틀 경쟁 끝에 4연속 WDC 확정",
    ],
  },
  {
    id: "hadjar", firstName: "Isack", lastName: "Hadjar",
    number: 6, team: "Red Bull Racing", teamId: "red-bull", teamColor: "#3671C6",
    nationality: "France", flag: "🇫🇷", dateOfBirth: "2004-09-28",
    wins: 0, podiums: 1, poles: 0, championships: 0, points: 51,
    bio: "프랑스-알제리 출신의 이사크 하드자르는 2024년 F2 챔피언십을 석권한 직후 레드불 주니어 프로그램을 통해 2026년 F1 풀타임 시트를 획득했다. 뛰어난 레이스 페이스와 냉정한 두뇌 플레이로 레드불 아카데미 역대 최고 유망주 중 하나로 평가받는다.",
    strengths: ["일관된 레이스 페이스", "전략적 타이어 관리", "압박 상황에서의 안정성"],
    careerHighlights: [
      "2024년 FIA F2 챔피언십 우승 — 레드불 아카데미 졸업 자격 획득",
      "2024년 아부다비 FP1 — 레드불 차량으로 첫 F1 공식 세션 참가",
      "F2 시즌 중 7회 우승 — 단연 최다 우승 드라이버로 챔피언십 압도",
    ],
  },

  // ── McLaren ───────────────────────────────────────────────────
  {
    id: "norris", firstName: "Lando", lastName: "Norris",
    number: 1, team: "McLaren", teamId: "mclaren", teamColor: "#FF8000",
    nationality: "United Kingdom", flag: "🇬🇧", dateOfBirth: "1999-11-13",
    wins: 11, podiums: 44, poles: 16, championships: 1, points: 1430,
    bio: "2025년 F1 월드 챔피언. 브리스톨 출신의 랜도 노리스는 감성적이고 솔직한 성격으로 팬들의 압도적 지지를 받는 동시에, 맥라렌과 함께 쌓아온 수년간의 헌신이 결실을 맺어 2025년 첫 세계 챔피언십을 차지했다. 젖은 노면에서의 본능적인 컨트롤과 폭발적인 예선 퍼포먼스가 트레이드마크다.",
    strengths: ["폭발적 원랩 퀄리파잉 페이스", "레인 컨디션 적응력", "감각적 레이스 기어 전환", "팀 빌딩 & 사기 고취"],
    careerHighlights: [
      "2019년 F1 데뷔 — 첫 시즌부터 상위권 팀인 맥라렌 정규 드라이버로 출발",
      "2021년 러시아 GP — 선두 달리다 예상치 못한 비에 타이어 교체 실패, 7위로 후퇴 (첫 우승 물거품)",
      "2024년 마이애미 GP — 생애 첫 F1 우승 달성 (통산 6년 만)",
      "2025년 라스베이거스 GP — 베르스타펜과 치열한 최종전 끝에 세계 챔피언 등극",
      "2026 시즌 — 챔피언 넘버 #1을 달고 타이틀 방어에 나섬",
    ],
  },
  {
    id: "piastri", firstName: "Oscar", lastName: "Piastri",
    number: 81, team: "McLaren", teamId: "mclaren", teamColor: "#FF8000",
    nationality: "Australia", flag: "🇦🇺", dateOfBirth: "2001-04-06",
    wins: 9, podiums: 26, poles: 6, championships: 0, points: 799,
    bio: "멜버른 출신의 오스카 피아스트리는 F2·F3 챔피언 출신답게 조용하고 냉철한 두뇌 플레이로 F1에 안착했다. 화려함보다 효율을 추구하는 스타일로 '고요한 속도'를 지닌 드라이버로 평가받으며, 팀 내에서 노리스와 건강한 경쟁 구도를 형성하고 있다.",
    strengths: ["데이터 기반 일관성", "타이어 한계점 관리", "냉정한 레이스 실행력", "빠른 학습 곡선"],
    careerHighlights: [
      "2021·2022년 F3·F2 챔피언십 2년 연속 석권",
      "2023년 알파인 계약 파기·맥라렌 이적 분쟁 — 법적 공방 끝에 맥라렌 합류 성사",
      "2023년 헝가리 GP — F1 첫 스프린트 레이스 우승",
      "2024년 바레인 GP — 정규 레이스 첫 우승 달성",
      "2024년 시즌 — 맥라렌 컨스트럭터 챔피언십 달성에 핵심 기여",
    ],
  },

  // ── Ferrari ───────────────────────────────────────────────────
  {
    id: "hamilton", firstName: "Lewis", lastName: "Hamilton",
    number: 44, team: "Scuderia Ferrari", teamId: "ferrari", teamColor: "#E8002D",
    nationality: "United Kingdom", flag: "🇬🇧", dateOfBirth: "1985-01-07",
    wins: 105, podiums: 202, poles: 104, championships: 7, points: 5019,
    bio: "F1 역사상 가장 위대한 드라이버로 손꼽히는 루이스 해밀턴은 7번의 세계 챔피언십, 104번의 폴 포지션, 105번의 우승 등 F1의 거의 모든 주요 기록을 보유하고 있다. 2025년 페라리로 이적을 결정해 전 세계 팬들을 충격에 빠뜨렸고, 2026년 새 레귤레이션 아래 8번째 타이틀을 향한 새 챕터를 열었다.",
    strengths: ["압도적 레이스 관리 능력", "전략적 순간 판단력", "젖은 노면 탁월한 컨트롤", "롱런 페이스와 타이어 보존"],
    careerHighlights: [
      "2007년 F1 데뷔 — 신인으로 시즌 최종전까지 타이틀 경쟁",
      "2008년 맥라렌 소속 첫 WDC — 마지막 랩 5위 통과로 0.5포인트 차 역전 우승",
      "2014~2020년 메르세데스에서 6번의 WDC 추가 — 슈마허의 7회 타이 기록",
      "2020년 포르투갈 GP — 91번째 우승으로 슈마허 기록 돌파 후 최종 105승",
      "2025년 — 페라리 이적을 발표, F1 역사상 가장 큰 이적 뉴스 중 하나",
    ],
  },
  {
    id: "leclerc", firstName: "Charles", lastName: "Leclerc",
    number: 16, team: "Scuderia Ferrari", teamId: "ferrari", teamColor: "#E8002D",
    nationality: "Monaco", flag: "🇲🇨", dateOfBirth: "1997-10-16",
    wins: 8, podiums: 50, poles: 27, championships: 0, points: 1672,
    bio: "모나코 태생의 찰스 레클레르는 어린 시절 아버지처럼 따르던 페라리 대부 세르조 마르키온네의 응원 속에 페라리 아카데미에 입문해 2019년부터 스쿠데리아의 간판 드라이버로 활약하고 있다. 예선에서 차를 한계 너머까지 밀어붙이는 원랩 스피드는 현역 최고 수준이며, 2026년 해밀턴과의 공동 선봉이라는 새로운 도전에 직면해 있다.",
    strengths: ["원랩 퀄리파잉 속도 (현역 최고 수준)", "공격적 레이스 스타트", "개인 한계 돌파 드라이빙", "서킷 데이터 암기력"],
    careerHighlights: [
      "2019년 벨기에 GP — 친구 위베르 사망 다음날 포디움에 올라 눈물의 우승",
      "2019년 이탈리아 GP — 홈 팬 티포시 앞에서 연속 우승, 페라리 팬 열광",
      "2022년 시즌 — 개막 2연승으로 챔피언십 선두 달리다 페라리 전략 실수로 타이틀 탈락",
      "2024년 모나코 GP — 홈 서킷에서 생애 첫 모나코 우승 달성 (오랜 모나코 저주 해소)",
      "2026년 — 해밀턴과의 팀 내 경쟁 구도, 페라리의 WDC 탈환 공동 미션",
    ],
  },

  // ── Mercedes ──────────────────────────────────────────────────
  {
    id: "russell", firstName: "George", lastName: "Russell",
    number: 63, team: "Mercedes", teamId: "mercedes", teamColor: "#27F4D2",
    nationality: "United Kingdom", flag: "🇬🇧", dateOfBirth: "1998-02-15",
    wins: 5, podiums: 24, poles: 7, championships: 0, points: 1033,
    bio: "킹스린 출신의 조지 러셀은 카트 시절부터 '완벽한 드라이버'로 불릴 만큼 실수가 적고 분석적인 레이싱 스타일을 구사한다. 윌리엄스에서 3년간 개인 기량을 증명한 뒤 2022년 메르세데스 1군에 합류했고, 2025년 해밀턴의 페라리 이적 이후 팀의 확실한 리더로 자리잡았다.",
    strengths: ["실수 제로에 가까운 일관성", "데이터·공학적 피드백 역량", "타이어 열화 관리", "긴 레이스에서의 페이스 유지"],
    careerHighlights: [
      "2020년 사키르 GP — 해밀턴 대체 출전으로 메르세데스 데뷔, 리드 중 피트스톱 실수로 9위",
      "2021년 벨기에 GP — 버추얼 레이스로 윌리엄스 역대 두 번째 포디움 기록",
      "2022년 브라질 GP — 메르세데스 합류 첫 시즌 첫 우승 달성",
      "2023년 시즌 — 메르세데스의 어려운 상황에서도 꾸준히 포디움 유지",
      "2025년 — 해밀턴 이탈 후 메르세데스 단독 리더로 새 시대 개막",
    ],
  },
  {
    id: "antonelli", firstName: "Andrea Kimi", lastName: "Antonelli",
    number: 12, team: "Mercedes", teamId: "mercedes", teamColor: "#27F4D2",
    nationality: "Italy", flag: "🇮🇹", dateOfBirth: "2006-08-25",
    wins: 0, podiums: 3, poles: 0, championships: 0, points: 150,
    bio: "볼로냐 출신의 안드레아 키미 안토넬리는 2006년생으로 2026년 F1 데뷔 당시 역대 세 번째로 어린 그리드 데뷔 드라이버다. 이름 중간의 '키미'는 킴 라이쾨넨을 존경해 부모가 붙여준 이름으로 유명하다. 메르세데스가 해밀턴의 후계자로 낙점한 미래의 F1 슈퍼스타로 평가받는다.",
    strengths: ["폭발적인 원랩 속도", "빠른 상황 적응력", "공격적 오버테이킹 본능"],
    careerHighlights: [
      "2024년 유러피안 F2 챔피언십 우승 — 역대 최연소 F2 챔피언 기록",
      "2024년 이탈리아 GP FP1 — 메르세데스 차량으로 첫 F1 세션 출전, 크래시로 화제",
      "2025년 메르세데스 공식 계약 발표 — 해밀턴의 페라리 이적 직후 깜짝 발탁 소식",
      "2026년 — 19세 나이로 F1 풀타임 데뷔, 최연소 메르세데스 정규 드라이버",
    ],
  },

  // ── Aston Martin ──────────────────────────────────────────────
  {
    id: "alonso", firstName: "Fernando", lastName: "Alonso",
    number: 14, team: "Aston Martin", teamId: "aston-martin", teamColor: "#229971",
    nationality: "Spain", flag: "🇪🇸", dateOfBirth: "1981-07-29",
    wins: 32, podiums: 106, poles: 22, championships: 2, points: 2393,
    bio: "오비에도 출신의 페르난도 알론소는 2026년 기준 만 44세에도 여전히 F1 그리드에서 경쟁하는 '영원한 라이벌'이다. 두 번의 세계 챔피언이자 20년 넘는 F1 커리어 동안 르망 24시, 인디500에도 도전한 모터스포츠의 살아있는 전설로, 특유의 냉소적 유머와 경쟁심은 나이를 잊게 만든다.",
    strengths: ["레이스 두뇌 게임 (F1 역대 최고 수준)", "타이어 & 전략 활용 극대화", "방어 운전 & 배틀 노하우", "무한한 동기 부여"],
    careerHighlights: [
      "2005·2006년 르노 소속 2연속 WDC — 슈마허 왕조 마감, 역대 최연소 더블 챔피언",
      "2007년 맥라렌 해밀턴과 팀 내 전쟁 — 시즌 내내 최고 드라마 연출",
      "2012년 페라리 소속 — 차량 성능 열세에도 챔피언십 최종전까지 리드",
      "2023년 시즌 — 애스턴 마틴과 포디움 8회, '알론소 르네상스' 선언",
      "2026년 — 만 44세에도 현역 유지, F1 역대 최고령 포인트 스코어러 기록 경신 중",
    ],
  },
  {
    id: "stroll", firstName: "Lance", lastName: "Stroll",
    number: 18, team: "Aston Martin", teamId: "aston-martin", teamColor: "#229971",
    nationality: "Canada", flag: "🇨🇦", dateOfBirth: "1998-10-29",
    wins: 0, podiums: 3, poles: 1, championships: 0, points: 325,
    bio: "캐나다의 억만장자 로렌스 스트롤의 아들인 랜스 스트롤은 아버지가 인수한 애스턴 마틴 팀에서 커리어를 이어가고 있다. 외부의 날선 비판에도 불구하고 빗길 레이스나 혼전 상황에서 의외의 강함을 보여주며, 2020년 터키 GP 폴 포지션은 그를 달리 보게 하는 계기가 됐다.",
    strengths: ["빗길 레이싱 감각", "혼전 상황 생존 능력", "뛰어난 스타트 반응속도"],
    careerHighlights: [
      "2017년 이탈리아 GP — 18세 나이로 F1 첫 포디움 달성 (윌리엄스)",
      "2020년 터키 GP — 폴 포지션 획득 (레이싱 포인트 소속, 빗속 예선 최고 기록)",
      "2022년 아제르바이잔 GP — 레드불과 싸우며 포디움, 시즌 최고 레이스",
      "2023년 시즌 — 알론소와 함께 애스턴 마틴 포디움 피날레 공동 완성",
    ],
  },

  // ── Alpine ────────────────────────────────────────────────────
  {
    id: "gasly", firstName: "Pierre", lastName: "Gasly",
    number: 10, team: "Alpine", teamId: "alpine", teamColor: "#FF87BC",
    nationality: "France", flag: "🇫🇷", dateOfBirth: "1996-02-07",
    wins: 1, podiums: 5, poles: 0, championships: 0, points: 458,
    bio: "루앙 출신의 피에르 가슬리는 레드불 강등·알파타우리 재기라는 극적인 여정을 거친 드라이버다. 2020년 이탈리아 GP에서 기적 같은 첫 우승을 차지한 뒤 성격이 밝고 감정 표현이 풍부한 드라이버로 팬들의 사랑을 받고 있으며, 2023년부터 알핀의 핵심으로 활약 중이다.",
    strengths: ["중위권 팀에서의 최대 결과 추출", "레이스 중 집중력 유지", "감각적인 오버테이킹"],
    careerHighlights: [
      "2019년 — 레드불 강등 후 토로 로소로 복귀, 최악의 시즌 극복",
      "2020년 이탈리아 GP — 전방 다중 사고 후 선두 수성, 생애 첫이자 유일한 우승",
      "2021년 아제르바이잔 GP — 베르스타펜 타이어 블로아웃 직후 2위 유지",
      "2023년 알핀 합류 — 프랑스 팀의 새 얼굴로 기대 이상의 포인트 수확",
    ],
  },
  {
    id: "colapinto", firstName: "Franco", lastName: "Colapinto",
    number: 43, team: "Alpine", teamId: "alpine", teamColor: "#FF87BC",
    nationality: "Argentina", flag: "🇦🇷", dateOfBirth: "2003-05-27",
    wins: 0, podiums: 0, poles: 0, championships: 0, points: 5,
    bio: "아르헨티나 팜파스 출신의 프랑코 콜라핀토는 2024년 윌리엄스 시즌 도중 깜짝 데뷔해 즉각적인 인상을 남긴 뒤 2026년 알핀과 정규 계약을 맺었다. 남미 전역의 뜨거운 팬덤을 등에 업은 콜라핀토는 2026년이 커리어의 진짜 출발점이다.",
    strengths: ["공격적인 레이스 본능", "빠른 팀 적응력", "압박 상황에서의 투지"],
    careerHighlights: [
      "2024년 이탈리아 GP — 윌리엄스 시즌 도중 데뷔, 깜짝 포인트 수확",
      "2024년 — 단 9경기 출전으로 21점 획득, 역대급 신인 임팩트",
      "2025년 알핀 시트 확보 — 잭 두한 교체 임박 속 전격 발탁",
      "2026년 — 알핀 정규 드라이버로 첫 풀 시즌, 아르헨티나 팬들의 기대 폭발",
    ],
  },

  // ── Williams ──────────────────────────────────────────────────
  {
    id: "sainz", firstName: "Carlos", lastName: "Sainz",
    number: 55, team: "Williams", teamId: "williams", teamColor: "#1868DB",
    nationality: "Spain", flag: "🇪🇸", dateOfBirth: "1994-09-01",
    wins: 4, podiums: 29, poles: 6, championships: 0, points: 1337,
    bio: "마드리드 출신, 두 번의 WRC 챔피언 카를로스 사인스 시니어의 아들로 태어난 카를로스 사인스 주니어는 F1 아카데미의 정석을 밟아온 드라이버다. 르노·맥라렌·페라리를 거쳐 2026년 윌리엄스로 이적한 그는 어떤 팀에서든 기대 이상의 결과를 내는 '팀 빌더' 드라이버로 정평이 나 있다.",
    strengths: ["팀 전체 성능 끌어올리는 리더십", "예선 집중력", "세밀한 타이어 온도 관리", "어떤 차에서도 최대 결과 추출"],
    careerHighlights: [
      "2021년 모나코 GP — 페라리 소속 첫 포디움 달성",
      "2023년 싱가포르 GP — 깐깐한 마리나베이에서 생애 첫 F1 우승",
      "2023년 오스트레일리아 GP — 빗속 레이스 우승, 타이어 전략 완벽 실행",
      "2024년 멕시코 GP — 페라리와 마지막 레이스에서 우승하며 화려한 이별",
      "2026년 — 해밀턴·레클레르에 밀려난 페라리 떠나 윌리엄스의 구원투수로 입성",
    ],
  },
  {
    id: "albon", firstName: "Alexander", lastName: "Albon",
    number: 23, team: "Williams", teamId: "williams", teamColor: "#1868DB",
    nationality: "Thailand", flag: "🇹🇭", dateOfBirth: "1996-03-23",
    wins: 0, podiums: 2, poles: 0, championships: 0, points: 313,
    bio: "태국계 영국인 알렉산더 알본은 레드불 강등과 2021년 시즌 아웃이라는 시련을 딛고 2022년 윌리엄스로 복귀해 뛰어난 레이스 관리 능력으로 팀의 에이스 역할을 충실히 수행하고 있다. 특히 전략적 타이어 관리와 팀 내 기술 피드백 역량이 탁월하다는 평가를 받는다.",
    strengths: ["타이어 보존 및 롱런 관리", "인내심 있는 레이스 전략 실행", "팀 개발 기여도"],
    careerHighlights: [
      "2020년 바레인 GP — 레드불 소속, 해밀턴과 접전 끝에 3위 포디움",
      "2021년 — 레드불 강등 후 시즌 아웃, 이후 윌리엄스로 재기",
      "2022년 — 윌리엄스 복귀 후 신뢰감 있는 레이스로 '재평가' 완성",
      "2023년 — 중위권 속에서 꾸준히 포인트 누적, 팀 에이스로 자리매김",
    ],
  },

  // ── Racing Bulls ──────────────────────────────────────────────
  {
    id: "lawson", firstName: "Liam", lastName: "Lawson",
    number: 30, team: "Racing Bulls", teamId: "rb", teamColor: "#6692FF",
    nationality: "New Zealand", flag: "🇳🇿", dateOfBirth: "2002-02-11",
    wins: 0, podiums: 0, poles: 0, championships: 0, points: 44,
    bio: "뉴질랜드 크라이스트처치 출신의 리암 로손은 포뮬러 2에서의 인상적인 기록과 2023년 여러 GP 대체 출전을 통해 레드불 경영진의 마음을 사로잡았다. 2025년 레드불 승격 후 팀 내 다이내믹 변화 속에 2026년 레이싱 불스로 자리를 옮겼다.",
    strengths: ["공격적인 레이스 오버테이킹", "빠른 팀 차량 적응", "초반 스프린트 능력"],
    careerHighlights: [
      "2023년 네덜란드·이탈리아·싱가포르 GP — 피에르 가슬리 부상 대체 출전으로 즉각 포인트",
      "2024년 — 야마모토·리카르도 교체 후 레드불 알파타우리(RB) 시즌 합류",
      "2025년 레드불 레이싱 승격 — 페레스 방출 후 베르스타펜 팀메이트로 발탁",
      "2026년 레이싱 불스로 이동 — 베르스타펜과의 경쟁 후 재정비 시즌",
    ],
  },
  {
    id: "lindblad", firstName: "Arvid", lastName: "Lindblad",
    number: 41, team: "Racing Bulls", teamId: "rb", teamColor: "#6692FF",
    nationality: "United Kingdom", flag: "🇬🇧", dateOfBirth: "2007-06-21",
    wins: 0, podiums: 0, poles: 0, championships: 0, points: 0,
    bio: "2007년 6월생 아르비드 린드블라드는 2026년 F1 데뷔 당시 만 18세로 역대 F1 최연소 드라이버 기록에 도전하는 스웨덴계 영국인 유망주다. 레드불 주니어 출신으로 F3·F2를 고속으로 통과하며 '다음 베르스타펜' 후보로 거론되고 있다.",
    strengths: ["천재적인 원랩 감각", "두려움 없는 공격 레이싱", "빠른 차량 한계 탐색"],
    careerHighlights: [
      "2024년 F3 챔피언십 우승 — 16세에 달성한 역대 최연소 F3 챔피언",
      "2025년 F2 고속 승격 — 한 시즌 만에 우승 경쟁 돌입",
      "2026년 F1 데뷔 — 레이싱 불스 정규 드라이버로 역사적 최연소 데뷔 도전",
    ],
  },

  // ── Haas ──────────────────────────────────────────────────────
  {
    id: "ocon", firstName: "Esteban", lastName: "Ocon",
    number: 31, team: "Haas", teamId: "haas", teamColor: "#B6BABD",
    nationality: "France", flag: "🇫🇷", dateOfBirth: "1996-09-17",
    wins: 1, podiums: 4, poles: 0, championships: 0, points: 483,
    bio: "노르망디 출신의 에스테반 오콩은 어린 시절 경제적 어려움 속에서도 카트 챔피언십 우승을 거머쥐는 집념으로 F1까지 올라온 드라이버다. 2021년 헝가리 GP에서 극적인 첫 우승을 달성했으며, 알핀을 거쳐 2026년 하스로 이적해 커리어의 새 페이지를 열었다.",
    strengths: ["끈질긴 레이스 수비", "혼전 속 생존 레이싱", "타이어 관리"],
    careerHighlights: [
      "2017년 — 페레스와 피트레인에서 충돌, F1 최악의 팀메이트 사건 중 하나",
      "2021년 헝가리 GP — 대다수 선두 그룹 탈락 혼전 속 극적 첫 우승",
      "2022년 모나코 GP — 최하위 그리드에서 8위 피니시, 전략의 승리",
      "2025년 — 알핀 계약 만료, 하스로 이적하며 새 출발",
    ],
  },
  {
    id: "bearman", firstName: "Oliver", lastName: "Bearman",
    number: 87, team: "Haas", teamId: "haas", teamColor: "#B6BABD",
    nationality: "United Kingdom", flag: "🇬🇧", dateOfBirth: "2005-05-08",
    wins: 0, podiums: 0, poles: 0, championships: 0, points: 48,
    bio: "영국 첼름스퍼드 출신의 올리버 베어만은 2024년 사우디아라비아 GP에서 식중독으로 빠진 사인스 대신 단 하루 전날 통보를 받고 페라리로 F1 데뷔, 7위 포인트 피니시를 기록하며 세상을 놀라게 했다. 2025년부터 하스 정규 드라이버로 활약 중인 차세대 영국 유망주다.",
    strengths: ["즉각적 상황 적응력", "침착한 레이스 판단력", "패스트 카 감각"],
    careerHighlights: [
      "2024년 사우디아라비아 GP — 18세 나이로 24시간 전 통보 후 페라리 데뷔, 7위 포인트",
      "2024년 아제르바이잔 GP — 하스 복귀 출전, 안정적 레이스 운영",
      "2025년 하스 정규 드라이버 확정 — 하스 역대 최연소 정규 드라이버",
    ],
  },

  // ── Sauber (Audi) ─────────────────────────────────────────────
  {
    id: "hulkenberg", firstName: "Nico", lastName: "Hülkenberg",
    number: 27, team: "Sauber", teamId: "sauber", teamColor: "#52E252",
    nationality: "Germany", flag: "🇩🇪", dateOfBirth: "1987-08-19",
    wins: 0, podiums: 1, poles: 1, championships: 0, points: 622,
    bio: "에므스란트 출신의 니코 휠켄베르그는 F1 역사상 가장 많은 레이스를 포디움 없이 소화한 드라이버였으나, 2025년 사우버에서 마침내 첫 포디움을 달성하며 오랜 숙원을 풀었다. 2026년 아우디 F1 시대를 열어갈 핵심 드라이버로 독일 모터스포츠 팬들의 기대를 한 몸에 받고 있다.",
    strengths: ["중위권 팀 최대 성능 추출", "내구성 있는 레이스 스타일", "팀 기술 개발 피드백"],
    careerHighlights: [
      "2010년 F1 데뷔 — 포스 인디아, 자우버, 르노 등 여러 팀 전전",
      "2012년 르망 24시 종합 우승 — 코만인 팀과 함께 르망 정상",
      "2013년 인도 GP 폴 포지션 — F1 커리어 유일한 폴",
      "역대 최다 레이스 무포디움 기록(190회 이상) 보유 후 마침내 포디움 달성",
      "2026년 — 아우디 파워유닛과 함께 팀 재건의 선봉장 역할",
    ],
  },
  {
    id: "bortoleto", firstName: "Gabriel", lastName: "Bortoleto",
    number: 5, team: "Sauber", teamId: "sauber", teamColor: "#52E252",
    nationality: "Brazil", flag: "🇧🇷", dateOfBirth: "2004-10-14",
    wins: 0, podiums: 0, poles: 0, championships: 0, points: 19,
    bio: "상파울루 출신의 가브리엘 보르톨레토는 2024년 F2 챔피언으로 브라질 모터스포츠 팬들의 가슴에 불을 지핀 신예다. 맥라렌 아카데미 출신이지만 2026년 자우버(아우디) 계약을 맺으며 '브라질리언 F1 영웅' 가계를 잇는 가장 유력한 후보로 주목받는다.",
    strengths: ["감각적인 레이스 오버테이킹", "타이어 열 관리", "집중력 있는 레이스 실행"],
    careerHighlights: [
      "2023년 F3 챔피언십 우승 — 맥라렌 아카데미 소속",
      "2024년 F2 챔피언십 우승 — 브라질인 F2 챔피언은 세나 이후 처음",
      "2026년 — 자우버/아우디 정규 드라이버로 F1 데뷔, 브라질 팬들의 새 영웅",
    ],
  },

  // ── Cadillac ──────────────────────────────────────────────────
  {
    id: "bottas", firstName: "Valtteri", lastName: "Bottas",
    number: 77, team: "Cadillac", teamId: "cadillac", teamColor: "#C0A44D",
    nationality: "Finland", flag: "🇫🇮", dateOfBirth: "1989-08-28",
    wins: 10, podiums: 67, poles: 20, championships: 0, points: 1797,
    bio: "핀란드 나스톨라 출신의 발테리 보타스는 메르세데스에서 루이스 해밀턴의 팀메이트로 5번의 컨스트럭터 타이틀에 공헌했으나 개인 타이틀과는 끝내 인연이 닿지 않았다. 자우버를 거쳐 2026년 미국 신생팀 캐딜락의 베테랑 선봉으로 합류해 팀의 F1 적응을 이끌고 있다.",
    strengths: ["팀플레이어 역할 충실", "뛰어난 원랩 예선 속도", "안정적인 레이스 완주율", "신팀 세팅 개발 능력"],
    careerHighlights: [
      "2019년 호주 GP — 메르세데스 소속, 개막전 우승으로 시즌 시작",
      "2019년 — 단일 시즌 최다 패스티스트 랩 기록 (11회)",
      "2021년 터키 GP — 비 오는 노면에서 압도적인 우승",
      "2022~2025년 — 자우버에서 팀 재건에 기여",
      "2026년 — 캐딜락 F1 팀 역사의 첫 시즌을 이끄는 베테랑 수장",
    ],
  },
  {
    id: "perez", firstName: "Sergio", lastName: "Pérez",
    number: 11, team: "Cadillac", teamId: "cadillac", teamColor: "#C0A44D",
    nationality: "Mexico", flag: "🇲🇽", dateOfBirth: "1990-01-26",
    wins: 6, podiums: 39, poles: 3, championships: 0, points: 1638,
    bio: "과달라하라 출신의 세르히오 '체코' 페레스는 멕시코 F1 역사상 가장 성공한 드라이버다. 레드불에서 베르스타펜의 팀메이트로 3연속 컨스트럭터 챔피언십 달성에 핵심 역할을 했으며, 6번의 우승과 39번의 포디움을 기록했다. 2025년 레드불에서 방출된 후 2026년 캐딜락의 창단 멤버로 새 출발을 택했다.",
    strengths: ["초장거리 타이어 관리 (F1 역대 최고)", "세이프티카 재스타트 능력", "길고 복잡한 레이스 전략 실행"],
    careerHighlights: [
      "2012년 말레이시아 GP — 메르세데스 머신으로 연료 부족 드라마 끝에 2위",
      "2020년 사키르 GP — 레이스 후반 타이어 펑크에도 역전 우승, 통산 첫 승",
      "2022년 모나코 GP — 레드불 소속 첫 모나코 우승, 멕시코 국민 영웅 등극",
      "2023년 사우디아라비아 GP — 시즌 최다 우승 기록 시즌 중 베르스타펜 다음 성적",
      "2026년 캐딜락 합류 — 미국팀의 첫 그랑프리에서 경험 전수 역할",
    ],
  },
];

// ─── Circuits (24 circuits) ───────────────────────────────────

export const circuits: Circuit[] = [
  {
    id: "bahrain", name: "Bahrain International Circuit", koreanName: "바레인 인터내셔널 서킷",
    city: "Sakhir", country: "Bahrain", flag: "🇧🇭",
    length: "5.412", turns: 15, drsZones: 3, laps: 57, type: "permanent",
    firstGrandPrix: 2004,
    lapRecord: { time: "1:31.447", driver: "P. de la Rosa", year: 2005 },
    coordinates: { lat: 26.0325, lng: 50.5106 },
    description: "사막 한가운데 위치한 바레인 인터내셔널 서킷은 중동 F1의 관문으로, 2004년 F1 캘린더에 합류하며 중동 지역 최초의 그랑프리 개최지가 됐다. 모래바람과 사막의 열기가 레이스 전략에 직접적인 영향을 미치며, 야간 조명 아래 펼쳐지는 독특한 분위기로 유명하다.",
    highlights: [
      "2004년 중동 최초 F1 그랑프리 개최지",
      "2010년 F1 최초 야간 레이스 도입 (사키르 야간 레이스)",
      "트랙 표면에 스며드는 사막 모래가 타이어 마모를 가속",
      "아웃도어 레이아웃(사키르 쇼트)과 풀 레이아웃 두 가지 사용 이력",
      "겨울 테스트 시즌 거점으로도 활용되는 F1 인프라의 중심지",
    ],
  },
  {
    id: "jeddah", name: "Jeddah Corniche Circuit", koreanName: "제다 코르니체 서킷",
    city: "Jeddah", country: "Saudi Arabia", flag: "🇸🇦",
    length: "6.174", turns: 27, drsZones: 3, laps: 50, type: "street",
    firstGrandPrix: 2021,
    lapRecord: { time: "1:30.734", driver: "L. Hamilton", year: 2021 },
    coordinates: { lat: 21.6319, lng: 39.1044 },
    description: "홍해를 따라 조성된 제다 코르니체 서킷은 현존하는 F1 서킷 중 가장 빠른 시가지 서킷으로, 평균 속도 260km/h를 상회하는 초고속 레이아웃을 자랑한다. 27개의 코너가 좁은 방호벽 사이로 이어지며, 아드레날린이 폭발하는 블라인드 코너 연속 구간이 드라이버들에게 최고 난이도의 도전을 요구한다.",
    highlights: [
      "F1 역사상 가장 빠른 시가지 서킷 (평균 속도 263km/h 이상)",
      "2021년 사우디아라비아 첫 F1 그랑프리 개최",
      "홍해 연안 경관 속 야간 레이스로 화려한 배경 연출",
      "2021년 개막전 챔피언십 클라이맥스: 해밀턴과 베르스타펜 충돌",
      "코너 간 시야 제한이 극심해 드라이버 집중력 요구가 최상위 수준",
    ],
  },
  {
    id: "albert-park", name: "Albert Park Circuit", koreanName: "앨버트 파크 서킷",
    city: "Melbourne", country: "Australia", flag: "🇦🇺",
    length: "5.278", turns: 14, drsZones: 4, laps: 58, type: "street",
    firstGrandPrix: 1996,
    lapRecord: { time: "1:19.813", driver: "C. Leclerc", year: 2024 },
    coordinates: { lat: -37.8497, lng: 144.968 },
    description: "멜버른 도심 속 앨버트 파크 호수를 둘러싼 임시 시가지 서킷으로, 1996년부터 전통적으로 F1 시즌 개막전을 개최해왔다. 봄 내음 가득한 남반구의 계절 속에서 열리는 이 레이스는 새 시즌의 역학관계를 처음으로 드러내는 '진실의 순간'으로 팬들의 기대를 받는다.",
    highlights: [
      "1996~2025년 전통적 시즌 개막전 개최지 (일부 연도 제외)",
      "호수를 둘러싼 공원 부지를 레이스 기간에만 임시 폐쇄하여 사용",
      "2022년 레이아웃 개수로 평균 속도가 대폭 상승",
      "1996년 데이먼 힐의 첫 우승으로 윌리엄스 시대 개막을 알린 역사적 장소",
      "2010년 바튼, 2016년 로즈버그 등 챔피언들의 개막전 쐐기 승리 다수",
    ],
  },
  {
    id: "suzuka", name: "Suzuka International Racing Course", koreanName: "스즈카 서킷",
    city: "Suzuka", country: "Japan", flag: "🇯🇵",
    length: "5.807", turns: 18, drsZones: 2, laps: 53, type: "permanent",
    firstGrandPrix: 1987,
    lapRecord: { time: "1:30.983", driver: "L. Hamilton", year: 2019 },
    coordinates: { lat: 34.8431, lng: 136.541 },
    description: "혼다가 1962년 자체 설계·건설한 스즈카 서킷은 F1 그랑프리 서킷 중 유일하게 트랙이 자체 교차하는 '피겨-에이트' 레이아웃을 가진다. 130R, 스푼 커브, 데그너 커브 등 전설적인 고속 코너들이 연속으로 이어지며, 수많은 세계 챔피언십의 운명이 이곳에서 결정됐다.",
    highlights: [
      "F1 유일의 피겨-에이트(8자형) 레이아웃 — 오버패스 교차 구간 포함",
      "1987년 첫 일본 GP 개최, 이후 챔피언십 결정전의 무대로 수차례 사용",
      "1989·1990년 세나-프로스트 충돌 사건의 현장",
      "전설적 130R 코너: 시속 300km 이상으로 풀 스로틀 통과",
      "혼다 소유 서킷으로 일본 자동차 문화와 F1의 상징적 연결고리",
    ],
  },
  {
    id: "shanghai", name: "Shanghai International Circuit", koreanName: "상하이 인터내셔널 서킷",
    city: "Shanghai", country: "China", flag: "🇨🇳",
    length: "5.451", turns: 16, drsZones: 2, laps: 56, type: "permanent",
    firstGrandPrix: 2004,
    lapRecord: { time: "1:32.238", driver: "M. Schumacher", year: 2004 },
    coordinates: { lat: 31.3389, lng: 121.22 },
    description: "허먼 틸케가 설계한 상하이 인터내셔널 서킷은 2004년 중국 최초 F1 그랑프리를 개최하며 아시아 시장에 대한 F1의 야심을 상징적으로 보여줬다. 1·2번 코너의 긴 헤어핀과 이후 이어지는 롱 스트레이트 조합은 독특한 전략적 요소를 만들어내며, 타이어 관리가 레이스의 핵심 변수로 작용한다.",
    highlights: [
      "공중에서 보면 한자(上)와 유사한 독특한 트랙 레이아웃",
      "2004년 중국 최초 F1 그랑프리 개최 — 슈마허 우승",
      "2019년 F1 1000번째 그랑프리 개최지 (메르세데스 1-2-3 완성)",
      "코로나19로 2020~2023년 캘린더 제외 후 2024년 복귀",
      "5년 만의 복귀전에서 스프린트 포맷 도입으로 화제 집중",
    ],
  },
  {
    id: "miami", name: "Miami International Autodrome", koreanName: "마이애미 오토드롬",
    city: "Miami", country: "USA", flag: "🇺🇸",
    length: "5.412", turns: 19, drsZones: 3, laps: 57, type: "street",
    firstGrandPrix: 2022,
    lapRecord: { time: "1:29.708", driver: "M. Verstappen", year: 2023 },
    coordinates: { lat: 25.9581, lng: -80.2389 },
    description: "하드 록 스타디움(NFL 마이애미 돌핀스 홈구장)을 둘러싸고 조성된 마이애미 오토드롬은 2022년 F1의 미국 시장 확대를 상징하는 신설 서킷이다. 실제 항구가 아님에도 '가짜 야자수'와 인공 마리나를 꾸며 넣은 미국식 스펙터클로 유명하며, 셀레브리티 문화와 F1이 결합된 독특한 축제 분위기를 자랑한다.",
    highlights: [
      "NFL 마이애미 돌핀스 홈구장 하드 록 스타디움 주변에 조성",
      "2022년 미국 두 번째 F1 그랑프리 개최지 (COTA에 이어)",
      "관중석 위를 지나는 구간이 포함된 독특한 레이아웃",
      "인조 야자수와 가짜 항구 등 연출된 '마이애미 비치' 분위기",
      "2023년부터 스프린트 레이스 포맷 도입",
    ],
  },
  {
    id: "imola", name: "Autodromo Enzo e Dino Ferrari", koreanName: "이몰라 서킷",
    city: "Imola", country: "Italy", flag: "🇮🇹",
    length: "4.909", turns: 19, drsZones: 2, laps: 63, type: "permanent",
    firstGrandPrix: 1980,
    lapRecord: { time: "1:15.484", driver: "L. Hamilton", year: 2020 },
    coordinates: { lat: 44.3439, lng: 11.7167 },
    description: "엔초 에 디노 페라리 오토드롬, 흔히 이몰라라 불리는 이 서킷은 F1 역사에서 가장 비극적인 장소 중 하나다. 1994년 아일톤 세나와 롤란드 라첸베르거가 같은 주말에 목숨을 잃은 이곳은 이후 F1 안전 기준 혁신의 기폭제가 됐다. 반시계 방향의 빠른 레이아웃과 이몰라 특유의 기복 지형이 드라이버에게 극한의 집중력을 요구한다.",
    highlights: [
      "1994년 세나·라첸베르거 사망 사고 — F1 안전 혁신의 전환점",
      "유럽 유일의 반시계 방향 F1 서킷 중 하나",
      "페라리의 본거지 마라넬로에서 불과 40km 거리로 '페라리의 홈'",
      "코로나19 팬데믹으로 2020년 무관중 복귀, 2022·2023년 정규 캘린더 편입",
      "2023 에밀리아 로마냐 GP, 홍수 피해로 전격 취소된 이례적 사건 발생",
    ],
  },
  {
    id: "monaco", name: "Circuit de Monaco", koreanName: "모나코 서킷",
    city: "Monte Carlo", country: "Monaco", flag: "🇲🇨",
    length: "3.337", turns: 19, drsZones: 1, laps: 78, type: "street",
    firstGrandPrix: 1950,
    lapRecord: { time: "1:12.909", driver: "L. Hamilton", year: 2021 },
    coordinates: { lat: 43.7347, lng: 7.4206 },
    description: "1929년부터 시작된 모나코 그랑프리는 F1에서 가장 오래되고 가장 권위 있는 레이스다. 지중해 절벽 위에 세워진 소공국의 좁은 도심 거리를 달리는 이 레이스는 현대 F1에서 추월이 거의 불가능하지만, 바로 그 이유로 예선과 세이프티카 활용, 타이어 전략이 결정적 변수가 된다.",
    highlights: [
      "F1 '트리플 크라운' 중 하나 — 인디500, 르망 24시와 함께",
      "1929년 최초 개최, 1950년 F1 첫 시즌부터 포함된 역사적 서킷",
      "전체 구간 시속 300km 이하, 평균 속도가 F1 서킷 중 최저 수준",
      "페어몬 헤어핀: F1 최저속도 코너 (시속 약 50km)",
      "아일톤 세나는 이곳에서 6번 우승, '모나코의 마에스트로'로 불림",
    ],
  },
  {
    id: "barcelona", name: "Circuit de Barcelona-Catalunya", koreanName: "바르셀로나 카탈루냐 서킷",
    city: "Barcelona", country: "Spain", flag: "🇪🇸",
    length: "4.657", turns: 16, drsZones: 2, laps: 66, type: "permanent",
    firstGrandPrix: 1991,
    lapRecord: { time: "1:16.330", driver: "M. Verstappen", year: 2023 },
    coordinates: { lat: 41.57, lng: 2.2611 },
    description: "카탈루냐 서킷은 F1 팀들이 매 시즌 초 프리시즌 테스트의 거점으로 삼는 곳으로, 드라이버와 엔지니어 모두 가장 잘 아는 트랙 중 하나다. 고속 구간과 저속 섹션이 고루 포함된 밸런스 잡힌 레이아웃 덕분에 기술력의 차이가 결과에 그대로 반영되며, '테스트 벤치'라는 별명을 갖는다.",
    highlights: [
      "매년 F1 프리시즌 공식 테스트 개최지로 팀들의 데이터 기지",
      "1991년 스페인 첫 그랑프리 개최지로 나이젤 만셀 우승",
      "3번 코너 고속 우측 코너가 차량의 다운포스 성능 차이를 극명히 드러냄",
      "트랙 특성 상 타이어 오버히트 문제가 잦아 전략 다양성 제한",
      "2016년 로즈버그-해밀턴 첫 코너 충돌로 두 메르세데스 탈락",
    ],
  },
  {
    id: "montreal", name: "Circuit Gilles Villeneuve", koreanName: "질 빌뇌브 서킷",
    city: "Montreal", country: "Canada", flag: "🇨🇦",
    length: "4.361", turns: 14, drsZones: 2, laps: 70, type: "street",
    firstGrandPrix: 1978,
    lapRecord: { time: "1:13.078", driver: "V. Bottas", year: 2019 },
    coordinates: { lat: 45.5017, lng: -73.5228 },
    description: "생 로랑 강의 인공섬 노트르담 섬에 자리한 질 빌뇌브 서킷은 캐나다의 전설적인 F1 드라이버 질 빌뇌브를 기리는 이름을 가진다. 긴 직선 구간과 헤어핀의 조합, 그리고 악명 높은 '챔피언의 벽(Wall of Champions)'이 레이스를 예측 불가능하게 만드는 흥미진진한 장소다.",
    highlights: [
      "1978년 질 빌뇌브의 첫 F1 우승지 — 이후 그의 이름을 딤",
      "'챔피언의 벽': 피트 입구 직전 벽에 힐·슈마허·바튼 등 전 챔피언들이 충돌",
      "2005년 미하엘 슈마허의 전설적 안전차 추월 역전극 현장",
      "노트르담 섬 자연환경 속 반시계 방향 레이아웃이 독특한 분위기 연출",
      "우천 및 세이프티카 빈도가 높아 항상 드라마틱한 전개가 기대되는 서킷",
    ],
  },
  {
    id: "spielberg", name: "Red Bull Ring", koreanName: "레드불 링",
    city: "Spielberg", country: "Austria", flag: "🇦🇹",
    length: "4.318", turns: 10, drsZones: 3, laps: 71, type: "permanent",
    firstGrandPrix: 1970,
    lapRecord: { time: "1:05.619", driver: "C. Sainz", year: 2020 },
    coordinates: { lat: 47.2197, lng: 14.7647 },
    description: "오스트리아 슈타이어마르크 주의 알프스 구릉지대에 위치한 레드불 링은 고저차가 약 65m에 달하는 기복 심한 지형 위에 놓인 짧고 빠른 서킷이다. 1970년 외스터라이히링으로 처음 문을 열었고, 레드불이 2011년 매입·리노베이션하여 2014년 F1 캘린더에 복귀시켰다.",
    highlights: [
      "1970년 외스터라이히링으로 첫 그랑프리 개최, 2014년 레드불 링으로 복귀",
      "F1 최단 서킷 중 하나 — 한 바퀴 약 1분 5초대로 빠른 레이스 전개",
      "알프스 산악 경관을 배경으로 한 F1 최고의 야외 관람 명소",
      "2020년 코로나19로 무관중 개최, 오스트리아 GP·슈타이어마르크 GP 더블 헤더",
      "2021 오스트리아 GP: 노리스-페레스 마지막 랩 배틀, 세이프티카 논란",
    ],
  },
  {
    id: "silverstone", name: "Silverstone Circuit", koreanName: "실버스톤 서킷",
    city: "Silverstone", country: "United Kingdom", flag: "🇬🇧",
    length: "5.891", turns: 18, drsZones: 2, laps: 52, type: "permanent",
    firstGrandPrix: 1950,
    lapRecord: { time: "1:27.097", driver: "M. Verstappen", year: 2020 },
    coordinates: { lat: 52.0786, lng: -1.0169 },
    description: "2차 세계대전 당시 RAF 폭격기 기지였던 부지를 활주로와 유도로를 활용해 서킷으로 개조한 실버스톤은 1950년 F1 역사상 최초의 그랑프리를 개최한 모터스포츠의 성지다. 매곳/베켓츠/채플 복합 코너로 이어지는 고속 S자 구간은 다운포스와 용기 모두를 시험하는 F1 최고의 코너 연속 구간으로 손꼽힌다.",
    highlights: [
      "1950년 5월 13일 F1 역사상 최초 그랑프리 개최지",
      "전(前) RAF 공군 기지 — 직선 활주로가 트랙의 일부로 남아 있음",
      "매곳/베켓츠/채플 S자: F1 드라이버들이 '가장 위대한 코너 연속 구간'으로 꼽음",
      "2022 영국 GP: 첫 코너 충돌로 저우관위 롤오버 사고, 헤일로 장치의 생명 구조 증명",
      "해밀턴 8회 우승 — 그의 홈 그랑프리로 영국 팬들의 열정적 응원이 유명",
    ],
  },
  {
    id: "hungaroring", name: "Hungaroring", koreanName: "헝가로링",
    city: "Budapest", country: "Hungary", flag: "🇭🇺",
    length: "4.381", turns: 14, drsZones: 2, laps: 70, type: "permanent",
    firstGrandPrix: 1986,
    lapRecord: { time: "1:16.627", driver: "L. Hamilton", year: 2020 },
    coordinates: { lat: 47.5789, lng: 19.2486 },
    description: "부다페스트 외곽 구릉지에 자리한 헝가로링은 1986년 구 동유럽 철의 장막 이편에서 처음으로 F1 그랑프리를 개최한 역사적 서킷이다. '방호벽 없는 모나코'라 불릴 만큼 추월 공간이 협소하고 느린 속도의 테크니컬 코너가 지배적이어서, 예선 포지션이 레이스 결과에 큰 영향을 미친다.",
    highlights: [
      "1986년 동유럽 최초 F1 그랑프리 — 아일톤 세나 우승",
      "'방호벽 없는 모나코' — 추월이 어렵고 예선이 결정적",
      "헝가리 여름 폭염과 먼지 낀 노면이 타이어 전략의 복잡성 증가",
      "2021 헝가리 GP: 스타트 다중 충돌 후 해밀턴 홀로 그리드, 독주 우승",
      "다운포스 세팅 최적화가 필수 — 몬자와 정반대 세팅이 요구됨",
    ],
  },
  {
    id: "spa", name: "Circuit de Spa-Francorchamps", koreanName: "스파 프랑코르샹 서킷",
    city: "Stavelot", country: "Belgium", flag: "🇧🇪",
    length: "7.004", turns: 19, drsZones: 2, laps: 44, type: "permanent",
    firstGrandPrix: 1950,
    lapRecord: { time: "1:46.286", driver: "V. Bottas", year: 2018 },
    coordinates: { lat: 50.4372, lng: 5.9714 },
    description: "아르덴 숲 속 계곡을 따라 조성된 스파 프랑코르샹은 F1 역사상 가장 오래되고 위대한 서킷으로 드라이버들과 팬들이 압도적으로 선호한다. 7km에 달하는 긴 서킷과 유명한 오루주/라이디옹 구간, 그리고 아르덴 고원 특유의 변덕스러운 날씨가 결합해 매해 드라마를 만들어낸다.",
    highlights: [
      "현역 F1 서킷 중 가장 긴 구간 — 7.004km",
      "오루주/라이디옹: 290km/h로 급경사를 오르는 F1 최고 명장면 코너",
      "아르덴 숲의 국지성 강우 — 트랙 절반은 맑고 절반은 빗속인 경우가 흔함",
      "1950년 F1 첫 시즌부터 포함, 역사상 가장 많은 레이스가 열린 서킷 중 하나",
      "2021 벨기에 GP: 폭우로 3바퀴 만에 종료, F1 역사상 가장 짧은 레이스",
    ],
  },
  {
    id: "zandvoort", name: "Circuit Zandvoort", koreanName: "잔드보르트 서킷",
    city: "Zandvoort", country: "Netherlands", flag: "🇳🇱",
    length: "4.259", turns: 14, drsZones: 2, laps: 72, type: "permanent",
    firstGrandPrix: 1952,
    lapRecord: { time: "1:11.097", driver: "L. Hamilton", year: 2024 },
    coordinates: { lat: 52.3888, lng: 4.5409 },
    description: "북해 해안 사구 지대에 위치한 잔드보르트 서킷은 1952년 네덜란드 GP를 처음 개최했으나 2003년 캘린더에서 제외됐다. 막스 베르스타펜의 홈 팬들의 열정적 지지에 힘입어 2021년 35년 만에 F1에 복귀했고, 독특한 고속 뱅크 코너(뱅킹 각 18~19도)가 추가되어 새로운 면모를 갖췄다.",
    highlights: [
      "1952년 첫 네덜란드 GP 개최, 2021년 35년 만에 F1 복귀",
      "뱅킹 각 최대 19도의 고속 바나나 코너 — 현대 F1 유일의 경사 코너",
      "오렌지 군단(베르스타펜 팬들)의 오렌지 물결 — F1 최고 분위기 서킷 중 하나",
      "해안 모래바람과 바람 방향이 레이스 전략에 예측불허 요소로 작용",
      "2021년 복귀 후 매 시즌 매진, 주변 야영지까지 팬들로 가득 차는 축제 현장",
    ],
  },
  {
    id: "monza", name: "Autodromo Nazionale Monza", koreanName: "몬자 서킷",
    city: "Monza", country: "Italy", flag: "🇮🇹",
    length: "5.793", turns: 11, drsZones: 2, laps: 53, type: "permanent",
    firstGrandPrix: 1950,
    lapRecord: { time: "1:21.046", driver: "R. Barrichello", year: 2004 },
    coordinates: { lat: 45.6156, lng: 9.2811 },
    description: "1922년 건설되어 '스피드의 신전(Temple of Speed)'으로 불리는 몬자 서킷은 F1에서 가장 빠른 서킷이다. 낮은 다운포스 세팅으로 최고 속도 350km/h를 넘나들며, 직선 구간에서의 슬립스트림 배틀이 레이스 막판까지 이어지는 가장 짜릿한 경쟁을 연출한다. 이탈리아의 붉은 팬들 '티포시'의 열정이 서킷을 더욱 특별하게 만든다.",
    highlights: [
      "F1 서킷 중 최고 속도 — 풀 스로틀 구간 비율 약 80%",
      "1922년 건설, 현재까지 사용 중인 세계 최古 자동차 경주 서킷 중 하나",
      "1950년 첫 F1 시즌부터 단 한 번도 빠지지 않은 유일한 서킷",
      "티포시(페라리 팬)들의 뜨거운 응원 — 페라리 우승 시 팬들이 트랙으로 쏟아짐",
      "2020 이탈리아 GP: 피에르 가슬리의 극적 생애 첫 우승 (알파 타우리)",
    ],
  },
  {
    id: "baku", name: "Baku City Circuit", koreanName: "바쿠 시티 서킷",
    city: "Baku", country: "Azerbaijan", flag: "🇦🇿",
    length: "6.003", turns: 20, drsZones: 2, laps: 51, type: "street",
    firstGrandPrix: 2016,
    lapRecord: { time: "1:43.009", driver: "C. Leclerc", year: 2019 },
    coordinates: { lat: 40.3725, lng: 49.8533 },
    description: "카스피해 연안의 아제르바이잔 수도 바쿠의 구시가지를 관통하는 시가지 서킷으로, 2016년 유럽 GP라는 이름으로 첫 레이스를 치렀다. 약 2.2km에 달하는 장대한 직선 구간(메인 스트레이트)과 너비 7.6m에 불과한 성곽 구간이 공존하는 극단적인 레이아웃이 매번 예측불허 드라마를 만들어낸다.",
    highlights: [
      "F1 서킷 중 두 번째로 긴 직선 구간 — 약 2.2km 풀 스로틀",
      "폭 7.6m 성벽 구간: F1 역사상 가장 좁은 레이싱 구간 중 하나",
      "2021년 베르스타펜 타이어 블로아웃 및 해밀턴 브레이크 바이어스 실수로 극적 결말",
      "5년 전 올드 시티 성곽 벽이 배경인 F1 최고의 포토제닉 서킷",
      "세이프티카·버추얼 세이프티카 발동 빈도가 F1에서 가장 높은 서킷 중 하나",
    ],
  },
  {
    id: "singapore", name: "Marina Bay Street Circuit", koreanName: "마리나 베이 서킷",
    city: "Singapore", country: "Singapore", flag: "🇸🇬",
    length: "4.940", turns: 19, drsZones: 3, laps: 62, type: "street",
    firstGrandPrix: 2008,
    lapRecord: { time: "1:35.867", driver: "L. Hamilton", year: 2023 },
    coordinates: { lat: 1.2914, lng: 103.8636 },
    description: "마리나베이 샌즈, 에스플러네이드, 플라이어 관람차 등 싱가포르 랜드마크를 배경으로 야간에 펼쳐지는 마리나 베이 서킷은 2008년 F1 역사상 최초의 야간 그랑프리를 개최한 곳이다. 평균 기온 32°C, 습도 80%를 넘나드는 가혹한 환경 속에서 2시간가량 진행되는 이 레이스는 드라이버의 체력을 가장 혹독하게 시험한다.",
    highlights: [
      "2008년 F1 역사 최초 야간 레이스 개최",
      "1000개 이상의 조명으로 트랙 전체를 밝히는 화려한 야경 연출",
      "평균 기온 32°C·습도 85% — 드라이버 체력 소모 최상위 서킷",
      "2008년 나이젤 게이트의 크래시 게이트 스캔들(레이스 조작) 발생 현장",
      "세이프티카 확률이 높아 전략적 타이밍 게임이 결과를 좌우하는 경우 많음",
    ],
  },
  {
    id: "cota", name: "Circuit of the Americas", koreanName: "서킷 오브 디 아메리카스",
    city: "Austin", country: "USA", flag: "🇺🇸",
    length: "5.513", turns: 20, drsZones: 2, laps: 56, type: "permanent",
    firstGrandPrix: 2012,
    lapRecord: { time: "1:36.169", driver: "C. Leclerc", year: 2019 },
    coordinates: { lat: 30.1328, lng: -97.6411 },
    description: "2012년 F1을 위해 특별 설계된 COTA는 텍사스 오스틴 외곽의 언덕 위에 지어진 현대적 전용 레이스 서킷이다. 세계 유명 서킷의 명장면을 오마주한 코너들(1번 코너: 이스탄불 파크, 섹터 2: 실버스톤 매곳-베켓츠)이 포함되어 있으며, F1·MotoGP·카트 등 다양한 모터스포츠를 아우르는 미주 모터스포츠의 허브다.",
    highlights: [
      "2012년 미국 GP 부활 — 2005년 인디애나폴리스 이후 7년 만",
      "1번 코너: 45m 고저차를 오르는 블라인드 브레이킹 포인트, 추월 명소",
      "이스탄불 파크·실버스톤 등 명서킷 코너를 오마주한 '모터스포츠 박물관'",
      "2015년 해밀턴, 이곳에서 자신의 세 번째 세계 챔피언십 확정",
      "2023년 F1·MotoGP·나스카 트리플 크라운으로 모터스포츠 메카로 부상",
    ],
  },
  {
    id: "mexico-city", name: "Autódromo Hermanos Rodríguez", koreanName: "에르마노스 로드리게스 서킷",
    city: "Mexico City", country: "Mexico", flag: "🇲🇽",
    length: "4.304", turns: 17, drsZones: 3, laps: 71, type: "permanent",
    firstGrandPrix: 1963,
    lapRecord: { time: "1:17.774", driver: "V. Bottas", year: 2021 },
    coordinates: { lat: 19.4042, lng: -99.0907 },
    description: "해발 2,285m 멕시코시티 고지대에 위치한 에르마노스 로드리게스 서킷은 희박한 공기 밀도로 인해 공기역학 다운포스가 최대 20% 감소하는 독특한 환경을 제공한다. 레이스 후반부 포로 솔 야구장 내부를 통과하는 인도어 스타디움 섹션은 수만 명 관중이 지켜보는 F1 유일의 구간이다.",
    highlights: [
      "해발 2,285m — F1 서킷 중 최고 고도, 공기 밀도가 약 75%에 불과",
      "엔진 냉각 효율 저하로 파워 유닛에 극도의 부담",
      "포로 솔 야구장 내부를 통과하는 F1 유일의 스타디움 섹션",
      "멕시코 최초 F1 챔피언 세르히오 페레스의 홈 레이스 — 열정적 현지 팬 문화",
      "1963~1970년 첫 시대, 1986~1992년 두 번째 시대, 2015년 이후 세 번째 부활",
    ],
  },
  {
    id: "interlagos", name: "Autódromo José Carlos Pace", koreanName: "인터라고스 서킷",
    city: "São Paulo", country: "Brazil", flag: "🇧🇷",
    length: "4.309", turns: 15, drsZones: 2, laps: 71, type: "permanent",
    firstGrandPrix: 1973,
    lapRecord: { time: "1:10.540", driver: "V. Bottas", year: 2018 },
    coordinates: { lat: -23.7036, lng: -46.6997 },
    description: "1940년 상파울루 교외에 건설된 인터라고스는 반시계 방향으로 달리는 독특한 레이아웃과 기복 심한 지형이 특징이다. '세나 S자' 구간으로 시작하는 이 서킷에서 아일톤 세나는 세 번 우승했고, 수차례의 극적인 챔피언십 결정전이 열렸다. 브라질 팬들의 뜨거운 열정이 항상 레이스에 마지막 드라마를 더한다.",
    highlights: [
      "아일톤 세나의 홈 서킷 — '세나 S자' 코너가 그를 기리는 상징",
      "1991년 세나 홈 GP 우승 — 인류 역사상 가장 감동적인 F1 순간 중 하나",
      "2008 브라질 GP: 해밀턴이 마지막 코너에서 5위 통과로 타이틀 획득 (0.5점 차)",
      "반시계 방향 레이아웃 — 드라이버와 차량 모두 평소와 반대 부하 경험",
      "불안정한 날씨와 범죄 다발 도심 서킷 — F1 최후의 '날것의' 서킷으로 불림",
    ],
  },
  {
    id: "las-vegas", name: "Las Vegas Strip Circuit", koreanName: "라스베이거스 스트립 서킷",
    city: "Las Vegas", country: "USA", flag: "🇺🇸",
    length: "6.201", turns: 17, drsZones: 2, laps: 50, type: "street",
    firstGrandPrix: 2023,
    lapRecord: { time: "1:35.490", driver: "O. Piastri", year: 2024 },
    coordinates: { lat: 36.1699, lng: -115.1398 },
    description: "세계 최대의 엔터테인먼트 도시 라스베이거스의 스트립 대로를 달리는 이 서킷은 2023년 F1이 선보인 스펙터클의 결정판이다. 벨라지오, MGM 그랜드, 시저스 팰리스 등 유명 카지노 호텔을 배경으로 한밤중 시속 340km의 괴물 머신이 질주하는 장면은 F1의 새로운 아이콘이 됐다.",
    highlights: [
      "2023년 F1 복귀 — 1981년 이후 42년 만의 라스베이거스 GP",
      "스트립 대로 직선 구간: F1 시즌 중 최고 속도 도달 구간 (340km/h 이상)",
      "야간 기온 영하권 가능 — 타이어 온도 관리가 극도로 어려운 서킷",
      "2023 개막전: 맨홀 커버 파손으로 첫 FP1 조기 종료, $1M 이상 차량 손상",
      "F1 역사상 최대 규모 인프라 투자 — 영구 피트 레인 건물 F1 직접 소유",
    ],
  },
  {
    id: "lusail", name: "Lusail International Circuit", koreanName: "루사일 인터내셔널 서킷",
    city: "Lusail", country: "Qatar", flag: "🇶🇦",
    length: "5.419", turns: 16, drsZones: 2, laps: 57, type: "permanent",
    firstGrandPrix: 2021,
    lapRecord: { time: "1:24.319", driver: "M. Verstappen", year: 2023 },
    coordinates: { lat: 25.49, lng: 51.4542 },
    description: "도하 북쪽 루사일 신도시에 위치한 루사일 인터내셔널 서킷은 원래 MotoGP 개최지로 설계됐으나 2021년 F1 데뷔 이후 빠르게 팬들의 사랑을 받는 서킷으로 자리잡았다. 야간 조명 아래 펼쳐지는 빠른 유선형 레이아웃과 극한의 열기가 레이스를 독특하게 만든다.",
    highlights: [
      "원래 MotoGP 전용 설계 — 2021년 F1 데뷔",
      "2022 FIFA 월드컵 개최 도시 루사일과 인접한 중동 스포츠 허브",
      "2023년 타이어 대량 손상 사고 — 피렐리 긴급 대응, 1회 스톱 불가 판정",
      "야간 조명과 카타르 사막의 모래먼지가 결합된 독특한 레이스 환경",
      "2023년 베르스타펜, 이곳에서 세 번째 세계 챔피언십 확정",
    ],
  },
  {
    id: "yas-marina", name: "Yas Marina Circuit", koreanName: "야스 마리나 서킷",
    city: "Abu Dhabi", country: "UAE", flag: "🇦🇪",
    length: "5.281", turns: 16, drsZones: 2, laps: 58, type: "permanent",
    firstGrandPrix: 2009,
    lapRecord: { time: "1:26.103", driver: "M. Verstappen", year: 2021 },
    coordinates: { lat: 24.4672, lng: 54.6031 },
    description: "아부다비 야스 섬에 자리한 야스 마리나 서킷은 2009년 F1을 위해 특별 건설된 세계적인 레이싱 시설로, 야스 마리나 요트 항구를 둘러싸는 독특한 레이아웃을 가진다. 매 시즌 최종전을 개최하는 이곳에서는 페라리 월드 테마파크와 마리나 경관을 배경으로 낮에 시작해 밤에 마치는 황혼 레이스가 열린다.",
    highlights: [
      "2009년 건설, 매년 F1 시즌 피날레 개최",
      "낮에 시작해 밤에 마치는 황혼 레이스 — 조명 전환 타이밍이 장관",
      "2021 아부다비 GP: 역사상 가장 논란이 된 타이틀 결정전 — 세이프티카 혼선",
      "2021년 레이아웃 대대적 개수 — 지루하다는 평가를 받아 고속 구간 확대",
      "서킷 내부에 페라리 월드, 힐턴 호텔 등 레저 시설 집합",
    ],
  },
  {
    id: "madrid", name: "IFEMA Madrid Circuit", koreanName: "마드리드 서킷",
    city: "Madrid", country: "Spain", flag: "🇪🇸",
    length: "5.416", turns: 20, drsZones: 3, laps: 56, type: "street",
    firstGrandPrix: 2026,
    lapRecord: { time: "—", driver: "—", year: 2026 },
    coordinates: { lat: 40.4655, lng: -3.6029 },
    description: "IFEMA 마드리드 국제전시장 부지를 중심으로 조성된 마드리드 서킷은 2026년 신설되는 스페인 수도의 F1 그랑프리 개최지다. 기존 바르셀로나 카탈루냐 서킷과 함께 스페인에 두 개의 F1 그랑프리가 열리는 새 시대를 열며, 유럽 F1 팬들에게 또 하나의 선택지를 제공하게 된다.",
    highlights: [
      "2026년 F1 캘린더 신규 편입 — 스페인 수도 첫 현대 F1 그랑프리",
      "IFEMA 국제전시장 주변 반영구 시가지 서킷 레이아웃",
      "바르셀로나와 함께 스페인 두 개 그랑프리 시대 개막",
      "마드리드 시내 접근성과 현대적 시설로 새로운 F1 관광 명소 기대",
      "레코드 랩·역대 우승자 데이터는 2026년 이후 갱신 예정",
    ],
  },
];

// ─── Race Calendar 2026 ───────────────────────────────────────

export const calendar: RaceCalendar[] = [
  { round: 1,  name: "Australian Grand Prix",      koreanName: "호주 GP",          circuitId: "albert-park",  date: "2026-03-08", status: "next" },
  { round: 2,  name: "Chinese Grand Prix",          koreanName: "중국 GP",          circuitId: "shanghai",     date: "2026-03-15", status: "upcoming" },
  { round: 3,  name: "Japanese Grand Prix",         koreanName: "일본 GP",          circuitId: "suzuka",       date: "2026-03-29", status: "upcoming" },
  { round: 4,  name: "Bahrain Grand Prix",          koreanName: "바레인 GP",         circuitId: "bahrain",      date: "2026-04-12", status: "upcoming" },
  { round: 5,  name: "Saudi Arabian Grand Prix",    koreanName: "사우디 아라비아 GP", circuitId: "jeddah",       date: "2026-04-19", status: "upcoming" },
  { round: 6,  name: "Miami Grand Prix",            koreanName: "마이애미 GP",       circuitId: "miami",        date: "2026-05-03", status: "upcoming" },
  { round: 7,  name: "Canadian Grand Prix",         koreanName: "캐나다 GP",         circuitId: "montreal",     date: "2026-05-24", status: "upcoming" },
  { round: 8,  name: "Monaco Grand Prix",           koreanName: "모나코 GP",         circuitId: "monaco",       date: "2026-06-07", status: "upcoming" },
  { round: 9,  name: "Spanish Grand Prix",          koreanName: "스페인 GP",         circuitId: "barcelona",    date: "2026-06-14", status: "upcoming" },
  { round: 10, name: "Austrian Grand Prix",         koreanName: "오스트리아 GP",     circuitId: "spielberg",    date: "2026-06-28", status: "upcoming" },
  { round: 11, name: "British Grand Prix",          koreanName: "영국 GP",          circuitId: "silverstone",  date: "2026-07-05", status: "upcoming" },
  { round: 12, name: "Belgian Grand Prix",          koreanName: "벨기에 GP",         circuitId: "spa",          date: "2026-07-19", status: "upcoming" },
  { round: 13, name: "Hungarian Grand Prix",        koreanName: "헝가리 GP",         circuitId: "hungaroring",  date: "2026-07-26", status: "upcoming" },
  { round: 14, name: "Dutch Grand Prix",            koreanName: "네덜란드 GP",       circuitId: "zandvoort",    date: "2026-08-23", status: "upcoming" },
  { round: 15, name: "Italian Grand Prix",          koreanName: "이탈리아 GP",       circuitId: "monza",        date: "2026-09-06", status: "upcoming" },
  { round: 16, name: "Madrid Grand Prix",           koreanName: "마드리드 GP",       circuitId: "madrid",       date: "2026-09-13", status: "upcoming" },
  { round: 17, name: "Azerbaijan Grand Prix",       koreanName: "아제르바이잔 GP",   circuitId: "baku",         date: "2026-09-27", status: "upcoming" },
  { round: 18, name: "Singapore Grand Prix",        koreanName: "싱가포르 GP",       circuitId: "singapore",    date: "2026-10-11", status: "upcoming" },
  { round: 19, name: "United States Grand Prix",    koreanName: "미국 GP",          circuitId: "cota",         date: "2026-10-25", status: "upcoming" },
  { round: 20, name: "Mexico City Grand Prix",      koreanName: "멕시코시티 GP",     circuitId: "mexico-city",  date: "2026-11-01", status: "upcoming" },
  { round: 21, name: "São Paulo Grand Prix",        koreanName: "상파울루 GP",       circuitId: "interlagos",   date: "2026-11-08", status: "upcoming" },
  { round: 22, name: "Las Vegas Grand Prix",        koreanName: "라스베이거스 GP",   circuitId: "las-vegas",    date: "2026-11-22", status: "upcoming" },
  { round: 23, name: "Qatar Grand Prix",            koreanName: "카타르 GP",         circuitId: "lusail",       date: "2026-11-29", status: "upcoming" },
  { round: 24, name: "Abu Dhabi Grand Prix",        koreanName: "아부다비 GP",       circuitId: "yas-marina",   date: "2026-12-06", status: "upcoming" },
];

// ─── Standings ─────────────────────────────────────────────────

// 2026 시즌 개막 전 초기값 — 2025 최종 순위 기준 정렬, 레이스 완료 시 Jolpica API 자동 업데이트
export const driverStandings: Standing[] = [
  // 2025 최종 순위 기준 (Tsunoda 제외 — 2026 미참가, Lindblad·Bottas·Perez 신규)
  { position: 1,  driverId: "norris",      points: 0, wins: 0 }, // 2025 P1 423pts
  { position: 2,  driverId: "verstappen",  points: 0, wins: 0 }, // 2025 P2 421pts
  { position: 3,  driverId: "piastri",     points: 0, wins: 0 }, // 2025 P3 410pts
  { position: 4,  driverId: "russell",     points: 0, wins: 0 }, // 2025 P4 319pts
  { position: 5,  driverId: "leclerc",     points: 0, wins: 0 }, // 2025 P5 242pts
  { position: 6,  driverId: "hamilton",    points: 0, wins: 0 }, // 2025 P6 156pts
  { position: 7,  driverId: "antonelli",   points: 0, wins: 0 }, // 2025 P7 150pts
  { position: 8,  driverId: "albon",       points: 0, wins: 0 }, // 2025 P8  73pts
  { position: 9,  driverId: "sainz",       points: 0, wins: 0 }, // 2025 P9  64pts
  { position: 10, driverId: "alonso",      points: 0, wins: 0 }, // 2025 P10 56pts
  { position: 11, driverId: "hulkenberg",  points: 0, wins: 0 }, // 2025 P11 51pts
  { position: 12, driverId: "hadjar",      points: 0, wins: 0 }, // 2025 P12 51pts
  { position: 13, driverId: "bearman",     points: 0, wins: 0 }, // 2025 P13 41pts
  { position: 14, driverId: "lawson",      points: 0, wins: 0 }, // 2025 P14 38pts
  { position: 15, driverId: "ocon",        points: 0, wins: 0 }, // 2025 P15 38pts
  { position: 16, driverId: "stroll",      points: 0, wins: 0 }, // 2025 P16 33pts
  { position: 17, driverId: "gasly",       points: 0, wins: 0 }, // 2025 P18 22pts
  { position: 18, driverId: "bortoleto",   points: 0, wins: 0 }, // 2025 P19 19pts
  { position: 19, driverId: "colapinto",   points: 0, wins: 0 }, // 2025 P20  0pts
  { position: 20, driverId: "lindblad",    points: 0, wins: 0 }, // 2026 신규 (RB)
  { position: 21, driverId: "bottas",      points: 0, wins: 0 }, // 2026 신규 (Cadillac)
  { position: 22, driverId: "perez",       points: 0, wins: 0 }, // 2026 신규 (Cadillac)
];

// 2026 시즌 개막 전 초기값 — 2025 최종 순위 기준 정렬, 레이스 완료 시 Jolpica API 자동 업데이트
export const constructorStandings: ConstructorStanding[] = [
  { position: 1,  teamId: "mclaren",       points: 0, wins: 0 }, // 2025 P1  833pts
  { position: 2,  teamId: "mercedes",      points: 0, wins: 0 }, // 2025 P2  469pts
  { position: 3,  teamId: "red-bull",      points: 0, wins: 0 }, // 2025 P3  451pts
  { position: 4,  teamId: "ferrari",       points: 0, wins: 0 }, // 2025 P4  398pts
  { position: 5,  teamId: "williams",      points: 0, wins: 0 }, // 2025 P5  137pts
  { position: 6,  teamId: "rb",            points: 0, wins: 0 }, // 2025 P6   92pts
  { position: 7,  teamId: "aston-martin",  points: 0, wins: 0 }, // 2025 P7   89pts
  { position: 8,  teamId: "haas",          points: 0, wins: 0 }, // 2025 P8   79pts
  { position: 9,  teamId: "sauber",        points: 0, wins: 0 }, // 2025 P9   70pts
  { position: 10, teamId: "alpine",        points: 0, wins: 0 }, // 2025 P10  22pts
  { position: 11, teamId: "cadillac",      points: 0, wins: 0 }, // 2026 신설
];

// ─── Sample News Digest ───────────────────────────────────────

export const sampleDigest: DailyDigest = {
  date: "2026-03-04",
  summary: "노리스가 바레인 GP에서 시즌 첫 승을 거두며 맥라렌의 2026 타이틀 도전에 시동을 걸었다. 해밀턴은 페라리 합류 후 첫 레이스에서 4위를 기록하며 '좋은 출발'이라 평가했고, 캐딜락 팀은 데뷔전에서 완주에 성공하며 기대감을 높였다.",
  totalArticles: 47,
  topics: [
    {
      title: "노리스, 바레인에서 시즌 개막전 우승",
      articles: [
        { id: "1", title: "Norris dominates Bahrain GP for season-opening victory", titleKo: "노리스, 바레인 GP 지배하며 시즌 개막전 우승", link: "https://www.formula1.com/", sourceName: "Formula1.com", publishedAt: "2026-03-08T18:00:00Z" },
        { id: "2", title: "McLaren's Norris makes statement with commanding win", titleKo: "맥라렌 노리스, 압도적 우승으로 존재감 과시", link: "https://www.motorsport.com/", sourceName: "Motorsport.com", publishedAt: "2026-03-08T18:30:00Z" },
        { id: "3", title: "Bahrain GP: Norris beats Verstappen in thrilling duel", titleKo: "바레인 GP: 노리스, 베르스타펜과 짜릿한 접전 끝에 승리", link: "https://the-race.com/", sourceName: "The Race", publishedAt: "2026-03-08T19:00:00Z" },
      ],
      tags: ["Norris", "McLaren", "바레인 GP"],
    },
    {
      title: "해밀턴, 페라리에서의 첫 레이스 평가",
      articles: [
        { id: "4", title: "Hamilton reflects on 'solid start' with Ferrari", titleKo: "해밀턴, 페라리와의 '견고한 출발' 회고", link: "https://www.autosport.com/", sourceName: "Autosport", publishedAt: "2026-03-08T20:00:00Z" },
        { id: "5", title: "Vasseur praises Hamilton's adaptation to Ferrari car", titleKo: "바쇠르 대표, 해밀턴의 페라리 적응력 칭찬", link: "https://www.skysports.com/", sourceName: "Sky Sports F1", publishedAt: "2026-03-08T20:30:00Z" },
      ],
      tags: ["Hamilton", "Ferrari"],
    },
    {
      title: "캐딜락, F1 데뷔전 완주 성공",
      articles: [
        { id: "6", title: "Cadillac F1 completes both cars in debut race", titleKo: "캐딜락 F1, 데뷔 레이스에서 두 대 모두 완주", link: "https://racer.com/", sourceName: "RACER", publishedAt: "2026-03-08T21:00:00Z" },
        { id: "7", title: "GM-backed Cadillac surprises with reliability in Bahrain", titleKo: "GM 후원 캐딜락, 바레인에서 안정적인 신뢰성으로 놀라움", link: "https://www.espn.com/", sourceName: "ESPN F1", publishedAt: "2026-03-08T21:30:00Z" },
        { id: "8", title: "Pourchaire: 'Best day of my career' after Cadillac debut", titleKo: "푸르셰르: 캐딜락 데뷔 후 '내 커리어 최고의 날'", link: "https://www.planetf1.com/", sourceName: "PlanetF1", publishedAt: "2026-03-08T22:00:00Z" },
      ],
      tags: ["Cadillac", "Pourchaire", "Drugovich"],
    },
  ],
  generatedAt: "2026-03-09T08:00:00+09:00",
};

// ─── Helper Functions ─────────────────────────────────────────

export function getDriver(id: string): Driver | undefined {
  return drivers.find((d) => d.id === id);
}

export function getTeam(id: string): Team | undefined {
  return teams.find((t) => t.id === id);
}

export function getCircuit(id: string): Circuit | undefined {
  return circuits.find((c) => c.id === id);
}

export function getTeamDrivers(teamId: string): Driver[] {
  return drivers.filter((d) => d.teamId === teamId);
}

export function getNextRace(): RaceCalendar | undefined {
  return calendar.find((r) => r.status === "next");
}

export function getCompletedRaces(): RaceCalendar[] {
  return calendar.filter((r) => r.status === "completed");
}

// ─── Static Session Schedules (UTC, 2026) ─────────────────────
// Fallback when Jolpica API is unavailable.
// Sprint weekends: R2 China, R6 Miami, R7 Canada, R11 Britain, R14 Netherlands, R18 Singapore

export const sessionSchedules: Record<number, SessionSchedule> = {
  1:  { fp1:"2026-03-06T01:30:00Z", fp2:"2026-03-06T05:00:00Z", fp3:"2026-03-07T01:30:00Z", qualifying:"2026-03-07T05:00:00Z", race:"2026-03-08T04:00:00Z", isSprint:false },
  2:  { fp1:"2026-03-13T03:30:00Z", sq:"2026-03-13T07:30:00Z", sprint:"2026-03-14T03:00:00Z", qualifying:"2026-03-14T07:00:00Z", race:"2026-03-15T07:00:00Z", isSprint:true },
  3:  { fp1:"2026-03-27T02:30:00Z", fp2:"2026-03-27T06:00:00Z", fp3:"2026-03-28T02:30:00Z", qualifying:"2026-03-28T06:00:00Z", race:"2026-03-29T05:00:00Z", isSprint:false },
  4:  { fp1:"2026-04-10T11:30:00Z", fp2:"2026-04-10T15:00:00Z", fp3:"2026-04-11T12:30:00Z", qualifying:"2026-04-11T16:00:00Z", race:"2026-04-12T15:00:00Z", isSprint:false },
  5:  { fp1:"2026-04-17T13:30:00Z", fp2:"2026-04-17T17:00:00Z", fp3:"2026-04-18T13:30:00Z", qualifying:"2026-04-18T17:00:00Z", race:"2026-04-19T17:00:00Z", isSprint:false },
  6:  { fp1:"2026-05-01T16:30:00Z", sq:"2026-05-01T20:30:00Z", sprint:"2026-05-02T16:00:00Z", qualifying:"2026-05-02T20:00:00Z", race:"2026-05-03T20:00:00Z", isSprint:true },
  7:  { fp1:"2026-05-22T16:30:00Z", sq:"2026-05-22T20:30:00Z", sprint:"2026-05-23T16:00:00Z", qualifying:"2026-05-23T20:00:00Z", race:"2026-05-24T20:00:00Z", isSprint:true },
  8:  { fp1:"2026-06-05T11:30:00Z", fp2:"2026-06-05T15:00:00Z", fp3:"2026-06-06T10:30:00Z", qualifying:"2026-06-06T14:00:00Z", race:"2026-06-07T13:00:00Z", isSprint:false },
  9:  { fp1:"2026-06-12T11:30:00Z", fp2:"2026-06-12T15:00:00Z", fp3:"2026-06-13T10:30:00Z", qualifying:"2026-06-13T14:00:00Z", race:"2026-06-14T13:00:00Z", isSprint:false },
  10: { fp1:"2026-06-26T11:30:00Z", fp2:"2026-06-26T15:00:00Z", fp3:"2026-06-27T10:30:00Z", qualifying:"2026-06-27T14:00:00Z", race:"2026-06-28T13:00:00Z", isSprint:false },
  11: { fp1:"2026-07-03T11:30:00Z", sq:"2026-07-03T15:30:00Z", sprint:"2026-07-04T11:00:00Z", qualifying:"2026-07-04T15:00:00Z", race:"2026-07-05T14:00:00Z", isSprint:true },
  12: { fp1:"2026-07-17T11:30:00Z", fp2:"2026-07-17T15:00:00Z", fp3:"2026-07-18T10:30:00Z", qualifying:"2026-07-18T14:00:00Z", race:"2026-07-19T13:00:00Z", isSprint:false },
  13: { fp1:"2026-07-24T11:30:00Z", fp2:"2026-07-24T15:00:00Z", fp3:"2026-07-25T10:30:00Z", qualifying:"2026-07-25T14:00:00Z", race:"2026-07-26T13:00:00Z", isSprint:false },
  14: { fp1:"2026-08-21T10:30:00Z", sq:"2026-08-21T14:30:00Z", sprint:"2026-08-22T10:00:00Z", qualifying:"2026-08-22T14:00:00Z", race:"2026-08-23T13:00:00Z", isSprint:true },
  15: { fp1:"2026-09-04T10:30:00Z", fp2:"2026-09-04T14:00:00Z", fp3:"2026-09-05T10:30:00Z", qualifying:"2026-09-05T14:00:00Z", race:"2026-09-06T13:00:00Z", isSprint:false },
  16: { fp1:"2026-09-11T11:30:00Z", fp2:"2026-09-11T15:00:00Z", fp3:"2026-09-12T10:30:00Z", qualifying:"2026-09-12T14:00:00Z", race:"2026-09-13T13:00:00Z", isSprint:false },
  17: { fp1:"2026-09-24T08:30:00Z", fp2:"2026-09-24T12:00:00Z", fp3:"2026-09-25T08:30:00Z", qualifying:"2026-09-25T12:00:00Z", race:"2026-09-26T11:00:00Z", isSprint:false },
  18: { fp1:"2026-10-09T08:30:00Z", sq:"2026-10-09T12:30:00Z", sprint:"2026-10-10T09:00:00Z", qualifying:"2026-10-10T13:00:00Z", race:"2026-10-11T12:00:00Z", isSprint:true },
  19: { fp1:"2026-10-23T17:30:00Z", fp2:"2026-10-23T21:00:00Z", fp3:"2026-10-24T17:30:00Z", qualifying:"2026-10-24T21:00:00Z", race:"2026-10-25T20:00:00Z", isSprint:false },
  20: { fp1:"2026-10-30T18:30:00Z", fp2:"2026-10-30T22:00:00Z", fp3:"2026-10-31T17:30:00Z", qualifying:"2026-10-31T21:00:00Z", race:"2026-11-01T20:00:00Z", isSprint:false },
  21: { fp1:"2026-11-06T15:30:00Z", fp2:"2026-11-06T19:00:00Z", fp3:"2026-11-07T14:30:00Z", qualifying:"2026-11-07T18:00:00Z", race:"2026-11-08T17:00:00Z", isSprint:false },
  22: { fp1:"2026-11-20T00:30:00Z", fp2:"2026-11-20T04:00:00Z", fp3:"2026-11-21T00:30:00Z", qualifying:"2026-11-21T04:00:00Z", race:"2026-11-22T04:00:00Z", isSprint:false },
  23: { fp1:"2026-11-27T13:30:00Z", fp2:"2026-11-27T17:00:00Z", fp3:"2026-11-28T14:30:00Z", qualifying:"2026-11-28T18:00:00Z", race:"2026-11-29T16:00:00Z", isSprint:false },
  24: { fp1:"2026-12-04T09:30:00Z", fp2:"2026-12-04T13:00:00Z", fp3:"2026-12-05T10:30:00Z", qualifying:"2026-12-05T14:00:00Z", race:"2026-12-06T13:00:00Z", isSprint:false },
};
