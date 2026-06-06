import { describe, it, expect } from 'vitest'

// ── toggleNthCheckbox ─────────────────────────────────────────────────────────
// Copied verbatim from App.tsx and TasksView.tsx (both identical)

function toggleNthCheckbox(content: string, targetIndex: number): string {
  let count = -1
  return content.replace(/^(\s*- \[)([ xX])(\])/gm, (match, before, state, after) => {
    count++
    if (count !== targetIndex) return match
    return `${before}${state.trim() === '' ? 'x' : ' '}${after}`
  })
}

describe('toggleNthCheckbox', () => {
  const doc = `- [ ] alpha\n- [x] beta\n- [ ] gamma`

  it('checks an unchecked box', () => {
    expect(toggleNthCheckbox(doc, 0)).toBe(`- [x] alpha\n- [x] beta\n- [ ] gamma`)
  })

  it('unchecks a checked box', () => {
    expect(toggleNthCheckbox(doc, 1)).toBe(`- [ ] alpha\n- [ ] beta\n- [ ] gamma`)
  })

  it('toggles last checkbox', () => {
    expect(toggleNthCheckbox(doc, 2)).toBe(`- [ ] alpha\n- [x] beta\n- [x] gamma`)
  })

  it('leaves out-of-range index unchanged', () => {
    expect(toggleNthCheckbox(doc, 99)).toBe(doc)
  })

  it('handles uppercase X as checked', () => {
    const src = `- [X] item`
    expect(toggleNthCheckbox(src, 0)).toBe(`- [ ] item`)
  })

  it('handles indented checkboxes', () => {
    const src = `  - [ ] indented`
    expect(toggleNthCheckbox(src, 0)).toBe(`  - [x] indented`)
  })

  it('does not match non-checkbox list items', () => {
    const src = `- plain item\n- [ ] real task`
    expect(toggleNthCheckbox(src, 0)).toBe(`- plain item\n- [x] real task`)
  })

  it('empty string returns empty string', () => {
    expect(toggleNthCheckbox('', 0)).toBe('')
  })

  it('index 0 only touches first checkbox when multiple exist', () => {
    const src = `- [ ] one\n- [ ] two\n- [ ] three`
    const result = toggleNthCheckbox(src, 0)
    expect(result).toBe(`- [x] one\n- [ ] two\n- [ ] three`)
  })
})

// ── parseTasks ────────────────────────────────────────────────────────────────
// Copied from TasksView.tsx

interface Task {
  text: string
  done: boolean
  lineNumber: number
}

function parseTasks(content: string): Task[] {
  const tasks: Task[] = []
  content.split('\n').forEach((line, idx) => {
    const m = line.match(/^(\s*)-\s+\[([ xX])\]\s+(.+)/)
    if (m) {
      tasks.push({ text: m[3].trim(), done: m[2].toLowerCase() === 'x', lineNumber: idx + 1 })
    }
  })
  return tasks
}

describe('parseTasks', () => {
  it('parses unchecked task', () => {
    const tasks = parseTasks('- [ ] do something')
    expect(tasks).toHaveLength(1)
    expect(tasks[0]).toEqual({ text: 'do something', done: false, lineNumber: 1 })
  })

  it('parses checked task (lowercase x)', () => {
    const tasks = parseTasks('- [x] done thing')
    expect(tasks[0].done).toBe(true)
    expect(tasks[0].text).toBe('done thing')
  })

  it('parses checked task (uppercase X)', () => {
    const tasks = parseTasks('- [X] Done thing')
    expect(tasks[0].done).toBe(true)
  })

  it('ignores non-task list items', () => {
    expect(parseTasks('- plain item')).toHaveLength(0)
    expect(parseTasks('just text')).toHaveLength(0)
  })

  it('returns correct line numbers (1-based)', () => {
    const content = `line one\n- [ ] task a\nline three\n- [x] task b`
    const tasks = parseTasks(content)
    expect(tasks[0].lineNumber).toBe(2)
    expect(tasks[1].lineNumber).toBe(4)
  })

  it('handles indented tasks', () => {
    const tasks = parseTasks('  - [ ] indented task')
    expect(tasks).toHaveLength(1)
    expect(tasks[0].text).toBe('indented task')
  })

  it('returns empty array for empty string', () => {
    expect(parseTasks('')).toHaveLength(0)
  })

  it('returns tasks in order from multi-task document', () => {
    const content = `- [ ] first\n- [x] second\n- [ ] third`
    const tasks = parseTasks(content)
    expect(tasks.map(t => t.text)).toEqual(['first', 'second', 'third'])
    expect(tasks.map(t => t.done)).toEqual([false, true, false])
  })
})

