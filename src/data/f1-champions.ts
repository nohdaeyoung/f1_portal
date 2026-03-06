// F1 Champions — 역대 드라이버 & 컨스트럭터 챔피언 (1950–2024)

export interface SeasonChampion {
  year: number;
  driver: string;
  driverFlag: string;
  team: string;           // 드라이버 소속팀
  teamColor: string;
  constructorChampion: string;    // 컨스트럭터 챔피언
  constructorColor: string;
}

// 현대 시대 (2000–2024)
export const modernChampions: SeasonChampion[] = [
  { year: 2024, driver: "막스 베르스타펜", driverFlag: "🇳🇱", team: "Red Bull Racing", teamColor: "#3671C6", constructorChampion: "McLaren", constructorColor: "#FF8000" },
  { year: 2023, driver: "막스 베르스타펜", driverFlag: "🇳🇱", team: "Red Bull Racing", teamColor: "#3671C6", constructorChampion: "Red Bull Racing", constructorColor: "#3671C6" },
  { year: 2022, driver: "막스 베르스타펜", driverFlag: "🇳🇱", team: "Red Bull Racing", teamColor: "#3671C6", constructorChampion: "Red Bull Racing", constructorColor: "#3671C6" },
  { year: 2021, driver: "막스 베르스타펜", driverFlag: "🇳🇱", team: "Red Bull Racing", teamColor: "#3671C6", constructorChampion: "Mercedes", constructorColor: "#00D2BE" },
  { year: 2020, driver: "루이스 해밀턴", driverFlag: "🇬🇧", team: "Mercedes", teamColor: "#00D2BE", constructorChampion: "Mercedes", constructorColor: "#00D2BE" },
  { year: 2019, driver: "루이스 해밀턴", driverFlag: "🇬🇧", team: "Mercedes", teamColor: "#00D2BE", constructorChampion: "Mercedes", constructorColor: "#00D2BE" },
  { year: 2018, driver: "루이스 해밀턴", driverFlag: "🇬🇧", team: "Mercedes", teamColor: "#00D2BE", constructorChampion: "Mercedes", constructorColor: "#00D2BE" },
  { year: 2017, driver: "루이스 해밀턴", driverFlag: "🇬🇧", team: "Mercedes", teamColor: "#00D2BE", constructorChampion: "Mercedes", constructorColor: "#00D2BE" },
  { year: 2016, driver: "니코 로스버그", driverFlag: "🇩🇪", team: "Mercedes", teamColor: "#00D2BE", constructorChampion: "Mercedes", constructorColor: "#00D2BE" },
  { year: 2015, driver: "루이스 해밀턴", driverFlag: "🇬🇧", team: "Mercedes", teamColor: "#00D2BE", constructorChampion: "Mercedes", constructorColor: "#00D2BE" },
  { year: 2014, driver: "루이스 해밀턴", driverFlag: "🇬🇧", team: "Mercedes", teamColor: "#00D2BE", constructorChampion: "Mercedes", constructorColor: "#00D2BE" },
  { year: 2013, driver: "세바스티안 베텔", driverFlag: "🇩🇪", team: "Red Bull Racing", teamColor: "#3671C6", constructorChampion: "Red Bull Racing", constructorColor: "#3671C6" },
  { year: 2012, driver: "세바스티안 베텔", driverFlag: "🇩🇪", team: "Red Bull Racing", teamColor: "#3671C6", constructorChampion: "Red Bull Racing", constructorColor: "#3671C6" },
  { year: 2011, driver: "세바스티안 베텔", driverFlag: "🇩🇪", team: "Red Bull Racing", teamColor: "#3671C6", constructorChampion: "Red Bull Racing", constructorColor: "#3671C6" },
  { year: 2010, driver: "세바스티안 베텔", driverFlag: "🇩🇪", team: "Red Bull Racing", teamColor: "#3671C6", constructorChampion: "Red Bull Racing", constructorColor: "#3671C6" },
  { year: 2009, driver: "젠슨 버튼", driverFlag: "🇬🇧", team: "Brawn GP", teamColor: "#B0FF00", constructorChampion: "Brawn GP", constructorColor: "#B0FF00" },
  { year: 2008, driver: "루이스 해밀턴", driverFlag: "🇬🇧", team: "McLaren", teamColor: "#FF8000", constructorChampion: "Ferrari", constructorColor: "#DC0000" },
  { year: 2007, driver: "키미 라이코넨", driverFlag: "🇫🇮", team: "Ferrari", teamColor: "#DC0000", constructorChampion: "Ferrari", constructorColor: "#DC0000" },
  { year: 2006, driver: "페르난도 알론소", driverFlag: "🇪🇸", team: "Renault", teamColor: "#0090FF", constructorChampion: "Renault", constructorColor: "#0090FF" },
  { year: 2005, driver: "페르난도 알론소", driverFlag: "🇪🇸", team: "Renault", teamColor: "#0090FF", constructorChampion: "Renault", constructorColor: "#0090FF" },
  { year: 2004, driver: "미하엘 슈마허", driverFlag: "🇩🇪", team: "Ferrari", teamColor: "#DC0000", constructorChampion: "Ferrari", constructorColor: "#DC0000" },
  { year: 2003, driver: "미하엘 슈마허", driverFlag: "🇩🇪", team: "Ferrari", teamColor: "#DC0000", constructorChampion: "Ferrari", constructorColor: "#DC0000" },
  { year: 2002, driver: "미하엘 슈마허", driverFlag: "🇩🇪", team: "Ferrari", teamColor: "#DC0000", constructorChampion: "Ferrari", constructorColor: "#DC0000" },
  { year: 2001, driver: "미하엘 슈마허", driverFlag: "🇩🇪", team: "Ferrari", teamColor: "#DC0000", constructorChampion: "Ferrari", constructorColor: "#DC0000" },
  { year: 2000, driver: "미하엘 슈마허", driverFlag: "🇩🇪", team: "Ferrari", teamColor: "#DC0000", constructorChampion: "Ferrari", constructorColor: "#DC0000" },
];

