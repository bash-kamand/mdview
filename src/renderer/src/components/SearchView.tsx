import { useState, useEffect, useRef, useCallback } from 'react'

interface Props {
  currentFolder: string | null
  projectFiles: ProjectFiles | null
  onOpenFile: (file: FileEntry) => void
  onClose: () => void
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark>{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}

export default function SearchView({ currentFolder, projectFiles, onOpenFile, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const search = useCallback(async (q: string) => {
    if (!currentFolder || q.length < 2) { setResults([]); return }
    setLoading(true)
    const r = await window.api.searchFiles(currentFolder, q)
    setResults(r)
    setLoading(false)
  }, [currentFolder])

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => search(query), 300)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [query, search])

  // Group results by file
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.relativePath]) acc[r.relativePath] = []
    acc[r.relativePath].push(r)
    return acc
  }, {})

  const fileEntries = projectFiles
    ? [
        ...(projectFiles.claudeMd ? [projectFiles.claudeMd] : []),
        ...projectFiles.commands,
        ...projectFiles.memory,
        ...projectFiles.other
      ]
    : []

  const getFileEntry = (relativePath: string): FileEntry | undefined =>
    fileEntries.find(f => f.relativePath === relativePath)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search across all files…"
          className="flex-1 bg-transparent text-sm outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
        />
        {loading && (
          <svg className="w-4 h-4 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {results.length > 0 && !loading && (
          <span className="text-xs text-gray-400">{results.length} result{results.length !== 1 ? 's' : ''}</span>
        )}
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded transition-colors"
          title="Close (Esc)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {!currentFolder && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-400">Open a folder first</p>
          </div>
        )}
        {currentFolder && !query && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-400">Type at least 2 characters to search</p>
          </div>
        )}
        {currentFolder && query.length >= 2 && !loading && results.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-400">No results for "{query}"</p>
          </div>
        )}
        {Object.entries(grouped).map(([relPath, fileResults]) => {
          const fileEntry = getFileEntry(relPath)
          return (
            <div key={relPath} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
              <button
                onClick={() => fileEntry && onOpenFile(fileEntry)}
                className="w-full flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
              >
                <span className="text-sm">📄</span>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 font-mono">{relPath}</span>
                <span className="ml-auto text-xs text-gray-400">{fileResults.length} match{fileResults.length !== 1 ? 'es' : ''}</span>
              </button>
              {fileResults.map((r, i) => (
                <button
                  key={i}
                  onClick={() => fileEntry && onOpenFile(fileEntry)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-gray-400 font-mono flex-shrink-0 mt-0.5 w-8 text-right">
                      {r.lineNumber}
                    </span>
                    <div className="flex-1 min-w-0">
                      {r.contextBefore && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-mono truncate leading-relaxed">
                          {r.contextBefore}
                        </p>
                      )}
                      <p className="text-xs text-gray-900 dark:text-gray-100 font-mono truncate leading-relaxed">
                        {highlight(r.lineText, query)}
                      </p>
                      {r.contextAfter && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-mono truncate leading-relaxed">
                          {r.contextAfter}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
