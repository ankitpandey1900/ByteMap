import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { open } from '@tauri-apps/plugin-dialog';
import {
  AppSettings,
  DriveInfo,
  DuplicateGroup,
  ScanOptions,
  ScanProgress,
  ScanSummary,
} from '@/types';

export interface CleanupExecutionResult {
  total_freed_bytes: number;
  successful_count: number;
  failed_count: number;
  results: Array<{
    path: string;
    success: boolean;
    bytes_freed: number;
    error?: string;
  }>;
}

export const isTauri =
  typeof window !== 'undefined' &&
  ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);

// In-memory event bus for web preview mode
type ScanProgressCallback = (prog: ScanProgress) => void;
type DupProgressCallback = (processed: number, total: number) => void;
const scanProgressSubscribers = new Set<ScanProgressCallback>();
const dupProgressSubscribers = new Set<DupProgressCallback>();

export const api = {
  isNative(): boolean {
    return isTauri;
  },

  // Discover physical operating system storage drives
  async getDrives(): Promise<DriveInfo[]> {
    if (isTauri) {
      try {
        return await invoke<DriveInfo[]>('get_drives');
      } catch (err) {
        console.error('Failed to query system drives via Tauri:', err);
        return [];
      }
    }
    // In web preview: attempt to query real system drives via local Vite bridge
    try {
      const res = await fetch('/api/drives');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          return data;
        }
      }
    } catch {
      // ignore
    }

    return [];
  },

  // Native folder picker dialog
  async selectDirectory(): Promise<string | null> {
    if (isTauri) {
      try {
        const selected = await open({
          directory: true,
          multiple: false,
          title: 'Select Directory or Drive to Analyze',
        });
        if (typeof selected === 'string') {
          return selected;
        }
      } catch (err) {
        console.error('Directory picker error:', err);
      }
    }
    return null;
  },

  // Real Rust traversal scan (or real Node filesystem scan in preview mode)
  async startScan(options: ScanOptions): Promise<ScanSummary> {
    if (isTauri) {
      return await invoke<ScanSummary>('start_scan', { options });
    }

    const root = options.root_path || 'D:\\';
    const emitProgress = (
      status: 'scanning' | 'completed',
      scanned_files: number,
      scanned_directories: number,
      scanned_bytes: number,
      current_path: string,
      elapsed_ms: number
    ) => {
      const p: ScanProgress = {
        status,
        scanned_files,
        scanned_directories,
        scanned_bytes,
        current_path,
        elapsed_ms,
        error_count: 0,
      };
      scanProgressSubscribers.forEach((cb) => cb(p));
    };

    // Emit live traversal start
    emitProgress('scanning', 1, 1, 0, root, 50);

    // Call real Node scan endpoint in Vite dev/preview server
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });

      if (res.ok) {
        const summary: ScanSummary = await res.json();
        emitProgress('completed', summary.total_files, summary.total_directories, summary.total_bytes, root, summary.scan_duration_ms);
        return summary;
      }
    } catch (err) {
      console.warn('Real scan bridge error:', err);
    }

    // Graceful fallback with genuine empty state (no hardcoded files)
    const emptySummary: ScanSummary = {
      root_path: root,
      scan_duration_ms: 100,
      total_files: 0,
      total_directories: 0,
      total_bytes: 0,
      error_count: 0,
      errors: [],
      timestamp: new Date().toISOString(),
      largest_folders: [],
      largest_files: [],
      categories: [],
      extensions: [],
      duplicate_groups: [],
      cleanup_candidates: [],
    };
    emitProgress('completed', 0, 0, 0, root, 100);
    return emptySummary;
  },

  async cancelScan(): Promise<void> {
    if (isTauri) {
      return await invoke<void>('cancel_scan');
    }
  },

  async getScanSummary(): Promise<ScanSummary | null> {
    if (isTauri) {
      try {
        return await invoke<ScanSummary | null>('get_scan_summary');
      } catch {
        return null;
      }
    }
    return null;
  },

  async clearScanData(): Promise<void> {
    if (isTauri) {
      return await invoke<void>('clear_scan_data');
    }
  },

  // Cryptographic duplicate detection
  async findDuplicates(): Promise<DuplicateGroup[]> {
    if (isTauri) {
      return await invoke<DuplicateGroup[]>('find_duplicates');
    }
    dupProgressSubscribers.forEach((cb) => cb(100, 100));
    return [];
  },

  // Safe cleanup execution
  async executeCleanup(
    targets: Array<{ path: string; expected_size?: number }>,
    preferTrash: boolean
  ): Promise<CleanupExecutionResult> {
    if (isTauri) {
      return await invoke<CleanupExecutionResult>('execute_cleanup', {
        targets,
        preferTrash,
      });
    }
    // Web preview simulation
    await new Promise((r) => setTimeout(r, 500));
    const freed = targets.reduce((acc, t) => acc + (t.expected_size || 0), 0);
    return {
      total_freed_bytes: freed,
      successful_count: targets.length,
      failed_count: 0,
      results: targets.map((t) => ({
        path: t.path,
        success: true,
        bytes_freed: t.expected_size || 0,
      })),
    };
  },

  // Safe native file reveal
  async revealInFolder(path: string): Promise<void> {
    if (isTauri) {
      return await invoke<void>('reveal_in_folder', { path });
    }
    console.log('Reveal in explorer (web preview):', path);
  },

  // Load user settings from OS config directory (or localStorage in web preview)
  async loadSettings(): Promise<AppSettings> {
    if (isTauri) {
      try {
        return await invoke<AppSettings>('load_settings');
      } catch {
        // Fallback to defaults
      }
    }
    try {
      const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('bytemap_settings') : null;
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return {
      theme: 'light',
      unit: 'binary',
      large_file_threshold_mb: 100,
      auto_hash_duplicates: false,
      prefer_trash: true,
      show_system_files: false,
      default_excludes: [
        '$RECYCLE.BIN',
        'System Volume Information',
        '.git',
        'node_modules',
      ],
    };
  },

  // Save non-sensitive user settings
  async saveSettings(settings: AppSettings): Promise<void> {
    if (isTauri) {
      return await invoke<void>('save_settings', { settings });
    }
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('bytemap_settings', JSON.stringify(settings));
      }
    } catch {
      // ignore
    }
  },

  // Event listener for scan progress
  onScanProgress(
    callback: (progress: ScanProgress) => void
  ): Promise<UnlistenFn> {
    if (isTauri) {
      return listen<ScanProgress>('scan_progress', (event) => {
        callback(event.payload);
      });
    }
    scanProgressSubscribers.add(callback);
    return Promise.resolve(() => {
      scanProgressSubscribers.delete(callback);
    });
  },

  // Event listener for duplicate progress
  onDuplicateProgress(
    callback: (processed: number, total: number) => void
  ): Promise<UnlistenFn> {
    if (isTauri) {
      return listen<[number, number]>('duplicate_progress', (event) => {
        const [processed, total] = event.payload;
        callback(processed, total);
      });
    }
    dupProgressSubscribers.add(callback);
    return Promise.resolve(() => {
      dupProgressSubscribers.delete(callback);
    });
  },
};
