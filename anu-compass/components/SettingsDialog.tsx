"use client";

import { useEffect, useRef, useState } from "react";
import { PROVIDER_OPTIONS, type ClientSettings, type ProviderId } from "@/lib/types";
import type { VerifyResult } from "@/lib/verify";
import { defaultSettingsFor, loadSettings, saveSettings } from "@/lib/settings";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: (settings: ClientSettings) => void;
};

type TestState =
  | { status: "idle" }
  | { status: "testing" }
  | { status: "ok"; latencyMs: number; sample: string }
  | { status: "error"; latencyMs: number; message: string };

export default function SettingsDialog({ open, onClose, onSaved }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [settings, setSettings] = useState<ClientSettings>(() =>
    defaultSettingsFor("deepseek"),
  );
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [test, setTest] = useState<TestState>({ status: "idle" });

  useEffect(() => {
    if (!open) return;
    const existing = loadSettings();
    if (existing) {
      setSettings(existing);
      setShowAdvanced(Boolean(existing.baseUrl));
    } else {
      setSettings(defaultSettingsFor("deepseek"));
      setShowAdvanced(false);
    }
    setTest({ status: "idle" });
  }, [open]);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open && !dlg.open) dlg.showModal();
    if (!open && dlg.open) dlg.close();
  }, [open]);

  const currentProvider = PROVIDER_OPTIONS.find(
    (p) => p.id === settings.provider,
  )!;

  function updateSettings(patch: Partial<ClientSettings>) {
    setSettings((s) => ({ ...s, ...patch }));
    setTest({ status: "idle" });
  }

  function pickProvider(id: ProviderId) {
    if (id === settings.provider) return;
    const opt = PROVIDER_OPTIONS.find((p) => p.id === id)!;
    setSettings((s) => ({
      provider: id,
      apiKey: s.apiKey,
      model: opt.defaultModel,
      baseUrl: opt.defaultBaseUrl,
    }));
    setTest({ status: "idle" });
  }

  async function runTest() {
    if (!settings.apiKey.trim()) return;
    setTest({ status: "testing" });
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: settings.provider,
          apiKey: settings.apiKey.trim(),
          model: settings.model || currentProvider.defaultModel,
          baseUrl: settings.baseUrl?.trim() || currentProvider.defaultBaseUrl,
        }),
      });
      const data = (await res.json()) as VerifyResult;
      if (data.ok) {
        setTest({
          status: "ok",
          latencyMs: data.latencyMs,
          sample: data.sample ?? "",
        });
      } else {
        setTest({
          status: "error",
          latencyMs: data.latencyMs,
          message: data.error ?? "Unknown error",
        });
      }
    } catch (err) {
      setTest({
        status: "error",
        latencyMs: 0,
        message: (err as Error).message,
      });
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!settings.apiKey.trim()) return;
    const final: ClientSettings = {
      provider: settings.provider,
      apiKey: settings.apiKey.trim(),
      model: settings.model || currentProvider.defaultModel,
      baseUrl: settings.baseUrl?.trim() || currentProvider.defaultBaseUrl,
    };
    saveSettings(final);
    onSaved(final);
    onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      className="m-auto max-w-md w-[92vw] rounded-2xl p-0 backdrop:bg-black/40 backdrop:backdrop-blur-sm bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 shadow-2xl"
    >
      <form onSubmit={submit} className="p-6 space-y-5">
        <header className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">Settings</h2>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              Your key stays in your browser (localStorage). It is sent with each
              request and never logged on the server.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-m-2 p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        <fieldset>
          <legend className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Provider
          </legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {PROVIDER_OPTIONS.map((p) => (
              <label
                key={p.id}
                className={`cursor-pointer rounded-lg border p-3 text-sm transition ${
                  settings.provider === p.id
                    ? "border-neutral-900 bg-neutral-50 dark:border-neutral-100 dark:bg-neutral-800"
                    : "border-neutral-200 hover:border-neutral-400 dark:border-neutral-700 dark:hover:border-neutral-500"
                }`}
              >
                <input
                  type="radio"
                  name="provider"
                  value={p.id}
                  checked={settings.provider === p.id}
                  onChange={() => pickProvider(p.id)}
                  className="sr-only"
                />
                <div className="font-medium">{p.label}</div>
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  {p.helpText}
                </p>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label
            htmlFor="apiKey"
            className="block text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400"
          >
            API key
          </label>
          <input
            id="apiKey"
            type="password"
            autoComplete="off"
            value={settings.apiKey}
            onChange={(e) => updateSettings({ apiKey: e.target.value })}
            placeholder={
              settings.provider === "deepseek" ? "sk-..." : "sk-ant-..."
            }
            className="mt-1.5 w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-2.5 font-mono text-sm focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-700"
            required
          />
        </div>

        <div>
          <label
            htmlFor="model"
            className="block text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400"
          >
            Model
          </label>
          <select
            id="model"
            value={settings.model}
            onChange={(e) => updateSettings({ model: e.target.value })}
            className="mt-1.5 w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-2.5 text-sm focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-700"
          >
            {currentProvider.models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={runTest}
            disabled={!settings.apiKey.trim() || test.status === "testing"}
            className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-200 shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {test.status === "testing"
              ? "Testing…"
              : test.status === "ok"
                ? "Test again"
                : "Test connection"}
          </button>
          <TestStatus state={test} />
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
          >
            {showAdvanced ? "Hide" : "Show"} advanced options
          </button>
          {showAdvanced && (
            <div className="mt-3">
              <label
                htmlFor="baseUrl"
                className="block text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400"
              >
                Base URL{" "}
                <span className="font-normal normal-case">
                  (override default endpoint)
                </span>
              </label>
              <input
                id="baseUrl"
                type="url"
                value={settings.baseUrl ?? ""}
                onChange={(e) => updateSettings({ baseUrl: e.target.value })}
                placeholder={currentProvider.defaultBaseUrl ?? "(SDK default)"}
                className="mt-1.5 w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-2.5 font-mono text-sm focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-700"
              />
            </div>
          )}
        </div>

        <footer className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!settings.apiKey.trim()}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-400 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
          >
            Save
          </button>
        </footer>
      </form>
    </dialog>
  );
}

function TestStatus({ state }: { state: TestState }) {
  if (state.status === "idle") {
    return (
      <span className="text-xs text-neutral-500 dark:text-neutral-400">
        Verifies the key, model, and endpoint by sending a tiny probe.
      </span>
    );
  }
  if (state.status === "testing") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
        <span className="inline-block h-2 w-2 animate-ping rounded-full bg-neutral-400" />
        Sending probe…
      </span>
    );
  }
  if (state.status === "ok") {
    const sample = state.sample.replace(/\s+/g, " ").slice(0, 40);
    return (
      <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
        <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 font-medium text-emerald-800 dark:text-emerald-200">
          ✓ Connected · {state.latencyMs}ms
        </span>
        {sample && (
          <span className="text-neutral-500 dark:text-neutral-400">
            replied: <span className="font-mono">{sample}</span>
          </span>
        )}
      </span>
    );
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
      <span className="rounded-full bg-red-100 dark:bg-red-950/60 px-2 py-0.5 font-medium text-red-800 dark:text-red-200">
        ✗ Failed
      </span>
      <span className="text-red-700 dark:text-red-300">{state.message}</span>
    </span>
  );
}
