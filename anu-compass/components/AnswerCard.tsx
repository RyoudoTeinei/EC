"use client";

import { useState } from "react";
import type { AgentTrace, StructuredAnswer } from "@/lib/types";

type Props = {
  answer: StructuredAnswer;
  trace: AgentTrace;
};

const URGENCY_STYLES: Record<StructuredAnswer["urgency"], string> = {
  low: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200",
  medium: "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200",
  high: "bg-orange-100 text-orange-900 dark:bg-orange-950/60 dark:text-orange-200",
  crisis: "bg-red-100 text-red-900 dark:bg-red-950/60 dark:text-red-200",
};

export default function AnswerCard({ answer, trace }: Props) {
  const [showTrace, setShowTrace] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copyEmail() {
    if (!answer.email_template) return;
    const t = answer.email_template;
    const text = `To: ${t.to}\nSubject: ${t.subject}\n\n${t.body}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <article className="space-y-5">
      <header className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium uppercase tracking-wider ${URGENCY_STYLES[answer.urgency]}`}
          >
            {answer.urgency}
          </span>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            {trace.model} · {trace.steps.filter((s) => s.type === "tool_call").length} tool
            calls · {(trace.durationMs / 1000).toFixed(1)}s
          </span>
        </div>
        <p className="mt-3 text-base text-neutral-800 dark:text-neutral-100">
          {answer.understanding}
        </p>
      </header>

      {answer.main_steps.length > 0 && (
        <Section title="Main steps">
          <ol className="space-y-3">
            {answer.main_steps.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex-none mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 text-xs font-medium text-white dark:bg-neutral-100 dark:text-neutral-900">
                  {i + 1}
                </span>
                <div>
                  <p className="font-medium">{s.step}</p>
                  {s.detail && (
                    <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                      {s.detail}
                    </p>
                  )}
                  {s.url && (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block text-xs underline text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100"
                    >
                      {s.url}
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {answer.required_documents.length > 0 && (
        <Section title="What to bring / attach">
          <ul className="space-y-1.5">
            {answer.required_documents.map((d, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="text-neutral-400">·</span>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {answer.contacts.length > 0 && (
        <Section title="Who to contact">
          <ul className="space-y-3">
            {answer.contacts.map((c, i) => (
              <li
                key={i}
                className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-3"
              >
                <p className="font-medium">{c.name}</p>
                <p className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-300">
                  {c.why}
                </p>
                <dl className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                  {c.phone && (
                    <DetailRow label="Phone" value={c.phone} href={`tel:${c.phone}`} />
                  )}
                  {c.email && (
                    <DetailRow
                      label="Email"
                      value={c.email}
                      href={`mailto:${c.email}`}
                    />
                  )}
                  {c.url && <DetailRow label="Web" value={c.url} href={c.url} />}
                  {c.hours && <DetailRow label="Hours" value={c.hours} />}
                  {c.location && <DetailRow label="Location" value={c.location} />}
                </dl>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {answer.fallbacks.length > 0 && (
        <Section title="If the main path is blocked">
          <ul className="space-y-2">
            {answer.fallbacks.map((f, i) => (
              <li
                key={i}
                className="rounded-lg bg-neutral-100 dark:bg-neutral-800/60 p-3 text-sm"
              >
                <span className="font-medium">If</span> {f.if}{" "}
                <span className="font-medium">→</span> {f.then}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {answer.community_tips.length > 0 && (
        <Section title="Lived experience from r/anu">
          <ul className="space-y-2">
            {answer.community_tips.map((t, i) => (
              <li
                key={i}
                className="rounded-lg border border-orange-200 dark:border-orange-900/60 bg-orange-50/60 dark:bg-orange-950/20 p-3 text-sm"
              >
                <p className="font-medium">{t.title}</p>
                <p className="mt-1 text-neutral-700 dark:text-neutral-200">
                  {t.takeaway}
                </p>
                {t.url && (
                  <a
                    href={t.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block text-xs underline text-orange-800 dark:text-orange-200"
                  >
                    open thread
                  </a>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {answer.email_template && (
        <Section title="Email template">
          <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 p-4 text-sm font-mono whitespace-pre-wrap">
            <p>
              <span className="text-neutral-500">To:</span>{" "}
              {answer.email_template.to}
            </p>
            <p>
              <span className="text-neutral-500">Subject:</span>{" "}
              {answer.email_template.subject}
            </p>
            <hr className="my-2 border-neutral-200 dark:border-neutral-800" />
            <p className="whitespace-pre-wrap">{answer.email_template.body}</p>
          </div>
          <button
            onClick={copyEmail}
            className="mt-2 text-xs underline text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100"
          >
            {copied ? "Copied!" : "Copy to clipboard"}
          </button>
        </Section>
      )}

      {answer.warnings.length > 0 && (
        <Section title="Things to watch out for">
          <ul className="space-y-1.5">
            {answer.warnings.map((w, i) => (
              <li key={i} className="text-sm text-neutral-700 dark:text-neutral-200">
                ⚠️ {w}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {answer.verify_with.length > 0 && (
        <Section title="Verify with">
          <ul className="space-y-1">
            {answer.verify_with.map((v, i) => (
              <li key={i} className="text-sm">
                {/^https?:\/\//.test(v) ? (
                  <a
                    href={v}
                    target="_blank"
                    rel="noreferrer"
                    className="underline text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100"
                  >
                    {v}
                  </a>
                ) : (
                  v
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <details className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <summary
          className="cursor-pointer p-3 text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
          onClick={() => setShowTrace((s) => !s)}
        >
          Agent trace ({trace.steps.length} steps)
        </summary>
        <div className="border-t border-neutral-200 dark:border-neutral-800 p-3 space-y-1.5 font-mono text-xs">
          {trace.steps.map((s, i) => (
            <TraceLine key={i} step={s} />
          ))}
        </div>
      </details>
    </article>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function DetailRow({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="flex gap-2">
      <dt className="font-medium text-neutral-500 dark:text-neutral-400 w-16 flex-none">
        {label}
      </dt>
      <dd className="break-all">
        {href ? (
          <a
            href={href}
            target={href.startsWith("http") ? "_blank" : undefined}
            rel="noreferrer"
            className="underline text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100"
          >
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

function TraceLine({ step }: { step: AgentTrace["steps"][number] }) {
  if (step.type === "tool_call") {
    return (
      <div className="text-blue-700 dark:text-blue-300 break-all whitespace-pre-wrap leading-relaxed">
        <span className="select-none">→ </span>
        <span className="font-semibold">{step.name}</span>
        <span>({JSON.stringify(step.input).slice(0, 120)})</span>
      </div>
    );
  }
  if (step.type === "tool_result") {
    return (
      <div
        className={`pl-4 break-all whitespace-pre-wrap leading-relaxed ${
          step.ok
            ? "text-neutral-500 dark:text-neutral-400"
            : "text-red-600 dark:text-red-300"
        }`}
      >
        <span className="select-none">← </span>
        <span className="font-semibold">{step.name}</span>
        <span>: {step.preview}</span>
      </div>
    );
  }
  return (
    <div className="text-neutral-500 dark:text-neutral-400 italic break-all whitespace-pre-wrap leading-relaxed">
      thought: {step.text}
    </div>
  );
}
