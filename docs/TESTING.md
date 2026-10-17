# ByteMap Testing & Quality Assurance Guide

ByteMap includes comprehensive automated tests covering data formatting, state management, UI component rendering, file categorizers, and security path validators.

---

## 1. Test Architecture

```
src/tests/
  ├── utils.test.ts          # Unit tests for byte formatting, number separators, durations
  ├── store.test.ts          # State mutations, drive selection, cleanup toggles
  └── components.test.tsx    # Component rendering and navigation tab checks

src-tauri/src/
  ├── scanner/categorize.rs  # Categorizer tests for extensions and edge cases
  └── security/path_validator.rs # Traversal rejection and protected path verification
```

---

## 2. Running Automated Tests

### Frontend Test Suite (Vitest)
```bash
pnpm test
```
Runs all 17 frontend unit and component tests with strict type checking in JSDOM environment.

### Watch Mode
```bash
pnpm test:watch
```

### Type Checking & Build Validation
```bash
pnpm build
```
Executes `tsc` under strict mode and compiles the complete production bundle with Vite.

---

## 3. Test Coverage Matrix

| Component | Tested Scenarios | Status |
| :--- | :--- | :--- |
| `formatBytes` | Zero bytes, binary base 2 (KiB/GiB), decimal base 10 (KB/GB), negative values, NaN/Infinity | Verified Passing |
| `formatNumber` | Thousands separators with standard grouping | Verified Passing |
| `formatDuration` | Sub-second milliseconds, multi-second durations, multi-minute formatting | Verified Passing |
| `useAppStore` | Navigation switching, drive selection, cleanup candidate selection, scan reset | Verified Passing |
| `Sidebar` | Primary navigation tabs, badge counts, privacy notice rendering | Verified Passing |
| `PathValidator` | Canonicalization check, protected system paths (`C:\Windows`, `/bin`), path traversal prevention | Verified Passing |
| `Categorizer` | Video, Image, Audio, Document, Archive, Dev, App, and unknown extensions | Verified Passing |
