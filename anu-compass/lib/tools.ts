import type Anthropic from "@anthropic-ai/sdk";
import type OpenAI from "openai";
import { searchAnusaCases } from "./anusa-cases";
import { findContacts, loadPolicyDoc, loadPolicyIndex } from "./policy-store";
import { searchReddit } from "./reddit";
import { searchWoroni } from "./woroni";
import { searchYoutube } from "./youtube";

type ToolDef = {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, unknown>;
    required: string[];
  };
};

const TOOLS: ToolDef[] = [
  {
    name: "list_policy_topics",
    description:
      "List every available ANU policy / service topic in the local corpus. Returns the slug, title, summary, and keywords for each topic. Always call this first if you have not already seen the topic list. Cheap and deterministic.",
    parameters: { type: "object", properties: {}, required: [] },
  },
  {
    name: "read_policy",
    description:
      "Read the full markdown content of a single policy / service topic by slug. Use the slug returned from list_policy_topics. Read every topic that may be relevant — multiple reads are fine.",
    parameters: {
      type: "object",
      properties: {
        slug: {
          type: "string",
          description:
            "The slug of the policy topic to read (e.g. 'special_consideration').",
        },
      },
      required: ["slug"],
    },
  },
  {
    name: "find_contacts",
    description:
      "Find ANU and external service contacts (phone, email, hours, URL) by category or free-text search. Categories: 'medical', 'mental_health', 'crisis', 'safety', 'admin', 'disability', 'advocacy', 'international'. Use search for free-text matching across name and purpose.",
    parameters: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description: "Optional category filter.",
        },
        search: {
          type: "string",
          description:
            "Optional free-text search across contact name and purpose.",
        },
      },
      required: [],
    },
  },
  {
    name: "search_reddit",
    description:
      "Search r/anu for community discussion of a topic. Returns recent posts with titles, body snippets, and links. Use to surface lived-experience tips, recent changes, or warnings that are not in the official policy. Falls back to a curated snapshot if the live API is unavailable. If a search returns weak results, do not retry more than once with a different phrasing — finalize the answer instead of looping.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "Reddit search query, e.g. 'special consideration rejected'.",
        },
        limit: {
          type: "integer",
          description: "Max number of posts (default 5).",
          minimum: 1,
          maximum: 10,
        },
      },
      required: ["query"],
    },
  },
  {
    name: "search_woroni",
    description:
      "Search the ANU student newspaper Woroni (woroni.com.au) for journalism on the topic. Returns titles, links, descriptions, and pub dates. Use for context on policy changes, ANUSA election outcomes, residential life issues, mental-health-services coverage, or any topic that has been reported on by student media. Carries more authority than Reddit for facts, and is published; cite it when the article materially shaped your advice.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "Topic search, e.g. 'special consideration backlog' or 'AI policy'.",
        },
        limit: {
          type: "integer",
          description: "Max number of articles (default 5).",
          minimum: 1,
          maximum: 10,
        },
      },
      required: ["query"],
    },
  },
  {
    name: "search_anusa_cases",
    description:
      "Search a curated set of illustrative ANUSA-style case patterns by category and/or free-text. These are NOT real cases — they are anonymised patterns drawn from public ANUSA materials, Woroni reporting, and r/anu, abstracted into 'scenario / what student did / outcome / takeaway' shape. Use them to predict what tends to go wrong (most common rejection reasons, what kind of evidence works) and to give the student realistic expectations. Categories: 'academic_misconduct', 'special_consideration_appeal', 'extension_dispute', 'hardship', 'tenancy', 'fees_refund', 'discrimination', 'general'.",
    parameters: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description: "Optional category filter.",
        },
        search: {
          type: "string",
          description: "Optional free-text search across the case content.",
        },
      },
      required: [],
    },
  },
  {
    name: "search_youtube",
    description:
      "Search YouTube for video TITLES (not transcripts) about ANU. Returns title, channel, short description, publish date, and link. Useful for surfacing course reviews, campus tours, Open Day talks, or student vlogs. Returns an empty list if YOUTUBE_API_KEY is not configured server-side — handle that gracefully and don't retry.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "Search query — 'ANU' is added automatically if not present.",
        },
        limit: {
          type: "integer",
          description: "Max number of videos (default 5).",
          minimum: 1,
          maximum: 10,
        },
      },
      required: ["query"],
    },
  },
];

export const OPENAI_TOOLS: OpenAI.Chat.ChatCompletionTool[] = TOOLS.map(
  (t) => ({
    type: "function",
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }),
);

export const ANTHROPIC_TOOLS: Anthropic.Tool[] = TOOLS.map((t) => ({
  name: t.name,
  description: t.description,
  input_schema: t.parameters as Anthropic.Tool["input_schema"],
}));

type ToolHandler = (input: Record<string, unknown>) => Promise<unknown>;

export const TOOL_HANDLERS: Record<string, ToolHandler> = {
  async list_policy_topics() {
    return await loadPolicyIndex();
  },

  async read_policy(input) {
    const slug = String(input.slug ?? "");
    if (!slug) throw new Error("slug is required");
    const text = await loadPolicyDoc(slug);
    return { slug, content: text };
  },

  async find_contacts(input) {
    const category = input.category ? String(input.category) : undefined;
    const search = input.search ? String(input.search) : undefined;
    const matches = await findContacts({ category, search });
    return { count: matches.length, contacts: matches };
  },

  async search_reddit(input) {
    const query = String(input.query ?? "");
    if (!query) throw new Error("query is required");
    const limit = typeof input.limit === "number" ? input.limit : 5;
    const posts = await searchReddit(query, limit);
    return { count: posts.length, posts };
  },

  async search_woroni(input) {
    const query = String(input.query ?? "");
    if (!query) throw new Error("query is required");
    const limit = typeof input.limit === "number" ? input.limit : 5;
    const articles = await searchWoroni(query, limit);
    return { count: articles.length, articles };
  },

  async search_anusa_cases(input) {
    const category = input.category ? String(input.category) : undefined;
    const search = input.search ? String(input.search) : undefined;
    const cases = await searchAnusaCases({ category, search });
    return {
      count: cases.length,
      cases,
      _disclaimer:
        "Illustrative patterns, not real cases. Use to anticipate what tends to go wrong; never quote as a real person's outcome.",
    };
  },

  async search_youtube(input) {
    const query = String(input.query ?? "");
    if (!query) throw new Error("query is required");
    const limit = typeof input.limit === "number" ? input.limit : 5;
    const videos = await searchYoutube(query, limit);
    return { count: videos.length, videos };
  },
};

export async function runTool(
  name: string,
  input: Record<string, unknown>,
): Promise<unknown> {
  const handler = TOOL_HANDLERS[name];
  if (!handler) throw new Error(`Unknown tool: ${name}`);
  return await handler(input);
}
