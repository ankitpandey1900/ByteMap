import React, { useState, useMemo } from 'react';
import {
  FileText,
  ExternalLink,
  ArrowUpDown,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatBytes, formatDate, getCategoryBadgeClass } from '@/lib/utils';
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

  if (!scanSummary) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[420px] p-8 text-center bg-white rounded-2xl border-2.5 border-slate-900 shadow-comic select-none">
        <div className="w-16 h-16 rounded-2xl bg-amber-400 border-2.5 border-slate-900 shadow-comic flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-slate-900" />
        </div>
        <div className="inline-flex items-center px-3 py-1 rounded-lg bg-amber-400 border-2 border-slate-900 shadow-comic-sm font-comic text-xs uppercase tracking-wide text-slate-900 mb-2">
          Large Files Idle
        </div>
        <h3 className="font-comic text-xl text-slate-900 uppercase tracking-wide mb-1">
          No Storage Scouted Yet
        </h3>
        <p className="font-fredoka text-xs text-slate-600 max-w-sm font-semibold">
          Click <strong>ANALYZE</strong> to scout your drive and detect the top space consumers eating your disk capacity.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-7xl select-none font-sans text-slate-900">
      {/* Top Banner and Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white border-2.5 border-slate-900 rounded-2xl shadow-comic">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-amber-400 border-2 border-slate-900 shadow-comic-sm font-comic text-xs uppercase tracking-wide text-slate-900 mb-1">
            <FileText className="w-3.5 h-3.5" />
            <span>Heavyweight File Ranker</span>
          </div>
          <h2 className="font-comic text-xl text-slate-900 uppercase tracking-wider mt-1">
            Top Large Files Found
          </h2>
          <p className="text-xs font-fredoka font-semibold text-slate-600">
            Identify the largest disk space consumers consuming valuable drive capacity.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 flex-wrap gap-2">
          <div className="flex items-center space-x-2 text-xs font-fredoka font-bold">
            <span className="text-slate-700">Min Size:</span>
            <select
              value={thresholdMB}
              onChange={(e) => setThresholdMB(Number(e.target.value))}
              className="px-2.5 py-1.5 bg-slate-50 border-2 border-slate-900 rounded-xl font-comic text-xs uppercase text-slate-900 focus:outline-none"
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
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl border-2 border-slate-900 bg-white hover:bg-slate-100 font-comic text-xs uppercase text-slate-900 shadow-comic-sm transition-all"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>{sortOrder === 'desc' ? 'Largest First' : 'Smallest First'}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
        <div className="p-3.5 bg-white rounded-2xl border-2.5 border-slate-900 shadow-comic">
          <span className="font-comic text-[11px] uppercase tracking-wide text-slate-500">
            Files Above Threshold
          </span>
          <p className="text-2xl font-comic text-slate-900 mt-1">
            {filteredLargeFiles.length}
          </p>
        </div>

        <div className="p-3.5 bg-white rounded-2xl border-2.5 border-slate-900 shadow-comic">
          <span className="font-comic text-[11px] uppercase tracking-wide text-slate-500">
            Aggregated Size
          </span>
          <p className="text-2xl font-comic text-amber-600 mt-1">
            {formatBytes(totalLargeBytes, settings.unit)}
          </p>
        </div>

        <div className="p-3.5 bg-white rounded-2xl border-2.5 border-slate-900 shadow-comic col-span-2 md:col-span-1">
          <span className="font-comic text-[11px] uppercase tracking-wide text-slate-500">
            Largest Single File
          </span>
          <p className="text-2xl font-comic text-emerald-600 mt-1 truncate">
            {filteredLargeFiles[0]
              ? formatBytes(filteredLargeFiles[0].size_bytes, settings.unit)
              : '—'}
          </p>
        </div>
      </div>

      {/* Large Files Comic List */}
      <div className="bg-white rounded-2xl border-2.5 border-slate-900 shadow-comic divide-y-2 divide-slate-900 overflow-hidden">
        {filteredLargeFiles.map((file, idx) => (
          <div
            key={file.id}
            className="p-3 flex items-center justify-between hover:bg-amber-50 transition-colors"
          >
            <div className="flex items-center space-x-3 truncate mr-4">
              <span className="font-comic text-xs text-slate-500 w-8 shrink-0">
                #{idx + 1}
              </span>
              <div className="truncate">
                <div className="flex items-center space-x-2">
                  <span className="font-fredoka font-bold text-xs text-slate-900 truncate">
                    {file.name}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-comic uppercase border border-slate-900 ${getCategoryBadgeClass(
                      file.category
                    )}`}
                  >
                    {file.category}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-mono truncate mt-0.5">
                  {file.path}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 shrink-0">
              <div className="text-right">
                <span className="font-comic text-sm text-slate-900">
                  {formatBytes(file.size_bytes, settings.unit)}
                </span>
                <p className="text-[10px] font-fredoka font-semibold text-slate-500">
                  {formatDate(file.modified_at)}
                </p>
              </div>

              <button
                onClick={() => handleReveal(file.path)}
                className="p-1.5 rounded-lg border border-slate-900 bg-white hover:bg-amber-200 text-slate-900 shadow-comic-sm transition-colors"
                title="Reveal in native file explorer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        {filteredLargeFiles.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            <FileText className="w-10 h-10 mx-auto mb-2 text-slate-400" />
            <p className="font-comic text-sm uppercase text-slate-900">
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
