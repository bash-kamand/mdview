---
name: think-in-markdown
description: >-
  Externalize your reasoning, plans, and progress into markdown files in a visible
  `thinking/` folder so the user can follow along live in a markdown viewer (MDView).
  Use when the user asks you to "think out loud", "co-think", work a problem through
  together, plan in markdown, or keep a visible running log of your reasoning and progress.
---

# Think in Markdown

When this skill is active, treat markdown files as a shared thinking space with the user.
They are watching these files update live in MDView, so write your thinking down as you go.

## Where to write
- Create a visible `thinking/` directory at the project root. Never use a dot-folder
  (e.g. `.thinking/`) — hidden folders are not shown in the viewer.
- One file per task or topic: `thinking/<short-kebab-topic>.md`.

## What each file contains
Keep it skimmable, and update it as you work — don't wait until the end:

- `# <Topic>` — a clear title
- **Goal** — one or two lines on what we're trying to do
- **Options / reasoning** — the approaches you're weighing and why, as you consider them
- **Plan** — the chosen steps as a checklist (`- [ ]`); tick them off (`- [x]`) as you finish
- **Progress log** — short, ordered notes as things happen, change, or get decided

## How to behave
- Write your thinking here *first*, then act — so the user sees your reasoning before the change.
- Update the file whenever the plan changes; don't let it go stale.
- Link related files with relative paths or `[[name]]`-style references.
- Keep prose tight. This is a working surface, not a final report.
- When a task is done, leave the file as an accurate record (checklist complete, log closed).