// 클래식 시대 (1950–1999) — 드라이버 챔피언 + 컨스트럭터 챔피언 (* 컨스트럭터 챔피언십은 1958년부터)
export interface ClassicChampion {
  year: number;
  driver: string;
  driverFlag: string;
  team: string;
  constructorChampion?: string; // 1958년부터
}

export const classicChampions: ClassicChampion[] = [
  { year: 1999, driver: "미카 해키넨", driverFlag: "🇫🇮", team: "McLaren", constructorChampion: "Ferrari" },
  { year: 1998, driver: "미카 해키넨", driverFlag: "🇫🇮", team: "McLaren", constructorChampion: "McLaren" },
  { year: 1997, driver: "자크 빌르너브", driverFlag: "🇨🇦", team: "Williams", constructorChampion: "Williams" },
  { year: 1996, driver: "다몬 힐", driverFlag: "🇬🇧", team: "Williams", constructorChampion: "Williams" },
  { year: 1995, driver: "미하엘 슈마허", driverFlag: "🇩🇪", team: "Benetton", constructorChampion: "Benetton" },
  { year: 1994, driver: "미하엘 슈마허", driverFlag: "🇩🇪", team: "Benetton", constructorChampion: "Williams" },
  { year: 1993, driver: "알랭 프로스트", driverFlag: "🇫🇷", team: "Williams", constructorChampion: "Williams" },
  { year: 1992, driver: "나이젤 만셀", driverFlag: "🇬🇧", team: "Williams", constructorChampion: "Williams" },
  { year: 1991, driver: "아일톤 세나", driverFlag: "🇧🇷", team: "McLaren", constructorChampion: "McLaren" },
  { year: 1990, driver: "아일톤 세나", driverFlag: "🇧🇷", team: "McLaren", constructorChampion: "McLaren" },
  { year: 1989, driver: "알랭 프로스트", driverFlag: "🇫🇷", team: "McLaren", constructorChampion: "McLaren" },
  { year: 1988, driver: "아일톤 세나", driverFlag: "🇧🇷", team: "McLaren", constructorChampion: "McLaren" },
  { year: 1987, driver: "넬슨 피케", driverFlag: "🇧🇷", team: "Williams", constructorChampion: "Williams" },
  { year: 1986, driver: "알랭 프로스트", driverFlag: "🇫🇷", team: "McLaren", constructorChampion: "Williams" },
  { year: 1985, driver: "알랭 프로스트", driverFlag: "🇫🇷", team: "McLaren", constructorChampion: "McLaren" },
  { year: 1984, driver: "니키 라우다", driverFlag: "🇦🇹", team: "McLaren", constructorChampion: "McLaren" },
  { year: 1983, driver: "넬슨 피케", driverFlag: "🇧🇷", team: "Brabham", constructorChampion: "Ferrari" },
  { year: 1982, driver: "케케 로스버그", driverFlag: "🇫🇮", team: "Williams", constructorChampion: "Ferrari" },
  { year: 1981, driver: "넬슨 피케", driverFlag: "🇧🇷", team: "Brabham", constructorChampion: "Williams" },
  { year: 1980, driver: "알랭 존스", driverFlag: "🇦🇺", team: "Williams", constructorChampion: "Williams" },
  { year: 1979, driver: "조디 셱터", driverFlag: "🇿🇦", team: "Ferrari", constructorChampion: "Ferrari" },
  { year: 1978, driver: "마리오 안드레티", driverFlag: "🇺🇸", team: "Lotus", constructorChampion: "Lotus" },
  { year: 1977, driver: "니키 라우다", driverFlag: "🇦🇹", team: "Ferrari", constructorChampion: "Ferrari" },
  { year: 1976, driver: "제임스 헌트", driverFlag: "🇬🇧", team: "McLaren", constructorChampion: "Ferrari" },
  { year: 1975, driver: "니키 라우다", driverFlag: "🇦🇹", team: "Ferrari", constructorChampion: "Ferrari" },
  { year: 1974, driver: "에머슨 피티팔디", driverFlag: "🇧🇷", team: "McLaren", constructorChampion: "McLaren" },
  { year: 1973, driver: "재키 스튜어트", driverFlag: "🇬🇧", team: "Tyrrell", constructorChampion: "Lotus" },
  { year: 1972, driver: "에머슨 피티팔디", driverFlag: "🇧🇷", team: "Lotus", constructorChampion: "Lotus" },
  { year: 1971, driver: "재키 스튜어트", driverFlag: "🇬🇧", team: "Tyrrell", constructorChampion: "Tyrrell" },
  { year: 1970, driver: "요헨 린트", driverFlag: "🇦🇹", team: "Lotus", constructorChampion: "Lotus" },
  { year: 1969, driver: "재키 스튜어트", driverFlag: "🇬🇧", team: "Matra", constructorChampion: "Matra" },
  { year: 1968, driver: "그레이엄 힐", driverFlag: "🇬🇧", team: "Lotus", constructorChampion: "Lotus" },
  { year: 1967, driver: "데니 훌메", driverFlag: "🇳🇿", team: "Brabham", constructorChampion: "Brabham" },
  { year: 1966, driver: "잭 브라밤", driverFlag: "🇦🇺", team: "Brabham", constructorChampion: "Brabham" },
  { year: 1965, driver: "짐 클라크", driverFlag: "🇬🇧", team: "Lotus", constructorChampion: "Lotus" },
  { year: 1964, driver: "존 서티스", driverFlag: "🇬🇧", team: "Ferrari", constructorChampion: "Ferrari" },
  { year: 1963, driver: "짐 클라크", driverFlag: "🇬🇧", team: "Lotus", constructorChampion: "Lotus" },
  { year: 1962, driver: "그레이엄 힐", driverFlag: "🇬🇧", team: "BRM", constructorChampion: "BRM" },
  { year: 1961, driver: "필 힐", driverFlag: "🇺🇸", team: "Ferrari", constructorChampion: "Ferrari" },
  { year: 1960, driver: "잭 브라밤", driverFlag: "🇦🇺", team: "Cooper", constructorChampion: "Cooper" },
  { year: 1959, driver: "잭 브라밤", driverFlag: "🇦🇺", team: "Cooper", constructorChampion: "Cooper" },
  { year: 1958, driver: "마이크 호손", driverFlag: "🇬🇧", team: "Ferrari", constructorChampion: "Vanwall" },
  { year: 1957, driver: "후안 마누엘 판지오", driverFlag: "🇦🇷", team: "Maserati" },
  { year: 1956, driver: "후안 마누엘 판지오", driverFlag: "🇦🇷", team: "Ferrari" },
  { year: 1955, driver: "후안 마누엘 판지오", driverFlag: "🇦🇷", team: "Mercedes" },
  { year: 1954, driver: "후안 마누엘 판지오", driverFlag: "🇦🇷", team: "Mercedes/Maserati" },
  { year: 1953, driver: "알베르토 아스카리", driverFlag: "🇮🇹", team: "Ferrari" },
  { year: 1952, driver: "알베르토 아스카리", driverFlag: "🇮🇹", team: "Ferrari" },
  { year: 1951, driver: "후안 마누엘 판지오", driverFlag: "🇦🇷", team: "Alfa Romeo" },
  { year: 1950, driver: "주세페 파리나", driverFlag: "🇮🇹", team: "Alfa Romeo" },
];

