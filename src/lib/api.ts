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

export const api = {
  // Drives
  async getDrives(): Promise<DriveInfo[]> {
    try {
      return await invoke<DriveInfo[]>('get_drives');
    } catch (err) {
      console.error('Failed to get drives:', err);
      return [];
    }
  },

  // Native folder picker
  async selectDirectory(): Promise<string | null> {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Directory or Drive to Analyze',
      });
      if (typeof selected === 'string') {
        return selected;
      }
      return null;
    } catch (err) {
      console.error('Failed to open directory picker:', err);
      return null;
    }
  },

  // Scan
  async startScan(options: ScanOptions): Promise<ScanSummary> {
    return await invoke<ScanSummary>('start_scan', { options });
  },

  async cancelScan(): Promise<void> {
    return await invoke<void>('cancel_scan');
  },

  async getScanSummary(): Promise<ScanSummary | null> {
    return await invoke<ScanSummary | null>('get_scan_summary');
  },

  async clearScanData(): Promise<void> {
    return await invoke<void>('clear_scan_data');
  },

  // Duplicates
  async findDuplicates(): Promise<DuplicateGroup[]> {
    return await invoke<DuplicateGroup[]>('find_duplicates');
  },

  // Cleanup
  async executeCleanup(
    targets: Array<{ path: string; expected_size?: number }>,
    preferTrash: boolean
  ): Promise<CleanupExecutionResult> {
    return await invoke<CleanupExecutionResult>('execute_cleanup', {
      targets,
      preferTrash,
    });
  },

  // Reveal file safely
  async revealInFolder(path: string): Promise<void> {
    return await invoke<void>('reveal_in_folder', { path });
  },

  // Settings
  async loadSettings(): Promise<AppSettings> {
    try {
      return await invoke<AppSettings>('load_settings');
    } catch {
      return {
        theme: 'dark',
        unit: 'binary',
        large_file_threshold_mb: 100,
        auto_hash_duplicates: false,
        prefer_trash: true,
        show_system_files: false,
        default_excludes: ['$RECYCLE.BIN', 'System Volume Information', '.git', 'node_modules'],
      };
    }
  },

  async saveSettings(settings: AppSettings): Promise<void> {
    return await invoke<void>('save_settings', { settings });
  },

  // Event listeners
  onScanProgress(callback: (progress: ScanProgress) => void): Promise<UnlistenFn> {
    return listen<ScanProgress>('scan_progress', (event) => {
      callback(event.payload);
    });
  },

  onDuplicateProgress(callback: (processed: number, total: number) => void): Promise<UnlistenFn> {
    return listen<[number, number]>('duplicate_progress', (event) => {
      const [processed, total] = event.payload;
      callback(processed, total);
    });
  },
};
