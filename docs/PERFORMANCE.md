# ByteMap Performance Notes

Notes on how ByteMap handles large scans, keeps the UI smooth, and avoids common performance traps in desktop webview apps.

---

## 1. Why Desktop Webview Apps Freeze During Scans

When you write a desktop app using Electron or Tauri, the most common beginner mistake is doing this:

```rust
// DON'T DO THIS
for entry in WalkDir::new(root) {
    app.emit("file_found", entry.path()); // Sends 100,000 IPC messages
}
```

If a folder has 80,000 files, this queues 80,000 IPC serialize-and-deserialize operations. The webview event loop gets completely clogged, React tries to re-render 80,000 times, and the application freezes solid for 30 seconds.

### How ByteMap Handles This

1. **Dedicated Worker Thread**: `Scanner::scan()` runs in `std::thread::spawn()`. The UI thread remains completely responsive to clicks and scrolling.
2. **80ms Timer Batching**:
   ```rust
   if last_progress_report.elapsed().as_millis() >= 80 {
       progress_callback(ScanProgress { ... });
       last_progress_report = Instant::now();
   }
   ```
   Instead of emitting an event per file, the worker thread only sends an update every ~80 milliseconds (~12 updates/sec). This gives the user smooth visual progress without saturating the IPC bridge.

3. **Incremental Rollup in Memory**:
   Directory sizes are rolled up into their parents while traversing:
   ```rust
   let mut current = path.parent();
   while let Some(parent) = current {
       let d_entry = dir_sizes.entry(parent.to_path_buf()).or_insert((0, 0, 0));
       d_entry.0 += size;
       d_entry.1 += 1;
       if parent == root_path { break; }
       current = parent.parent();
   }
   ```
   When the walker finishes, all parent folder totals are already aggregated. There is no expensive second pass.

---

## 2. Preventing DOM Explosions in the Treemap

Rendering 50,000 individual `<rect>` elements in an SVG or HTML DOM destroys browser performance and causes massive layout thrashing.

ByteMap avoids this with three techniques:
1. **Directory-Level Slicing**: The treemap only calculates rectangles for the children of the *currently inspected folder*. When you drill down, it calculates the layout for that specific folder.
2. **Squarified Layout**: A pure TypeScript algorithm divides a fixed `1000x560` canvas into balanced aspect ratios close to 1:1.
3. **Threshold Culling**: Node labels and sizes are only drawn on rectangles wide enough (`w > 45px` and `h > 28px`) to read them. Tiny sub-pixel rectangles don't waste CPU rendering text.

---

## 3. Duplicate Hashing Benchmarks

Full cryptographic hashing of every file on a 500GB drive would take 30+ minutes and grind your disk to a halt.

ByteMap's 3-stage pipeline eliminates almost all I/O:

| Stage | What Gets Processed | I/O Cost | Time on 100GB Test Set |
| :--- | :--- | :--- | :--- |
| **1. Size Grouping** | Group all files by exact byte length | 0 bytes read from disk | < 0.05s |
| **2. 4KB Prefix Hash** | Read first 4KB of remaining candidates | 4KB per candidate file | ~ 0.4s |
| **3. Full BLAKE3** | Stream 64KB chunks only on matching candidates | Exact candidates only | ~ 2.1s |

On my test machine (AMD Ryzen 7, PCIe Gen 4 NVMe SSD, Windows 11), a folder with 25,000 files and 42GB of data runs duplicate detection in **under 3 seconds**.
