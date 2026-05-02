"use client";

import { useState } from "react";
import type { AgentTrace, StructuredAnswer } from "@/lib/types";

type Props = {
  answer: StructuredAnswer;
  trace: AgentTrace;
};

const URGENCY_STYLES: Record<StructuredAnswer["urgency"], string> = {
  low: "ring-emerald-500/20 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
  medium: "ring-amber-500/20 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  high: "ring-orange-500/20 bg-orange-500/10 text-orange-800 dark:text-orange-300",
  crisis: "ring-red-500/30 bg-red-500/10 text-red-800 dark:text-red-300",
};

export default function AnswerCard({ answer, trace }: Props) {
  const [copied, setCopied] = useState(false);

  async function copyEmail() {
    if (!answer.email_template) return;
    const t = answer.email_template;
    const text = `To: ${t.to}\nSubject: ${t.subject}\n\n${t.body}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const toolCalls = trace.steps.filter((s) => s.type === "tool_call").length;

  return (
    <article className="space-y-5">
      {answer.urgency === "crisis" && <CrisisBanner />}

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span
            className={`inline-flex items-center rounded-full ring-1 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em] ${URGENCY_STYLES[answer.urgency]}`}
          >
            {answer.urgency}
          </span>
          <span className="text-[11px] tabular-nums text-neutral-500 dark:text-neutral-400">
            {trace.model} · {toolCalls} tool calls ·{" "}
            {(trace.durationMs / 1000).toFixed(1)}s
          </span>
        </div>
        <p className="mt-3 text-base sm:text-lg leading-relaxed text-neutral-800 dark:text-neutral-100">
          {answer.understanding}
        </p>
      </Card>

      {answer.main_steps.length > 0 && (
        <Section title="Main steps">
          <ol className="space-y-4">
            {answer.main_steps.map((s, i) => (
              <li key={i} className="flex gap-4">
                <span
                  aria-hidden
                  className="flex-none mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full ring-1 ring-black/5 dark:ring-white/10 bg-white/80 dark:bg-neutral-800 text-xs font-semibold tabular-nums text-neutral-900 dark:text-neutral-50"
                >
                  {i + 1}
                </span>
                <div className="flex-1 space-y-1">
                  <p className="font-medium text-neutral-900 dark:text-neutral-50">
                    {s.step}
                  </p>
                  {s.detail && (
                    <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                      {s.detail}
                    </p>
                  )}
                  {s.url && (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 underline-offset-2 hover:underline break-all"
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
        <Section title="What to bring">
          <ul className="space-y-1.5">
            {answer.required_documents.map((d, i) => (
              <li
                key={i}
                className="flex gap-2.5 text-sm text-neutral-700 dark:text-neutral-300"
              >
                <span
                  aria-hidden
                  className="mt-1.5 inline-block h-1 w-1 flex-none rounded-full bg-neutral-400 dark:bg-neutral-500"
                />
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
                className="rounded-2xl ring-1 ring-black/5 dark:ring-white/10 bg-white/40 dark:bg-neutral-900/30 p-4"
              >
                <p className="font-medium text-neutral-900 dark:text-neutral-50">
                  {c.name}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                  {c.why}
                </p>
                <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
                  {c.phone && (
                    <DetailRow
                      label="Phone"
                      value={c.phone}
                      href={`tel:${c.phone.replace(/\s+/g, "")}`}
                    />
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
                  {c.location && (
                    <DetailRow label="Location" value={c.location} />
                  )}
                </dl>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {answer.fallbacks.length > 0 && (
        <Section title="If the main path is blocked">
          <ul className="space-y-2.5">
            {answer.fallbacks.map((f, i) => (
              <li
                key={i}
                className="rounded-2xl bg-neutral-100/70 dark:bg-neutral-800/40 p-3.5 text-sm leading-relaxed text-neutral-700 dark:text-neutral-200"
              >
                <span className="font-semibold text-neutral-900 dark:text-neutral-50">
                  If
                </span>{" "}
                {f.if}
                <span className="mx-1.5 text-neutral-400">→</span>
                {f.then}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {answer.community_tips.length > 0 && (
        <Section title="Lived experience from r/anu">
          <ul className="space-y-2.5">
            {answer.community_tips.map((t, i) => (
              <li
                key={i}
                className="rounded-2xl ring-1 ring-amber-500/20 bg-amber-500/[0.06] p-4 text-sm"
              >
                <p className="font-medium text-neutral-900 dark:text-neutral-50">
                  {t.title}
                </p>
                <p className="mt-1.5 leading-relaxed text-neutral-700 dark:text-neutral-200">
                  {t.takeaway}
                </p>
                {t.url && (
                  <a
                    href={t.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-xs text-amber-800 dark:text-amber-300 underline-offset-2 hover:underline"
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
        <Section
          title="Email template"
          action={
            <button
              type="button"
              onClick={copyEmail}
              className="rounded-full ring-1 ring-black/5 dark:ring-white/10 bg-white/70 dark:bg-neutral-900/60 backdrop-blur px-3 py-1 text-[11px] font-medium text-neutral-700 dark:text-neutral-200 hover:bg-white dark:hover:bg-neutral-800/80 transition"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          }
        >
          <div className="rounded-2xl bg-neutral-50/70 dark:bg-neutral-950/50 ring-1 ring-black/5 dark:ring-white/10 p-4 font-mono text-[13px] leading-relaxed">
            <p>
              <span className="text-neutral-500 dark:text-neutral-500">To:</span>{" "}
              <span className="text-neutral-800 dark:text-neutral-200">
                {answer.email_template.to}
              </span>
            </p>
            <p>
              <span className="text-neutral-500 dark:text-neutral-500">
                Subject:
              </span>{" "}
              <span className="text-neutral-800 dark:text-neutral-200">
                {answer.email_template.subject}
              </span>
            </p>
            <hr className="my-3 border-black/5 dark:border-white/5" />
            <p className="whitespace-pre-wrap text-neutral-700 dark:text-neutral-300">
              {answer.email_template.body}
            </p>
          </div>
        </Section>
      )}

      {answer.warnings.length > 0 && (
        <Section title="Watch out for">
          <ul className="space-y-2">
            {answer.warnings.map((w, i) => (
              <li
                key={i}
                className="flex gap-2.5 text-sm leading-relaxed text-neutral-700 dark:text-neutral-200"
              >
                <WarningIcon />
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {answer.verify_with.length > 0 && (
        <Section title="Verify with">
          <ul className="space-y-1.5">
            {answer.verify_with.map((v, i) => (
              <li key={i} className="text-sm">
                {/^https?:\/\//.test(v) ? (
                  <a
                    href={v}
                    target="_blank"
                    rel="noreferrer"
                    className="text-neutral-700 dark:text-neutral-300 underline-offset-2 hover:underline hover:text-neutral-900 dark:hover:text-neutral-100 break-all"
                  >
                    {v}
                  </a>
                ) : (
                  <span className="text-neutral-700 dark:text-neutral-300">
                    {v}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <details className="group rounded-3xl ring-1 ring-black/5 dark:ring-white/10 bg-white/50 dark:bg-neutral-900/30 backdrop-blur">
        <summary className="cursor-pointer list-none px-5 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 flex items-center justify-between">
          <span>Agent trace · {trace.steps.length} steps</span>
          <ChevronIcon className="transition-transform group-open:rotate-180" />
        </summary>
        <div className="border-t border-black/5 dark:border-white/5 px-5 py-3 space-y-1.5 font-mono text-[11px] leading-relaxed">
          {trace.steps.map((s, i) => (
            <TraceLine key={i} step={s} />
          ))}
        </div>
      </details>
    </article>
  );
}

function CrisisBanner() {
  const lines = [
    {
      tel: "000",
      label: "000",
      caption: "Emergency",
      sub: "Any immediate danger.",
    },
    {
      tel: "131114",
      label: "13 11 14",
      caption: "Lifeline",
      sub: "24/7 crisis support, free.",
    },
    {
      tel: "139276",
      label: "13 92 76",
      caption: "13YARN",
      sub: "24/7 First Nations line.",
    },
  ];
  return (
    <aside
      role="alert"
      aria-live="polite"
      className="rounded-3xl ring-1 ring-red-500/30 bg-red-500/[0.06] dark:bg-red-950/30 backdrop-blur-xl p-5 sm:p-6 shadow-sm"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-red-700 dark:text-red-300">
        If you need help right now
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-red-900 dark:text-red-100">
        These lines pick up 24/7. You don&apos;t have to explain why you&apos;re
        calling.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {lines.map((l) => (
          <a
            key={l.tel}
            href={`tel:${l.tel}`}
            className="block rounded-2xl bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500 px-4 py-3 text-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2 focus:ring-offset-red-50 dark:focus:ring-offset-red-950 active:scale-[0.98]"
          >
            <span className="block text-[10px] font-medium uppercase tracking-[0.14em] opacity-90">
              {l.caption}
            </span>
            <span className="mt-0.5 block text-xl font-semibold tabular-nums">
              {l.label}
            </span>
            <span className="mt-1 block text-[11px] opacity-90">{l.sub}</span>
          </a>
        ))}
      </div>
      <p className="mt-4 text-[11px] text-red-700/80 dark:text-red-300/80 leading-relaxed">
        Also free on campus: ANU Counselling (Mon–Fri) · 1800RESPECT 1800 737
        732 (sexual assault &amp; domestic violence).
      </p>
    </aside>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl ring-1 ring-black/5 dark:ring-white/10 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-xl shadow-sm p-5 sm:p-6">
      {children}
    </div>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl ring-1 ring-black/5 dark:ring-white/10 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-xl shadow-sm p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">
          {title}
        </h2>
        {action}
      </div>
      <div className="mt-4">{children}</div>
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
      <dt className="w-16 flex-none text-[11px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mt-0.5">
        {label}
      </dt>
      <dd className="break-all">
        {href ? (
          <a
            href={href}
            target={href.startsWith("http") ? "_blank" : undefined}
            rel="noreferrer"
            className="text-neutral-700 dark:text-neutral-200 underline-offset-2 hover:underline hover:text-neutral-900 dark:hover:text-neutral-50"
          >
            {value}
          </a>
        ) : (
          <span className="text-neutral-700 dark:text-neutral-200">{value}</span>
        )}
      </dd>
    </div>
  );
}

function TraceLine({ step }: { step: AgentTrace["steps"][number] }) {
  if (step.type === "tool_call") {
    return (
      <div className="text-blue-700 dark:text-blue-300 break-all whitespace-pre-wrap">
        <span className="select-none opacity-60">→ </span>
        <span className="font-semibold">{step.name}</span>
        <span className="opacity-80">
          ({JSON.stringify(step.input).slice(0, 120)})
        </span>
      </div>
    );
  }
  if (step.type === "tool_result") {
    return (
      <div
        className={`pl-4 break-all whitespace-pre-wrap ${
          step.ok
            ? "text-neutral-500 dark:text-neutral-400"
            : "text-red-600 dark:text-red-300"
        }`}
      >
        <span className="select-none opacity-60">← </span>
        <span className="font-semibold">{step.name}</span>
        <span className="opacity-80">: {step.preview}</span>
      </div>
    );
  }
  return (
    <div className="text-neutral-500 dark:text-neutral-400 italic break-all whitespace-pre-wrap">
      thought: {step.text}
    </div>
  );
}

function WarningIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-0.5 flex-none text-amber-600 dark:text-amber-400"
      aria-hidden
    >
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
