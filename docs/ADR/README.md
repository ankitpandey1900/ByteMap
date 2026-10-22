# Architectural Decision Records (ADRs)

This directory documents the core architectural decisions made in ByteMap, including context, rationale, and tradeoffs.

| ADR | Title | Status | Scope |
| :--- | :--- | :--- | :--- |
| [ADR 001](ADR-001-no-database-policy.md) | **Strict No-Database Policy** | Accepted | Ephemeral RAM state, zero background daemons |
| [ADR 002](ADR-002-staged-duplicate-detection.md) | **Staged BLAKE3 Duplicate Detection** | Accepted | 3-stage elimination funnel, zero-read size matching |
| [ADR 003](ADR-003-throttled-ipc-streaming.md) | **80ms Throttled IPC Streaming** | Accepted | Backpressure management, 60 FPS UI guarantee |
| [ADR 004](ADR-004-single-pass-prefix-rollup.md) | **Single-Pass Prefix Rollup vs. Recursive AST** | Accepted | $O(D)$ directory rollup, zero duplicate I/O |
| [ADR 005](ADR-005-defensive-cleanup-toctou.md) | **TOCTOU-Proof Defensive Cleanup** | Accepted | PathValidator, system blocklists, OS Trash priority |
| [ADR 006](ADR-006-zero-db-time-machine-snapshots.md) | **Zero-DB Time Machine Storage Snapshots** | Accepted | Lightweight signature files (~35KB), date range filters |
