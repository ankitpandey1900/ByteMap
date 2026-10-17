import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '@/lib/store';
import { DriveInfo, ScanSummary } from '@/types';

describe('useAppStore ephemeral state store', () => {
  beforeEach(() => {
    useAppStore.getState().clearScan();
    useAppStore.getState().clearCleanupSelection();
  });

  it('initializes with default tab and settings', () => {
    const state = useAppStore.getState();
    expect(state.activeTab).toBe('overview');
    expect(state.settings.theme).toBe('light');
    expect(state.settings.unit).toBe('binary');
    expect(state.settings.prefer_trash).toBe(true);
  });

  it('switches navigation tab properly', () => {
    useAppStore.getState().setActiveTab('large-files');
    expect(useAppStore.getState().activeTab).toBe('large-files');

    useAppStore.getState().setActiveTab('cleanup');
    expect(useAppStore.getState().activeTab).toBe('cleanup');
  });

  it('selects and updates drives', () => {
    const mockDrive: DriveInfo = {
      id: 'C:\\',
      name: 'OS Disk (C:)',
      mount_point: 'C:\\',
      filesystem: 'NTFS',
      total_bytes: 512000000000,
      available_bytes: 256000000000,
      used_bytes: 256000000000,
      is_removable: false,
      is_read_only: false,
    };

    useAppStore.getState().setDrives([mockDrive]);
    useAppStore.getState().setSelectedDrive(mockDrive);

    expect(useAppStore.getState().drives.length).toBe(1);
    expect(useAppStore.getState().selectedDrive?.mount_point).toBe('C:\\');
    expect(useAppStore.getState().scanPath).toBe('C:\\');
  });

  it('manages cleanup item selections', () => {
    expect(useAppStore.getState().selectedCleanupIds.size).toBe(0);

    useAppStore.getState().toggleCleanupSelection('item-1');
    expect(useAppStore.getState().selectedCleanupIds.has('item-1')).toBe(true);
    expect(useAppStore.getState().selectedCleanupIds.size).toBe(1);

    useAppStore.getState().toggleCleanupSelection('item-1');
    expect(useAppStore.getState().selectedCleanupIds.has('item-1')).toBe(false);
    expect(useAppStore.getState().selectedCleanupIds.size).toBe(0);
  });

  it('clears scan summary and resets state', () => {
    const mockSummary: ScanSummary = {
      root_path: 'C:\\Test',
      total_bytes: 100000,
      total_files: 5,
      total_directories: 2,
      scan_duration_ms: 120,
      error_count: 0,
      errors: [],
      largest_files: [],
      largest_folders: [],
      categories: [],
      extensions: [],
      duplicate_groups: [],
      cleanup_candidates: [],
      timestamp: new Date().toISOString(),
    };

    useAppStore.getState().setScanSummary(mockSummary);
    expect(useAppStore.getState().scanSummary?.total_bytes).toBe(100000);

    useAppStore.getState().clearScan();
    expect(useAppStore.getState().scanSummary).toBeNull();
  });
});
