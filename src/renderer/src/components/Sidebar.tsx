import { useState } from 'react'

interface Props {
  projectFiles: ProjectFiles | null
  selectedFile: FileEntry | null
  onSelectFile: (file: FileEntry) => void
  onOpenFolder: () => void
  fileStats: Record<string, FileStats>
  filterRef: React.RefObject<HTMLInputElement>
  onCmdClickFile: (file: FileEntry) => void
  memoryFrontmatter: Record<string, string>
}

const RECENTLY_MODIFIED_MS = 86_400_000 // 24h

export default function Sidebar({
  projectFiles, selectedFile, onSelectFile, onOpenFolder,
  fileStats, filterRef, onCmdClickFile, memoryFrontmatter
}: Props) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState('')

  const toggle = (section: string) =>
    setCollapsed(prev => {
      const next = new Set(prev)
      next.has(section) ? next.delete(section) : next.add(section)
      return next
    })

  const applyFilter = (files: FileEntry[]) =>
    filter
      ? files.filter(f =>
          f.name.toLowerCase().includes(filter.toLowerCase()) ||
          f.relativePath.toLowerCase().includes(filter.toLowerCase())
        )
      : files

  if (!projectFiles) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center gap-3">
        <svg className="w-10 h-10 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
        </svg>
        <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
          Open a Claude Code project folder to get started
        </p>
        <button
          onClick={onOpenFolder}
          className="px-3 py-1.5 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
        >
          Open Folder
        </button>
      </div>
    )
  }

  const hasAny = projectFiles.claudeMd ||
    projectFiles.commands.length > 0 ||
    projectFiles.memory.length > 0 ||
    projectFiles.other.length > 0

  if (!hasAny) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
          No markdown files found in this folder
        </p>
      </div>
    )
  }

  const filteredCommands = applyFilter(projectFiles.commands)
  const filteredMemory = applyFilter(projectFiles.memory)
  const filteredOther = applyFilter(projectFiles.other)
  const showClaudeMd = !filter || projectFiles.claudeMd && (
    'CLAUDE.md'.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <nav className="py-2">
      {/* Filter input */}
      <div className="px-3 pb-2">
        <input
          ref={filterRef}
          type="text"
          placeholder="Filter… (/)"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="w-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-400 placeholder-gray-400"
        />
      </div>

      {/* CLAUDE.md — pinned */}
      {projectFiles.claudeMd && showClaudeMd && (
        <>
          <FileItem
            file={projectFiles.claudeMd}
            isSelected={selectedFile?.path === projectFiles.claudeMd.path}
            onSelect={onSelectFile}
            onCmdClick={onCmdClickFile}
            icon="🧠"
            bold
            mtimeMs={fileStats[projectFiles.claudeMd.path]?.mtimeMs}
          />
          <div className="mx-3 my-2 border-t border-gray-200 dark:border-gray-700" />
        </>
      )}

      {/* Commands */}
      {filteredCommands.length > 0 && (
        <Section
          title="Commands"
          sectionKey="commands"
          count={filteredCommands.length}
          isCollapsed={collapsed.has('commands')}
          onToggle={toggle}
        >
          {filteredCommands.map(f => (
            <FileItem
              key={f.path}
              file={f}
              isSelected={selectedFile?.path === f.path}
              onSelect={onSelectFile}
              onCmdClick={onCmdClickFile}
              mtimeMs={fileStats[f.path]?.mtimeMs}
            />
          ))}
        </Section>
      )}

      {/* Memory */}
      {filteredMemory.length > 0 && (
        <Section
          title="Memory"
          sectionKey="memory"
          count={filteredMemory.length}
          isCollapsed={collapsed.has('memory')}
          onToggle={toggle}
        >
          {filteredMemory.map(f => (
            <FileItem
              key={f.path}
              file={f}
              isSelected={selectedFile?.path === f.path}
              onSelect={onSelectFile}
              onCmdClick={onCmdClickFile}
              mtimeMs={fileStats[f.path]?.mtimeMs}
              frontmatterType={memoryFrontmatter[f.path]}
            />
          ))}
        </Section>
      )}

      {/* Other */}
      {filteredOther.length > 0 && (
        <Section
          title="Other"
          sectionKey="other"
          count={filteredOther.length}
          isCollapsed={collapsed.has('other')}
          onToggle={toggle}
        >
          {filteredOther.map(f => (
            <FileItem
              key={f.path}
              file={f}
              isSelected={selectedFile?.path === f.path}
              onSelect={onSelectFile}
              onCmdClick={onCmdClickFile}
              mtimeMs={fileStats[f.path]?.mtimeMs}
            />
          ))}
        </Section>
      )}
    </nav>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

interface SectionProps {
  title: string
  sectionKey: string
  count: number
  isCollapsed: boolean
  onToggle: (key: string) => void
  children: React.ReactNode
}

function Section({ title, sectionKey, count, isCollapsed, onToggle, children }: SectionProps) {
  return (
    <div className="mb-1">
      <button
        onClick={() => onToggle(sectionKey)}
        className="flex items-center gap-1 w-full px-3 py-1 text-xs font-semibold tracking-wider uppercase text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        <svg
          className={`w-3 h-3 flex-shrink-0 transition-transform duration-150 ${isCollapsed ? '' : 'rotate-90'}`}
          fill="currentColor" viewBox="0 0 20 20"
        >
          <path fillRule="evenodd"
            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
            clipRule="evenodd"
          />
        </svg>
        {title}
        <span className="ml-auto opacity-40 font-normal normal-case tracking-normal">{count}</span>
      </button>
      {!isCollapsed && <div className="mt-0.5">{children}</div>}
    </div>
  )
}

interface FileItemProps {
  file: FileEntry
  isSelected: boolean
  onSelect: (file: FileEntry) => void
  onCmdClick: (file: FileEntry) => void
  icon?: string
  bold?: boolean
  mtimeMs?: number
  frontmatterType?: string
}

function FileItem({ file, isSelected, onSelect, onCmdClick, icon = '📄', bold = false, mtimeMs, frontmatterType }: FileItemProps) {
  const isRecent = mtimeMs ? (Date.now() - mtimeMs < RECENTLY_MODIFIED_MS) : false

  return (
    <button
      onClick={(e) => e.metaKey ? onCmdClick(file) : onSelect(file)}
      title={`${file.relativePath} (⌘+click to split)`}
      className={[
        'w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left rounded-none transition-colors',
        isSelected
          ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700',
        bold ? 'font-semibold' : ''
      ].join(' ')}
    >
      <span className="flex-shrink-0 text-base leading-none">{icon}</span>
      <span className="truncate flex-1">{file.name}</span>
      {frontmatterType && (
        <span className="flex-shrink-0 px-1 py-0.5 text-xs rounded bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 font-mono max-w-[60px] truncate">
          {frontmatterType}
        </span>
      )}
      {isRecent && (
        <span
          className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0"
          title="Modified in the last 24h"
        />
      )}
    </button>
  )
}
