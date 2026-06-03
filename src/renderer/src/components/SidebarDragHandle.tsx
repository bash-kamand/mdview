import { useEffect, useRef } from 'react'

interface Props {
  width: number
  onResize: (w: number) => void
}

export default function SidebarDragHandle({ width, onResize }: Props) {
  const dragging = useRef(false)
  const startX = useRef(0)
  const startW = useRef(0)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return
      const delta = e.clientX - startX.current
      const clamped = Math.min(480, Math.max(160, startW.current + delta))
      onResize(clamped)
    }
    const onUp = () => { dragging.current = false }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [onResize])

  return (
    <div
      onMouseDown={(e) => {
        dragging.current = true
        startX.current = e.clientX
        startW.current = width
      }}
      className="w-1 flex-shrink-0 cursor-col-resize hover:bg-blue-400/40 transition-colors active:bg-blue-500/40"
    />
  )
}