// 팀별 챔피언십 타이틀 집계 (컨스트럭터)
export interface TeamTitle {
  team: string;
  color: string;
  driverTitles: number;    // 해당 팀 소속 드라이버 타이틀 (현대)
  constructorTitles: number;
  titleYears: number[];
  era: string;
}

// 역대 다중 챔피언 드라이버
export interface MultiChampion {
  driver: string;
  flag: string;
  titles: number;
  years: number[];
  nationality: string;
}

export const multiChampions: MultiChampion[] = [
  { driver: "루이스 해밀턴", flag: "🇬🇧", titles: 7, years: [2008, 2014, 2015, 2017, 2018, 2019, 2020], nationality: "영국" },
  { driver: "미하엘 슈마허", flag: "🇩🇪", titles: 7, years: [1994, 1995, 2000, 2001, 2002, 2003, 2004], nationality: "독일" },
  { driver: "후안 마누엘 판지오", flag: "🇦🇷", titles: 5, years: [1951, 1954, 1955, 1956, 1957], nationality: "아르헨티나" },
  { driver: "막스 베르스타펜", flag: "🇳🇱", titles: 4, years: [2021, 2022, 2023, 2024], nationality: "네덜란드" },
  { driver: "세바스티안 베텔", flag: "🇩🇪", titles: 4, years: [2010, 2011, 2012, 2013], nationality: "독일" },
  { driver: "알랭 프로스트", flag: "🇫🇷", titles: 4, years: [1985, 1986, 1989, 1993], nationality: "프랑스" },
  { driver: "아일톤 세나", flag: "🇧🇷", titles: 3, years: [1988, 1990, 1991], nationality: "브라질" },
  { driver: "잭 브라밤", flag: "🇦🇺", titles: 3, years: [1959, 1960, 1966], nationality: "호주" },
  { driver: "재키 스튜어트", flag: "🇬🇧", titles: 3, years: [1969, 1971, 1973], nationality: "영국" },
  { driver: "넬슨 피케", flag: "🇧🇷", titles: 3, years: [1981, 1983, 1987], nationality: "브라질" },
  { driver: "니키 라우다", flag: "🇦🇹", titles: 3, years: [1975, 1977, 1984], nationality: "오스트리아" },
];
