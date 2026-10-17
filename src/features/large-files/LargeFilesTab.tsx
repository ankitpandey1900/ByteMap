import React, { useState, useMemo } from 'react';
import {
  FileText,
  ExternalLink,
  ArrowUpDown,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatBytes, formatDate, getCategoryBadgeClass } from '@/lib/utils';
import { api } from '@/lib/api';

import { CardSpotlight } from '@/components/ui';

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
      <div className="space-y-4 max-w-5xl">
        <div className="p-4 bg-card/60 backdrop-blur border border-border/50 rounded-xl">
          <h2 className="text-lg font-bold text-foreground">Large Files Ranking</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Identify the largest disk space consumers consuming valuable drive capacity.
          </p>
        </div>

        <CardSpotlight className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center">
          <FileText className="w-12 h-12 mb-3 text-primary/40 stroke-[1.4]" />
          <p className="text-sm font-semibold text-foreground">No Files Scanned Yet</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            Run a scan on any drive or directory to view top space-consuming files.
          </p>
        </CardSpotlight>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-5xl">
      {/* Top Banner and Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-card/60 backdrop-blur border border-border/50 rounded-xl">
        <div>
          <h2 className="text-lg font-bold text-foreground">Large Files Ranking</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Identify the largest disk space consumers consuming valuable drive capacity.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-muted-foreground">Min Size:</span>
            <select
              value={thresholdMB}
              onChange={(e) => setThresholdMB(Number(e.target.value))}
              className="px-2.5 py-1.5 bg-background border border-border/60 rounded-lg font-medium text-foreground focus:outline-none focus:border-primary"
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
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-border/60 hover:bg-accent text-xs font-medium text-foreground transition-colors"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>{sortOrder === 'desc' ? 'Largest first' : 'Smallest first'}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards with CardSpotlight */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <CardSpotlight color="rgba(59, 130, 246, 0.15)" className="p-3.5">
          <span className="text-[11px] text-muted-foreground uppercase font-medium">
            Files Above Threshold
          </span>
          <p className="text-xl font-bold font-mono text-foreground mt-1">
            {filteredLargeFiles.length}
          </p>
        </CardSpotlight>

        <CardSpotlight color="rgba(16, 185, 129, 0.15)" className="p-3.5">
          <span className="text-[11px] text-muted-foreground uppercase font-medium">
            Aggregated Size
          </span>
          <p className="text-xl font-bold font-mono text-primary mt-1">
            {formatBytes(totalLargeBytes, settings.unit)}
          </p>
        </CardSpotlight>

        <CardSpotlight color="rgba(6, 182, 212, 0.15)" className="p-3.5 col-span-2 md:col-span-1">
          <span className="text-[11px] text-muted-foreground uppercase font-medium">
            Largest Single File
          </span>
          <p className="text-xl font-bold font-mono text-cyan-400 mt-1 truncate">
            {filteredLargeFiles[0]
              ? formatBytes(filteredLargeFiles[0].size_bytes, settings.unit)
              : '—'}
          </p>
        </CardSpotlight>
      </div>

      {/* Large Files List */}
      <div className="bg-card/40 rounded-xl border border-border/50 divide-y divide-border/40 overflow-hidden">
        {filteredLargeFiles.map((file, idx) => (
          <div
            key={file.id}
            className="p-3.5 flex items-center justify-between hover:bg-accent/40 transition-colors group"
          >
            <div className="flex items-center space-x-3 truncate mr-4">
              <span className="text-xs font-mono text-muted-foreground w-6 shrink-0">
                #{idx + 1}
              </span>
              <div className="truncate">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-xs text-foreground truncate">
                    {file.name}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold border ${getCategoryBadgeClass(
                      file.category
                    )}`}
                  >
                    {file.category}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground font-mono truncate mt-0.5">
                  {file.path}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4 shrink-0">
              <div className="text-right">
                <span className="font-mono font-bold text-sm text-foreground">
                  {formatBytes(file.size_bytes, settings.unit)}
                </span>
                <p className="text-[10px] text-muted-foreground font-mono">
                  {formatDate(file.modified_at)}
                </p>
              </div>

              <button
                onClick={() => handleReveal(file.path)}
                className="p-2 rounded-lg border border-border/50 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                title="Reveal file in Windows Explorer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        {filteredLargeFiles.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium">No files found exceeding {thresholdMB} MB</p>
            <p className="text-xs text-muted-foreground mt-1">
              Try reducing the minimum size threshold.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
