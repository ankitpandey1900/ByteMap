# ADR 001: Strict No-Database Policy

## Status
Accepted

## Context
Desktop disk analysis tools frequently introduce background databases (e.g. SQLite, RocksDB, or IndexedDB) to persist file inventories across sessions. While persistent indexing can speed up subsequent queries, it introduces significant drawbacks:
1. **Privacy & Security Risks**: A persistent database on disk contains full filesystem paths, user file inventories, and potentially sensitive filenames long after the application is closed.
2. **Stale Data Inconsistencies**: Operating systems change rapidly. Files are created, moved, and deleted outside the app, making cached databases out of sync and prone to false duplicate or deletion recommendations.
3. **Storage Overhead**: Database indexes for drives with millions of files consume substantial gigabytes of disk space—ironic for a storage-recovery tool.

## Decision
ByteMap will **never use any database engine** (no SQLite, IndexedDB, LocalStorage cataloging, or embedded key-value stores).
- All scan metadata lives strictly in **volatile system RAM**.
- Once the application exits or the user clears the scan, the memory is dropped.
- User configuration is restricted to a lightweight non-sensitive preferences file.

## Consequences
- **Positive**: Complete privacy, zero disk footprint for caches, zero risk of acting on stale cached paths, 100% offline security.
- **Negative**: Scans must be re-run when the application is reopened. Given ByteMap's high-performance Rust traversal engine, rescanning is extremely fast and guarantees fresh ground-truth data.
