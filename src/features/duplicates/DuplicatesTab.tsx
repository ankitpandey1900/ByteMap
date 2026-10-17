import React, { useState, useEffect } from 'react';
import {
  Copy,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatBytes } from '@/lib/utils';
import { api } from '@/lib/api';
import { DuplicateGroup } from '@/types';

import { CardSpotlight, ShimmerButton } from '@/components/ui';

export const DuplicatesTab: React.FC = () => {
  const {
    scanSummary,
    settings,
    selectedCleanupIds,
    toggleCleanupSelection,
    setActiveTab,
  } = useAppStore();

  const [isHashing, setIsHashing] = useState(false);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>(
    scanSummary?.duplicate_groups || []
  );
  const [hashProgress, setHashProgress] = useState<{ processed: number; total: number }>({
    processed: 0,
    total: 0,
  });

  useEffect(() => {
    if (scanSummary?.duplicate_groups) {
      setDuplicateGroups(scanSummary.duplicate_groups);
    }
  }, [scanSummary]);

  const handleRunDuplicateSearch = async () => {
    setIsHashing(true);
    setHashProgress({ processed: 0, total: 0 });

    try {
      const unlisten = await api.onDuplicateProgress((proc, tot) => {
        setHashProgress({ processed: proc, total: tot });
      });

      const dups = await api.findDuplicates();
      setDuplicateGroups(dups);
      unlisten();
    } catch (err) {
      console.error('Duplicate detection failed:', err);
    } finally {
      setIsHashing(false);
    }
  };

  const handleReveal = async (path: string) => {
    try {
      await api.revealInFolder(path);
    } catch (err) {
      console.error('Failed to reveal file:', err);
    }
  };

  const totalReclaimable = duplicateGroups.reduce(
    (acc, g) => acc + g.reclaimable_bytes,
    0
  );

  if (!scanSummary) {
    return (
      <div className="space-y-6 max-w-5xl">
        <div className="p-4 bg-card/60 backdrop-blur border border-border/50 rounded-xl">
          <h2 className="text-lg font-bold text-foreground">Cryptographic Duplicate Detection</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Verified byte-for-byte using staged size pre-filtering and BLAKE3 cryptographic hashes.
          </p>
        </div>

        <CardSpotlight className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center">
          <Copy className="w-12 h-12 mb-3 text-purple-400/50 stroke-[1.4]" />
          <p className="text-sm font-semibold text-foreground">Scan Required for Duplicate Detection</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-md">
            All file traversal inventories live strictly in volatile memory. Start a scan on any drive or directory, then run the cryptographic duplicate detector.
          </p>
        </CardSpotlight>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Banner */}
      <div className="p-4 bg-card/60 backdrop-blur border border-border/50 rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">Cryptographic Duplicate Detection</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Verified byte-for-byte using staged size pre-filtering and BLAKE3 cryptographic hashes.
          </p>
        </div>

        <ShimmerButton
          onClick={handleRunDuplicateSearch}
          disabled={isHashing}
          className="shadow-purple-500/20"
        >
          {isHashing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>
                Hashing Candidates ({hashProgress.processed}/{hashProgress.total})...
              </span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>{duplicateGroups.length > 0 ? 'Re-scan Duplicates' : 'Find Duplicates'}</span>
            </>
          )}
        </ShimmerButton>
      </div>

      {/* Reclaimable summary banner */}
      {duplicateGroups.length > 0 && (
        <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center space-x-3">
            <Copy className="w-5 h-5 text-purple-400" />
            <div>
              <p className="font-semibold text-foreground text-sm">
                Found {duplicateGroups.length} duplicate groups
              </p>
              <p className="text-muted-foreground">
                Potential reclaimable storage:{' '}
                <span className="font-mono font-bold text-purple-300">
                  {formatBytes(totalReclaimable, settings.unit)}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('cleanup')}
            className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg font-medium transition-colors"
          >
            Go to Cleanup Hub
          </button>
        </div>
      )}

      {/* Duplicate Groups List */}
      <div className="space-y-4">
        {duplicateGroups.map((group, groupIdx) => (
          <div
            key={group.hash}
            className="p-4 bg-card/40 border border-border/50 rounded-xl space-y-3"
          >
            <div className="flex items-center justify-between text-xs border-b border-border/40 pb-2">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-foreground font-mono">
                  Group #{groupIdx + 1}
                </span>
                <span className="text-muted-foreground font-mono text-[11px] truncate max-w-xs">
                  Hash: {group.hash.slice(0, 16)}…
                </span>
              </div>
              <div className="flex items-center space-x-3 font-mono">
                <span>{group.files.length} copies</span>
                <span>•</span>
                <span className="text-purple-400 font-semibold">
                  +{formatBytes(group.reclaimable_bytes, settings.unit)} reclaimable
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {group.files.map((file, fileIdx) => {
                const isSelected = selectedCleanupIds.has(file.id);
                return (
                  <div
                    key={file.id}
                    className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition-colors ${
                      fileIdx === 0
                        ? 'bg-emerald-500/5 border-emerald-500/20'
                        : isSelected
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : 'bg-background/40 border-border/40 hover:bg-background/80'
                    }`}
                  >
                    <div className="flex items-center space-x-3 truncate mr-3">
                      <span className="font-mono text-muted-foreground w-4 text-center">
                        {fileIdx === 0 ? '★' : fileIdx + 1}
                      </span>
                      <div className="truncate">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-foreground truncate">
                            {file.name}
                          </span>
                          {fileIdx === 0 && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-medium">
                              Original Candidate
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground font-mono truncate">
                          {file.path}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      <span className="font-mono text-muted-foreground text-[11px]">
                        {formatBytes(file.size_bytes, settings.unit)}
                      </span>

                      <button
                        onClick={() => handleReveal(file.path)}
                        className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
                        title="Reveal in native file explorer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>

                      {fileIdx > 0 && (
                        <button
                          onClick={() => toggleCleanupSelection(file.id)}
                          className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                            isSelected
                              ? 'bg-amber-500 text-white border-amber-600'
                              : 'border-border/60 hover:bg-accent text-foreground'
                          }`}
                        >
                          {isSelected ? 'Marked' : 'Mark for cleanup'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {!isHashing && duplicateGroups.length === 0 && (
          <div className="p-10 text-center text-muted-foreground bg-card/40 rounded-xl border border-border/40">
            <Copy className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <h4 className="text-sm font-semibold text-foreground">No duplicates detected yet</h4>
            <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1 mb-4">
              Cryptographic duplicate searching is performed on-demand to preserve system I/O resources during normal scans.
            </p>
            <button
              onClick={handleRunDuplicateSearch}
              disabled={!scanSummary}
              className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-40 transition-all shadow-sm"
            >
              Analyze Duplicates Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
