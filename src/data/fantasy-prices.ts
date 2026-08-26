/**
 * F1 Fantasy 2026 가격 데이터
 * 공식 fantasy.formula1.com 기준 (시즌 개막 기준 가격)
 * 단위: 백만 달러 (M)
 *
 * ⚠️  시즌 진행에 따라 가격이 변동됩니다.
 * 마지막 업데이트: 2026 시즌 개막
 */

export interface FantasyDriver {
  id: string;
  firstName: string;
  lastName: string;
  team: string;
  teamId: string;
  teamColor: string;
  flag: string;
  number: number;
  price: number;   // 백만 달러
  points: number;  // 시즌 누적 판타지 포인트 (초기값 0)
}

export interface FantasyTeam {
  id: string;
  name: string;
  koreanName: string;
  primaryColor: string;
  price: number;   // 백만 달러
  points: number;  // 시즌 누적 판타지 포인트 (초기값 0)
}

// ─── 드라이버 가격표 (시즌 개막 예상가) ─────────────────────────
export const fantasyDrivers: FantasyDriver[] = [
  // McLaren
  { id: "norris",      firstName: "Lando",    lastName: "Norris",      team: "McLaren",         teamId: "mclaren",      teamColor: "#FF8000", flag: "🇬🇧", number: 1,  price: 30.0, points: 0 },
  { id: "piastri",     firstName: "Oscar",    lastName: "Piastri",     team: "McLaren",         teamId: "mclaren",      teamColor: "#FF8000", flag: "🇦🇺", number: 81, price: 25.0, points: 0 },
  // Ferrari
  { id: "hamilton",    firstName: "Lewis",    lastName: "Hamilton",    team: "Ferrari",         teamId: "ferrari",      teamColor: "#E8002D", flag: "🇬🇧", number: 44, price: 27.0, points: 0 },
  { id: "leclerc",     firstName: "Charles",  lastName: "Leclerc",     team: "Ferrari",         teamId: "ferrari",      teamColor: "#E8002D", flag: "🇲🇨", number: 16, price: 26.0, points: 0 },
  // Red Bull
  { id: "verstappen",  firstName: "Max",      lastName: "Verstappen",  team: "Red Bull Racing", teamId: "red-bull",     teamColor: "#3671C6", flag: "🇳🇱", number: 3,  price: 28.0, points: 0 },
  { id: "hadjar",      firstName: "Isack",    lastName: "Hadjar",      team: "Red Bull Racing", teamId: "red-bull",     teamColor: "#3671C6", flag: "🇫🇷", number: 6,  price: 12.0, points: 0 },
  // Mercedes
  { id: "russell",     firstName: "George",   lastName: "Russell",     team: "Mercedes",        teamId: "mercedes",     teamColor: "#27F4D2", flag: "🇬🇧", number: 63, price: 22.0, points: 0 },
  { id: "antonelli",   firstName: "Kimi",     lastName: "Antonelli",   team: "Mercedes",        teamId: "mercedes",     teamColor: "#27F4D2", flag: "🇮🇹", number: 12, price: 14.0, points: 0 },
  // Aston Martin
  { id: "alonso",      firstName: "Fernando", lastName: "Alonso",      team: "Aston Martin",    teamId: "aston-martin", teamColor: "#229971", flag: "🇪🇸", number: 14, price: 16.0, points: 0 },
  { id: "stroll",      firstName: "Lance",    lastName: "Stroll",      team: "Aston Martin",    teamId: "aston-martin", teamColor: "#229971", flag: "🇨🇦", number: 18, price: 8.5,  points: 0 },
  // Alpine
  { id: "gasly",       firstName: "Pierre",   lastName: "Gasly",       team: "Alpine",          teamId: "alpine",       teamColor: "#FF87BC", flag: "🇫🇷", number: 10, price: 11.0, points: 0 },
  { id: "colapinto",   firstName: "Franco",   lastName: "Colapinto",   team: "Alpine",          teamId: "alpine",       teamColor: "#FF87BC", flag: "🇦🇷", number: 43, price: 9.5,  points: 0 },
  // Williams
  { id: "sainz",       firstName: "Carlos",   lastName: "Sainz",       team: "Williams",        teamId: "williams",     teamColor: "#64C4FF", flag: "🇪🇸", number: 55, price: 18.0, points: 0 },
  { id: "albon",       firstName: "Alex",     lastName: "Albon",       team: "Williams",        teamId: "williams",     teamColor: "#64C4FF", flag: "🇹🇭", number: 23, price: 12.5, points: 0 },
  // Racing Bulls
  { id: "lawson",      firstName: "Liam",     lastName: "Lawson",      team: "Racing Bulls",    teamId: "racing-bulls", teamColor: "#6692FF", flag: "🇳🇿", number: 30, price: 10.0, points: 0 },
  { id: "lindblad",    firstName: "Arvid",    lastName: "Lindblad",    team: "Racing Bulls",    teamId: "racing-bulls", teamColor: "#6692FF", flag: "🇸🇪", number: 7,  price: 7.5,  points: 0 },
  // Haas
  { id: "ocon",        firstName: "Esteban",  lastName: "Ocon",        team: "Haas",            teamId: "haas",         teamColor: "#B6BABD", flag: "🇫🇷", number: 31, price: 8.0,  points: 0 },
  { id: "bearman",     firstName: "Oliver",   lastName: "Bearman",     team: "Haas",            teamId: "haas",         teamColor: "#B6BABD", flag: "🇬🇧", number: 87, price: 7.0,  points: 0 },
  // Sauber / Audi
  { id: "hulkenberg",  firstName: "Nico",     lastName: "Hülkenberg",  team: "Sauber",          teamId: "sauber",       teamColor: "#52E252", flag: "🇩🇪", number: 27, price: 9.0,  points: 0 },
  { id: "bortoleto",   firstName: "Gabriel",  lastName: "Bortoleto",   team: "Sauber",          teamId: "sauber",       teamColor: "#52E252", flag: "🇧🇷", number: 5,  price: 7.0,  points: 0 },
];

