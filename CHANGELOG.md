# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **BREAKING**: Replaced Tauri 2.9 desktop runtime with Electron + electron-builder.
  - Renamed IPC bridge files: `lib/tauri.ts` → `lib/electron.ts`,
    `components/tauri-demo.tsx` → `components/electron-demo.tsx`.
  - Replaced `pnpm tauri dev` / `pnpm tauri build` with `pnpm electron:dev` / `pnpm electron:build` (and platform-specific `electron:build:win|mac|linux`).
  - Removed the `src-tauri/` Rust workspace; main process is now TypeScript in `electron/` (compiled to `dist-electron/` via `pnpm electron:compile`).
  - Removed the Rust toolchain prerequisite — Node.js + pnpm is now sufficient.
  - i18n: renamed `tauriDemo` namespace → `electronDemo`; updated home-page subtitle.

### Removed

- `@tauri-apps/api`, `@tauri-apps/cli` dependencies.
- `.github/workflows/build-tauri.yml` (replaced by `build-electron.yml`).
- `tauri-apps.tauri-vscode` recommended extension and Tauri-specific debug configurations in `.vscode/`.
- Cargo dependabot ecosystem and `.editorconfig` Rust/TOML rules.

### Notes

- Historical Tauri references in `docs/superpowers/` are kept as a project-history archive.

### Added

- Initial project setup with Next.js 16 and React 19
- Tailwind CSS v4 with CSS variables and dark mode support
- shadcn/ui component library with Radix UI primitives
- Zustand for lightweight state management
- Geist Font optimized with next/font
- TypeScript configuration with strict mode
- ESLint configuration for code quality
- Jest and React Testing Library for testing
- GitHub Actions CI/CD pipeline
  - Quality checks (ESLint, TypeScript, security audit)
  - Test suite with coverage reporting
  - Electron desktop builds for Windows, macOS, and Linux
  - Release workflow for version tags

### Documentation

- Comprehensive README with installation and usage instructions
- Chinese documentation (README_zh.md)
- CI/CD setup guide (CI_CD.md)
- Testing guide (TESTING.md)
- AI assistant instructions (AGENTS.md, CLAUDE.md, GEMINI.md)

## [0.1.0] - 2024-01-28

### Added

- Initial release
- Next.js 16 App Router setup
- React 19 with new features support
- Tauri 2.9 desktop wrapper (replaced with Electron in [Unreleased])
- Basic UI components (Button)
- Project structure and configuration

[Unreleased]: https://github.com/AstroAir/react-quick-starter/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/AstroAir/react-quick-starter/releases/tag/v0.1.0
