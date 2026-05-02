import type { YoutubeVideo } from "./types";

type YoutubeApiResponse = {
  items?: {
    id?: { videoId?: string };
    snippet?: {
      title?: string;
      channelTitle?: string;
      description?: string;
      publishedAt?: string;
    };
  }[];
  error?: { message?: string };
};

const TTL_MS = 60 * 60 * 1000;
const CACHE = new Map<string, { items: YoutubeVideo[]; expires: number }>();

export async function searchYoutube(
  query: string,
  limit = 5,
): Promise<YoutubeVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.warn(
      "[youtube] YOUTUBE_API_KEY not set; skipping YouTube search.",
    );
    return [];
  }

  const key = `${query.trim().toLowerCase()}|${limit}`;
  const now = Date.now();
  const cached = CACHE.get(key);
  if (cached && cached.expires > now) return cached.items;

  // Bias toward ANU content even when the user's query doesn't say "ANU"
  const biased = /\banu\b/i.test(query) ? query : `${query} ANU`;

  try {
    const url =
      "https://www.googleapis.com/youtube/v3/search" +
      `?part=snippet&type=video&maxResults=${limit}` +
      `&q=${encodeURIComponent(biased)}&key=${apiKey}`;

    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const json = (await res.json()) as YoutubeApiResponse;
    if (!res.ok) {
      throw new Error(json.error?.message ?? `YouTube responded ${res.status}`);
    }

    const items: YoutubeVideo[] = [];
    for (const i of json.items ?? []) {
      const videoId = i.id?.videoId;
      const s = i.snippet ?? {};
      if (!videoId || !s.title) continue;
      items.push({
        title: s.title,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        channel: s.channelTitle ?? "",
        description: (s.description ?? "").slice(0, 240),
        publishedAt: s.publishedAt,
      });
    }

    CACHE.set(key, { items, expires: now + TTL_MS });
    return items;
  } catch (err) {
    console.warn("[youtube] search failed:", (err as Error).message);
    return [];
  }
}
