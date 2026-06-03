import { app, BrowserWindow, ipcMain, dialog, shell, clipboard } from 'electron'
import { join, relative } from 'path'
import { existsSync, readdirSync, readFileSync, writeFileSync, statSync } from 'fs'
import chokidar from 'chokidar'

let mainWindow: BrowserWindow | null = null
let watcher: ReturnType<typeof chokidar.watch> | null = null

// ── Persistent store ──────────────────────────────────────────────────────────

interface StoreData {
  recentFolders: string[]
  lastFolder: string | null
  sidebarWidth: number
  themePreference: 'light' | 'dark' | 'system'
  fontSize: number
}

function storePath(): string {
  return join(app.getPath('userData'), 'claudeview-store.json')
}

function readStore(): StoreData {
  try {
    if (existsSync(storePath())) {
      const parsed = JSON.parse(readFileSync(storePath(), 'utf-8'))
      return {
        recentFolders: parsed.recentFolders ?? [],
        lastFolder: parsed.lastFolder ?? null,
        sidebarWidth: parsed.sidebarWidth ?? 240,
        themePreference: parsed.themePreference ?? 'system',
        fontSize: parsed.fontSize ?? 14
      }
    }
  } catch {
    // ignore corrupt file
  }
  return { recentFolders: [], lastFolder: null, sidebarWidth: 240, themePreference: 'system', fontSize: 14 }
}

function writeStore(data: StoreData): void {
  writeFileSync(storePath(), JSON.stringify(data, null, 2), 'utf-8')
}

// ── File scanning ─────────────────────────────────────────────────────────────

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

interface SearchResult {
  filePath: string
  relativePath: string
  lineNumber: number
  lineText: string
  contextBefore: string
  contextAfter: string
}

function walkMd(dir: string, rootDir: string, depth = 0): FileEntry[] {
  if (depth > 6) return []
  const entries: FileEntry[] = []
  let items: ReturnType<typeof readdirSync>
  try {
    items = readdirSync(dir, { withFileTypes: true })
  } catch {
    return []
  }
  for (const item of items) {
    if (item.name === 'node_modules' || item.name === '.git') continue
    if (item.name.startsWith('.') && item.name !== '.claude') continue
    const fullPath = join(dir, item.name)
    if (item.isDirectory()) {
      entries.push(...walkMd(fullPath, rootDir, depth + 1))
    } else if (item.isFile() && item.name.endsWith('.md')) {
      entries.push({
        name: item.name,
        path: fullPath,
        relativePath: relative(rootDir, fullPath)
      })
    }
  }
  return entries
}

function scanFolder(folderPath: string): ProjectFiles {
  const result: ProjectFiles = { claudeMd: null, commands: [], memory: [], other: [] }

  const claudeMdPath = join(folderPath, 'CLAUDE.md')
  if (existsSync(claudeMdPath)) {
    result.claudeMd = { name: 'CLAUDE.md', path: claudeMdPath, relativePath: 'CLAUDE.md' }
  }

  const commandsDir = join(folderPath, '.claude', 'commands')
  if (existsSync(commandsDir)) {
    try {
      result.commands = readdirSync(commandsDir, { withFileTypes: true })
        .filter(f => f.isFile() && f.name.endsWith('.md'))
        .map(f => ({
          name: f.name,
          path: join(commandsDir, f.name),
          relativePath: `.claude/commands/${f.name}`
        }))
        .sort((a, b) => a.name.localeCompare(b.name))
    } catch { /* ignore */ }
  }

  const memoryDir = join(folderPath, '.claude', 'memory')
  if (existsSync(memoryDir)) {
    try {
      result.memory = readdirSync(memoryDir, { withFileTypes: true })
        .filter(f => f.isFile() && f.name.endsWith('.md'))
        .map(f => ({
          name: f.name,
          path: join(memoryDir, f.name),
          relativePath: `.claude/memory/${f.name}`
        }))
        .sort((a, b) => a.name.localeCompare(b.name))
    } catch { /* ignore */ }
  }

  result.other = walkMd(folderPath, folderPath)
    .filter(f => f.relativePath !== 'CLAUDE.md' && !f.relativePath.startsWith('.claude/'))
    .sort((a, b) => a.relativePath.localeCompare(b.relativePath))

  return result
}

