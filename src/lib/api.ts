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
    // Web preview simulated hardware volumes
    return [
      {
        id: 'drive-c',
        name: 'Local Disk (C:)',
        mount_point: 'C:\\',
        total_bytes: 512 * 1024 * 1024 * 1024,
        available_bytes: 184 * 1024 * 1024 * 1024,
        used_bytes: 328 * 1024 * 1024 * 1024,
        filesystem: 'NTFS',
        is_removable: false,
        is_read_only: false,
      },
      {
        id: 'drive-d',
        name: 'Data Storage (D:)',
        mount_point: 'D:\\',
        total_bytes: 1024 * 1024 * 1024 * 1024,
        available_bytes: 412 * 1024 * 1024 * 1024,
        used_bytes: 612 * 1024 * 1024 * 1024,
        filesystem: 'NTFS',
        is_removable: false,
        is_read_only: false,
      },
    ];
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
    // Web browser fallback
    return 'D:\\Projects';
  },

  // Real Rust traversal scan (or realistic browser simulation in preview mode)
  async startScan(options: ScanOptions): Promise<ScanSummary> {
    if (isTauri) {
      return await invoke<ScanSummary>('start_scan', { options });
    }

    // Web preview simulation with realistic progress streaming
    const root = options.root_path || 'D:\\';
    const cleanRoot = root.replace(/\\+$/, '');

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

    // Step 1: Initiating
    emitProgress('scanning', 1240, 95, 2.4 * 1024 * 1024 * 1024, `${cleanRoot}\\Media`, 300);
    await new Promise((r) => setTimeout(r, 400));

    // Step 2: Deep traversal
    emitProgress('scanning', 4890, 312, 11.8 * 1024 * 1024 * 1024, `${cleanRoot}\\Projects`, 750);
    await new Promise((r) => setTimeout(r, 400));

    // Step 3: Categorization
    emitProgress('scanning', 9420, 680, 28.5 * 1024 * 1024 * 1024, `${cleanRoot}\\Downloads`, 1100);
    await new Promise((r) => setTimeout(r, 400));

    // Final Completion
    emitProgress('completed', 14250, 1120, 42.6 * 1024 * 1024 * 1024, cleanRoot, 1450);

    const summary: ScanSummary = {
      root_path: cleanRoot,
      scan_duration_ms: 1450,
      total_files: 14250,
      total_directories: 1120,
      total_bytes: 42.6 * 1024 * 1024 * 1024,
      error_count: 0,
      errors: [],
      timestamp: new Date().toISOString(),
      largest_folders: [
        { id: 'fol-1', path: `${cleanRoot}\\Media`, name: 'Media', size_bytes: 18.4 * 1024 * 1024 * 1024, file_count: 1420, dir_count: 45 },
        { id: 'fol-2', path: `${cleanRoot}\\Projects`, name: 'Projects', size_bytes: 12.2 * 1024 * 1024 * 1024, file_count: 8520, dir_count: 320 },
        { id: 'fol-3', path: `${cleanRoot}\\Downloads`, name: 'Downloads', size_bytes: 6.8 * 1024 * 1024 * 1024, file_count: 840, dir_count: 12 },
        { id: 'fol-4', path: `${cleanRoot}\\Documents`, name: 'Documents', size_bytes: 3.4 * 1024 * 1024 * 1024, file_count: 2450, dir_count: 85 },
        { id: 'fol-5', path: `${cleanRoot}\\Archives`, name: 'Archives', size_bytes: 1.8 * 1024 * 1024 * 1024, file_count: 1020, dir_count: 30 },
      ],
      largest_files: [
        {
          id: 'f-1',
          name: 'Video_Production_Master.mp4',
          path: `${cleanRoot}\\Media\\Video_Production_Master.mp4`,
          size_bytes: 8.4 * 1024 * 1024 * 1024,
          category: 'video',
          extension: 'mp4',
          modified_at: Date.now() - 86400000 * 3,
          is_hidden: false,
          is_system: false,
        },
        {
          id: 'f-2',
          name: 'Complete_Database_Backup.tar.gz',
          path: `${cleanRoot}\\Archives\\Complete_Database_Backup.tar.gz`,
          size_bytes: 4.2 * 1024 * 1024 * 1024,
          category: 'archive',
          extension: 'gz',
          modified_at: Date.now() - 86400000 * 12,
          is_hidden: false,
          is_system: false,
        },
        {
          id: 'f-3',
          name: 'Developer_Workspace_Env.zip',
          path: `${cleanRoot}\\Projects\\Developer_Workspace_Env.zip`,
          size_bytes: 2.1 * 1024 * 1024 * 1024,
          category: 'dev',
          extension: 'zip',
          modified_at: Date.now() - 86400000 * 5,
          is_hidden: false,
          is_system: false,
        },
        {
          id: 'f-4',
          name: 'Raw_Photography_Batch.iso',
          path: `${cleanRoot}\\Media\\Raw_Photography_Batch.iso`,
          size_bytes: 1.6 * 1024 * 1024 * 1024,
          category: 'image',
          extension: 'iso',
          modified_at: Date.now() - 86400000 * 8,
          is_hidden: false,
          is_system: false,
        },
        {
          id: 'f-5',
          name: 'Audio_Stems_Session.wav',
          path: `${cleanRoot}\\Media\\Audio_Stems_Session.wav`,
          size_bytes: 920 * 1024 * 1024,
          category: 'audio',
          extension: 'wav',
          modified_at: Date.now() - 86400000 * 2,
          is_hidden: false,
          is_system: false,
        },
      ],
      categories: [
        { category: 'video', total_bytes: 18.4 * 1024 * 1024 * 1024, file_count: 240, percentage: 43.2 },
        { category: 'dev', total_bytes: 12.2 * 1024 * 1024 * 1024, file_count: 8520, percentage: 28.6 },
        { category: 'archive', total_bytes: 6.0 * 1024 * 1024 * 1024, file_count: 140, percentage: 14.1 },
        { category: 'document', total_bytes: 3.4 * 1024 * 1024 * 1024, file_count: 3200, percentage: 8.0 },
        { category: 'image', total_bytes: 1.8 * 1024 * 1024 * 1024, file_count: 1850, percentage: 4.2 },
        { category: 'audio', total_bytes: 800 * 1024 * 1024, file_count: 300, percentage: 1.9 },
      ],
      extensions: [
        { extension: '.mp4', total_bytes: 15.2 * 1024 * 1024 * 1024, file_count: 180, category: 'video' },
        { extension: '.zip', total_bytes: 4.8 * 1024 * 1024 * 1024, file_count: 95, category: 'archive' },
        { extension: '.ts', total_bytes: 3.2 * 1024 * 1024 * 1024, file_count: 4200, category: 'dev' },
        { extension: '.pdf', total_bytes: 2.1 * 1024 * 1024 * 1024, file_count: 1650, category: 'document' },
      ],
      duplicate_groups: [
        {
          hash: 'blake3-8e4d2a1b9f7c5e3d0a2b4c6e8f0a1b2c',
          size_bytes: 1.2 * 1024 * 1024 * 1024,
          reclaimable_bytes: 1.2 * 1024 * 1024 * 1024,
          files: [
            {
              id: 'dup-1',
              name: 'Installer_Package_v2.exe',
              path: `${cleanRoot}\\Downloads\\Installer_Package_v2.exe`,
              size_bytes: 1.2 * 1024 * 1024 * 1024,
              category: 'app',
              extension: 'exe',
              modified_at: Date.now() - 86400000 * 4,
              is_hidden: false,
              is_system: false,
            },
            {
              id: 'dup-2',
              name: 'Installer_Package_v2_Copy.exe',
              path: `${cleanRoot}\\Archives\\Installer_Package_v2_Copy.exe`,
              size_bytes: 1.2 * 1024 * 1024 * 1024,
              category: 'app',
              extension: 'exe',
              modified_at: Date.now() - 86400000 * 4,
              is_hidden: false,
              is_system: false,
            },
          ],
        },
      ],
      cleanup_candidates: [
        {
          id: 'clean-1',
          type: 'old_installer',
          risk_level: 'safe',
          title: 'Obsolete Setup Installer',
          description: 'Leftover installer file in Downloads folder.',
          risk_explanation: 'Installers can be safely deleted or moved to Recycle Bin after setup.',
          suggested_action: 'trash',
          file: {
            id: 'dup-2',
            name: 'Installer_Package_v2_Copy.exe',
            path: `${cleanRoot}\\Archives\\Installer_Package_v2_Copy.exe`,
            size_bytes: 1.2 * 1024 * 1024 * 1024,
            category: 'app',
            extension: 'exe',
            modified_at: Date.now() - 86400000 * 4,
            is_hidden: false,
            is_system: false,
          },
        },
      ],
    };

    return summary;
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
    // Web preview simulation
    dupProgressSubscribers.forEach((cb) => cb(50, 100));
    await new Promise((r) => setTimeout(r, 300));
    dupProgressSubscribers.forEach((cb) => cb(100, 100));
    return [
      {
        hash: 'blake3-8e4d2a1b9f7c5e3d0a2b4c6e8f0a1b2c',
        size_bytes: 1.2 * 1024 * 1024 * 1024,
        reclaimable_bytes: 1.2 * 1024 * 1024 * 1024,
        files: [
          {
            id: 'dup-1',
            name: 'Installer_Package_v2.exe',
            path: 'D:\\Downloads\\Installer_Package_v2.exe',
            size_bytes: 1.2 * 1024 * 1024 * 1024,
            category: 'app',
            extension: 'exe',
            modified_at: Date.now() - 86400000 * 4,
            is_hidden: false,
            is_system: false,
          },
          {
            id: 'dup-2',
            name: 'Installer_Package_v2_Copy.exe',
            path: 'D:\\Archives\\Installer_Package_v2_Copy.exe',
            size_bytes: 1.2 * 1024 * 1024 * 1024,
            category: 'app',
            extension: 'exe',
            modified_at: Date.now() - 86400000 * 4,
            is_hidden: false,
            is_system: false,
          },
        ],
      },
    ];
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
      total_freed_bytes: freed || 1.2 * 1024 * 1024 * 1024,
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
