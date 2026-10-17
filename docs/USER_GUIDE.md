# ByteMap User Guide

Welcome to **ByteMap**, your professional desktop storage intelligence application. This guide will walk you through analyzing drives, inspecting large files, identifying duplicates, and safely recovering storage.

---

## 1. Selecting a Storage Target

1. **Drive Cards**: On the **Drives** tab, ByteMap lists all detected physical storage drives, their mount points, filesystem format, and available storage. Click **Scan Drive** on any card to scan that partition.
2. **Custom Folder Selection**: Click **Select Folder...** or use the **Browse...** button in the top navigation bar to select any specific directory (e.g. `D:\Projects` or `C:\Users\YourName\Downloads`).

---

## 2. Running & Cancelling a Scan

1. Click **Start Scan** in the top bar or within the configuration dialog.
2. The **Configure Storage Scan** modal appears. You can optionally exclude hidden files or supply custom ignore patterns (such as `node_modules` or `.cache`).
3. During scanning, real-time metrics display file count, directory count, elapsed duration, and the current path being processed.
4. If you wish to abort at any time, click **Cancel Scan**. Traversal will stop immediately without corrupting application state.

---

## 3. Navigating the Interactive Storage Treemap

1. In the **Overview** dashboard, the central panel displays the **Storage Treemap**.
2. Rectangle area corresponds directly to file and directory size. Colors reflect category types (Blue for Video, Emerald for Documents, Pink for Images, Indigo for Code, etc.).
3. **Drill Down**: Click any directory rectangle to zoom into its contents.
4. **Breadcrumbs**: Use the top path breadcrumbs to navigate back up to ancestor directories.
5. **Filters**: Adjust the **Min Size** dropdown (e.g., `> 100 MB`) or enter a filename search term in the toolbar to isolate specific items.

---

## 4. Analyzing Large Files & Duplicates

- **Large Files View**: Quickly ranks the biggest files consuming storage space. Set a threshold (e.g. `> 500 MB`) to locate disk-hogging video archives, disk images, or database dumps.
- **Duplicate Analysis**: Switch to the **Duplicates** tab and click **Find Duplicates**. ByteMap runs a cryptographic BLAKE3 verification to identify exact byte-for-byte duplicates. Click **Mark for cleanup** to queue redundant copies.

---

## 5. Safe Cleanup Workflow

1. Navigate to the **Cleanup** tab.
2. Review recommendations categorized by:
   - **Temporary Files**: Cache, `.tmp`, and scratch files.
   - **Old Installers**: Obsolete `.msi`, `.iso`, and setup packages.
   - **Large Archives**: Heavy `.zip` and `.tar` files.
   - **Duplicates**: Exact matching copies.
3. Every recommendation provides a **Risk Level** (Safe, Low, Moderate) and explanation.
4. Select the items you wish to clean, then click **Clean Selected**.
5. A confirmation modal will display the exact number of files and total reclaimable space. Confirming will move items to your operating system's **Recycle Bin / Trash**, allowing restoration if needed.

---

## 6. Exporting Reports

Under **Settings**, click:
- **Export Report (JSON)**: To save a machine-readable summary of the current scan.
- **Export Files Table (CSV)**: To open file rankings in Microsoft Excel or Google Sheets.
