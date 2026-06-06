interface Props {
  onClose: () => void
  onStartTour: () => void
}

export default function Onboarding({ onClose, onStartTour }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 p-4">
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-8 pt-10 pb-6 text-center">
          <div className="text-5xl mb-4">📂</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">MDView</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
            The missing UI for your markdown projects. Let’s take a quick interactive tour using a demo project — we’ll point out each feature and you click along.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
            By{' '}
            <a
              href="https://www.linkedin.com/in/bashirbandi/"
              onClick={(e) => { e.preventDefault(); window.api.openExternal('https://www.linkedin.com/in/bashirbandi/') }}
              className="font-medium text-blue-500 hover:underline cursor-pointer"
            >
              Bashir Bandi
            </a>
            {' · '}Pay what you can to support future updates
          </p>
        </div>

        {/* Actions — Start Onboarding or Skip */}
        <div className="px-6 pb-6 flex items-center gap-3">
          <button onClick={onClose} className="btn-secondary flex-1 py-2.5 text-sm">
            Skip
          </button>
          <button onClick={onStartTour} className="btn-glow flex-1 py-2.5 text-sm">
            Start Onboarding
          </button>
        </div>
      </div>
    </div>
  )
}
