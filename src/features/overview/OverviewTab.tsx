import React from 'react';
import {
  HardDrive,
  FileText,
  FolderTree,
  AlertTriangle,
  Clock,
  Trash2,
  Copy,
  PieChart as PieIcon,
  Layers,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { useAppStore } from '@/lib/store';
import { formatBytes, formatDuration, formatNumber, getCategoryColor } from '@/lib/utils';
import { TreemapView } from '@/features/treemap/TreemapView';

import { CardSpotlight } from '@/components/ui';

export const OverviewTab: React.FC = () => {
  const { drives, scanSummary, settings, setActiveTab, setSelectedCategory } = useAppStore();

  const totalDriveCapacity = drives.reduce((acc, d) => acc + d.total_bytes, 0);
  const totalDriveUsed = drives.reduce((acc, d) => acc + d.used_bytes, 0);
  const totalDriveAvailable = drives.reduce((acc, d) => acc + d.available_bytes, 0);

  const duplicateReclaimable = scanSummary?.duplicate_groups.reduce(
    (acc, g) => acc + g.reclaimable_bytes,
    0
  ) || 0;

  const cleanupPotentialBytes = scanSummary?.cleanup_candidates.reduce(
    (acc, c) => acc + c.file.size_bytes,
    0
  ) || 0;

  // Chart data for categories
  const categoryChartData = (scanSummary?.categories || []).slice(0, 6).map((c) => ({
    name: c.category.toUpperCase(),
    value: c.total_bytes,
    color: getCategoryColor(c.category),
    category: c.category,
  }));

  return (
    <div className="space-y-6 pb-8">
      {/* Top Physical System Storage Banner with Aceternity CardSpotlight */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Physical Capacity */}
        <CardSpotlight
          color="rgba(59, 130, 246, 0.16)"
          className="p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Detected Storage
            </span>
            <HardDrive className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-bold font-mono text-foreground">
            {formatBytes(totalDriveCapacity, settings.unit)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {drives.length > 0
              ? `Across ${drives.length} active system ${drives.length === 1 ? 'drive' : 'drives'}`
              : 'Discovering local drives...'}
          </p>
          <div className="w-full bg-secondary h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-500"
              style={{
                width: `${
                  totalDriveCapacity > 0
                    ? Math.round((totalDriveUsed / totalDriveCapacity) * 100)
                    : 0
                }%`,
              }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-muted-foreground mt-1.5 mono-num">
            <span>Used: {formatBytes(totalDriveUsed, settings.unit)}</span>
            <span>Free: {formatBytes(totalDriveAvailable, settings.unit)}</span>
          </div>
        </CardSpotlight>

        {/* Current Scan Volume */}
        <CardSpotlight
          color="rgba(16, 185, 129, 0.16)"
          className="p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Scanned Volume
            </span>
            <FolderTree className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-foreground">
            {scanSummary ? formatBytes(scanSummary.total_bytes, settings.unit) : '—'}
          </div>
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {scanSummary ? scanSummary.root_path : 'No scan active'}
          </p>
          <div className="flex items-center space-x-3 text-[11px] text-muted-foreground mt-3 mono-num">
            <span>
              {scanSummary ? formatNumber(scanSummary.total_files) : 0} files
            </span>
            <span>•</span>
            <span>
              {scanSummary ? formatNumber(scanSummary.total_directories) : 0} folders
            </span>
          </div>
        </CardSpotlight>

        {/* Potential Cleanup Opportunities */}
        <CardSpotlight
          color="rgba(245, 158, 11, 0.16)"
          onClick={() => setActiveTab('cleanup')}
          className="p-4 cursor-pointer hover:border-amber-500/40 transition-colors group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Cleanup Potential
            </span>
            <Trash2 className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {scanSummary ? formatBytes(cleanupPotentialBytes, settings.unit) : '—'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {scanSummary
              ? `${scanSummary.cleanup_candidates.length} safe candidates identified`
              : 'Scan to evaluate'}
          </p>
          <div className="flex items-center text-[11px] text-primary mt-3 group-hover:underline">
            <span>Review cleanup candidates</span>
            <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </CardSpotlight>

        {/* Scan Duration & Engine Health */}
        <CardSpotlight
          color="rgba(6, 182, 212, 0.16)"
          className="p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Engine Performance
            </span>
            <Clock className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-foreground">
            {scanSummary ? formatDuration(scanSummary.scan_duration_ms) : '—'}
          </div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
            {scanSummary && scanSummary.error_count > 0 ? (
              <span className="text-amber-400 flex items-center">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {scanSummary.error_count} unreadable paths
              </span>
            ) : scanSummary ? (
              <span className="text-emerald-400 flex items-center">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                100% complete traversal
              </span>
            ) : (
              <span className="text-muted-foreground flex items-center">
                Engine ready
              </span>
            )}
          </div>
          <div className="text-[11px] text-muted-foreground mt-3 truncate">
            {scanSummary ? `Completed at ${new Date(scanSummary.timestamp).toLocaleTimeString()}` : 'Memory-only session'}
          </div>
        </CardSpotlight>
      </div>

      {/* Main Visualizations Row: Interactive Treemap & Distribution Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Treemap (2 Cols) */}
        <div className="lg:col-span-2 p-4 bg-card/60 backdrop-blur border border-border/50 rounded-xl flex flex-col min-h-[480px]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm text-foreground">Storage Treemap</h3>
            </div>
            <span className="text-xs text-muted-foreground">Click folders to drill down</span>
          </div>
          <div className="flex-1">
            <TreemapView />
          </div>
        </div>

        {/* File Type Distribution Card (1 Col) */}
        <div className="p-4 bg-card/60 backdrop-blur border border-border/50 rounded-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <PieIcon className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm text-foreground">Type Breakdown</h3>
              </div>
              <button
                onClick={() => setActiveTab('file-types')}
                className="text-xs text-primary hover:underline flex items-center"
              >
                Details <ArrowUpRight className="w-3 h-3 ml-0.5" />
              </button>
            </div>

            {/* Pie Chart */}
            {categoryChartData.length > 0 ? (
              <div className="h-44 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: number) => [
                        formatBytes(val, settings.unit),
                        'Size',
                      ]}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-44 flex items-center justify-center text-xs text-muted-foreground">
                No scan data
              </div>
            )}

            {/* Category list items */}
            <div className="space-y-2 mt-2">
              {(scanSummary?.categories || []).slice(0, 5).map((cat) => (
                <div
                  key={cat.category}
                  onClick={() => {
                    setSelectedCategory(cat.category);
                    setActiveTab('file-types');
                  }}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/60 cursor-pointer transition-colors text-xs"
                >
                  <div className="flex items-center space-x-2">
                    <span
                      className="w-2.5 h-2.5 rounded-sm shrink-0"
                      style={{ backgroundColor: getCategoryColor(cat.category) }}
                    />
                    <span className="capitalize font-medium text-foreground">
                      {cat.category}
                    </span>
                    <span className="text-muted-foreground">({formatNumber(cat.file_count)})</span>
                  </div>
                  <div className="flex items-center space-x-2 mono-num">
                    <span className="font-mono text-foreground font-semibold">
                      {formatBytes(cat.total_bytes, settings.unit)}
                    </span>
                    <span className="text-muted-foreground text-[11px] w-10 text-right">
                      {cat.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Duplicates Quick Card */}
          <div
            onClick={() => setActiveTab('duplicates')}
            className="mt-4 p-3 bg-secondary/50 rounded-lg border border-border/40 hover:border-primary/40 cursor-pointer transition-all flex items-center justify-between"
          >
            <div className="flex items-center space-x-2.5">
              <Copy className="w-4 h-4 text-purple-400" />
              <div>
                <p className="text-xs font-medium text-foreground">Duplicate Analysis</p>
                <p className="text-[11px] text-muted-foreground">
                  {duplicateReclaimable > 0
                    ? `${formatBytes(duplicateReclaimable, settings.unit)} reclaimable`
                    : 'Check for duplicated content'}
                </p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Largest Folders and Largest Files Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top 5 Discovered Folders */}
        <div className="p-4 bg-card/60 backdrop-blur border border-border/50 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm text-foreground flex items-center space-x-2">
              <FolderTree className="w-4 h-4 text-primary" />
              <span>Largest Folders</span>
            </h3>
            <button
              onClick={() => setActiveTab('explore')}
              className="text-xs text-primary hover:underline flex items-center"
            >
              View all <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>

          <div className="space-y-2">
            {(scanSummary?.largest_folders || []).slice(0, 5).map((folder, idx) => (
              <div
                key={folder.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-background/50 border border-border/40 text-xs"
              >
                <div className="flex items-center space-x-2.5 truncate mr-3">
                  <span className="text-[11px] text-muted-foreground w-4 shrink-0 font-mono">
                    #{idx + 1}
                  </span>
                  <div className="truncate">
                    <p className="font-medium text-foreground truncate">{folder.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate font-mono">
                      {folder.path}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono font-semibold text-foreground">
                    {formatBytes(folder.size_bytes, settings.unit)}
                  </span>
                  <p className="text-[10px] text-muted-foreground mono-num">
                    {formatNumber(folder.file_count)} files
                  </p>
                </div>
              </div>
            ))}
            {(!scanSummary || scanSummary.largest_folders.length === 0) && (
              <p className="text-xs text-muted-foreground text-center py-6">
                No folders scanned yet
              </p>
            )}
          </div>
        </div>

        {/* Top 5 Largest Discovered Files */}
        <div className="p-4 bg-card/60 backdrop-blur border border-border/50 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm text-foreground flex items-center space-x-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>Largest Files</span>
            </h3>
            <button
              onClick={() => setActiveTab('large-files')}
              className="text-xs text-primary hover:underline flex items-center"
            >
              View all <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>

          <div className="space-y-2">
            {(scanSummary?.largest_files || []).slice(0, 5).map((file, idx) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-background/50 border border-border/40 text-xs"
              >
                <div className="flex items-center space-x-2.5 truncate mr-3">
                  <span className="text-[11px] text-muted-foreground w-4 shrink-0 font-mono">
                    #{idx + 1}
                  </span>
                  <div className="truncate">
                    <p className="font-medium text-foreground truncate">{file.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate font-mono">
                      {file.path}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono font-semibold text-foreground">
                    {formatBytes(file.size_bytes, settings.unit)}
                  </span>
                  <p className="text-[10px] text-muted-foreground uppercase">
                    {file.category}
                  </p>
                </div>
              </div>
            ))}
            {(!scanSummary || scanSummary.largest_files.length === 0) && (
              <p className="text-xs text-muted-foreground text-center py-6">
                No files scanned yet
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
