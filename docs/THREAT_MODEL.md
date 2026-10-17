# ByteMap Threat Model

This document outlines the threat scenarios I considered while designing ByteMap and how the code mitigates them.

---

## 1. What Are We Protecting?

1. **User Files**: Preventing accidental loss of personal files, code repositories, or documents.
2. **Operating System Integrity**: Preventing accidental deletion or corruption of critical Windows/macOS/Linux system files.
3. **User Privacy**: Keeping file names, paths, and directory layouts strictly on the user's local machine.

---

## 2. Threat Scenarios & Mitigations

### Threat 1: Accidental Deletion of Critical Files
- **Risk**: A user clicks "Clean" assuming the app knows best, and accidentally wipes a project folder or database file.
- **Mitigation**:
  - ByteMap **never deletes anything automatically**.
  - All recommendations are tagged with a risk rating (`Safe`, `Low`, `Moderate`) and a plain-English explanation.
  - Deletions require explicit checkbox selection plus a separate confirmation modal showing the file count and byte total.
  - Deletions default to the OS Recycle Bin (`trash` crate) rather than permanent unlinking (`remove_file`).

### Threat 2: Path Traversal
- **Risk**: Malicious input or symlink indirection passes a path like `D:\Scan\..\..\Windows\System32\drivers\etc\hosts` to the deletion command.
- **Mitigation**:
  - `PathValidator::validate_cleanup_target` canonicalizes both the scan root and the target path.
  - Enforces `canonical_target.starts_with(&canonical_root)`.
  - Rejects the operation if the target is in a protected system directory (`C:\Windows`, `C:\Program Files`, etc.).

### Threat 3: Infinite Symlink Traversal Loops
- **Risk**: A directory contains a circular symlink pointing to its parent, causing the scanner to recurse indefinitely, run out of memory, or peg CPU.
- **Mitigation**:
  - By default, `options.follow_symlinks` is `false`.
  - `WalkDir` is set to `follow_links(false)` unless explicitly enabled by the user in advanced settings.

### Threat 4: File Swapping / TOCTOU (Time-of-Check to Time-of-Use)
- **Risk**: A user scans a folder, then a background process replaces an old 100MB temp file with a 100MB critical file.
- **Mitigation**:
  - The backend re-checks file metadata immediately before acting. If the file size differs from the scan snapshot, the deletion is rejected with `AppError::TargetChanged`.

### Threat 5: Data Leakage Over the Network
- **Risk**: An analytics library or crash reporter uploads file paths or directory names to a third-party server.
- **Mitigation**:
  - Zero external telemetry, tracking SDKs, or cloud services.
  - The frontend has no remote scripts, and the Rust scanner has no HTTP client dependencies.
  - Local disk analysis works 100% offline.
