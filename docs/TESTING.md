# ByteMap Testing Guide

How automated tests are set up and how to run them locally.

---

## 1. Running the Tests

To run the full frontend test suite:

```bash
pnpm test
```

This runs Vitest in a headless JSDOM environment against 18 test cases.

To run tests in watch mode while making changes:

```bash
pnpm test:watch
```

---

## 2. What Is Tested?

### Formatting & Math Utilities (`src/tests/utils.test.ts`)
- **`formatBytes`**:
  - Zero bytes: `0 B`
  - Binary units: powers of 1024 (`KiB`, `MiB`, `GiB`, `TiB`)
  - Decimal units: powers of 1000 (`KB`, `MB`, `GB`, `TB`)
  - Boundary cases: negative byte values, `NaN`, and `Infinity`
- **`formatNumber`**:
  - Tests thousands separators using `en-US` locale (`1,234,567`) to avoid host machine locale mismatches (e.g., Indian numbering system lakh/crore grouping).
- **`formatDuration`**:
  - Formats millisecond thresholds, seconds (`2.5s`), and minutes (`1m 5s`).
- **`formatDate`**:
  - Converts UNIX timestamps to readable dates, with fallback for missing timestamps.
- **`getCategoryColor`**:
  - Verifies that all 9 categories return their defined hex color codes.

### Zustand State Store (`src/tests/store.test.ts`)
- Initial default values (dark theme, binary units, trash enabled).
- Tab navigation transitions (`overview` -> `large-files` -> `cleanup`).
- Drive selection updates and scan path synchronization.
- Cleanup checkbox multi-selection (adding and toggling item IDs).
- Memory wipe on `clearScan()` (confirming that scan summaries reset to `null`).

### UI Components (`src/tests/components.test.tsx`)
- Mocks Tauri IPC (`invoke` and `listen`) to test React rendering without needing an active desktop Tauri runtime.
- Confirms all 8 navigation buttons render in the sidebar.
- Confirms the memory-only privacy notice badge displays properly.

### Rust Backend (`src-tauri/src/`)
- **`scanner/categorize.rs`**: Unit tests verifying that video, image, doc, code, and unknown extensions map to their correct `FileCategory`.
- **`security/path_validator.rs`**: Unit tests verifying that system directories (`C:\Windows`, `C:\Program Files`, `/bin`, `/usr`) are marked protected, and that empty root paths are rejected.

---

## 3. Adding New Tests

If you add a new helper function or component:
1. Place unit tests in `src/tests/<name>.test.ts`.
2. Mock any `@tauri-apps/api` calls using `vi.mock()` so the test runs in pure Node/JSDOM without a native Tauri window.
3. Run `pnpm test` and ensure all assertions pass.
