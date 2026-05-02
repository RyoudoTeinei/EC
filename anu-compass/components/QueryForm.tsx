"use client";

import { useEffect, useState, type FormEvent } from "react";
import AnswerCard from "./AnswerCard";
import ModeToggle from "./ModeToggle";
import SettingsDialog from "./SettingsDialog";
import ThemePicker from "./ThemePicker";
import { loadSettings } from "@/lib/settings";
import type {
  AskResponse,
  ClientSettings,
  ProviderId,
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

type ServerHealth = {
  hasServerKey: boolean;
  provider: ProviderId | null;
};

const PROVIDER_LABEL: Record<ProviderId, string> = {
  deepseek: "DeepSeek",
  anthropic: "Anthropic",
};

export default function QueryForm({ samplePrompts }: Props) {
  const [question, setQuestion] = useState("");
  const [state, setState] = useState<LoadState>({ status: "idle" });
  const [settings, setSettings] = useState<ClientSettings | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [serverHealth, setServerHealth] = useState<ServerHealth | null>(null);

  useEffect(() => {
    setSettings(loadSettings());
    fetch("/api/health")
      .then((r) => (r.ok ? r.json() : null))
      .then((h: ServerHealth | null) => setServerHealth(h))
      .catch(() => setServerHealth({ hasServerKey: false, provider: null }));
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
        <StatusLine settings={settings} health={serverHealth} />
        <div className="flex items-center gap-1.5">
          <ThemePicker />
          <ModeToggle />
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label="Settings"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-black/5 dark:ring-white/10 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-xl text-neutral-700 dark:text-neutral-200 shadow-sm hover:bg-white dark:hover:bg-neutral-800/80 transition"
          >
            <GearIcon />
          </button>
        </div>
      </div>

      <form onSubmit={submit}>
        <label htmlFor="question" className="sr-only">
          Describe your situation
        </label>
        <div className="rounded-[28px] ring-1 ring-black/5 dark:ring-white/10 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-xl shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-neutral-900/20 dark:focus-within:ring-white/20 transition">
          <textarea
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Describe what's happening — be honest and specific. e.g. 'I'm sick and have an exam tomorrow.'"
            rows={4}
            className="w-full resize-none bg-transparent p-5 text-base text-neutral-900 dark:text-neutral-50 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none disabled:opacity-60"
            maxLength={2000}
            disabled={loading}
          />
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/5 dark:border-white/5 px-5 py-3">
            <span className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
              {question.length} / 2000
            </span>
            <button
              type="submit"
              disabled={loading || question.trim().length === 0}
              className="inline-flex items-center justify-center rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-neutral-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-neutral-300 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-200 dark:disabled:bg-neutral-700"
            >
              {loading ? "Working through it…" : "Get my plan"}
            </button>
          </div>
        </div>
      </form>

      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">
          Try one of these
        </p>
        <ul className="mt-3 space-y-2">
          {samplePrompts.map((p) => (
            <li key={p}>
              <button
                type="button"
                onClick={() => pickSample(p)}
                disabled={loading}
                className="block w-full truncate rounded-2xl ring-1 ring-black/5 dark:ring-white/10 bg-white/60 dark:bg-neutral-900/40 backdrop-blur px-4 py-2.5 text-left text-sm text-neutral-700 dark:text-neutral-300 transition hover:bg-white dark:hover:bg-neutral-800/80 hover:text-neutral-900 dark:hover:text-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
                title={p}
              >
                {p}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {loading && <LoadingState />}

      {state.status === "error" && (
        <div className="rounded-3xl ring-1 ring-red-300/70 dark:ring-red-900/60 bg-red-50/70 dark:bg-red-950/30 backdrop-blur-xl p-5 text-sm text-red-900 dark:text-red-200">
          <p className="font-medium">Something went wrong</p>
          <p className="mt-1 text-red-800/90 dark:text-red-200/90">
            {state.message}
          </p>
          <div className="mt-4">
            {state.code === "missing_key" ? (
              <button
                onClick={() => setSettingsOpen(true)}
                className="rounded-full bg-red-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition"
              >
                Open Settings
              </button>
            ) : (
              <button
                onClick={() => submit()}
                className="rounded-full bg-red-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition"
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

const LOADING_PHASES: { afterMs: number; label: string }[] = [
  { afterMs: 0, label: "Reading your situation" },
  { afterMs: 6000, label: "Checking ANU policy corpus" },
  { afterMs: 16000, label: "Searching r/anu and Woroni for similar cases" },
  { afterMs: 30000, label: "Drafting your action plan" },
];

function LoadingState() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      let next = 0;
      for (let i = LOADING_PHASES.length - 1; i >= 0; i--) {
        if (elapsed >= LOADING_PHASES[i].afterMs) {
          next = i;
          break;
        }
      }
      setPhase(next);
    }, 500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="rounded-3xl ring-1 ring-black/5 dark:ring-white/10 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-xl shadow-sm p-6">
      <div className="flex items-center gap-2.5 text-sm font-medium text-neutral-900 dark:text-neutral-50">
        <span className="relative inline-flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-70" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        {LOADING_PHASES[phase].label}
      </div>
      <ol className="mt-4 space-y-1.5">
        {LOADING_PHASES.map((p, i) => {
          const done = i < phase;
          const active = i === phase;
          return (
            <li
              key={i}
              className={`flex items-center gap-2.5 text-xs transition-colors ${
                done
                  ? "text-neutral-500 dark:text-neutral-400"
                  : active
                    ? "text-neutral-900 dark:text-neutral-50"
                    : "text-neutral-300 dark:text-neutral-600"
              }`}
            >
              <span
                aria-hidden
                className={`inline-block h-1.5 w-1.5 flex-none rounded-full ${
                  done
                    ? "bg-neutral-400 dark:bg-neutral-500"
                    : active
                      ? "bg-neutral-900 dark:bg-neutral-50"
                      : "bg-neutral-300 dark:bg-neutral-700"
                }`}
              />
              {p.label}
            </li>
          );
        })}
      </ol>
      <div className="mt-5 space-y-2.5 animate-pulse">
        <div className="h-2.5 w-3/4 rounded-full bg-neutral-200/70 dark:bg-neutral-800/70" />
        <div className="h-2.5 w-1/2 rounded-full bg-neutral-200/70 dark:bg-neutral-800/70" />
        <div className="h-2.5 w-2/3 rounded-full bg-neutral-200/70 dark:bg-neutral-800/70" />
      </div>
    </div>
  );
}

function StatusLine({
  settings,
  health,
}: {
  settings: ClientSettings | null;
  health: ServerHealth | null;
}) {
  if (settings) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full ring-1 ring-black/5 dark:ring-white/10 bg-white/60 dark:bg-neutral-900/40 backdrop-blur px-2.5 py-1 text-[11px] text-neutral-600 dark:text-neutral-300">
        <span className="font-medium text-neutral-800 dark:text-neutral-100">
          {settings.provider}
        </span>
        <span className="text-neutral-400 dark:text-neutral-500">·</span>
        <span className="font-mono text-neutral-500 dark:text-neutral-400">
          {settings.model ?? "default"}
        </span>
      </span>
    );
  }
  if (health?.hasServerKey && health.provider) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full ring-1 ring-emerald-500/20 bg-emerald-500/10 dark:bg-emerald-400/10 px-2.5 py-1 text-[11px] font-medium text-emerald-800 dark:text-emerald-300">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Ready · Shared {PROVIDER_LABEL[health.provider]} key
      </span>
    );
  }
  if (health && !health.hasServerKey) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full ring-1 ring-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-800 dark:text-amber-300">
        No API key — open Settings
      </span>
    );
  }
  return <span aria-hidden />;
}

function GearIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
