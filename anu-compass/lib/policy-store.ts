import { promises as fs } from "node:fs";
import path from "node:path";
import type { Contact, PolicyIndexEntry } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const CORPUS_DIR = path.join(DATA_DIR, "policy_corpus");

let _index: PolicyIndexEntry[] | null = null;
let _contacts: Contact[] | null = null;
const _docCache = new Map<string, string>();

export async function loadPolicyIndex(): Promise<PolicyIndexEntry[]> {
  if (_index) return _index;
  const raw = await fs.readFile(path.join(CORPUS_DIR, "index.json"), "utf8");
  _index = JSON.parse(raw) as PolicyIndexEntry[];
  return _index;
}

export async function loadPolicyDoc(slug: string): Promise<string> {
  if (_docCache.has(slug)) return _docCache.get(slug)!;
  const safeSlug = slug.replace(/[^a-z0-9_]/gi, "");
  if (safeSlug !== slug) {
    throw new Error(`Invalid slug: ${slug}`);
  }
  const filePath = path.join(CORPUS_DIR, `${safeSlug}.md`);
  const text = await fs.readFile(filePath, "utf8");
  _docCache.set(slug, text);
  return text;
}

export async function loadContacts(): Promise<Contact[]> {
  if (_contacts) return _contacts;
  const raw = await fs.readFile(path.join(DATA_DIR, "contacts.json"), "utf8");
  const parsed = JSON.parse(raw) as { contacts: Contact[] };
  _contacts = parsed.contacts;
  return _contacts;
}

export async function findContacts(query: {
  category?: string;
  search?: string;
}): Promise<Contact[]> {
  const all = await loadContacts();
  return all.filter((c) => {
    if (query.category && c.category !== query.category) return false;
    if (query.search) {
      const q = query.search.toLowerCase();
      const haystack = [c.name, c.purpose, c.notes ?? ""].join(" ").toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}
