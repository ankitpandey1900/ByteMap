# ByteMap Threat Model

This document outlines the threat modeling, trust boundaries, attacker profiles, and residual risks for ByteMap according to STRIDE principles.

---

## 1. Trust Boundaries

```
[ Unstrusted User Input / Filesystem Contents ]
                      │
                      ▼
[ React 19 Frontend (Sandboxed Webview with strict CSP) ]
                      │  Tauri Typed IPC
                      ▼
[ Rust Backend Commands & PathValidator ]
                      │
                      ▼
[ Local Operating System Filesystem APIs ]
```

### Trust Levels
- **Untrusted**: Filenames, folder contents, symlinks, imported scan reports, user-entered search queries.
- **Semi-Trusted**: Webview renderer (isolated by Tauri CSP, unable to run raw arbitrary shell commands).
- **Trusted**: Rust core backend logic executing with user-level privileges.

---

## 2. STRIDE Threat Analysis

| Threat Category | Potential Attack Vector | ByteMap Mitigation |
| :--- | :--- | :--- |
| **Spoofing** | Forged scan reports or fake file metadata | Scan reports are validated via strict JSON schema. Live operations verify active filesystem metadata directly. |
| **Tampering** | File replaced between scan and cleanup execution | Target revalidation verifies file size matches scan metadata immediately prior to any deletion. |
| **Repudiation** | Unintended deletions performed by user | Two-step confirmation modal with item counts and byte totals; deletion history reported in UI. |
| **Information Disclosure** | Sensitive file paths leaked over network or in crash dumps | Zero network requests during local scans; zero telemetry SDKs; no crash dump logs containing paths. |
| **Denial of Service** | Traversal cycles via malicious symlinks or deep nesting | Symlinks are disabled by default (`follow_links(false)`); `WalkDir` bounds recursion depth; traversal checks atomic cancel token. |
| **Elevation of Privilege** | Path traversal (`..\..\Windows\System32`) to delete protected system files | Backend enforces `canonical_target.starts_with(&canonical_root)` and rejects protected system locations. |

---

## 3. Residual Risks & Limitations

1. **User Privileges**: ByteMap operates with the privileges of the active logged-in user. It cannot read protected files owned by Administrator/root unless run with elevated rights.
2. **Third-Party File Changes**: Files rapidly created or deleted by other background processes during a scan may cause transient I/O warnings, which are recorded in `scanSummary.errors`.
