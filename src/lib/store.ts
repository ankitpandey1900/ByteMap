import { create } from 'zustand';
import { api } from '@/lib/api';
import {
  ActiveTab,
  AppSettings,
  DevCacheItem,
  DriveInfo,
  FileCategory,
  ScanOptions,
  ScanProgress,
  ScanSummary,
  ScannedFolder,
} from '@/types';

interface AppState {
  // Navigation
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;

  // Drives
  drives: DriveInfo[];
  selectedDrive: DriveInfo | null;
  setDrives: (drives: DriveInfo[]) => void;
  setSelectedDrive: (drive: DriveInfo | null) => void;

  // Scan configuration & path
  scanPath: string;
  setScanPath: (path: string) => void;
  scanOptions: ScanOptions;
  setScanOptions: (options: Partial<ScanOptions>) => void;

  // Scan lifecycle & results
  scanProgress: ScanProgress;
  setScanProgress: (progress: ScanProgress) => void;
  scanSummary: ScanSummary | null;
  setScanSummary: (summary: ScanSummary | null) => void;
  clearScan: () => void;

  // Treemap state
  treemapCurrentPath: string;
  setTreemapCurrentPath: (path: string) => void;

  // Filters & exploration
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: FileCategory | 'all';
  setSelectedCategory: (cat: FileCategory | 'all') => void;
  minSizeBytes: number;
  setMinSizeBytes: (bytes: number) => void;

  // Cleanup selection & Live Storage Synchronizer
  selectedCleanupIds: Set<string>;
  toggleCleanupSelection: (id: string) => void;
  selectAllCleanup: (ids?: string[]) => void;
  clearCleanupSelection: () => void;
  applyCleanupResult: (
    freedBytes: number,
    deletedPaths: string[],
    pathBytesMap?: Record<string, number>,
    preferTrash?: boolean
  ) => void;
  refreshDrives: () => Promise<void>;
  lastCleanupSummary: {
    freedBytes: number;
    count: number;
    preferTrash: boolean;
    timestamp: number;
  } | null;
  clearLastCleanupSummary: () => void;

  // Developer Toolchain Caches (Manual on-demand scan with store cache)
  devCaches: DevCacheItem[] | null;
  isScanningDevCaches: boolean;
  setDevCaches: (caches: DevCacheItem[] | null) => void;
  setIsScanningDevCaches: (isScanning: boolean) => void;
  scanDevCachesAction: () => Promise<DevCacheItem[]>;

  // Settings
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;

  // UI Zoom (Ctrl+ / Ctrl- / Ctrl 0)
  zoomLevel: number;
  setZoomLevel: (zoom: number | ((prev: number) => number)) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
}

const defaultSettings: AppSettings = {
  theme: 'light',
  unit: 'binary',
  large_file_threshold_mb: 100,
  auto_hash_duplicates: false,
  prefer_trash: true,
  show_system_files: false,
  default_excludes: ['$RECYCLE.BIN', 'System Volume Information', '.git', 'node_modules'],
};

