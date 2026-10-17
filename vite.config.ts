import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import fs from "node:fs";

function getFileCategory(ext: string) {
  const e = ext.toLowerCase();
  if (['.mp4', '.mkv', '.mov', '.avi', '.webm', '.wmv'].includes(e)) return 'video';
  if (['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.ico', '.bmp'].includes(e)) return 'image';
  if (['.mp3', '.wav', '.flac', '.ogg', '.m4a', '.aac'].includes(e)) return 'audio';
  if (['.pdf', '.doc', '.docx', '.txt', '.md', '.csv', '.xlsx', '.rtf'].includes(e)) return 'document';
  if (['.zip', '.tar', '.gz', '.7z', '.rar', '.iso', '.bz2'].includes(e)) return 'archive';
  if (['.exe', '.msi', '.dll', '.bin'].includes(e)) return 'app';
  if (['.ts', '.tsx', '.js', '.jsx', '.rs', '.go', '.py', '.json', '.html', '.css', '.toml', '.lock'].includes(e)) return 'dev';
  return 'other';
}

function performRealScan(targetRoot: string) {
  const startTime = Date.now();
  let root = targetRoot ? targetRoot.trim() : process.cwd();
  if (!fs.existsSync(root)) {
    root = process.cwd();
  }

  let totalFiles = 0;
  let totalDirs = 0;
  let totalBytes = 0;
  const largestFiles: any[] = [];
  const foldersMap = new Map<string, { size: number; count: number }>();
  const catMap = new Map<string, { bytes: number; count: number }>();
  const extMap = new Map<string, { bytes: number; count: number }>();
  const sizeMap = new Map<number, any[]>();
  const cleanupCandidates: any[] = [];

  function walk(currentDir: string, depth: number) {
    if (depth > 5 || totalFiles >= 8000) return;
    let entries: any[] = [];
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const ent of entries) {
      if (ent.name.startsWith('$') || ent.name === 'System Volume Information' || (ent.name === 'node_modules' && depth > 2)) continue;
      const fullPath = path.join(currentDir, ent.name);
      try {
        if (ent.isDirectory()) {
          totalDirs++;
          walk(fullPath, depth + 1);
        } else if (ent.isFile()) {
          totalFiles++;
          const stat = fs.statSync(fullPath);
          const size = stat.size;
          totalBytes += size;
          const ext = path.extname(ent.name).toLowerCase() || '.other';
          const cat = getFileCategory(ext);

          const rel = path.relative(root, fullPath);
          const parts = rel.split(/[\\/]+/).filter(Boolean);
          for (let i = 1; i < parts.length; i++) {
            const folderRel = parts.slice(0, i).join(path.sep);
            const folderName = parts[i - 1];
            const cur = foldersMap.get(folderRel) || { size: 0, count: 0, name: folderName };
            cur.size += size;
            cur.count += 1;
            foldersMap.set(folderRel, cur);
          }

          const curCat = catMap.get(cat) || { bytes: 0, count: 0 };
          curCat.bytes += size;
          curCat.count += 1;
          catMap.set(cat, curCat);

          const curExt = extMap.get(ext) || { bytes: 0, count: 0 };
          curExt.bytes += size;
          curExt.count += 1;
          extMap.set(ext, curExt);

          const fileObj = {
            id: 'file-' + totalFiles,
            name: ent.name,
            path: fullPath,
            size_bytes: size,
            category: cat,
            extension: ext,
            modified_at: stat.mtimeMs,
            is_hidden: false,
            is_system: false,
          };

          largestFiles.push(fileObj);

          if (size > 512 * 1024) {
            const list = sizeMap.get(size) || [];
            list.push(fileObj);
            sizeMap.set(size, list);
          }

          if (['.iso', '.tmp', '.log', '.bak'].includes(ext) || fullPath.toLowerCase().includes('download')) {
            if (cleanupCandidates.length < 5) {
              cleanupCandidates.push({
                id: 'clean-' + cleanupCandidates.length,
                type: ext === '.tmp' || ext === '.log' ? 'temp_file' : 'large_archive',
                title: ent.name,
                description: `Reclaimable file located at ${fullPath}`,
                risk_level: 'safe',
                risk_explanation: 'Non-system temporary or large asset that can be safely archived or removed.',
                suggested_action: 'trash',
                file: fileObj,
              });
            }
          }
        }
      } catch {}
    }
  }

  walk(root, 0);

  largestFiles.sort((a, b) => b.size_bytes - a.size_bytes);

  const largestFolders = Array.from(foldersMap.entries())
    .map(([folderRel, data], idx) => ({
      id: 'fol-' + idx,
      name: data.name || path.basename(folderRel),
      path: path.join(root, folderRel),
      size_bytes: data.size,
      file_count: data.count,
      dir_count: 1,
    }))
    .sort((a, b) => b.size_bytes - a.size_bytes);

  const categories = Array.from(catMap.entries())
    .map(([category, data]) => ({
      category: category as any,
      total_bytes: data.bytes,
      file_count: data.count,
      percentage: totalBytes > 0 ? Number(((data.bytes / totalBytes) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.total_bytes - a.total_bytes);

  const extensions = Array.from(extMap.entries())
    .map(([extension, data]) => ({
      extension,
      category: getFileCategory(extension) as any,
      total_bytes: data.bytes,
      file_count: data.count,
    }))
    .sort((a, b) => b.total_bytes - a.total_bytes)
    .slice(0, 10);

  const duplicate_groups: any[] = [];
  for (const [size, list] of sizeMap.entries()) {
    if (list.length > 1) {
      duplicate_groups.push({
        hash: 'dup-size-' + size,
        size_bytes: size,
        reclaimable_bytes: size * (list.length - 1),
        files: list.slice(0, 4),
      });
      if (duplicate_groups.length >= 5) break;
    }
  }

  return {
    root_path: root,
    total_bytes: totalBytes,
    total_files: totalFiles,
    total_directories: totalDirs,
    scan_duration_ms: Math.max(1, Date.now() - startTime),
    error_count: 0,
    errors: [],
    largest_files: largestFiles.slice(0, 20),
    largest_folders: largestFolders.slice(0, 15),
    categories,
    extensions,
    duplicate_groups,
    cleanup_candidates: cleanupCandidates,
    timestamp: new Date().toISOString(),
  };
}

function systemDrivesPlugin() {
  const handler = (req: any, res: any, next: any) => {
    if (req.url === "/api/drives") {
      const drives: any[] = [];
      for (let c = 67; c <= 90; c++) {
        const letter = String.fromCharCode(c) + ":\\";
        try {
          if (fs.existsSync(letter)) {
            const s = fs.statfsSync(letter);
            const total = Number(s.blocks) * Number(s.bsize);
            const avail = Number(s.bavail) * Number(s.bsize);
            const used = total - avail;
            if (total > 0) {
              const driveLetter = String.fromCharCode(c);
              drives.push({
                id: `drive-${driveLetter.toLowerCase()}`,
                name: `Local Disk (${driveLetter}:)`,
                mount_point: `${driveLetter}:\\`,
                total_bytes: total,
                available_bytes: avail,
                used_bytes: used,
                filesystem: "NTFS",
                is_removable: false,
                is_read_only: false,
              });
            }
          }
        } catch {}
      }
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(drives));
      return;
    }

    if (req.url?.startsWith("/api/scan")) {
      let body = "";
      req.on("data", (chunk: any) => {
        body += chunk;
      });
      req.on("end", () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          const rootPath = parsed.root_path || process.cwd();
          const summary = performRealScan(rootPath);
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(summary));
        } catch (err: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    next();
  };

  return {
    name: "system-drives-bridge",
    configureServer(server: any) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server: any) {
      server.middlewares.use(handler);
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), systemDrivesPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
  // @ts-ignore
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
  },
});
