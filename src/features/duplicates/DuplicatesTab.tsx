import React, { useState, useEffect } from 'react';
import {
  Copy,
  ExternalLink,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatBytes, cleanDisplayPath } from '@/lib/utils';
import { api } from '@/lib/api';
import { DuplicateGroup } from '@/types';

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
      <div className="flex flex-col items-center justify-center h-full min-h-[420px] p-8 text-center bg-white rounded-2xl border-2.5 border-slate-900 shadow-comic select-none">
        <div className="w-16 h-16 rounded-2xl bg-amber-400 border-2.5 border-slate-900 shadow-comic flex items-center justify-center mb-4">
          <Copy className="w-8 h-8 text-slate-900" />
        </div>
        <div className="inline-flex items-center px-3 py-1 rounded-lg bg-amber-400 border-2 border-slate-900 shadow-comic-sm font-comic text-xs uppercase tracking-wide text-slate-900 mb-2">
          Duplicate Engine Idle
        </div>
        <h3 className="font-comic text-xl text-slate-900 uppercase tracking-wide mb-1">
          Scan Required First
        </h3>
        <p className="font-fredoka text-xs text-slate-600 max-w-sm font-semibold">
          All scan data lives exclusively in volatile RAM. Start a scan on any drive or directory, then run the BLAKE3 duplicate engine.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full font-sans text-slate-900">
      {/* Top Banner Card */}
      <div className="p-4 bg-white border-2.5 border-slate-900 rounded-2xl shadow-comic flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-amber-400 border-2 border-slate-900 shadow-comic-sm font-bangers text-xs uppercase tracking-wider text-slate-900 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Cryptographic BLAKE3 Engine</span>
          </div>
          <h2 className="font-bangers text-2xl text-slate-900 uppercase tracking-wider mt-1">
            Byte-for-Byte Duplicate Detector
          </h2>
          <p className="text-xs font-comicNeue font-bold text-slate-600">
            Verified byte-for-byte using tiered size pre-filtering and BLAKE3 cryptographic hashes.
          </p>
        </div>

        <button
          onClick={handleRunDuplicateSearch}
          disabled={isHashing}
          className="flex items-center space-x-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 font-bangers text-sm uppercase tracking-wider border-2.5 border-slate-900 rounded-xl shadow-comic transition-all hover:-translate-y-0.5 active:translate-y-0.5 disabled:opacity-50"
        >
          {isHashing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>
                Hashing Candidates ({hashProgress.processed}/{hashProgress.total})...
              </span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>{duplicateGroups.length > 0 ? 'Re-scan Duplicates' : 'Find Duplicates'}</span>
            </>
          )}
        </button>
      </div>

      {/* Reclaimable summary banner */}
      {duplicateGroups.length > 0 && (
        <div className="p-4 bg-amber-100 border-2.5 border-slate-900 rounded-2xl shadow-comic flex items-center justify-between text-xs font-fredoka font-bold">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-amber-400 border-2 border-slate-900 flex items-center justify-center shrink-0 shadow-comic-sm">
              <Copy className="w-5 h-5 text-slate-900" />
            </div>
            <div>
              <p className="font-comic text-sm text-slate-900 uppercase">
                Found {duplicateGroups.length} duplicate groups
              </p>
              <p className="text-slate-700">
                Potential reclaimable storage:{' '}
                <span className="font-comic text-slate-900">
                  {formatBytes(totalReclaimable, settings.unit)}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('cleanup')}
            className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 border-2 border-slate-900 text-slate-900 rounded-xl font-comic text-xs uppercase shadow-comic-sm transition-all"
          >
            Go to Cleanup Hub
          </button>
        </div>
      )}

      {/* Duplicate Groups List */}
      <div className="space-y-3.5">
        {duplicateGroups.map((group, groupIdx) => (
          <div
            key={group.hash}
            className="p-4 bg-white border-2.5 border-slate-900 rounded-2xl shadow-comic space-y-2.5"
          >
            <div className="flex items-center justify-between text-xs border-b-2 border-slate-900 pb-2">
              <div className="flex items-center space-x-2">
                <span className="font-comic text-sm text-slate-900 uppercase">
                  Group #{groupIdx + 1}
                </span>
                <span className="text-slate-500 font-mono text-[11px] truncate max-w-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                  BLAKE3: {group.hash.slice(0, 16)}…
                </span>
              </div>
              <div className="flex items-center space-x-3 font-comic text-slate-900">
                <span>{group.files.length} copies</span>
                <span>•</span>
                <span className="text-emerald-700">
                  +{formatBytes(group.reclaimable_bytes, settings.unit)} Reclaimable
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {group.files.map((file, fileIdx) => {
                const isSelected = selectedCleanupIds.has(file.id);
                return (
                  <div
                    key={file.id}
                    className={`p-2.5 rounded-xl border-2 text-xs flex items-center justify-between transition-colors ${
                      fileIdx === 0
                        ? 'bg-emerald-50 border-emerald-600'
                        : isSelected
                        ? 'bg-amber-100 border-slate-900 shadow-comic-sm'
                        : 'bg-slate-50 border-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center space-x-3 truncate mr-3">
                      <span className="font-comic text-slate-500 w-5 text-center">
                        {fileIdx === 0 ? '★' : fileIdx + 1}
                      </span>
                      <div className="truncate">
                        <div className="flex items-center space-x-2">
                          <span className="font-comicNeue font-bold text-slate-900 truncate">
                            {file.name}
                          </span>
                          {fileIdx === 0 && (
                            <span className="px-2 py-0.5 rounded-md text-xs bg-emerald-400 border border-slate-900 text-slate-900 font-bangers uppercase tracking-wider shadow-comic-sm">
                              Original File
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono truncate" title={cleanDisplayPath(file.path)}>
                          {cleanDisplayPath(file.path)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      <span className="font-comic text-slate-800 text-xs">
                        {formatBytes(file.size_bytes, settings.unit)}
                      </span>

                      <button
                        onClick={() => handleReveal(file.path)}
                        className="p-1 rounded-lg border border-slate-900 bg-white hover:bg-amber-200 text-slate-900 shadow-comic-sm transition-colors"
                        title="Reveal in native file explorer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>

                      {fileIdx > 0 && (
                        <button
                          onClick={() => toggleCleanupSelection(file.id)}
                          className={`px-3 py-1 rounded-lg text-xs font-comic uppercase border-2 border-slate-900 transition-all ${
                            isSelected
                              ? 'bg-rose-500 text-white shadow-comic-sm'
                              : 'bg-white hover:bg-amber-200 text-slate-900 shadow-comic-sm'
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
          <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border-2.5 border-slate-900 shadow-comic">
            <Copy className="w-10 h-10 mx-auto mb-2 text-slate-400" />
            <h4 className="font-comic text-sm uppercase text-slate-900">No duplicates detected</h4>
            <p className="text-xs font-fredoka font-semibold text-slate-600 max-w-md mx-auto mt-1 mb-4">
              Cryptographic duplicate searching is performed on-demand across your scanned inventory.
            </p>
            <button
              onClick={handleRunDuplicateSearch}
              disabled={!scanSummary}
              className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 border-2 border-slate-900 text-slate-900 text-xs font-comic uppercase rounded-xl shadow-comic transition-all"
            >
              Analyze Duplicates Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
