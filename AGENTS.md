# Repository Guidelines

## Project Structure & Module Organization

This is a **pnpm monorepo** (`pnpm-workspace.yaml`) with two packages:

| Package  | Root    | Port | Build output                                       |
| -------- | ------- | ---- | -------------------------------------------------- |
| Main app | `/`     | 3000 | `out/` (static export, loaded by Electron in prod) |
| Docs     | `docs/` | 3001 | `docs/.next/` (server mode, deploy separately)     |

Run `pnpm install` from repo root — single `pnpm-lock.yaml` covers all packages.

### Main app (`/`)

- `app/` Next.js App Router (routes: `page.tsx`, `layout.tsx`, global styles in `globals.css`).
- `components/ui/` shadcn/ui components — **do not add test files here**. All 57 components are pre-installed (see list below).
- `lib/` Shared utilities (e.g., `lib/utils.ts`, `lib/electron.ts` IPC wrapper).
- `hooks/` Shared hooks (e.g., `hooks/use-mobile.ts`).
- `public/` Static assets (SVGs, icons).
- `electron/` Electron desktop wrapper — TypeScript main process (`main.ts`), preload script (`preload.ts`), IPC handlers (`ipc/`), build icons (`icons/`), and isolated `tsconfig.json` (compiles to `dist-electron/`).
- `types/electron.d.ts` Renderer-side `Window.electronAPI` type augmentation.
- Root configs: `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`, `components.json`.

### Docs site (`docs/`)

- `docs/app/` Next.js App Router for Fumadocs.
- `docs/lib/source.ts` Fumadocs content loader — import as `@/lib/source`.
- `docs/source.config.ts` Content collection config (points to `content/docs/`).
- `docs/content/docs/` MDX files + `meta.json` sidebar config.
- `docs/.source/` **Auto-generated** at dev/build time (gitignored). Contains `collections/server` module.
- `docs/postcss.config.mjs` + Tailwind v4 CSS in `docs/app/global.css`.

**Critical docs import rules:**

- Always `import { source } from "@/lib/source"` — never `@/app/source`.
- Always `import { RootProvider } from "fumadocs-ui/provider/next"` — not `fumadocs-ui/provider`.
- `collections/server` resolves via tsconfig path alias to `docs/.source/server`. TypeScript errors here mean `.source/` hasn't been generated yet — run `pnpm docs:dev` once.

### Installed shadcn/ui Components

All components are pre-installed in `components/ui/`. Import directly — do **not** run `shadcn add` for these:

`accordion` · `alert` · `alert-dialog` · `aspect-ratio` · `avatar` · `badge` · `breadcrumb` · `button` · `button-group` · `calendar` · `card` · `carousel` · `chart` · `checkbox` · `collapsible` · `combobox` · `command` · `context-menu` · `dialog` · `direction` · `drawer` · `dropdown-menu` · `empty` · `field` · `form` · `hover-card` · `input` · `input-group` · `input-otp` · `item` · `kbd` · `label` · `menubar` · `native-select` · `navigation-menu` · `pagination` · `popover` · `progress` · `radio-group` · `resizable` · `scroll-area` · `select` · `separator` · `sheet` · `sidebar` · `skeleton` · `slider` · `sonner` · `spinner` · `switch` · `table` · `tabs` · `textarea` · `toggle` · `toggle-group` · `tooltip`

`TooltipProvider` is already mounted in `app/layout.tsx` — no extra wrapper needed.

## Build, Test, and Development Commands

```bash
# Main app (port 3000)
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
pnpm electron:build        # Build current-platform installers (release/)
pnpm electron:build:win    # Windows: NSIS + MSI
pnpm electron:build:mac    # macOS: DMG + ZIP (x64 + arm64)
pnpm electron:build:linux  # Linux: AppImage + deb

# Docs site (port 3001) — pnpm workspace package at docs/
pnpm docs:dev         # Start Fumadocs dev server (also generates docs/.source/)
pnpm docs:build       # Build docs for production
pnpm docs:start       # Start docs production server

# Add shadcn/ui components (main app only)
pnpm dlx shadcn@latest add <component-name>
```

## Coding Style & Naming Conventions

- Language: TypeScript with React 19 and Next.js 16.
- Linting: `eslint.config.mjs` is the source of truth; keep code warning-free.
- Styling: Tailwind CSS v4 (utility-first). Co-locate minimal component-specific styles.
- Components: PascalCase names/exports; files in `components/ui/` mirror export names.
- Routes: Next app files are lowercase (`page.tsx`, `layout.tsx`).
- Code: camelCase variables/functions; hooks start with `use*`.

## Testing Guidelines

- No test runner is configured yet. Recommended: Vitest (unit) and Playwright (e2e).
- Name tests `*.test.ts`/`*.test.tsx`; co-locate next to source or in `tests/`.
- Prioritize `lib/` utilities and complex UI logic for coverage.
- **Never add test files inside `components/ui/`** — those are vendored shadcn/ui files.

## Commit & Pull Request Guidelines

- Prefer Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, `ci:`.
- Link issues in the footer: `Closes #123`.
- PRs should include: brief scope/intent, screenshots for UI changes, validation steps, and pass `pnpm lint`.
- Keep changes focused; avoid unrelated refactors.

## Security & Configuration Tips

- Use `.env.local` for secrets; do not commit `.env*` files.
- Only expose safe client values via `NEXT_PUBLIC_*`.
- Electron: keep `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false` in `electron/main.ts`. Add IPC commands explicitly (no broad bridges). Tighten the CSP in `PROD_CSP`/`DEV_CSP` if you add external origins.
