# MDView — Feature Showcase

This file demonstrates every MDView feature. Open the outline panel (≡ in the header) to navigate by heading.

## Navigation

Use `↑↓` arrow keys to move between files in the sidebar. Press `/` to filter file names. Hit `⌘P` for the quick file switcher — type a few letters and press Enter.

### Split View

Hold `⌘` and click any file in the sidebar to open it alongside this one. Both panels scroll independently.

## Search

Press `⌘F` to search across all markdown files in the project. Results show file name, line number, and context. Click any result to jump to that file.

Try searching for: `token`, `memory`, or `checkbox`

## Tasks View

Click the **Tasks** button in the toolbar. MDView shows the `- [ ]` and `- [x]` checkboxes from the file you're currently viewing, with a live progress bar. Click any task to toggle it — the change saves straight to disk.

## Outline Panel

Click the `≡` icon in the panel header (top right of this content area). A navigation panel appears on the right showing all headings. Click any heading to scroll to it instantly.

### This Is a Sub-heading

And this is its content. The outline panel shows H1 through H6.

#### Even Deeper

The outline indents by heading level.

## Syntax Highlighting

```typescript
interface FileEntry {
  name: string
  path: string
  relativePath: string
}

async function loadFile(file: FileEntry): Promise<string> {
  const content = await window.api.readFile(file.path)
  return content
}
```

```python
def estimate_tokens(text: str) -> int:
    """Rough estimate: ~4 characters per token."""
    return len(text) // 4
```

## Tables

| Feature | How to Use | Persisted |
|---------|-----------|-----------|
| Sidebar width | Drag the resize handle | ✓ |
| Font size | `−` / `+` in panel header | ✓ |
| Theme | Sun/moon toggle in toolbar | ✓ |
| Last folder | Automatic on close | ✓ |
| Recent folders | Toolbar dropdown | ✓ |

## Interactive Checkboxes

These checkboxes are live — click them and the file updates on disk:

- [ ] This task is pending
- [x] This task is done
- [ ] Toggle me

## Token Awareness

Check the status bar at the bottom of this panel. It shows:

- **words** — word count
- **chars** — character count
- **~tokens** — approximate token count (chars ÷ 4)
- **size** — file size on disk
- **modified** — how long ago the file was last changed

For reference, modern LLMs have context windows of roughly 200,000 tokens. A 1KB markdown file is ~250 tokens.
