# ByteMap Architecture Notes

Here is how ByteMap is organized under the hood, why certain tech choices were made, and how data moves between the Rust backend and the React frontend.

> 💡 **Looking for complete diagrams, sequence charts, and subsystem workflows?**  
> Check out the complete [System Design Specification](SYSTEM_DESIGN.md) for detailed Mermaid diagrams, TOCTOU security flows, and duplicate detection funnels.

---

## High-Level Picture

```
+-----------------------------------------------------------------------+
| React 19 Frontend                                                     |
|                                                                       |
|  [Sidebar / Navigation]  [Header & Target Path]  [Scan Progress Modal]|
|                                                                       |
|  Views:                                                               |
|  - Overview Dashboard (Recharts + Embedded Treemap)                   |
|  - Drives View (Cards with capacity bars)                             |
|  - Explore (Paginated table, 50 rows/page)                            |
|  - Large Files (>100MB filter, sort by size/date)                     |
|  - File Types (Categories + Extension breakdown)                      |
|  - Duplicates (On-demand staged BLAKE3 verification)                  |
|  - Cleanup Hub (Risk ratings + two-step confirmation)                 |
|  - Settings (Units, theme, exclusions, JSON/CSV exports)              |
|                                                                       |
|  State: useAppStore (Zustand, 100% ephemeral in-memory)               |
+-----------------------------------▲-----------------------------------+
                                    │
                       Tauri 2 IPC (Commands & Events)
                                    │
+-----------------------------------▼-----------------------------------+
| Rust Backend (src-tauri/src/)                                         |
|                                                                       |
|  commands/       Tauri command handlers exposed to frontend           |
|  scanner/        WalkDir directory traversal & rollup aggregation     |
|  drives/         Physical drive discovery using sysinfo::Disks        |
|  duplicates/     3-stage duplicate detector (Size -> 4KB -> BLAKE3)   |
|  cleanup/        Safe file removal via trash::delete or remove_file   |
|  security/       PathValidator: canonicalization & system path guards |
|  models/         Serde data structs shared over IPC                   |
|  errors/         Typed error enum (AppError)                          |
+-----------------------------------------------------------------------+
```

---

## Why Tauri 2 instead of Electron?

1. **Binary Size & Memory**: Electron packages an entire Chromium browser and Node runtime, typically using 250MB–500MB of RAM at idle. Tauri uses the native OS webview (WebView2 on Windows, WebKit on macOS) and compiles down to a lightweight binary with an idle footprint under 40MB.
2. **Native Filesystem Speed**: Directory traversal and BLAKE3 hashing run in compiled Rust on native OS threads. There's no Node.js I/O overhead or garbage collection pauses during large scans.
3. **Security Model**: Tauri 2 enforces a strict Content Security Policy and restricts plugins so the frontend cannot execute arbitrary shell commands.

---

## The In-Memory State Model (Why No Database?)

I deliberately chose **not** to use SQLite, RocksDB, IndexedDB, or LocalStorage for file inventories:
- **No Stale Data**: Filesystems change constantly. If you cache a scan from Tuesday, by Friday half the files could be moved, renamed, or deleted. Acting on a cached database can cause you to recommend deleting files that no longer exist or miss new files.
- **Privacy**: When you close the app, your file paths, folder names, and directory structure disappear from memory. Nothing is left on disk.
- **Disk Overhead**: A full drive index can easily take 500MB–2GB of database storage on disk. A disk cleaning tool shouldn't waste the space it's trying to recover.

The only data ByteMap persists to disk are:
1. User preferences at `%APPDATA%\ByteMap\config.json` (theme, binary vs. decimal units, and default ignore patterns).
2. Optional Time Machine baseline signatures (~35KB lightweight JSON files of folder path hashes and sizes) only when you explicitly click "Save Baseline Snapshot".

---

## Scanner Engine & Event Throttling

A common pitfall with desktop webview apps is IPC flooding. If you emit a Tauri event for every single file found, scanning a folder with 100,000 files will queue 100,000 IPC messages, completely choking the webview and dropping the frame rate to 2 FPS.

Here is how ByteMap solves this:
1. **Background Worker**: `Scanner::scan()` runs inside `std::thread::spawn()`. The UI thread remains completely free to handle user interaction and animations.
2. **Throttled Progress**: A timer (`last_progress_report.elapsed()`) checks if 80ms have elapsed before emitting a `scan_progress` event. This caps IPC events to ~12 updates per second, which is smooth for human eyes without overwhelming the message bridge.
3. **Rollup Aggregation on the Fly**: As files are visited, their sizes roll up into their parent directories in an in-memory `HashMap<PathBuf, (u64, u64, u64)>`. When traversal finishes, directory totals are already computed.
4. **Instant Cancellation**: The worker thread checks `cancel_token.load(Ordering::Relaxed)` on every iteration. Clicking "Cancel" stops the scan within milliseconds.

---

## Staged Duplicate Detection Pipeline

Hashing large files is disk and CPU intensive. ByteMap never hashes files during standard scans. When you open the Duplicates tab and click "Find Duplicates", it runs a staged pipeline:

1. **Stage 1 (Exact Size Matching)**: Groups scanned files by size in bytes. Any file with a unique size is discarded immediately. This eliminates ~95% of files with zero disk reads.
2. **Stage 2 (4KB Prefix Hash)**: Reads only the first 4,096 bytes of each remaining candidate and computes a fast BLAKE3 prefix hash. Files that differ in their first 4KB are discarded.
3. **Stage 3 (Full BLAKE3 Hash)**: For files that match both size and prefix, reads the file in 64KB streamed chunks to compute a full BLAKE3 hash. Candidates with matching full hashes are flagged as confirmed duplicates.

---

## Safe Cleanup Pipeline

Destructive actions have strict guardrails:
1. **Frontend Selection**: The user must explicitly check files they want to clean.
2. **Two-Step Confirmation**: A modal displays the total file count and bytes to be freed.
3. **Backend Validation (`PathValidator`)**:
   - Canonicalizes the target path.
   - Asserts that `canonical_target.starts_with(&authorized_root)`. Traversal attacks like `../../Windows` error out immediately.
   - Checks against hardcoded protected paths (`C:\Windows`, `C:\Program Files`, `/bin`, `/usr`, etc.).
   - Re-checks the file size on disk immediately before acting. If the file was edited or replaced after the scan, the operation aborts.
4. **Recycle Bin Priority**: By default, deletions call `trash::delete(&path)` which moves files to the native OS Recycle Bin / Trash rather than unlinking them permanently.
