# ADR 001: Strict No-Database Policy

## Status
Accepted

## The Problem
When building disk space analyzers, the traditional approach is to cache file catalogs into an embedded database like SQLite or RocksDB so subsequent app opens can display "instant" results without rescanning.

However, after testing this approach, I found it causes more problems than it solves:
1. **Stale Data Bugs**: Filesystems change constantly while you work. If an app relies on a cached database from yesterday, it displays incorrect folder sizes, misses newly downloaded 10GB files, or recommends deleting files that were already moved.
2. **Privacy Hazard**: Having a full unencrypted database on disk containing every file name and path you ever scanned is a serious privacy liability.
3. **Storage Bloat**: Indexing a 1TB drive with 500,000 files in SQLite can easily eat up 500MB to 1.5GB of disk space. A tool built to free up disk space shouldn't be hogging gigabytes of SSD space with persistent databases.

## The Decision
ByteMap will **never use any database engine** (no SQLite, MongoDB, IndexedDB, or LocalStorage catalogs).

- When a scan runs, data lives strictly in RAM.
- When you quit or click "Clear Scan", the memory is dropped.
- The only persistent file is a tiny JSON preferences file (`config.json`) storing non-sensitive settings (theme, display units, ignore patterns).

## Trade-offs
- **Cons**: You have to run a scan when you open the app if you want fresh numbers.
- **Pros**: Because the Rust crawler is so fast (scanning 25,000 files in ~1.4 seconds), waiting a couple seconds for a scan is well worth knowing the data is 100% accurate, leaves zero disk footprint, and never leaks your private file paths.
