// F1 News RSS Fetcher — Multi-source
// Sources: Autosport, Motorsport.com, The Race, BBC Sport, RaceFans, Sky Sports F1

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  link: string;
  publishedAt: string;
  sourceName: string;
  image?: string;
}

export interface DigestTopic {
  ko: string;
  articles: NewsArticle[];
}

export interface DailyDigest {
  date: string; // YYYY-MM-DD KST
  totalToday: number;
  sourceCount: number;
  topics: DigestTopic[];
  others: NewsArticle[]; // unclassified articles from today
  recent: NewsArticle[]; // last ~40 articles across all days
}

// ─── Feed registry ────────────────────────────────────────────

const FEEDS: { url: string; source: string }[] = [
  { url: "https://www.autosport.com/rss/f1/news/", source: "Autosport" },
  { url: "https://www.motorsport.com/rss/f1/news/", source: "Motorsport.com" },
  { url: "https://www.the-race.com/rss/", source: "The Race" },
  { url: "https://www.bbc.co.uk/sport/formula1/rss.xml", source: "BBC Sport" },
  { url: "https://www.racefans.net/feed/", source: "RaceFans" },
  { url: "https://www.skysports.com/rss/12433", source: "Sky Sports F1" },
];

// ─── Topic classification ─────────────────────────────────────

const TOPIC_RULES: { ko: string; keywords: string[] }[] = [
  {
    ko: "레이스 & 퀄리파잉",
    keywords: [
      "race result", "qualifying", "qualify", "pole position", "pole lap",
      "victory", "podium", "grand prix win", "sprint", "fastest lap",
      "safety car", "red flag", "retire", "crash", "incident on track",
      "race control", "stewards", "penalty",
    ],
  },
  {
    ko: "팀 & 기술",
    keywords: [
      "ferrari", "mclaren", "red bull", "mercedes", "aston martin",
      "alpine", "williams", "haas", "sauber", "cadillac",
      "power unit", "engine", "regulation", "technical", "fia",
      "aerodynamic", "wing", "chassis", "fuel", "tyre", "tire",
      "upgrade", "straight mode", "mgu", "battery",
    ],
  },
  {
    ko: "드라이버 소식",
    keywords: [
      "hamilton", "verstappen", "norris", "leclerc", "piastri",
      "russell", "alonso", "sainz", "stroll", "perez", "gasly",
      "ocon", "bottas", "albon", "lawson", "tsunoda", "magnussen",
      "hulkenberg", "bearman", "drugovich", "pourchaire",
      "contract", "signing", "seat", "academy", "move to",
    ],
  },
  {
    ko: "F1 비즈니스",
    keywords: [
      "budget cap", "cost cap", "sponsorship", "broadcast", "netflix",
      "drive to survive", "liberty media", "commercial", "calendar",
      "new venue", "ticket", "ceo", "chairman",
    ],
  },
];

function classifyTopic(article: NewsArticle): string | null {
  const text = `${article.title} ${article.description}`.toLowerCase();
  for (const rule of TOPIC_RULES) {
    if (rule.keywords.some((kw) => text.includes(kw))) return rule.ko;
  }
  return null;
}

// ─── XML / RSS parsing ────────────────────────────────────────

function decodeCDATA(raw: string): string {
  return raw.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

function extractTag(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  if (!m) return "";
  return decodeEntities(decodeCDATA(m[1])).trim();
}

function extractAttr(xml: string, tag: string, attr: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*\\s${attr}="([^"]*)"`, "i"));
  return m ? m[1] : "";
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function extractImage(item: string): string | undefined {
  // <enclosure url="..." type="image/...">
  const enc = item.match(/<enclosure[^>]+type="image\/[^"]*"[^>]*url="([^"]*)"/i)
    ?? item.match(/<enclosure[^>]+url="([^"]*)"[^>]*type="image\/[^"]*"/i);
  if (enc?.[1]) return enc[1];
  // <media:content url="..." medium="image">
  const med = item.match(/<media:content[^>]+url="([^"]*)"[^>]*medium="image"/i)
    ?? item.match(/<media:content[^>]+url="([^"]*)"/i);
  if (med?.[1]) return med[1];
  return undefined;
}

