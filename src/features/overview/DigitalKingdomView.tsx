import React, { useState, useMemo } from 'react';
import {
  ExternalLink,
  ArrowRight,
} from 'lucide-react';
import {
  ComicKingdomIcon,
  ComicDrivesIcon,
  ComicLargeFilesIcon,
  ComicDuplicatesIcon,
  ComicZapIcon,
  ComicPieChartIcon,
  ComicVideoIcon,
  ComicAppIcon,
  ComicDocIcon,
  ComicImageIcon,
  ComicArchiveIcon,
  ComicTrashIcon,
  ComicShieldIcon,
} from '@/components/icons/ComicIcons';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { useAppStore } from '@/lib/store';
import { formatBytes, formatNumber, getCategoryColor, getCategoryEmoji } from '@/lib/utils';
import { ScoutMascot, ScoutAvatar } from '@/components/ScoutMascot';
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

  const result: RectNode[] = [];

  function layoutSlice(
    slice: TreemapItem[],
    curX: number,
    curY: number,
    curW: number,
    curH: number
  ) {
    if (slice.length === 0) return;
    if (slice.length === 1) {
      result.push({
        ...slice[0],
        x: curX,
        y: curY,
        w: curW,
        h: curH,
      });
      return;
    }

    const isHorizontal = curW >= curH;
    let halfSum = 0;
    const sliceTotal = slice.reduce((acc, it) => acc + it.size, 0);
    let splitIdx = 0;

    for (let i = 0; i < slice.length; i++) {
      halfSum += slice[i].size;
      if (halfSum >= sliceTotal / 2) {
        splitIdx = i + 1;
        break;
      }
    }

    if (splitIdx === 0) splitIdx = 1;
    if (splitIdx >= slice.length) splitIdx = slice.length - 1;

    const groupA = slice.slice(0, splitIdx);
    const groupB = slice.slice(splitIdx);
    const ratioA = groupA.reduce((acc, it) => acc + it.size, 0) / sliceTotal;

    if (isHorizontal) {
      const widthA = curW * ratioA;
      layoutSlice(groupA, curX, curY, widthA, curH);
      layoutSlice(groupB, curX + widthA, curY, curW - widthA, curH);
    } else {
      const heightA = curH * ratioA;
      layoutSlice(groupA, curX, curY, curW, heightA);
      layoutSlice(groupB, curX, curY + heightA, curW, curH - heightA);
    }
  }

  const sorted = [...items].sort((a, b) => b.size - a.size);
  layoutSlice(sorted, x, y, width, height);
  return result;
}

