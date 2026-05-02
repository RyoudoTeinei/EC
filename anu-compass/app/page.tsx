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
    <main className="flex-1 flex flex-col items-center px-4 py-10 sm:py-16">
      <header className="w-full max-w-3xl">
        <p className="text-xs uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
          ANU Buildathon · Tool for Students
        </p>
        <h1 className="mt-2 text-4xl font-bold sm:text-5xl">
          ANU Compass
        </h1>
        <p className="mt-3 text-lg text-neutral-600 dark:text-neutral-300">
          Describe what&apos;s going on. Get a structured plan grounded in ANU policy,
          on-campus services, and lived experience from r/anu — with fallbacks
          for when the main path is blocked.
        </p>
      </header>

      <section className="w-full max-w-3xl mt-8">
        <QueryForm samplePrompts={SAMPLE_PROMPTS} />
      </section>

      <footer className="w-full max-w-3xl mt-16 text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
        <p className="font-medium">A few honest notes</p>
        <ul className="mt-2 space-y-1 list-disc list-inside">
          <li>
            This is a hackathon prototype, not an official ANU service. Always
            verify outcomes via{" "}
            <a
              href="https://my.anu.edu.au"
              className="underline hover:text-neutral-700 dark:hover:text-neutral-200"
              target="_blank"
              rel="noreferrer"
            >
              my.anu.edu.au
            </a>{" "}
            and{" "}
            <a
              href="https://policies.anu.edu.au"
              className="underline hover:text-neutral-700 dark:hover:text-neutral-200"
              target="_blank"
              rel="noreferrer"
            >
              policies.anu.edu.au
            </a>
            .
          </li>
          <li>
            For immediate danger, call <strong>000</strong>. Lifeline (24/7) is{" "}
            <strong>13&nbsp;11&nbsp;14</strong>.
          </li>
          <li>
            Contact details, hours, and processes change — treat the output as a
            starting point, not gospel.
          </li>
        </ul>
      </footer>
    </main>
  );
}
