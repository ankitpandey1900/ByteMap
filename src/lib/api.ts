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

const isTauri =
  typeof window !== 'undefined' &&
  ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);

export const api = {
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

  // Real Rust traversal scan
  async startScan(options: ScanOptions): Promise<ScanSummary> {
    if (!isTauri) {
      throw new Error(
        'Real filesystem scanning requires the native desktop application environment. Run "pnpm tauri dev" to scan local drives.'
      );
    }
    return await invoke<ScanSummary>('start_scan', { options });
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

  // Staged cryptographic duplicate detection
  async findDuplicates(): Promise<DuplicateGroup[]> {
    if (!isTauri) {
      throw new Error(
        'Duplicate detection requires the native Rust hashing engine.'
      );
    }
    return await invoke<DuplicateGroup[]>('find_duplicates');
  },

  // Safe cleanup execution
  async executeCleanup(
    targets: Array<{ path: string; expected_size?: number }>,
    preferTrash: boolean
  ): Promise<CleanupExecutionResult> {
    if (!isTauri) {
      throw new Error(
        'File deletion requires native OS Recycle Bin access via Tauri.'
      );
    }
    return await invoke<CleanupExecutionResult>('execute_cleanup', {
      targets,
      preferTrash,
    });
  },

  // Safe native file reveal
  async revealInFolder(path: string): Promise<void> {
    if (isTauri) {
      return await invoke<void>('reveal_in_folder', { path });
    }
  },

  // Load user settings from OS config directory
  async loadSettings(): Promise<AppSettings> {
    if (isTauri) {
      try {
        return await invoke<AppSettings>('load_settings');
      } catch {
        // Fallback to defaults
      }
    }
    return {
      theme: 'dark',
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
    return Promise.resolve(() => {});
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
    return Promise.resolve(() => {});
  },
};
