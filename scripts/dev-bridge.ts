import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';

export function getFileCategory(ext: string) {
  const e = ext.toLowerCase();

  // Videos
  if ([
    '.mp4', '.mkv', '.mov', '.avi', '.wmv', '.flv', '.webm', '.m4v', '.mpg', '.mpeg',
    '.3gp', '.3g2', '.m2ts', '.mts', '.vob', '.ogv', '.ts', '.divx', '.xvid', '.rm',
    '.rmvb', '.asf', '.f4v', '.m4p', '.mpv', '.mpe', '.bik', '.hevc',
  ].includes(e)) return 'video';

  // Images
  if ([
    '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.tiff', '.tif', '.ico',
    '.raw', '.cr2', '.cr3', '.nef', '.arw', '.dng', '.orf', '.rw2', '.pef', '.heic',
    '.heif', '.avif', '.jxl', '.psd', '.ai', '.eps', '.cdr', '.xcf', '.indd', '.dwg',
    '.dxf', '.svgz', '.icns', '.cur',
  ].includes(e)) return 'image';

  // Audio
  if ([
    '.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma', '.m4a', '.alac', '.opus', '.aiff',
    '.mid', '.midi', '.mka', '.ac3', '.dts', '.pcm', '.ra', '.amr', '.ape', '.au',
    '.voc', '.caf', '.wv', '.mp2', '.m4b', '.m4r',
  ].includes(e)) return 'audio';

  // Documents
  if ([
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.odt', '.ods', '.odp',
    '.rtf', '.txt', '.md', '.markdown', '.csv', '.tsv', '.epub', '.mobi', '.azw',
    '.azw3', '.djvu', '.fb2', '.cbr', '.cbz', '.pages', '.numbers', '.key', '.tex',
    '.latex', '.vcf', '.ics', '.pps', '.ppsx', '.xlsm', '.docm', '.pptm', '.xlt',
    '.xltx', '.dot', '.dotx', '.log',
  ].includes(e)) return 'document';

  // Archives
  if ([
    '.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz', '.tgz', '.tbz2', '.txz',
    '.lz', '.lzma', '.lzh', '.lz4', '.zst', '.zstd', '.iso', '.dmg', '.cab', '.z',
    '.wim', '.vhd', '.vhdx', '.vdi', '.vmdk', '.img', '.cue', '.nrg', '.mdf', '.cpio',
    '.ar', '.shar', '.sit', '.sitx',
  ].includes(e)) return 'archive';

  // Applications & Executables
  if ([
    '.exe', '.msi', '.app', '.bat', '.cmd', '.ps1', '.sh', '.bin', '.deb', '.rpm',
    '.apk', '.ipa', '.jar', '.appimage', '.flatpak', '.snap', '.pkg', '.msix',
    '.appx', '.msp', '.run', '.gadget', '.com', '.scr', '.dll',
  ].includes(e)) return 'app';

  // Development & Code (Comprehensive web, systems, mobile, cloud, IaC, data, config)
  if ([
    '.rs', '.rlib', '.ron',
    '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.mts', '.cts', '.map',
    '.vue', '.svelte', '.astro', '.html', '.htm', '.xhtml', '.css', '.scss', '.sass',
    '.less', '.styl', '.postcss', '.pcss', '.wasm', '.wat',
    '.mdx', '.jinja', '.jinja2', '.j2', '.twig', '.blade', '.hbs', '.handlebars',
    '.ejs', '.liquid', '.pug', '.haml', '.mustache',
    '.py', '.pyw', '.pyx', '.pxd', '.pyi', '.ipynb',
    '.go', '.mod', '.sum',
    '.c', '.cc', '.cpp', '.cxx', '.c++', '.cp', '.h', '.hh', '.hpp', '.hxx',
    '.h++', '.inl', '.ipp', '.tpp', '.m', '.mm',
    '.cs', '.csx', '.fs', '.fsi', '.fsx', '.vb', '.vbs', '.xaml', '.razor',
    '.sln', '.csproj', '.fsproj', '.vbproj', '.props', '.targets',
    '.java', '.kt', '.kts', '.scala', '.sc', '.groovy', '.gvy', '.gradle',
    '.properties', '.pom',
    '.swift',
    '.rb', '.erb', '.rake', '.gemspec',
    '.php', '.phtml', '.php3', '.php4', '.php5', '.phps',
    '.dart',
    '.lua',
    '.r', '.rmd', '.jl',
    '.ex', '.exs', '.erl', '.hrl',
    '.hs', '.lhs', '.ml', '.mli',
    '.zig', '.nim', '.nims', '.d',
    '.clj', '.cljs', '.cljc', '.edn', '.lisp', '.lsp', '.scm', '.rkt', '.el',
    '.asm', '.s',
    '.sql', '.pgsql', '.plsql', '.psql', '.sqlite', '.sqlite3', '.graphql', '.gql',
    '.prisma', '.surql',
    '.json', '.json5', '.jsonc', '.jsonl', '.ndjson', '.geojson',
    '.yaml', '.yml', '.toml', '.xml', '.xsd', '.xsl', '.xslt', '.plist',
    '.ini', '.cfg', '.conf', '.cnf', '.config', '.env', '.envrc', '.example',
    '.tf', '.tfvars', '.hcl', '.dockerfile', '.containerfile', '.k8s', '.bicep',
    '.makefile', '.mk', '.cmake', '.ninja', '.bazel', '.bzl', '.lock', '.lockb',
    '.proto', '.thrift', '.avsc',
  ].includes(e)) return 'dev';

  // Games & Emulation
  if ([
    '.pak', '.vpk', '.wad', '.bsp', '.sav', '.rom', '.gba', '.nes', '.sfc', '.nds',
    '.gam', '.save', '.n64', '.z64', '.cso', '.gcm', '.xbe', '.xex', '.nsp', '.xci',
    '.3ds', '.cia', '.psx', '.pbp', '.chd',
  ].includes(e)) return 'game';

  return 'other';
}

export function performRealScan(targetRoot: string) {
  const startTime = Date.now();
  let root = targetRoot ? targetRoot.trim() : process.cwd();
  if (!fs.existsSync(root)) {
    root = process.cwd();
  }

  let totalFiles = 0;
  let totalDirs = 0;
  let totalBytes = 0;
  const largestFiles: any[] = [];
  const foldersMap = new Map<string, { size: number; count: number; name: string }>();
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

export function systemDrivesBridgePlugin(): Plugin {
  const handler = (req: any, res: any, next: any) => {
    if (req.url === '/api/drives') {
      const drives: any[] = [];
      for (let c = 67; c <= 90; c++) {
        const letter = String.fromCharCode(c) + ':\\';
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
                filesystem: 'NTFS',
                is_removable: false,
                is_read_only: false,
              });
            }
          }
        } catch {}
      }
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(drives));
      return;
    }

    if (req.url?.startsWith('/api/scan')) {
      let body = '';
      req.on('data', (chunk: any) => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          const rootPath = parsed.root_path || process.cwd();
          const summary = performRealScan(rootPath);
          res.setHeader('Content-Type', 'application/json');
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
    name: 'system-drives-bridge',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}