// ── Window ────────────────────────────────────────────────────────────────────

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    title: 'ClaudeView',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// ── IPC handlers ──────────────────────────────────────────────────────────────

ipcMain.handle('dialog:openFolder', async () => {
  if (!mainWindow) return null
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  })
  return result.canceled ? null : result.filePaths[0] ?? null
})

ipcMain.handle('fs:scanFolder', (_event, folderPath: string) => {
  return scanFolder(folderPath)
})

ipcMain.handle('fs:readFile', (_event, filePath: string) => {
  try {
    return readFileSync(filePath, 'utf-8')
  } catch {
    return ''
  }
})

ipcMain.handle('fs:watchFolder', async (_event, folderPath: string) => {
  if (watcher) {
    await watcher.close()
    watcher = null
  }
  watcher = chokidar.watch(folderPath, {
    ignoreInitial: true,
    ignored: ['**/node_modules/**', '**/.git/**', '**/.DS_Store'],
    depth: 10,
    persistent: true
  })
  watcher.on('all', (eventType, filePath) => {
    if (filePath.endsWith('.md') && mainWindow) {
      mainWindow.webContents.send('watcher:change', { type: eventType, path: filePath })
    }
  })
})

ipcMain.handle('fs:getFileStats', (_event, paths: string[]) => {
  const result: Record<string, { mtimeMs: number; size: number }> = {}
  for (const p of paths) {
    try {
      const s = statSync(p)
      result[p] = { mtimeMs: s.mtimeMs, size: s.size }
    } catch { /* file may have disappeared */ }
  }
  return result
})

ipcMain.handle('fs:searchFiles', (_event, folderPath: string, query: string): SearchResult[] => {
  if (!query.trim()) return []
  const allFiles = walkMd(folderPath, folderPath)
  const results: SearchResult[] = []
  const lowerQuery = query.toLowerCase()

  for (const file of allFiles) {
    try {
      const lines = readFileSync(file.path, 'utf-8').split('\n')
      lines.forEach((line, idx) => {
        if (line.toLowerCase().includes(lowerQuery)) {
          results.push({
            filePath: file.path,
            relativePath: file.relativePath,
            lineNumber: idx + 1,
            lineText: line,
            contextBefore: lines[idx - 1] ?? '',
            contextAfter: lines[idx + 1] ?? ''
          })
        }
      })
    } catch { /* skip unreadable */ }
  }
  return results.slice(0, 200)
})

ipcMain.handle('fs:readMultipleFiles', (_event, paths: string[]) => {
  const result: Record<string, string> = {}
  for (const p of paths) {
    try {
      result[p] = readFileSync(p, 'utf-8')
    } catch { result[p] = '' }
  }
  return result
})

ipcMain.handle('window:printToPDF', async (_event, suggestedName: string) => {
  if (!mainWindow) return
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    defaultPath: suggestedName.replace(/\.md$/, '.pdf'),
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  })
  if (canceled || !filePath) return
  const pdfData = await mainWindow.webContents.printToPDF({})
  writeFileSync(filePath, pdfData)
})

ipcMain.handle('clipboard:writeText', (_event, text: string) => {
  clipboard.writeText(text)
})

ipcMain.handle('store:getRecentFolders', () => readStore().recentFolders)

ipcMain.handle('store:getLastFolder', () => readStore().lastFolder)

ipcMain.handle('store:addRecentFolder', (_event, folderPath: string) => {
  const store = readStore()
  store.recentFolders = [
    folderPath,
    ...store.recentFolders.filter(f => f !== folderPath)
  ].slice(0, 5)
  store.lastFolder = folderPath
  writeStore(store)
})

ipcMain.handle('store:getSetting', (_event, key: string) => {
  return (readStore() as Record<string, unknown>)[key]
})

ipcMain.handle('store:setSetting', (_event, key: string, value: unknown) => {
  const store = readStore() as Record<string, unknown>
  store[key] = value
  writeStore(store as unknown as StoreData)
})

ipcMain.handle('shell:openExternal', async (_event, url: string) => {
  await shell.openExternal(url)
})

// ── App lifecycle ─────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', async () => {
  if (watcher) await watcher.close()
  if (process.platform !== 'darwin') app.quit()
})
