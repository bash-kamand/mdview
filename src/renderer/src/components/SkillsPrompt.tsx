import { useState } from 'react'

interface Props {
  onClose: () => void
}

export default function SkillsPrompt({ onClose }: Props) {
  const [status, setStatus] = useState<'idle' | 'installing' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')

  const install = async () => {
    setStatus('installing')
    const res = await window.api.installSkills()
    if (res.ok) {
      window.api.setSetting('hasInstalledSkills', true)
      setStatus('done')
    } else {
      setError(res.error ?? 'Something went wrong')
      setStatus('error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 p-4">
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-xs font-medium text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          Skip
        </button>

        <div className="px-8 pt-12 pb-7 text-center">
          <div className="text-5xl mb-4">🧠</div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-50 tracking-tight">
            Co-think with Claude Code
          </h1>

          {status !== 'done' ? (
            <>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                Install a small Claude Code skill that makes Claude write its reasoning, plans
                and progress into markdown files as it works — so you can watch it think live,
                right here in MDView.
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
                Installs to <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">~/.claude/skills/</code> — available in every project.
              </p>

              {status === 'error' && (
                <p className="text-xs text-red-500 mt-3 break-words">{error}</p>
              )}

              <button
                onClick={install}
                disabled={status === 'installing'}
                className="btn-glow w-full py-2.5 text-sm mt-6 disabled:opacity-60"
              >
                {status === 'installing' ? 'Installing…' : status === 'error' ? 'Try again' : 'Install Skill'}
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                Installed! Restart your Claude Code session to pick it up, then ask Claude to
                <span className="font-medium text-gray-700 dark:text-gray-200"> “think out loud in markdown”</span> and watch the <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">thinking/</code> folder fill up.
              </p>
              <button onClick={onClose} className="btn-glow w-full py-2.5 text-sm mt-6">
                Continue
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
