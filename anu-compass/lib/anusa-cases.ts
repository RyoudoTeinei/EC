import { promises as fs } from "node:fs";
import path from "node:path";
import type { AnusaCase } from "./types";

let _cache: AnusaCase[] | null = null;

export async function loadAnusaCases(): Promise<AnusaCase[]> {
  if (_cache) return _cache;
  const filePath = path.join(process.cwd(), "data", "anusa_cases.json");
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = JSON.parse(raw) as { cases: AnusaCase[] };
  _cache = parsed.cases;
  return _cache;
}

export async function searchAnusaCases(query: {
  category?: string;
  search?: string;
}): Promise<AnusaCase[]> {
  const all = await loadAnusaCases();
  const q = (query.search ?? "").toLowerCase().trim();
  const words = q.split(/\s+/).filter((w) => w.length > 2);

  return all
    .filter((c) => !query.category || c.category === query.category)
    .map((c) => ({ c, score: scoreCase(c, q, words) }))
    .filter((x) => !q || x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((x) => x.c);
}

function scoreCase(c: AnusaCase, fullQuery: string, words: string[]): number {
  if (!fullQuery) return 1;
  const haystack =
    `${c.scenario} ${c.what_student_did} ${c.outcome} ${c.takeaway} ${c.category}`.toLowerCase();
  let score = 0;
  if (haystack.includes(fullQuery)) score += 5;
  for (const w of words) {
    if (haystack.includes(w)) score += 1;
  }
  return score;
}
