import { verifyConnection, type VerifyResult } from "@/lib/verify";
import { PROVIDER_OPTIONS, type AgentConfig, type ClientSettings } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request): Promise<Response> {
  let body: ClientSettings;
  try {
    body = (await req.json()) as ClientSettings;
  } catch {
    return Response.json(
      { ok: false, latencyMs: 0, error: "Body must be JSON." } satisfies VerifyResult,
      { status: 400 },
    );
  }

  if (!body.apiKey?.trim()) {
    return Response.json(
      { ok: false, latencyMs: 0, error: "API key is required." } satisfies VerifyResult,
      { status: 400 },
    );
  }

  const opt = PROVIDER_OPTIONS.find((p) => p.id === body.provider);
  if (!opt) {
    return Response.json(
      {
        ok: false,
        latencyMs: 0,
        error: `Unknown provider: ${body.provider}`,
      } satisfies VerifyResult,
      { status: 400 },
    );
  }

  const config: AgentConfig = {
    provider: body.provider,
    apiKey: body.apiKey.trim(),
    model: body.model || opt.defaultModel,
    baseUrl: body.baseUrl?.trim() || opt.defaultBaseUrl,
  };

  const result = await verifyConnection(config);
  return Response.json(result);
}
