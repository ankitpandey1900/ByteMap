# ByteMap User Guide

A practical walkthrough of how to use ByteMap to analyze and clean up your local storage.

---

## 1. Choosing What to Scan

When you open ByteMap, it checks your operating system for connected drives:

- **Full Drive Scan**: In the **Drives** tab, you'll see cards for all internal and external partitions (`C:\`, `D:\`, etc.) with their capacity, used space, and filesystem format (NTFS, FAT32, etc.). Click **Scan Drive** on any card.
- **Specific Folder Scan**: If you only want to inspect a particular directory (like your `Downloads` folder, `node_modules`, or game library), click **Select Folder...** in the Drives tab or click **Browse...** in the top bar.

---

## 2. Starting and Cancelling a Scan

Clicking **Start Scan** opens the scan options modal:
- **Exclude hidden files**: Skip hidden files and dotfolders (e.g. `.git`).
- **Ignore patterns**: By default, ByteMap skips system folders like `$RECYCLE.BIN` and `System Volume Information`. You can add custom patterns in the **Settings** tab.

While the scan is running:
- The modal shows real-time stats: files processed, folders found, data size, and elapsed time.
- If you change your mind, click **Cancel Scan**. The Rust worker thread stops immediately and clears its buffer.

---

## 3. Using the Storage Treemap

Once a scan finishes, the **Overview** tab displays the interactive treemap:

- **What the rectangles mean**: Each rectangle represents a folder or file. The size of the rectangle is proportional to how much disk space it occupies.
- **Colors**: Colors correspond to file categories:
  - **Blue**: Videos (`.mp4`, `.mkv`, etc.)
  - **Pink**: Images (`.png`, `.jpg`, etc.)
  - **Purple**: Audio (`.mp3`, `.flac`, etc.)
  - **Emerald**: Documents (`.pdf`, `.docx`, etc.)
  - **Amber**: Archives (`.zip`, `.7z`, etc.)
  - **Indigo**: Code and development (`.rs`, `.ts`, `.json`, etc.)
  - **Dark Slate**: Folders
- **Drill down**: Click any folder rectangle to zoom in and see its contents.
- **Breadcrumbs**: Use the top path breadcrumbs to navigate back up to parent folders.
- **Filters**: Use the toolbar to filter out small files (e.g., show only items `> 100 MB`) or type a keyword to highlight matching files.

---

## 4. Finding Large Files

Navigate to the **Large Files** tab to see your heaviest disk consumers ranked from largest to smallest:
- Use the **Min Size** selector to filter by `> 10 MB`, `> 50 MB`, `> 100 MB`, `> 500 MB`, or `> 1 GB`.
- Click the external link icon on any row to reveal the file in Windows Explorer or macOS Finder.

---

## 5. Detecting Duplicates

1. Go to the **Duplicates** tab.
2. Click **Find Duplicates**.
3. ByteMap groups candidate files by exact size, checks their 4KB header prefix, and computes a full BLAKE3 cryptographic hash on matches.
4. Each duplicate group shows:
   - The original file candidate (marked with a star).
   - All duplicate copies, their file paths, and individual sizes.
   - Total space you can reclaim if you remove the redundant copies.
5. Click **Mark for cleanup** on any copy you want to queue for removal.

---

## 6. Safe Cleanup & Recovery

ByteMap never deletes files automatically. To clean up:
1. Open the **Cleanup** tab.
2. Review items flagged under categories like *Temporary Files*, *Obsolete Installers*, *Large Archives*, and *Duplicates*.
3. Each item has a risk indicator (`Safe`, `Low`, or `Moderate`) explaining why it was flagged.
4. Check the items you want to remove and click **Clean Selected**.
5. A confirmation dialog shows the exact number of files and total gigabytes that will be freed.

### How to Recover a File If You Make a Mistake
By default, ByteMap uses the `trash` crate to move deleted items to your operating system's **Recycle Bin** (Windows) or **Trash** (macOS/Linux). If you accidentally deleted something:
- Open your system Recycle Bin / Trash on the desktop.
- Right-click the file and click **Restore**.

---

## 7. Exporting Scan Reports

If you want to save your scan data:
- Go to the **Settings** tab.
- Click **Export Report (JSON)** to download a complete machine-readable report.
- Click **Export Files Table (CSV)** to download a spreadsheet you can open in Excel.
