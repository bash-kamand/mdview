import { useState, useEffect, useCallback, useRef, useMemo, useLayoutEffect } from 'react'
import Sidebar from './components/Sidebar'
import MarkdownPanel from './components/MarkdownPanel'
import SidebarDragHandle from './components/SidebarDragHandle'
import QuickSwitcher from './components/QuickSwitcher'
import SearchView from './components/SearchView'
import TasksView from './components/TasksView'
import Onboarding from './components/Onboarding'
import githubDarkCss from 'highlight.js/styles/github-dark.css?raw'

// ── Theme (sun / moon only) ───────────────────────────────────────────────────

type ThemePreference = 'light' | 'dark'

function useTheme(): [ThemePreference, (t: ThemePreference) => void] {
  const [preference, setPreference] = useState<ThemePreference>('light')

  const applyTheme = useCallback((pref: ThemePreference) => {
    const isDark = pref === 'dark'
    document.documentElement.classList.toggle('dark', isDark)
    const styleId = 'hljs-dark-override'
    let el = document.getElementById(styleId)
    if (isDark) {
      if (!el) {
        el = document.createElement('style')
        el.id = styleId
        document.head.appendChild(el)
      }
      el.textContent = githubDarkCss
    } else {
      el?.remove()
    }
  }, [])

  useLayoutEffect(() => {
    const init = async () => {
      const stored = await window.api.getSetting('themePreference')
      let pref: ThemePreference
      if (stored === 'light' || stored === 'dark') {
        pref = stored
      } else {
        // First launch — resolve from OS, persist it
        pref = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        window.api.setSetting('themePreference', pref)
      }
      setPreference(pref)
      applyTheme(pref)
    }
    init()
  }, [applyTheme])

  const setTheme = useCallback((pref: ThemePreference) => {
    setPreference(pref)
    applyTheme(pref)
    window.api.setSetting('themePreference', pref)
  }, [applyTheme])

  return [preference, setTheme]
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function extractFrontmatterType(content: string): string | null {
  const m = content.match(/^---\s*\n([\s\S]*?)\n---/)
  if (!m) return null
  const t = m[1].match(/^type:\s*(.+)$/m)
  return t ? t[1].trim() : null
}

function toggleNthCheckbox(content: string, targetIndex: number): string {
  let count = -1
  return content.replace(/^(\s*- \[)([ xX])(\])/gm, (match, before, state, after) => {
    count++
    if (count !== targetIndex) return match
    return `${before}${state.trim() === '' ? 'x' : ' '}${after}`
  })
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [themePreference, setThemePreference] = useTheme()

  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const [projectFiles, setProjectFiles] = useState<ProjectFiles | null>(null)
  const [selectedFile, setSelectedFile] = useState<FileEntry | null>(null)
  const [fileContent, setFileContent] = useState<string>('')
  const [recentFolders, setRecentFolders] = useState<string[]>([])
  const [showRecent, setShowRecent] = useState(false)

  const [sidebarWidth, setSidebarWidth] = useState(240)
  const [fontSize, setFontSize] = useState(14)
  const [showSearch, setShowSearch] = useState(false)
  const [showTasks, setShowTasks] = useState(false)
  const [showOutline, setShowOutline] = useState(true)
  const [quickSwitcherOpen, setQuickSwitcherOpen] = useState(false)
  const [splitFile, setSplitFile] = useState<FileEntry | null>(null)
  const [splitContent, setSplitContent] = useState('')
  const [fileStats, setFileStats] = useState<Record<string, FileStats>>({})
  const [memoryFrontmatter, setMemoryFrontmatter] = useState<Record<string, string>>({})
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [updateInfo, setUpdateInfo] = useState<{ version: string; url: string } | null>(null)

  const dropdownRef = useRef<HTMLDivElement>(null)
  const sidebarFilterRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const unlisten = window.api.onUpdateAvailable((_event, data) => setUpdateInfo(data))
    return unlisten
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowRecent(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const loadFile = useCallback(async (file: FileEntry) => {
    setSelectedFile(file)
    const content = await window.api.readFile(file.path)
    setFileContent(content)
  }, [])

  const loadSplitFile = useCallback(async (file: FileEntry) => {
    setSplitFile(file)
    const content = await window.api.readFile(file.path)
    setSplitContent(content)
  }, [])

  const refreshStats = useCallback(async (files: ProjectFiles) => {
    const allPaths = [
      files.claudeMd?.path,
      ...files.commands.map(f => f.path),
      ...files.memory.map(f => f.path),
      ...files.other.map(f => f.path)
    ].filter(Boolean) as string[]
    setFileStats(await window.api.getFileStats(allPaths))
  }, [])

  const openFolder = useCallback(async (folderPath: string) => {
    setCurrentFolder(folderPath)
    setSelectedFile(null)
    setFileContent('')
    setSplitFile(null)
    setSplitContent('')

    const [files] = await Promise.all([
      window.api.scanFolder(folderPath),
      window.api.watchFolder(folderPath),
      window.api.addRecentFolder(folderPath)
    ])
    setProjectFiles(files)
    setRecentFolders(await window.api.getRecentFolders())
    await refreshStats(files)

    if (files.memory.length > 0) {
      const contents = await window.api.readMultipleFiles(files.memory.map(f => f.path))
      const fm: Record<string, string> = {}
      for (const [p, c] of Object.entries(contents)) {
        const t = extractFrontmatterType(c)
        if (t) fm[p] = t
      }
      setMemoryFrontmatter(fm)
    } else {
      setMemoryFrontmatter({})
    }

    if (files.claudeMd) await loadFile(files.claudeMd)
  }, [loadFile, refreshStats])

  // Init
  useEffect(() => {
    const init = async () => {
      const [lastFolder, recent, storedWidth, storedFontSize, seenOnboarding, storedOutline] = await Promise.all([
        window.api.getLastFolder(),
        window.api.getRecentFolders(),
        window.api.getSetting('sidebarWidth'),
        window.api.getSetting('fontSize'),
        window.api.getSetting('hasSeenOnboarding'),
        window.api.getSetting('showOutline')
      ])
      setRecentFolders(recent)
      if (typeof storedWidth === 'number') setSidebarWidth(storedWidth)
      if (typeof storedFontSize === 'number') setFontSize(storedFontSize)
      if (typeof storedOutline === 'boolean') setShowOutline(storedOutline)
      if (!seenOnboarding) setShowOnboarding(true)
      if (lastFolder) await openFolder(lastFolder)
    }
    init()
  }, [openFolder])

  // File watcher
  useEffect(() => {
    if (!currentFolder) return
    const unlisten = window.api.onFolderChange(async (_event, data) => {
      const files = await window.api.scanFolder(currentFolder)
      setProjectFiles(files)
      await refreshStats(files)
      if (selectedFile) {
        if (data.path === selectedFile.path && data.type === 'change') {
          setFileContent(await window.api.readFile(selectedFile.path))
        }
        if (data.path === selectedFile.path && data.type === 'unlink') {
          setSelectedFile(null); setFileContent('')
        }
      }
    })
    return unlisten
  }, [currentFolder, selectedFile, refreshStats])

  // Flat file list
  const flatFileList = useMemo<FileEntry[]>(() => {
    if (!projectFiles) return []
    return [
      ...(projectFiles.claudeMd ? [projectFiles.claudeMd] : []),
      ...projectFiles.commands,
      ...projectFiles.memory,
      ...projectFiles.other
    ]
  }, [projectFiles])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (showOnboarding) { if (e.key === 'Escape') closeOnboarding(); return }
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') { e.preventDefault(); setQuickSwitcherOpen(true); return }
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') { e.preventDefault(); setShowSearch(true); return }
      if (e.key === 'Escape') {
        if (quickSwitcherOpen) { setQuickSwitcherOpen(false); return }
        if (showSearch) { setShowSearch(false); return }
        if (showTasks) { setShowTasks(false); return }
        if (showOutline) { setShowOutline(false); return }
        return
      }
      if (quickSwitcherOpen || showSearch) return
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const active = document.activeElement
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return
        e.preventDefault()
        const idx = flatFileList.findIndex(f => f.path === selectedFile?.path)
        const next = e.key === 'ArrowDown' ? Math.min(idx + 1, flatFileList.length - 1) : Math.max(idx - 1, 0)
        if (flatFileList[next]) loadFile(flatFileList[next])
        return
      }
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault()
        sidebarFilterRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [showOnboarding, quickSwitcherOpen, showSearch, showTasks, showOutline, flatFileList, selectedFile, loadFile])

  const handleOpenFolder = useCallback(async () => {
    setShowRecent(false)
    const folderPath = await window.api.openFolder()
    if (folderPath) await openFolder(folderPath)
  }, [openFolder])

  const handleCheckboxToggle = useCallback(async (index: number) => {
    if (!selectedFile) return
    const newContent = toggleNthCheckbox(fileContent, index)
    setFileContent(newContent)
    await window.api.writeFile(selectedFile.path, newContent)
  }, [selectedFile, fileContent])

  const closeOnboarding = useCallback(() => {
    setShowOnboarding(false)
    window.api.setSetting('hasSeenOnboarding', true)
  }, [])

  const handleOpenDemo = useCallback(async () => {
    const demoPath = await window.api.getDemoPath()
    closeOnboarding()
    await openFolder(demoPath)
  }, [openFolder, closeOnboarding])

  const hasAnyFiles = !!(projectFiles && (
    projectFiles.claudeMd || projectFiles.commands.length > 0 ||
    projectFiles.memory.length > 0 || projectFiles.other.length > 0
  ))

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 select-none">
      {/* Toolbar */}
      <div
        className="toolbar-drag no-print flex items-center gap-3 px-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex-shrink-0"
        style={{ minHeight: 44, paddingTop: 6, paddingBottom: 6, paddingLeft: 84 }}
      >
        <button
          onClick={handleOpenFolder}
          className="toolbar-no-drag btn-glow px-4 py-1.5 text-sm flex-shrink-0"
        >
          Open Folder
        </button>

        {/* Path + recent */}
        <div className="toolbar-no-drag relative flex items-center gap-1 flex-1 min-w-0" ref={dropdownRef}>
          {currentFolder ? (
            <Breadcrumb path={currentFolder} onNavigate={openFolder} />
          ) : (
            <span className="text-sm text-gray-500 dark:text-gray-400 font-mono truncate">No folder open</span>
          )}
          {recentFolders.length > 0 && (
            <button
              onClick={() => setShowRecent(v => !v)}
              className="flex-shrink-0 p-0.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded"
              title="Recent folders"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
          {showRecent && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 min-w-[320px]">
              {recentFolders.map(folder => (
                <button
                  key={folder}
                  onClick={() => { openFolder(folder); setShowRecent(false) }}
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 font-mono truncate text-gray-800 dark:text-gray-200 first:rounded-t-md last:rounded-b-md"
                >
                  {folder}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right toolbar — grouped */}
        <div className="toolbar-no-drag flex items-center gap-1 flex-shrink-0">
          {/* Group 1: Views */}
          <div className="flex items-center gap-1.5">
            <LabelledButton
              onClick={() => setShowSearch(true)}
              label="Search"
              title="Search files (⌘F)"
              active={showSearch}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
            </LabelledButton>
            <LabelledButton
              onClick={() => setShowTasks(v => !v)}
              label="Tasks"
              title="Tasks view"
              active={showTasks}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </LabelledButton>
          </div>

          <div className="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-0.5" />

          {/* Group 2: PDF */}
          <LabelledButton
            onClick={() => selectedFile && window.api.printToPDF(selectedFile.name)}
            label="PDF"
            title="Export to PDF"
            disabled={!selectedFile}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </LabelledButton>

          <div className="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-0.5" />

          {/* Group 3: Theme */}
          <button
            onClick={() => setThemePreference(themePreference === 'dark' ? 'light' : 'dark')}
            title={`Switch to ${themePreference === 'dark' ? 'light' : 'dark'} mode`}
            className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-100 transition-colors"
          >
            {themePreference === 'dark' ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        <div
          className="no-print flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-y-auto"
          style={{ width: sidebarWidth }}
        >
          <Sidebar
            projectFiles={projectFiles}
            selectedFile={selectedFile}
            onSelectFile={loadFile}
            onOpenFolder={handleOpenFolder}
            fileStats={fileStats}
            filterRef={sidebarFilterRef}
            onCmdClickFile={loadSplitFile}
            memoryFrontmatter={memoryFrontmatter}
          />
        </div>

        <SidebarDragHandle width={sidebarWidth} onResize={(w) => { setSidebarWidth(w); window.api.setSetting('sidebarWidth', w) }} />

        <div className="flex flex-1 min-w-0">
          <div className="flex flex-col flex-1 min-w-0">
            {showSearch ? (
              <SearchView
                currentFolder={currentFolder}
                projectFiles={projectFiles}
                onOpenFile={(file) => { loadFile(file); setShowSearch(false) }}
                onClose={() => setShowSearch(false)}
              />
            ) : showTasks ? (
              <TasksView
                file={selectedFile}
                content={fileContent}
                onToggle={handleCheckboxToggle}
                onClose={() => setShowTasks(false)}
              />
            ) : (
              <MarkdownPanel
                content={fileContent}
                selectedFile={selectedFile}
                hasFolder={!!currentFolder}
                hasFiles={hasAnyFiles}
                onOpenFolder={handleOpenFolder}
                onOpenExternal={(url) => window.api.openExternal(url)}
                fontSize={fontSize}
                onFontSizeChange={(s) => { setFontSize(s); window.api.setSetting('fontSize', s) }}
                showOutline={showOutline}
                onToggleOutline={() => setShowOutline(v => { const next = !v; window.api.setSetting('showOutline', next); return next })}
                fileStats={selectedFile ? (fileStats[selectedFile.path] ?? null) : null}
                onCopyFile={() => window.api.writeToClipboard(fileContent)}
                onPrintToPDF={() => selectedFile && window.api.printToPDF(selectedFile.name)}
                onCheckboxToggle={handleCheckboxToggle}
              />
            )}
          </div>

          {splitFile && (
            <>
              <div className="w-px bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
              <div className="flex flex-col flex-1 min-w-0">
                <MarkdownPanel
                  content={splitContent}
                  selectedFile={splitFile}
                  hasFolder={true}
                  hasFiles={true}
                  onOpenFolder={handleOpenFolder}
                  onOpenExternal={(url) => window.api.openExternal(url)}
                  fontSize={fontSize}
                  onFontSizeChange={(s) => { setFontSize(s); window.api.setSetting('fontSize', s) }}
                  showOutline={false}
                  onToggleOutline={() => {}}
                  fileStats={fileStats[splitFile.path] ?? null}
                  onCopyFile={() => window.api.writeToClipboard(splitContent)}
                  onPrintToPDF={() => window.api.printToPDF(splitFile.name)}
                  isSplitPanel
                  onCloseSplit={() => { setSplitFile(null); setSplitContent('') }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {quickSwitcherOpen && (
        <QuickSwitcher
          files={flatFileList}
          onSelect={(file) => { loadFile(file); setQuickSwitcherOpen(false) }}
          onClose={() => setQuickSwitcherOpen(false)}
        />
      )}

      {updateInfo && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 bg-blue-600 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg">
          <span>ClaudeView {updateInfo.version} is available</span>
          <button
            onClick={() => window.api.openExternal(updateInfo.url)}
            className="font-semibold underline hover:no-underline"
          >
            Download
          </button>
          <button onClick={() => setUpdateInfo(null)} className="opacity-60 hover:opacity-100 ml-1">✕</button>
        </div>
      )}

      {showOnboarding && (
        <Onboarding onClose={closeOnboarding} onOpenDemo={handleOpenDemo} />
      )}
    </div>
  )
}

// ── Breadcrumb ────────────────────────────────────────────────────────────────

function Breadcrumb({ path, onNavigate }: { path: string; onNavigate: (p: string) => void }) {
  const segments = path.split('/').filter(Boolean)
  let acc = ''
  const items = segments.map((name) => {
    acc += '/' + name
    return { name, full: acc }
  })
  // direction:rtl on the scroll container clips overflow on the left, keeping the
  // current folder (tail) visible; inner direction:ltr keeps text reading normally.
  return (
    <div className="flex items-center min-w-0 overflow-hidden" style={{ direction: 'rtl' }}>
      <div className="flex items-center whitespace-nowrap text-sm font-mono" style={{ direction: 'ltr' }}>
        {items.map((item, i) => (
          <span key={item.full} className="flex items-center">
            {i > 0 && <span className="mx-1 text-gray-300 dark:text-gray-600 flex-shrink-0">/</span>}
            <button
              onClick={() => onNavigate(item.full)}
              className={[
                'transition-colors hover:underline',
                i === items.length - 1
                  ? 'text-gray-700 dark:text-gray-200 font-medium'
                  : 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
              ].join(' ')}
              title={`Open ${item.full}`}
            >
              {item.name}
            </button>
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Toolbar components ────────────────────────────────────────────────────────

function LabelledButton({
  onClick, label, title, children, active = false, disabled = false
}: {
  onClick: () => void
  label: string
  title: string
  children: React.ReactNode
  active?: boolean
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={['btn-glow-tool', active ? 'is-active' : ''].join(' ')}
    >
      {children}
      <span className="text-[9px] leading-none">{label}</span>
    </button>
  )
}
