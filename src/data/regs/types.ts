export interface RegArticle {
  num: string;          // "A1.1", "B1.2.3"
  title: string;        // 한국어 제목
  body?: string;        // 본문 요약
  points?: string[];    // 세부 항목
  changed?: boolean;    // Issue 변경사항 하이라이트
  children?: RegArticle[];
}

export interface RegSection {
  sectionId: string;        // "A", "B", "C", "D", "F"
  label: string;            // "Section A"
  title: string;            // "일반 규정"
  titleEn: string;          // "General Provisions"
  issue: string;            // "Issue 02"
  date: string;             // "2026.02.23"
  approval: string;         // "WMSC 승인: 2026.02.27"
  color: string;            // accent color
  articles: RegArticle[];
}
