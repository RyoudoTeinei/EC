export type ProviderId = "deepseek" | "anthropic";

export type AgentConfig = {
  provider: ProviderId;
  apiKey: string;
  model: string;
  baseUrl?: string;
};

export type ProviderOption = {
  id: ProviderId;
  label: string;
  defaultModel: string;
  models: string[];
  defaultBaseUrl?: string;
  helpText: string;
};

export const PROVIDER_OPTIONS: ProviderOption[] = [
  {
    id: "deepseek",
    label: "DeepSeek",
    defaultModel: "deepseek-v4-flash",
    models: ["deepseek-v4-flash", "deepseek-v4-pro"],
    defaultBaseUrl: "https://api.deepseek.com/v1",
    helpText:
      "Get a key at platform.deepseek.com. flash is fast and cheap; pro for higher quality.",
  },
  {
    id: "anthropic",
    label: "Anthropic (Claude)",
    defaultModel: "claude-sonnet-4-6",
    models: [
      "claude-haiku-4-5",
      "claude-sonnet-4-6",
      "claude-opus-4-7",
    ],
    helpText: "Get a key at console.anthropic.com. Sonnet 4.6 is a solid default.",
  },
];

export type PolicyIndexEntry = {
  slug: string;
  title: string;
  summary: string;
  keywords: string[];
};

export type Contact = {
  id: string;
  name: string;
  category: string;
  purpose: string;
  location?: string;
  hours?: string;
  phone?: string;
  email?: string;
  url?: string;
  notes?: string;
  verified?: boolean;
};

export type RedditPost = {
  topic?: string;
  title: string;
  url: string;
  score?: number;
  takeaway: string;
  source?: "live" | "snapshot";
};

export type WoroniArticle = {
  title: string;
  url: string;
  description: string;
  pubDate?: string;
  source?: "live" | "snapshot";
};

export type YoutubeVideo = {
  title: string;
  url: string;
  channel: string;
  description: string;
  publishedAt?: string;
};

export type AnusaCase = {
  id: string;
  category:
    | "academic_misconduct"
    | "special_consideration_appeal"
    | "extension_dispute"
    | "hardship"
    | "tenancy"
    | "fees_refund"
    | "discrimination"
    | "general";
  scenario: string;
  what_student_did: string;
  outcome: string;
  takeaway: string;
};

export type AnswerStep = {
  step: string;
  detail?: string;
  url?: string;
};

export type AnswerContact = {
  name: string;
  why: string;
  phone?: string;
  email?: string;
  url?: string;
  hours?: string;
  location?: string;
};

export type AnswerFallback = {
  if: string;
  then: string;
};

export type AnswerCommunityTip = {
  title: string;
  url?: string;
  takeaway: string;
};

export type AnswerEmailTemplate = {
  to: string;
  subject: string;
  body: string;
};

export type StructuredAnswer = {
  understanding: string;
  urgency: "low" | "medium" | "high" | "crisis";
  main_steps: AnswerStep[];
  required_documents: string[];
  contacts: AnswerContact[];
  fallbacks: AnswerFallback[];
  community_tips: AnswerCommunityTip[];
  email_template?: AnswerEmailTemplate;
  warnings: string[];
  verify_with: string[];
};

export type ClientSettings = {
  provider: ProviderId;
  apiKey: string;
  model?: string;
  baseUrl?: string;
};

export type AskRequest = {
  question: string;
  settings?: ClientSettings;
};

export type AskResponse =
  | { ok: true; answer: StructuredAnswer; trace: AgentTrace }
  | { ok: false; error: string; code?: "missing_key" | "agent_error" };

export type AgentTraceStep =
  | { type: "tool_call"; name: string; input: unknown }
  | { type: "tool_result"; name: string; ok: boolean; preview: string }
  | { type: "thinking"; text: string };

export type AgentTrace = {
  steps: AgentTraceStep[];
  durationMs: number;
  model: string;
  provider: ProviderId;
};
