interface Props {
  onClose: () => void
  onOpenDemo: () => void
}

const features = [
  { icon: '📁', label: 'Open Folder', desc: 'Browse any Claude Code project' },
  { icon: '🔍', label: 'Search  ⌘F', desc: 'Full-text search across all files' },
  { icon: '✓', label: 'Tasks', desc: 'Aggregated checklist from every file' },
  { icon: '⌘P', label: 'Quick switch', desc: 'Jump to any file instantly' },
  { icon: '↑↓', label: 'Navigate', desc: 'Arrow keys move between files' },
  { icon: '/', label: 'Filter', desc: 'Type to filter the sidebar' },
  { icon: '☐', label: 'Checkboxes', desc: 'Click to toggle & save to disk' },
  { icon: '≡', label: 'Outline', desc: 'Heading navigation panel' },
  { icon: '⌘⊞', label: 'Split view', desc: '⌘+click a file to split' },
  { icon: '⌃C', label: 'Copy', desc: 'Copy file content to clipboard' },
  { icon: '~tk', label: 'Tokens', desc: 'Estimated token count in status bar' },
  { icon: '☀🌙', label: 'Theme', desc: 'Toggle light / dark mode' },
]

export default function Onboarding({ onClose, onOpenDemo }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="px-8 pt-8 pb-5 border-b border-gray-100 dark:border-gray-800 text-center">
          <div className="text-4xl mb-3">📂</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">ClaudeView</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            The missing UI for your Claude Code projects
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
            By <span className="font-medium text-gray-600 dark:text-gray-300">Bashir Bandi</span>
            {' · '}
            Pay what you can to support future updates
          </p>
        </div>

        {/* Features grid */}
        <div className="px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
            What you can do
          </p>
          <div className="grid grid-cols-2 gap-2">
            {features.map(f => (
              <div
                key={f.label}
                className="flex items-start gap-2.5 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800"
              >
                <span className="text-lg leading-none flex-shrink-0 mt-0.5 w-6 text-center">{f.icon}</span>
                <div>
                  <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">{f.label}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 leading-snug">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-7 flex gap-3">
          <button
            onClick={onOpenDemo}
            className="flex-1 py-2.5 text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Try Demo Project
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  )
}
