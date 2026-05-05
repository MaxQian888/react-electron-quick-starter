import { app, BrowserWindow, ipcMain, net, protocol, session, shell } from "electron"
import * as path from "node:path"
import { pathToFileURL } from "node:url"
import { greet } from "./ipc/greet"
import { getContentType, resolveStaticPath } from "./protocol/resolve-static-path"

const isDev = process.env.NODE_ENV === "development"
const startUrl = process.env.ELECTRON_START_URL

// Custom scheme used for the static export. Loading the renderer at
// `app://app/index.html` makes Next.js' absolute asset paths
// (`/_next/static/...`) resolve to `app://app/_next/static/...`, which the
// handler maps to files under `out/`. Loading via `file://` instead would
// make the same paths resolve to the filesystem root and 404 every asset.
const APP_SCHEME = "app"
const APP_ORIGIN = `${APP_SCHEME}://app`

// Must be called *before* app is ready. Marking the scheme `standard` and
// `secure` makes its origin behave like https for CORS, cookies, and CSP.
protocol.registerSchemesAsPrivileged([
  {
    scheme: APP_SCHEME,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
    },
  },
])

const PROD_CSP =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; " +
  "img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; " +
  "object-src 'none'; frame-src 'none'; base-uri 'self'; form-action 'self'"

const DEV_CSP =
  "default-src 'self' http://localhost:3000 ws://localhost:3000; " +
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:3000; " +
  "style-src 'self' 'unsafe-inline' http://localhost:3000; " +
  "img-src 'self' data: blob: http://localhost:3000; " +
  "font-src 'self' data: http://localhost:3000; " +
  "connect-src 'self' http://localhost:3000 ws://localhost:3000"

function applyCsp(): void {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [isDev ? DEV_CSP : PROD_CSP],
      },
    })
  })
}

function registerStaticProtocol(): void {
  const root = path.join(app.getAppPath(), "out")

  protocol.handle(APP_SCHEME, async (request) => {
    const url = new URL(request.url)
    const resolved = resolveStaticPath(url.pathname, root)

    if (resolved.kind === "forbidden") {
      return new Response("Forbidden", { status: 403 })
    }

    // `net.fetch` reads the file (transparently handling asar) and returns a
    // Response with proper streaming. We override Content-Type because some
    // extensions (`.woff2`, `.wasm`) are not always inferred correctly.
    const fileUrl = pathToFileURL(resolved.filePath).toString()
    const response = await net.fetch(fileUrl, { bypassCustomProtocolHandlers: true })
    if (!response.ok) {
      return response
    }
    const headers = new Headers(response.headers)
    headers.set("content-type", getContentType(resolved.filePath))
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  })
}

function registerIpc(): void {
  ipcMain.handle("greet", (_event, name: unknown) => {
    if (typeof name !== "string") {
      throw new Error("name must be a string")
    }
    return greet(name)
  })
}

function attachWindowSecurity(win: BrowserWindow, allowedOrigin: string): void {
  // window.open / target=_blank: never spawn a new BrowserWindow. Hand
  // off http(s) URLs to the OS browser; deny everything else.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      void shell.openExternal(url)
    }
    return { action: "deny" }
  })

  // Prevent the renderer from navigating away from the app origin.
  // Plain <a href="https://..."> (no target=_blank) would otherwise replace
  // the renderer document with an external page.
  win.webContents.on("will-navigate", (event, url) => {
    let target: URL
    try {
      target = new URL(url)
    } catch {
      event.preventDefault()
      return
    }
    if (target.origin === allowedOrigin) return
    event.preventDefault()
    if (target.protocol === "http:" || target.protocol === "https:") {
      void shell.openExternal(url)
    }
  })

  // Reject privilege escalation requests from preload/renderer.
  win.webContents.on("will-attach-webview", (event, webPreferences) => {
    delete webPreferences.preload
    webPreferences.nodeIntegration = false
    webPreferences.contextIsolation = true
    event.preventDefault()
  })
}

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1024,
    height: 720,
    minWidth: 640,
    minHeight: 480,
    title: "react-quick-starter",
    show: false, // wait for ready-to-show to avoid white flash
    backgroundColor: "#0a0a0a",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: false,
    },
  })

  win.once("ready-to-show", () => win.show())

  if (startUrl) {
    void win.loadURL(startUrl)
    attachWindowSecurity(win, new URL(startUrl).origin)
    win.webContents.openDevTools({ mode: "detach" })
  } else {
    void win.loadURL(`${APP_ORIGIN}/index.html`)
    attachWindowSecurity(win, APP_ORIGIN)
  }

  return win
}

// Single-instance lock: focusing the existing window is friendlier than
// silently launching a duplicate process that fights for the same resources.
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on("second-instance", () => {
    const [first] = BrowserWindow.getAllWindows()
    if (first) {
      if (first.isMinimized()) first.restore()
      first.focus()
    }
  })

  void app.whenReady().then(() => {
    applyCsp()
    registerStaticProtocol()
    registerIpc()
    createWindow()

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit()
  })
}
