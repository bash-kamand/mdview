import { useState, useEffect, useRef } from 'react'

interface Props {
  files: FileEntry[]
  onSelect: (file: FileEntry) => void
  onClose: () => void
}

export default function QuickSwitcher({ files, onSelect, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [highlighted, setHighlighted] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const filtered = query
    ? files.filter(f =>
        f.name.toLowerCase().includes(query.toLowerCase()) ||
        f.relativePath.toLowerCase().includes(query.toLowerCase())
      )
    : files

  useEffect(() => { setHighlighted(0) }, [query])

  const scrollHighlightedIntoView = (idx: number) => {
    const el = listRef.current?.children[idx] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = Math.min(highlighted + 1, filtered.length - 1)
      setHighlighted(next)
      scrollHighlightedIntoView(next)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const next = Math.max(highlighted - 1, 0)
      setHighlighted(next)
      scrollHighlightedIntoView(next)
    } else if (e.key === 'Enter') {
      if (filtered[highlighted]) onSelect(filtered[highlighted])
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/40 dark:bg-black/60"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Jump to file…"
            className="flex-1 bg-transparent text-sm outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
          />
          <kbd className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">esc</kbd>
        </div>

        <div ref={listRef} className="max-h-72 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No files match</p>
          ) : (
            filtered.map((file, i) => (
              <button
                key={file.path}
                onClick={() => onSelect(file)}
                onMouseEnter={() => setHighlighted(i)}
                className={[
                  'w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-colors',
                  i === highlighted
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                ].join(' ')}
              >
                <span className="text-base flex-shrink-0">📄</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{file.name}</div>
                  <div className={`text-xs truncate ${i === highlighted ? 'text-blue-200' : 'text-gray-400'}`}>
                    {file.relativePath}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 flex items-center gap-3 text-xs text-gray-400">
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span className="ml-auto">{filtered.length} files</span>
        </div>
      </div>
    </div>
  )
}
