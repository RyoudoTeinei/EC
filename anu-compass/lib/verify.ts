import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import type { AgentConfig } from "./types";

export type VerifyResult = {
  ok: boolean;
  latencyMs: number;
  sample?: string;
  error?: string;
};

const PROBE_PROMPT = "Reply with the single word: pong";

export async function verifyConnection(
  config: AgentConfig,
): Promise<VerifyResult> {
  const startedAt = Date.now();
  try {
    if (config.provider === "anthropic") {
      const client = new Anthropic({
        apiKey: config.apiKey,
        baseURL: config.baseUrl,
      });
      const r = await client.messages.create({
        model: config.model,
        max_tokens: 64,
        messages: [{ role: "user", content: PROBE_PROMPT }],
      });
      const text = r.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("")
        .trim();
      return {
        ok: true,
        latencyMs: Date.now() - startedAt,
        sample: text || "(empty response)",
      };
    }

    const client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl ?? "https://api.deepseek.com/v1",
    });
    const r = await client.chat.completions.create({
      model: config.model,
      max_tokens: 64,
      messages: [{ role: "user", content: PROBE_PROMPT }],
    });
    const text = (r.choices[0]?.message?.content ?? "").trim();
    return {
      ok: true,
      latencyMs: Date.now() - startedAt,
      sample: text || "(empty response)",
    };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - startedAt,
      error: humaniseError(err),
    };
  }
}

function humaniseError(err: unknown): string {
  if (!(err instanceof Error)) return "Unknown error";
  const msg = err.message;
  if (/\b401\b|authentication|unauthorized|invalid_api_key/i.test(msg)) {
    return "Invalid API key (401).";
  }
  if (/\b403\b|forbidden|permission/i.test(msg)) {
    return "Forbidden (403). Key may lack access to this model.";
  }
  if (/\b404\b|not[-_ ]?found|no\s+such\s+model/i.test(msg)) {
    return "Model not found (404). Check the model name.";
  }
  if (/\b429\b|rate[-_ ]?limit|too many/i.test(msg)) {
    return "Rate limited (429). Try again in a moment.";
  }
  if (/timed?\s*out|abort|deadline/i.test(msg)) {
    return "Request timed out.";
  }
  if (/fetch\s+failed|enotfound|econnrefused|network/i.test(msg)) {
    return "Network error — could not reach the endpoint.";
  }
  return msg;
}