// ─── 컨스트럭터 가격표 ─────────────────────────────────────────
export const fantasyTeams: FantasyTeam[] = [
  { id: "mclaren",      name: "McLaren",         koreanName: "맥라렌",      primaryColor: "#FF8000", price: 30.5, points: 0 },
  { id: "ferrari",      name: "Ferrari",         koreanName: "페라리",      primaryColor: "#E8002D", price: 28.0, points: 0 },
  { id: "red-bull",     name: "Red Bull Racing", koreanName: "레드불",      primaryColor: "#3671C6", price: 27.0, points: 0 },
  { id: "mercedes",     name: "Mercedes",        koreanName: "메르세데스",  primaryColor: "#27F4D2", price: 23.5, points: 0 },
  { id: "aston-martin", name: "Aston Martin",    koreanName: "애스턴 마틴", primaryColor: "#229971", price: 13.0, points: 0 },
  { id: "williams",     name: "Williams",        koreanName: "윌리엄스",    primaryColor: "#64C4FF", price: 14.5, points: 0 },
  { id: "alpine",       name: "Alpine",          koreanName: "알파인",      primaryColor: "#FF87BC", price: 11.5, points: 0 },
  { id: "racing-bulls", name: "Racing Bulls",    koreanName: "레이싱 불스",  primaryColor: "#6692FF", price: 9.5,  points: 0 },
  { id: "haas",         name: "Haas",            koreanName: "하스",         primaryColor: "#B6BABD", price: 8.5,  points: 0 },
  { id: "sauber",       name: "Sauber",          koreanName: "자우버",       primaryColor: "#52E252", price: 8.0,  points: 0 },
];

// ─── Fantasy 규칙 ──────────────────────────────────────────────
export const FANTASY_RULES = {
  totalBudget: 100,      // 백만 달러
  maxDrivers: 5,         // 드라이버 5명
  maxTeams: 2,           // 컨스트럭터 2팀
  maxPerTeam: 2,         // 같은 팀 드라이버 최대 2명
};
