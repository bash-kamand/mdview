function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function formatRelativeTime(ms: number): string {
  const diff = Date.now() - ms
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 30) return `${days}d ago`
  return new Date(ms).toLocaleDateString()
}

interface Props {
  content: string
  fileStats: FileStats | null
}

export default function StatusBar({ content, fileStats }: Props) {
  const chars = content.length
  const words = content.trim() ? content.trim().split(/\s+/).length : 0
  const tokens = Math.round(chars / 4)

  return (
    <div className="flex items-center gap-4 px-4 py-1.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex-shrink-0 overflow-x-auto">
      {/* Funnel: credit + links to LinkedIn / website (bottom-left) */}
      <div className="flex items-center gap-2 text-xs whitespace-nowrap flex-shrink-0">
        <span className="text-gray-400 dark:text-gray-500">Made by</span>
        <button
          onClick={() => window.api.openExternal('https://www.linkedin.com/in/bashirbandi/')}
          className="text-gray-500 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400 font-medium transition-colors"
          title="Bashir Bandi on LinkedIn"
        >
          Bashir Bandi
        </button>
        <span className="text-gray-300 dark:text-gray-700">·</span>
        <button
          onClick={() => window.api.openExternal('https://kamand.co/mdview')}
          className="text-gray-500 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400 font-medium transition-colors"
          title="More tools at kamand.co"
        >
          kamand.co
        </button>
      </div>

      <span className="ml-auto flex items-center gap-4">
        <Stat label="words" value={words.toLocaleString()} />
        <Stat label="chars" value={chars.toLocaleString()} />
        <Stat label="~tokens" value={tokens.toLocaleString()} accent />
        {fileStats && (
          <>
            <Stat label="size" value={formatBytes(fileStats.size)} />
            <Stat label="modified" value={formatRelativeTime(fileStats.mtimeMs)} />
          </>
        )}
      </span>
    </div>
  )
}

function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <span className="flex items-center gap-1 text-xs whitespace-nowrap flex-shrink-0">
      <span className="text-gray-400 dark:text-gray-500">{label}</span>
      <span className={accent ? 'text-blue-500 dark:text-blue-400 font-medium' : 'text-gray-600 dark:text-gray-300'}>
        {value}
      </span>
    </span>
  )
}
