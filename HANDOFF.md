# MDView — Session Handoff

_Last updated: 2026-06-06_

A handoff doc so a fresh Claude Code session can continue where we left off.

## What MDView is
A macOS Electron + React + TypeScript desktop app: a viewer for the markdown files in a
project (CLAUDE.md, `.claude/` commands & memory, tasks, docs). Stack: electron-vite, React 18,
Tailwind, react-markdown. Was originally "ClaudeView", **renamed to MDView** to avoid trademark risk.

- **Repo:** `github.com/bash-kamand/mdview` (PRIVATE). Branch: `main`.
- **Tags:** `v1.0.0` (old), `v2.0.0` (current baseline, points at commit `359ebd2`).
- **Current version in package.json:** `2.0.0`.

## ⚠️ Immediate state: UNCOMMITTED WORK
The "co-think skill" feature is built and tested but **not committed**. Uncommitted files:
```
 M electron-builder.yml          (bundle resources/skills)
 M src/main/index.ts             (app:installSkills / app:skillsInstalled handlers)
 M src/preload/index.ts          (expose installSkills/skillsInstalled)
 M src/renderer/src/App.tsx      (wire SkillsPrompt between tour and folder prompt)
 M src/renderer/src/env.d.ts     (types)
?? resources/skills/             (the bundled skill)
?? src/renderer/src/components/SkillsPrompt.tsx
```
**Next action:** commit + push these. Suggested message: "Add bundled think-in-markdown skill +
onboarding install card". Build is clean, 47/47 tests pass, install verified working.

## Onboarding flow (current)
`Welcome (Start Onboarding / Skip)` → `interactive guided Tour` (spotlights real buttons:
Open Folder → sidebar → Search → Tasks → Theme) → `🧠 Co-think skill card (Install / Skip)`
→ `Choose-folder prompt (Choose Folder → Finder)`.

Components: `Onboarding.tsx`, `Tour.tsx`, `SkillsPrompt.tsx`, `FolderPrompt.tsx`. Wired in
`App.tsx` via states `showOnboarding`, `tourActive`, `showSkillsPrompt`, `showFolderPrompt`.
On start, the demo project loads so the tour has real content.

## The co-think skill (this session's feature)
- Bundled at `resources/skills/think-in-markdown/SKILL.md`; shipped via `electron-builder.yml`
  `extraResources` (`resources/skills` → `skills`).
- `app:installSkills` (src/main/index.ts) `cpSync`s it into `~/.claude/skills/` (global; merges,
  never clears existing skills). Mirrors the proven `app:getDemoPath` pattern.
- The skill tells Claude Code to write its reasoning/plan/progress into a **visible `thinking/`
  folder** (NOT a dot-folder — MDView's `walkMd` scanner skips dotdirs except `.claude`).
- Verified installed this session: `~/.claude/skills/think-in-markdown/SKILL.md`.

## This session's accomplishments (all done)
1. Added Vitest suite — **47 tests** for all pure logic (`src/tests/logic.test.ts`).
2. Bug fixes: clickable breadcrumb path; hide `<!-- HTML comments -->` in render; outline panel
   on by default (persisted); Tasks view scoped to current file (was aggregating all files);
   purple-gradient hover on primary buttons; uniform button shape; light-mode default on first run.
3. Fixed `readStore` dropping `hasSeenOnboarding`/`showOutline` on read (would've shown onboarding
   every launch in prod).
4. Fixed demo path resolution (dev + packaged) + copy demo to a writable location so demo
   checkboxes save.
5. Set app name to **MDView** (`app.setName`) so userData paths read correctly.
6. **Renamed ClaudeView → MDView** everywhere (app, build config, repo, demo content); softened
   "Claude Code project" → neutral wording. Kept literal `CLAUDE.md` / `.claude/` (the app reads them).
7. Interactive guided onboarding tour + folder prompt + co-think skill install card.
8. Built DMG: `dist/MDView-2.0.0.dmg` (174MB universal, **unsigned**).

## Known issues / decisions
- **Unsigned DMG:** Gatekeeper warns "can't be opened". Workaround: right-click → Open. Proper fix
  = Apple Developer ID cert + notarization (not set up).
- **Repo stays PRIVATE** (user's choice). So in-app update checker (`app:checkForUpdate` hitting
  `api.github.com/repos/bash-kamand/mdview/releases/latest`) won't work for end users until public.
- **Not published online** — user chose "keep local DMG only" for v2.0.0.
- **Shared userData gotcha:** dev runs and the installed app share `~/Library/Application Support/MDView/`.
  Testing can set `hasSeenOnboarding:true` and suppress onboarding in the installed app. To force a
  true first-run: `rm -rf ~/Library/Application\ Support/MDView`.
- **Tag vs build:** `v2.0.0` tag predates the rename + skill work. If releasing, move the tag to the
  latest commit or bump version.

## Possible next steps (not started)
- Commit + push the skill feature (see above).
- Decide publishing: private GitHub release / make public / keep local.
- Code signing + notarization for a friction-free install.
- Optional: a way to (re)install skills outside onboarding (toolbar/menu), since onboarding shows once.

## Commands
```bash
npm run build       # electron-vite build → out/
npm test            # vitest (47 tests)
npx electron out/main/index.js   # run the built app (dev)
npm run package     # build DMG (set CSC_IDENTITY_AUTO_DISCOVERY=false to skip signing)
# Force fresh onboarding:
rm -rf ~/Library/Application\ Support/MDView
```

## Key files map
- Main process / IPC / file ops / update check: `src/main/index.ts`
- Preload bridge: `src/preload/index.ts`; types: `src/renderer/src/env.d.ts`
- App shell + onboarding wiring + keyboard shortcuts: `src/renderer/src/App.tsx`
- Components: `Sidebar`, `MarkdownPanel`, `OutlinePanel`, `TasksView`, `SearchView`,
  `QuickSwitcher`, `Onboarding`, `Tour`, `SkillsPrompt`, `FolderPrompt`, `StatusBar`
- Styles (button classes `.btn-glow`/`.btn-glow-tool`/`.btn-secondary`): `src/renderer/src/index.css`
- Bundled demo: `resources/demo/`; bundled skill: `resources/skills/`
- Build config: `electron-builder.yml`; spec: `mdview-spec.md`
- Plan for the skill feature: `~/.claude/plans/do-you-ghet-what-purring-orbit.md`
