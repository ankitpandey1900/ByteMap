# ByteMap — Desktop Storage Intelligence

**ByteMap** is a high-performance, local-first desktop storage intelligence utility built with **Tauri 2**, **Rust**, **React**, and **TypeScript**. It empowers users to understand, visualize, analyze, and safely clean up disk space across their local drives without sacrificing privacy or performance.

---

## Key Features

- **Genuine Native Drive Discovery**: Detects real physical drives, mount points, file systems (NTFS, FAT32, APFS, ext4), and accurately reports physical capacity versus scanned file volumes.
- **High-Performance Rust Scanner**: Non-blocking directory traversal with throttled event streaming, incremental rollup aggregation, and error recovery for restricted or inaccessible directories.
- **Interactive Squarified Treemap**: Dynamic hierarchical storage treemap featuring instant drill-down navigation, breadcrumbs, search, size filters, and category-tailored color schemes.
- **File Explorer & Large Files Ranking**: Paginated, sortable directory exploration with configurable size thresholds (10MB to 5GB+), sorting, and safe native file manager reveal (`reveal_in_folder`).
- **File-Type Analytics**: Multi-category breakdown (Video, Image, Audio, Document, Archive, App, Dev, Game, Other) and top-extension aggregation.
- **Staged Duplicate Detection**: Three-stage verification pipeline (Size Grouping -> 4KB Prefix Hash -> Full BLAKE3 Cryptographic Hash) that never assumes duplicates from file names or sizes alone.
- **Safe Cleanup Intelligence**: Transparent, conservative recommendations (Old installers, temp caches, large archives, duplicate copies) with risk scoring, two-step confirmation, and native OS Recycle Bin / Trash integration.
- **Strict No-Database & Privacy-First**: 100% memory-only storage for active scans. Zero SQLite, IndexedDB, or hidden file caches. Zero external telemetry or cloud uploads.

---

## Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Desktop Shell** | [Tauri 2](https://v2.tauri.app/) | Secure, lightweight desktop runtime with restrictive CSP |
| **Backend Engine** | [Rust](https://www.rust-lang.org/) | Filesystem traversal (`walkdir`), cryptographic hashing (`blake3`), storage telemetry (`sysinfo`), and safe recycling (`trash`) |
| **Frontend Framework** | [React 19](https://react.dev/) & [TypeScript](https://www.typescriptlang.org/) | Component-driven UI with strict type verification |
| **Styling & Design** | [Tailwind CSS](https://tailwindcss.com/) & Vanilla CSS | Bespoke developer-tool dark/light design system with smooth micro-animations |
| **Visualizations** | Interactive SVG Treemap & [Recharts](https://recharts.org/) | Squarified storage treemap and responsive pie/bar charts |
| **State Management** | [Zustand](https://github.com/pmndrs/zustand) | Lightweight, ephemeral in-memory UI state |
| **Testing** | [Vitest](https://vitest.dev/) & [React Testing Library](https://testing-library.com/) | Unit, integration, and component testing |

---

## Prerequisites

- **Node.js**: `v20+` or `v24+`
- **pnpm**: `v9+` or `v11+`
- **Rust Toolchain**: `stable` (1.80+) with `cargo`
- **Platform C++ Build Tools**:
  - **Windows**: Microsoft Visual Studio C++ Build Tools with Windows 10/11 SDK or LLVM / MSVC toolchain
  - **macOS**: Xcode Command Line Tools
  - **Linux**: `libwebkit2gtk-4.1-dev`, `build-essential`, `curl`, `wget`, `file`, `libssl-dev`, `libgtk-3-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`

---

## Getting Started

### 1. Install Node Dependencies

```bash
pnpm install
```

### 2. Run in Development Mode

```bash
# Starts Vite dev server and launches Tauri window
pnpm tauri dev
```

### 3. Run Automated Tests

```bash
# Run Vitest test suite
pnpm test
```

### 4. Build Production Bundle

```bash
# Compiles frontend assets and produces native desktop installers
pnpm tauri build
```

---

## Core Architecture Principles

1. **Strict No-Database Policy**: All scan results live strictly in memory while running. No SQLite, MongoDB, IndexedDB, or LocalStorage persistence layers exist.
2. **Safe Deletion Protocol**: Files are never deleted automatically. Any deletion requires explicit user selection, separate confirmation, and path re-validation against the active scan root.
3. **OS Trash Integration**: Cleanup preferentially moves files to the OS Recycle Bin (`trash` crate), allowing trivial recovery.
4. **Local & Offline**: ByteMap operates completely offline with zero network connectivity requirements.

---

## License

MIT License. Designed and engineered for high-performance desktop storage management.
