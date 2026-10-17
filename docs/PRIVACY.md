# Privacy in ByteMap

I built ByteMap to analyze local storage without acting like spyware. Here is exactly what the app does and doesn't touch.

---

## 1. What ByteMap Reads

- **File Metadata**: During a scan, ByteMap reads file names, paths, sizes, extensions, and last-modified dates inside the folders you explicitly tell it to scan.
- **Drive Capacity**: It queries OS disk metrics (`sysinfo`) to show drive size, free space, and partition formats.
- **File Contents (Duplicates Only)**: If and only if you run the Duplicate Finder, ByteMap reads candidate file contents in 64KB chunks to calculate BLAKE3 cryptographic hashes. The file contents are discarded from memory immediately after hashing.

---

## 2. Where Scan Data Lives

- **100% In-Memory**: All scan results, folder sizes, and duplicate catalogs exist only in RAM while ByteMap is running.
- **Wiped on Exit**: When you close the app or click the "Clear Scan" button in the header, that RAM is freed. Nothing is written to an internal database or cache file.
- **Config File**: The only file ByteMap writes to your drive is `%APPDATA%\ByteMap\config.json`. It only contains your UI settings:
  ```json
  {
    "theme": "dark",
    "unit": "binary",
    "large_file_threshold_mb": 100,
    "prefer_trash": true,
    "default_excludes": ["$RECYCLE.BIN", "System Volume Information", ".git", "node_modules"]
  }
  ```
  It **never** stores filenames, file paths, or personal scan history.

---

## 3. What ByteMap Never Does

- **No Analytics / Telemetry**: There is no Google Analytics, PostHog, Sentry, or custom tracking pixel.
- **No Cloud Uploads**: Your file inventories never leave your machine.
- **No Network Requests During Scans**: The scanning and duplicate detection engines run 100% offline.

---

## 4. Exporting Your Data

If you want to save a record of your scan, you have to initiate it manually via **Settings -> Export Report (JSON)** or **Export Files Table (CSV)**. You choose the destination file path.
