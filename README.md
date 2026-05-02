# EC — ANU AI Buildathon

Submission for the **ANU AI Buildathon** (AIMSOC × ANUEC), *Tool for Students* track.

## Contents

- [`AI Buildathon.pdf`](./AI%20Buildathon.pdf) — the original theme brief.
- [`anu-compass/`](./anu-compass) — **the project**. A focused tool that takes a real student situation (in plain English or Chinese) and returns a structured action plan grounded in ANU policy, on-campus services, the student newspaper Woroni, and lived experience from r/anu — with explicit fallbacks for when the main path is blocked.

## Quick start

```bash
cd anu-compass
npm install
npm run dev
# open http://localhost:3000
```

Set your DeepSeek or Anthropic API key in the in-app **Settings** dialog (gear icon, top right). The key stays in your browser; it is sent with each request and never logged on the server.

See [`anu-compass/README.md`](./anu-compass/README.md) for full documentation, architecture, and design decisions.
