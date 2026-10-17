import { create } from 'zustand';
import {
  ActiveTab,
  AppSettings,
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

  // Cleanup selection
  selectedCleanupIds: Set<string>;
  toggleCleanupSelection: (id: string) => void;
  selectAllCleanup: (ids?: string[]) => void;
  clearCleanupSelection: () => void;

  // Settings
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
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
      treemapCurrentPath: scanSummary ? scanSummary.root_path : '',
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

  settings: defaultSettings,
  updateSettings: (newSettings) =>
    set((state) => ({ settings: { ...state.settings, ...newSettings } })),
}));
