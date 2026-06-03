import { contextBridge, ipcRenderer } from 'electron'

const api = {
  openFolder: (): Promise<string | null> =>
    ipcRenderer.invoke('dialog:openFolder'),

  scanFolder: (folderPath: string): Promise<ProjectFiles> =>
    ipcRenderer.invoke('fs:scanFolder', folderPath),

  readFile: (filePath: string): Promise<string> =>
    ipcRenderer.invoke('fs:readFile', filePath),

  watchFolder: (folderPath: string): Promise<void> =>
    ipcRenderer.invoke('fs:watchFolder', folderPath),

  getFileStats: (paths: string[]): Promise<Record<string, { mtimeMs: number; size: number }>> =>
    ipcRenderer.invoke('fs:getFileStats', paths),

  searchFiles: (folderPath: string, query: string): Promise<SearchResult[]> =>
    ipcRenderer.invoke('fs:searchFiles', folderPath, query),

  readMultipleFiles: (paths: string[]): Promise<Record<string, string>> =>
    ipcRenderer.invoke('fs:readMultipleFiles', paths),

  printToPDF: (suggestedName: string): Promise<void> =>
    ipcRenderer.invoke('window:printToPDF', suggestedName),

  writeToClipboard: (text: string): Promise<void> =>
    ipcRenderer.invoke('clipboard:writeText', text),

  getRecentFolders: (): Promise<string[]> =>
    ipcRenderer.invoke('store:getRecentFolders'),

  getLastFolder: (): Promise<string | null> =>
    ipcRenderer.invoke('store:getLastFolder'),

  addRecentFolder: (folderPath: string): Promise<void> =>
    ipcRenderer.invoke('store:addRecentFolder', folderPath),

  getSetting: (key: string): Promise<unknown> =>
    ipcRenderer.invoke('store:getSetting', key),

  setSetting: (key: string, value: unknown): Promise<void> =>
    ipcRenderer.invoke('store:setSetting', key, value),

  writeFile: (filePath: string, content: string): Promise<void> =>
    ipcRenderer.invoke('fs:writeFile', filePath, content),

  getDemoPath: (): Promise<string> =>
    ipcRenderer.invoke('app:getDemoPath'),

  openExternal: (url: string): Promise<void> =>
    ipcRenderer.invoke('shell:openExternal', url),

  onFolderChange: (
    callback: (event: Electron.IpcRendererEvent, data: WatcherChange) => void
  ) => {
    ipcRenderer.on('watcher:change', callback)
    return () => ipcRenderer.removeListener('watcher:change', callback)
  }
}

contextBridge.exposeInMainWorld('api', api)

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
