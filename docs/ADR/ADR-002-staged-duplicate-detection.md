# ADR 002: Staged Cryptographic Duplicate Detection

## Status
Accepted

## Context
Identifying duplicate files across storage partitions can be prohibitively expensive in I/O and CPU time if every file is hashed with cryptographic algorithms like SHA-256 or BLAKE3.

## Decision
ByteMap adopts a **three-stage detection pipeline**:
1. **Stage 1 (Size Partitioning)**: Group files strictly by identical byte length. Files with unique sizes are eliminated instantly without opening or reading them.
2. **Stage 2 (Prefix Hashing)**: For remaining candidate size groups, read only the first 4KB and compute a prefix hash.
3. **Stage 3 (Full BLAKE3 Hashing)**: Only files that match both size and prefix hash are streamed in 64KB blocks through the cryptographic BLAKE3 hasher.

## Consequences
- **Positive**: Reduces disk I/O by over 95% compared to naive full-file hashing; memory usage remains bounded to 64KB per file stream; high speed with cryptographic guarantee.
- **Negative**: Requires 3 distinct passes over candidates, but the overall wall-clock time is dramatically faster.
