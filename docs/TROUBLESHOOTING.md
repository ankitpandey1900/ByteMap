# ByteMap Troubleshooting

Common issues you might run into when building or running ByteMap, and how to fix them.

---

## 1. Rust Build Fails on Windows (`linker link.exe not found` or `kernel32.lib missing`)

### What happened:
Tauri 2 on Windows builds against the native Windows WebView2 and Win32 C runtime. This requires Microsoft's MSVC linker and the Windows SDK import libraries.

### How to fix it:
Install the C++ Build Tools using winget:
```powershell
winget install --id Microsoft.VisualStudio.2022.BuildTools --override "--quiet --wait --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
```
Or open the Visual Studio Installer and ensure **Desktop development with C++** is checked.

---

## 2. Pnpm reports `[ERR_PNPM_IGNORED_BUILDS]` on `esbuild`

### What happened:
In modern pnpm (v10+ and v11+), build scripts in third-party packages are blocked by default for security until explicitly approved.

### How to fix it:
Run the approval command in the project root:
```bash
pnpm approve-builds --all
```
This authorizes `esbuild`'s postinstall script and updates `pnpm-lock.yaml`.

---

## 3. "Permission Denied" Errors During Full Drive Scans

### What happened:
When scanning root drives like `C:\`, the scanner will hit system directories that standard user accounts cannot read (such as `System Volume Information` or other users' private appdata folders).

### How to fix it:
- ByteMap is designed to handle this gracefully: it catches the `PermissionDenied` error, records the unreadable path in `scanSummary.errors`, and continues scanning the rest of the drive without crashing.
- If you genuinely need to analyze administrative folders, right-click the ByteMap app (or your terminal) and select **Run as Administrator**.

---

## 4. Antivirus Warnings During Cleanup

### What happened:
Some aggressive third-party antivirus utilities trigger heuristic warnings when an application calls `trash::delete` on multiple files in rapid succession.

### How to fix it:
ByteMap uses the standard Windows `IFileOperation` Win32 shell API under the hood to send files to the Recycle Bin. If your antivirus displays a warning, you can safely allow ByteMap.
