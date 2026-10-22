import { describe, it, expect } from 'vitest';
import {
  StorageSnapshot,
  filterSnapshotsByDate,
  computeSnapshotToSnapshotDiff,
  computeStorageDiff,
} from '@/lib/snapshots';
import { ScanSummary } from '@/types';

const mockSnapA: StorageSnapshot = {
  id: 'snap-1',
  name: 'Snapshot 1',
  timestamp: '2026-10-10T10:00:00.000Z',
  dateLabel: 'Oct 10, 2026, 10:00 AM',
  root_path: 'C:\\Test',
  total_bytes: 100 * 1024 * 1024,
  total_files: 50,
  categories: [
    { category: 'video', total_bytes: 60 * 1024 * 1024 },
    { category: 'image', total_bytes: 40 * 1024 * 1024 },
  ],
  top_folders: [
    { path: 'C:\\Test\\Movies', name: 'Movies', size_bytes: 60 * 1024 * 1024 },
  ],
};

const mockSnapB: StorageSnapshot = {
  id: 'snap-2',
  name: 'Snapshot 2',
  timestamp: '2026-10-18T15:30:00.000Z',
  dateLabel: 'Oct 18, 2026, 03:30 PM',
  root_path: 'C:\\Test',
  total_bytes: 150 * 1024 * 1024,
  total_files: 75,
  categories: [
    { category: 'video', total_bytes: 90 * 1024 * 1024 },
    { category: 'image', total_bytes: 60 * 1024 * 1024 },
  ],
  top_folders: [
    { path: 'C:\\Test\\Movies', name: 'Movies', size_bytes: 90 * 1024 * 1024 },
  ],
};

const mockSnapC: StorageSnapshot = {
  id: 'snap-3',
  name: 'Snapshot 3',
  timestamp: '2026-10-23T08:00:00.000Z',
  dateLabel: 'Oct 23, 2026, 08:00 AM',
  root_path: 'C:\\Test',
  total_bytes: 200 * 1024 * 1024,
  total_files: 100,
  categories: [
    { category: 'video', total_bytes: 120 * 1024 * 1024 },
    { category: 'image', total_bytes: 80 * 1024 * 1024 },
  ],
  top_folders: [
    { path: 'C:\\Test\\Movies', name: 'Movies', size_bytes: 120 * 1024 * 1024 },
  ],
};

const allSnaps = [mockSnapA, mockSnapB, mockSnapC];

describe('Snapshots & Time Machine helpers', () => {
  it('filterSnapshotsByDate returns all snapshots when dates are empty', () => {
    expect(filterSnapshotsByDate(allSnaps)).toHaveLength(3);
    expect(filterSnapshotsByDate(allSnaps, '', '')).toHaveLength(3);
  });

  it('filterSnapshotsByDate filters by fromDate', () => {
    const filtered = filterSnapshotsByDate(allSnaps, '2026-10-15');
    expect(filtered.map((s) => s.id)).toEqual(['snap-2', 'snap-3']);
  });

  it('filterSnapshotsByDate filters by toDate', () => {
    const filtered = filterSnapshotsByDate(allSnaps, undefined, '2026-10-12');
    expect(filtered.map((s) => s.id)).toEqual(['snap-1']);
  });

  it('filterSnapshotsByDate filters within range [fromDate, toDate]', () => {
    const filtered = filterSnapshotsByDate(allSnaps, '2026-10-12', '2026-10-20');
    expect(filtered.map((s) => s.id)).toEqual(['snap-2']);
  });

  it('filterSnapshotsByDate returns empty array when no snapshots match', () => {
    const filtered = filterSnapshotsByDate(allSnaps, '2026-11-01', '2026-11-10');
    expect(filtered).toHaveLength(0);
  });

  it('computeSnapshotToSnapshotDiff calculates delta between two snapshots', () => {
    const diff = computeSnapshotToSnapshotDiff(mockSnapA, mockSnapB);
    expect(diff.delta_bytes).toBe(50 * 1024 * 1024);
    expect(diff.delta_files).toBe(25);
    expect(diff.snapshot.id).toBe('snap-1');
    expect(diff.current_total_bytes).toBe(150 * 1024 * 1024);

    const videoDiff = diff.category_diffs.find((c) => c.category === 'video');
    expect(videoDiff?.delta_bytes).toBe(30 * 1024 * 1024);

    const movieDiff = diff.folder_diffs.find((f) => f.name === 'Movies');
    expect(movieDiff?.delta_bytes).toBe(30 * 1024 * 1024);
  });

  it('computeStorageDiff calculates delta between current scan and snapshot', () => {
    const scan: ScanSummary = {
      root_path: 'C:\\Test',
      total_bytes: 250 * 1024 * 1024,
      total_files: 120,
      total_directories: 10,
      scan_duration_ms: 100,
      error_count: 0,
      errors: [],
      timestamp: new Date().toISOString(),
      extensions: [],
      duplicate_groups: [],
      cleanup_candidates: [],
      categories: [
        { category: 'video', total_bytes: 150 * 1024 * 1024, file_count: 50, percentage: 60 },
      ],
      largest_folders: [
        { id: 'f-1', path: 'C:\\Test\\Movies', name: 'Movies', size_bytes: 150 * 1024 * 1024, file_count: 50, dir_count: 2 },
      ],
      largest_files: [],
    };

    const diff = computeStorageDiff(scan, mockSnapA);
    expect(diff.delta_bytes).toBe(150 * 1024 * 1024);
    expect(diff.delta_files).toBe(70);
  });
});
