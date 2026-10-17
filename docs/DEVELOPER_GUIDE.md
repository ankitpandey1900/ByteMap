# ByteMap Developer Guide

A guide for anyone working on the ByteMap codebase.

---

## 1. Codebase Layout

```
ByteMap/
├── src/                      # React 19 Frontend
│   ├── components/           # Shell components (Header, Sidebar, ScanModal)
│   ├── features/             # Feature views
│   │   ├── overview/         # Dashboard with Recharts & Treemap
│   │   ├── drives/           # Drive volume selector
│   │   ├── explorer/         # Paginated file table
│   │   ├── large-files/      # Ranked large file list
│   │   ├── file-types/       # Category & extension breakdown
│   │   ├── duplicates/       # BLAKE3 duplicate manager
│   │   ├── cleanup/          # Candidate reviewer & confirmation modal
│   │   ├── settings/         # Preferences & JSON/CSV exports
│   │   └── treemap/          # Squarified SVG treemap algorithm & view
│   ├── lib/
│   │   ├── api.ts            # Typed wrapper around Tauri invoke() & listen()
│   │   ├── store.ts          # Zustand state store
│   │   └── utils.ts          # Byte formatting, duration math, category colors
│   ├── styles/               # Tailwind CSS & design tokens
│   ├── tests/                # Vitest unit & component tests
│   ├── types/index.ts        # TypeScript interfaces matching Rust structs
│   └── App.tsx               # Main layout container
│
├── src-tauri/                # Rust Desktop Backend
│   ├── src/
│   │   ├── commands/mod.rs   # Tauri command functions exposed over IPC
│   │   ├── scanner/          # WalkDir traversal & category mapping
│   │   ├── drives/           # sysinfo drive query logic
│   │   ├── duplicates/       # Staged duplicate detection (Size -> Prefix -> Full)
│   │   ├── cleanup/          # Trash & delete executor
│   │   ├── security/         # PathValidator & system path protections
│   │   ├── models/mod.rs     # Serde structs for serialization
│   │   ├── errors/mod.rs     # Typed AppError enum
│   │   ├── lib.rs            # Tauri builder & plugin setup
│   │   └── main.rs           # Windows subsystem desktop launcher
│   ├── capabilities/         # Tauri 2 permission config (default.json)
│   ├── Cargo.toml            # Rust crates
│   └── tauri.conf.json       # App metadata, window sizing, and CSP
```

---

## 2. Adding a New Feature or Command

Whenever you want to add a new capability:

### Step 1: Implement Rust Logic
Create your logic in an appropriate module under `src-tauri/src/`. Use `AppResult<T>` for error handling so errors serialize cleanly across IPC.

### Step 2: Expose a Tauri Command
In `src-tauri/src/commands/mod.rs`:
```rust
#[tauri::command]
pub fn my_new_command(state: State<'_, AppScanState>, param: String) -> Result<MyData, AppError> {
    // Your logic
}
```
Then register it in `src-tauri/src/lib.rs`:
```rust
tauri::generate_handler![
    // ... existing commands
    commands::my_new_command
]
```

### Step 3: Add the TypeScript Interface
In `src/types/index.ts`, define the matching TypeScript interface:
```typescript
export interface MyData {
  field_name: string;
}
```

### Step 4: Add the Frontend API Call
In `src/lib/api.ts`:
```typescript
async myNewCommand(param: string): Promise<MyData> {
  return await invoke<MyData>('my_new_command', { param });
}
```

---

## 3. Formatting & Linting

Before pushing changes:
```bash
# Type check and build frontend
pnpm build

# Run Vitest test suite
pnpm test
```

Keep dependencies minimal. Do not add external database drivers or heavy Node packages.
