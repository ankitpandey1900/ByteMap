# ByteMap Security Architecture & Policy

Security is a foundational architectural requirement for ByteMap. This document describes the threat model, filesystem authorization boundaries, Content Security Policy (CSP), and safe deletion protections.

---

## 1. Content Security Policy (CSP)

ByteMap runs in Tauri 2 with a strict CSP defined in `tauri.conf.json`:

```text
default-src 'self'; img-src 'self' data: asset:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' ipc: http://ipc.localhost
```

- **Remote Scripts**: Completely prohibited. All application logic is compiled and bundled into the local distribution bundle.
- **Arbitrary Shell Execution**: Disabled. Tauri process and shell plugins are not enabled for the frontend.
- **External Web Requests**: Local scan routines make zero outbound network requests.

---

## 2. Filesystem Boundary & Path Validation

Frontend input is never trusted as a security boundary. All paths passed to backend commands undergo strict verification via `PathValidator`:

### Canonicalization & Traversal Prevention
```rust
let canonical_target = path.canonicalize()?;
if !canonical_target.starts_with(&canonical_root) {
    return Err(AppError::InvalidPath("Security violation: path traversal outside root"));
}
```

### Critical Protected System Locations
ByteMap strictly prohibits modifying or recommending deletions in critical operating system locations:
- `C:\Windows` and all subdirectories
- `C:\Program Files` and `C:\Program Files (x86)`
- `C:\Recovery`, `C:\Boot`, `C:\System Volume Information`
- `/bin`, `/sbin`, `/usr`, `/etc`, `/sys`, `/proc`, `/root`
- Root drives directly (`C:\` or `/`)

### Pre-Execution Target Revalidation
Before moving any file to the Recycle Bin or executing deletion:
1. File existence and canonical path are re-checked.
2. File metadata (length in bytes) is compared to the scan snapshot. If the file has changed size or been replaced by a different file, the operation is aborted with `AppError::TargetChanged`.

---

## 3. Safe Deletion & Recycle Bin Priority

1. **Zero Silent Deletion**: The application never automatically deletes any file.
2. **Explicit User Selection**: The user must explicitly select files in the Cleanup view.
3. **Two-Step Confirmation**: A modal dialog presents the exact file count, paths, and total reclaimable bytes before any action is executed.
4. **OS Recycle Bin**: Deletions default to the native OS Recycle Bin (`trash::delete`), allowing users to easily inspect and restore files if necessary.

---

## 4. Vulnerability Disclosure

If you discover a security vulnerability in ByteMap, please submit a responsible disclosure report to `security@bytemap.local` or open a private advisory on GitHub.
