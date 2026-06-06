interface Task {
  text: string
  done: boolean
  lineNumber: number
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
  file: FileEntry | null
  content: string
  onToggle: (index: number) => void
  onClose: () => void
}

export default function TasksView({ file, content, onToggle, onClose }: Props) {
  const tasks = parseTasks(content)
  const totalTasks = tasks.length
  const doneTasks = tasks.filter(t => t.done).length
  const pct = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex-shrink-0">Tasks</span>
        {file && (
          <span className="text-xs font-mono text-gray-400 truncate min-w-0">{file.relativePath}</span>
        )}
        {totalTasks > 0 && (
          <div className="flex items-center gap-2 flex-1 min-w-[120px]">
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
          className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded transition-colors flex-shrink-0 ml-auto"
          title="Close (Esc)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {!file && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-400">Select a file to see its tasks</p>
          </div>
        )}
        {file && totalTasks === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <p className="text-sm text-gray-400">No tasks in this file</p>
            <p className="text-xs text-gray-300 dark:text-gray-600">Use <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">- [ ] task</code> syntax</p>
          </div>
        )}
        {file && totalTasks > 0 && (
          <div className="py-2 max-w-3xl mx-auto px-2">
            {tasks.map((task, i) => (
              <div key={i} className="flex items-start gap-2.5 px-4 py-1.5 group">
                <button
                  onClick={() => onToggle(i)}
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
    </div>
  )
}
