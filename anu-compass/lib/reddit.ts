import { promises as fs } from "node:fs";
import path from "node:path";
import type { RedditPost } from "./types";

type CacheEntry = { posts: RedditPost[]; expires: number };
const CACHE = new Map<string, CacheEntry>();
const TTL_MS = 60 * 60 * 1000;

export async function searchReddit(query: string, limit = 5): Promise<RedditPost[]> {
  const key = query.trim().toLowerCase();
  const now = Date.now();
  const cached = CACHE.get(key);
  if (cached && cached.expires > now) return cached.posts.slice(0, limit);

  try {
    const url =
      "https://www.reddit.com/r/anu/search.json" +
      `?q=${encodeURIComponent(query)}&restrict_sr=1&sort=relevance&limit=${limit}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "ANUCompass/0.1 (hackathon prototype)" },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) throw new Error(`Reddit responded ${res.status}`);
    const json = (await res.json()) as {
      data?: { children?: { data: { title: string; permalink: string; score: number; selftext?: string } }[] };
    };
    const children = json.data?.children ?? [];
    const posts: RedditPost[] = children.slice(0, limit).map((c) => {
      const body = (c.data.selftext ?? "").trim().slice(0, 400);
      return {
        title: c.data.title,
        url: `https://www.reddit.com${c.data.permalink}`,
        score: c.data.score,
        takeaway: body || "(no body — open the thread for details)",
        source: "live" as const,
      };
    });
    CACHE.set(key, { posts, expires: now + TTL_MS });
    return posts;
  } catch (err) {
    console.warn("[reddit] live fetch failed, falling back to snapshot:", (err as Error).message);
    return await snapshotFallback(query, limit);
  }
}

async function snapshotFallback(query: string, limit: number): Promise<RedditPost[]> {
  const filePath = path.join(process.cwd(), "data", "reddit_snapshot.json");
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = JSON.parse(raw) as { posts: (RedditPost & { topic: string })[] };

  const q = query.toLowerCase();
  const scored = parsed.posts.map((p) => {
    const haystack = `${p.title} ${p.takeaway} ${p.topic ?? ""}`.toLowerCase();
    let score = 0;
    for (const word of q.split(/\s+/).filter((w) => w.length > 2)) {
      if (haystack.includes(word)) score += 1;
    }
    return { post: { ...p, source: "snapshot" as const }, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.post);
}
