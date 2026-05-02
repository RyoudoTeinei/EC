import type { ProviderId } from "@/lib/types";

export const runtime = "nodejs";

export type HealthResponse = {
  hasServerKey: boolean;
  provider: ProviderId | null;
};

export async function GET(): Promise<Response> {
  let provider: ProviderId | null = null;
  if (process.env.DEEPSEEK_API_KEY) provider = "deepseek";
  else if (process.env.ANTHROPIC_API_KEY) provider = "anthropic";
  return Response.json({
    hasServerKey: provider !== null,
    provider,
  } satisfies HealthResponse);
}
