# Demo Project — ClaudeView

This is a demo Claude Code project. When you're ready, open your own project with **Open Folder**.

## What is ClaudeView?

ClaudeView gives you a live view of all the markdown files Claude Code creates and uses — memory files, slash commands, task lists, and specs — so you can understand your project context at a glance.

## Quick Reference

| Shortcut | Action |
|----------|--------|
| `⌘F` | Search across all files |
| `⌘P` | Quick file switcher |
| `↑↓` | Navigate files with keyboard |
| `/` | Filter sidebar files |
| `⌘+click` | Open file in split view |
| `Esc` | Close any modal / view |

## What Claude Code Creates

| File / Folder | Purpose |
|---------------|---------|
| `CLAUDE.md` | Project brain — always pinned at top |
| `.claude/memory/*.md` | Persistent memory Claude writes across sessions |
| `.claude/commands/*.md` | Your custom slash commands |

## Token Awareness

Watch the **~tokens** counter in the status bar at the bottom. Each file shows an estimate of how many tokens it would consume in Claude's context window.

A tight `CLAUDE.md` is worth more than a detailed one. Keep it focused.

## Try These Now

- Open `tasks.md` → click a checkbox to toggle it (saves to disk)
- Open `README.md` → click the outline icon (≡) to navigate by heading
- Click the **Tasks** button in the toolbar to see all checkboxes aggregated
- Press `⌘F` and search for "token"
- Hold `⌘` and click any file in the sidebar to open a split view