function parseItems(xml: string, sourceName: string): NewsArticle[] {
  const parts = xml.split(/<item[\s>]/i);
  return parts
    .slice(1)
    .map((raw, i) => {
      const title = extractTag(raw, "title");
      // <link> without CDATA: extract text between tags
      const link =
        decodeCDATA(extractTag(raw, "link")) ||
        (raw.match(/<link>(https?:\/\/[^<]+)<\/link>/i)?.[1] ?? "");
      const description = stripHtml(decodeCDATA(extractTag(raw, "description"))).slice(0, 220);
      const pubDate = extractTag(raw, "pubDate") || extractTag(raw, "dc:date");
      const guid = decodeCDATA(extractTag(raw, "guid")) || `${sourceName}-${i}`;
      const image = extractImage(raw);

      if (!title || !link) return null;

      let publishedAt = new Date().toISOString();
      try {
        const d = new Date(pubDate);
        if (!isNaN(d.getTime())) publishedAt = d.toISOString();
      } catch {}

      const article: NewsArticle = { id: guid, title, description, link, publishedAt, sourceName };
      if (image) article.image = image;
      return article;
    })
    .filter((a): a is NewsArticle => a !== null);
}

// ─── Fetch helpers ────────────────────────────────────────────

async function fetchFeed(url: string, source: string): Promise<NewsArticle[]> {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      next: { revalidate: 1800 },
      headers: { "User-Agent": "PitLane-F1/1.0" },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseItems(xml, source);
  } catch {
    return [];
  }
}

function isToday(iso: string): boolean {
  const articleDate = new Date(iso);
  const now = new Date();
  return (
    articleDate.getFullYear() === now.getFullYear() &&
    articleDate.getMonth() === now.getMonth() &&
    articleDate.getDate() === now.getDate()
  );
}

function isWithin(iso: string, hours: number): boolean {
  return Date.now() - new Date(iso).getTime() < hours * 3600_000;
}

// ─── Public API ───────────────────────────────────────────────

export async function getF1News(limit = 40): Promise<NewsArticle[]> {
  const results = await Promise.all(FEEDS.map((f) => fetchFeed(f.url, f.source)));
  const all = results.flat();
  all.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  return all.slice(0, limit);
}

export async function getDailyDigest(): Promise<DailyDigest> {
  const results = await Promise.all(FEEDS.map((f) => fetchFeed(f.url, f.source)));

  const all = results.flat();
  all.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  // Deduplicate by title similarity (same title from multiple sources)
  const seen = new Set<string>();
  const deduped = all.filter((a) => {
    const key = a.title.toLowerCase().slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Today's articles — if too few, expand to last 24h
  let todayArticles = deduped.filter((a) => isToday(a.publishedAt));
  if (todayArticles.length < 5) {
    todayArticles = deduped.filter((a) => isWithin(a.publishedAt, 24));
  }

  // Classify into topics
  const topicMap = new Map<string, NewsArticle[]>();
  const others: NewsArticle[] = [];

  for (const article of todayArticles) {
    const topic = classifyTopic(article);
    if (topic) {
      const arr = topicMap.get(topic) ?? [];
      arr.push(article);
      topicMap.set(topic, arr);
    } else {
      others.push(article);
    }
  }

  // Build topics in defined order
  const topics: DigestTopic[] = TOPIC_RULES.flatMap(({ ko }) => {
    const articles = topicMap.get(ko);
    if (!articles || articles.length === 0) return [];
    return [{ ko, articles }];
  });

  const sourcesActive = new Set(deduped.map((a) => a.sourceName)).size;

  const now = new Date();
  const date = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`;

  return {
    date,
    totalToday: todayArticles.length,
    sourceCount: sourcesActive,
    topics,
    others,
    recent: deduped.slice(0, 40),
  };
}
