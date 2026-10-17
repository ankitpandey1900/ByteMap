# ByteMap Developer Guide

This guide is designed for contributors and developers extending ByteMap.

---

## 1. Project Organization

```
ByteMap/
├── src/                      # React/TypeScript Frontend
│   ├── components/           # Reusable UI components (Sidebar, Header, ScanModal)
│   ├── features/             # Feature-specific modules
│   │   ├── overview/         # Dashboard & KPI summaries
│   │   ├── drives/           # Disk volume discovery view
│   │   ├── explorer/         # Paginated file explorer
│   │   ├── large-files/      # Ranked large file inspector
│   │   ├── file-types/       # Category and extension analytics
│   │   ├── duplicates/       # Staged BLAKE3 duplicate detector view
│   │   ├── cleanup/          # Safe cleanup recommender & confirmation
│   │   ├── settings/         # Preferences & report export
│   │   └── treemap/          # Interactive squarified treemap view
│   ├── lib/                  # Utilities, API client, Zustand store
│   ├── styles/               # Global CSS & Tailwind configuration
│   └── tests/                # Vitest unit & component test suite
├── src-tauri/                # Rust Desktop Backend
│   ├── src/
│   │   ├── commands/         # Tauri command handlers
│   │   ├── drives/           # Native OS drive discovery using sysinfo
│   │   ├── duplicates/       # Streaming BLAKE3 hasher and staged detector
│   │   ├── scanner/          # Traversal engine, categorizer, exclusions
│   │   ├── cleanup/          # Target validator & Recycle Bin executor
│   │   ├── security/         # PathValidator & system path guard
│   │   ├── errors/           # Typed error definitions (AppError)
│   │   ├── models/           # Domain data models & serialization
│   │   ├── lib.rs            # Application entrypoint & plugin registration
│   │   └── main.rs           # Windows subsystem desktop launcher
│   ├── capabilities/         # Tauri 2 permission policies
│   └── Cargo.toml            # Rust dependencies & crate configuration
├── docs/                     # Comprehensive architecture and security documentation
└── package.json              # Frontend scripts & dependencies
```

---

## 2. Adding a New Tauri Command

1. Define command function in `src-tauri/src/commands/`:
   ```rust
   #[tauri::command]
   pub fn my_custom_command(arg: String) -> Result<MyResult, AppError> { ... }
   ```
2. Register it in `src-tauri/src/lib.rs` inside `tauri::generate_handler![...]`.
3. Add corresponding TypeScript contract in `src/lib/api.ts` and `src/types/index.ts`.
4. Invoke cleanly with `await api.myCustomCommand(...)`.

---

## 3. Coding Conventions

- **TypeScript**: Strict mode enabled (`noUnusedLocals`, `noUnusedParameters`). Avoid `any`.
- **Rust**: Use `thiserror` for typed errors; avoid raw `unwrap()` or `expect()` in traversal routines. Return `AppResult<T>`.
- **Formatting**: Run `pnpm test` and `pnpm build` prior to committing.
