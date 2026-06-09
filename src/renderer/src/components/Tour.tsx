import { useState, useEffect, useRef } from 'react'

interface TourStep {
  selector: string
  title: string
  body: string
  placement: 'bottom' | 'right' | 'top' | 'left'
  /** Hint that clicking the highlighted element is the expected action */
  action?: string
}

const STEPS: TourStep[] = [
  {
    selector: '[data-tour="open-folder"]',
    title: 'Open a project',
    body: 'This button opens any project folder. We’ve loaded a demo project so you can explore — you’ll pick your own at the end.',
    placement: 'bottom'
  },
  {
    selector: '[data-tour="sidebar"]',
    title: 'Your files',
    body: 'Every CLAUDE.md, slash command, memory file and doc lands here. Click one of the demo files to read it.',
    placement: 'right',
    action: 'Click a file'
  },
  {
    selector: '[data-tour="search"]',
    title: 'Search everything',
    body: 'Full-text search across every file in the project. Click it to try — shortcut ⌘F.',
    placement: 'bottom',
    action: 'Click Search'
  },
  {
    selector: '[data-tour="tasks"]',
    title: 'Track tasks',
    body: 'Files with tasks show a ✓ badge in the sidebar — we\'ve switched to one. Tick a checkbox and MDView writes it straight back to the file.',
    placement: 'bottom',
    action: 'Click Tasks'
  },
  {
    selector: '[data-tour="theme"]',
    title: 'Light or dark',
    body: 'Switch the theme whenever you like. That’s the tour — hit Finish and we’ll help you pick a project folder.',
    placement: 'bottom',
    action: 'Click to toggle theme'
  }
]

interface Rect { top: number; left: number; width: number; height: number }

const PAD = 6

export default function Tour({ onClose, onFinish, onStepChange }: { onClose: () => void; onFinish: () => void; onStepChange?: (step: number) => void }) {
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)
  const current = STEPS[step]
  const isLast = step === STEPS.length - 1
  const targetRef = useRef<Element | null>(null)

  const next = () => {
    if (isLast) { onFinish(); return }
    const next = step + 1
    setStep(next)
    onStepChange?.(next)
  }
  const prev = () => {
    const prev = Math.max(0, step - 1)
    setStep(prev)
    onStepChange?.(prev)
  }

  // Glue the spotlight to the live element position (re-measure each frame so it
  // tracks layout changes, e.g. the sidebar populating after a folder opens).
  useEffect(() => {
    let raf = 0
    const measure = () => {
      const el = document.querySelector(current.selector)
      targetRef.current = el
      if (el) {
        const r = el.getBoundingClientRect()
        setRect(prevR => {
          if (prevR && prevR.top === r.top && prevR.left === r.left &&
              prevR.width === r.width && prevR.height === r.height) return prevR
          return { top: r.top, left: r.left, width: r.width, height: r.height }
        })
      } else {
        setRect(null)
      }
      raf = requestAnimationFrame(measure)
    }
    raf = requestAnimationFrame(measure)
    return () => cancelAnimationFrame(raf)
  }, [current.selector])

  // Advance when the user actually clicks the highlighted element.
  useEffect(() => {
    const el = document.querySelector(current.selector)
    if (!el) return
    const handler = () => { setTimeout(() => next(), 250) }
    el.addEventListener('click', handler)
    return () => el.removeEventListener('click', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, current.selector])

  // Esc skips the tour
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  const counter = `${step + 1} of ${STEPS.length}`

  // Tooltip position relative to the target, clamped to the viewport
  const tooltip = (() => {
    if (!rect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' as const }
    const gap = 14
    const TW = 288 // tooltip width (w-72)
    const clampLeft = (l: number) => Math.min(Math.max(8, l), window.innerWidth - TW - 8)
    const clampTop = (t: number) => Math.max(8, t)
    switch (current.placement) {
      case 'right':
        return { top: clampTop(rect.top), left: clampLeft(rect.left + rect.width + gap) }
      case 'top':
        return { top: rect.top - gap, left: clampLeft(rect.left), transform: 'translateY(-100%)' as const }
      case 'left':
        return { top: clampTop(rect.top), left: rect.left - gap, transform: 'translateX(-100%)' as const }
      default: // bottom
        return { top: clampTop(rect.top + rect.height + gap), left: clampLeft(rect.left) }
    }
  })()

  return (
    <div className="fixed inset-0 z-[60] pointer-events-none">
      {/* Dimmed backdrop with a hole around the target (4 strips keep the target clickable) */}
      {rect ? (
        <>
          <div className="absolute left-0 right-0 top-0 bg-black/60 pointer-events-auto" style={{ height: Math.max(0, rect.top - PAD) }} />
          <div className="absolute left-0 right-0 bottom-0 bg-black/60 pointer-events-auto" style={{ top: rect.top + rect.height + PAD }} />
          <div className="absolute bg-black/60 pointer-events-auto" style={{ top: rect.top - PAD, left: 0, width: Math.max(0, rect.left - PAD), height: rect.height + PAD * 2 }} />
          <div className="absolute bg-black/60 pointer-events-auto" style={{ top: rect.top - PAD, left: rect.left + rect.width + PAD, right: 0, height: rect.height + PAD * 2 }} />
          {/* Highlight ring */}
          <div
            className="absolute rounded-lg ring-2 ring-blue-400 pointer-events-none transition-all duration-200"
            style={{
              top: rect.top - PAD,
              left: rect.left - PAD,
              width: rect.width + PAD * 2,
              height: rect.height + PAD * 2,
              boxShadow: '0 0 0 9999px rgba(0,0,0,0)'
            }}
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-black/60" />
      )}

      {/* Tooltip / callout */}
      <div
        className="absolute w-72 max-w-[80vw] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 pointer-events-auto"
        style={tooltip}
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-500">{counter}</span>
          <button onClick={onClose} className="text-xs font-medium text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
            Skip tour
          </button>
        </div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-50 mb-1">{current.title}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">{current.body}</p>
        {current.action && (
          <div className="flex items-center gap-1.5 mb-3 text-[11px] font-medium text-blue-600 dark:text-blue-400">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
            {current.action}
          </div>
        )}
        <div className="flex items-center gap-2">
          {step > 0 && (
            <button onClick={prev} className="btn-secondary px-3 py-1.5 text-xs">Back</button>
          )}
          <button onClick={next} className="btn-glow flex-1 py-1.5 text-xs">
            {isLast ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
