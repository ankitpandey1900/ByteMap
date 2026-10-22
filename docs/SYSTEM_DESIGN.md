# ByteMap — System Design & Architecture

How ByteMap works under the hood: architecture, threading, algorithms, data flow, and safety mechanisms.

- **Author**: Ankit Pandey
- **Repository**: [github.com/ankitpandey1900/ByteMap](https://github.com/ankitpandey1900/ByteMap)
- **Live Site**: [bytemap.alltracker.online](https://bytemap.alltracker.online/)
- **Version**: 1.0.8

---

## 1. Why I Built ByteMap & The Core Design Rules

Most disk space analyzers fall into one of two traps:
1. **The 90s tools** (like WinDirStat): They freeze your UI while scanning, run on a single thread, and look like Windows 98.
2. **The modern commercial cleaners**: They're built on heavy Electron frameworks that chew up 400MB of RAM at idle, install hidden background daemons, write huge multi-gigabyte SQLite databases to your SSD, and collect telemetry.

I built ByteMap to be fast, beautiful, and completely respectful of your machine:

| Principle | How We Enforce It |
| :--- | :--- |
| **1. Zero Database Policy** | All scan data lives strictly in RAM. Close the app, and everything vanishes. No disk caches, no ghost files. |
| **2. Native Rust Performance** | Scans run on native OS threads using compiled Rust. Scans a 1TB drive in ~4 seconds on NVMe. |
| **3. 80ms Throttled IPC** | Rust batches updates every 80ms (~12/sec) so the UI stays silky smooth at 60 FPS. |
| **4. Smart Duplicate Funnel** | We don't hash every file. A 3-stage funnel filters out 99% before reading byte streams. |
| **5. Safe By Default** | Deletions always default to the Recycle Bin / Trash. System paths are protected. |

---

## 2. High-Level Architecture

ByteMap is split into three main layers: the **React UI**, the **Tauri IPC Bridge**, and the **Rust Core Engine**.

```mermaid
graph TD
    subgraph UI ["1. Presentation Layer (React 19 SPA)"]
        A["Dashboard, Squarified Treemap & Interactive Charts"]
        B["Zustand Store (100% In-Memory RAM, wipes on exit)"]
    end

    subgraph Bridge ["2. Tauri 2 IPC Bridge"]
        C["Async Commands: invoke('start_scan', { ... })"]
        D["Event Stream: emit('scan_progress', ...) every 80ms"]
    end

    subgraph Core ["3. Rust Engine"]
        E["Single-Pass Traversal (WalkDir + Min-Heap)"]
        F["3-Tier Duplicate Finder (BLAKE3)"]
        G["PathValidator & Native OS Trash Dispatch"]
        H["Drive Discovery (sysinfo::Disks)"]
    end

    subgraph OS ["4. Operating System"]
        I["Windows (NTFS / Win32) • macOS (APFS / Cocoa) • Linux (ext4 / POSIX)"]
    end

    UI <--> Bridge
    Bridge <--> Core
    Core <--> OS

    style UI fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#0369a1
    style Bridge fill:#fef08a,stroke:#ca8a04,stroke-width:2px,color:#854d0e
    style Core fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#15803d
    style OS fill:#f1f5f9,stroke:#64748b,stroke-width:2px,color:#334155
```

---

## 3. How the Core Systems Actually Work

### 3.1 Single-Pass Directory Traversal & Hierarchical Rollup

When people think about calculating folder sizes, they usually imagine recursively walking every folder over and over. That's slow and thrashes the disk.

In ByteMap, I use a **single-pass prefix rollup**:
When the scanner hits a file on disk, that file's size immediately bubbles up to all its parent folders in our in-memory hash map. We only read each file's metadata **once**.

```mermaid
graph BT
    File["hero.png (50 MB)<br/>Discovered on disk"] --> Textures["assets/textures<br/>(+50 MB)"]
    Textures --> Assets["game/assets<br/>(+50 MB)"]
    Assets --> Game["game<br/>(+50 MB)"]
    Game --> Root["C:/Projects<br/>(+50 MB)"]

    style File fill:#fef08a,stroke:#ca8a04,stroke-width:2px,color:#854d0e
    style Textures fill:#e0f2fe,stroke:#0284c7,color:#0369a1
    style Assets fill:#e0f2fe,stroke:#0284c7,color:#0369a1
    style Game fill:#e0f2fe,stroke:#0284c7,color:#0369a1
    style Root fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#15803d
```

In memory, we maintain a flat `HashMap<PathBuf, DirectoryStats>`:

```
  "C:\Projects"               =>  size: 50 MB,  files: 1
  "C:\Projects\game"          =>  size: 50 MB,  files: 1
  "C:\Projects\game\assets"   =>  size: 50 MB,  files: 1
```

Next, if the scanner encounters `C:\Projects\game\assets\sound.wav` (20 MB):
- `"C:\Projects\game\assets"` becomes `70 MB` (2 files)
- `"C:\Projects\game"` becomes `70 MB` (2 files)
- `"C:\Projects"` becomes `70 MB` (2 files)

#### Why this is so fast:
- **Zero redundant I/O**: We never re-scan or backtrack through directories.
- **Top-100 Min-Heap**: While walking, we keep a fixed-size Min-Heap of the top 100 largest files. If a new file is smaller than the smallest item in the heap, we drop it instantly without sorting.
- **80ms Telemetry Throttle**: If we sent a message to the frontend for every file scanned, the IPC bridge would lock up when scanning 400,000 files. Instead, Rust emits a progress update once every 80 milliseconds (~12 updates a second), reporting current path, files processed, and scan speed.

---

### 3.2 Duplicate Detection: The 3-Stage Elimination Funnel

Scanning 500,000 files for byte-exact duplicates by computing cryptographic hashes for everything would grind your disk to a halt. 

ByteMap solves this with an **elimination funnel** that throws out 99.9% of files before reading full byte streams:

```mermaid
flowchart TD
    All["All Scanned Files (e.g. 100,000 files)"] --> Tier1["Tier 1: In-Memory Exact Size Match"]
    Tier1 --> S1{"Size is identical?"}
    S1 -- NO --> Drop1["Skip file<br/>(95,000 discarded • 0 bytes read from disk)"]
    S1 -- YES --> Tier2["Tier 2: Read First 4KB Header"]
    Tier2 --> S2{"4KB BLAKE3 matches?"}
    S2 -- NO --> Drop2["Skip file<br/>(4,800 discarded • only 4KB read per file)"]
    S2 -- YES --> Tier3["Tier 3: Full-File Streamed BLAKE3"]
    Tier3 --> Dupes["Confirmed Duplicate Groups<br/>(200 true copies • star original, queue duplicates)"]

    style Drop1 fill:#f8fafc,stroke:#94a3b8,color:#64748b
    style Drop2 fill:#f8fafc,stroke:#94a3b8,color:#64748b
    style Dupes fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#15803d
    style Tier1 fill:#e0f2fe,stroke:#0284c7,color:#0369a1
    style Tier2 fill:#fef08a,stroke:#ca8a04,color:#854d0e
    style Tier3 fill:#fed7aa,stroke:#ea580c,color:#9a3412
```

#### Why BLAKE3?
- BLAKE3 is a modern cryptographic tree hasher that runs at **~3.8 GB/s per core** using SIMD vector instructions (AVX-512, NEON).
- It is significantly faster than SHA-256 and MD5, allowing us to hash large files as fast as NVMe drives can stream them.

---

### 3.3 The Squarified Treemap: Why Tiles Look Like Squares, Not Slivers

Traditional disk visualizers often slice rectangles down to 1-pixel thin vertical or horizontal strips. You can't read the folder names, and you can't click them:

```
  Naive Slicing (Ugly Slivers):       Squarified Layout (ByteMap):
  ┌──┬──┬──┬──┬──┬──────────────┐      ┌──────────────┬──────────────┐
  │  │  │  │  │  │              │      │              │   Games      │
  │  │  │  │  │  │   Movies     │      │   Movies     │   (30 GB)    │
  │  │  │  │  │  │   (50 GB)    │      │   (50 GB)    ├──────┬───────┤
  │  │  │  │  │  │              │      │              │ Code │ Docs  │
  └──┴──┴──┴──┴──┴──────────────┘      └──────────────┴──────┴───────┘
   ▲ These slivers are unclickable!      ▲ Clean, readable square tiles!
```

ByteMap implements the **Squarified algorithm** (*Bruls, Huizing, van Wijk*):
1. Take the available screen area (width $\times$ height).
2. Greedily arrange items into rows along the shorter edge.
3. Keep adding items to the current row as long as the aspect ratio stays close to a square ($1:1$).
4. As soon as adding another rectangle makes the tile long and skinny, lock that row, cut off the remaining space, and start a new row.
5. Every tile gets a deterministic color from a 16-color comic palette based on its name, plus a 3D translucent top sheen and dark ink outline.

---

### 3.4 Time Machine: Storage Diff Without Any Database

How do you answer *"Where did 20 GB vanish overnight?"* without running a heavy background database?

```mermaid
flowchart LR
    Snap1["Baseline Snapshot (Oct 10)<br/>Tiny 35KB JSON file"] --> Diff["In-Memory Diff Engine"]
    Snap2["Current Scan (Oct 23)<br/>Active RAM Directory Tree"] --> Diff
    Diff --> Filter{Change > 5MB?}
    Filter -- YES --> UI["Time Machine Dashboard<br/>- Storage Evolution Chart<br/>- Diverging Delta Bars<br/>- Date Range Filters"]
    Filter -- NO --> Ignored["Hidden<br/>(Ignored as minor noise)"]

    style Snap1 fill:#fef9c3,stroke:#ca8a04,color:#854d0e
    style Snap2 fill:#e0f2fe,stroke:#0284c7,color:#0369a1
    style UI fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#15803d
    style Ignored fill:#f8fafc,stroke:#94a3b8,color:#64748b
```

- **Tiny Signature File**: A baseline snapshot doesn't save file lists or personal data. It only stores folder path strings and their byte sizes. A scan of 300,000 files compresses into a ~35KB signature file.
- **Date Range Engine**: You can filter snapshots by "All Time", "Today", "Last 7 Days", "Last 30 Days", or pick exact "From" and "To" dates to inspect specific software installation windows.

---

### 3.5 How the Cryptographic Auto-Updater Works

I wanted updates to be automatic, seamless, and mathematically secure against tampering or malicious network injection. Here is the simplified two-phase flow:

```mermaid
flowchart TD
    subgraph Phase1 ["Phase 1: Release & Signing (GitHub Actions CI)"]
        Tag["Push Git Tag: v1.0.8"] --> Build["Compile .exe & .dmg installers"]
        Build --> Sign["Sign binary with Private Key (Ed25519)"]
        Sign --> Release["Upload installer + signature to latest.json"]
    end

    subgraph Phase2 ["Phase 2: Check & Verify (On User's PC)"]
        Open["User opens ByteMap"] --> Fetch["Check latest.json from GitHub"]
        Fetch --> Download["Download ByteMap_1.0.8_x64-setup.exe"]
        Download --> Verify{"Verify signature with<br/>embedded Public Key"}
        Verify -- MATCHES --> Install["Safe to install!<br/>Stage binary, swap executable, restart"]
        Verify -- FAILS --> Block["STOP IMMEDIATELY!<br/>Corrupt or tampered file, alert user"]
    end

    Release -.-> Fetch

    style Install fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#15803d
    style Block fill:#fee2e2,stroke:#dc2626,stroke-width:2px,color:#991b1b
    style Sign fill:#fef08a,stroke:#ca8a04,color:#854d0e
    style Verify fill:#fed7aa,stroke:#ea580c,color:#9a3412
```

1. **At build time (CI/CD)**: GitHub Actions builds the binaries and signs them with an Ed25519 Minisign private key. The resulting signature is saved in `latest.json`.
2. **At run time (User's PC)**: When the app checks for updates, it compares the downloaded binary against the signature using the public key embedded in `tauri.conf.json`. If even a single byte was altered, the cryptographic verification fails and the update is immediately blocked.

---

### 3.6 Safety First: The 4-Step Cleanup Guard (`PathValidator`)

Deleting files can be dangerous if software makes assumptions. Before ByteMap moves a single file to the Recycle Bin or purges a dev cache, it passes the target through **four strict security gates**:

```mermaid
flowchart TD
    Start["User clicks 'Clean Selected Files'"] --> Gate1["Gate 1: Path Normalization<br/>Resolve symlinks, block '../' traversal"]
    Gate1 --> Gate2["Gate 2: Scanned Root Jail<br/>Target must sit inside the scanned directory"]
    Gate2 --> Gate3["Gate 3: System Blocklist<br/>Block Windows, System32, /System, /usr"]
    Gate3 --> Gate4["Gate 4: TOCTOU Sanity Check<br/>Verify file size on disk matches scan size"]
    Gate4 --> Trash["Safe Execution: Dispatch to OS Recycle Bin / Trash<br/>(Files can be restored anytime from your desktop)"]

    style Start fill:#fef9c3,stroke:#ca8a04,color:#854d0e
    style Gate1 fill:#e0f2fe,stroke:#0284c7,color:#0369a1
    style Gate2 fill:#e0f2fe,stroke:#0284c7,color:#0369a1
    style Gate3 fill:#fed7aa,stroke:#ea580c,color:#9a3412
    style Gate4 fill:#fed7aa,stroke:#ea580c,color:#9a3412
    style Trash fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#15803d
```

---

## 4. Concurrency & Threading Model

ByteMap maintains strict thread isolation so that UI interactions, charts, and animations never stutter during disk-heavy operations:

```mermaid
flowchart TD
    UI["OS Main Thread (WebView UI)<br/>React 19, 60 FPS animations, click handlers"] -->|Tauri IPC Commands| Tokio["Tokio Async Runtime<br/>Routes commands, dispatches JSON payloads"]
    Tokio --> Pool["Background Worker Threadpool (spawn_blocking)"]
    Pool --> T1["Traversal Worker: Single-pass WalkDir scan"]
    Pool --> T2["Duplicate Worker: 64KB chunked BLAKE3 hashing"]
    Pool --> T3["Cleanup Worker: Unlinks stale dev caches to Trash"]
    Pool --> T4["Drive Worker: sysinfo partition polling"]
    T1 -.->|80ms throttled progress events| UI

    style UI fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#0369a1
    style Tokio fill:#fef08a,stroke:#ca8a04,color:#854d0e
    style Pool fill:#dcfce7,stroke:#16a34a,color:#15803d
```

---

## 5. Cross-Platform Abstraction

ByteMap runs identically on Windows, macOS, and Linux by abstracting platform-specific system calls:

| Subsystem | Windows (10 / 11) | macOS (Apple Silicon / Intel) | Linux (Ubuntu / Fedora / Arch) |
| :--- | :--- | :--- | :--- |
| **Webview Runtime** | WebView2 (Chromium) | WebKit (Native Apple runtime) | WebKitGTK 4.1 |
| **Filesystem Traversal** | Win32 `FindFirstFileW` | POSIX `getdirentries` | POSIX `readdir_r` |
| **Trash Engine** | Windows Recycle Bin (`IFileOperation`) | macOS Trash (`NSWorkspace`) | FreeDesktop.org Trash Spec |
| **Path Normalization** | Strips `\\?\` NT extended prefix | Standard POSIX paths | Standard POSIX paths |
| **Installers** | Setup `.exe` (NSIS), `.msi` | Universal `.dmg` | `.deb`, `.AppImage` |
| **Protected Folders** | `C:\Windows`, `C:\Program Files` | `/System`, `/Library`, `/Applications`| `/bin`, `/usr`, `/etc`, `/sys` |

---

## 6. How We Verify Quality

- **35 Unit Tests**: Vitest test suites verify in-memory store actions, Time Machine date filters, path sanitization, and byte formatting utilities.
- **Strict TypeScript**: `tsc --noEmit` validates all frontend types with zero `any` escapes in core business logic.
- **Rust Safety**: `cargo fmt -- --check` and `cargo clippy` keep Rust code clean and warning-free.
- **Zero Memory Leaks**: Clearing a scan drops all references, releasing allocated heap memory back to the OS immediately.
