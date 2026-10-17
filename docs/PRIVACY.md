# ByteMap Privacy Policy & Local-First Principles

ByteMap is built on an uncompromising commitment to local-first data privacy and user sovereignty.

---

## 1. What ByteMap Reads

- **File Metadata**: ByteMap reads file names, sizes, extensions, modification timestamps, and directory structures within user-selected scan roots.
- **Drive Metadata**: ByteMap queries operating system storage APIs (`sysinfo`) to retrieve partition names, filesystem formats, total capacity, and available bytes.
- **Cryptographic Hashing**: When the user explicitly requests duplicate analysis, ByteMap reads file content in streaming 64KB blocks solely to compute BLAKE3 hashes. File contents are discarded immediately after hashing.

---

## 2. What ByteMap Stores

- **Volatile RAM Only**: Active scan results, folder aggregates, duplicate catalogs, and cleanup candidate lists are stored **exclusively in volatile application RAM**.
- **On Exit**: When ByteMap terminates or when the user clicks "Clear Scan", all scan inventories, file paths, and metadata are immediately wiped.
- **Preferences**: A minimal, human-readable configuration file is stored at `%APPDATA%\ByteMap\config.json`. This stores only non-sensitive preferences (selected theme, display units, and default exclusion patterns). It contains **zero file names or personal paths**.

---

## 3. What ByteMap NEVER Transmits

- **Zero Telemetry**: No usage metrics, error telemetry, or tracking SDKs are included.
- **Zero Cloud Uploads**: Scan data, file lists, and duplicate records never leave your local machine.
- **Zero Network Calls During Local Scans**: The local scanning engine operates 100% offline.

---

## 4. User-Initiated Data Export

- Exporting scan data is completely manual and explicit.
- Users can choose to export reports in **JSON** or **CSV** formats to a directory chosen via the operating system's native save dialog.
