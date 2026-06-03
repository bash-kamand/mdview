import { useState, useEffect } from 'react'

interface Task {
  text: string
  done: boolean
  lineNumber: number
}

interface FileTaskGroup {
  file: FileEntry
  tasks: Task[]
}

function parseTasks(content: string): Task[] {
  const tasks: Task[] = []
  content.split('\n').forEach((line, idx) => {
    const m = line.match(/^(\s*)-\s+\[([ xX])\]\s+(.+)/)
    if (m) {
      tasks.push({ text: m[3].trim(), done: m[2].toLowerCase() === 'x', lineNumber: idx + 1 })
    }
  })
  return tasks
}

interface Props {
  projectFiles: ProjectFiles | null
  onOpenFile: (file: FileEntry) => void
  onFileUpdated?: (file: FileEntry, newContent: string) => void
  onClose: () => void
}

function toggleNthCheckbox(content: string, targetIndex: number): string {
  let count = -1
  return content.replace(/^(\s*- \[)([ xX])(\])/gm, (match, before, state, after) => {
    count++
    if (count !== targetIndex) return match
    return `${before}${state.trim() === '' ? 'x' : ' '}${after}`
  })
}

export default function TasksView({ projectFiles, onOpenFile, onFileUpdated, onClose }: Props) {
  const [groups, setGroups] = useState<FileTaskGroup[]>([])
  const [fileContents, setFileContents] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!projectFiles) return
    const allFiles = [
      ...(projectFiles.claudeMd ? [projectFiles.claudeMd] : []),
      ...projectFiles.commands,
      ...projectFiles.memory,
      ...projectFiles.other
    ]
    if (allFiles.length === 0) return

    setLoading(true)
    window.api.readMultipleFiles(allFiles.map(f => f.path)).then(contents => {
      const result: FileTaskGroup[] = []
      for (const file of allFiles) {
        const tasks = parseTasks(contents[file.path] ?? '')
        if (tasks.length > 0) result.push({ file, tasks })
      }
      setGroups(result)
      setFileContents(contents)
      setLoading(false)
    })
  }, [projectFiles])

  const handleToggleTask = async (file: FileEntry, taskIndex: number) => {
    const current = fileContents[file.path] ?? ''
    const updated = toggleNthCheckbox(current, taskIndex)
    await window.api.writeFile(file.path, updated)
    setFileContents(prev => ({ ...prev, [file.path]: updated }))
    setGroups(prev => prev.map(g =>
      g.file.path === file.path ? { ...g, tasks: parseTasks(updated) } : g
    ))
    onFileUpdated?.(file, updated)
  }

  const totalTasks = groups.reduce((s, g) => s + g.tasks.length, 0)
  const doneTasks = groups.reduce((s, g) => s + g.tasks.filter(t => t.done).length, 0)
  const pct = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0

  const toggleCollapse = (path: string) =>
    setCollapsed(prev => {
      const next = new Set(prev)
      next.has(path) ? next.delete(path) : next.add(path)
      return next
    })

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tasks</span>
        {totalTasks > 0 && (
          <div className="flex items-center gap-2 flex-1">
            <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
              {doneTasks}/{totalTasks} ({pct}%)
            </span>
          </div>
        )}
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded transition-colors flex-shrink-0"
          title="Close (Esc)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-400">Loading tasks…</p>
          </div>
        )}
        {!loading && groups.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <p className="text-sm text-gray-400">No tasks found</p>
            <p className="text-xs text-gray-300 dark:text-gray-600">Use <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">- [ ] task</code> syntax</p>
          </div>
        )}
        {groups.map(({ file, tasks }) => {
          const done = tasks.filter(t => t.done).length
          const isCollapsed = collapsed.has(file.path)
          return (
            <div key={file.path} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
              <button
                onClick={() => toggleCollapse(file.path)}
                className="w-full flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
              >
                <svg
                  className={`w-3 h-3 text-gray-400 flex-shrink-0 transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
                  fill="currentColor" viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span
                  className="text-xs font-semibold text-gray-700 dark:text-gray-300 font-mono hover:text-blue-600 dark:hover:text-blue-400 flex-1 truncate text-left"
                  onClick={(e) => { e.stopPropagation(); onOpenFile(file) }}
                >
                  {file.relativePath}
                </span>
                <span className="text-xs text-gray-400 flex-shrink-0">{done}/{tasks.length}</span>
              </button>
              {!isCollapsed && (
                <div className="py-1">
                  {tasks.map((task, i) => (
                    <div key={i} className="flex items-start gap-2.5 px-4 py-1.5 group">
                      <button
                        onClick={() => handleToggleTask(file, i)}
                        className="mt-0.5 flex-shrink-0 hover:opacity-70 transition-opacity cursor-pointer"
                        title={task.done ? 'Mark as pending' : 'Mark as done'}
                      >
                        {task.done ? (
                          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-green-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="9" strokeWidth="2" />
                          </svg>
                        )}
                      </button>
                      <span className={`text-sm leading-relaxed ${task.done ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-800 dark:text-gray-200'}`}>
                        {task.text}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
