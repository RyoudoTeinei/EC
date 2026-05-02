import { promises as fs } from "node:fs";
import path from "node:path";
import type { WoroniArticle } from "./types";

const RSS_URL = "https://www.woroni.com.au/feed/";
const TTL_MS = 60 * 60 * 1000;

let _allCache: { items: WoroniArticle[]; expires: number } | null = null;

export async function searchWoroni(
  query: string,
  limit = 5,
): Promise<WoroniArticle[]> {
  const items = await fetchAll();
  const q = query.toLowerCase().trim();
  if (!q) return items.slice(0, limit);

  const words = q.split(/\s+/).filter((w) => w.length > 2);

  return items
    .map((item) => ({ item, score: scoreItem(item, q, words) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.item);
}

async function fetchAll(): Promise<WoroniArticle[]> {
  const now = Date.now();
  if (_allCache && _allCache.expires > now) return _allCache.items;

  try {
    const res = await fetch(RSS_URL, {
      headers: { "User-Agent": "ANUCompass/0.1 (hackathon prototype)" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`Woroni responded ${res.status}`);
    const xml = await res.text();
    // Cloudflare returns a 200 with an HTML challenge page when it blocks bots.
    // If the body doesn't actually look like RSS, treat as a failure so we
    // fall back to the snapshot rather than caching an empty result.
    if (!/<rss\b|<feed\b/i.test(xml)) {
      throw new Error("Woroni did not return an RSS feed (likely a bot challenge).");
    }
    const items = parseRss(xml).map((i) => ({ ...i, source: "live" as const }));
    if (items.length === 0) {
      throw new Error("Woroni RSS parsed but contained no items.");
    }
    _allCache = { items, expires: now + TTL_MS };
    return items;
  } catch (err) {
    console.warn(
      "[woroni] live fetch failed, falling back to snapshot:",
      (err as Error).message,
    );
    return await loadSnapshot();
  }
}

function parseRss(xml: string): WoroniArticle[] {
  const items: WoroniArticle[] = [];
  const itemRegex = /<item\b[^>]*>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = pickTag(block, "title");
    const link = pickTag(block, "link");
    const description = pickTag(block, "description");
    const pubDate = pickTag(block, "pubDate");
    if (!title || !link) continue;
    items.push({
      title: stripHtml(title),
      url: link.trim(),
      description: stripHtml(description).slice(0, 400),
      pubDate: pubDate || undefined,
    });
  }
  return items;
}

function pickTag(block: string, tag: string): string {
  const re = new RegExp(
    `<${tag}\\b[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`,
    "i",
  );
  const m = block.match(re);
  return m ? m[1].trim() : "";
}

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&[a-z]+;|&#\d+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreItem(
  item: WoroniArticle,
  fullQuery: string,
  words: string[],
): number {
  const titleLower = item.title.toLowerCase();
  const descLower = item.description.toLowerCase();
  let score = 0;
  if (titleLower.includes(fullQuery)) score += 8;
  for (const w of words) {
    if (titleLower.includes(w)) score += 3;
    else if (descLower.includes(w)) score += 1;
  }
  return score;
}

async function loadSnapshot(): Promise<WoroniArticle[]> {
  const filePath = path.join(process.cwd(), "data", "woroni_snapshot.json");
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = JSON.parse(raw) as { articles: WoroniArticle[] };
  return parsed.articles.map((a) => ({ ...a, source: "snapshot" as const }));
}
