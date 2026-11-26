import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ExternalLink,
  ArrowRight,
  History,
  FileSpreadsheet,
  Compass,
  CornerUpLeft,
  Copy,
  Check,
  Search,
  X,
  Sparkles,
  Trash2,
  FolderOpen,
  HardDrive,
  RefreshCw,
} from 'lucide-react';
import {
  ComicKingdomIcon,
  ComicDrivesIcon,
  ComicLargeFilesIcon,
  ComicDuplicatesIcon,
  ComicZapIcon,
  ComicPieChartIcon,
  ComicTrashIcon,
  ComicShieldIcon,
} from '@/components/icons/ComicIcons';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useAppStore } from '@/lib/store';
import {
  formatBytes,
  formatNumber,
  getCategoryColor,
  cleanDisplayPath,
  findDriveForPath,
  downloadTextFile,
  getFileIntelligence,
} from '@/lib/utils';
import { CategoryIcon } from '@/components/CategoryIcon';
import { ScoutAvatar } from '@/components/ScoutMascot';
import { ComicStorageBar } from '@/components/ComicStorageBar';
import { StorageDiffModal } from '@/components/StorageDiffModal';
import { ConfirmCleanupModal, ConfirmCleanupTarget } from '@/components/ConfirmCleanupModal';
import { exportStorageAuditHtml } from '@/lib/exportAuditReport';
import { getSavedSnapshots } from '@/lib/snapshots';
import { api } from '@/lib/api';
import { FileCategory } from '@/types';

interface TreemapItem {
  id: string;
  name: string;
  path: string;
  size: number;
  isDir: boolean;
  category?: FileCategory;
  fileCount?: number;
}

interface RectNode extends TreemapItem {
  x: number;
  y: number;
  w: number;
  h: number;
}

function squarify(
  items: TreemapItem[],
  x: number,
  y: number,
  width: number,
  height: number
): RectNode[] {
  if (items.length === 0 || width <= 0 || height <= 0) return [];
  const totalValue = items.reduce((acc, it) => acc + it.size, 0);
  if (totalValue <= 0) return [];

  const sorted = [...items]
    .filter((it) => it.size > 0)
    .sort((a, b) => b.size - a.size);
  if (sorted.length === 0) return [];

  const totalArea = width * height;
  const normalized = sorted.map((it) => ({
    ...it,
    area: (it.size / totalValue) * totalArea,
  }));

  const result: RectNode[] = [];

  function worstAspectRatio(row: typeof normalized, side: number): number {
    if (row.length === 0 || side <= 0) return Infinity;
    const sumArea = row.reduce((acc, r) => acc + r.area, 0);
    if (sumArea <= 0) return Infinity;

    const s2 = side * side;
    const sum2 = sumArea * sumArea;

    let maxRatio = 0;
    for (const r of row) {
      if (r.area <= 0) continue;
      const ratio = Math.max((s2 * r.area) / sum2, sum2 / (s2 * r.area));
      if (ratio > maxRatio) maxRatio = ratio;
    }
    return maxRatio;
  }

  function layoutRow(
    row: typeof normalized,
    rx: number,
    ry: number,
    rw: number,
    rh: number
  ): { nextX: number; nextY: number; nextW: number; nextH: number } {
    const sumArea = row.reduce((acc, r) => acc + r.area, 0);
    const isHorizontal = rw >= rh;

    if (isHorizontal) {
      const rowWidth = rh > 0 ? sumArea / rh : 0;
      let currY = ry;
      for (const item of row) {
        const itemHeight = sumArea > 0 ? (item.area / sumArea) * rh : 0;
        result.push({
          id: item.id,
          name: item.name,
          path: item.path,
          size: item.size,
          isDir: item.isDir,
          category: item.category,
          fileCount: item.fileCount,
          x: rx,
          y: currY,
          w: rowWidth,
          h: itemHeight,
        });
        currY += itemHeight;
      }
      return {
        nextX: rx + rowWidth,
        nextY: ry,
        nextW: Math.max(0, rw - rowWidth),
        nextH: rh,
      };
    } else {
      const rowHeight = rw > 0 ? sumArea / rw : 0;
      let currX = rx;
      for (const item of row) {
        const itemWidth = sumArea > 0 ? (item.area / sumArea) * rw : 0;
        result.push({
          id: item.id,
          name: item.name,
          path: item.path,
          size: item.size,
          isDir: item.isDir,
          category: item.category,
          fileCount: item.fileCount,
          x: currX,
          y: ry,
          w: itemWidth,
          h: rowHeight,
        });
        currX += itemWidth;
      }
      return {
        nextX: rx,
        nextY: ry + rowHeight,
        nextW: rw,
        nextH: Math.max(0, rh - rowHeight),
      };
    }
  }

  function squarifySub(
    children: typeof normalized,
    row: typeof normalized,
    cx: number,
    cy: number,
    cw: number,
    ch: number
  ) {
    if (children.length === 0) {
      if (row.length > 0) {
        layoutRow(row, cx, cy, cw, ch);
      }
      return;
    }

    const shorterSide = Math.min(cw, ch);
    if (shorterSide <= 0) return;

    const nextChild = children[0];
    const candidateRow = [...row, nextChild];

    if (row.length === 0) {
      squarifySub(children.slice(1), candidateRow, cx, cy, cw, ch);
    } else {
      const currentWorst = worstAspectRatio(row, shorterSide);
      const candidateWorst = worstAspectRatio(candidateRow, shorterSide);

      if (candidateWorst <= currentWorst) {
        squarifySub(children.slice(1), candidateRow, cx, cy, cw, ch);
      } else {
        const remaining = layoutRow(row, cx, cy, cw, ch);
        squarifySub(children, [], remaining.nextX, remaining.nextY, remaining.nextW, remaining.nextH);
      }
    }
  }

  squarifySub(normalized, [], x, y, width, height);
  return result;
}

function getCategoryFromNameOrExt(name: string, category?: string): string {
  if (category) return category.toLowerCase();
  const n = name.toLowerCase();
  if (n.includes('dev') || n.includes('project') || n.includes('code') || n.includes('src') || n.includes('git')) return 'dev';
  if (n.includes('media') || n.includes('video') || n.includes('movie') || n.includes('stream') || n.includes('record')) return 'video';
  if (n.includes('doc') || n.includes('paper') || n.includes('note') || n.includes('text') || n.includes('pdf')) return 'document';
  if (n.includes('image') || n.includes('photo') || n.includes('pic') || n.includes('asset')) return 'image';
  if (n.includes('audio') || n.includes('music') || n.includes('sound') || n.includes('song')) return 'audio';
  if (n.includes('archive') || n.includes('zip') || n.includes('backup') || n.includes('tar') || n.includes('rar') || n.includes('7z')) return 'archive';
  if (n.includes('app') || n.includes('program') || n.includes('bin') || n.includes('build') || n.includes('dist') || n.includes('driver')) return 'app';
  return '';
}

function inferFolderCategory(
  folderPath: string,
  folderName: string,
  largestFiles?: { path: string; category: FileCategory; size_bytes: number }[]
): FileCategory {
  const normPrefix = folderPath.toLowerCase().replace(/\\+$/, '').replace(/\/+$/, '');
  const categoryWeights: Record<string, number> = {};

  if (largestFiles && largestFiles.length > 0) {
    for (const file of largestFiles) {
      const filePath = file.path.toLowerCase();
      if (filePath.startsWith(normPrefix)) {
        categoryWeights[file.category] = (categoryWeights[file.category] || 0) + file.size_bytes;
      }
    }
  }

  let maxBytes = 0;
  let dominantCat: FileCategory | undefined;
  for (const [cat, bytes] of Object.entries(categoryWeights)) {
    if (bytes > maxBytes) {
      maxBytes = bytes;
      dominantCat = cat as FileCategory;
    }
  }

  if (dominantCat) return dominantCat;

  const nameCat = getCategoryFromNameOrExt(folderName);
  if (nameCat) return nameCat as FileCategory;

  return 'other';
}

