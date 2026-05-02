# ANU Compass

> A focused tool for ANU students. Describe a real situation in plain language, get a structured action plan grounded in ANU policy, on-campus services, and lived experience from r/anu — with fallbacks for when the main path is blocked.

Built for the **ANU AI Buildathon** (AIMSOC × ANUEC) — *Tool for Students* track, *Confused Student* focus area.

## Why it's not a chatbot

A generic LLM can produce sympathetic-sounding advice. It can't tell you that the ANU Medical Centre closes at 17:00, that your Special Consideration form goes through eForms (not the convener), that r/anu users repeatedly warn against retroactive applications, or that ANUSA Student Assistance is the right first call after a misconduct report.

ANU Compass grounds every recommendation in three sources:

1. **Official policy corpus** — hand-curated markdown summaries of ANU rules and processes (`data/policy_corpus/`).
2. **Service contacts** — phone, email, hours, location for on- and off-campus services (`data/contacts.json`).
3. **Lived experience** — live r/anu search via the public JSON API, with a curated snapshot fallback (`data/reddit_snapshot.json`).

Every answer is a **structured plan** rendered as cards: main steps, required documents, contacts with hours, fallbacks ("if X is closed, then Y"), community tips, an email template, warnings, and verification links.

## Architecture

```
   user question
        │
        ▼
  /api/ask  ──►  agent loop (Claude with tools)
                   ├─ list_policy_topics()
                   ├─ read_policy(slug)
                   ├─ find_contacts({category|search})
                   └─ search_reddit(query)   ← live, with snapshot fallback
                          │
                          ▼
                  structured JSON
                          │
                          ▼
                    AnswerCard UI
```

No vector DB. The policy corpus is small enough that the LLM browses it via a TOC index — more accurate at this scale and zero embedding infrastructure.

## Run it

```bash
# 1. Set your DeepSeek API key
cp .env.local.example .env.local
# edit .env.local and paste your key

# 2. Install (already done if you scaffolded with this repo)
npm install

# 3. Dev server
npm run dev
# open http://localhost:3000
```

### Environment

| Variable             | Required | Default                            | Notes                                                                  |
| -------------------- | -------- | ---------------------------------- | ---------------------------------------------------------------------- |
| `DEEPSEEK_API_KEY`   | yes      | —                                  | Get one at https://platform.deepseek.com                               |
| `DEEPSEEK_MODEL`     | no       | `deepseek-v4-flash`                | Override to `deepseek-v4-pro` for higher quality at higher cost.       |
| `DEEPSEEK_BASE_URL`  | no       | `https://api.deepseek.com/v1`      | OpenAI-compatible endpoint; override only for non-default deployments. |

The agent uses the `openai` npm package configured against DeepSeek's OpenAI-compatible API. Swap to a different provider by changing `DEEPSEEK_BASE_URL` and `DEEPSEEK_MODEL`.

## Project layout

```
anu-compass/
├── app/
│   ├── api/ask/route.ts        # POST endpoint — runs the agent
│   ├── layout.tsx
│   ├── page.tsx                # main UI
│   └── globals.css
├── components/
│   ├── QueryForm.tsx           # input + sample prompts + loading state
│   └── AnswerCard.tsx          # structured answer rendering
├── lib/
│   ├── agent.ts                # Claude tool-use loop
│   ├── tools.ts                # tool definitions + handlers
│   ├── policy-store.ts         # read corpus + contacts from disk
│   ├── reddit.ts               # live Reddit search + snapshot fallback
│   └── types.ts
└── data/
    ├── policy_corpus/
    │   ├── index.json          # TOC the LLM browses first
    │   ├── special_consideration.md
    │   ├── extensions.md
    │   ├── medical_certificate.md
    │   ├── counselling_services.md
    │   ├── health_services.md
    │   ├── academic_integrity.md
    │   ├── access_inclusion.md
    │   ├── financial_support.md
    │   └── course_enrolment.md
    ├── contacts.json
    └── reddit_snapshot.json
```

## Try these prompts

- *"I'm sick with the flu and have a finance final tomorrow morning. What do I do?"*
- *"I've been reported for using ChatGPT on an essay — terrified, what now?"*
- *"Census date is in 5 days and I'm thinking of dropping COMP1140 — what happens?"*
- *"Convener hasn't replied to my extension request and the assignment is due in 4 hours."*
- *"I'm a first-year international student, lonely, can barely sleep — where can I get help?"*

## Honest limitations

- The policy corpus is **hand-summarised** for the buildathon. Phone numbers, hours, and process details may be out of date. Every answer ends with a `verify_with` block pointing to the authoritative source.
- The agent is instructed to refuse impersonating an official ANU authority, but the user-visible disclaimer is also part of the safety net.
- Reddit live search depends on the public JSON API; if it fails (rate limit, network), we fall back to a curated snapshot of representative threads.
- Mental-health crisis questions surface 24/7 lines (Lifeline, 13YARN, 1800RESPECT, 000) before paperwork.

## What we cut for time

- **Email triage** (Gmail / Outlook OAuth): too much OAuth surface area for 10 hours.
- **Daily news push**: requires hosting + cron; can be added later.
- **Vector RAG**: corpus is small enough that the TOC + tool-call pattern is faster and more accurate.
- **Multi-turn conversation**: each query is independent. Easy to add later.

## License

MIT — built as a hackathon prototype, not for production.
