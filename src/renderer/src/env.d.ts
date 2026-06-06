/// <reference types="vite/client" />

interface FileEntry {
  name: string
  path: string
  relativePath: string
}

interface ProjectFiles {
  claudeMd: FileEntry | null
  commands: FileEntry[]
  memory: FileEntry[]
  other: FileEntry[]
}

interface WatcherChange {
  type: string
  path: string
}

interface SearchResult {
  filePath: string
  relativePath: string
  lineNumber: number
  lineText: string
  contextBefore: string
  contextAfter: string
}

interface FileStats {
  mtimeMs: number
  size: number
}

interface Window {
  api: {
    openFolder: () => Promise<string | null>
    scanFolder: (folderPath: string) => Promise<ProjectFiles>
    readFile: (filePath: string) => Promise<string>
    watchFolder: (folderPath: string) => Promise<void>
    getFileStats: (paths: string[]) => Promise<Record<string, FileStats>>
    searchFiles: (folderPath: string, query: string) => Promise<SearchResult[]>
    readMultipleFiles: (paths: string[]) => Promise<Record<string, string>>
    printToPDF: (suggestedName: string) => Promise<void>
    writeToClipboard: (text: string) => Promise<void>
    getRecentFolders: () => Promise<string[]>
    getLastFolder: () => Promise<string | null>
    addRecentFolder: (folderPath: string) => Promise<void>
    getSetting: (key: string) => Promise<unknown>
    setSetting: (key: string, value: unknown) => Promise<void>
    writeFile: (filePath: string, content: string) => Promise<void>
    getDemoPath: () => Promise<string>
    installSkills: () => Promise<{ ok: boolean; dest?: string; skills?: string[]; error?: string }>
    skillsInstalled: () => Promise<boolean>
    openExternal: (url: string) => Promise<void>
    onFolderChange: (
      callback: (event: unknown, data: WatcherChange) => void
    ) => () => void
    onUpdateAvailable: (
      callback: (event: unknown, data: { version: string; url: string }) => void
    ) => () => void
  }
}
