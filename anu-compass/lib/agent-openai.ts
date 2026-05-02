import OpenAI from "openai";
import type { AgentConfig, AgentTraceStep } from "./types";
import { OPENAI_TOOLS, runTool } from "./tools";
import {
  MAX_TOOL_TURNS,
  SYSTEM_PROMPT,
  parseStructuredAnswer,
  type AgentResult,
} from "./agent";

export async function runAgentOpenAI(
  question: string,
  config: AgentConfig,
): Promise<AgentResult> {
  const startedAt = Date.now();
  const steps: AgentTraceStep[] = [];

  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl ?? "https://api.deepseek.com/v1",
  });

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: question },
  ];

  let finalText: string | null = null;

  for (let turn = 0; turn < MAX_TOOL_TURNS; turn++) {
    const isLastTurn = turn === MAX_TOOL_TURNS - 1;

    const response = await client.chat.completions.create({
      model: config.model,
      messages,
      // On the final allowed turn, drop tools so the model is forced to
      // produce a final text answer instead of looping.
      tools: isLastTurn ? undefined : OPENAI_TOOLS,
      tool_choice: isLastTurn ? undefined : "auto",
    });

    const msg = response.choices[0]?.message;
    if (!msg) throw new Error("Empty response from model.");

    messages.push(msg as OpenAI.Chat.ChatCompletionMessageParam);

    const toolCalls = msg.tool_calls ?? [];
    if (toolCalls.length === 0) {
      finalText = (msg.content ?? "").trim();
      if (finalText) {
        steps.push({ type: "thinking", text: finalText.slice(0, 240) });
      }
      break;
    }

    if (isLastTurn) {
      // Model still tried to call tools on the no-tools turn; ignore and ask
      // for a plain final answer.
      messages.push({
        role: "user",
        content:
          "You did not produce a final answer. Reply NOW with only the JSON object inside a ```json code block, nothing else.",
      });
      const forced = await client.chat.completions.create({
        model: config.model,
        messages,
      });
      finalText = (forced.choices[0]?.message?.content ?? "").trim();
      if (finalText) {
        steps.push({ type: "thinking", text: finalText.slice(0, 240) });
      }
      break;
    }

    for (const tc of toolCalls) {
      if (tc.type !== "function") continue;
      const name = tc.function.name;
      let input: Record<string, unknown> = {};
      try {
        input = tc.function.arguments
          ? (JSON.parse(tc.function.arguments) as Record<string, unknown>)
          : {};
      } catch {
        // leave as {}
      }
      steps.push({ type: "tool_call", name, input });
      try {
        const result = await runTool(name, input);
        const json = JSON.stringify(result);
        steps.push({
          type: "tool_result",
          name,
          ok: true,
          preview: json.length > 200 ? json.slice(0, 200) + "…" : json,
        });
        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: json,
        });
      } catch (err) {
        const message = (err as Error).message;
        steps.push({ type: "tool_result", name, ok: false, preview: message });
        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: `Error: ${message}`,
        });
      }
    }
  }

  if (!finalText) {
    throw new Error(
      "Agent did not produce a final response within the tool-turn budget.",
    );
  }

  const answer = parseStructuredAnswer(finalText);
  return {
    answer,
    trace: {
      steps,
      durationMs: Date.now() - startedAt,
      model: config.model,
      provider: "deepseek",
    },
  };
}