// ── extractFrontmatterType ────────────────────────────────────────────────────
// Copied from App.tsx

function extractFrontmatterType(content: string): string | null {
  const m = content.match(/^---\s*\n([\s\S]*?)\n---/)
  if (!m) return null
  const t = m[1].match(/^type:\s*(.+)$/m)
  return t ? t[1].trim() : null
}

describe('extractFrontmatterType', () => {
  it('returns type from valid frontmatter', () => {
    const content = `---\nname: test\ntype: user\n---\nBody`
    expect(extractFrontmatterType(content)).toBe('user')
  })

  it('returns null when no frontmatter', () => {
    expect(extractFrontmatterType('Just body text')).toBeNull()
  })

  it('returns null when frontmatter has no type field', () => {
    const content = `---\nname: test\n---\nBody`
    expect(extractFrontmatterType(content)).toBeNull()
  })

  it('trims whitespace from type value', () => {
    const content = `---\ntype:   feedback  \n---`
    expect(extractFrontmatterType(content)).toBe('feedback')
  })

  it('handles empty content', () => {
    expect(extractFrontmatterType('')).toBeNull()
  })

  it('handles all known memory types', () => {
    for (const type of ['user', 'feedback', 'project', 'reference']) {
      const content = `---\ntype: ${type}\n---\nBody`
      expect(extractFrontmatterType(content)).toBe(type)
    }
  })
})

// ── parseHeadings ─────────────────────────────────────────────────────────────
// Copied from OutlinePanel.tsx

interface Heading {
  level: number
  text: string
  id: string
}

function parseHeadings(content: string): Heading[] {
  return content
    .split('\n')
    .filter(line => /^#{1,6} /.test(line))
    .map(line => {
      const m = line.match(/^(#{1,6}) (.+)/)!
      const text = m[2].replace(/\*\*|__|\*|_|`/g, '').trim()
      const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
      return { level: m[1].length, text, id }
    })
}

describe('parseHeadings', () => {
  it('parses h1 through h6', () => {
    const content = `# One\n## Two\n### Three\n#### Four\n##### Five\n###### Six`
    const headings = parseHeadings(content)
    expect(headings.map(h => h.level)).toEqual([1, 2, 3, 4, 5, 6])
    expect(headings.map(h => h.text)).toEqual(['One', 'Two', 'Three', 'Four', 'Five', 'Six'])
  })

  it('ignores lines that are not headings', () => {
    const content = `#not-a-heading\n## Real Heading\nplain text`
    const headings = parseHeadings(content)
    expect(headings).toHaveLength(1)
    expect(headings[0].text).toBe('Real Heading')
  })

  it('strips markdown formatting from heading text', () => {
    const content = `## **Bold** and _italic_ and \`code\``
    const [h] = parseHeadings(content)
    expect(h.text).toBe('Bold and italic and code')
  })

  it('generates correct slug id', () => {
    const content = `## Hello World`
    expect(parseHeadings(content)[0].id).toBe('hello-world')
  })

  it('collapses multiple spaces into single dash in id', () => {
    const content = `## A   B`
    expect(parseHeadings(content)[0].id).toBe('a-b')
  })

  it('returns empty array for content with no headings', () => {
    expect(parseHeadings('just a paragraph')).toHaveLength(0)
  })

  it('returns empty array for empty string', () => {
    expect(parseHeadings('')).toHaveLength(0)
  })
})

// ── compareVersions ───────────────────────────────────────────────────────────
// Copied from main/index.ts

function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) > (pb[i] ?? 0)) return 1
    if ((pa[i] ?? 0) < (pb[i] ?? 0)) return -1
  }
  return 0
}

