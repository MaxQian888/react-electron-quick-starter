# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

React + Electron desktop application starter: Next.js 16 (React 19) + Electron + electron-builder + TypeScript + Tailwind CSS v4 + shadcn/ui + Zustand.

**Dual Runtime Model:**

- **Web mode** (`pnpm dev`): Next.js dev server at <http://localhost:3000>
- **Desktop mode** (`pnpm electron:dev`): Concurrently starts Next.js + Electron; the main process loads `http://localhost:3000` in dev and `out/index.html` over `file://` in production builds.

## Development Commands

```bash
# Frontend (main app — port 3000)
pnpm dev              # Start Next.js dev server
pnpm build            # Build for production (outputs to out/)
pnpm lint             # Run ESLint
pnpm lint:fix         # Auto-fix ESLint issues
pnpm format           # Format with Prettier
pnpm format:check     # Check formatting without writing
pnpm typecheck        # TypeScript --noEmit

# Testing
pnpm test             # Run Jest tests
pnpm test:watch       # Run tests in watch mode
pnpm test:coverage    # Run tests with coverage report

# Desktop (Electron)
pnpm electron:dev          # Concurrent Next.js + Electron dev with hot reload
pnpm electron:compile      # Compile main+preload TS → dist-electron/
pnpm electron:build        # Build current platform installers (release/)
pnpm electron:build:win    # Windows: NSIS + MSI
pnpm electron:build:mac    # macOS: DMG + ZIP (x64 + arm64)
pnpm electron:build:linux  # Linux: AppImage + deb

# Docs site (pnpm workspace — port 3001)
pnpm docs:dev         # Start Fumadocs dev server
pnpm docs:build       # Build docs for production
pnpm docs:start       # Start docs production server

# Add shadcn/ui components
pnpm dlx shadcn@latest add <component-name>
```

## Architecture

### Workspace Structure

This is a **pnpm monorepo** with two packages:

| Package  | Path       | Port | Purpose                                             |
| -------- | ---------- | ---- | --------------------------------------------------- |
| Main app | `/` (root) | 3000 | Next.js + Electron desktop app (`output: "export"`) |
| Docs     | `docs/`    | 3001 | Fumadocs documentation site (full server mode)      |

Root `pnpm-lock.yaml` is the single lockfile for all packages. Run `pnpm install` from the repo root.

### Frontend Structure (main app)

- `app/` - Next.js App Router (layout.tsx, page.tsx, globals.css)
- `components/ui/` - All 57 shadcn/ui components pre-installed (**no test files here**)
- `hooks/` - Shared hooks (e.g., `use-mobile.ts`)
- `lib/utils.ts` - `cn()` utility (clsx + tailwind-merge)

### Docs Structure (`docs/`)

- `docs/app/` - Next.js App Router for the docs site
  - `docs/app/layout.tsx` - Root layout with `RootProvider` (from `fumadocs-ui/provider/next`)
  - `docs/app/docs/layout.tsx` - `DocsLayout` with sidebar
  - `docs/app/docs/[[...slug]]/page.tsx` - Dynamic MDX page
  - `docs/app/api/search/route.ts` - Orama full-text search
- `docs/lib/source.ts` - Fumadocs loader (imports from `collections/server`)
- `docs/source.config.ts` - Content collection definition
- `docs/content/docs/` - MDX content files and `meta.json` sidebar config
- `docs/.source/` - **Auto-generated** by fumadocs-mdx at dev/build time (gitignored)

**Docs-specific import conventions:**

- Source loader: `import { source } from "@/lib/source"` (NOT `@/app/source`)
- Collection output: `import { docs } from "collections/server"` (tsconfig alias → `.source/`)
- Provider: `fumadocs-ui/provider/next` (NOT `fumadocs-ui/provider`)

### Installed shadcn/ui Components

All components are pre-installed — import directly, do not run `shadcn add` for these:

`accordion` · `alert` · `alert-dialog` · `aspect-ratio` · `avatar` · `badge` · `breadcrumb` · `button` · `button-group` · `calendar` · `card` · `carousel` · `chart` · `checkbox` · `collapsible` · `combobox` · `command` · `context-menu` · `dialog` · `direction` · `drawer` · `dropdown-menu` · `empty` · `field` · `form` · `hover-card` · `input` · `input-group` · `input-otp` · `item` · `kbd` · `label` · `menubar` · `native-select` · `navigation-menu` · `pagination` · `popover` · `progress` · `radio-group` · `resizable` · `scroll-area` · `select` · `separator` · `sheet` · `sidebar` · `skeleton` · `slider` · `sonner` · `spinner` · `switch` · `table` · `tabs` · `textarea` · `toggle` · `toggle-group` · `tooltip`

`TooltipProvider` is already mounted in `app/layout.tsx` — no extra wrapper needed.

### Electron Integration

- `electron/main.ts` - Main process: `BrowserWindow` (800×600), CSP via `session.webRequest.onHeadersReceived`, IPC handlers via `ipcMain.handle`. Loads `process.env.ELECTRON_START_URL` (dev) or `out/index.html` from `app.getAppPath()` (prod).
- `electron/preload.ts` - `contextBridge.exposeInMainWorld('electronAPI', {...})` exposes a typed surface to the renderer; `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`.
- `electron/ipc/<name>.ts` - Pure IPC handlers, unit-testable.
- `electron/tsconfig.json` - Compiles main + preload to `dist-electron/` (CommonJS).
- `lib/electron.ts` - SOLE caller of `window.electronAPI` from the renderer.
- `types/electron.d.ts` - Augments global `Window` with `electronAPI` typing.
- `package.json` `build` block - electron-builder config (NSIS+MSI on Windows, DMG+ZIP on macOS, AppImage+deb on Linux). Output goes to `release/`.

### Styling System

- **Tailwind v4** via PostCSS (`@tailwindcss/postcss`)
- CSS variables for theme colors (oklch color space) in `globals.css`
- Dark mode: class-based (apply `.dark` to parent element)
- Custom variant: `@custom-variant dark (&:is(.dark *))`

### Path Aliases

`@/components`, `@/lib`, `@/utils`, `@/ui`, `@/hooks` - all configured in tsconfig.json and components.json

## Code Patterns

```tsx
// Always use cn() for conditional classes
import { cn } from "@/lib/utils"
cn("base-classes", condition && "conditional", className)

// Button composition with asChild
<Button asChild>
  <Link href="/path">Click me</Link>
</Button>
```

```tsx
// Calling the Electron main process from the frontend — see lib/electron.ts
import { greet, isElectron } from "@/lib/electron"
if (isElectron()) {
  greet("World").then((msg) => console.log(msg))
}
```

## Critical Notes

- **Always use pnpm** (lockfile present); run `pnpm install` from repo root to install all workspaces
- **Electron production builds require static export**: `next.config.ts` (main app) has `output: "export"` so the main process can `loadFile('out/index.html')` — do not remove it
- **Docs does NOT use static export**: `docs/next.config.ts` is full server mode — keep them separate
- **No Rust/native toolchain required**: pure Node.js + pnpm. Electron downloads its own Chromium binary (whitelisted via `pnpm.onlyBuiltDependencies`).
- **`electron/` is its own TypeScript project**: root `tsconfig.json` excludes it; main+preload are compiled by `pnpm electron:compile` using `electron/tsconfig.json` (CommonJS, outputs to `dist-electron/`).
- **Docs `.source/` is generated**: run `pnpm docs:dev` or `pnpm docs:build` once before TypeScript resolves `collections/server`
- shadcn/ui configured with "new-york" style and RSC mode
