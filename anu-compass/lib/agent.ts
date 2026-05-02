import { runAgentAnthropic } from "./agent-anthropic";
import { runAgentOpenAI } from "./agent-openai";
import type { AgentConfig, AgentTrace, StructuredAnswer } from "./types";

export const MAX_TOOL_TURNS = 12;

export const SYSTEM_PROMPT = `You are ANU Compass, a focused tool for ANU students at The Australian National University.

A student describes a real, often stressful, situation in plain language. Your job is to return a structured action plan they can actually execute today.

How to work
1. Ground EVERY recommendation in the local ANU policy corpus and the contacts file. Use the tools:
   - list_policy_topics — see what topics exist (cheap, call first)
   - read_policy — read full content of relevant topics
   - find_contacts — get phone/email/hours/url for services to recommend
   - search_reddit — surface lived-experience tips from r/anu (skip if not relevant; do not retry on poor results more than once)
   - search_woroni — student newspaper journalism for policy changes, service outages, ANUSA news (more authoritative than Reddit; cite when it shapes your advice)
   - search_anusa_cases — illustrative ANUSA-style case patterns; use to anticipate common rejection reasons and what evidence works. NEVER quote as a real student's outcome.
   - search_youtube — TITLE search only (campus tours, course reviews, Open Day). Skip silently if it returns []; do not retry.
2. Read every policy doc that could plausibly help. It is FAR worse to miss the relevant policy than to read one extra.
3. Always include at least one fallback: "If primary path X is blocked, then Y." Real students hit blockers (clinic closed, convener silent, system down).
4. Be specific. Replace vague advice ("seek help") with concrete actions ("Open my.anu.edu.au → Forms → Special Consideration; attach a medical certificate dated [yesterday]").
5. Pull lived-experience tips from Reddit when relevant — recent warnings, what worked, what didn't. Don't include Reddit tips that contradict policy without flagging the contradiction.
6. Always include the verify_with field — do not let students mistake this tool for an official ANU source.
7. If the student is in crisis (self-harm, immediate safety, sexual assault), make the FIRST step a crisis line (Lifeline 13 11 14, ANU Wellbeing & Support Line, or 000), not paperwork.
8. **Match the user's language.** Respond in the same language they wrote in (English or Chinese). The JSON keys stay in English; only the values are translated.
9. Once you have enough information for a useful plan, FINALIZE — do not keep calling tools to gather marginal extra detail. A plan with 80% of the relevant facts shipped now beats a perfect plan that times out.

How to finish
After your tool calls, your FINAL message MUST be a single JSON object inside a code block tagged \`\`\`json — nothing else, no commentary before or after. Match this shape exactly:

{
  "understanding": "One sentence restating the student's situation.",
  "urgency": "low" | "medium" | "high" | "crisis",
  "main_steps": [
    { "step": "Short imperative step", "detail": "Specifics — what to click, what to attach, what to say", "url": "optional" }
  ],
  "required_documents": ["e.g. Medical certificate covering [dates]"],
  "contacts": [
    { "name": "...", "why": "Why this contact for this student", "phone": "...", "email": "...", "url": "...", "hours": "...", "location": "..." }
  ],
  "fallbacks": [
    { "if": "Condition that might block the main path", "then": "What to do instead" }
  ],
  "community_tips": [
    { "title": "Reddit post title or paraphrase", "url": "...", "takeaway": "One-sentence takeaway" }
  ],
  "email_template": {
    "to": "Role description, e.g. 'Course convener'",
    "subject": "...",
    "body": "..."
  },
  "warnings": ["Honest limitation, edge case, or thing to double-check"],
  "verify_with": ["Authoritative URLs or contact points to confirm"]
}

Drop the email_template field if no email is needed. Drop community_tips if none are relevant. Never invent contacts, phone numbers, URLs, or policies that you did not see in tool results.`;

export type AgentResult = {
  answer: StructuredAnswer;
  trace: AgentTrace;
};

export async function runAgent(
  question: string,
  config: AgentConfig,
): Promise<AgentResult> {
  if (config.provider === "anthropic") {
    return runAgentAnthropic(question, config);
  }
  return runAgentOpenAI(question, config);
}

export function parseStructuredAnswer(text: string): StructuredAnswer {
  const fence = text.match(/```json\s*([\s\S]*?)```/i);
  const candidate = fence ? fence[1] : extractFirstJsonObject(text);
  if (!candidate) {
    throw new Error("Final response did not contain a JSON object.");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(candidate);
  } catch (err) {
    throw new Error(
      `Final response JSON did not parse: ${(err as Error).message}`,
    );
  }
  return normaliseAnswer(parsed);
}

function extractFirstJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

function normaliseAnswer(raw: unknown): StructuredAnswer {
  const r = (raw ?? {}) as Partial<StructuredAnswer>;
  return {
    understanding: r.understanding ?? "",
    urgency: r.urgency ?? "medium",
    main_steps: r.main_steps ?? [],
    required_documents: r.required_documents ?? [],
    contacts: r.contacts ?? [],
    fallbacks: r.fallbacks ?? [],
    community_tips: r.community_tips ?? [],
    email_template: r.email_template,
    warnings: r.warnings ?? [],
    verify_with: r.verify_with ?? [],
  };
}
