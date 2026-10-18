import React, { useState, useMemo } from 'react';
import {
  ExternalLink,
  ArrowUpDown,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import {
  formatBytes,
  formatDate,
  formatNumber,
  getCategoryColor,
  getCategoryEmoji,
  cleanDisplayPath,
} from '@/lib/utils';
import {
  ComicCategoryFileIcon,
  ComicLargeFilesIcon,
} from '@/components/icons/ComicIcons';
import { ScoutAvatar } from '@/components/ScoutMascot';
import { api } from '@/lib/api';

export const LargeFilesTab: React.FC = () => {
  const { scanSummary, settings } = useAppStore();
  const [thresholdMB, setThresholdMB] = useState<number>(settings.large_file_threshold_mb);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const filteredLargeFiles = useMemo(() => {
    if (!scanSummary) return [];

    const thresholdBytes = thresholdMB * 1024 * 1024;
    const files = scanSummary.largest_files.filter(
      (f) => f.size_bytes >= thresholdBytes
    );

    files.sort((a, b) =>
      sortOrder === 'desc'
        ? b.size_bytes - a.size_bytes
        : a.size_bytes - b.size_bytes
    );

    return files;
  }, [scanSummary, thresholdMB, sortOrder]);

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
    <div className="space-y-4 w-full select-none font-sans text-slate-900">
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

          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl border-2.5 border-slate-900 bg-white hover:bg-yellow-300 font-comic text-xs uppercase font-black text-slate-900 shadow-[2px_2px_0px_#0f172a] active:translate-y-0.5 transition-all cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>{sortOrder === 'desc' ? 'Largest First' : 'Smallest First'}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full">
        <div className="p-4 bg-white rounded-2xl border-3 border-slate-900 shadow-[4px_4px_0px_#0f172a]">
          <span className="font-bangers uppercase tracking-wider text-xs text-slate-500 block">
            Files Above Threshold
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
          const catEmoji = getCategoryEmoji(file.category);

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
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bangers uppercase tracking-wider border-2 border-slate-900 shadow-[1.5px_1.5px_0px_#0f172a]"
                      style={{
                        backgroundColor: `${catColor}25`,
                        color: '#0f172a',
                      }}
                    >
                      <span>{catEmoji}</span>
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
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border-2 border-slate-900 bg-white hover:bg-yellow-300 text-slate-900 active:translate-y-0.5 shadow-[2px_2px_0px_#0f172a] text-xs font-bangers uppercase tracking-wider transition-all"
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
              No files found exceeding {thresholdMB} MB
            </p>
            <p className="text-xs font-fredoka font-semibold text-slate-600 mt-1">
              Try reducing the minimum size threshold above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
