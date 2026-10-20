# Contributing to ByteMap

Hey! Thanks for wanting to improve ByteMap. Whether you're fixing a typo, tuning a Rust traversal loop, or tweaking a UI button, I appreciate the help.

Here is the quick guide to getting setup, running the app locally, and sending in a clean pull request.

---

## The Core Rules of ByteMap

Before writing code, keep these principles in mind:
1. **Zero-Database Policy**: ByteMap never uses SQLite, IndexedDB, or cached catalogs on disk. Scans live in RAM while open and get dropped on exit. No tracking, no disk bloat.
2. **100% Offline & Private**: No analytics SDKs, no tracking pixels, no telemetry pings.
3. **Pop-Art Comic Aesthetic**: Thick 2.5px borders (`#0f172a`), retro halftone dots, bold typography (Bangers, Comic Neue, Fredoka), and playful mascot vibes.
4. **Safety First**: Never delete or touch a file without explicit user confirmation. All deletions default to moving to the OS Recycle Bin / Trash.

---

## Getting Started Locally

### Prerequisites
Make sure you have these installed:
- **Node.js** (v20 or v22) & **pnpm** (`corepack enable && corepack prepare pnpm@latest --activate`)
- **Rust** (stable toolchain from [rustup.rs](https://rustup.rs))
- **C++ Build Tools**:
  - Windows: Visual Studio C++ Build Tools (Desktop development with C++)
  - Mac: `xcode-select --install`
  - Linux: `libwebkit2gtk-4.1-dev`, `build-essential`, `curl`, `wget`

### 1. Clone & Install
```bash
git clone https://github.com/ankitpandey1900/ByteMap.git
cd ByteMap
pnpm install
```

### 2. Run in Development Mode
This launches Vite for hot-reloading the frontend and compiles the Tauri desktop window:
```bash
pnpm tauri dev
```
*(If you just want to tweak web UI without the desktop wrapper, `pnpm dev` runs Vite in your browser at `http://localhost:1420`).*

### 3. Website Development
The landing page lives in the `website/` folder:
```bash
pnpm website:dev
```

---

## Testing & Quality Checks

Before opening a pull request, run these quick sanity checks so CI passes without hiccups:

```bash
# 1. Run all Vitest frontend unit tests
pnpm test

# 2. Type-check TypeScript and build frontend bundle
pnpm build

# 3. Check Rust code formatting (in src-tauri/)
cd src-tauri
cargo fmt --all --check
cd ..
```

---

## Submitting a Pull Request

1. Fork the repo and create your branch from `main`:
   ```bash
   git checkout -b fix/my-fix
   ```
2. Commit with clear, descriptive commit messages:
   - `fix: resolve drive letter matching on Windows`
   - `feat: add new file category for game saves`
   - `docs: improve user guide instructions`
3. Push to your fork and open a PR against `main`.
4. Fill out the short PR template so I know what you changed and how you tested it.

---

## Found a Bug or Have an Idea?

- **Bug Reports**: Open an issue using the Bug Report template. Tell me what OS you're on, what drive you scanned, and what happened.
- **Feature Requests**: Have a cool idea? Open an issue and let's talk through it before you spend hours coding it up.

If you ever get stuck or want to chat about an idea, feel free to open a GitHub Discussion or drop me an email at **ankit1pandey11@gmail.com**.

Happy coding!  
*— Ankit*
