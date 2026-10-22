# ADR 004: Single-Pass Prefix Rollup vs. Recursive AST Tree

## Status
Accepted

## The Problem
Disk visualizers must calculate the aggregate size of every directory (i.e. a folder's total size is the sum of all its files plus all files in all its subdirectories).

Traditional implementations construct recursive Abstract Syntax Trees (ASTs) or perform multiple recursive directory passes:
1. **High Memory Overhead**: Creating thousands of nested node structs with pointers causes memory fragmentation and pointer indirection overhead.
2. **Double I/O**: Scanning a folder and then re-reading child directories to compute sums wastes precious SSD read bandwidth.

## The Decision
I implemented a **single-pass prefix rollup map** using an in-memory hash map (`HashMap<PathBuf, DirectoryStats>`):

- When the scanner hits a file on disk (e.g. `C:\Projects\game\assets\hero.png`, 50 MB), that file's size immediately bubbles up to all its parent prefixes:
  - `"C:\Projects\game\assets"` gets +50 MB
  - `"C:\Projects\game"` gets +50 MB
  - `"C:\Projects"` gets +50 MB
- Each file is read from disk **only once**.
- When traversal finishes, all directory rollup statistics are already fully computed and immediately available for the Treemap without any secondary calculation pass.

## Trade-offs
- **Cons**: Requires hash lookups for parent path prefixes during traversal.
- **Pros**: $O(D)$ insertion time where directory depth $D \le 12$, zero duplicate disk reads, and zero tree-pointer memory fragmentation.
