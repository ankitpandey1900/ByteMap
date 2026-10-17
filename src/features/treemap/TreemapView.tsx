import React, { useMemo, useState } from 'react';
import {
  ChevronRight,
  Folder,
  ArrowLeft,
  Filter,
  Search,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatBytes, getCategoryColor } from '@/lib/utils';
import { FileCategory } from '@/types';
import { CardSpotlight } from '@/components/ui';

interface TreemapItem {
  id: string;
  name: string;
  path: string;
  size: number;
  isDir: boolean;
  category?: FileCategory;
  fileCount?: number;
  dirCount?: number;
}

interface RectNode extends TreemapItem {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Standard squarified treemap partition algorithm.
 */
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

  // Sort descending
  const sorted = [...items].sort((a, b) => b.size - a.size);
  layoutSlice(sorted, x, y, width, height);

  return result;
}

export const TreemapView: React.FC = () => {
  const {
    scanSummary,
    settings,
    treemapCurrentPath,
    setTreemapCurrentPath,
  } = useAppStore();

  const [hoveredNode, setHoveredNode] = useState<RectNode | null>(null);
  const [minFilterMB, setMinFilterMB] = useState<number>(0);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');

  const currentPath = treemapCurrentPath || scanSummary?.root_path || '';

  // Breadcrumbs computation
  const breadcrumbs = useMemo(() => {
    if (!currentPath) return [];
    const parts = currentPath.split(/[\\/]/).filter(Boolean);
    const crumbs: Array<{ label: string; fullPath: string }> = [];

    let accumulated = '';
    // Check if Windows drive letter (e.g. C:)
    if (currentPath.includes(':')) {
      accumulated = parts[0] + '\\';
      crumbs.push({ label: parts[0] + '\\', fullPath: accumulated });
      for (let i = 1; i < parts.length; i++) {
        accumulated += parts[i] + '\\';
        crumbs.push({ label: parts[i], fullPath: accumulated.replace(/\\$/, '') });
      }
    } else {
      // Unix style
      accumulated = '/';
      crumbs.push({ label: '/', fullPath: '/' });
      for (let i = 0; i < parts.length; i++) {
        accumulated += parts[i] + '/';
        crumbs.push({ label: parts[i], fullPath: accumulated.replace(/\/$/, '') });
      }
    }

    return crumbs;
  }, [currentPath]);

  // Compute children of current view path
  const childrenItems = useMemo<TreemapItem[]>(() => {
    if (!scanSummary) return [];

    const items: TreemapItem[] = [];
    const normCurrent = currentPath.toLowerCase().replace(/\\+$/, '').replace(/\/+$/, '');

    // Add largest folders that are direct children or match the path
    for (const folder of scanSummary.largest_folders) {
      const normFolder = folder.path.toLowerCase().replace(/\\+$/, '').replace(/\/+$/, '');
      if (normFolder === normCurrent) continue;

      // Check if folder is inside current path
      if (normFolder.startsWith(normCurrent)) {
        const sub = normFolder.slice(normCurrent.length).replace(/^[\\/]/, '');
        const directSub = sub.split(/[\\/]/)[0];
        if (directSub && !items.some((it) => it.name.toLowerCase() === directSub.toLowerCase())) {
          const isWin = currentPath.includes('\\') || currentPath.includes(':');
          const sep = isWin ? '\\' : '/';
          const childPath = `${currentPath.replace(/[\\/]+$/, '')}${sep}${directSub}`;

          items.push({
            id: childPath,
            name: directSub,
            path: childPath,
            size: folder.size_bytes,
            isDir: true,
            fileCount: folder.file_count,
            dirCount: folder.dir_count,
          });
        }
      }
    }

    // Add files that are located in this path
    for (const file of scanSummary.largest_files) {
      const normFile = file.path.toLowerCase();
      if (normFile.startsWith(normCurrent)) {
        const sub = normFile.slice(normCurrent.length).replace(/^[\\/]/, '');
        const segments = sub.split(/[\\/]/);
        if (segments.length === 1) {
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

    // Only if at root path and no direct children parsed, show root largest folders
    const normRoot = (scanSummary.root_path || '').toLowerCase().replace(/\\+$/, '').replace(/\/+$/, '');
    if (items.length === 0 && normCurrent === normRoot) {
      for (const folder of scanSummary.largest_folders.slice(0, 15)) {
        items.push({
          id: folder.id,
          name: folder.name,
          path: folder.path,
          size: folder.size_bytes,
          isDir: true,
          fileCount: folder.file_count,
        });
      }
    }

    // Apply filters
    return items.filter((item) => {
      if (minFilterMB > 0 && item.size < minFilterMB * 1024 * 1024) return false;
      if (
        filterCategory !== 'all' &&
        item.category &&
        item.category !== filterCategory
      ) {
        return false;
      }
      if (
        searchFilter &&
        !item.name.toLowerCase().includes(searchFilter.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [scanSummary, currentPath, minFilterMB, filterCategory, searchFilter]);

  // Compute squarified layout
  const rects = useMemo(() => {
    return squarify(childrenItems, 0, 0, 1000, 560);
  }, [childrenItems]);

  const handleDrillDown = (node: RectNode) => {
    if (node.isDir) {
      setTreemapCurrentPath(node.path);
    }
  };

  const handleGoBack = () => {
    if (breadcrumbs.length > 1) {
      const parentCrumb = breadcrumbs[breadcrumbs.length - 2];
      setTreemapCurrentPath(parentCrumb.fullPath);
    }
  };

  if (!scanSummary) {
    return (
      <CardSpotlight className="flex flex-col items-center justify-center h-full min-h-[380px] p-8 text-center text-muted-foreground">
        <Folder className="w-16 h-16 mb-4 text-primary/40 stroke-[1.2]" />
        <h3 className="text-lg font-semibold text-foreground mb-1">No scan data to visualize</h3>
        <p className="text-xs max-w-sm mb-4">
          Select a drive or folder and click &quot;Start Scan&quot; to generate interactive storage treemaps.
        </p>
      </CardSpotlight>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Navigation & Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-card/60 backdrop-blur border border-border/50 rounded-xl">
        {/* Breadcrumb path */}
        <div className="flex items-center space-x-1.5 overflow-x-auto max-w-xl text-sm py-1">
          <button
            onClick={handleGoBack}
            disabled={breadcrumbs.length <= 1}
            className="p-1.5 rounded-lg border border-border/60 hover:bg-accent disabled:opacity-30 disabled:pointer-events-none transition-colors mr-1"
            title="Go to parent directory"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>

          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.fullPath}>
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
              <button
                onClick={() => setTreemapCurrentPath(crumb.fullPath)}
                className={`px-2 py-1 rounded-md text-xs font-mono font-medium truncate max-w-[140px] hover:bg-accent transition-colors ${
                  idx === breadcrumbs.length - 1
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title={crumb.fullPath}
              >
                {crumb.label}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Filter Toolbar */}
        <div className="flex items-center space-x-2">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search treemap..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-background border border-border/60 rounded-lg text-xs w-36 focus:w-48 transition-all focus:outline-none focus:border-primary text-foreground"
            />
          </div>

          {/* Min size filter */}
          <select
            value={minFilterMB}
            onChange={(e) => setMinFilterMB(Number(e.target.value))}
            className="px-2.5 py-1.5 bg-background border border-border/60 rounded-lg text-xs text-foreground focus:outline-none focus:border-primary"
          >
            <option value={0}>All sizes</option>
            <option value={10}>&gt; 10 MB</option>
            <option value={50}>&gt; 50 MB</option>
            <option value={100}>&gt; 100 MB</option>
            <option value={500}>&gt; 500 MB</option>
            <option value={1024}>&gt; 1 GB</option>
          </select>
        </div>
      </div>

      {/* Interactive Treemap Canvas Area */}
      <div className="relative flex-1 bg-card/40 rounded-xl border border-border/50 overflow-hidden min-h-[380px]">
        {rects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-6">
            <Filter className="w-10 h-10 mb-2 opacity-40" />
            <p className="text-sm font-medium">No files or folders match the current filter</p>
            <button
              onClick={() => {
                setMinFilterMB(0);
                setSearchFilter('');
                setFilterCategory('all');
              }}
              className="mt-3 text-xs text-primary hover:underline"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <svg
            viewBox="0 0 1000 560"
            className="w-full h-full select-none"
            preserveAspectRatio="none"
          >
            {rects.map((node) => {
              const isHovered = hoveredNode?.id === node.id;
              const fill = node.isDir
                ? '#1e293b'
                : node.category
                ? getCategoryColor(node.category)
                : '#475569';

              const isLargeEnough = node.w > 45 && node.h > 28;
              const isVeryLarge = node.w > 90 && node.h > 45;

              return (
                <g
                  key={node.id}
                  onClick={() => handleDrillDown(node)}
                  onMouseEnter={() => setHoveredNode(node)}
                  onMouseLeave={() => setHoveredNode(null)}
                  className={`transition-all duration-150 ${
                    node.isDir ? 'cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <rect
                    x={node.x + 1}
                    y={node.y + 1}
                    width={Math.max(0, node.w - 2)}
                    height={Math.max(0, node.h - 2)}
                    rx={4}
                    fill={fill}
                    fillOpacity={node.isDir ? (isHovered ? 0.95 : 0.8) : isHovered ? 0.95 : 0.75}
                    stroke={isHovered ? '#ffffff' : '#334155'}
                    strokeWidth={isHovered ? 1.5 : 0.8}
                    className="transition-colors"
                  />

                  {isLargeEnough && (
                    <text
                      x={node.x + 6}
                      y={node.y + 16}
                      fontSize={node.w < 70 ? 10 : 12}
                      fontWeight="500"
                      fill="#ffffff"
                      className="pointer-events-none truncate"
                    >
                      {node.name.length > Math.floor(node.w / 8)
                        ? node.name.slice(0, Math.floor(node.w / 8)) + '…'
                        : node.name}
                    </text>
                  )}

                  {isVeryLarge && (
                    <text
                      x={node.x + 6}
                      y={node.y + 32}
                      fontSize={11}
                      fill="#94a3b8"
                      className="pointer-events-none font-mono"
                    >
                      {formatBytes(node.size, settings.unit)}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        )}

        {/* Floating Tooltip */}
        {hoveredNode && (
          <div
            className="absolute bottom-4 left-4 right-4 pointer-events-none flex items-center justify-between p-3 bg-popover/95 backdrop-blur-md border border-border shadow-xl rounded-xl z-20 text-xs animate-fade-in"
          >
            <div className="flex items-center space-x-3 overflow-hidden">
              <div
                className="w-3.5 h-3.5 rounded-full shrink-0"
                style={{
                  backgroundColor: hoveredNode.isDir
                    ? '#38bdf8'
                    : hoveredNode.category
                    ? getCategoryColor(hoveredNode.category)
                    : '#94a3b8',
                }}
              />
              <div className="truncate">
                <span className="font-semibold text-foreground mr-2">{hoveredNode.name}</span>
                <span className="font-mono text-muted-foreground truncate">{hoveredNode.path}</span>
              </div>
            </div>

            <div className="flex items-center space-x-4 shrink-0 pl-3">
              <div className="text-right">
                <span className="text-muted-foreground mr-1">Size:</span>
                <span className="font-mono font-semibold text-foreground">
                  {formatBytes(hoveredNode.size, settings.unit)}
                </span>
              </div>
              {hoveredNode.isDir && (
                <span className="text-[11px] bg-primary/20 text-primary px-2 py-0.5 rounded font-medium">
                  Click to inspect folder
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Category Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-card/40 border border-border/40 rounded-xl text-xs text-muted-foreground">
        <div className="flex items-center space-x-4 overflow-x-auto py-0.5">
          <span className="font-medium text-foreground text-[11px]">Categories:</span>
          {(['video', 'image', 'audio', 'document', 'archive', 'app', 'dev'] as FileCategory[]).map(
            (cat) => (
              <div key={cat} className="flex items-center space-x-1.5 shrink-0">
                <span
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ backgroundColor: getCategoryColor(cat) }}
                />
                <span className="capitalize">{cat}</span>
              </div>
            )
          )}
          <div className="flex items-center space-x-1.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-700" />
            <span>Folder</span>
          </div>
        </div>

        <span className="text-[11px] text-muted-foreground">
          Showing {rects.length} items • Logical file sizes
        </span>
      </div>
    </div>
  );
};
