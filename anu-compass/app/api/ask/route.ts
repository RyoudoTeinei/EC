import { runAgent } from "@/lib/agent";
import { PROVIDER_OPTIONS } from "@/lib/types";
import type {
  AgentConfig,
  AskRequest,
  AskResponse,
  ClientSettings,
  ProviderId,
} from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 90;

export async function POST(req: Request): Promise<Response> {
  let body: AskRequest;
  try {
    body = (await req.json()) as AskRequest;
  } catch {
    return Response.json(
      { ok: false, error: "Request body must be JSON." } satisfies AskResponse,
      { status: 400 },
    );
  }

  const question = body.question?.trim();
  if (!question) {
    return Response.json(
      { ok: false, error: "Field 'question' is required." } satisfies AskResponse,
      { status: 400 },
    );
  }
  if (question.length > 2000) {
    return Response.json(
      {
        ok: false,
        error: "Question is too long (max 2000 chars).",
      } satisfies AskResponse,
      { status: 400 },
    );
  }

  let config: AgentConfig;
  try {
    config = resolveConfig(body.settings);
  } catch (err) {
    return Response.json(
      {
        ok: false,
        error: (err as Error).message,
        code: "missing_key",
      } satisfies AskResponse,
      { status: 400 },
    );
  }

  try {
    const { answer, trace } = await runAgent(question, config);
    return Response.json({ ok: true, answer, trace } satisfies AskResponse);
  } catch (err) {
    console.error("[/api/ask] failed:", (err as Error).message);
    return Response.json(
      {
        ok: false,
        error: (err as Error).message,
        code: "agent_error",
      } satisfies AskResponse,
      { status: 500 },
    );
  }
}

function resolveConfig(settings?: ClientSettings): AgentConfig {
  if (settings?.apiKey) {
    const provider = settings.provider;
    const opt = PROVIDER_OPTIONS.find((p) => p.id === provider);
    if (!opt) throw new Error(`Unknown provider: ${provider}`);
    return {
      provider,
      apiKey: settings.apiKey,
      model: settings.model || opt.defaultModel,
      baseUrl: settings.baseUrl || opt.defaultBaseUrl,
    };
  }

  if (process.env.DEEPSEEK_API_KEY) {
    return {
      provider: "deepseek",
      apiKey: process.env.DEEPSEEK_API_KEY,
      model: process.env.DEEPSEEK_MODEL || providerDefault("deepseek"),
      baseUrl:
        process.env.DEEPSEEK_BASE_URL || providerDefaultBaseUrl("deepseek"),
    };
  }

  if (process.env.ANTHROPIC_API_KEY) {
    return {
      provider: "anthropic",
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: process.env.ANTHROPIC_MODEL || providerDefault("anthropic"),
    };
  }

  throw new Error(
    "No API key configured. Open Settings (top-right) and paste a DeepSeek or Anthropic key. The key stays in your browser.",
  );
}

function providerDefault(id: ProviderId): string {
  return PROVIDER_OPTIONS.find((p) => p.id === id)!.defaultModel;
}

function providerDefaultBaseUrl(id: ProviderId): string | undefined {
  return PROVIDER_OPTIONS.find((p) => p.id === id)!.defaultBaseUrl;
}
