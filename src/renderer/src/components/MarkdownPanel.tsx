import { useMemo } from 'react'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import type { Components } from 'react-markdown'
import React from 'react'
import StatusBar from './StatusBar'
import OutlinePanel from './OutlinePanel'

interface Props {
  content: string
  selectedFile: FileEntry | null
  hasFolder: boolean
  hasFiles: boolean
  onOpenFolder: () => void
  onOpenExternal: (url: string) => void
  fontSize: number
  onFontSizeChange: (size: number) => void
  showOutline: boolean
  onToggleOutline: () => void
  fileStats: FileStats | null
  onCopyFile: () => void
  onPrintToPDF: () => void
  onCheckboxToggle?: (index: number) => void
  isSplitPanel?: boolean
  onCloseSplit?: () => void
}

function makeHeadingComponent(level: 1 | 2 | 3 | 4 | 5 | 6) {
  return function HeadingComp({ children }: { children?: React.ReactNode }) {
    const text = String(children ?? '')
    const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
    return React.createElement(`h${level}`, { id }, children)
  }
}

function buildComponents(
  onOpenExternal: (url: string) => void,
  onCheckboxToggle?: (index: number) => void
): Components {
  let checkboxIndex = 0
  return {
    a({ href, children }) {
      return (
        <a href={href} onClick={(e) => { e.preventDefault(); if (href) onOpenExternal(href) }} className="cursor-pointer">
          {children}
        </a>
      )
    },
    input({ type, checked, ...props }) {
      if (type === 'checkbox') {
        const idx = checkboxIndex++
        return (
          <input
            type="checkbox"
            checked={checked}
            onChange={() => onCheckboxToggle?.(idx)}
            className={onCheckboxToggle ? 'cursor-pointer' : 'cursor-default'}
            style={onCheckboxToggle ? undefined : { pointerEvents: 'none' }}
            {...props}
          />
        )
      }
      return <input type={type} {...props} />
    },
    pre({ children }) {
      return (
        <pre className="rounded-lg overflow-auto text-sm my-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          {children}
        </pre>
      )
    },
    h1: makeHeadingComponent(1) as Components['h1'],
    h2: makeHeadingComponent(2) as Components['h2'],
    h3: makeHeadingComponent(3) as Components['h3'],
    h4: makeHeadingComponent(4) as Components['h4'],
    h5: makeHeadingComponent(5) as Components['h5'],
    h6: makeHeadingComponent(6) as Components['h6'],
  }
}

function CopyButton({ onCopy }: { onCopy: () => void }) {
  const [copied, setCopied] = useState(false)
  return (
    <PanelButton
      onClick={() => { onCopy(); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      title="Copy file content"
    >
      {copied ? (
        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </PanelButton>
  )
}

function PanelButton({ onClick, title, children, active = false }: {
  onClick: () => void; title: string; children: React.ReactNode; active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={[
        'p-1 rounded transition-colors',
        active
          ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/30'
          : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
      ].join(' ')}
    >
      {children}
    </button>
  )
}

export default function MarkdownPanel({
  content, selectedFile, hasFolder, hasFiles,
  onOpenFolder, onOpenExternal,
  fontSize, onFontSizeChange,
  showOutline, onToggleOutline,
  fileStats, onCopyFile, onPrintToPDF,
  onCheckboxToggle,
  isSplitPanel = false, onCloseSplit
}: Props) {

  const components = useMemo(
    () => buildComponents(onOpenExternal, onCheckboxToggle),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [content, onOpenExternal, onCheckboxToggle]
  )

  // Strip HTML comments (e.g. <!-- BEGIN:... -->) so they don't render as text
  const cleanedContent = useMemo(() => content.replace(/<!--[\s\S]*?-->/g, ''), [content])

  if (!hasFolder) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8 gap-4">
        <svg className="w-16 h-16 text-gray-200 dark:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
        </svg>
        <div>
          <h2 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-1">Open a project folder</h2>
          <p className="text-sm text-gray-400 dark:text-gray-500">Browse CLAUDE.md, memory files, slash commands, and more.</p>
        </div>
        <button onClick={onOpenFolder} className="btn-glow px-5 py-2 text-sm">Open Folder</button>
      </div>
    )
  }

  if (!hasFiles) {
    return <div className="flex items-center justify-center h-full"><p className="text-gray-400 text-sm">No markdown files found in this folder</p></div>
  }

  if (!content) {
    return <div className="flex items-center justify-center h-full"><p className="text-gray-300 dark:text-gray-600 text-sm">Select a file to view</p></div>
  }

  return (
    <div className="flex h-full min-h-0">
      <div className="flex flex-col flex-1 min-w-0 min-h-0">
        {/* Panel header */}
        <div className="no-print flex items-center gap-1.5 px-3 py-1.5 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex-shrink-0">
          <span className="text-xs font-mono text-gray-400 flex-1 truncate min-w-0">{selectedFile?.relativePath}</span>
          <div className="flex items-center gap-1">
            <PanelButton onClick={() => onFontSizeChange(Math.max(12, fontSize - 1))} title="Decrease font size">
              <span className="text-xs font-bold leading-none">−</span>
            </PanelButton>
            <span className="text-xs text-gray-400 w-6 text-center tabular-nums">{fontSize}</span>
            <PanelButton onClick={() => onFontSizeChange(Math.min(22, fontSize + 1))} title="Increase font size">
              <span className="text-xs font-bold leading-none">+</span>
            </PanelButton>
          </div>
          <PanelButton onClick={onToggleOutline} title="Toggle outline" active={showOutline}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h7" />
            </svg>
          </PanelButton>
          <CopyButton onCopy={onCopyFile} />
          <PanelButton onClick={onPrintToPDF} title="Export to PDF">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
          </PanelButton>
          {isSplitPanel && (
            <PanelButton onClick={onCloseSplit!} title="Close split view">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </PanelButton>
          )}
        </div>

        {/* Content + outline */}
        <div className="flex flex-1 min-h-0">
          <div className="print-content flex-1 overflow-auto">
            <div className="max-w-3xl mx-auto px-8 py-6">
              <div className="prose prose-sm dark:prose-invert max-w-none" style={{ fontSize }}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={components}
                >
                  {cleanedContent}
                </ReactMarkdown>
              </div>
            </div>
          </div>
          {showOutline && <OutlinePanel content={content} />}
        </div>

        {/* Status bar */}
        <StatusBar content={content} fileStats={fileStats} />
      </div>
    </div>
  )
}
