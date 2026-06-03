---
name: demo-feedback
description: Example feedback memory — how Claude should approach work
metadata:
  type: feedback
---

Keep responses concise. Lead with the result, not the reasoning.

**Why:** User explicitly said "I can read the diff" — skip the trailing summary of what you just changed.

**How to apply:** No multi-paragraph preambles. No "Great question!" openers. Just do the work and report what changed in one sentence.

---

Prefer editing existing files over creating new ones.

**Why:** New files add noise. If suitable code exists, extend it.

**How to apply:** Search for existing utilities before writing new ones. Three similar lines is better than a premature abstraction.
