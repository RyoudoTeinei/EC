import Anthropic from "@anthropic-ai/sdk";
import type { AgentConfig, AgentTraceStep } from "./types";
import { ANTHROPIC_TOOLS, runTool } from "./tools";
import {
  MAX_TOOL_TURNS,
  SYSTEM_PROMPT,
  parseStructuredAnswer,
  type AgentResult,
} from "./agent";

export async function runAgentAnthropic(
  question: string,
  config: AgentConfig,
): Promise<AgentResult> {
  const startedAt = Date.now();
  const steps: AgentTraceStep[] = [];

  const client = new Anthropic({
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
  });

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: question },
  ];

  let finalText: string | null = null;

  for (let turn = 0; turn < MAX_TOOL_TURNS; turn++) {
    const isLastTurn = turn === MAX_TOOL_TURNS - 1;

    const response = await client.messages.create({
      model: config.model,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      // On the final allowed turn, drop tools so the model is forced to
      // produce a final text answer instead of looping.
      tools: isLastTurn ? undefined : ANTHROPIC_TOOLS,
      messages,
    });

    messages.push({ role: "assistant", content: response.content });

    const toolUses = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
    );

    if (toolUses.length === 0) {
      const textBlocks = response.content.filter(
        (b): b is Anthropic.TextBlock => b.type === "text",
      );
      finalText = textBlocks.map((b) => b.text).join("\n").trim();
      if (finalText) {
        steps.push({ type: "thinking", text: finalText.slice(0, 240) });
      }
      break;
    }

    if (isLastTurn) {
      // Model still tried to call tools on the no-tools turn; ask for the
      // final JSON without tools.
      messages.push({
        role: "user",
        content:
          "You did not produce a final answer. Reply NOW with only the JSON object inside a ```json code block, nothing else.",
      });
      const forced = await client.messages.create({
        model: config.model,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages,
      });
      const textBlocks = forced.content.filter(
        (b): b is Anthropic.TextBlock => b.type === "text",
      );
      finalText = textBlocks.map((b) => b.text).join("\n").trim();
      if (finalText) {
        steps.push({ type: "thinking", text: finalText.slice(0, 240) });
      }
      break;
    }

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const tu of toolUses) {
      steps.push({ type: "tool_call", name: tu.name, input: tu.input });
      try {
        const result = await runTool(
          tu.name,
          tu.input as Record<string, unknown>,
        );
        const json = JSON.stringify(result);
        steps.push({
          type: "tool_result",
          name: tu.name,
          ok: true,
          preview: json.length > 200 ? json.slice(0, 200) + "…" : json,
        });
        toolResults.push({
          type: "tool_result",
          tool_use_id: tu.id,
          content: json,
        });
      } catch (err) {
        const message = (err as Error).message;
        steps.push({
          type: "tool_result",
          name: tu.name,
          ok: false,
          preview: message,
        });
        toolResults.push({
          type: "tool_result",
          tool_use_id: tu.id,
          content: `Error: ${message}`,
          is_error: true,
        });
      }
    }
    messages.push({ role: "user", content: toolResults });
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
      provider: "anthropic",
    },
  };
}
