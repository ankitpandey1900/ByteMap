# ADR 005: TOCTOU-Proof Defensive Cleanup & Native OS Trash Dispatch

## Status
Accepted

## The Problem
Allowing an application to delete files carries immense risk:
1. **Directory Traversal Exploits**: Malicious symlinks or paths with `../` could trick the application into deleting files outside the scanned folder.
2. **Accidental System Destruction**: Users might accidentally select critical operating system folders (`C:\Windows`, `C:\Program Files`, `/System`, `/usr`).
3. **Time-Of-Check to Time-Of-Use (TOCTOU) Race Conditions**: What if a user scans their drive at 2:00 PM, an installer or text editor updates a file at 2:05 PM, and the user clicks "Delete" at 2:10 PM? Blindly deleting the file could destroy newly written work.

## The Decision
I implemented a **4-gate security barrier (`PathValidator`)**:

1. **Path Canonicalization**: Resolves symlinks and normalizes separators to prevent traversal tricks.
2. **Scanned Root Jail**: Validates that `target_path.starts_with(&authorized_root)`. Anything outside the explicitly scanned folder is rejected immediately.
3. **System Folder Blocklist**: Hardcoded guards protect critical system directories on Windows, macOS, and Linux.
4. **Pre-Flight TOCTOU Check**: Re-queries disk metadata immediately before executing cleanup. If the file's size or type has changed since the scan snapshot, the operation is aborted.
5. **Native OS Trash Dispatch**: Deletions default to the native operating system's Recycle Bin (`trash` crate using Win32 `IFileOperation` or macOS `NSWorkspace`). Files can be restored by the user anytime from their desktop.

## Trade-offs
- **Cons**: Files still consume disk space in the Recycle Bin until the user empties it.
- **Pros**: 100% protection against accidental operating system destruction, zero symlink breakout vulnerabilities, and simple one-click user recovery if a mistake is made.
