# React Quick Starter

A modern, full-stack starter template combining **Next.js 16** with **React 19** for web applications and **Electron** + **electron-builder** for cross-platform desktop applications. Built with TypeScript, Tailwind CSS v4, and shadcn/ui components.

[中文文档](./README_zh.md)

## Features

- ⚡️ **Next.js 16** with App Router and React 19
- 🖥️ **Electron** for native desktop applications (Windows, macOS, Linux) packaged via electron-builder
- 🎨 **Tailwind CSS v4** with CSS variables and dark mode support
- 🧩 **shadcn/ui** component library with Radix UI primitives
- 📦 **Zustand** for lightweight state management
- 🔤 **Geist Font** optimized with next/font
- 🎯 **TypeScript** for type safety
- 🎭 **Lucide Icons** for beautiful iconography
- 📚 **Fumadocs** documentation site as a pnpm workspace subpackage
- 📱 Dual deployment: Web app OR Desktop app from the same codebase

## Prerequisites

Before you begin, ensure you have the following installed:

### For Web Development

- **Node.js** 20.x or later ([Download](https://nodejs.org/))
- **pnpm** 8.x or later (recommended) or npm/yarn

  ```bash
  npm install -g pnpm
  ```

### For Desktop Development

No additional native toolchain is required. `pnpm install` downloads the appropriate Electron binary automatically (Electron is whitelisted in `pnpm.onlyBuiltDependencies` so its postinstall script can run). electron-builder handles platform-specific packaging without Rust, Python, or Visual Studio Build Tools on Windows / Linux. macOS code-signing & notarization are optional and configured the same way regardless.

## Installation

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd react-quick-starter
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   # or
   npm install
   # or
   yarn install
   ```

3. **Verify installation**

   ```bash
   # Check if Next.js is ready (web mode)
   pnpm dev

   # Compile the Electron main process (sanity check)
   pnpm electron:compile
   ```

## Development

### Web Application Development

#### Start Development Server

```bash
pnpm dev
# or
npm run dev
```

This starts the Next.js development server at [http://localhost:3000](http://localhost:3000). The page auto-reloads when you edit files.

#### Key Development Files

- `app/page.tsx` - Main landing page
- `app/layout.tsx` - Root layout with global configuration
- `app/globals.css` - Global styles and Tailwind configuration
- `components/ui/` - Reusable UI components (shadcn/ui)
- `lib/utils.ts` - Utility functions

### Desktop Application Development

#### Start Electron Development Mode

```bash
pnpm electron:dev
```

This command runs `concurrently` to:

1. Start the Next.js development server at `http://localhost:3000`
2. Wait for the server to be ready (`wait-on`), then compile the Electron main process via `tsc`
3. Launch Electron pointing at `ELECTRON_START_URL=http://localhost:3000`
4. Enable hot-reload for the Next.js renderer (the main process must be recompiled with `pnpm electron:compile` if you change files in `electron/`)

#### Electron Development Files

- `electron/main.ts` - Main process: `BrowserWindow`, app lifecycle, CSP via `session.webRequest.onHeadersReceived`, IPC handlers
- `electron/preload.ts` - `contextBridge.exposeInMainWorld('electronAPI', {...})` exposes a typed surface to the renderer
- `electron/ipc/<name>.ts` - Pure IPC handler functions (unit-testable)
- `electron/tsconfig.json` - CommonJS compile config; outputs to `dist-electron/`
- `electron/icons/` - Build icons (`icon.ico`, `icon.icns`, `icon.png`)
- `package.json` `build` block - electron-builder configuration

### Calling the Main Process from JavaScript

The template ships a typed IPC bridge demo (`greet`). Pattern for adding a new IPC command:

1. **Write a pure handler** in `electron/ipc/my-command.ts`:

   ```ts
   export function myCommand(arg: string): string {
     if (!arg.trim()) throw new Error("arg cannot be empty")
     return `got ${arg}`
   }
   ```

2. **Register it** in `electron/main.ts` inside `registerIpc()`:

   ```ts
   import { myCommand } from "./ipc/my-command"

   ipcMain.handle("my-command", (_event, arg: unknown) => {
     if (typeof arg !== "string") throw new Error("arg must be a string")
     return myCommand(arg)
   })
   ```

3. **Expose it** in `electron/preload.ts`:

   ```ts
   const electronAPI = {
     greet: (name: string) => ipcRenderer.invoke("greet", name),
     myCommand: (arg: string) => ipcRenderer.invoke("my-command", arg),
   } as const
   ```

4. **Augment the type** in `types/electron.d.ts`:

   ```ts
   declare global {
     interface Window {
       electronAPI?: {
         greet: (name: string) => Promise<string>
         myCommand: (arg: string) => Promise<string>
       }
     }
   }
   ```

5. **Add a typed wrapper** in `lib/electron.ts`:

   ```ts
   export async function myCommand(arg: string): Promise<string> {
     if (!window.electronAPI) {
       throw new Error("myCommand() invoked while not running in Electron")
     }
     return window.electronAPI.myCommand(arg)
   }
   ```

`lib/electron.ts` is the single point that calls `window.electronAPI` — business code imports named functions from it. Use `isElectron()` to gate any code path that depends on the desktop runtime.

## Available Scripts

### Frontend Scripts

| Command              | Description                                                    |
| -------------------- | -------------------------------------------------------------- |
| `pnpm dev`           | Start Next.js development server on port 3000                  |
| `pnpm build`         | Build Next.js app for production (outputs to `out/` directory) |
| `pnpm start`         | Start Next.js production server (after `pnpm build`)           |
| `pnpm lint`          | Run ESLint to check code quality                               |
| `pnpm lint:fix`      | Auto-fix ESLint issues                                         |
| `pnpm format`        | Format all files with Prettier                                 |
| `pnpm format:check`  | Check formatting without writing                               |
| `pnpm typecheck`     | Run TypeScript type-check (no emit)                            |
| `pnpm test`          | Run Jest unit tests                                            |
| `pnpm test:watch`    | Run Jest in watch mode                                         |
| `pnpm test:coverage` | Run Jest with coverage report                                  |

### Electron (Desktop) Scripts

| Command                       | Description                                           |
| ----------------------------- | ----------------------------------------------------- |
| `pnpm electron:dev`           | Start Next.js + Electron concurrently with hot reload |
| `pnpm electron:compile`       | Compile main+preload TypeScript → `dist-electron/`    |
| `pnpm electron:compile:watch` | Watch mode for the Electron compile step              |
| `pnpm electron:build`         | Build production installers for the current platform  |
| `pnpm electron:build:win`     | Build Windows installers (NSIS + MSI)                 |
| `pnpm electron:build:mac`     | Build macOS bundles (DMG + ZIP, x64 + arm64)          |
| `pnpm electron:build:linux`   | Build Linux packages (AppImage + deb)                 |

### Docs Site Scripts (Fumadocs — port 3001)

| Command           | Description                               |
| ----------------- | ----------------------------------------- |
| `pnpm docs:dev`   | Start Fumadocs dev server on port 3001    |
| `pnpm docs:build` | Build docs for production (`docs/.next/`) |
| `pnpm docs:start` | Start docs production server on port 3001 |

### Adding UI Components (shadcn/ui)

```bash
# Add a new component (e.g., Card)
pnpm dlx shadcn@latest add card

# Add multiple components
pnpm dlx shadcn@latest add button card dialog
```

## Project Structure

```
react-quick-starter/
├── app/                      # Next.js App Router (main app)
│   ├── layout.tsx           # Root layout with fonts and metadata
│   ├── page.tsx             # Main landing page
│   ├── globals.css          # Global styles and Tailwind config
│   └── favicon.ico          # App favicon
├── components/              # React components
│   └── ui/                  # shadcn/ui components (Button, etc.)
├── lib/                     # Utility functions
│   └── utils.ts            # Helper functions (cn, etc.)
├── public/                  # Static assets (images, SVGs)
├── electron/               # Electron desktop application
│   ├── main.ts             # Main process entry point (BrowserWindow, CSP, IPC)
│   ├── preload.ts          # contextBridge exposure of typed API to renderer
│   ├── ipc/                # Pure IPC handler functions (unit-testable)
│   │   └── greet.ts
│   ├── icons/              # App icons (ico, icns, png) for electron-builder
│   └── tsconfig.json       # CommonJS compile config (outputs to dist-electron/)
├── types/
│   └── electron.d.ts       # Renderer-side `Window.electronAPI` type augmentation
├── dist-electron/          # Compiled main+preload (gitignored)
├── release/                # electron-builder output: installers (gitignored)
├── docs/                    # Fumadocs documentation site (workspace package)
│   ├── app/                # Next.js App Router for docs
│   │   ├── layout.tsx      # Root layout with RootProvider
│   │   ├── page.tsx        # Redirect to /docs
│   │   ├── global.css      # Tailwind v4 + Fumadocs theme
│   │   ├── docs/           # Docs routes
│   │   │   ├── layout.tsx  # DocsLayout with sidebar
│   │   │   └── [[...slug]]/ # Dynamic MDX page
│   │   └── api/search/     # Orama search API route
│   ├── lib/source.ts       # Fumadocs content loader
│   ├── content/docs/       # MDX content files
│   ├── source.config.ts    # Content collection config
│   ├── next.config.ts      # Next.js config (no static export)
│   └── package.json        # Docs package dependencies
├── pnpm-workspace.yaml      # pnpm monorepo config
├── components.json          # shadcn/ui configuration
├── next.config.ts          # Next.js configuration (main app)
├── tsconfig.json           # TypeScript configuration
├── eslint.config.mjs       # ESLint configuration
└── package.json            # Root dependencies and scripts
```

## Configuration

### Environment Variables

Copy `.env.example` to `.env.local` to start:

```bash
cp .env.example .env.local
```

Then edit `.env.local` to fill in your values. The `lib/env.ts` module validates required vars at first access.

**Important**:

- Only variables prefixed with `NEXT_PUBLIC_` are exposed to the browser
- Never commit `.env.local` to version control
- Use `.env.example` to document required variables

### Electron Configuration

The desktop app is configured in two places:

**Window/lifecycle/IPC** — `electron/main.ts` (`createWindow()`):

```ts
const win = new BrowserWindow({
  width: 800,
  height: 600,
  title: "react-quick-starter",
  resizable: true,
  fullscreen: false,
  webPreferences: {
    preload: path.join(__dirname, "preload.js"),
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
  },
})
```

**Packaging** — the `build` block in `package.json` (electron-builder):

```jsonc
{
  "build": {
    "appId": "com.reactquickstarter.desktop",
    "productName": "react-quick-starter",
    "asar": true,
    "directories": { "output": "release", "buildResources": "electron/icons" },
    "files": ["dist-electron/**/*", "out/**/*", "package.json"],
    "win": {
      "target": [{ "target": "nsis" }, { "target": "msi" }],
      "icon": "electron/icons/icon.ico",
    },
    "mac": {
      "target": [
        { "target": "dmg", "arch": ["x64", "arm64"] },
        { "target": "zip", "arch": ["x64", "arm64"] },
      ],
      "icon": "electron/icons/icon.icns",
    },
    "linux": {
      "target": [{ "target": "AppImage" }, { "target": "deb" }],
      "icon": "electron/icons/icon.png",
    },
  },
}
```

### Path Aliases

Configured in `components.json` and `tsconfig.json`:

```typescript
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
```

Available aliases:

- `@/components` → `components/`
- `@/lib` → `lib/`
- `@/ui` → `components/ui/`
- `@/hooks` → `hooks/`
- `@/utils` → `lib/utils.ts`

### Tailwind CSS Configuration

The project uses Tailwind CSS v4 with:

- CSS variables for theming (defined in `app/globals.css`)
- Dark mode support via `class` strategy
- Custom color palette using CSS variables
- shadcn/ui styling system

## Building for Production

### Build Web Application

```bash
# Build static export
pnpm build

# Output directory: out/
# Deploy the out/ directory to any static hosting service
```

The build creates a static export in the `out/` directory, optimized for production.

### Build Desktop Application

```bash
# Build for current platform (NSIS+MSI on Windows, DMG+ZIP on macOS, AppImage+deb on Linux)
pnpm electron:build

# Output: release/
```

Platform-specific shortcuts:

```bash
pnpm electron:build:win    # Windows: NSIS + MSI
pnpm electron:build:mac    # macOS:   DMG + ZIP (x64 + arm64)
pnpm electron:build:linux  # Linux:   AppImage + deb
```

Direct electron-builder invocation (for advanced flags, e.g. `--publish=always`):

```bash
pnpm build && pnpm electron:compile && pnpm exec electron-builder --win --x64 --publish=never
```

## Deployment

### Docs Site Deployment

The docs site (`docs/`) is a full Next.js server application deployed independently from the main app.

```bash
# Build docs
pnpm docs:build

# Output: docs/.next/
# Deploy to any Node.js host: Vercel, Netlify, Railway, etc.
```

On **Vercel**, set the root directory to `docs/` when importing the project.

### Web Deployment

#### Vercel (Recommended)

1. Push your code to GitHub/GitLab/Bitbucket
2. Import project on [Vercel](https://vercel.com/new)
3. Vercel auto-detects Next.js and deploys

#### Netlify

```bash
# Build command
pnpm build

# Publish directory
out
```

#### Static Hosting (Nginx, Apache, etc.)

1. Build the project: `pnpm build`
2. Upload the `out/` directory to your server
3. Configure server to serve static files

### Desktop Deployment

#### Windows

- Distribute `.exe` (NSIS, recommended) or `.msi` from `release/`
- Users run the installer; NSIS is configured with `oneClick: false` and `allowToChangeInstallationDirectory: true`

#### macOS

- Distribute the `.dmg` from `release/`
- Users drag the app to Applications folder
- **Note**: For distribution outside the App Store, sign the app with a Developer ID Application certificate. Configure under `build.mac.hardenedRuntime`/`build.mac.entitlements` in `package.json` and provide signing secrets via env (see `CI_CD.md`).

#### Linux

- Distribute the `.AppImage` from `release/`
- Users make it executable and run: `chmod +x app.AppImage && ./app.AppImage`
- Alternative format: `.deb` (Debian/Ubuntu) — also produced

#### Code Signing (Recommended for Production)

- **Windows**: Provide `CSC_LINK` (PFX) + `CSC_KEY_PASSWORD` env vars (or configure under `build.win` in `package.json`)
- **macOS**: Requires an Apple Developer account; provide `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID` for notarization
- **Linux**: Optional

See the [electron-builder Code Signing Guide](https://www.electron.build/code-signing) for detailed instructions.

## Development Workflow

### Typical Development Cycle

1. **Start development server**

   ```bash
   pnpm dev  # For web development
   # or
   pnpm electron:dev  # For desktop development
   ```

2. **Make changes**
   - Edit files in `app/`, `components/`, or `lib/`
   - Changes auto-reload in the browser/desktop app

3. **Add new components**

   ```bash
   pnpm dlx shadcn@latest add [component-name]
   ```

4. **Lint your code**

   ```bash
   pnpm lint
   ```

5. **Build and test**

   ```bash
   pnpm build           # Test web/static-export build
   pnpm electron:build  # Test desktop build for current platform
   ```

### Best Practices

- **Code Style**: Follow ESLint rules (`pnpm lint`)
- **Commits**: Conventional Commits are enforced via the `commit-msg` hook (commitlint). After cloning, run `pnpm install` once — the `prepare` script auto-installs the hooks.
- **Components**: Keep components small and reusable
- **State**: Use Zustand for global state, React hooks for local state
- **Styling**: Use Tailwind utility classes, avoid custom CSS when possible
- **Types**: Leverage TypeScript for type safety

## Troubleshooting

### Common Issues

**Port 3000 already in use**

```bash
# Kill the process using port 3000
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

**Electron build fails**

```bash
# Most failures come from a stale install or missing compiled main process.
# Clean and rebuild:
rm -rf node_modules dist-electron release
pnpm install
pnpm electron:compile
pnpm electron:build
```

**Module not found errors**

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall all workspace dependencies
rm -rf node_modules docs/node_modules pnpm-lock.yaml
pnpm install
```

**`Cannot find module 'collections/server'` in docs**

This module is auto-generated by fumadocs-mdx. Run the docs dev server once to generate it:

```bash
pnpm docs:dev
```

## Learn More

### Next.js Resources

- [Next.js Documentation](https://nextjs.org/docs) - Learn about Next.js features and API
- [Learn Next.js](https://nextjs.org/learn) - Interactive Next.js tutorial
- [Next.js GitHub](https://github.com/vercel/next.js) - Next.js repository

### Electron Resources

- [Electron Documentation](https://www.electronjs.org/docs/latest) - Official Electron documentation
- [electron-builder Documentation](https://www.electron.build/) - Packaging & code-signing guide
- [Electron GitHub](https://github.com/electron/electron) - Electron repository

### UI & Styling

- [shadcn/ui](https://ui.shadcn.com/) - Component library documentation
- [Tailwind CSS](https://tailwindcss.com/docs) - Tailwind CSS documentation
- [Radix UI](https://www.radix-ui.com/) - Radix UI primitives

### State Management

- [Zustand](https://zustand-demo.pmnd.rs/) - Zustand documentation

### Documentation

- [Fumadocs](https://fumadocs.dev/) - Fumadocs documentation framework

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

If you encounter any issues or have questions:

- Check the [Troubleshooting](#troubleshooting) section
- Review [Next.js Documentation](https://nextjs.org/docs)
- Review [Electron Documentation](https://www.electronjs.org/docs/latest)
- Review [electron-builder Documentation](https://www.electron.build/)
- Open an issue on GitHub
