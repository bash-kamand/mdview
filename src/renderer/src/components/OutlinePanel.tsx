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

interface Props {
  content: string
}

export default function OutlinePanel({ content }: Props) {
  const headings = parseHeadings(content)

  if (headings.length === 0) {
    return (
      <div className="w-48 flex-shrink-0 border-l border-gray-200 dark:border-gray-700 flex items-center justify-center">
        <p className="text-xs text-gray-400 dark:text-gray-500 px-3 text-center">No headings</p>
      </div>
    )
  }

  const scrollToHeading = (heading: Heading) => {
    const el = document.getElementById(heading.id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      // Fallback: scan all headings by text
      const all = document.querySelectorAll('h1,h2,h3,h4,h5,h6')
      const match = Array.from(all).find(h => h.textContent?.trim() === heading.text)
      match?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const minLevel = Math.min(...headings.map(h => h.level))

  return (
    <div className="w-48 flex-shrink-0 border-l border-gray-200 dark:border-gray-700 overflow-y-auto bg-gray-50/50 dark:bg-gray-900/50">
      <div className="py-2">
        <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Outline
        </p>
        {headings.map((h, i) => (
          <button
            key={i}
            onClick={() => scrollToHeading(h)}
            title={h.text}
            className="w-full text-left px-3 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 transition-colors truncate"
            style={{ paddingLeft: `${(h.level - minLevel) * 10 + 12}px` }}
          >
            {h.text}
          </button>
        ))}
      </div>
    </div>
  )
}