function shadeHexColor(hex: string, factor: number): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return hex;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const adjust = (c: number) =>
    factor >= 0
      ? Math.min(255, Math.round(c + (255 - c) * factor))
      : Math.max(0, Math.round(c * (1 + factor)));
  const toHex = (c: number) => c.toString(16).padStart(2, '0');
  return `#${toHex(adjust(r))}${toHex(adjust(g))}${toHex(adjust(b))}`;
}

/**
 * Keeps Treemap blocks strictly 1:1 synced with File Type Breakdown colors,
 * applying only a tiny tonal shift on secondary sibling blocks so adjacent blocks stay legible.
 */
function getSyncedCellColor(index: number, category: FileCategory | string): string {
  const baseColor = getCategoryColor(category);
  if (index === 0) return baseColor;
  const shifts = [0, 0.08, -0.08, 0.14, -0.12];
  const shift = shifts[index % shifts.length];
  return shift === 0 ? baseColor : shadeHexColor(baseColor, shift);
}

export interface DigitalKingdomViewProps {
  onOpenScanModal?: () => void;
}

export const DigitalKingdomView: React.FC<DigitalKingdomViewProps> = ({
  onOpenScanModal,
}) => {
  const {
    drives,
    selectedDrive,
    setSelectedDrive,
    scanSummary,
    scanProgress,
    settings,
    setActiveTab,
    treemapCurrentPath,
    setTreemapCurrentPath,
    selectedCleanupIds,
    toggleCleanupSelection,
    setSearchQuery,
    lastCleanupSummary,
    clearLastCleanupSummary,
    applyCleanupResult,
  } = useAppStore();

  const [minThresholdMB, setMinThresholdMB] = useState<number>(10);
  const [hoveredNode, setHoveredNode] = useState<RectNode | null>(null);
  const [contextMenu, setContextMenu] = useState<{ node: RectNode; xPct: number; yPct: number } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ConfirmCleanupTarget | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [showTimeMachine, setShowTimeMachine] = useState<boolean>(false);
  const [highlightCategory, setHighlightCategory] = useState<FileCategory | 'all'>('all');
  const treemapContainerRef = useRef<HTMLDivElement>(null);

  const snapshotCount = useMemo(() => getSavedSnapshots().length, [scanSummary, showTimeMachine]);

  const isDark =
    settings.theme === 'dark' ||
    (settings.theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-color-scheme: dark)').matches);

  const handleDrilldownExtension = (extName: string) => {
    setSearchQuery(extName.startsWith('.') ? extName : `.${extName}`);
    setActiveTab('explore');
  };

  // Active drive calculations - STRICTLY REAL DATA
  const activeDrive = useMemo(() => {
    if (scanSummary?.root_path) {
      const matched = findDriveForPath(scanSummary.root_path, drives);
      if (matched) return matched;
    }
    if (scanProgress.status === 'scanning' && scanProgress.current_path) {
      const matched = findDriveForPath(scanProgress.current_path, drives);
      if (matched) return matched;
    }
    if (selectedDrive) return selectedDrive;
    return drives.length > 0 ? drives[0] : null;
  }, [scanSummary, scanProgress.status, scanProgress.current_path, selectedDrive, drives]);

  const totalDriveBytes = activeDrive?.total_bytes || 0;
  const usedDriveBytes = activeDrive?.used_bytes || (scanSummary ? scanSummary.total_bytes : 0);
  const usedPercent =
    totalDriveBytes > 0 ? Math.min(100, Math.round((usedDriveBytes / totalDriveBytes) * 100)) : 0;

  const duplicateReclaimable =
    scanSummary?.duplicate_groups.reduce((acc, g) => acc + g.reclaimable_bytes, 0) || 0;

  const cleanupReclaimable =
    scanSummary?.cleanup_candidates.reduce((acc, c) => acc + c.file.size_bytes, 0) || 0;

  const categoriesData = useMemo(() => {
    if (scanSummary && scanSummary.categories.length > 0) {
      return scanSummary.categories.slice(0, 7).map((c) => ({
        name: c.category.toUpperCase(),
        category: c.category,
        value: c.total_bytes,
        percentage: c.percentage,
        color: getCategoryColor(c.category),
      }));
    }
    return [];
  }, [scanSummary]);

  const topExtensions = useMemo(() => {
    if (scanSummary && scanSummary.extensions.length > 0) {
      const total = scanSummary.total_bytes || 1;
      return scanSummary.extensions.slice(0, 4).map((ext) => ({
        ext: ext.extension,
        percent: Math.max(1, Math.round((ext.total_bytes / total) * 100)),
        color: getCategoryColor(ext.category),
      }));
    }
    return [];
  }, [scanSummary]);

  const cleanRootPath = useMemo(() => {
    return scanSummary?.root_path
      ? cleanDisplayPath(scanSummary.root_path).replace(/[\\\/]+$/, '')
      : '';
  }, [scanSummary]);

  const isDrilledDown = useMemo(() => {
    if (!treemapCurrentPath) return false;
    const cleanCurrent = cleanDisplayPath(treemapCurrentPath).replace(/[\\\/]+$/, '');
    if (!cleanCurrent) return false;
    if (cleanRootPath && cleanCurrent.toLowerCase() === cleanRootPath.toLowerCase()) {
      return false;
    }
    return true;
  }, [treemapCurrentPath, cleanRootPath]);

  const [copiedPath, setCopiedPath] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [spotlightQuery, setSpotlightQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setShowSearch(true);
        setTimeout(() => searchInputRef.current?.focus(), 80);
      } else if (e.key === 'Escape' && showSearch) {
        setShowSearch(false);
        setSpotlightQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSearch]);

  const handleCopyCurrentPath = () => {
    const p = treemapCurrentPath || scanSummary?.root_path || '';
    if (p) {
      navigator.clipboard?.writeText(cleanDisplayPath(p));
      setCopiedPath(true);
      setTimeout(() => setCopiedPath(false), 1500);
    }
  };

  const breadcrumbs = useMemo(() => {
    if (!treemapCurrentPath || !scanSummary?.root_path) return [];
    const cleanRoot = cleanDisplayPath(scanSummary.root_path).replace(/[\\\/]+$/, '');
    const cleanCurrent = cleanDisplayPath(treemapCurrentPath).replace(/[\\\/]+$/, '');
    if (!cleanCurrent || cleanCurrent.toLowerCase() === cleanRoot.toLowerCase()) return [];

    const isWindows = cleanRoot.includes(':') || cleanRoot.includes('\\');
    const sep = isWindows ? '\\' : '/';

    if (cleanCurrent.toLowerCase().startsWith(cleanRoot.toLowerCase())) {
      const rel = cleanCurrent.slice(cleanRoot.length).replace(/^[\\\/]+/, '');
      if (!rel) return [];
      const parts = rel.split(/[\\\/]/).filter(Boolean);
      let accumulated = cleanRoot;
      return parts.map((part) => {
        accumulated = `${accumulated}${sep}${part}`;
        return { name: part, path: accumulated };
      });
    }

    const parts = cleanCurrent.split(/[\\\/]/).filter(Boolean);
    return parts.map((part, idx) => ({
      name: part,
      path: parts.slice(0, idx + 1).join(sep),
    }));
  }, [treemapCurrentPath, scanSummary?.root_path]);

  const handleTreemapBack = () => {
    if (!treemapCurrentPath) return;
    const cleanP = cleanDisplayPath(treemapCurrentPath).replace(/[\\\/]+$/, '');
    const parts = cleanP.split(/[\\\/]/);
    parts.pop();
    const parent = parts.join('\\');
    if (
      !parent ||
      (cleanRootPath && parent.toLowerCase() === cleanRootPath.toLowerCase()) ||
      (cleanRootPath && parent.length <= cleanRootPath.length)
    ) {
      setTreemapCurrentPath('');
    } else {
      setTreemapCurrentPath(parent);
    }
  };

  const treemapItems = useMemo<TreemapItem[]>(() => {
    if (!scanSummary) return [];

    const items: TreemapItem[] = [];
    const normCurrent = (treemapCurrentPath || scanSummary.root_path || '')
      .toLowerCase()
      .replace(/\\+$/, '')
      .replace(/\/+$/, '');

    for (const folder of scanSummary.largest_folders) {
      const normFolder = folder.path.toLowerCase().replace(/\\+$/, '').replace(/\/+$/, '');
      if (normFolder === normCurrent) continue;
      if (normFolder.startsWith(normCurrent)) {
        const sub = normFolder.slice(normCurrent.length).replace(/^[\\\/]/, '');
        const directSub = sub.split(/[\\\/]/)[0];
        if (directSub && !items.some((it) => it.name.toLowerCase() === directSub.toLowerCase())) {
          items.push({
            id: folder.path,
            name: directSub.toUpperCase(),
            path: folder.path,
            size: folder.size_bytes,
            isDir: true,
            fileCount: folder.file_count,
            category: inferFolderCategory(folder.path, directSub, scanSummary.largest_files),
          });
        }
      }
    }

    for (const file of scanSummary.largest_files) {
      const normFile = file.path.toLowerCase();
      if (normFile.startsWith(normCurrent)) {
        const sub = normFile.slice(normCurrent.length).replace(/^[\\\/]/, '');
        const segments = sub.split(/[\\\/]/);
        if (segments.length <= 1) {
          items.push({
            id: file.id,
            name: file.name,
            path: file.path,
            size: file.size_bytes,
            isDir: false,
            category: file.category,
          });
        }
      }
    }

    if (items.length === 0 && treemapCurrentPath) {
      for (const file of scanSummary.largest_files) {
        const normFile = file.path.toLowerCase();
        if (normFile.startsWith(normCurrent)) {
          items.push({
            id: file.id,
            name: file.name,
            path: file.path,
            size: file.size_bytes,
            isDir: false,
            category: file.category,
          });
        }
      }
    }

    if (items.length === 0) {
      for (const folder of scanSummary.largest_folders.slice(0, 15)) {
        items.push({
          id: folder.path,
          name: folder.name.toUpperCase(),
          path: folder.path,
          size: folder.size_bytes,
          isDir: true,
          fileCount: folder.file_count,
          category: inferFolderCategory(folder.path, folder.name, scanSummary.largest_files),
        });
      }
    }

    // Sort descending and aggregate tiny tail slivers (<1.5%) into one clean summary tile
    // so skinny corners never turn into illegible micro-rectangles.
    const sorted = [...items]
      .filter((it) => it.size > 0)
      .sort((a, b) => b.size - a.size);

    const totalSize = sorted.reduce((acc, it) => acc + it.size, 0);
    if (sorted.length <= 7 || totalSize <= 0) {
      return sorted;
    }

    const major: TreemapItem[] = [];
    const minor: TreemapItem[] = [];
    for (let i = 0; i < sorted.length; i++) {
      const it = sorted[i];
      if (i < 5 || (major.length < 10 && it.size / totalSize >= 0.015)) {
        major.push(it);
      } else {
        minor.push(it);
      }
    }

    if (minor.length >= 2) {
      const minorSum = minor.reduce((acc, it) => acc + it.size, 0);
      major.push({
        id: '__smaller_tail__',
        name: `+${minor.length} Smaller Items`,
        path: treemapCurrentPath || scanSummary.root_path,
        size: minorSum,
        isDir: true,
        category: 'other',
      });
    } else if (minor.length === 1) {
      major.push(minor[0]);
    }

    return major;
  }, [scanSummary, treemapCurrentPath]);

  const rects = useMemo(() => {
    return squarify(treemapItems, 0, 0, 1000, 700);
  }, [treemapItems]);

  const matchesSearch = (node: RectNode, query: string) => {
    if (!query.trim()) return false;
    const q = query.toLowerCase().trim();
    const nameMatch = node.name.toLowerCase().includes(q);
    const pathMatch = node.path.toLowerCase().includes(q);
    const catMatch = (node.category || '').toLowerCase().includes(q);
    return nameMatch || pathMatch || catMatch;
  };

  const matchedNodes = useMemo(() => {
    if (!spotlightQuery.trim()) return [];
    return rects.filter((r) => matchesSearch(r, spotlightQuery));
  }, [rects, spotlightQuery]);

  const matchedBytes = useMemo(() => {
    return matchedNodes.reduce((sum, n) => sum + n.size, 0);
  }, [matchedNodes]);

  const largeFilesList = useMemo(() => {
    if (!scanSummary || scanSummary.largest_files.length === 0) return [];
    return scanSummary.largest_files
      .filter((f) => f.size_bytes >= minThresholdMB * 1024 * 1024)
      .slice(0, 5);
  }, [scanSummary, minThresholdMB]);

  const duplicateAlerts = useMemo(() => {
    if (!scanSummary || scanSummary.duplicate_groups.length === 0) return [];
    return scanSummary.duplicate_groups.slice(0, 3);
  }, [scanSummary]);

  const handleReveal = async (path: string) => {
    try {
      await api.revealInFolder(path);
    } catch {
      // Browser preview
    }
  };

  const handleExportJSON = () => {
    if (!scanSummary) return;
    downloadTextFile(
      `bytemap-report-${Date.now()}.json`,
      JSON.stringify(scanSummary, null, 2),
      'application/json;charset=utf-8'
    );
  };

  const handleConfirmTreemapDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      const res = await api.executeCleanup(
        [{ path: pendingDelete.path, expected_size: pendingDelete.size_bytes }],
        settings.prefer_trash
      );
      const successPaths = res.results.filter((r) => r.success).map((r) => r.path);
      const pathBytesMap: Record<string, number> = {};
      res.results
        .filter((r) => r.success)
        .forEach((r) => {
          pathBytesMap[r.path] = r.bytes_freed;
        });
      applyCleanupResult(res.total_freed_bytes, successPaths, pathBytesMap, settings.prefer_trash);
      setPendingDelete(null);
      setContextMenu(null);
    } catch (err) {
      console.error('Treemap cleanup failed:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const scanSpeed = useMemo(() => {
    if (scanProgress.status === 'scanning' && scanProgress.elapsed_ms > 0) {
      return Math.round((scanProgress.scanned_files / scanProgress.elapsed_ms) * 1000);
    }
    if (scanSummary && scanSummary.scan_duration_ms > 0) {
      return Math.round((scanSummary.total_files / scanSummary.scan_duration_ms) * 1000);
    }
    return 0;
  }, [scanProgress, scanSummary]);

  // =========================================================
  // CLEAN WELCOME / FIRST-TIME HOME SCREEN (When no scan yet)
  // =========================================================
  if (!scanSummary) {
    const isScanning = scanProgress.status === 'scanning';

    return (
      <div className="flex flex-col items-center justify-center min-h-full py-6 px-3 sm:px-6 font-sans text-slate-900">
        <div className="w-full max-w-3xl space-y-5">
          {/* Focused Hero Welcome Card */}
          <div className="bg-white rounded-3xl border-2.5 border-slate-900 p-6 sm:p-8 shadow-comic space-y-6 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <div className="relative shrink-0">
                <div
                  className={`w-20 h-20 rounded-2xl border-2.5 border-slate-900 shadow-comic flex items-center justify-center overflow-hidden transition-all ${isScanning ? 'ring-4 ring-emerald-400/50' : ''
                    }`}
                >
                  <ScoutAvatar className="w-full h-full" isScanning={isScanning} />
                </div>
                {isScanning && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-slate-900" />
                  </span>
                )}
              </div>

              <div className="flex-1 text-center sm:text-left space-y-1.5">
                <div
                  className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-lg border border-slate-900 text-[11px] font-bold uppercase text-slate-900 ${isScanning ? 'bg-emerald-400' : 'bg-amber-300'
                    }`}
                >
                  <ComicKingdomIcon className="w-3.5 h-3.5" />
                  <span>{isScanning ? 'Live Rust Traversal Active' : '100% Offline • Zero Database'}</span>
                </div>
                <h2 className="font-heading text-2xl sm:text-3xl text-slate-900 tracking-tight">
                  {isScanning ? 'Mapping Your Storage...' : 'See Where Your Disk Space Went'}
                </h2>
                <p className="text-sm text-slate-600 max-w-xl">
                  {isScanning
                    ? `Scanning ${formatNumber(scanProgress.scanned_files)} files (${formatBytes(scanProgress.scanned_bytes, settings.unit)}) at native Rust speed.`
                    : 'Pick a drive below and run a fast scan to visualize your folders, catch large space hogs, and safely clean clutter.'}
                </p>
              </div>
            </div>

            {isScanning ? (
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border-2 border-slate-900">
                <div className="relative w-full h-4 rounded-full bg-slate-200 border-2 border-slate-900 overflow-hidden">
                  <div className="h-full bg-emerald-400 w-full comic-progress-stripe" />
                  <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-scout-sweep" />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-white border border-slate-900">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Files</span>
                    <span className="font-mono font-bold text-sm text-slate-900 tabular-nums">
                      {formatNumber(scanProgress.scanned_files)}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-slate-900">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Folders</span>
                    <span className="font-mono font-bold text-sm text-slate-900 tabular-nums">
                      {formatNumber(scanProgress.scanned_directories)}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-slate-900">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Size</span>
                    <span className="font-mono font-bold text-sm text-slate-900 tabular-nums">
                      {formatBytes(scanProgress.scanned_bytes, settings.unit)}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-slate-900">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Speed</span>
                    <span className="font-mono font-bold text-sm text-emerald-600 tabular-nums">
                      {scanSpeed > 0 ? `${formatNumber(scanSpeed)}/s` : 'Starting'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-mono text-slate-500 truncate flex-1">
                    {scanProgress.current_path ? cleanDisplayPath(scanProgress.current_path) : 'Traversing filesystem...'}
                  </p>
                  <button
                    type="button"
                    onClick={() => api.cancelScan()}
                    className="px-3 py-1 rounded-lg bg-rose-500 hover:bg-rose-400 text-white border border-slate-900 text-[11px] font-bold uppercase cursor-pointer shrink-0"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Active Drive Selector & Capacity Bar */}
                <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-900 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <HardDrive className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="font-bold text-base text-slate-900">
                        {activeDrive ? activeDrive.name : 'Select a Drive to Scan'}
                      </span>
                    </div>
                    {totalDriveBytes > 0 && (
                      <span className="font-mono font-bold text-xs text-slate-700">
                        {formatBytes(usedDriveBytes, settings.unit)} / {formatBytes(totalDriveBytes, settings.unit)} used
                      </span>
                    )}
                  </div>

                  {totalDriveBytes > 0 && (
                    <ComicStorageBar
                      percent={usedPercent}
                      heightClass="h-3.5"
                      showLabel={true}
                      showStatusBadge={true}
                    />
                  )}

                  {drives.length > 1 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] font-bold uppercase text-slate-500 mr-1">Drives:</span>
                      {drives.map((d) => {
                        const isSelected = activeDrive?.id === d.id;
                        return (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => setSelectedDrive(d)}
                            className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border-2 border-slate-900 text-xs font-bold transition-all cursor-pointer ${isSelected
                              ? 'bg-amber-400 text-slate-900 shadow-comic-sm'
                              : 'bg-white hover:bg-amber-100 text-slate-700'
                              }`}
                          >
                            <HardDrive className="w-3 h-3" />
                            <span>{d.name || d.mount_point}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Single Clear Primary CTA + Quick Secondary Link */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => (onOpenScanModal ? onOpenScanModal() : setActiveTab('drives'))}
                      className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 border-2.5 border-slate-900 shadow-comic hover:-translate-y-0.5 font-heading text-base uppercase tracking-wide text-slate-900 transition-all cursor-pointer"
                    >
                      <ComicZapIcon className="w-4 h-4" />
                      <span>Scan {activeDrive ? activeDrive.mount_point : 'Storage'} Now</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('drives')}
                      className="inline-flex items-center space-x-1.5 px-4 py-3 rounded-xl bg-white hover:bg-slate-100 border-2 border-slate-900 shadow-comic-sm text-xs font-bold uppercase text-slate-800 transition-all cursor-pointer"
                    >
                      <FolderOpen className="w-4 h-4" />
                      <span>Choose Folder</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('cleanup')}
                    className="text-xs font-bold text-slate-600 hover:text-amber-600 underline underline-offset-4 cursor-pointer"
                  >
                    Clean Dev &amp; AI Caches without scanning &rarr;
                  </button>
                </div>
              </>
            )}
          </div>

          {/* 3 Clean Capability Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-white rounded-2xl border-2 border-slate-900 shadow-comic-sm space-y-1">
              <div className="flex items-center space-x-2 font-bold text-sm text-slate-900">
                <ComicKingdomIcon className="w-4 h-4 shrink-0" />
                <span>Visual Space Map</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Color-synced Treemap and Donut breakdown show exactly what fills your SSD.
              </p>
            </div>

            <div className="p-4 bg-white rounded-2xl border-2 border-slate-900 shadow-comic-sm space-y-1">
              <div className="flex items-center space-x-2 font-bold text-sm text-slate-900">
                <ComicDuplicatesIcon className="w-4 h-4 shrink-0" />
                <span>BLAKE3 Duplicates</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Cryptographic byte-for-byte matching catches identical files across folders.
              </p>
            </div>

            <div className="p-4 bg-white rounded-2xl border-2 border-slate-900 shadow-comic-sm space-y-1">
              <div className="flex items-center space-x-2 font-bold text-sm text-slate-900">
                <ComicShieldIcon className="w-4 h-4 shrink-0" />
                <span>Recycle Bin Safe</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                OS system folders are protected and deleted items go to Recycle Bin first.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // ORGANIZED POST-SCAN DASHBOARD
  // =========================================================
  return (
    <div className="flex flex-col space-y-2.5 pb-2 font-sans text-slate-900">
      {/* Live Storage Reclaim Celebration Banner */}
      {lastCleanupSummary && (
        <div className="p-3 bg-emerald-50 border-2.5 border-slate-900 rounded-2xl shadow-comic flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-bold text-slate-900">
          <div className="flex items-start sm:items-center space-x-3">
            <span className="text-xl shrink-0">🎉</span>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-heading text-sm uppercase text-slate-900">
                  Storage Reclaimed: {formatBytes(lastCleanupSummary.freedBytes, settings.unit)}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] uppercase border border-slate-900 ${lastCleanupSummary.preferTrash
                    ? 'bg-amber-300 text-slate-900'
                    : 'bg-emerald-300 text-slate-900'
                    }`}
                >
                  {lastCleanupSummary.preferTrash ? 'Moved to Recycle Bin' : 'Permanently Deleted'}
                </span>
              </div>
              <p className="text-slate-600 font-medium mt-0.5">
                {lastCleanupSummary.count} targets pruned and space metrics updated.
                {lastCleanupSummary.preferTrash &&
                  ' Empty your Recycle Bin to free physical OS disk blocks.'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
            {lastCleanupSummary.preferTrash && (
              <button
                type="button"
                onClick={() => api.openRecycleBin()}
                className="px-2.5 py-1 rounded-lg border-2 border-slate-900 bg-amber-400 hover:bg-amber-300 text-[11px] font-bold uppercase shadow-comic-sm transition-all flex items-center space-x-1 cursor-pointer"
              >
                <ComicTrashIcon className="w-3 h-3" />
                <span>Open Recycle Bin</span>
              </button>
            )}
            <button
              type="button"
              onClick={clearLastCleanupSummary}
              className="px-2.5 py-1 rounded-lg border border-slate-900 bg-white hover:bg-slate-50 text-[11px] font-bold uppercase shadow-comic-sm cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Compact Top Summary & Quick Actions Strip */}
      <div className="bg-white rounded-2xl border-2 border-slate-900 px-3.5 py-2 shadow-comic flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-xl bg-amber-300 border-2 border-slate-900 flex items-center justify-center shrink-0">
            <ComicDrivesIcon className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1 max-w-md">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-heading text-sm uppercase text-slate-900 truncate">
                {activeDrive ? activeDrive.name : cleanDisplayPath(scanSummary.root_path)}
              </span>
              <span className="font-mono font-bold text-slate-700 shrink-0">
                {totalDriveBytes > 0
                  ? `${formatBytes(usedDriveBytes, settings.unit)} / ${formatBytes(totalDriveBytes, settings.unit)} (${usedPercent}%)`
                  : `${formatBytes(scanSummary.total_bytes, settings.unit)} scouted`}
              </span>
            </div>
            {totalDriveBytes > 0 && (
              <div className="mt-1">
                <ComicStorageBar
                  percent={usedPercent}
                  heightClass="h-2.5"
                  showLabel={false}
                  showStatusBadge={false}
                />
              </div>
            )}
          </div>
          <div className="hidden xl:flex items-center space-x-2 text-xs text-slate-600 pl-2 border-l border-slate-200">
            <span className="font-mono font-bold text-slate-900">
              {formatNumber(scanSummary.total_files)} files
            </span>
            <span>•</span>
            <span className="font-mono">
              {scanSpeed > 0 ? `${formatNumber(scanSpeed)} files/s` : 'Ready'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            type="button"
            onClick={() => setShowTimeMachine(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-300 hover:bg-amber-400 border-2 border-slate-900 shadow-comic-sm text-xs font-bold uppercase text-slate-900 transition-all cursor-pointer"
            title="Compare snapshots over time in Time Machine"
          >
            <History className="w-3.5 h-3.5" />
            <span>Time Machine</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-900 text-amber-300 dark:!bg-slate-900 dark:!text-amber-300 font-mono text-[10px] leading-none font-bold">
              {snapshotCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => exportStorageAuditHtml(scanSummary, settings, activeDrive)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-sky-300 hover:bg-sky-200 border-2 border-slate-900 shadow-comic-sm text-xs font-bold uppercase text-slate-900 transition-all cursor-pointer"
            title="Export standalone HTML storage audit report"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>HTML Report</span>
          </button>

          <button
            type="button"
            onClick={handleExportJSON}
            className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border-2 border-slate-900 shadow-comic-sm text-xs font-bold uppercase text-slate-800 transition-all cursor-pointer"
            title="Export scan results as JSON"
          >
            <span>JSON</span>
          </button>

          {onOpenScanModal && (
            <button
              type="button"
              onClick={onOpenScanModal}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-amber-100 border-2 border-slate-900 shadow-comic-sm text-xs font-bold uppercase text-slate-800 transition-all cursor-pointer"
              title="Scan another drive or folder"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Re-scan</span>
            </button>
          )}
        </div>
      </div>

      {/* 3-Column Balanced Dashboard Grid */}
      <div className="grid grid-cols-12 gap-3 w-full items-stretch">
        {/* LEFT COLUMN: File Type Breakdown + Top Extensions */}
        <div className="col-span-12 lg:col-span-3 flex flex-col space-y-2.5">
          {/* 1. FILE TYPE BREAKDOWN CARD */}
          <div className="bg-white rounded-2xl border-2 border-slate-900 p-3 shadow-comic flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-lg bg-amber-400 dark:bg-slate-800 border-2 border-slate-900 dark:border-slate-700 shadow-comic-sm font-heading text-xs uppercase text-slate-900 dark:text-amber-300">
                <ComicPieChartIcon className="w-3.5 h-3.5" />
                <span>File Types</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('file-types')}
                className="px-2 py-0.5 rounded-lg border border-slate-300 hover:border-slate-900 bg-slate-50 hover:bg-amber-300 text-[10px] font-bold uppercase text-slate-800 transition-all cursor-pointer"
                title="Open full category analytics"
              >
                Analytics &gt;
              </button>
            </div>

            <div className="relative h-32 w-full my-0.5 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoriesData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={50}
                    stroke={isDark ? '#131824' : '#0f172a'}
                    strokeWidth={2}
                    paddingAngle={2.5}
                  >
                    {categoriesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number, name: string) => [
                      `${formatBytes(val, settings.unit)} (${categoriesData.find((c) => c.name === name)?.percentage.toFixed(1) || '0'
                      }%)`,
                      name,
                    ]}
                    contentStyle={
                      isDark
                        ? {
                          backgroundColor: '#161b26',
                          borderColor: 'rgba(255, 255, 255, 0.14)',
                          borderWidth: '1px',
                          borderRadius: '10px',
                          color: '#f8fafc',
                          fontWeight: 'bold',
                          fontSize: '11px',
                          boxShadow: '0 10px 28px rgba(0, 0, 0, 0.65)',
                          fontFamily: "'Figtree', sans-serif",
                        }
                        : {
                          backgroundColor: '#fef08a',
                          borderColor: '#0f172a',
                          borderWidth: '2px',
                          borderRadius: '10px',
                          color: '#0f172a',
                          fontWeight: 'bold',
                          fontSize: '11px',
                          boxShadow: '3px 3px 0px #0f172a',
                          fontFamily: "'Figtree', sans-serif",
                        }
                    }
                    itemStyle={{ color: isDark ? '#f8fafc' : '#0f172a' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs font-mono font-bold text-slate-900 leading-none tabular-nums">
                  {formatNumber(scanSummary.total_files)}
                </span>
                <span className="text-[9px] font-bold text-slate-500 uppercase leading-none mt-0.5">
                  Files
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-xs font-bold">
              {categoriesData.slice(0, 6).map((c) => {
                const isSpotlight = highlightCategory === c.category;
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setHighlightCategory(isSpotlight ? 'all' : c.category)}
                    title={`Click to spotlight ${c.name.toLowerCase()} blocks in the map`}
                    className={`flex items-center justify-between px-2 py-1 rounded-xl border transition-all truncate cursor-pointer text-left ${isSpotlight
                      ? 'bg-amber-300 border-slate-900 ring-1 ring-slate-900 shadow-comic-sm -translate-y-0.5'
                      : 'bg-slate-50/80 border-slate-300 hover:border-slate-900 hover:bg-amber-50'
                      }`}
                  >
                    <div className="flex items-center space-x-1.5 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-slate-900 shrink-0"
                        style={{ backgroundColor: c.color }}
                      />
                      <CategoryIcon category={c.category} className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate text-slate-900 capitalize">
                        {c.name.toLowerCase()}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-[11px] text-slate-900 shrink-0 tabular-nums ml-1">
                      {c.percentage.toFixed(0)}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. TOP EXTENSIONS CARD */}
          <div className="bg-white rounded-2xl border-2 border-slate-900 p-3 shadow-comic flex-1">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-lg bg-amber-400 dark:bg-slate-800 border-2 border-slate-900 dark:border-slate-700 shadow-comic-sm font-heading text-xs uppercase text-slate-900 dark:text-amber-300 mb-1.5">
              <ComicZapIcon className="w-3.5 h-3.5" />
              <span>Top Extensions</span>
            </div>

            {topExtensions.length > 0 ? (
              <div className="space-y-1 text-xs font-bold">
                {topExtensions.map((item, idx) => (
                  <button
                    key={item.ext}
                    type="button"
                    onClick={() => handleDrilldownExtension(item.ext)}
                    title={`Filter ${item.ext} files in Explorer`}
                    className="w-full flex items-center justify-between group px-1.5 py-1 rounded-lg hover:bg-amber-50 border border-transparent hover:border-slate-200 cursor-pointer transition-all text-left"
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className="text-slate-500 w-3 font-mono text-xs">{idx + 1}.</span>
                      <span className="font-mono text-slate-900 flex items-center space-x-1 truncate">
                        <span>{item.ext}</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 shrink-0" />
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <div className="w-14 h-2 rounded-full border border-slate-900 overflow-hidden bg-slate-200">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            backgroundColor: item.color,
                            width: `${Math.min(100, item.percent * 3)}%`,
                          }}
                        />
                      </div>
                      <span className="font-mono text-xs text-slate-900 w-8 text-right tabular-nums">
                        {item.percent}%
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-1">No extension data available.</p>
            )}
          </div>
        </div>

        {/* CENTER COLUMN: Interactive Storage Treemap */}
        <div className="col-span-12 lg:col-span-6 flex flex-col bg-white rounded-2xl border-2 border-slate-900 shadow-comic overflow-hidden p-3 relative">
          {/* Header & Controls */}
          <div className="pb-2 border-b border-slate-200 dark:border-slate-700/80 mb-2 space-y-1.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center space-x-2">
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-amber-400 dark:bg-slate-800 border-2 border-slate-900 dark:border-slate-700 shadow-comic-sm font-heading text-xs uppercase text-slate-900 dark:text-amber-300">
                  <ComicKingdomIcon className="w-3.5 h-3.5" />
                  <span>Storage Map</span>
                </div>
                <span className="text-xs font-semibold text-slate-600 hidden sm:inline">
                  Click folders to drill in • Right-click for actions
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowSearch((prev) => !prev);
                  if (!showSearch) setTimeout(() => searchInputRef.current?.focus(), 80);
                }}
                className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-xl border-2 border-slate-900 shadow-comic-sm text-xs font-bold uppercase transition-all cursor-pointer ${showSearch
                  ? 'bg-amber-400 text-slate-900'
                  : 'bg-white hover:bg-amber-100 text-slate-800'
                  }`}
                title="Spotlight Search (Ctrl+F / Cmd+F)"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Spotlight</span>
                <span className="hidden sm:inline-block text-[10px] bg-slate-200 dark:bg-slate-900 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300 font-mono border border-slate-300 dark:border-slate-700">
                  ⌘F
                </span>
              </button>
            </div>

            {showSearch && (
              <div className="flex items-center justify-between gap-2 p-2 bg-amber-300 border-2 border-slate-900 rounded-xl shadow-comic-sm">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <Search className="w-4 h-4 text-slate-900 shrink-0" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={spotlightQuery}
                    onChange={(e) => setSpotlightQuery(e.target.value)}
                    placeholder="Highlight name, .ext, folder, or category..."
                    className="w-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-900 rounded-lg border-2 border-slate-900 focus:outline-none placeholder:text-slate-400"
                  />
                </div>
                {spotlightQuery.trim() && (
                  <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-slate-900 text-amber-300 font-mono text-[11px] font-bold shrink-0">
                    <span>{matchedNodes.length} matches</span>
                    <span>•</span>
                    <span>{formatBytes(matchedBytes, settings.unit)}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSpotlightQuery('');
                    setShowSearch(false);
                  }}
                  aria-label="Close Spotlight search"
                  className="p-1 hover:bg-amber-400 rounded-md text-slate-900 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Breadcrumbs + 1:1 Synced Category Legend */}
            <div className="flex items-center justify-between flex-wrap gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-300">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 min-w-0 max-w-full overflow-x-auto">
                <Compass className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <button
                  type="button"
                  onClick={() => setTreemapCurrentPath('')}
                  className={`px-2 py-0.5 rounded-md border border-slate-900 uppercase text-[11px] transition-all cursor-pointer shrink-0 ${!isDrilledDown
                    ? 'bg-amber-300 text-slate-900 font-bold'
                    : 'bg-white hover:bg-amber-100 text-slate-700'
                    }`}
                >
                  {cleanDisplayPath(scanSummary.root_path)}
                </button>

                {isDrilledDown && (
                  <>
                    {breadcrumbs.map((b, i) => (
                      <React.Fragment key={b.path}>
                        <span className="text-slate-400 shrink-0">&gt;</span>
                        <button
                          type="button"
                          onClick={() => setTreemapCurrentPath(b.path)}
                          className={`px-2 py-0.5 rounded-md border border-slate-900 text-[11px] transition-all cursor-pointer shrink-0 max-w-[160px] truncate ${i === breadcrumbs.length - 1
                            ? 'bg-amber-300 text-slate-900'
                            : 'bg-white hover:bg-amber-100 text-slate-700'
                            }`}
                        >
                          {b.name}
                        </button>
                      </React.Fragment>
                    ))}
                    <button
                      type="button"
                      onClick={handleCopyCurrentPath}
                      className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-md bg-white hover:bg-slate-200 text-[10px] text-slate-700 uppercase border border-slate-900 cursor-pointer shrink-0"
                      title="Copy full directory path"
                    >
                      {copiedPath ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleTreemapBack}
                      className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-md bg-rose-200 hover:bg-rose-300 text-[10px] text-slate-900 uppercase border border-slate-900 cursor-pointer shrink-0"
                    >
                      <CornerUpLeft className="w-3 h-3" />
                      <span>Back</span>
                    </button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-1 flex-wrap text-[10px] font-bold">
                {categoriesData.map(({ category, color }) => {
                  const isActive = highlightCategory === category;
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setHighlightCategory(isActive ? 'all' : category)}
                      className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md border border-slate-900 transition-all cursor-pointer capitalize ${isActive
                        ? 'ring-2 ring-slate-900 scale-105 shadow-comic-sm'
                        : 'bg-white hover:bg-amber-100 text-slate-900'
                        }`}
                      style={{
                        backgroundColor: isActive ? `${color}35` : undefined,
                      }}
                      title={`Click to spotlight ${category} files`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-slate-900 shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span>{category}</span>
                    </button>
                  );
                })}

                {highlightCategory !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setHighlightCategory('all')}
                    className="px-1.5 py-0.5 rounded bg-rose-200 hover:bg-rose-300 text-[9px] text-slate-900 uppercase border border-slate-900 cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Squarified SVG Storage Treemap (Fits cleanly above the fold while expanding on taller viewports) */}
          <div
            ref={treemapContainerRef}
            onClick={() => setContextMenu(null)}
            className="relative flex-1 rounded-xl border-2 border-slate-900 dark:border-white/10 overflow-hidden bg-sky-50 dark:!bg-[#090c12] min-h-[340px] lg:min-h-[395px]"
          >
            {rects.length > 0 ? (
              <svg
                viewBox="0 0 1000 700"
                className="w-full h-full select-none"
                preserveAspectRatio="none"
                role="region"
                aria-label="Interactive Storage Treemap"
              >
                {rects.map((node, idx) => {
                  const cat = (node.category || getCategoryFromNameOrExt(node.name) || 'other') as FileCategory;
                  const fill = getSyncedCellColor(idx, cat);
                  const isHovered = hoveredNode?.id === node.id;
                  const isHugeFile = idx === 0 && node.size > 50 * 1024 * 1024;
                  const isSearchActive = Boolean(spotlightQuery.trim());
                  const isMatch = isSearchActive ? matchesSearch(node, spotlightQuery) : false;
                  const isCategoryMatch = highlightCategory === 'all' || cat === highlightCategory;
                  const isHighlighted = isSearchActive ? isMatch : isCategoryMatch;

                  const openContextForNode = (clientX?: number, clientY?: number) => {
                    const rect = treemapContainerRef.current?.getBoundingClientRect();
                    if (rect && clientX !== undefined && clientY !== undefined) {
                      const xPct = Math.min(68, Math.max(4, ((clientX - rect.left) / rect.width) * 100));
                      const yPct = Math.min(72, Math.max(4, ((clientY - rect.top) / rect.height) * 100));
                      setContextMenu({ node, xPct, yPct });
                    } else {
                      const xPct = Math.min(68, Math.max(4, (node.x + node.w / 2) / 10));
                      const yPct = Math.min(72, Math.max(4, (node.y + node.h / 2) / 7));
                      setContextMenu({ node, xPct, yPct });
                    }
                  };

                  return (
                    <g
                      key={node.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`${node.isDir ? 'Folder' : 'File'} ${node.name}, ${formatBytes(node.size, settings.unit)}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setContextMenu(null);
                        if (node.id === '__smaller_tail__') {
                          setActiveTab('explore');
                          return;
                        }
                        if (node.isDir) {
                          setTreemapCurrentPath(node.path);
                        } else {
                          openContextForNode(e.clientX, e.clientY);
                        }
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (node.id === '__smaller_tail__') return;
                        openContextForNode(e.clientX, e.clientY);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          if (node.id === '__smaller_tail__') {
                            setActiveTab('explore');
                            return;
                          }
                          if (node.isDir) {
                            setTreemapCurrentPath(node.path);
                          } else {
                            openContextForNode();
                          }
                        } else if (e.key === 'Escape') {
                          setContextMenu(null);
                        }
                      }}
                      onMouseEnter={() => setHoveredNode(node)}
                      onMouseLeave={() => setHoveredNode(null)}
                      className="cursor-pointer focus:outline-none"
                    >
                      <rect
                        x={node.x + 2}
                        y={node.y + 2}
                        width={Math.max(0, node.w - 4)}
                        height={Math.max(0, node.h - 4)}
                        rx={8}
                        fill={fill}
                        fillOpacity={isDark ? (isHighlighted ? 0.84 : 0.16) : 1}
                        stroke={isMatch ? '#fbbf24' : isDark ? '#090c12' : '#0f172a'}
                        strokeWidth={isMatch ? (isHovered ? 6 : 4.5) : isHovered ? 4 : isHighlighted ? 2.5 : 1}
                        opacity={isDark ? 1 : isHighlighted ? 1 : 0.18}
                        style={{
                          transition: 'stroke-width 0.15s ease, opacity 0.2s ease, fill-opacity 0.2s ease',
                          filter: isMatch
                            ? 'drop-shadow(0 0 10px rgba(234, 179, 8, 0.9))'
                            : isHovered
                              ? 'brightness(1.1)'
                              : isHighlighted
                                ? 'none'
                                : 'grayscale(0.7)',
                        }}
                      />

                      {!isDark && (
                        <rect
                          x={node.x + 2}
                          y={node.y + 2}
                          width={Math.max(0, node.w - 4)}
                          height={Math.max(0, node.h - 4)}
                          rx={8}
                          fill="url(#comic-dots-pattern)"
                          pointerEvents="none"
                          opacity={isHighlighted ? 0.45 : 0.08}
                        />
                      )}

                      {node.w >= 64 && node.h >= 38 && (
                        <foreignObject
                          x={node.x + 3}
                          y={node.y + 3}
                          width={Math.max(0, node.w - 6)}
                          height={Math.max(0, node.h - 6)}
                          pointerEvents="none"
                          className="overflow-hidden"
                        >
                          {(() => {
                            const showTopCat = node.w > 110 && node.h > 75;
                            const showRightBadge =
                              (isMatch && node.w > 85 && node.h > 48) ||
                              (isHugeFile && node.w > 125 && node.h > 75);
                            const showCenterIcon = node.w > 115 && node.h > 105;
                            const showSizePill = node.w >= 84 && node.h >= 64;

                            return (
                              <div
                                className={`w-full h-full ${node.w > 95 ? 'p-2' : 'p-1'
                                  } flex flex-col justify-between items-center text-center relative select-none`}
                                style={{
                                  opacity: isHighlighted ? 1 : 0.2,
                                  transition: 'opacity 0.2s ease',
                                }}
                              >
                                {(showTopCat || showRightBadge) && (
                                  <div className="w-full flex items-center justify-between pointer-events-none">
                                    {showTopCat ? (
                                      <div className="px-1.5 py-0.5 rounded-md bg-white dark:!bg-[#090d16]/85 border border-slate-900 dark:border-white/20 shadow-[1px_1px_0px_#0f172a] flex items-center space-x-1">
                                        <CategoryIcon category={cat} className="w-2.5 h-2.5 shrink-0" />
                                        <span className="font-bold text-[9px] uppercase text-slate-900 dark:!text-slate-100 leading-none">
                                          {cat}
                                        </span>
                                      </div>
                                    ) : (
                                      <span />
                                    )}

                                    {isMatch && node.w > 85 && node.h > 48 ? (
                                      <div className="px-1.5 py-0.5 rounded-md bg-amber-400 border border-slate-900 shadow-[1px_1px_0px_#0f172a] flex items-center space-x-1 ml-auto">
                                        <Sparkles className="w-2.5 h-2.5 text-slate-900" />
                                        <span className="font-bold text-[9px] uppercase text-slate-900 leading-none">
                                          MATCH
                                        </span>
                                      </div>
                                    ) : isHugeFile && node.w > 125 && node.h > 75 ? (
                                      <div className="px-2 py-0.5 rounded-md bg-amber-400 border border-slate-900 shadow-[1px_1px_0px_#0f172a] flex items-center space-x-1 ml-auto">
                                        <ComicZapIcon className="w-2.5 h-2.5 text-slate-900" />
                                        <span className="font-bold text-[10px] uppercase text-slate-900 leading-none">
                                          Largest
                                        </span>
                                      </div>
                                    ) : null}
                                  </div>
                                )}

                                <div className="flex flex-col items-center justify-center my-auto w-full px-1 min-w-0">
                                  {showCenterIcon && (
                                    <div className="w-7 h-7 rounded-xl bg-white dark:!bg-[#090d16]/85 border-1.5 border-slate-900 dark:border-white/20 shadow-[1.5px_1.5px_0px_#0f172a] flex items-center justify-center mb-1 shrink-0">
                                      <CategoryIcon category={cat} className="w-4 h-4" />
                                    </div>
                                  )}

                                  <p
                                    className={`font-bold ${node.w < 90
                                      ? 'text-[10px] px-1.5 py-0.5'
                                      : 'text-xs sm:text-[13px] px-2.5 py-0.5'
                                      } text-slate-900 dark:!text-slate-100 truncate max-w-[92%] bg-white/95 dark:!bg-[#090d16]/85 rounded-md border border-slate-900 dark:border-white/20 shadow-[1px_1px_0px_#0f172a] leading-tight ${showSizePill ? 'mb-1' : ''}`}
                                  >
                                    {node.name}
                                  </p>

                                  {showSizePill && (
                                    <span className="inline-flex items-center font-mono font-bold text-[10px] text-slate-900 dark:!text-amber-300 px-1.5 py-0.5 rounded-md bg-white dark:!bg-[#090d16]/85 border-1.5 border-slate-900 dark:border-white/20 shadow-[1.5px_1.5px_0px_#0f172a] tabular-nums shrink-0 max-w-[95%] truncate">
                                      {formatBytes(node.size, settings.unit)}
                                    </span>
                                  )}
                                </div>

                                {(showTopCat || showRightBadge) && <div className="min-h-[2px]" />}
                              </div>
                            );
                          })()}
                        </foreignObject>
                      )}
                    </g>
                  );
                })}

                <defs>
                  <pattern id="comic-dots-pattern" width="8" height="8" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="1" fill="#ffffff" fillOpacity="0.09" />
                  </pattern>
                </defs>
              </svg>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-amber-50">
                <p className="font-heading text-lg text-slate-900 uppercase">Empty Folder</p>
                <p className="text-xs text-slate-600 mt-1">No large items inside this location.</p>
                {isDrilledDown && (
                  <button
                    type="button"
                    onClick={handleTreemapBack}
                    className="mt-3 px-4 py-1.5 rounded-xl bg-amber-400 border-2 border-slate-900 text-xs font-bold uppercase text-slate-900 cursor-pointer"
                  >
                    Go Back
                  </button>
                )}
              </div>
            )}

            {hoveredNode && (
              <div
                className="absolute pointer-events-none z-20 px-3 py-2 rounded-xl bg-yellow-100 dark:bg-[#171c28] border-2 border-slate-900 dark:border-white/15 shadow-comic font-bold text-slate-900 dark:text-slate-100 text-xs"
                style={{
                  left: `${Math.min(72, Math.max(8, (hoveredNode.x + hoveredNode.w / 2) / 10))}%`,
                  top: `${Math.min(72, Math.max(8, (hoveredNode.y + hoveredNode.h / 2) / 7))}%`,
                }}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <CategoryIcon
                    category={hoveredNode.category || getCategoryFromNameOrExt(hoveredNode.name) || 'other'}
                    className="w-3.5 h-3.5"
                  />
                  <span className="uppercase">{hoveredNode.name}</span>
                </div>
                <div className="text-[11px] font-mono">
                  {formatBytes(hoveredNode.size, settings.unit)}
                  {scanSummary.total_bytes
                    ? ` (${((hoveredNode.size / scanSummary.total_bytes) * 100).toFixed(1)}%)`
                    : ''}
                </div>
              </div>
            )}

            {contextMenu && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute z-30 w-56 p-2 rounded-xl bg-white border-2.5 border-slate-900 shadow-[5px_5px_0px_#0f172a] space-y-1 text-xs font-bold text-slate-900"
                style={{ left: `${contextMenu.xPct}%`, top: `${contextMenu.yPct}%` }}
                role="menu"
                aria-label={`Actions for ${contextMenu.node.name}`}
              >
                <div className="px-2 py-1 border-b border-slate-200 flex items-center justify-between gap-1">
                  <span className="truncate text-[11px] uppercase">{contextMenu.node.name}</span>
                  <button
                    type="button"
                    aria-label="Close block menu"
                    onClick={() => setContextMenu(null)}
                    className="p-0.5 rounded hover:bg-slate-100 text-slate-500 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {contextMenu.node.isDir && (
                  <button
                    type="button"
                    onClick={() => {
                      setTreemapCurrentPath(contextMenu.node.path);
                      setContextMenu(null);
                    }}
                    className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg hover:bg-amber-100 text-left cursor-pointer"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-amber-700" />
                    <span>Drill Into Folder</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    handleReveal(contextMenu.node.path);
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg hover:bg-sky-100 text-left cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-sky-700" />
                  <span>Reveal in File Explorer</span>
                </button>

                {!getFileIntelligence(contextMenu.node.name, contextMenu.node.path).isSystem && (
                  <button
                    type="button"
                    onClick={() => {
                      setPendingDelete({
                        name: contextMenu.node.name,
                        path: contextMenu.node.path,
                        size_bytes: contextMenu.node.size,
                      });
                      setContextMenu(null);
                    }}
                    className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg hover:bg-rose-100 text-rose-700 text-left cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{settings.prefer_trash ? 'Move to Recycle Bin' : 'Delete Permanently'}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Largest Files + Space Recovery Hub */}
        <div className="col-span-12 lg:col-span-3 flex flex-col space-y-2.5">
          {/* 1. LARGEST FILES CARD */}
          <div className="bg-white rounded-2xl border-2 border-slate-900 p-3 shadow-comic">
            <div className="flex items-center justify-between mb-1.5">
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-lg bg-amber-400 dark:bg-slate-800 border-2 border-slate-900 dark:border-slate-700 shadow-comic-sm font-heading text-xs uppercase text-slate-900 dark:text-amber-300">
                <ComicLargeFilesIcon className="w-3.5 h-3.5" />
                <span>Large Files</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('large-files')}
                className="px-2 py-0.5 rounded-lg border border-slate-300 hover:border-slate-900 bg-slate-50 hover:bg-amber-300 text-[10px] font-bold uppercase text-slate-800 transition-all cursor-pointer"
              >
                View All &gt;
              </button>
            </div>

            <div className="flex items-center space-x-1 mb-1.5">
              {[10, 100, 500, 1024].map((mb, i) => {
                const labels = ['>10MB', '>100MB', '>500MB', '>1GB'];
                const isActive = minThresholdMB === mb;
                return (
                  <button
                    key={mb}
                    type="button"
                    onClick={() => setMinThresholdMB(mb)}
                    className={`flex-1 py-0.5 rounded-md border text-[10px] font-bold uppercase transition-all cursor-pointer ${isActive
                      ? 'bg-amber-400 border-slate-900 text-slate-900 shadow-comic-sm'
                      : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200 hover:border-slate-400'
                      }`}
                  >
                    {labels[i]}
                  </button>
                );
              })}
            </div>

            {largeFilesList.length > 0 ? (
              <div className="space-y-1">
                {largeFilesList.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-1.5 rounded-xl bg-slate-50/80 border border-slate-200 hover:border-slate-400 hover:bg-amber-50/70 transition-all"
                  >
                    <div className="flex items-center space-x-2 truncate mr-2">
                      <div className="w-7 h-7 rounded-lg border border-slate-300 flex items-center justify-center shrink-0 bg-white">
                        <CategoryIcon category={file.category} className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-xs text-slate-900 truncate leading-tight">{file.name}</p>
                        <p className="font-mono text-[10px] text-slate-600 leading-tight mt-0.5">
                          {formatBytes(file.size_bytes, settings.unit)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleReveal(file.path)}
                      aria-label={`Reveal ${file.name} in explorer`}
                      className="p-1 rounded-lg hover:bg-amber-200 text-slate-600 hover:text-slate-900 transition-all shrink-0 cursor-pointer"
                      title="Reveal in native file explorer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-slate-500">
                No files above {minThresholdMB >= 1024 ? '1GB' : `${minThresholdMB}MB`}
              </div>
            )}
          </div>

          {/* 2. UNIFIED SPACE RECOVERY CARD (Duplicates + Cleanup) */}
          <div className="bg-white rounded-2xl border-2 border-slate-900 p-3 shadow-comic space-y-2.5 flex-1">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-400 dark:bg-slate-800 border-2 border-slate-900 dark:border-white/10 shadow-comic-sm font-heading text-xs uppercase text-slate-900 dark:text-emerald-300">
                <ComicShieldIcon className="w-3.5 h-3.5" />
                <span>Space Recovery</span>
              </div>
              <span className="text-[10px] font-bold uppercase text-slate-500">Safe Trash</span>
            </div>

            {/* Duplicate Summary Row */}
            <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-500/[0.06] border border-slate-900/80 dark:border-amber-400/20 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-600 block">
                    Exact Duplicates (BLAKE3)
                  </span>
                  <span className="font-heading text-sm text-slate-900">
                    {duplicateReclaimable > 0
                      ? `${formatBytes(duplicateReclaimable, settings.unit)} Reclaimable`
                      : 'Check for Duplicates'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('duplicates')}
                  className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 border-2 border-slate-900 text-[11px] font-bold uppercase text-slate-900 shadow-comic-sm cursor-pointer shrink-0"
                >
                  Inspect &gt;
                </button>
              </div>

              {duplicateAlerts.length > 0 && (
                <div className="space-y-1 pt-1 border-t border-slate-900/15">
                  {duplicateAlerts.map((grp, idx) => {
                    const isChecked = selectedCleanupIds.has(grp.files[1]?.id || '');
                    return (
                      <div
                        key={grp.hash || idx}
                        onClick={() => grp.files[1] && toggleCleanupSelection(grp.files[1].id)}
                        className="flex items-center justify-between px-2 py-1 rounded-lg bg-white/90 border border-slate-300 hover:border-slate-500 cursor-pointer text-[11px]"
                      >
                        <span className="truncate font-bold text-slate-900 mr-2">
                          {grp.files[0]?.name || 'Duplicate'} ({formatBytes(grp.reclaimable_bytes, settings.unit)})
                        </span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => { }}
                          aria-label={`Select duplicate ${grp.files[0]?.name || ''}`}
                          className="w-3.5 h-3.5 cursor-pointer shrink-0"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Safe Cleanup Summary Row */}
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/[0.07] border border-rose-300 dark:border-rose-400/25 flex items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-600 block">
                  Junk &amp; Temp ({scanSummary.cleanup_candidates.length})
                </span>
                <span className="font-heading text-sm text-slate-900">
                  {formatBytes(cleanupReclaimable, settings.unit)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('cleanup')}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-white border-2 border-slate-900 text-[11px] font-bold uppercase shadow-comic-sm cursor-pointer shrink-0"
              >
                <span>Clean Now</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Storage Diff Time Machine Modal */}
      {showTimeMachine && (
        <StorageDiffModal
          isOpen={showTimeMachine}
          onClose={() => setShowTimeMachine(false)}
          scanSummary={scanSummary}
          unit={settings.unit}
        />
      )}

      {/* Direct Treemap Cleanup Confirmation Modal */}
      <ConfirmCleanupModal
        isOpen={Boolean(pendingDelete)}
        targets={pendingDelete ? [pendingDelete] : []}
        preferTrash={settings.prefer_trash}
        unit={settings.unit}
        isExecuting={isDeleting}
        onConfirm={handleConfirmTreemapDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
};
