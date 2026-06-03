import { useState, useEffect, useCallback, useRef, useMemo, useLayoutEffect } from 'react'
import Sidebar from './components/Sidebar'
import MarkdownPanel from './components/MarkdownPanel'
import SidebarDragHandle from './components/SidebarDragHandle'
import QuickSwitcher from './components/QuickSwitcher'
import SearchView from './components/SearchView'
import TasksView from './components/TasksView'
import githubDarkCss from 'highlight.js/styles/github-dark.css?raw'

type ThemePreference = 'light' | 'dark' | 'system'

function useTheme(): [ThemePreference, (t: ThemePreference) => void] {
  const [preference, setPreference] = useState<ThemePreference>('system')

  const applyTheme = useCallback((pref: ThemePreference) => {
    const isDark = pref === 'dark' || (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
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
      const pref = (['light', 'dark', 'system'].includes(stored as string) ? stored as ThemePreference : 'system')
      setPreference(pref)
      applyTheme(pref)
    }
    init()
  }, [applyTheme])

  useEffect(() => {
    if (preference !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyTheme('system')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [preference, applyTheme])

  const setTheme = useCallback((pref: ThemePreference) => {
    setPreference(pref)
    applyTheme(pref)
    window.api.setSetting('themePreference', pref)
  }, [applyTheme])

  return [preference, setTheme]
}

function extractFrontmatterType(content: string): string | null {
  const m = content.match(/^---\s*\n([\s\S]*?)\n---/)
  if (!m) return null
  const typeMatch = m[1].match(/^type:\s*(.+)$/m)
  return typeMatch ? typeMatch[1].trim() : null
}

const THEME_ICONS: Record<ThemePreference, string> = { system: '⊙', light: '☀', dark: '☾' }
const THEME_CYCLE: ThemePreference[] = ['system', 'light', 'dark']

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
  const [showOutline, setShowOutline] = useState(false)
  const [quickSwitcherOpen, setQuickSwitcherOpen] = useState(false)
  const [splitFile, setSplitFile] = useState<FileEntry | null>(null)
  const [splitContent, setSplitContent] = useState('')
  const [fileStats, setFileStats] = useState<Record<string, FileStats>>({})
  const [memoryFrontmatter, setMemoryFrontmatter] = useState<Record<string, string>>({})

  const dropdownRef = useRef<HTMLDivElement>(null)
  const sidebarFilterRef = useRef<HTMLInputElement>(null)

  // Close recent dropdown on outside click
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
    const stats = await window.api.getFileStats(allPaths)
    setFileStats(stats)
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

    // Parse frontmatter for memory files
    if (files.memory.length > 0) {
      const contents = await window.api.readMultipleFiles(files.memory.map(f => f.path))
      const fm: Record<string, string> = {}
      for (const [path, content] of Object.entries(contents)) {
        const t = extractFrontmatterType(content)
        if (t) fm[path] = t
      }
      setMemoryFrontmatter(fm)
    }

    if (files.claudeMd) await loadFile(files.claudeMd)
  }, [loadFile, refreshStats])

  // Init from last folder + load persisted settings
  useEffect(() => {
    const init = async () => {
      const [lastFolder, recent, storedWidth, storedFontSize] = await Promise.all([
        window.api.getLastFolder(),
        window.api.getRecentFolders(),
        window.api.getSetting('sidebarWidth'),
        window.api.getSetting('fontSize')
      ])
      setRecentFolders(recent)
      if (typeof storedWidth === 'number') setSidebarWidth(storedWidth)
      if (typeof storedFontSize === 'number') setFontSize(storedFontSize)
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
          const content = await window.api.readFile(selectedFile.path)
          setFileContent(content)
        }
        if (data.path === selectedFile.path && data.type === 'unlink') {
          setSelectedFile(null)
          setFileContent('')
        }
      }
    })
    return unlisten
  }, [currentFolder, selectedFile, refreshStats])

  // Flat file list for keyboard nav
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
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault()
        setQuickSwitcherOpen(true)
        return
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault()
        setShowSearch(true)
        return
      }
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
        const next = e.key === 'ArrowDown'
          ? Math.min(idx + 1, flatFileList.length - 1)
          : Math.max(idx - 1, 0)
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
  }, [quickSwitcherOpen, showSearch, showTasks, showOutline, flatFileList, selectedFile, loadFile])

  const handleOpenFolder = useCallback(async () => {
    setShowRecent(false)
    const folderPath = await window.api.openFolder()
    if (folderPath) await openFolder(folderPath)
  }, [openFolder])

  const handleFontSizeChange = useCallback((size: number) => {
    setFontSize(size)
    window.api.setSetting('fontSize', size)
  }, [])

  const handleSidebarResize = useCallback((w: number) => {
    setSidebarWidth(w)
    window.api.setSetting('sidebarWidth', w)
  }, [])

  const cycleTheme = useCallback(() => {
    const idx = THEME_CYCLE.indexOf(themePreference)
    setThemePreference(THEME_CYCLE[(idx + 1) % THEME_CYCLE.length])
  }, [themePreference, setThemePreference])

  const truncatePath = (p: string) => p.length > 55 ? '…' + p.slice(-55) : p

  const hasAnyFiles = !!(
    projectFiles && (
      projectFiles.claudeMd ||
      projectFiles.commands.length > 0 ||
      projectFiles.memory.length > 0 ||
      projectFiles.other.length > 0
    )
  )

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 select-none">
      {/* Toolbar */}
      <div
        className="toolbar-drag flex items-center gap-3 px-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex-shrink-0"
        style={{ minHeight: 44, paddingTop: 8, paddingBottom: 8, paddingLeft: 84 }}
      >
        <button
          onClick={handleOpenFolder}
          className="toolbar-no-drag px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-md transition-colors flex-shrink-0"
        >
          Open Folder
        </button>

        {/* Path + recent */}
        <div className="toolbar-no-drag relative flex items-center gap-1 flex-1 min-w-0" ref={dropdownRef}>
          <span className="text-sm text-gray-500 dark:text-gray-400 font-mono truncate">
            {currentFolder ? truncatePath(currentFolder) : 'No folder open'}
          </span>
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

        {/* Right toolbar actions */}
        <div className="toolbar-no-drag flex items-center gap-1 flex-shrink-0">
          <ToolbarButton onClick={() => setShowSearch(true)} title="Search files (⌘F)">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => setShowTasks(v => !v)}
            title="Tasks view"
            active={showTasks}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </ToolbarButton>
          {selectedFile && (
            <ToolbarButton
              onClick={() => window.api.printToPDF(selectedFile.name)}
              title="Export to PDF"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </ToolbarButton>
          )}
          <ToolbarButton onClick={cycleTheme} title={`Theme: ${themePreference}`}>
            <span className="text-sm leading-none">{THEME_ICONS[themePreference]}</span>
          </ToolbarButton>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <div
          className="flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-y-auto"
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

        <SidebarDragHandle width={sidebarWidth} onResize={handleSidebarResize} />

        {/* Panel area */}
        <div className="flex flex-1 min-w-0">
          {/* Primary panel */}
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
                projectFiles={projectFiles}
                onOpenFile={(file) => { loadFile(file); setShowTasks(false) }}
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
                onFontSizeChange={handleFontSizeChange}
                showOutline={showOutline}
                onToggleOutline={() => setShowOutline(v => !v)}
                fileStats={selectedFile ? (fileStats[selectedFile.path] ?? null) : null}
                onCopyFile={() => window.api.writeToClipboard(fileContent)}
                onPrintToPDF={() => selectedFile && window.api.printToPDF(selectedFile.name)}
              />
            )}
          </div>

          {/* Split panel */}
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
                  onFontSizeChange={handleFontSizeChange}
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

      {/* Modals */}
      {quickSwitcherOpen && (
        <QuickSwitcher
          files={flatFileList}
          onSelect={(file) => { loadFile(file); setQuickSwitcherOpen(false) }}
          onClose={() => setQuickSwitcherOpen(false)}
        />
      )}
    </div>
  )
}

function ToolbarButton({
  onClick,
  title,
  children,
  active = false
}: {
  onClick: () => void
  title: string
  children: React.ReactNode
  active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={[
        'p-1.5 rounded-md transition-colors',
        active
          ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200'
      ].join(' ')}
    >
      {children}
    </button>
  )
}
