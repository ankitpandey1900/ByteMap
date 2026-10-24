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

  it('instantly updates drive metrics and prunes deleted paths via applyCleanupResult', () => {
    const mockDrive: DriveInfo = {
      id: 'C:\\',
      name: 'OS Disk (C:)',
      mount_point: 'C:\\',
      filesystem: 'NTFS',
      total_bytes: 500000,
      available_bytes: 200000,
      used_bytes: 300000,
      is_removable: false,
      is_read_only: false,
    };
    useAppStore.getState().setDrives([mockDrive]);
    useAppStore.getState().setSelectedDrive(mockDrive);

    const mockSummary: ScanSummary = {
      root_path: 'C:\\',
      total_bytes: 100000,
      total_files: 5,
      total_directories: 2,
      scan_duration_ms: 120,
      error_count: 0,
      errors: [],
      largest_files: [
        {
          id: 'f1',
          name: 'large_cache.tmp',
          path: 'C:\\Users\\user\\large_cache.tmp',
          size_bytes: 40000,
          category: 'other',
          extension: 'tmp',
          modified_at: 1000,
          is_hidden: false,
          is_system: false,
        },
        {
          id: 'f2',
          name: 'safe_document.pdf',
          path: 'C:\\Users\\user\\safe_document.pdf',
          size_bytes: 60000,
          category: 'document',
          extension: 'pdf',
          modified_at: 1000,
          is_hidden: false,
          is_system: false,
        },
      ],
      largest_folders: [],
      categories: [
        { category: 'other', total_bytes: 40000, file_count: 1, percentage: 40 },
        { category: 'document', total_bytes: 60000, file_count: 1, percentage: 60 },
      ],
      extensions: [],
      duplicate_groups: [],
      cleanup_candidates: [
        {
          id: 'c1',
          type: 'temp_file',
          title: 'Temp Cache',
          description: 'Temporary junk file',
          file: {
            id: 'f1',
            name: 'large_cache.tmp',
            path: 'C:\\Users\\user\\large_cache.tmp',
            size_bytes: 40000,
            category: 'other',
            extension: 'tmp',
            modified_at: 1000,
            is_hidden: false,
            is_system: false,
          },
          risk_level: 'safe',
          risk_explanation: 'Completely safe to delete',
          suggested_action: 'trash',
        },
      ],
      timestamp: new Date().toISOString(),
    };
    useAppStore.getState().setScanSummary(mockSummary);

    // Act: apply cleanup of 40,000 bytes
    useAppStore.getState().applyCleanupResult(40000, ['C:\\Users\\user\\large_cache.tmp']);

    const state = useAppStore.getState();
    // 1. Storage available increases by 40,000 bytes immediately
    expect(state.selectedDrive?.available_bytes).toBe(240000);
    expect(state.selectedDrive?.used_bytes).toBe(260000);

    // 2. ScanSummary is pruned
    expect(state.scanSummary?.total_bytes).toBe(60000);
    expect(state.scanSummary?.largest_files.length).toBe(1);
    expect(state.scanSummary?.largest_files[0].id).toBe('f2');
    expect(state.scanSummary?.cleanup_candidates.length).toBe(0);

    // 3. Last cleanup summary is recorded
    expect(state.lastCleanupSummary?.freedBytes).toBe(40000);
    expect(state.lastCleanupSummary?.count).toBe(1);
  });

  it('manages dev caches in store and removes purged caches on applyCleanupResult', () => {
    const mockCache = {
      id: 'cache-npm',
      tool: 'npm',
      tool_icon: 'package',
      name: 'npm Cache',
      description: 'Node package manager cache',
      path: 'C:\\Users\\user\\AppData\\Local\\npm-cache',
      size_bytes: 1024000,
      file_count: 50,
      safety_level: 'safe' as const,
      safety_explanation: 'Safe to delete',
    };

    useAppStore.getState().setDevCaches([mockCache]);
    expect(useAppStore.getState().devCaches?.length).toBe(1);

    // Apply cleanup for this path
    useAppStore.getState().applyCleanupResult(1024000, ['C:\\Users\\user\\AppData\\Local\\npm-cache']);
    expect(useAppStore.getState().devCaches?.length).toBe(0);
  });

  it('recursively rolls down parent folder sizes and prunes deleted folders via applyCleanupResult', () => {
    const mockSummary: ScanSummary = {
      root_path: 'C:\\Projects',
      total_bytes: 100000,
      total_files: 10,
      total_directories: 3,
      scan_duration_ms: 50,
      error_count: 0,
      errors: [],
      largest_files: [
        {
          id: 'f1',
          name: 'bundle.js',
          path: 'C:\\Projects\\app\\dist\\bundle.js',
          size_bytes: 30000,
          category: 'dev',
          extension: 'js',
          modified_at: 1000,
          is_hidden: false,
          is_system: false,
        },
      ],
      largest_folders: [
        {
          id: 'dir-projects',
          name: 'Projects',
          path: 'C:\\Projects',
          size_bytes: 100000,
          file_count: 10,
          dir_count: 3,
        },
        {
          id: 'dir-app',
          name: 'app',
          path: 'C:\\Projects\\app',
          size_bytes: 60000,
          file_count: 5,
          dir_count: 2,
        },
        {
          id: 'dir-dist',
          name: 'dist',
          path: 'C:\\Projects\\app\\dist',
          size_bytes: 30000,
          file_count: 1,
          dir_count: 0,
        },
      ],
      categories: [
        { category: 'dev', total_bytes: 30000, file_count: 1, percentage: 30 },
      ],
      extensions: [],
      duplicate_groups: [],
      cleanup_candidates: [],
      timestamp: new Date().toISOString(),
    };

    useAppStore.getState().setScanSummary(mockSummary);
    useAppStore.getState().setTreemapCurrentPath('C:\\Projects\\app\\dist');

    // Delete dist folder completely (30,000 bytes)
    useAppStore.getState().applyCleanupResult(
      30000,
      ['C:\\Projects\\app\\dist'],
      { 'C:\\Projects\\app\\dist': 30000 },
      false // permanent deletion
    );

    const state = useAppStore.getState();
    const folders = state.scanSummary?.largest_folders || [];

    // 1. C:\Projects\app\dist was deleted, so it must be pruned
    expect(folders.find((f) => f.path === 'C:\\Projects\\app\\dist')).toBeUndefined();

    // 2. Parent folder C:\Projects\app must be reduced from 60,000 to 30,000
    const appFolder = folders.find((f) => f.path === 'C:\\Projects\\app');
    expect(appFolder).toBeDefined();
    expect(appFolder?.size_bytes).toBe(30000);
    expect(appFolder?.file_count).toBe(4);

    // 3. Grandparent folder C:\Projects must be reduced from 100,000 to 70,000
    const projectsFolder = folders.find((f) => f.path === 'C:\\Projects');
    expect(projectsFolder).toBeDefined();
    expect(projectsFolder?.size_bytes).toBe(70000);
    expect(projectsFolder?.file_count).toBe(9);

    // 4. Treemap current drilldown path was C:\Projects\app\dist (now deleted), so it stepped back to parent
    expect(state.treemapCurrentPath).toBe('C:\\Projects\\app');

    // 5. Category recalculation: dev category should drop by 30,000 bytes
    const devCat = state.scanSummary?.categories.find((c) => c.category === 'dev');
    expect(devCat).toBeDefined();
    expect(devCat?.total_bytes).toBe(0);

    // 6. lastCleanupSummary recorded preferTrash = false
    expect(state.lastCleanupSummary?.preferTrash).toBe(false);
  });
});