describe('compareVersions', () => {
  it('returns 0 for equal versions', () => {
    expect(compareVersions('1.0.0', '1.0.0')).toBe(0)
  })

  it('detects newer major version', () => {
    expect(compareVersions('2.0.0', '1.9.9')).toBe(1)
    expect(compareVersions('1.9.9', '2.0.0')).toBe(-1)
  })

  it('detects newer minor version', () => {
    expect(compareVersions('1.2.0', '1.1.9')).toBe(1)
    expect(compareVersions('1.1.9', '1.2.0')).toBe(-1)
  })

  it('detects newer patch version', () => {
    expect(compareVersions('1.0.2', '1.0.1')).toBe(1)
    expect(compareVersions('1.0.1', '1.0.2')).toBe(-1)
  })

  it('handles version without patch segment', () => {
    expect(compareVersions('1.1', '1.0')).toBe(1)
    expect(compareVersions('1.0', '1.1')).toBe(-1)
  })

  it('update checker scenario: latest > current returns positive', () => {
    expect(compareVersions('1.1.0', '1.0.0')).toBeGreaterThan(0)
  })

  it('update checker scenario: same version returns 0 (no update shown)', () => {
    expect(compareVersions('1.0.0', '1.0.0')).toBe(0)
  })
})

// ── formatBytes ───────────────────────────────────────────────────────────────
// Copied from StatusBar.tsx

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

describe('formatBytes', () => {
  it('formats bytes', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(1023)).toBe('1023 B')
  })

  it('formats kilobytes', () => {
    expect(formatBytes(1024)).toBe('1.0 KB')
    expect(formatBytes(1536)).toBe('1.5 KB')
    expect(formatBytes(1024 * 1024 - 1)).toBe('1024.0 KB')
  })

  it('formats megabytes', () => {
    expect(formatBytes(1024 * 1024)).toBe('1.0 MB')
    expect(formatBytes(1024 * 1024 * 2.5)).toBe('2.5 MB')
  })
})

// ── StatusBar token estimation ─────────────────────────────────────────────────

describe('token estimation (chars / 4)', () => {
  it('estimates tokens as chars divided by 4', () => {
    const content = 'a'.repeat(400)
    const tokens = Math.round(content.length / 4)
    expect(tokens).toBe(100)
  })

  it('returns 0 tokens for empty content', () => {
    expect(Math.round(''.length / 4)).toBe(0)
  })
})

// ── sidebar filter logic ───────────────────────────────────────────────────────

function applyFilter(files: { name: string; relativePath: string }[], filter: string) {
  return filter
    ? files.filter(f =>
        f.name.toLowerCase().includes(filter.toLowerCase()) ||
        f.relativePath.toLowerCase().includes(filter.toLowerCase())
      )
    : files
}

describe('sidebar filter', () => {
  const files = [
    { name: 'CLAUDE.md', relativePath: 'CLAUDE.md' },
    { name: 'deploy.md', relativePath: '.claude/commands/deploy.md' },
    { name: 'user_role.md', relativePath: '.claude/memory/user_role.md' },
  ]

  it('returns all files when filter is empty', () => {
    expect(applyFilter(files, '')).toHaveLength(3)
  })

  it('matches by filename or path containing the query', () => {
    // all 3 files contain "claude" — CLAUDE.md by name, the other two via .claude/ in their path
    expect(applyFilter(files, 'claude')).toHaveLength(3)
    expect(applyFilter(files, 'CLAUDE.md')).toHaveLength(1)
  })

  it('matches by relativePath', () => {
    expect(applyFilter(files, 'commands')).toHaveLength(1)
    expect(applyFilter(files, 'memory')).toHaveLength(1)
  })

  it('returns empty array for no match', () => {
    expect(applyFilter(files, 'zzznomatch')).toHaveLength(0)
  })

  it('is case-insensitive', () => {
    expect(applyFilter(files, 'DEPLOY')).toHaveLength(1)
    expect(applyFilter(files, 'deploy')).toHaveLength(1)
  })
})
