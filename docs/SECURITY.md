# ByteMap Security Details

Here is how security and safe file handling are implemented in ByteMap.

---

## Content Security Policy (CSP)

ByteMap runs in a Tauri webview window. In `tauri.conf.json`, I configured a strict CSP:

```text
default-src 'self';
img-src 'self' data: asset:;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
connect-src 'self' ipc: http://ipc.localhost https://github.com https://objects.githubusercontent.com
```

What this means in practice:
- **No external scripts**: The webview cannot load JavaScript from CDNs or external servers. All React and JS code is built locally into `dist/`.
- **No remote web debugging**: The production build disables remote debugging endpoints.
- **Tauri Plugin Restrictions**: Shell execution is disabled. The frontend cannot execute terminal commands, batch scripts, or power shell processes.
- **Controlled Outbound Connections**: Network access is strictly restricted to GitHub Releases and GitHub object storage for cryptographic signature verification and auto-updates.

---

## Filesystem Boundaries & Path Validation

A common vulnerability in desktop utilities is path traversal: if the frontend sends `../../Windows/System32`, an unchecked backend might happily delete system files.

ByteMap never trusts the frontend to supply safe paths. Every path sent from the UI passes through `PathValidator` in Rust:

### 1. Canonicalization
Paths are normalized and canonicalized via `std::fs::canonicalize()`. This resolves symlinks, relative segments (`..`, `.`), and case differences on Windows.

### 2. Root Boundary Check
When you initiate a scan on `D:\Projects`, that folder becomes the `authorized_root`. Any cleanup target must satisfy:

```rust
if !canonical_target.starts_with(&canonical_root) {
    return Err(AppError::InvalidPath("Target sits outside authorized scan root"));
}
```

If a target path falls outside the selected folder, the backend immediately rejects the request.

### 3. Protected System Directories
Even if someone intentionally selects `C:\` or `/` as their scan root, ByteMap hard-blocks destructive operations against critical operating system directories:
- **Windows**: `C:\Windows`, `C:\Program Files`, `C:\Program Files (x86)`, `C:\Recovery`, `C:\Boot`, `C:\System Volume Information`
- **Unix & Linux**: `/bin`, `/sbin`, `/usr`, `/etc`, `/var`, `/dev`, `/proc`, `/sys`, `/boot`, `/root`, `/lib`, `/lib64`
- **macOS Core**: `/System`, `/Library`, `/Applications`, `/private`, `/Volumes`
- **Drive Roots Directly**: Any bare volume root (e.g. `C:\`, `D:\`, or `/`)

### 4. Target Revalidation Before Destruction (TOCTOU Defense)
There is always a time gap between when a scan runs and when a user clicks "Clean Selected". Files might have been edited, replaced with symlinks, or swapped by another program.

Immediately before moving a file to the trash or unlinking it, `PathValidator::validate_cleanup_target`:
1. Verifies the file still exists and is a regular file (not a directory or special device).
2. Verifies the file's current byte size on disk matches the size recorded during the scan snapshot. If the size changed, ByteMap aborts with `AppError::TargetChanged` to protect against deleting modified data.

---

## Safe Native File Reveal

When you click "Reveal in Explorer", ByteMap doesn't launch the file. It launches the operating system's native file manager with the item selected:
- **Windows**: `explorer.exe /select,"<path>"`
- **macOS**: `open -R "<path>"`
- **Linux**: `xdg-open "<parent_dir>"`

ByteMap will **never execute** `.exe`, `.bat`, `.ps1`, `.sh`, or document files found during scans.

---

## Responsible Disclosure

If you spot a bug or security issue with path traversal, deletion validation, or IPC contracts, please file an issue or email me directly at `ankitpandey1900@gmail.com`.
