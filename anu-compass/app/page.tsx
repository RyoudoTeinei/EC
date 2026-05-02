import QueryForm from "@/components/QueryForm";

const SAMPLE_PROMPTS = [
  "I'm sick with the flu and have a finance final tomorrow morning. What do I do?",
  "I've been reported for using ChatGPT on an essay — terrified, what now?",
  "Census date is in 5 days and I'm thinking of dropping COMP1140 — what happens?",
  "Convener hasn't replied to my extension request and the assignment is due in 4 hours.",
  "I'm a first-year international student, lonely, can barely sleep — where can I get help?",
];

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center px-5 py-14 sm:py-20">
      <header className="w-full max-w-3xl">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">
          ANU Buildathon · Tool for Students
        </p>
        <h1 className="mt-3 text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
          ANU{" "}
          <span className="bg-gradient-to-br from-amber-500 via-rose-500 to-indigo-500 bg-clip-text text-transparent dark:from-amber-300 dark:via-rose-300 dark:to-indigo-300">
            Compass
          </span>
        </h1>
        <p className="mt-5 max-w-2xl text-lg sm:text-xl text-neutral-600 dark:text-neutral-300 leading-relaxed">
          Describe what&apos;s going on. Get a structured plan grounded in
          policy, services, and lived experience from r/anu — with fallbacks
          when the main path is blocked.
        </p>
      </header>

      <section className="w-full max-w-3xl mt-10 sm:mt-12">
        <QueryForm samplePrompts={SAMPLE_PROMPTS} />
      </section>

      <footer className="w-full max-w-3xl mt-20 pb-4">
        <div className="border-t border-black/5 dark:border-white/10 pt-6 text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed space-y-1.5">
          <p>
            A hackathon prototype, not an official ANU service. Verify outcomes
            via{" "}
            <a
              href="https://my.anu.edu.au"
              className="underline-offset-2 hover:underline hover:text-neutral-800 dark:hover:text-neutral-200"
              target="_blank"
              rel="noreferrer"
            >
              my.anu.edu.au
            </a>{" "}
            and{" "}
            <a
              href="https://policies.anu.edu.au"
              className="underline-offset-2 hover:underline hover:text-neutral-800 dark:hover:text-neutral-200"
              target="_blank"
              rel="noreferrer"
            >
              policies.anu.edu.au
            </a>
            .
          </p>
          <p>
            For immediate danger,{" "}
            <a
              href="tel:000"
              className="font-medium text-neutral-800 dark:text-neutral-200 underline-offset-2 hover:underline"
            >
              call 000
            </a>
            . Lifeline (24/7):{" "}
            <a
              href="tel:131114"
              className="font-medium text-neutral-800 dark:text-neutral-200 underline-offset-2 hover:underline"
            >
              13 11 14
            </a>
            .
          </p>
        </div>
      </footer>
    </main>
  );
}
