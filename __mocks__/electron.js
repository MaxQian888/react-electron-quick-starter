module.exports = {
  contextBridge: { exposeInMainWorld: jest.fn() },
  ipcRenderer: { invoke: jest.fn(), on: jest.fn() },
  ipcMain: { handle: jest.fn(), on: jest.fn() },
  app: {
    whenReady: jest.fn(() => Promise.resolve()),
    getAppPath: jest.fn(() => "/app"),
    on: jest.fn(),
    quit: jest.fn(),
    requestSingleInstanceLock: jest.fn(() => true),
  },
  BrowserWindow: Object.assign(
    jest.fn(() => ({
      loadURL: jest.fn(),
      loadFile: jest.fn(),
      webContents: {
        openDevTools: jest.fn(),
        setWindowOpenHandler: jest.fn(),
        on: jest.fn(),
      },
      once: jest.fn(),
      show: jest.fn(),
      isMinimized: jest.fn(() => false),
      restore: jest.fn(),
      focus: jest.fn(),
    })),
    { getAllWindows: jest.fn(() => []) }
  ),
  session: { defaultSession: { webRequest: { onHeadersReceived: jest.fn() } } },
  protocol: {
    registerSchemesAsPrivileged: jest.fn(),
    handle: jest.fn(),
  },
  net: { fetch: jest.fn() },
  shell: { openExternal: jest.fn(() => Promise.resolve()) },
}
