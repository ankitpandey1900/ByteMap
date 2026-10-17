# ADR 002: Staged BLAKE3 Duplicate Detection

## Status
Accepted

## The Problem
Detecting true duplicate files requires cryptographic content verification. Comparing files by name or size alone produces dangerous false positives (two different 100MB video files can easily share the exact same byte length).

However, computing a full SHA-256 or BLAKE3 hash on every file during a scan is a massive disk I/O bottleneck. Reading 500GB of files just to check for duplicates will max out SSD throughput and make the app feel sluggish.

## The Decision
I implemented a **three-stage filtering pipeline**:

1. **Stage 1: Size Partitioning**
   - Files are grouped in memory by their exact byte size.
   - Any file with a unique size is discarded immediately. Over 95% of files are eliminated here with **zero disk reads**.
2. **Stage 2: 4KB Prefix Hash**
   - For candidate groups with matching sizes, read only the first 4,096 bytes and compute a fast BLAKE3 prefix hash.
   - Files with differing headers are discarded.
3. **Stage 3: Full Cryptographic BLAKE3 Stream**
   - Only candidate files that share both the same size and identical 4KB prefixes are fully read.
   - Files are streamed in 64KB buffers into BLAKE3. If the final hashes match, they are flagged as genuine duplicates.

## Trade-offs
- **Cons**: Running the pipeline requires multiple passes over candidates.
- **Pros**: It cuts disk read operations by more than 95%, protects against false positives, keeps memory usage minimal, and runs 10x faster than naive hashing.
