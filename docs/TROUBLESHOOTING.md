# ByteMap Troubleshooting Guide

Common issues, diagnosis procedures, and platform solutions for ByteMap.

---

## 1. Scanner Permission Denied Errors

### Problem
Certain folders (such as `C:\System Volume Information`, `AppData\Local\Temp`, or system directories) report permission errors during scanning.

### Solution
- **Expected Behavior**: ByteMap runs under standard user privileges without requiring Administrator/root access.
- Restrictive system folders are skipped safely and counted under **Engine Performance Errors**.
- To analyze administrative directories, launch ByteMap with elevated privileges ("Run as Administrator" on Windows or `sudo` on Linux).

---

## 2. Windows MSVC C++ Linker Not Found (`link.exe` / `kernel32.lib`)

### Problem
During compilation on Windows, Cargo reports `linker link.exe not found` or `could not open kernel32.lib`.

### Solution
Tauri 2 on Windows requires the Microsoft C++ Build Tools or Windows SDK to link against the Windows runtime:
```bash
winget install --id Microsoft.VisualStudio.2022.BuildTools --override "--quiet --wait --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
```
Or install Visual Studio Community 2022 with the "Desktop development with C++" workload selected.

---

## 3. High CPU Usage During Hashing

### Problem
Calculating cryptographic hashes for hundreds of gigabytes of duplicate candidates causes high CPU and disk utilization.

### Solution
- Duplicate detection is **completely optional and staged**.
- ByteMap only calculates full cryptographic BLAKE3 hashes when candidate files have identical sizes and matching 4KB prefix hashes.
- You can click **Cancel** in the scanning modal at any time to abort hashing immediately.
