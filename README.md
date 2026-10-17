# ByteMap

A fast, private desktop app to see where your disk space actually went. Built with Tauri 2, Rust, React, and Tailwind.

Most disk analyzers either feel like Windows 98 software or Electron bloatware that writes gigabytes of SQLite caches to your SSD. ByteMap is built differently: it traverses your filesystem with native Rust threads, keeps all scan results in memory, renders an interactive squarified treemap, and wipes everything the moment you close the window. Zero database, zero telemetry, 100% offline.

---

## Why I Built This

I wanted a utility that answers basic questions quickly:
- Which folders are hogging my drive?
- What file types take up the most space?
- Where are the 2GB+ video files and old zip archives I forgot about?
- Are there duplicate files eating up space that I can safely delete?
- Can I safely move junk to the Recycle Bin instead of running a permanent `rm`?

And I wanted it to run fast without leaving stale indexes or tracking databases on my machine.

---

## What It Does

- **Real Drive Discovery**: Reads actual system partitions using native OS APIs (`sysinfo`), showing total, used, and free capacity for NTFS, FAT32, APFS, and ext4 drives.
- **Fast Traversal Engine**: Walks directories asynchronously on a worker thread with `walkdir`. Throttles progress events to ~80ms intervals so the UI never stutters or drops frames.
- **Interactive Squarified Treemap**: Visualizes directory hierarchies as nested rectangles. Click into any folder to drill down, use breadcrumbs to jump back, and filter by size or name.
- **Explorer & Large Files View**: Browse files in a sortable, paginated table (50 items/page) or filter large files by configurable thresholds (10MB to 5GB+). Includes a button to reveal the file in Explorer/Finder.
- **File Type Analytics**: Groups files into categories (video, audio, image, documents, code, archives, apps, games) and shows top extensions by byte size.
- **3-Stage Duplicate Finder**: Compares files by exact size first, then hashes the first 4KB prefix, and only runs a full BLAKE3 cryptographic hash on genuine collision candidates. Doesn't guess based on filename alone.
- **Safe Cleanup**: Flags common candidates (old installers, temp files, large archives, duplicates) with risk indicators. Never deletes anything automatically. Every cleanup action asks for confirmation and defaults to moving files to your OS Recycle Bin / Trash.
- **No Database Policy**: No SQLite, no IndexedDB, no LocalStorage cache. Scan data lives strictly in RAM while the app is open. When you quit, it's gone.

---

## Tech Stack

- **Backend**: Rust 2021, Tauri 2, `walkdir`, `blake3`, `sysinfo`, `trash`, `rayon`
- **Frontend**: React 19, TypeScript (strict mode), Vite, Tailwind CSS, Recharts, Zustand, Lucide icons
- **Testing**: Vitest, React Testing Library

---

## Development Setup

### Prerequisites

1. **Node.js** (v20+ recommended) and **pnpm**:
   ```bash
   corepack enable
   corepack prepare pnpm@latest --activate
   ```
2. **Rust**:
   Install via [rustup.rs](https://rustup.rs).
3. **C++ Build Tools**:
   - **Windows**: Visual Studio C++ Build Tools (or LLVM + Windows SDK).
   - **macOS**: `xcode-select --install`
   - **Linux**: `libwebkit2gtk-4.1-dev`, `build-essential`, `curl`, `wget`

### Installation

```bash
# Clone the repository
git clone https://github.com/ankitpandey1900/ByteMap.git
cd ByteMap

# Install frontend packages
pnpm install
```

### Running Locally

```bash
# Start Vite and launch the Tauri desktop window
pnpm tauri dev
```

### Running Tests

```bash
# Run Vitest unit & component tests
pnpm test
```

### Building the Standalone App

```bash
# Builds frontend assets and outputs native installer (.msi / .exe on Windows)
pnpm tauri build
```

---

## How It Handles Safety & Privacy

1. **Path Validation**: Before any deletion, the backend canonicalizes the target path and confirms it sits strictly inside the directory you chose to scan. You cannot traverse out with `../`.
2. **System Guard**: Hardcoded rules block destructive actions against `C:\Windows`, `C:\Program Files`, `/usr`, `/bin`, root drives, and other OS directories.
3. **Target Recheck**: Right before deleting or trashing a file, the backend verifies that the file still exists and that its byte length matches the scan snapshot. If the file was modified in the background, ByteMap refuses to touch it.
4. **Recycle Bin by Default**: Deletions use the native system trash API via the `trash` crate so you can undo mistakes.
5. **Zero Outbound Traffic**: The app doesn't send telemetry, analytics, or file metadata anywhere. Local scanning works completely offline.

---

## Known Quirks & Limitations

- **System Volume Information & Permission Errors**: On Windows, scanning `C:\` will encounter restricted system folders like `System Volume Information`. ByteMap catches these `PermissionDenied` errors without crashing and lists them under scan errors. To scan system folders, run the app as Administrator.
- **Memory Usage on Massive Drives**: Because all file metadata lives in RAM during a scan, scanning a drive with over 1,000,000 files will take around 150MB–250MB of RAM. Once you clear the scan, that memory is freed.

---

## License

MIT