function getCategoryFromNameOrExt(name: string, category?: string): string {
  if (category) return category.toLowerCase();
  const n = name.toLowerCase();
  if (n.includes('dev') || n.includes('project') || n.includes('code') || n.includes('src') || n.includes('git')) return 'dev';
  if (n.includes('media') || n.includes('video') || n.includes('movie') || n.includes('stream') || n.includes('cricket') || n.includes('record')) return 'video';
  if (n.includes('doc') || n.includes('paper') || n.includes('note') || n.includes('text') || n.includes('pdf')) return 'document';
  if (n.includes('download')) return 'download';
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

export interface DigitalKingdomViewProps {
  onOpenScanModal?: () => void;
}

export const DigitalKingdomView: React.FC<DigitalKingdomViewProps> = ({
  onOpenScanModal,
}) => {
  const {
    drives,
    selectedDrive,
    scanSummary,
    scanProgress,
    settings,
    setActiveTab,
    treemapCurrentPath,
    setTreemapCurrentPath,
    selectedCleanupIds,
    toggleCleanupSelection,
  } = useAppStore();

  const [minThresholdMB, setMinThresholdMB] = useState<number>(10);
  const [hoveredNode, setHoveredNode] = useState<RectNode | null>(null);

  // Active drive calculations - STRICTLY REAL DATA
  const activeDrive = selectedDrive || (drives.length > 0 ? drives[0] : null);
  const totalDriveBytes = activeDrive?.total_bytes || 0;
  const usedDriveBytes = activeDrive?.used_bytes || (scanSummary ? scanSummary.total_bytes : 0);
  const usedPercent = totalDriveBytes > 0 ? Math.min(100, Math.round((usedDriveBytes / totalDriveBytes) * 100)) : 0;

  // Real Duplicates total
  const duplicateReclaimable = scanSummary?.duplicate_groups.reduce(
    (acc, g) => acc + g.reclaimable_bytes,
    0
  ) || 0;

  // Real Category distribution for donut chart - SINGLE SOURCE OF TRUTH
  const categoriesData = useMemo(() => {
    if (scanSummary && scanSummary.categories.length > 0) {
      return scanSummary.categories.slice(0, 7).map((c) => ({
        name: c.category.toUpperCase(),
        value: c.total_bytes,
        percentage: c.percentage,
        color: getCategoryColor(c.category),
        emoji: getCategoryEmoji(c.category),
      }));
    }
    return [];
  }, [scanSummary]);

  // Real Top Extensions list - Matching category colors
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

  // Real Treemap Current Path and Items
  const currentPath = treemapCurrentPath || scanSummary?.root_path || 'Home';

  const treemapItems = useMemo<TreemapItem[]>(() => {
    if (!scanSummary) return [];

    const items: TreemapItem[] = [];
    const normCurrent = (treemapCurrentPath || scanSummary.root_path || '').toLowerCase().replace(/\\+$/, '').replace(/\/+$/, '');

    // Direct children folders
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

    // Direct files in current path
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

    // Fallback for drilldown path if no direct child
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

    // Fallback if at root path and no direct child parsed
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

    return items;
  }, [scanSummary, treemapCurrentPath]);

  // Compute squarified layout
  const rects = useMemo(() => {
    return squarify(treemapItems, 0, 0, 1000, 700);
  }, [treemapItems]);

  // Real Large Files List
  const largeFilesList = useMemo(() => {
    if (!scanSummary || scanSummary.largest_files.length === 0) return [];
    return scanSummary.largest_files
      .filter((f) => f.size_bytes >= minThresholdMB * 1024 * 1024)
      .slice(0, 5);
  }, [scanSummary, minThresholdMB]);

  // Real Duplicate candidates
  const duplicateAlerts = useMemo(() => {
    if (!scanSummary || scanSummary.duplicate_groups.length === 0) return [];
    return scanSummary.duplicate_groups.slice(0, 2);
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
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(scanSummary, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `bytemap-report-${Date.now()}.json`;
    a.click();
  };

  // Speed calculation from real telemetry
  const scanSpeed = useMemo(() => {
    if (scanProgress.status === 'scanning' && scanProgress.elapsed_ms > 0) {
      return Math.round((scanProgress.scanned_files / scanProgress.elapsed_ms) * 1000);
    }
    if (scanSummary && scanSummary.scan_duration_ms > 0) {
      return Math.round((scanSummary.total_files / scanSummary.scan_duration_ms) * 1000);
    }
    return 0;
  }, [scanProgress, scanSummary]);

  return (
    <div className="flex flex-col min-h-full space-y-3.5 pb-6 select-none font-sans text-slate-900">
      {/* 3-Column Comic Pop-Art Dashboard Layout */}
      <div className="grid grid-cols-12 gap-3.5 w-full">
        {/* =========================================
            LEFT COLUMN (Drives, Scout, File Types, Extensions)
           ========================================= */}
        <div className="col-span-12 lg:col-span-3 flex flex-col space-y-3">
          {/* 1. DRIVE OVERVIEW CARD */}
          <div className="bg-white rounded-2xl border-2.5 border-slate-900 p-3.5 shadow-comic relative flex flex-col justify-between comic-card-hover overflow-hidden">
            {/* Subtle crosshatch texture */}
            <div className="absolute inset-0 bg-comic-crosshatch pointer-events-none rounded-2xl" />

            {/* Yellow Header Pill */}
            <div className="relative inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-amber-400 border-2 border-slate-900 shadow-comic-sm font-comic text-xs uppercase tracking-wide text-slate-900 w-fit mb-2">
              <ComicDrivesIcon className="w-4 h-4" />
              <span>Drive Overview</span>
            </div>

            {/* Drive Name & Real Capacity */}
            <div className="relative flex items-baseline justify-between mt-0.5">
              <span className="font-comic text-lg text-slate-900 uppercase tracking-wide">
                {activeDrive ? activeDrive.name : (drives.length > 0 ? drives[0].name : 'C: DRIVE')}
              </span>
              <span className="font-fredoka font-bold text-sm text-slate-700">
                {totalDriveBytes > 0
                  ? `${formatBytes(usedDriveBytes, settings.unit)} / ${formatBytes(totalDriveBytes, settings.unit)}`
                  : 'No Drive Mounted'}
              </span>
            </div>

            {/* Comic Progress Bar with candy stripe when near full */}
            <div className="relative w-full h-4 rounded-full bg-slate-200 border-2 border-slate-900 overflow-hidden my-2">
              <div
                className={`h-full rounded-full border-r-2 border-slate-900 transition-all duration-700 ${
                  usedPercent > 90
                    ? 'bg-gradient-to-r from-rose-400 to-rose-500 comic-progress-stripe'
                    : usedPercent > 75
                    ? 'bg-gradient-to-r from-amber-300 to-amber-500'
                    : 'bg-gradient-to-r from-emerald-300 to-emerald-500'
                }`}
                style={{ width: `${Math.max(usedPercent > 0 ? 5 : 0, usedPercent)}%` }}
              />
              {/* Percent label inside bar */}
              {usedPercent > 15 && (
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-comic font-bold text-slate-900/80">
                  {usedPercent}%
                </span>
              )}
            </div>

            {/* Scanning Speed / Telemetry */}
            <p className="relative text-[10px] font-fredoka font-bold text-slate-600">
              Files Scanned: {scanProgress.scanned_files > 0 ? formatNumber(scanProgress.scanned_files) : (scanSummary ? formatNumber(scanSummary.total_files) : '0')} | Speed: {scanSpeed > 0 ? `${formatNumber(scanSpeed)} files/sec` : 'Idle'}
            </p>

            {/* Scout Mascot with Magnifying Glass */}
            <div className="relative mt-2.5">
              <ScoutMascot
                className="w-16 h-16"
                isScanning={scanProgress.status === 'scanning'}
                statusText={
                  scanProgress.status === 'scanning'
                    ? `Scanning ${formatNumber(scanProgress.scanned_files)} files...`
                    : scanSummary
                    ? `Scouted ${formatNumber(scanSummary.total_files)} files • Ready`
                    : 'Scout Ready • Click ANALYZE to scout'
                }
              />
            </div>
          </div>

          {/* 2. FILE TYPE BREAKDOWN CARD */}
          <div className="bg-white rounded-2xl border-2.5 border-slate-900 p-3.5 shadow-comic flex-1 flex flex-col justify-between comic-card-hover overflow-hidden relative">
            <div className="absolute inset-0 bg-comic-dots opacity-[0.06] pointer-events-none rounded-2xl" />

            {/* Yellow Header Pill & Navigation */}
            <div className="relative flex items-center justify-between mb-1">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-amber-400 border-2 border-slate-900 shadow-comic-sm font-comic text-xs uppercase tracking-wide text-slate-900 w-fit">
                <ComicPieChartIcon className="w-4 h-4" />
                <span>File Type Breakdown</span>
              </div>
              <button
                onClick={() => setActiveTab('file-types')}
                className="px-2 py-0.5 rounded-lg border border-slate-900 bg-slate-50 hover:bg-amber-300 font-comic text-[10px] uppercase text-slate-800 transition-all shadow-comic-sm hover:-translate-y-0.5 hover:shadow-comic"
                title="Open full category analytics"
              >
                Analytics &gt;
              </button>
            </div>

            {categoriesData.length > 0 ? (
              <>
                {/* Recharts Donut with Center Hole Info */}
                <div className="relative h-36 w-full my-1 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoriesData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={34}
                        outerRadius={58}
                        stroke="#0f172a"
                        strokeWidth={2.5}
                        paddingAngle={3}
                      >
                        {categoriesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: number, name: string) => [
                          `${formatBytes(val, settings.unit)} (${
                            categoriesData.find((c) => c.name === name)?.percentage.toFixed(1) || '0'
                          }%)`,
                          name,
                        ]}
                        contentStyle={{
                          backgroundColor: '#fef08a',
                          borderColor: '#0f172a',
                          borderWidth: '2.5px',
                          borderRadius: '12px',
                          color: '#0f172a',
                          fontWeight: 'bold',
                          fontSize: '11px',
                          boxShadow: '3px 3px 0px #0f172a',
                          fontFamily: "'Fredoka', sans-serif",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center hole comic summary badge */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[11px] font-comic uppercase text-slate-900 leading-none">
                      {formatNumber(scanSummary?.total_files || 0)}
                    </span>
                    <span className="text-[8px] font-fredoka font-bold text-slate-500 uppercase leading-none mt-0.5">
                      Files
                    </span>
                  </div>
                </div>

                {/* Category Labels Grid with Matching Badges & Emojis */}
                <div className="relative grid grid-cols-2 gap-1.5 text-[11px] font-fredoka font-bold">
                  {categoriesData.slice(0, 6).map((c) => (
                    <div
                      key={c.name}
                      className="flex items-center space-x-1.5 p-1 rounded-lg border-1.5 border-slate-900 bg-slate-50 hover:bg-amber-100 transition-colors shadow-comic-sm truncate group cursor-default"
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-md border border-slate-900 shrink-0 group-hover:scale-110 transition-transform shadow-[1px_1px_0px_#0f172a]"
                        style={{ backgroundColor: c.color }}
                      />
                      <span className="text-xs shrink-0">{c.emoji}</span>
                      <span className="truncate text-slate-800 capitalize group-hover:text-slate-900">
                        {c.name.toLowerCase()}
                      </span>
                      <span className="text-[10px] font-comic text-slate-700 ml-auto shrink-0">
                        {c.percentage.toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-28 sm:h-32 flex flex-col items-center justify-center text-center p-2 text-slate-500">
                <span className="text-2xl mb-1 animate-comic-float">📊</span>
                <p className="font-fredoka font-bold text-xs text-slate-700">No categories scanned yet</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Click Analyze to categorize storage</p>
              </div>
            )}
          </div>

          {/* 3. TOP EXTENSIONS BADGE CARD */}
          <div className="bg-white rounded-2xl border-2.5 border-slate-900 p-3 shadow-comic comic-card-hover">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-lg bg-amber-400 border-2 border-slate-900 shadow-comic-sm font-comic text-[11px] uppercase tracking-wide text-slate-900 mb-2">
              <ComicZapIcon className="w-3.5 h-3.5" />
              <span>Top Extensions</span>
            </div>

            {topExtensions.length > 0 ? (
              <div className="space-y-2 text-xs font-fredoka font-bold">
                {topExtensions.map((item, idx) => (
                  <div key={item.ext} className="flex items-center justify-between group">
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-500 w-3 font-comic">{idx + 1}.</span>
                      <span className="font-mono text-slate-800 group-hover:text-slate-900 transition-colors">{item.ext}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-14 h-2.5 rounded-full border-2 border-slate-900 overflow-hidden bg-slate-200">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ backgroundColor: item.color, width: `${Math.min(100, item.percent * 3)}%` }}
                        />
                      </div>
                      <span className="text-slate-700 w-7 text-right">
                        {item.percent}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] font-fredoka text-slate-500 py-1">
                Run a scan to list top file extensions
              </p>
            )}
          </div>
        </div>

        {/* =========================================
            CENTER COLUMN (Your Digital Kingdom - Treemap)
           ========================================= */}
        <div className="col-span-12 lg:col-span-6 flex flex-col bg-white rounded-2xl border-2.5 border-slate-900 shadow-comic overflow-hidden p-4 relative">
          {/* Subtle background texture */}
          <div className="absolute inset-0 bg-comic-crosshatch pointer-events-none rounded-2xl" />

          {/* Treemap Top Bar with Title & Breadcrumbs */}
          <div className="relative flex items-start justify-between pb-3 border-b-2 border-slate-900 mb-3">
            <div>
              <div className="flex items-center space-x-2">
                {/* Yellow Badge */}
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-amber-400 border-2 border-slate-900 shadow-comic-sm font-comic text-xs uppercase tracking-wide text-slate-900">
                  <ComicKingdomIcon className="w-4 h-4" />
                  <span>Interactive Map</span>
                </div>
                <div className="flex items-center space-x-1.5 text-xs font-fredoka font-bold text-slate-500">
                  <button
                    onClick={() => setTreemapCurrentPath('')}
                    className="hover:text-amber-600 hover:underline uppercase transition-colors"
                  >
                    Home
                  </button>
                  {treemapCurrentPath && (
                    <>
                      <span>&gt;</span>
                      <span className="text-slate-800">
                        {currentPath.length > 25 ? '...' + currentPath.slice(-25) : currentPath}
                      </span>
                      <button
                        onClick={() => setTreemapCurrentPath('')}
                        className="ml-1 px-1.5 py-0.5 rounded bg-slate-200 hover:bg-rose-200 text-[10px] text-slate-700 font-comic uppercase border border-slate-900 transition-colors hover:-translate-y-0.5"
                        title="Back to Kingdom Root"
                      >
                        Back
                      </button>
                    </>
                  )}
                </div>
              </div>
              <h2 className="font-comic text-xl text-slate-900 uppercase tracking-wider mt-1 drop-shadow-sm">
                YOUR DIGITAL KINGDOM
              </h2>
              {/* Visual Comic Category Legend Banner */}
              <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-fredoka font-bold mt-1">
                <span className="text-slate-500 font-comic uppercase">Map Legend:</span>
                <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-md bg-blue-100 border border-slate-900 text-blue-900 shadow-[1px_1px_0px_#0f172a]">
                  <ComicVideoIcon className="w-3.5 h-3.5" />
                  <span>Video</span>
                </span>
                <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-md bg-red-100 border border-slate-900 text-red-900 shadow-[1px_1px_0px_#0f172a]">
                  <ComicAppIcon className="w-3.5 h-3.5" />
                  <span>Apps</span>
                </span>
                <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-md bg-pink-100 border border-slate-900 text-pink-900 shadow-[1px_1px_0px_#0f172a]">
                  <ComicImageIcon className="w-3.5 h-3.5" />
                  <span>Images</span>
                </span>
                <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-md bg-emerald-100 border border-slate-900 text-emerald-900 shadow-[1px_1px_0px_#0f172a]">
                  <ComicDocIcon className="w-3.5 h-3.5" />
                  <span>Docs</span>
                </span>
                <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-md bg-amber-100 border border-slate-900 text-amber-900 shadow-[1px_1px_0px_#0f172a]">
                  <ComicArchiveIcon className="w-3.5 h-3.5" />
                  <span>Archives</span>
                </span>
                <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-md bg-slate-100 border border-slate-900 text-slate-800 shadow-[1px_1px_0px_#0f172a]">
                  <ComicLargeFilesIcon className="w-3.5 h-3.5" />
                  <span>Other</span>
                </span>
              </div>
            </div>

            {/* Size & Filter Action Pills */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setMinThresholdMB(minThresholdMB === 10 ? 100 : 10)}
                className="px-2.5 py-1 rounded-lg bg-white border-2 border-slate-900 shadow-comic-sm font-comic text-[11px] uppercase hover:bg-amber-100 hover:-translate-y-0.5 hover:shadow-comic transition-all"
              >
                Size
              </button>
              <button
                onClick={() => setActiveTab('explore')}
                className="px-2.5 py-1 rounded-lg bg-white border-2 border-slate-900 shadow-comic-sm font-comic text-[11px] uppercase hover:bg-amber-100 hover:-translate-y-0.5 hover:shadow-comic transition-all"
              >
                Filter
              </button>
            </div>
          </div>

          {/* Squarified SVG Comic Treemap */}
          <div className="relative flex-1 rounded-xl border-2 border-slate-900 overflow-hidden bg-sky-50 min-h-[250px] sm:min-h-[300px] md:min-h-[340px]">
            {rects.length > 0 ? (
              <svg
                viewBox="0 0 1000 700"
                className="w-full h-full select-none"
                preserveAspectRatio="none"
              >
                {rects.map((node, idx) => {
                  const cat = (node.category || getCategoryFromNameOrExt(node.name) || 'other') as FileCategory;
                  const fill = getCategoryColor(cat);
                  const catEmoji = getCategoryEmoji(cat);
                  const isHovered = hoveredNode?.id === node.id;
                  const isHugeFile = idx === 0 && node.size > 50 * 1024 * 1024; // Only badge the largest genuine file

                  return (
                    <g
                      key={node.id}
                      onClick={() => {
                        if (node.isDir) {
                          setTreemapCurrentPath(node.path);
                        }
                      }}
                      onMouseEnter={() => setHoveredNode(node)}
                      onMouseLeave={() => setHoveredNode(null)}
                      className="cursor-pointer"
                    >
                      {/* Treemap Cell with thick comic borders */}
                      <rect
                        x={node.x + 2}
                        y={node.y + 2}
                        width={Math.max(0, node.w - 4)}
                        height={Math.max(0, node.h - 4)}
                        rx={8}
                        fill={fill}
                        stroke="#0f172a"
                        strokeWidth={isHovered ? 4 : 2.5}
                        style={{
                          transition: 'stroke-width 0.15s ease, transform 0.15s ease',
                          filter: isHovered ? 'brightness(1.1)' : 'none',
                        }}
                      />

                      {/* Halftone / Comic dots texture on block */}
                      <rect
                        x={node.x + 2}
                        y={node.y + 2}
                        width={Math.max(0, node.w - 4)}
                        height={Math.max(0, node.h - 4)}
                        rx={8}
                        fill="url(#comic-dots-pattern)"
                        pointerEvents="none"
                      />

                      {/* Glossy highlight on top of block */}
                      {node.h > 30 && (
                        <rect
                          x={node.x + 4}
                          y={node.y + 4}
                          width={Math.max(0, node.w - 8)}
                          height={Math.max(0, Math.min(node.h * 0.3, 20))}
                          rx={6}
                          fill="url(#comic-gloss-gradient)"
                          pointerEvents="none"
                        />
                      )}

                      {/* Category Pill Tag at top of cell */}
                      {node.w > 75 && node.h > 55 && (
                        <g pointerEvents="none">
                          <rect
                            x={node.x + 8}
                            y={node.y + 8}
                            width={Math.min(node.w - 16, 80)}
                            height={18}
                            rx={5}
                            fill="#ffffff"
                            stroke="#0f172a"
                            strokeWidth={1.5}
                            filter="drop-shadow(1px 1px 0px #0f172a)"
                          />
                          <text
                            x={node.x + 12}
                            y={node.y + 21}
                            fontFamily="'Fredoka', sans-serif"
                            fontWeight="800"
                            fontSize={9}
                            fill="#0f172a"
                            className="uppercase"
                          >
                            {catEmoji} {cat.toUpperCase()}
                          </text>
                        </g>
                      )}

                      {/* Folder / Document Icon and Label */}
                      {node.w > 65 && node.h > 45 && (
                        <g pointerEvents="none">
                          {/* Folder/file icon emoji */}
                          <text
                            x={node.x + node.w / 2}
                            y={node.y + node.h / 2 - (isHugeFile ? 10 : 4)}
                            textAnchor="middle"
                            fontSize={node.w > 120 ? 18 : 14}
                            dominantBaseline="middle"
                          >
                            {catEmoji}
                          </text>
                          {/* Label */}
                          <text
                            x={node.x + node.w / 2}
                            y={node.y + node.h / 2 + (isHugeFile ? 6 : 16)}
                            textAnchor="middle"
                            fontFamily="'Fredoka', sans-serif"
                            fontWeight="800"
                            fontSize={node.w < 100 ? 11 : 14}
                            fill="#0f172a"
                            className="uppercase"
                            style={{ textShadow: '1px 1px 0px #ffffff' }}
                          >
                            {node.name.length > Math.floor(node.w / 9)
                              ? node.name.slice(0, Math.floor(node.w / 9)) + '…'
                              : node.name}
                          </text>
                          {/* Size label */}
                          {node.w > 90 && node.h > 70 && (
                            <text
                              x={node.x + node.w / 2}
                              y={node.y + node.h / 2 + (isHugeFile ? 20 : 32)}
                              textAnchor="middle"
                              fontFamily="'Fredoka', sans-serif"
                              fontWeight="600"
                              fontSize={10}
                              fill="#0f172a"
                              opacity={0.8}
                            >
                              {formatBytes(node.size, settings.unit)}
                            </text>
                          )}
                        </g>
                      )}

                      {/* "HUGE STORAGE!" Tilted Yellow Comic Burst Badge */}
                      {isHugeFile && node.w > 130 && node.h > 90 && (
                        <g
                          pointerEvents="none"
                          transform={`translate(${node.x + node.w / 2 - 55}, ${node.y + node.h / 2 + 22}) rotate(-4)`}
                        >
                          <rect
                            x="0"
                            y="0"
                            width="110"
                            height="26"
                            rx="6"
                            fill="#facc15"
                            stroke="#0f172a"
                            strokeWidth="2"
                            filter="drop-shadow(2px 2px 0px #0f172a)"
                          />
                          <text
                            x="55"
                            y="17"
                            textAnchor="middle"
                            fontFamily="'Luckiest Guy', cursive"
                            fontSize="12"
                            fill="#0f172a"
                            letterSpacing="0.5"
                          >
                            ⚡ HUGE STORAGE!
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}

                <defs>
                  <pattern id="comic-dots-pattern" width="8" height="8" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="1" fill="#ffffff" fillOpacity="0.25" />
                  </pattern>
                  <linearGradient id="comic-gloss-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            ) : (
              /* Genuine Adventure Empty State with Scout Mascot */
              <div className="flex flex-col items-center justify-center h-full p-4 sm:p-6 text-center bg-amber-50 bg-comic-dots">
                {/* Yellow Block with Scout Scanner Guy */}
                <div className="w-20 h-20 rounded-2xl bg-amber-300 border-2.5 border-slate-900 shadow-comic flex items-center justify-center mb-3 p-1.5 overflow-hidden relative">
                  <ScoutAvatar
                    className="w-full h-full"
                    isScanning={scanProgress.status === 'scanning'}
                  />
                  {scanProgress.status === 'scanning' && (
                    <div className="absolute inset-0 border-2 border-emerald-400 rounded-2xl animate-pulse pointer-events-none" />
                  )}
                </div>

                <h3 className="font-comic text-lg sm:text-xl text-slate-900 uppercase tracking-wide">
                  {scanProgress.status === 'scanning'
                    ? 'Scouting In Progress!'
                    : 'Uncharted Digital Kingdom!'}
                </h3>

                <p className="font-fredoka text-xs text-slate-600 max-w-sm mt-1 mb-3 font-semibold">
                  {scanProgress.status === 'scanning'
                    ? `Scout is actively analyzing files: ${formatNumber(scanProgress.scanned_files)} scanned (${formatBytes(scanProgress.scanned_bytes, settings.unit)})`
                    : 'Select a drive or directory and click the ANALYZE button at the top to scout your storage and reveal the interactive map.'}
                </p>

                {scanProgress.status === 'scanning' ? (
                  <div className="w-64 max-w-full space-y-1.5">
                    <div className="w-full h-4 rounded-full bg-slate-200 border-2 border-slate-900 overflow-hidden relative">
                      <div className="h-full bg-gradient-to-r from-amber-400 via-emerald-400 to-cyan-400 w-full comic-progress-stripe" />
                    </div>
                    <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-emerald-400 border-2 border-slate-900 shadow-comic-sm font-comic text-[11px] uppercase text-slate-900">
                      <span className="animate-spin">🧭</span>
                      <span>Scouting Files...</span>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => (onOpenScanModal ? onOpenScanModal() : setActiveTab('drives'))}
                    className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 border-2 border-slate-900 shadow-comic hover:shadow-comic-glow-amber font-comic text-xs uppercase text-slate-900 transition-all hover:-translate-y-0.5 cursor-pointer"
                  >
                    <span>🗺️ Ready to Scout • Click to Scan</span>
                  </button>
                )}
              </div>
            )}

            {/* Hover Tooltip Overlay — Speech bubble style */}
            {hoveredNode && (
              <div
                className="absolute pointer-events-none z-20 px-3.5 py-2.5 rounded-xl bg-yellow-100 border-2.5 border-slate-900 shadow-comic font-fredoka font-bold text-slate-900 text-xs animate-comic-pop"
                style={{
                  left: `${Math.min(75, Math.max(10, (hoveredNode.x + hoveredNode.w / 2) / 10))}%`,
                  top: `${Math.min(75, Math.max(10, (hoveredNode.y + hoveredNode.h / 2) / 7))}%`,
                }}
              >
                <div className="flex items-center space-x-1.5 mb-1">
                  <span className="text-sm">
                    {getCategoryEmoji(hoveredNode.category || getCategoryFromNameOrExt(hoveredNode.name) || 'other')}
                  </span>
                  <p className="font-comic uppercase tracking-wider text-sm leading-tight">
                    {hoveredNode.name}
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-[11px] text-slate-800">
                  <span
                    className="w-2.5 h-2.5 rounded-sm border border-slate-900 shrink-0"
                    style={{
                      backgroundColor: getCategoryColor(
                        hoveredNode.category || getCategoryFromNameOrExt(hoveredNode.name) || 'other'
                      ),
                    }}
                  />
                  <span>
                    Size: <strong>{formatBytes(hoveredNode.size, settings.unit)}</strong>
                    {scanSummary?.total_bytes
                      ? ` (${((hoveredNode.size / scanSummary.total_bytes) * 100).toFixed(1)}%)`
                      : ''}
                  </span>
                </div>
                <p className="text-[10px] text-slate-600 mt-1 font-fredoka">
                  {hoveredNode.isDir ? '📂 Click to open folder contents' : `Type: ${(hoveredNode.category || 'File').toUpperCase()}`}
                </p>
                {/* Speech bubble tail */}
                <div className="absolute -bottom-[10px] left-6 w-0 h-0 border-l-[8px] border-l-transparent border-r-[4px] border-r-transparent border-t-[12px] border-t-slate-900" />
                <div className="absolute -bottom-[8px] left-[25px] w-0 h-0 border-l-[7px] border-l-transparent border-r-[3px] border-r-transparent border-t-[10px] border-t-yellow-100" />
              </div>
            )}
          </div>
        </div>

        {/* =========================================
            RIGHT COLUMN (Large Files & Duplicate Alerts)
           ========================================= */}
        <div className="col-span-12 lg:col-span-3 flex flex-col space-y-2.5">
          {/* 1. LARGE FILES FOUND CARD */}
          <div className="bg-white rounded-2xl border-2.5 border-slate-900 p-3 shadow-comic flex-1 flex flex-col justify-between comic-card-hover overflow-hidden relative">
            <div className="absolute inset-0 bg-comic-stripes pointer-events-none rounded-2xl" />

            <div className="relative">
              {/* Header */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-lg bg-amber-400 border-2 border-slate-900 shadow-comic-sm font-comic text-xs uppercase tracking-wide text-slate-900">
                  <ComicLargeFilesIcon className="w-4 h-4" />
                  <span>Large Files Found</span>
                </div>
              </div>

              {/* Threshold Filters Pills */}
              <div className="flex items-center space-x-1 my-1.5">
                {[10, 100, 500, 1024].map((mb, i) => {
                  const labels = ['>10MB', '>100MB', '>500MB', '>1GB'];
                  const isActive = minThresholdMB === mb;
                  return (
                    <button
                      key={mb}
                      onClick={() => setMinThresholdMB(mb)}
                      className={`flex-1 py-0.5 rounded-md border-2 border-slate-900 font-comic text-[10px] uppercase transition-all ${
                        isActive
                          ? 'bg-amber-400 text-slate-900 shadow-comic-sm font-bold -translate-y-0.5'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:-translate-y-0.5'
                      }`}
                    >
                      {labels[i]}
                    </button>
                  );
                })}
              </div>

              {/* Real Files List */}
              {largeFilesList.length > 0 ? (
                <div className="space-y-1.5 mt-1.5 max-h-48 overflow-y-auto">
                  {largeFilesList.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-1.5 rounded-xl bg-slate-50 border-2 border-slate-900 hover:bg-amber-50 hover:-translate-y-0.5 hover:shadow-comic-sm transition-all"
                    >
                      <div className="flex items-center space-x-2 truncate mr-2">
                        <div
                          className="w-6 h-6 rounded-lg border-2 border-slate-900 flex items-center justify-center shrink-0 shadow-comic-sm"
                          style={{ backgroundColor: getCategoryColor(file.category) }}
                        >
                          <span className="text-xs">{getCategoryEmoji(file.category)}</span>
                        </div>
                        <div className="truncate">
                          <p className="font-fredoka font-bold text-xs text-slate-900 truncate">
                            {file.name}
                          </p>
                          <p className="font-comic text-[10px] text-slate-700">
                            {formatBytes(file.size_bytes, settings.unit)}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleReveal(file.path)}
                        className="p-1.5 rounded-lg hover:bg-amber-200 text-slate-700 transition-all shrink-0 border border-transparent hover:border-slate-900"
                        title="Reveal in native file explorer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center text-slate-500 font-fredoka text-xs">
                  <span className="text-xl block mb-1 animate-comic-float">📂</span>
                  <p className="font-bold text-slate-700">No large files found</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Scan your drive to list top disk consumers</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setActiveTab('large-files')}
              className="relative mt-2 w-full py-1.5 rounded-xl bg-slate-100 border-2 border-slate-900 font-comic text-xs uppercase tracking-wide hover:bg-amber-300 hover:-translate-y-0.5 hover:shadow-comic transition-all flex items-center justify-center space-x-1"
            >
              <span>View All Large Files</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* 2. DUPLICATE ALERTS CARD */}
          <div className="bg-white rounded-2xl border-2.5 border-slate-900 p-3 shadow-comic flex-1 flex flex-col justify-between comic-card-hover overflow-hidden relative">
            <div className="absolute inset-0 bg-comic-dots opacity-[0.05] pointer-events-none rounded-2xl" />

            <div className="relative">
              {/* Header */}
              <div className="flex items-center space-x-1.5 mb-1.5">
                <div className="w-7 h-7 rounded-lg bg-red-400 border-2 border-slate-900 flex items-center justify-center shadow-comic-sm comic-hover-wiggle">
                  <ComicTrashIcon className="w-4 h-4" />
                </div>
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-lg bg-amber-400 border-2 border-slate-900 shadow-comic-sm font-comic text-xs uppercase tracking-wide text-slate-900">
                  <ComicDuplicatesIcon className="w-4 h-4" />
                  <span>Duplicate Alerts</span>
                </div>
              </div>

              {/* Real Reclaimable Banner */}
              <div className="flex items-center space-x-2 p-2 rounded-xl bg-gradient-to-r from-amber-100 to-orange-100 border-2 border-slate-900 mb-1.5 shadow-comic-sm">
                <ComicDrivesIcon className="w-6 h-6 shrink-0 animate-comic-float" />
                <div>
                  <p className="font-comic text-xs text-slate-900 leading-tight">
                    {formatBytes(duplicateReclaimable, settings.unit)} Reclaimable!
                  </p>
                  <p className="text-[10px] font-fredoka font-bold text-slate-600">
                    Byte-for-byte identical duplicates
                  </p>
                </div>
              </div>

              {/* Real Duplicates check list */}
              {duplicateAlerts.length > 0 ? (
                <div className="space-y-1">
                  {duplicateAlerts.map((grp, idx) => {
                    const isChecked = selectedCleanupIds.has(grp.files[1]?.id || '');
                    return (
                      <div
                        key={grp.hash || idx}
                        onClick={() => grp.files[1] && toggleCleanupSelection(grp.files[1].id)}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border-2 border-slate-900 cursor-pointer hover:bg-amber-50 hover:-translate-y-0.5 hover:shadow-comic-sm transition-all text-xs"
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <span className="text-sm">📄</span>
                          <div className="truncate">
                            <p className="font-fredoka font-bold text-slate-900 truncate text-[11px]">
                              {grp.files[0]?.name || 'Duplicate file'}
                            </p>
                            <p className="text-[10px] text-slate-500 font-semibold">
                              {grp.files.length} files • {formatBytes(grp.reclaimable_bytes, settings.unit)}
                            </p>
                          </div>
                        </div>

                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-4 h-4 rounded border-2 border-slate-900 text-blue-600 accent-blue-600 focus:ring-0 cursor-pointer"
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[10px] font-fredoka text-slate-500 py-1 text-center">
                  {scanSummary ? 'No duplicates detected' : 'Scan to check for duplicates'}
                </p>
              )}
            </div>

            {/* Bottom Security Badge */}
            <div className="relative mt-2 flex items-center justify-center space-x-1.5 py-1.5 px-2.5 rounded-xl bg-emerald-400 border-2 border-slate-900 shadow-comic-sm comic-hover-wiggle">
              <ComicShieldIcon className="w-4 h-4" />
              <span className="font-comic text-[11px] uppercase text-slate-900 tracking-wide">
                SecureBLAKE3 Verified
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================
          BOTTOM RESPONSIVE FOOTER DOCK
         ========================================= */}
      <footer className="mt-4 py-3 px-4 flex flex-wrap items-center justify-between gap-3 text-xs font-fredoka font-bold text-slate-700 border-2.5 border-slate-900 bg-white rounded-2xl shadow-comic shrink-0 relative overflow-hidden">
        {/* Stripe texture */}
        <div className="absolute inset-0 bg-comic-stripes pointer-events-none rounded-2xl" />

        <div className="relative flex items-center space-x-2 flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('settings')}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border-2 border-slate-900 bg-amber-100 hover:bg-amber-200 text-slate-800 shadow-comic-sm transition-all text-xs hover:-translate-y-0.5"
            title="Configure Binary (GiB) vs Decimal (GB)"
          >
            <span>⚙️ Unit:</span>
            <span className="font-comic text-slate-900">{settings.unit.toUpperCase()}</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border-2 border-slate-900 bg-amber-100 hover:bg-amber-200 text-slate-800 shadow-comic-sm transition-all text-xs hover:-translate-y-0.5"
            title="View or edit active exclusion rules"
          >
            <span>🛡️ Exclusions:</span>
            <span className="font-comic text-slate-900">{settings.default_excludes.length} Active</span>
          </button>
        </div>

        <div className="relative flex items-center space-x-2 flex-wrap gap-2">
          <button
            onClick={handleExportJSON}
            disabled={!scanSummary}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border-2 border-slate-900 bg-amber-300 hover:bg-amber-400 text-slate-900 font-comic uppercase text-xs shadow-comic-sm transition-all disabled:opacity-40 hover:-translate-y-0.5"
            title="Export scan results as JSON"
          >
            <span>📥 Export JSON</span>
          </button>
          <span className="text-xs text-slate-500 font-comic uppercase px-1 flex items-center space-x-1">
            <span>✦</span>
            <span>ByteMap v1.0 • Volatile RAM Only</span>
            <span>✦</span>
          </span>
        </div>
      </footer>
    </div>
  );
};
