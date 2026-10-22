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
  applyCleanupResult: (freedBytes: number, deletedPaths: string[]) => void;
  refreshDrives: () => Promise<void>;
  lastCleanupSummary: { freedBytes: number; count: number; timestamp: number } | null;
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

  applyCleanupResult: (freedBytes: number, deletedPaths: string[]) => {
    if (freedBytes <= 0 && deletedPaths.length === 0) return;

    set((state) => {
      const deletedSet = new Set(deletedPaths.map((p) => p.toLowerCase()));
      const isPathDeleted = (path: string) => {
        const lower = path.toLowerCase();
        if (deletedSet.has(lower)) return true;
        for (const dp of deletedSet) {
          if (lower.startsWith(dp + '\\') || lower.startsWith(dp + '/')) return true;
        }
        return false;
      };

      // 1. Instantly update drive metrics in local state (0ms latency UI update)
      const updatedDrives = state.drives.map((d) => {
        const driveMount = d.mount_point.toLowerCase();
        const driveIsAffected =
          state.selectedDrive?.id === d.id ||
          deletedPaths.some((p) => p.toLowerCase().startsWith(driveMount));

        if (driveIsAffected) {
          const newAvail = Math.min(d.total_bytes, d.available_bytes + freedBytes);
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

      // 2. Filter scanSummary if present
      let updatedSummary = state.scanSummary;
      if (updatedSummary) {
        const newTotalBytes = Math.max(0, updatedSummary.total_bytes - freedBytes);
        const newLargestFiles = updatedSummary.largest_files.filter(
          (f) => !isPathDeleted(f.path)
        );
        const newCleanupCandidates = updatedSummary.cleanup_candidates.filter(
          (c) => !isPathDeleted(c.file.path)
        );
        const newLargestFolders = updatedSummary.largest_folders.filter(
          (f) => !isPathDeleted(f.path)
        );
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

        // Recalculate categories
        const newCategories = updatedSummary.categories.map((cat) => {
          const catRatio =
            updatedSummary!.total_bytes > 0
              ? cat.total_bytes / updatedSummary!.total_bytes
              : 0;
          const adjustedCatBytes = Math.max(
            0,
            Math.round(cat.total_bytes - freedBytes * catRatio)
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
          total_files: Math.max(0, updatedSummary.total_files - deletedPaths.length),
          largest_files: newLargestFiles,
          cleanup_candidates: newCleanupCandidates,
          largest_folders: newLargestFolders,
          duplicate_groups: newDuplicateGroups,
          categories: newCategories,
        };
      }

      // 3. Clear selected IDs that were deleted
      const updatedSelectedCleanupIds = new Set(
        Array.from(state.selectedCleanupIds).filter(
          (id) => !deletedSet.has(id.toLowerCase())
        )
      );

      // 4. Update cached devCaches in store
      let updatedDevCaches = state.devCaches;
      if (updatedDevCaches) {
        updatedDevCaches = updatedDevCaches.filter(
          (c) => !deletedSet.has(c.path.toLowerCase()) && !isPathDeleted(c.path)
        );
      }

      return {
        drives: updatedDrives,
        selectedDrive: updatedSelectedDrive,
        scanSummary: updatedSummary,
        selectedCleanupIds: updatedSelectedCleanupIds,
        devCaches: updatedDevCaches,
        lastCleanupSummary: {
          freedBytes,
          count: deletedPaths.length,
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