const initialProgress: ScanProgress = {
  status: 'idle',
  scanned_files: 0,
  scanned_directories: 0,
  scanned_bytes: 0,
  current_path: '',
  elapsed_ms: 0,
  error_count: 0,
};

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'overview',
  setActiveTab: (activeTab) => set({ activeTab }),

  drives: [],
  selectedDrive: null,
  setDrives: (drives) => set({ drives }),
  setSelectedDrive: (selectedDrive) =>
    set({
      selectedDrive,
      scanPath: selectedDrive ? selectedDrive.mount_point : '',
    }),

  scanPath: '',
  setScanPath: (scanPath) => set({ scanPath }),
  scanOptions: {
    root_path: '',
    exclude_hidden: false,
    exclude_patterns: ['$RECYCLE.BIN', 'System Volume Information'],
    follow_symlinks: false,
    deep_duplicate_scan: false,
  },
  setScanOptions: (opts) =>
    set((state) => ({ scanOptions: { ...state.scanOptions, ...opts } })),

  scanProgress: initialProgress,
  setScanProgress: (scanProgress) => set({ scanProgress }),
  scanSummary: null,
  setScanSummary: (scanSummary) =>
    set({
      scanSummary,
      treemapCurrentPath: '',
    }),
  clearScan: () =>
    set({
      scanProgress: initialProgress,
      scanSummary: null,
      treemapCurrentPath: '',
      selectedCleanupIds: new Set(),
    }),

  treemapCurrentPath: '',
  setTreemapCurrentPath: (treemapCurrentPath) => set({ treemapCurrentPath }),

  searchQuery: '',
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  selectedCategory: 'all',
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
  minSizeBytes: 0,
  setMinSizeBytes: (minSizeBytes) => set({ minSizeBytes }),

  selectedCleanupIds: new Set<string>(),
  toggleCleanupSelection: (id) =>
    set((state) => {
      const next = new Set(state.selectedCleanupIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { selectedCleanupIds: next };
    }),
  selectAllCleanup: (ids) =>
    set((state) => {
      if (ids) {
        return { selectedCleanupIds: new Set(ids) };
      }
      if (!state.scanSummary) return { selectedCleanupIds: new Set() };
      return {
        selectedCleanupIds: new Set(
          state.scanSummary.cleanup_candidates.map((c) => c.id)
        ),
      };
    }),
  clearCleanupSelection: () => set({ selectedCleanupIds: new Set() }),

  lastCleanupSummary: null,
  clearLastCleanupSummary: () => set({ lastCleanupSummary: null }),

  refreshDrives: async () => {
    try {
      const freshDrives = await api.getDrives();
      set((state) => {
        let updatedSelected = state.selectedDrive;
        if (state.selectedDrive) {
          const found = freshDrives.find(
            (d) =>
              d.id === state.selectedDrive?.id ||
              d.mount_point.toLowerCase() === state.selectedDrive?.mount_point.toLowerCase()
          );
          if (found) updatedSelected = found;
        }
        return { drives: freshDrives, selectedDrive: updatedSelected };
      });
    } catch (err) {
      console.error('Failed to refresh system drives:', err);
    }
  },

  applyCleanupResult: (
    freedBytes: number,
    deletedPaths: string[],
    pathBytesMap?: Record<string, number>,
    preferTrash?: boolean
  ) => {
    if (freedBytes <= 0 && deletedPaths.length === 0) return;

    set((state) => {
      // 1. Build a robust map of normalized deleted paths and their byte sizes
      const deletedMap = new Map<string, number>();
      for (const p of deletedPaths) {
        const lower = p.toLowerCase().replace(/[\\\/]+$/, '');
        const directBytes = pathBytesMap?.[p] ?? pathBytesMap?.[lower];
        if (typeof directBytes === 'number' && directBytes > 0) {
          deletedMap.set(lower, directBytes);
        }
      }

      // If any deleted path wasn't in pathBytesMap, look up from scanSummary & devCaches
      for (const p of deletedPaths) {
        const lower = p.toLowerCase().replace(/[\\\/]+$/, '');
        if (!deletedMap.has(lower)) {
          const fileMatch = state.scanSummary?.largest_files.find(
            (f) => f.path.toLowerCase().replace(/[\\\/]+$/, '') === lower
          );
          if (fileMatch) {
            deletedMap.set(lower, fileMatch.size_bytes);
            continue;
          }

          const candMatch = state.scanSummary?.cleanup_candidates.find(
            (c) => c.file.path.toLowerCase().replace(/[\\\/]+$/, '') === lower
          );
          if (candMatch) {
            deletedMap.set(lower, candMatch.file.size_bytes);
            continue;
          }

          const folderMatch = state.scanSummary?.largest_folders.find(
            (f) => f.path.toLowerCase().replace(/[\\\/]+$/, '') === lower
          );
          if (folderMatch) {
            deletedMap.set(lower, folderMatch.size_bytes);
            continue;
          }

          const cacheMatch = state.devCaches?.find(
            (c) => c.path.toLowerCase().replace(/[\\\/]+$/, '') === lower
          );
          if (cacheMatch) {
            deletedMap.set(lower, cacheMatch.size_bytes);
            continue;
          }
        }
      }

      // If paths still have unknown sizes, distribute remaining freedBytes
      let knownSum = 0;
      for (const b of deletedMap.values()) knownSum += b;
      const remainingBytes = Math.max(0, freedBytes - knownSum);
      const missingPaths = deletedPaths.filter(
        (p) => !deletedMap.has(p.toLowerCase().replace(/[\\\/]+$/, ''))
      );
      if (missingPaths.length > 0) {
        const perItem = Math.round(remainingBytes / missingPaths.length);
        for (const p of missingPaths) {
          deletedMap.set(p.toLowerCase().replace(/[\\\/]+$/, ''), perItem);
        }
      } else if (deletedPaths.length === 1 && deletedMap.size === 1) {
        const singleKey = deletedPaths[0].toLowerCase().replace(/[\\\/]+$/, '');
        deletedMap.set(singleKey, freedBytes);
      }

      const isPathDeleted = (path: string) => {
        const lower = path.toLowerCase().replace(/[\\\/]+$/, '');
        if (deletedMap.has(lower)) return true;
        for (const dp of deletedMap.keys()) {
          if (lower.startsWith(dp + '\\') || lower.startsWith(dp + '/')) return true;
        }
        return false;
      };

      // 2. LIVE STORAGE GAUGES: Instantly update affected drives in local state
      const updatedDrives = state.drives.map((d) => {
        const driveMount = d.mount_point.toLowerCase().replace(/[\\\/]+$/, '');
        let bytesFreedForDrive = 0;

        for (const [dp, bytes] of deletedMap.entries()) {
          if (
            dp.startsWith(driveMount + '\\') ||
            dp.startsWith(driveMount + '/') ||
            dp === driveMount
          ) {
            bytesFreedForDrive += bytes;
          }
        }

        if (
          bytesFreedForDrive === 0 &&
          (state.selectedDrive?.id === d.id || state.drives.length === 1)
        ) {
          bytesFreedForDrive = freedBytes;
        }

        if (bytesFreedForDrive > 0) {
          const newAvail = Math.min(d.total_bytes, d.available_bytes + bytesFreedForDrive);
          const newUsed = Math.max(0, d.total_bytes - newAvail);
          return {
            ...d,
            available_bytes: newAvail,
            used_bytes: newUsed,
          };
        }
        return d;
      });

      let updatedSelectedDrive = state.selectedDrive;
      if (updatedSelectedDrive) {
        const match = updatedDrives.find((d) => d.id === updatedSelectedDrive?.id);
        if (match) updatedSelectedDrive = match;
      }

      // 3. LIVE FOLDER HIERARCHY ROLLUP & SCAN SUMMARY SYNCHRONIZER
      let updatedSummary = state.scanSummary;
      if (updatedSummary) {
        const newTotalBytes = Math.max(0, updatedSummary.total_bytes - freedBytes);
        const newTotalFiles = Math.max(0, updatedSummary.total_files - deletedPaths.length);

        // A. Filter deleted files from largest_files
        const newLargestFiles = updatedSummary.largest_files.filter(
          (f) => !isPathDeleted(f.path)
        );

        // B. Filter deleted cleanup candidates
        const newCleanupCandidates = updatedSummary.cleanup_candidates.filter(
          (c) => !isPathDeleted(c.file.path)
        );

        // C. RECURSIVE FOLDER HIERARCHY ROLLUP:
        // Decrement parent & ancestor folder sizes and counts; prune deleted folders
        const updateFolder = (folder: ScannedFolder): ScannedFolder | null => {
          const normF = folder.path.toLowerCase().replace(/[\\\/]+$/, '');
          if (isPathDeleted(folder.path)) {
            return null;
          }

          let bytesLostInside = 0;
          let filesLostInside = 0;
          for (const [dp, bytes] of deletedMap.entries()) {
            if (dp.startsWith(normF + '\\') || dp.startsWith(normF + '/')) {
              bytesLostInside += bytes;
              filesLostInside += 1;
            }
          }

          const updatedChildren = folder.children_dirs
            ? folder.children_dirs.map(updateFolder).filter((c): c is ScannedFolder => c !== null)
            : undefined;

          const newSize = Math.max(0, folder.size_bytes - bytesLostInside);
          const newCount = Math.max(0, folder.file_count - filesLostInside);

          if (newSize === 0 && newCount === 0) {
            return null;
          }

          return {
            ...folder,
            size_bytes: newSize,
            file_count: newCount,
            children_dirs: updatedChildren,
          };
        };

        const newLargestFolders = updatedSummary.largest_folders
          .map(updateFolder)
          .filter((f): f is ScannedFolder => f !== null)
          .sort((a, b) => b.size_bytes - a.size_bytes);

        // D. Prune duplicate groups and recalculate reclaimable bytes
        const newDuplicateGroups = updatedSummary.duplicate_groups
          .map((g) => {
            const remainingFiles = g.files.filter((f) => !isPathDeleted(f.path));
            const newReclaimable =
              remainingFiles.length > 1
                ? (remainingFiles.length - 1) * remainingFiles[0].size_bytes
                : 0;
            return {
              ...g,
              files: remainingFiles,
              reclaimable_bytes: newReclaimable,
            };
          })
          .filter((g) => g.files.length > 1);

        // E. Recalculate categories with exact category subtractions
        const categoryBytesLost: Record<string, number> = {};
        let totalExactLost = 0;

        // 1. Account for files in largest_files that were deleted (directly or via parent directory)
        for (const file of updatedSummary.largest_files) {
          if (isPathDeleted(file.path)) {
            categoryBytesLost[file.category] =
              (categoryBytesLost[file.category] || 0) + file.size_bytes;
            totalExactLost += file.size_bytes;
          }
        }

        // 2. Account for cleanup candidates that were deleted (avoiding double counting)
        for (const cand of updatedSummary.cleanup_candidates) {
          if (isPathDeleted(cand.file.path)) {
            const alreadyCounted = updatedSummary.largest_files.some(
              (f) => f.id === cand.file.id && isPathDeleted(f.path)
            );
            if (!alreadyCounted) {
              categoryBytesLost[cand.file.category] =
                (categoryBytesLost[cand.file.category] || 0) + cand.file.size_bytes;
              totalExactLost += cand.file.size_bytes;
            }
          }
        }

        // 3. For any remaining deleted paths, check dev caches or common tool folders
        if (totalExactLost < freedBytes) {
          for (const [dp, bytes] of deletedMap.entries()) {
            const isDevCache =
              state.devCaches?.some(
                (c) => c.path.toLowerCase().replace(/[\\\/]+$/, '') === dp
              ) ||
              dp.includes('node_modules') ||
              dp.includes('target') ||
              dp.includes('.gradle') ||
              dp.includes('.cargo') ||
              dp.includes('venv') ||
              dp.includes('.next') ||
              dp.includes('.cache');

            if (isDevCache && totalExactLost < freedBytes) {
              const add = Math.min(bytes, freedBytes - totalExactLost);
              categoryBytesLost['dev'] = (categoryBytesLost['dev'] || 0) + add;
              totalExactLost += add;
            }
          }
        }

        const remainingUnaccounted = Math.max(0, freedBytes - totalExactLost);

        const newCategories = updatedSummary.categories.map((cat) => {
          const exactLost = categoryBytesLost[cat.category] || 0;
          const catRatio =
            updatedSummary!.total_bytes > 0
              ? cat.total_bytes / updatedSummary!.total_bytes
              : 0;
          const adjustedCatBytes = Math.max(
            0,
            Math.round(cat.total_bytes - exactLost - remainingUnaccounted * catRatio)
          );
          const adjustedPct =
            newTotalBytes > 0
              ? Math.round((adjustedCatBytes / newTotalBytes) * 100)
              : 0;
          return {
            ...cat,
            total_bytes: adjustedCatBytes,
            percentage: adjustedPct,
          };
        });

        updatedSummary = {
          ...updatedSummary,
          total_bytes: newTotalBytes,
          total_files: newTotalFiles,
          largest_files: newLargestFiles,
          cleanup_candidates: newCleanupCandidates,
          largest_folders: newLargestFolders,
          duplicate_groups: newDuplicateGroups,
          categories: newCategories,
        };
      }

      // 4. Update Treemap current drilldown path if current path was deleted
      let updatedTreemapPath = state.treemapCurrentPath;
      if (updatedTreemapPath && isPathDeleted(updatedTreemapPath)) {
        let curr = updatedTreemapPath.replace(/[\\\/]+$/, '');
        while (curr) {
          const lastSep = Math.max(curr.lastIndexOf('\\'), curr.lastIndexOf('/'));
          if (lastSep <= 0) {
            curr = '';
            break;
          }
          curr = curr.substring(0, lastSep);
          if (!isPathDeleted(curr)) {
            break;
          }
        }
        updatedTreemapPath = curr;
      }

      // 5. Clear selected IDs that were deleted
      const updatedSelectedCleanupIds = new Set(
        Array.from(state.selectedCleanupIds).filter(
          (id) => !deletedMap.has(id.toLowerCase().replace(/[\\\/]+$/, ''))
        )
      );

      // 6. Update cached devCaches in store
      let updatedDevCaches = state.devCaches;
      if (updatedDevCaches) {
        updatedDevCaches = updatedDevCaches.filter(
          (c) =>
            !deletedMap.has(c.path.toLowerCase().replace(/[\\\/]+$/, '')) &&
            !isPathDeleted(c.path)
        );
      }

      const isTrash = preferTrash !== undefined ? preferTrash : state.settings.prefer_trash;

      return {
        drives: updatedDrives,
        selectedDrive: updatedSelectedDrive,
        scanSummary: updatedSummary,
        treemapCurrentPath: updatedTreemapPath,
        selectedCleanupIds: updatedSelectedCleanupIds,
        devCaches: updatedDevCaches,
        lastCleanupSummary: {
          freedBytes,
          count: deletedPaths.length,
          preferTrash: isTrash,
          timestamp: Date.now(),
        },
      };
    });

    // 5. Background re-query real OS drives via sysinfo for bit-perfect accuracy
    api
      .getDrives()
      .then((freshDrives) => {
        useAppStore.setState((state) => {
          let matchedSelected = state.selectedDrive;
          if (state.selectedDrive) {
            const match = freshDrives.find(
              (d) =>
                d.id === state.selectedDrive?.id ||
                d.mount_point.toLowerCase() === state.selectedDrive?.mount_point.toLowerCase()
            );
            if (match) matchedSelected = match;
          }
          return {
            drives: freshDrives,
            selectedDrive: matchedSelected,
          };
        });
      })
      .catch((err) => console.error('Background drive refresh error:', err));
  },

  // Developer Toolchain Caches state & manual scan action
  devCaches: null,
  isScanningDevCaches: false,
  setDevCaches: (caches) => set({ devCaches: caches }),
  setIsScanningDevCaches: (isScanning) => set({ isScanningDevCaches: isScanning }),
  scanDevCachesAction: async () => {
    set({ isScanningDevCaches: true });
    try {
      const items = await api.scanDevCaches();
      set({ devCaches: items, isScanningDevCaches: false });
      return items;
    } catch (err) {
      set({ isScanningDevCaches: false });
      throw err;
    }
  },

  settings: defaultSettings,
  updateSettings: (newSettings) =>
    set((state) => ({ settings: { ...state.settings, ...newSettings } })),

  // UI Zoom implementation
  zoomLevel: (() => {
    try {
      const saved = localStorage.getItem('bytemap_zoom_level');
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= 75 && val <= 160) return val;
      }
    } catch {}
    return 100;
  })(),
  setZoomLevel: (zoom) =>
    set((state) => {
      const next = typeof zoom === 'function' ? zoom(state.zoomLevel) : zoom;
      const clamped = Math.max(75, Math.min(160, Math.round(next)));
      try {
        localStorage.setItem('bytemap_zoom_level', String(clamped));
      } catch {}
      return { zoomLevel: clamped };
    }),
  zoomIn: () =>
    set((state) => {
      const clamped = Math.min(160, state.zoomLevel + 5);
      try {
        localStorage.setItem('bytemap_zoom_level', String(clamped));
      } catch {}
      return { zoomLevel: clamped };
    }),
  zoomOut: () =>
    set((state) => {
      const clamped = Math.max(70, state.zoomLevel - 5);
      try {
        localStorage.setItem('bytemap_zoom_level', String(clamped));
      } catch {}
      return { zoomLevel: clamped };
    }),
  resetZoom: () =>
    set(() => {
      try {
        localStorage.setItem('bytemap_zoom_level', '100');
      } catch {}
      return { zoomLevel: 100 };
    }),
}));
