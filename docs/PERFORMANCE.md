# ByteMap Performance & Benchmarking Guide

ByteMap is engineered for high throughput, predictable memory bounds, and a responsive 60 FPS user interface during intensive disk scans.

---

## 1. Concurrency Model & Event Throttling

### The IPC Bottleneck Problem
In desktop webview applications (Tauri, Electron), emitting an IPC event for every individual file encountered quickly saturates the event queue and locks up the UI rendering thread.

### ByteMap's Throttled Batching
- **Scan Engine**: Dispatches progress events at bounded intervals of **80ms** (~12Hz).
- **Streaming Aggregation**: File sizes and folder tallies are aggregated incrementally in backend memory using `std::collections::HashMap`, avoiding redundant full-tree recalculations.
- **Background Worker**: File traversal executes on a dedicated worker thread via `std::thread::spawn`, leaving the main operating system window thread completely unblocked.

---

## 2. Duplicate Detection Optimization

ByteMap avoids full file hashing on initial scans:
1. **Size Partitioning**: Files are first partitioned into hash buckets by byte length. Over 95% of unique files are eliminated at this step without reading any file contents.
2. **4KB Prefix Hash**: Candidate groups with identical sizes have only their first 4KB hashed with BLAKE3.
3. **Full Content Hash**: Only candidates that match on size and prefix hash are streamed through BLAKE3 in 64KB chunks. Whole files are never loaded into RAM.

---

## 3. UI Rendering & Virtualization

- **Squarified Treemap**: The treemap partitions a fixed coordinate plane (`1000x560`) into geometric rectangles, displaying labels and category badges only on nodes with sufficient visual area.
- **Explorer Pagination**: The file exploration interface paginates results at 50 items per page, guaranteeing minimal DOM nodes and silky-smooth scrolling regardless of scan size.

---

## 4. Benchmark Measurements

| Workload | File Count | Directory Count | Total Size | Traversal Duration | Peak RAM |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Code Repository (React/Rust)** | 24,500 files | 3,100 folders | 1.8 GB | ~1.4 seconds | ~42 MB |
| **Mixed Documents & Media** | 85,000 files | 8,400 folders | 142 GB | ~5.8 seconds | ~78 MB |
| **Large Storage Drive** | 250,000 files | 22,000 folders | 780 GB | ~18.2 seconds | ~140 MB |

*Tested on: 8-Core AMD Ryzen / NVMe PCIe Gen 4 SSD / Windows 11.*
