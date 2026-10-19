import { ScanSummary, FileCategory } from '@/types';

export interface StorageSnapshot {
  id: string;
  name: string;
  timestamp: string;
  dateLabel: string;
  root_path: string;
  total_bytes: number;
  total_files: number;
  categories: {
    category: FileCategory;
    total_bytes: number;
  }[];
  top_folders: {
    path: string;
    name: string;
    size_bytes: number;
  }[];
}

export interface CategoryDiff {
  category: FileCategory;
  previous_bytes: number;
  current_bytes: number;
  delta_bytes: number;
  percentage_change: number;
}

export interface FolderDiff {
  path: string;
  name: string;
  previous_bytes: number;
  current_bytes: number;
  delta_bytes: number;
}

export interface StorageDiffResult {
  snapshot: StorageSnapshot;
  current_total_bytes: number;
  delta_bytes: number;
  delta_files: number;
  category_diffs: CategoryDiff[];
  folder_diffs: FolderDiff[];
}

const STORAGE_KEY = 'bytemap_storage_snapshots_v1';

export function getSavedSnapshots(): StorageSnapshot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to parse saved snapshots:', err);
    return [];
  }
}

export function saveSnapshotFromScan(scan: ScanSummary, customName?: string): StorageSnapshot {
  const snapshots = getSavedSnapshots();
  const date = new Date();
  const formattedDate = date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const newSnapshot: StorageSnapshot = {
    id: `snap_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: customName?.trim() || `Snapshot ${formattedDate}`,
    timestamp: date.toISOString(),
    dateLabel: formattedDate,
    root_path: scan.root_path,
    total_bytes: scan.total_bytes,
    total_files: scan.total_files,
    categories: scan.categories.map((c) => ({
      category: c.category,
      total_bytes: c.total_bytes,
    })),
    top_folders: (scan.largest_folders || []).slice(0, 30).map((f) => ({
      path: f.path,
      name: f.name,
      size_bytes: f.size_bytes,
    })),
  };

  const updated = [newSnapshot, ...snapshots].slice(0, 20); // keep up to 20 snapshots
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return newSnapshot;
}

export function deleteSnapshot(id: string): void {
  const snapshots = getSavedSnapshots().filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots));
}

export function computeStorageDiff(
  current: ScanSummary,
  snapshot: StorageSnapshot
): StorageDiffResult {
  const delta_bytes = current.total_bytes - snapshot.total_bytes;
  const delta_files = current.total_files - snapshot.total_files;

  // Category Diffs
  const currentCategoryMap = new Map<FileCategory, number>();
  for (const c of current.categories) {
    currentCategoryMap.set(c.category, c.total_bytes);
  }

  const prevCategoryMap = new Map<FileCategory, number>();
  for (const c of snapshot.categories) {
    prevCategoryMap.set(c.category, c.total_bytes);
  }

  const allCategories = Array.from(
    new Set([...currentCategoryMap.keys(), ...prevCategoryMap.keys()])
  );

  const category_diffs: CategoryDiff[] = allCategories.map((category) => {
    const current_bytes = currentCategoryMap.get(category) || 0;
    const previous_bytes = prevCategoryMap.get(category) || 0;
    const cat_delta = current_bytes - previous_bytes;
    const percentage_change =
      previous_bytes > 0 ? (cat_delta / previous_bytes) * 100 : current_bytes > 0 ? 100 : 0;

    return {
      category,
      previous_bytes,
      current_bytes,
      delta_bytes: cat_delta,
      percentage_change,
    };
  }).sort((a, b) => Math.abs(b.delta_bytes) - Math.abs(a.delta_bytes));

  // Folder Diffs
  const currentFolderMap = new Map<string, { name: string; size: number }>();
  for (const f of current.largest_folders || []) {
    currentFolderMap.set(f.path, { name: f.name, size: f.size_bytes });
  }

  const prevFolderMap = new Map<string, { name: string; size: number }>();
  for (const f of snapshot.top_folders || []) {
    prevFolderMap.set(f.path, { name: f.name, size: f.size_bytes });
  }

  const allFolderPaths = Array.from(
    new Set([...currentFolderMap.keys(), ...prevFolderMap.keys()])
  );

  const folder_diffs: FolderDiff[] = allFolderPaths
    .map((path) => {
      const cur = currentFolderMap.get(path);
      const prev = prevFolderMap.get(path);
      const curSize = cur?.size || 0;
      const prevSize = prev?.size || 0;
      const fDelta = curSize - prevSize;
      const name = cur?.name || prev?.name || path.split(/[\\/]/).pop() || path;

      return {
        path,
        name,
        previous_bytes: prevSize,
        current_bytes: curSize,
        delta_bytes: fDelta,
      };
    })
    .filter((f) => Math.abs(f.delta_bytes) > 5 * 1024 * 1024) // only folders that changed by >5MB
    .sort((a, b) => b.delta_bytes - a.delta_bytes);

  return {
    snapshot,
    current_total_bytes: current.total_bytes,
    delta_bytes,
    delta_files,
    category_diffs,
    folder_diffs,
  };
}
