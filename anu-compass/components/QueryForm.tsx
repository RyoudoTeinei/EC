"use client";

import { useEffect, useState, type FormEvent } from "react";
import AnswerCard from "./AnswerCard";
import SettingsDialog from "./SettingsDialog";
import { loadSettings } from "@/lib/settings";
import type {
  AskResponse,
  ClientSettings,
  StructuredAnswer,
  AgentTrace,
} from "@/lib/types";

type Props = {
  samplePrompts: string[];
};

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; answer: StructuredAnswer; trace: AgentTrace }
  | {
      status: "error";
      message: string;
      code?: "missing_key" | "agent_error";
    };

export default function QueryForm({ samplePrompts }: Props) {
  const [question, setQuestion] = useState("");
  const [state, setState] = useState<LoadState>({ status: "idle" });
  const [settings, setSettings] = useState<ClientSettings | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    const q = question.trim();
    if (!q) return;
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          settings: settings ?? undefined,
        }),
      });
      const data = (await res.json()) as AskResponse;
      if (!data.ok) {
        setState({ status: "error", message: data.error, code: data.code });
        return;
      }
      setState({ status: "ok", answer: data.answer, trace: data.trace });
    } catch (err) {
      setState({ status: "error", message: (err as Error).message });
    }
  }

  function pickSample(prompt: string) {
    setQuestion(prompt);
  }

  function onSettingsSaved(s: ClientSettings) {
    setSettings(s);
    if (state.status === "error" && state.code === "missing_key") {
      setState({ status: "idle" });
    }
  }

  const loading = state.status === "loading";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-neutral-500 dark:text-neutral-400">
          {settings ? (
            <span>
              Using <span className="font-medium">{settings.provider}</span>
              {" / "}
              <span className="font-mono">
                {settings.model ?? "(default)"}
              </span>
            </span>
          ) : (
            <span className="text-amber-700 dark:text-amber-300">
              No API key set — using server defaults if available.
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-200 shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-800"
        >
          <span aria-hidden>⚙</span> Settings
        </button>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <label htmlFor="question" className="sr-only">
          Describe your situation
        </label>
        <textarea
          id="question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Describe what's happening — be as honest and specific as you can. e.g. 'I'm sick and have an exam tomorrow.'"
          rows={4}
          className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 text-base shadow-sm focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-700"
          maxLength={2000}
          disabled={loading}
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            {question.length}/2000 characters
          </span>
          <button
            type="submit"
            disabled={loading || question.trim().length === 0}
            className="inline-flex items-center justify-center rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-400 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
          >
            {loading ? "Working through it…" : "Get my plan"}
          </button>
        </div>
      </form>

      {state.status === "idle" && (
        <div className="rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 p-4">
          <p className="text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Try one of these
          </p>
          <ul className="mt-3 space-y-2">
            {samplePrompts.map((p) => (
              <li key={p}>
                <button
                  type="button"
                  onClick={() => pickSample(p)}
                  className="w-full text-left text-sm text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 hover:underline"
                >
                  {p}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {loading && <LoadingState />}

      {state.status === "error" && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
          <p className="font-medium">Something went wrong</p>
          <p className="mt-1">{state.message}</p>
          <div className="mt-3 flex gap-2">
            {state.code === "missing_key" ? (
              <button
                onClick={() => setSettingsOpen(true)}
                className="rounded-md bg-red-100 px-3 py-1.5 text-xs font-medium text-red-900 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-100 dark:hover:bg-red-900/60"
              >
                Open Settings
              </button>
            ) : (
              <button
                onClick={() => submit()}
                className="rounded-md bg-red-100 px-3 py-1.5 text-xs font-medium text-red-900 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-100 dark:hover:bg-red-900/60"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      )}

      {state.status === "ok" && (
        <AnswerCard answer={state.answer} trace={state.trace} />
      )}

      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSaved={onSettingsSaved}
      />
    </div>
  );
}

function LoadingState() {
  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 animate-pulse">
      <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
        <span className="inline-block w-2 h-2 rounded-full bg-neutral-400 animate-ping" />
        Reading ANU policy, checking r/anu, and putting together a plan…
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 w-3/4 rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-3 w-1/2 rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-3 w-2/3 rounded bg-neutral-200 dark:bg-neutral-800" />
      </div>
    </div>
  );
}
