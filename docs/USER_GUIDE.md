# ByteMap User Guide

A practical, no-nonsense walkthrough of how to use ByteMap to analyze and reclaim storage on your computer.

- **Author**: Ankit Pandey
- **Version**: 1.0.8
- **Website**: [bytemap.alltracker.online](https://bytemap.alltracker.online/)

---

## 1. Choosing What to Scan

When you open ByteMap, it automatically checks your operating system for connected drives:

- **Scan an Entire Drive**: On the **Drives** tab, you'll see cards for all your internal and external partitions (`C:\`, `D:\`, external USB drives, etc.) with their capacity, used space, and filesystem type. Click **Scan Drive** on any card.
- **Scan a Specific Folder**: If you only want to investigate a specific directory (like your `Downloads` folder, a giant `SteamLibrary`, or your coding `Projects`), click **Select Folder...** in the Drives tab or click **Browse...** in the top bar.

---

## 2. Running a Scan

Clicking **Start Scout Mission** opens the scan options modal:
- **Exclude hidden files**: Skip dotfolders (e.g. `.git`, `.cache`) if you only care about visible user files.
- **Ignore patterns**: By default, ByteMap skips system folders like `$RECYCLE.BIN` and `System Volume Information`. You can add custom patterns in the **Settings** tab.

While the scan is running:
- You'll see real-time stats: files processed, folders found, total gigabytes scanned, and scanning speed (files/sec).
- If you need to stop, click **Abort Mission**. The Rust worker stops immediately and clears its buffer.

---

## 3. Reading the Treemap & Color Modes

Once a scan finishes, the **Overview** tab displays the interactive treemap:

- **What the tiles mean**: Each tile represents a folder or file. The size of the tile is strictly proportional to how much disk space it occupies. Big tile = big space hog.
- **Drill Down**: Click any folder tile to zoom in and see what's inside.
- **Breadcrumbs**: Use the top path breadcrumbs to jump back up to parent folders anytime.
- **Color Palettes**: Click the palette button in the top right of the treemap to toggle between:
  - **🌈 Vibrant Map**: A 16-color comic palette that visually differentiates neighboring folders with high-contrast colors and a top 3D sheen.
  - **🏷️ Category Map**: Hues mapped by file category (Blue for Videos, Pink for Images, Amber for Archives, Indigo for Code, etc.).
- **Category Filter**: Click any category pill in the legend (e.g. `Videos`) to spotlight only those files on the map.

---

## 4. Time Machine: Spotting What Swelled Up Over Time

If you've ever asked *"Where did 20 GB vanish overnight?"*, Time Machine is for you:

1. **Save a Baseline**: While viewing a scan, click the **Time Machine (Diff)** button in the top bar, then click **"Save Baseline Snapshot"**. ByteMap saves a tiny signature file (~35 KB) containing folder size snapshots.
2. **Compare After Installing or Downloading**: A week or month later, scan the same folder again and open Time Machine.
3. **Interactive Charts**:
   - **Timeline Area Chart**: Shows your total storage growth curve over time across all recorded snapshots.
   - **Diverging Delta Chart**: Instantly flags swollen directories in bright amber/red with deltas like `+14.2 GB`, and shrunk directories in green.
4. **Date Range Filter**:
   - Use quick filter chips: **All Time**, **Today**, **Last 7 Days**, or **Last 30 Days**.
   - Or pick custom **From** and **To** dates to pinpoint exactly when a game, update, or backup took over your disk.

---

## 5. Finding Large Files & Using the Histogram

Navigate to the **Large Files** tab to see your heaviest files ranked from biggest to smallest:

- **Interactive Size Histogram**: A bar chart at the top breaks your heavy files into size tiers:
  - `100MB – 250MB`
  - `250MB – 500MB`
  - `500MB – 1GB`
  - `1GB – 5GB`
  - `5GB+`
- **Click to Filter**: Click any bar in the histogram to instantly filter the table below to that exact size tier.
- **Reveal in Explorer/Finder**: Click the folder icon on any row to open that exact file in Windows Explorer or macOS Finder.

---

## 6. Developer & IDE Bloat Sweeper

If you write code or work with digital tools, build artifacts quietly consume dozens of gigabytes:

1. Open the **Cleanup** tab.
2. Check the **Developer Artifacts** section:
   - Identifies stale `node_modules`, Rust `target/`, Python `.venv`, Next.js `.next`, Gradle caches, and `dist/` folders.
   - Source code is 100% shielded and untouched.
3. Check the **IDE & Tool Caches** card:
   - Spots bloated editor caches from VS Code, Cursor, JetBrains, npm, pnpm, Cargo, and pip.
4. Select the build artifacts you want to reclaim and click **Purge Selected**.

---

## 7. 3-Stage Duplicate Finder

ByteMap doesn't guess duplicates based on filenames alone (which leads to false positives):

1. Go to the **Duplicates** tab and click **Find Duplicates**.
2. ByteMap runs the 3-stage elimination funnel:
   - Groups files by exact byte size in memory (0 disk reads).
   - Reads only the first 4KB header prefix with BLAKE3.
   - Computes a full streamed BLAKE3 cryptographic hash on true collisions.
3. Duplicate groups appear with the original file starred (⭐) and redundant copies listed below.
4. Mark redundant copies for cleanup and see your total reclaimable gigabytes calculated in real-time.

---

## 8. Safe Cleanup & How to Undo a Mistake

ByteMap never deletes files without your explicit confirmation.

1. Open the **Cleanup** tab.
2. Review items flagged under *Temporary Files*, *Obsolete Installers*, *Build Artifacts*, and *Duplicates*.
3. Each item has a risk indicator (`Safe`, `Low`, or `Moderate`) explaining why it was flagged.
4. Check the items you want to remove and click **Clean Selected**.
5. A confirmation modal will display the exact number of files and total gigabytes that will be freed.

### How to Restore a File If You Made a Mistake
By default, ByteMap uses native operating system trash APIs (`IFileOperation` on Windows, `NSWorkspace` on macOS). Files are moved to your **Recycle Bin** or **Trash**, NOT permanently destroyed:
- Open your desktop **Recycle Bin** (Windows) or **Trash** (macOS).
- Locate the file, right-click, and select **Restore** (or **Put Back** on Mac).

---

## 9. Exporting Standalone HTML & CSV Reports

Need to send an audit report to your boss, IT department, or a client?

- **Standalone HTML Audit Report**: In the top bar or settings, click **Export Audit (HTML)**. This generates a single, self-contained HTML file with embedded styling, charts, and top storage hogs. It requires zero internet access and includes print-to-PDF formatting.
- **Spreadsheet Export**: Click **Export Table (CSV)** to download a spreadsheet you can open in Microsoft Excel, Google Sheets, or Apple Numbers.
