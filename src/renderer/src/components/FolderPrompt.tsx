interface Props {
  onChoose: () => void
  onClose: () => void
}

export default function FolderPrompt({ onChoose, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 p-4">
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-xs font-medium text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          Skip
        </button>

        <div className="px-8 pt-12 pb-7 text-center">
          <svg className="w-14 h-14 mx-auto text-blue-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
          </svg>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-50 tracking-tight">Choose a project folder</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
            Pick any markdown project folder on your Mac and MDView will open it up.
          </p>

          <button
            onClick={onChoose}
            className="btn-glow w-full py-2.5 text-sm mt-6"
          >
            Choose Folder
          </button>
        </div>
      </div>
    </div>
  )
}
