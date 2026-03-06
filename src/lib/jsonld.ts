/**
 * JSON-LD 구조화 데이터 유틸리티
 * GEO(Generative Engine Optimization) + Google Rich Results 대응
 */

const SITE_URL = "https://f1.324.ing";
const SITE_NAME = "PitLane";

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: "2026 F1 드라이버 아카이브, 서킷 가이드, 시즌 트래커, AI 뉴스 브리핑을 한 곳에서.",
    inLanguage: "ko-KR",
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/drivers/{search_term}` },
      "query-input": "required name=search_term",
    },
  };
}

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    description: "2026 F1 종합 포털. 드라이버, 팀, 서킷, 시즌 정보 및 AI 뉴스 브리핑 제공.",
    sameAs: [],
  };
}

export function driverSchema(driver: {
  id: string;
  firstName: string;
  lastName: string;
  nationality: string;
  dateOfBirth?: string;
  teamName?: string;
  number?: number;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: `${driver.firstName} ${driver.lastName}`,
    url: `${SITE_URL}/drivers/${driver.id}`,
    nationality: driver.nationality,
    ...(driver.dateOfBirth && { birthDate: driver.dateOfBirth }),
    jobTitle: "Formula 1 Driver",
    memberOf: driver.teamName
      ? { "@type": "SportsTeam", name: driver.teamName, sport: "Formula 1" }
      : undefined,
    ...(driver.number && { additionalName: `#${driver.number}` }),
  };
}

export function teamSchema(team: {
  id: string;
  name: string;
  country?: string;
  founded?: number;
  championships?: number;
  driverNames?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SportsTeam",
    name: team.name,
    url: `${SITE_URL}/teams/${team.id}`,
    sport: "Formula 1",
    ...(team.country && { location: { "@type": "Place", addressCountry: team.country } }),
    ...(team.founded && { foundingDate: String(team.founded) }),
    ...(team.championships && {
      description: `Formula 1 컨스트럭터. ${team.championships}회 챔피언십 우승.`,
    }),
  };
}

export function circuitSchema(circuit: {
  id: string;
  name: string;
  koreanName: string;
  city: string;
  country: string;
  length: string;
  turns: number;
  coordinates: { lat: number; lng: number };
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Place",
    name: circuit.koreanName,
    alternateName: circuit.name,
    url: `${SITE_URL}/circuits/${circuit.id}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: circuit.city,
      addressCountry: circuit.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: circuit.coordinates.lat,
      longitude: circuit.coordinates.lng,
    },
    description: `Formula 1 그랑프리 서킷. 트랙 길이 ${circuit.length}km, ${circuit.turns}개 코너.`,
  };
}

export function sportsEventSchema(race: {
  round: number;
  name: string;
  koreanName: string;
  date: string;
  circuitName?: string;
  circuitCity?: string;
  circuitCountry?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: race.koreanName,
    alternateName: race.name,
    url: `${SITE_URL}/season/race/${race.round}`,
    startDate: race.date,
    sport: "Formula 1",
    eventStatus: "https://schema.org/EventScheduled",
    ...(race.circuitName && {
      location: {
        "@type": "Place",
        name: race.circuitName,
        address: {
          "@type": "PostalAddress",
          addressLocality: race.circuitCity,
          addressCountry: race.circuitCountry,
        },
      },
    }),
    organizer: {
      "@type": "Organization",
      name: "Formula 1",
      url: "https://www.formula1.com",
    },
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/** JSON-LD를 <script> 태그로 렌더링하는 React 컴포넌트용 props 생성 */
export function jsonLdScript(schema: object) {
  return JSON.stringify(schema);
}
