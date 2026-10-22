# ADR 006: Zero-DB Time Machine Storage Snapshots

## Status
Accepted

## The Problem
Users frequently ask *"Where did 20 GB vanish overnight?"* after installing games, software updates, or development toolchains. 

Traditional ways of solving this require:
1. Running a continuous background daemon that monitors filesystem events (`fsevents` / `ReadDirectoryChangesW`), which drains laptop battery life and uses background CPU.
2. Storing multi-gigabyte historical file inventories on disk in a persistent database.

## The Decision
I designed a **differential signature snapshot architecture**:

- When the user explicitly clicks **"Save Baseline Snapshot"**, ByteMap creates a tiny JSON signature file (~35 KB).
- The snapshot stores only:
  - Timestamp (ISO 8601)
  - Truncated path hash
  - Folder path string
  - Aggregated byte size
- When the user scans again days or weeks later, ByteMap performs an in-memory diff between the active scan and the baseline snapshot.
- Only directories with a delta $\ge 5\text{MB}$ are flagged, eliminating noise and spotlighting genuine storage hogs.
- A responsive Date Range Filter (All Time, Today, Last 7 Days, Last 30 Days, or custom From/To pickers) lets users isolate specific maintenance windows.

## Trade-offs
- **Cons**: We track directory-level size deltas rather than individual deleted filenames.
- **Pros**: Zero background daemons, zero battery drain, negligible disk footprint (~35 KB per snapshot), and complete privacy.
