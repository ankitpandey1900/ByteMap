import React, { useState, useMemo } from 'react';
import {
  ExternalLink,
  ArrowUpDown,
  BarChart3,
  X,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import { useAppStore } from '@/lib/store';
import {
  formatBytes,
  formatDate,
  formatNumber,
  getCategoryColor,
  cleanDisplayPath,
} from '@/lib/utils';
import {
  ComicCategoryFileIcon,
  ComicLargeFilesIcon,
} from '@/components/icons/ComicIcons';
import { CategoryIcon } from '@/components/CategoryIcon';
import { ScoutAvatar } from '@/components/ScoutMascot';
import { api } from '@/lib/api';

type SizeTierKey = 'all' | 'under100' | '100to500' | '500to1g' | '1gto5g' | 'over5g';

interface SizeTier {
  key: SizeTierKey;
  label: string;
  minBytes: number;
  maxBytes: number;
  color: string;
}

const SIZE_TIERS: SizeTier[] = [
  { key: 'under100', label: '< 100 MB', minBytes: 0, maxBytes: 100 * 1024 * 1024, color: '#10b981' },
  { key: '100to500', label: '100 – 500 MB', minBytes: 100 * 1024 * 1024, maxBytes: 500 * 1024 * 1024, color: '#06b6d4' },
  { key: '500to1g', label: '500 MB – 1 GB', minBytes: 500 * 1024 * 1024, maxBytes: 1024 * 1024 * 1024, color: '#f59e0b' },
  { key: '1gto5g', label: '1 GB – 5 GB', minBytes: 1024 * 1024 * 1024, maxBytes: 5 * 1024 * 1024 * 1024, color: '#f97316' },
  { key: 'over5g', label: '> 5 GB Monster', minBytes: 5 * 1024 * 1024 * 1024, maxBytes: Infinity, color: '#ef4444' },
];

export const LargeFilesTab: React.FC = () => {
  const { scanSummary, settings } = useAppStore();
  const [thresholdMB, setThresholdMB] = useState<number>(settings.large_file_threshold_mb);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedTier, setSelectedTier] = useState<SizeTierKey>('all');
  const [showHistogram, setShowHistogram] = useState<boolean>(true);

  // Compute histogram data across all large files
  const histogramData = useMemo(() => {
    if (!scanSummary) return [];

    return SIZE_TIERS.map((tier) => {
      const matches = scanSummary.largest_files.filter(
        (f) => f.size_bytes >= tier.minBytes && f.size_bytes < tier.maxBytes
      );
      const totalBytes = matches.reduce((sum, f) => sum + f.size_bytes, 0);

      return {
        key: tier.key,
        label: tier.label,
        count: matches.length,
        totalBytes,
        totalGB: Number((totalBytes / (1024 * 1024 * 1024)).toFixed(2)),
        color: tier.color,
      };
    });
  }, [scanSummary]);

  const filteredLargeFiles = useMemo(() => {
    if (!scanSummary) return [];

    let files = scanSummary.largest_files;

    // Filter by tier if selected
    if (selectedTier !== 'all') {
      const tierObj = SIZE_TIERS.find((t) => t.key === selectedTier);
      if (tierObj) {
        files = files.filter(
          (f) => f.size_bytes >= tierObj.minBytes && f.size_bytes < tierObj.maxBytes
        );
      }
    } else {
      // Otherwise filter by min threshold
      const thresholdBytes = thresholdMB * 1024 * 1024;
      files = files.filter((f) => f.size_bytes >= thresholdBytes);
    }

    const sorted = [...files].sort((a, b) =>
      sortOrder === 'desc'
        ? b.size_bytes - a.size_bytes
        : a.size_bytes - b.size_bytes
    );

    return sorted;
  }, [scanSummary, thresholdMB, sortOrder, selectedTier]);

  const handleReveal = async (path: string) => {
    try {
      await api.revealInFolder(path);
    } catch (err) {
      console.error('Failed to reveal file:', err);
    }
  };

  const totalLargeBytes = filteredLargeFiles.reduce(
    (acc, f) => acc + f.size_bytes,
    0
  );

  const largestSize = filteredLargeFiles[0]?.size_bytes || 1;

  if (!scanSummary) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[420px] p-8 text-center bg-white rounded-2xl border-3 border-slate-900 shadow-[6px_6px_0px_#0f172a] select-none w-full">
        <div className="w-20 h-20 rounded-2xl bg-amber-400 border-3 border-slate-900 shadow-[3px_3px_0px_#0f172a] flex items-center justify-center mb-4">
          <ScoutAvatar isScanning={false} className="w-14 h-14" />
        </div>
        <div className="inline-flex items-center px-3 py-1 rounded-lg bg-amber-400 border-2.5 border-slate-900 shadow-[2px_2px_0px_#0f172a] font-comic text-xs uppercase tracking-wide text-slate-900 mb-2">
          Large Files Idle
        </div>
        <h3 className="font-comic text-2xl text-slate-900 uppercase tracking-wide mb-1 font-black">
          No Storage Scouted Yet
        </h3>
        <p className="font-fredoka text-sm text-slate-600 max-w-sm font-semibold">
          Click <strong>ANALYZE</strong> to scout your drive and detect the top space consumers eating your disk capacity.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full font-sans text-slate-900">
      {/* Top Banner and Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white border-3 border-slate-900 rounded-2xl shadow-[4px_4px_0px_#0f172a] w-full">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-amber-400 border-2.5 border-slate-900 shadow-[2px_2px_0px_#0f172a] font-comic text-xs uppercase tracking-wide font-black text-slate-900 mb-1">
            <ComicLargeFilesIcon className="w-4 h-4" />
            <span>Heavyweight File Ranker</span>
          </div>
          <h2 className="font-comic text-xl text-slate-900 uppercase tracking-wider font-black mt-1">
            Top Large Files Found
          </h2>
          <p className="text-xs font-fredoka font-semibold text-slate-600">
            Identify the largest disk space consumers consuming valuable drive capacity.
          </p>
        </div>

        <div className="flex items-center space-x-3 flex-wrap gap-2">
          {selectedTier === 'all' && (
            <div className="flex items-center space-x-2 text-xs font-fredoka font-bold">
              <span className="text-slate-700">Min Threshold:</span>
              <select
                value={thresholdMB}
                onChange={(e) => setThresholdMB(Number(e.target.value))}
                className="px-3 py-1.5 bg-slate-50 border-2.5 border-slate-900 rounded-xl font-comic text-xs uppercase font-bold text-slate-900 focus:outline-none shadow-[2px_2px_0px_#0f172a] cursor-pointer"
              >
                <option value={10}>&gt; 10 MB</option>
                <option value={50}>&gt; 50 MB</option>
                <option value={100}>&gt; 100 MB</option>
                <option value={500}>&gt; 500 MB</option>
                <option value={1024}>&gt; 1 GB</option>
                <option value={5120}>&gt; 5 GB</option>
              </select>
            </div>
          )}

          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl border-2.5 border-slate-900 bg-white hover:bg-yellow-300 font-comic text-xs uppercase font-black text-slate-900 shadow-[2px_2px_0px_#0f172a] active:translate-y-0.5 transition-all cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>{sortOrder === 'desc' ? 'Largest First' : 'Smallest First'}</span>
          </button>
        </div>
      </div>

      {/* GRAPH 3: File Size Tier Histogram Bar Chart */}
      <div className="p-4 bg-white rounded-2xl border-3 border-slate-900 shadow-[4px_4px_0px_#0f172a] space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-amber-400 border-2 border-slate-900 shadow-comic-sm flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-slate-900" />
            </div>
            <div>
              <h3 className="font-bangers text-base uppercase tracking-wider text-slate-900">
                File Size Distribution Histogram
              </h3>
              <p className="text-[11px] font-fredoka font-semibold text-slate-500">
                Click any bar or pill below to isolate files in that size tier
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {selectedTier !== 'all' && (
              <button
                onClick={() => setSelectedTier('all')}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg border-2 border-slate-900 bg-rose-100 hover:bg-rose-200 text-rose-800 font-comic text-xs uppercase font-bold shadow-comic-sm cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>Reset Filter (Show All)</span>
              </button>
            )}
            <button
              onClick={() => setShowHistogram(!showHistogram)}
              className="text-xs font-comic uppercase text-slate-600 hover:text-slate-900 px-2 py-1 rounded-lg border border-slate-300 cursor-pointer"
            >
              {showHistogram ? 'Collapse' : 'Expand'}
            </button>
          </div>
        </div>

        {showHistogram && (
          <>
            <div className="h-36 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={histogramData} margin={{ top: 10, right: 15, left: -10, bottom: 5 }}>
                  <XAxis
                    dataKey="label"
                    tick={{ fill: '#0f172a', fontSize: 11, fontWeight: 'bold' }}
                    axisLine={{ stroke: '#0f172a', strokeWidth: 2 }}
                    tickLine={{ stroke: '#0f172a' }}
                  />
                  <YAxis
                    tick={{ fill: '#0f172a', fontSize: 10, fontWeight: 'bold' }}
                    axisLine={{ stroke: '#0f172a', strokeWidth: 2 }}
                    tickLine={{ stroke: '#0f172a' }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="p-2.5 bg-yellow-50 border-2.5 border-slate-900 rounded-xl shadow-comic text-xs font-fredoka font-bold text-slate-900">
                            <p className="font-comic uppercase text-xs text-slate-800">{d.label}</p>
                            <p className="font-mono text-sm mt-0.5 text-amber-700">
                              {formatNumber(d.count)} files ({formatBytes(d.totalBytes, settings.unit)})
                            </p>
                            <p className="text-[10px] text-slate-500 mt-0.5">Click to filter table</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="count"
                    stroke="#0f172a"
                    strokeWidth={2}
                    radius={[6, 6, 0, 0]}
                    onClick={(entry) => {
                      if (entry && entry.key) {
                        setSelectedTier(entry.key === selectedTier ? 'all' : (entry.key as SizeTierKey));
                      }
                    }}
                    className="cursor-pointer"
                  >
                    {histogramData.map((entry) => (
                      <Cell
                        key={entry.key}
                        fill={entry.color}
                        opacity={selectedTier === 'all' || selectedTier === entry.key ? 1 : 0.35}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Quick Filter Tier Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
              <span className="text-xs font-bangers uppercase text-slate-500 mr-1 flex items-center gap-1">
                <Layers className="w-3 h-3 text-amber-500" />
                Tier Filter:
              </span>
              <button
                type="button"
                onClick={() => setSelectedTier('all')}
                className={`px-2.5 py-1 rounded-lg border-1.5 border-slate-900 text-[11px] font-comic uppercase tracking-wider transition-all cursor-pointer ${
                  selectedTier === 'all'
                    ? 'bg-amber-400 font-bold text-slate-900 shadow-comic-sm -translate-y-0.5'
                    : 'bg-white hover:bg-amber-100 text-slate-700'
                }`}
              >
                All Sizes
              </button>
              {SIZE_TIERS.map((tier) => {
                const count = histogramData.find((h) => h.key === tier.key)?.count || 0;
                const isSelected = selectedTier === tier.key;
                return (
                  <button
                    key={tier.key}
                    type="button"
                    onClick={() => setSelectedTier(isSelected ? 'all' : tier.key)}
                    className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border-1.5 border-slate-900 text-[11px] font-comic uppercase tracking-wider transition-all cursor-pointer ${
                      isSelected
                        ? 'font-bold text-slate-900 shadow-comic-sm -translate-y-0.5'
                        : 'bg-white hover:bg-slate-100 text-slate-700'
                    }`}
                    style={{
                      backgroundColor: isSelected ? tier.color : undefined,
                    }}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-slate-900"
                      style={{ backgroundColor: tier.color }}
                    />
                    <span>{tier.label}</span>
                    <span className="font-mono text-[10px] font-bold text-slate-900 bg-white/70 px-1 rounded">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full">
        <div className="p-4 bg-white rounded-2xl border-3 border-slate-900 shadow-[4px_4px_0px_#0f172a]">
          <span className="font-bangers uppercase tracking-wider text-xs text-slate-500 block">
            {selectedTier === 'all' ? 'Files Above Threshold' : 'Files in Selected Tier'}
          </span>
          <p className="text-2xl font-mono font-bold text-slate-900 mt-1 tabular-nums">
            {formatNumber(filteredLargeFiles.length)}
          </p>
        </div>

        <div className="p-4 bg-white rounded-2xl border-3 border-slate-900 shadow-[4px_4px_0px_#0f172a]">
          <span className="font-bangers uppercase tracking-wider text-xs text-slate-500 block">
            Aggregated Total Size
          </span>
          <p className="text-2xl font-mono font-bold text-amber-600 mt-1 tabular-nums">
            {formatBytes(totalLargeBytes, settings.unit)}
          </p>
        </div>

        <div className="p-4 bg-white rounded-2xl border-3 border-slate-900 shadow-[4px_4px_0px_#0f172a]">
          <span className="font-bangers uppercase tracking-wider text-xs text-slate-500 block">
            Largest Single File
          </span>
          <p className="text-2xl font-mono font-bold text-emerald-600 mt-1 truncate tabular-nums">
            {filteredLargeFiles[0]
              ? formatBytes(filteredLargeFiles[0].size_bytes, settings.unit)
              : '—'}
          </p>
        </div>
      </div>

      {/* Large Files Comic List */}
      <div className="bg-white rounded-2xl border-3 border-slate-900 shadow-[4px_4px_0px_#0f172a] divide-y-2 divide-slate-200 overflow-hidden w-full">
        {filteredLargeFiles.map((file, idx) => {
          const percent = Math.min(
            100,
            Math.max(8, Math.round((file.size_bytes / largestSize) * 100))
          );
          const catColor = getCategoryColor(file.category);

          return (
            <div
              key={file.id}
              className="p-3.5 flex items-center justify-between hover:bg-amber-50/80 transition-colors gap-4 w-full group"
            >
              {/* Rank & File details */}
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <span className="font-bangers text-xs text-slate-700 bg-amber-200 px-2 py-1 rounded-md border-2 border-slate-900 shadow-[1.5px_1.5px_0px_#0f172a] shrink-0">
                  #{idx + 1}
                </span>

                <div className="shrink-0 p-1 bg-amber-100 border-2 border-slate-900 rounded-lg shadow-[1.5px_1.5px_0px_#0f172a] group-hover:scale-105 transition-transform">
                  <ComicCategoryFileIcon category={file.category} className="w-5 h-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2 flex-wrap gap-1">
                    <span className="font-comicNeue font-bold text-sm text-slate-900 truncate">
                      {file.name}
                    </span>
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-bangers uppercase tracking-wider border-2 border-slate-900 shadow-[1.5px_1.5px_0px_#0f172a]"
                      style={{
                        backgroundColor: `${catColor}25`,
                        color: '#0f172a',
                      }}
                    >
                      <CategoryIcon category={file.category} className="w-3.5 h-3.5" />
                      <span>{file.category}</span>
                    </span>
                  </div>
                  <p
                    className="text-[11px] text-slate-500 font-mono truncate mt-0.5"
                    title={cleanDisplayPath(file.path)}
                  >
                    {cleanDisplayPath(file.path)}
                  </p>
                </div>
              </div>

              {/* Size with visual mini-bar & Action */}
              <div className="flex items-center space-x-4 shrink-0">
                <div className="text-right w-32">
                  <span className="font-mono font-bold text-sm text-slate-900 block tabular-nums">
                    {formatBytes(file.size_bytes, settings.unit)}
                  </span>
                  <div className="w-full mt-1 h-2 bg-slate-200 border border-slate-900 rounded-full overflow-hidden p-0.2">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${percent}%`,
                        backgroundColor: catColor,
                      }}
                    />
                  </div>
                  <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                    {formatDate(file.modified_at)}
                  </p>
                </div>

                <button
                  onClick={() => handleReveal(file.path)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border-2 border-slate-900 bg-white hover:bg-yellow-300 text-slate-900 active:translate-y-0.5 shadow-[2px_2px_0px_#0f172a] text-xs font-bangers uppercase tracking-wider transition-all cursor-pointer"
                  title="Reveal in native file explorer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open</span>
                </button>
              </div>
            </div>
          );
        })}

        {filteredLargeFiles.length === 0 && (
          <div className="p-12 text-center text-slate-500">
            <div className="w-16 h-16 rounded-2xl bg-amber-200 border-2.5 border-slate-900 shadow-[3px_3px_0px_#0f172a] flex items-center justify-center mx-auto mb-3">
              <ComicLargeFilesIcon className="w-8 h-8" />
            </div>
            <p className="font-comic font-black text-base uppercase text-slate-900">
              No files found in selected size range
            </p>
            <p className="text-xs font-fredoka font-semibold text-slate-600 mt-1">
              Try switching back to &quot;All Sizes&quot; or reducing the threshold above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
