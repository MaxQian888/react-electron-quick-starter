# Copilot Instructions for react-quick-starter

## Project Architecture

This is a **Next.js 16 (App Router) + Electron hybrid desktop application** combining:

- **Frontend**: React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui components
- **Desktop wrapper**: Electron + electron-builder, main process written in TypeScript
- **State management**: Zustand (configured but not actively used in starter)

### Dual Runtime Model

1. **Web mode** (`pnpm dev`): Next.js dev server at http://localhost:3000
2. **Desktop mode** (`pnpm electron:dev`): Concurrently runs `next dev` and Electron; main process loads `http://localhost:3000`. In production builds, Electron loads the static export at `out/index.html` over `file://`.

The renderer uses Next.js `output: "export"` so production builds produce a static `out/` that Electron can ship inside the bundled app.

## Key File Locations & Conventions

### Routing & Layouts

- `app/layout.tsx`: Root layout, configures Geist fonts via `next/font/google`, imports `globals.css`
- `app/page.tsx`: Home route demonstrating Tailwind + `next/image` usage
- Path alias: `@/*` maps to repo root (e.g., `@/lib/utils`)

### Styling System

- **Tailwind v4** via PostCSS plugin (`@tailwindcss/postcss`)
- `app/globals.css`:
  - Imports `tailwindcss` and `tw-animate-css`
  - Defines CSS variables for theme colors (oklch color space)
  - Uses `@theme inline` to map CSS vars to Tailwind utilities
  - Custom dark mode variant: `@custom-variant dark (&:is(.dark *))`
- Color system: All colors defined as CSS variables (light + `.dark` overrides)

### Component Patterns

- **shadcn/ui components** in `components/ui/`
- Example: `components/ui/button.tsx` uses:
  - `@radix-ui/react-slot` for `asChild` polymorphism
  - `class-variance-authority` for variant management
  - `cn()` utility from `@/lib/utils` (clsx + tailwind-merge)
- Config: `components.json` defines shadcn settings (New York style, RSC mode)

### Electron Integration

- `electron/main.ts`: Main process — creates `BrowserWindow` (800×600), wires CSP, registers `ipcMain.handle('greet', ...)`. Loads `http://localhost:3000` when `ELECTRON_START_URL` is set, otherwise loads `out/index.html` from `app.getAppPath()`.
- `electron/preload.ts`: Uses `contextBridge.exposeInMainWorld('electronAPI', {...})` to expose a typed API to the renderer. The renderer never touches `ipcRenderer` directly.
- `electron/ipc/greet.ts`: Pure IPC handler — unit-testable.
- `electron/tsconfig.json`: Compiles main + preload to `dist-electron/` (CommonJS).
- `lib/electron.ts`: SOLE caller of `window.electronAPI` from the renderer side. Business code imports named functions from here.
- `types/electron.d.ts`: Augments `Window` with `electronAPI` typing.
- `package.json` `build` block: `electron-builder` config (NSIS+MSI on Windows, DMG+ZIP on macOS, AppImage+deb on Linux).

## Developer Workflows

### Package Management

**Always use pnpm** (lockfile present). Commands:

- `pnpm install` - Install dependencies
- `pnpm dev` - Next.js dev server (web-only)
- `pnpm electron:dev` - Desktop app with hot reload (concurrently runs Next.js + Electron)
- `pnpm build` - Next.js production build (static export to `out/`)
- `pnpm electron:build` - Build desktop installers (calls `pnpm build` + `pnpm electron:compile` + `electron-builder`)
- `pnpm electron:build:win|mac|linux` - Platform-specific build

### Code Quality

- **Type checking**: `pnpm typecheck` (strict mode enabled; `electron/` has its own tsconfig)
- **Linting**: `pnpm lint` (ESLint flat config with `eslint-config-next`)
  - Auto-fix: `pnpm lint:fix`
- **Tests**: `pnpm test` (Jest + RTL); coverage thresholds 60/60/70/70

### Adding shadcn/ui Components

Use the shadcn CLI: `pnpm dlx shadcn@latest add <component-name>`

- Components install to `components/ui/`
- Automatically uses configured aliases and style

## Project-Specific Patterns

### Import Paths

Always use `@/` alias for internal imports:

```typescript
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
```

### Component Composition

Prefer composition patterns with `asChild` for buttons/links:

```tsx
<Button asChild>
  <Link href="/path">Click me</Link>
</Button>
```

### Dark Mode

- Class-based dark mode (not media query)
- Apply `.dark` class to parent element
- All color utilities automatically support dark variants via custom variant

### Styling Utilities

- Use `cn()` from `@/lib/utils` to merge Tailwind classes safely
- Example: `cn("base-classes", conditionalClass && "conditional-classes", className)`

### Electron IPC

- Pattern for adding a new IPC command:
  1. Pure handler in `electron/ipc/<name>.ts` (testable in isolation).
  2. Register via `ipcMain.handle('<name>', ...)` in `electron/main.ts`'s `registerIpc()`.
  3. Expose in `electron/preload.ts` via `contextBridge.exposeInMainWorld('electronAPI', { ..., <name>: (args) => ipcRenderer.invoke('<name>', args) })`.
  4. Add typed wrapper in `lib/electron.ts` using `window.electronAPI.<name>`.
  5. Update `types/electron.d.ts` with the new method signature.
- Always gate desktop-only renderer code behind `isElectron()` so the same component works in both web and desktop modes.

## Known Configuration Notes

- **ESLint**: Flat config format with Next.js core-web-vitals + TypeScript rules
- **TypeScript**: Strict mode, bundler module resolution, JSX set to `react-jsx`. Root `tsconfig.json` excludes `electron/`, `dist-electron/`, `release/`, `docs/`.
- **Next.js config**: `output: "export"`, `images.unoptimized: true` so the static export works inside Electron.
- **No native toolchain required**: Pure Node.js + pnpm. Electron downloads its own Chromium binary on `pnpm install` (`electron` is allow-listed in `pnpm.onlyBuiltDependencies`).
