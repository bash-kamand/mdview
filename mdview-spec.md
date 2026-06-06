# MDView — App Spec

## Overview

A lightweight macOS desktop app for browsing and reading the markdown files that Claude Code generates and uses. Purpose-built for the Claude Code workflow — not a generic markdown editor.

**UVP:** The missing UI for your Claude Code project. Understand your context files at a glance.

---

## Tech Stack

- **Framework:** Electron + React
- **Markdown rendering:** react-markdown + remark-gfm
- **Styling:** Tailwind CSS
- **File system:** Node.js fs + chokidar (file watching)
- **Packaging:** electron-builder → .dmg for Mac

---

## Claude Code Project Structure (What the App Understands)

```
project/
├── CLAUDE.md              # Main project brain — pinned at top
├── .claude/
│   ├── commands/          # Slash commands (.md files)
│   ├── memory/            # Persistent memory files
│   └── settings.json      # (ignored, not MD)
├── tasks/                 # Task lists (common pattern)
├── specs/                 # Spec files (common pattern)
├── docs/                  # Documentation
└── *.md                   # Any other MD files at root
```

---

## UI Layout

```
┌─────────────────────────────────────────────────┐
│  Toolbar: [Open Folder]  /path/to/project        │
├───────────────┬─────────────────────────────────┤
│               │                                  │
│   Sidebar     │        Main Panel                │
│               │                                  │
│  📄 CLAUDE.md │   Rendered markdown content      │
│               │   of selected file               │
│  ── Commands ─│                                  │
│  📄 review.md │                                  │
│  📄 build.md  │                                  │
│               │                                  │
│  ── Memory ── │                                  │
│  📄 context.md│                                  │
│               │                                  │
│  ── Other ─── │                                  │
│  📄 README.md │                                  │
│  📄 tasks.md  │                                  │
│               │                                  │
└───────────────┴─────────────────────────────────┘
```

---

## Sidebar Behaviour

- **CLAUDE.md** always pinned at the top, visually distinct
- Sections rendered as collapsible groups:
  - Commands (from `.claude/commands/`)
  - Memory (from `.claude/memory/`)
  - Other MD files (everything else, sorted alphabetically)
- Active file highlighted
- Clicking a file loads it in the main panel instantly
- File names truncated gracefully if long

---

## Main Panel Behaviour

- Full GitHub-flavoured markdown rendering
- Supports: headings, code blocks with syntax highlighting, tables, checkboxes, bold/italic, links
- Scrollable
- No editing — read only
- Checkbox items rendered visually (checked/unchecked) but not interactive

---

## Toolbar

- **Open Folder** button — opens native macOS folder picker
- Current folder path displayed (truncated from left if long)
- Recent folders — last 5 folders accessible from a dropdown

---

## File Watching

- App watches the open folder for changes using chokidar
- If a file is modified externally (e.g. Claude Code updates it), the sidebar refreshes automatically
- If the currently viewed file is modified, the main panel re-renders automatically
- No manual refresh needed

---

## App Behaviour

- Opens to last used folder on launch
- If no folder has been opened before, shows an empty state with an "Open Folder" prompt
- Single window app
- Minimum window size: 800 x 600px
- Default window size: 1200 x 800px
- Sidebar width: 240px, not resizable in v1

---

## Empty / Edge States

| State | Behaviour |
|---|---|
| No folder open | Empty state: "Open a Claude Code project folder to get started" + Open Folder button |
| Folder has no MD files | Message: "No markdown files found in this folder" |
| CLAUDE.md not present | No pinned file — just show grouped sections |
| Empty .claude/commands/ | Commands section hidden |
| Empty .claude/memory/ | Memory section hidden |

---

## Styling

- macOS native feel — follows system light/dark mode
- Light mode: white main panel, light grey sidebar
- Dark mode: dark grey main panel, darker sidebar
- Font: system-ui for UI chrome, monospace for code blocks
- Markdown styles: clean, readable, similar to GitHub rendering

---

## Out of Scope (v1)

- Editing files
- Search across files
- Drag to reorder sidebar
- Multiple folders / tabs
- AI integration
- Windows / Linux support

---

## Future (v2+)

- Full-text search across all MD files in the project
- Checkbox task overview — aggregate all `- [ ]` items across files
- "Copy to clipboard" button for feeding context back into Claude Code
- Recently modified files highlighted
- Support for multiple open projects

---

## Deliverable

- Signed and notarized `.dmg` for macOS (Apple Silicon + Intel universal binary)
- App name: **MDView**
- No App Store in v1 — direct download

---

## Build Instructions for Claude Code

1. Scaffold Electron + React app with Vite
2. Install dependencies: `electron`, `electron-builder`, `react`, `react-markdown`, `remark-gfm`, `rehype-highlight`, `chokidar`, `tailwindcss`
3. Build sidebar component with section grouping logic
4. Build markdown renderer component
5. Wire up folder picker using Electron's `dialog.showOpenDialog`
6. Add chokidar file watcher on selected folder
7. Implement recent folders using Electron's `store` or `localStorage`
8. Apply light/dark mode via `prefers-color-scheme`
9. Package with `electron-builder` targeting macOS universal binary
