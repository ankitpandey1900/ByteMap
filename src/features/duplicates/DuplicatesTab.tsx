import React, { useState, useEffect, useMemo } from 'react';
import {
  Copy,
  ExternalLink,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import {
  formatBytes,
  formatDate,
  cleanDisplayPath,
  getFileIntelligence,
} from '@/lib/utils';
import { api, CleanupExecutionResult } from '@/lib/api';
import { DuplicateGroup, ScannedFile } from '@/types';
import { CategoryIcon } from '@/components/CategoryIcon';
import { EmptyScanState } from '@/components/EmptyScanState';

interface DuplicatesTabProps {
  onOpenScanModal?: () => void;
}

export const DuplicatesTab: React.FC<DuplicatesTabProps> = ({ onOpenScanModal }) => {
  const {
    scanSummary,
    settings,
    selectedCleanupIds,
    toggleCleanupSelection,
    selectAllCleanup,
    clearCleanupSelection,
    applyCleanupResult,
  } = useAppStore();

  const [isHashing, setIsHashing] = useState(false);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>(
    scanSummary?.duplicate_groups || []
  );
  const [hashProgress, setHashProgress] = useState<{ processed: number; total: number }>({
    processed: 0,
    total: 0,
  });

  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [lastResult, setLastResult] = useState<CleanupExecutionResult | null>(null);

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

  const getLocationBadge = (filePath: string) => {
    const p = filePath.toLowerCase();
    if (p.includes('\\downloads\\') || p.includes('/downloads/')) {
      return { label: '📥 Downloads', color: 'bg-blue-100 text-blue-950 border-blue-400' };
    }
    if (p.includes('\\desktop\\') || p.includes('/desktop/')) {
      return { label: '🖥️ Desktop', color: 'bg-purple-100 text-purple-950 border-purple-400' };
    }
    if (p.includes('\\documents\\') || p.includes('/documents/')) {
      return { label: '📄 Documents', color: 'bg-emerald-100 text-emerald-950 border-emerald-400' };
    }
    if (p.includes('\\appdata\\') || p.includes('/library/application support/')) {
      return { label: '⚙️ App Cache / Data', color: 'bg-amber-100 text-amber-950 border-amber-400' };
    }
    if (p.includes('program files') || p.includes('/applications/')) {
      return { label: '📦 Installed App', color: 'bg-rose-100 text-rose-950 border-rose-400' };
    }
    return null;
  };

  // Flatten all duplicate copies that can be selected (excluding the index 0 original file)
  const allCandidateCopies = useMemo(() => {
    const list: ScannedFile[] = [];
    duplicateGroups.forEach((g) => {
      g.files.slice(1).forEach((f) => list.push(f));
    });
    return list;
  }, [duplicateGroups]);

  // Selected duplicate files
  const selectedDuplicateFiles = useMemo(() => {
    return allCandidateCopies.filter((f) => selectedCleanupIds.has(f.id));
  }, [allCandidateCopies, selectedCleanupIds]);

  const totalSelectedBytes = useMemo(() => {
    return selectedDuplicateFiles.reduce((acc, f) => acc + f.size_bytes, 0);
  }, [selectedDuplicateFiles]);

  const totalReclaimable = useMemo(() => {
    return duplicateGroups.reduce((acc, g) => acc + g.reclaimable_bytes, 0);
  }, [duplicateGroups]);

  // Select all safe copies (excluding original files and excluding system/app dependency files)
  const handleSelectAllSafe = () => {
    const safeIds: string[] = [];
    duplicateGroups.forEach((g) => {
      g.files.slice(1).forEach((file) => {
        const intel = getFileIntelligence(file.name, file.path);
        if (!intel.isDependency && !intel.isSystem) {
          safeIds.push(file.id);
        }
      });
    });
    selectAllCleanup(safeIds);
  };

  // Direct cleanup execution from Duplicates tab
  const handleExecuteDelete = async () => {
    if (selectedDuplicateFiles.length === 0) return;

    setIsDeleting(true);
    setShowConfirmModal(false);

    try {
      const targets = selectedDuplicateFiles.map((f) => ({
        path: f.path,
        expected_size: f.size_bytes,
      }));

      const res = await api.executeCleanup(targets, settings.prefer_trash);
      setLastResult(res);

      const successPaths = new Set(
        res.results.filter((r) => r.success).map((r) => r.path.toLowerCase())
      );
      const pathBytesMap: Record<string, number> = {};
      res.results.filter((r) => r.success).forEach((r) => {
        pathBytesMap[r.path] = r.bytes_freed;
      });

      // Update in-memory storage gauges and scanSummary with 0ms delay
      applyCleanupResult(
        res.total_freed_bytes,
        res.results.filter((r) => r.success).map((r) => r.path),
        pathBytesMap,
        settings.prefer_trash
      );

      // Prune local duplicate groups
      setDuplicateGroups((prev) =>
        prev
          .map((group) => {
            const remaining = group.files.filter(
              (f) => !successPaths.has(f.path.toLowerCase())
            );
            const reclaimable =
              remaining.length > 1
                ? (remaining.length - 1) * remaining[0].size_bytes
                : 0;
            return {
              ...group,
              files: remaining,
              reclaimable_bytes: reclaimable,
            };
          })
          .filter((group) => group.files.length > 1)
      );

      clearCleanupSelection();
    } catch (err) {
      console.error('Failed to clean selected duplicates:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!scanSummary) {
    return (
      <EmptyScanState
        badge="Duplicate Engine Idle"
        title="Scan Required First"
        description="Run a scan on any drive or directory, then launch the cryptographic BLAKE3 duplicate detector across the scanned tree."
        onStartScan={onOpenScanModal}
      />
    );
  }

  return (
    <div className="space-y-4 w-full font-sans text-slate-900">
      {/* Top Banner Card */}
      <div className="p-4 bg-white border-2.5 border-slate-900 rounded-2xl shadow-comic flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-amber-400 dark:!bg-[#1b2232] border-2 border-slate-900 dark:!border-white/[0.12] shadow-comic-sm font-bangers text-xs uppercase tracking-wider text-slate-900 dark:!text-slate-200 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5] dark:text-amber-400" />
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
          className="flex items-center space-x-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 font-bangers text-sm uppercase tracking-wider border-2.5 border-slate-900 rounded-xl shadow-comic transition-all hover:-translate-y-0.5 active:translate-y-0.5 disabled:opacity-50 cursor-pointer"
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

      {/* Success Notice after Cleanup */}
      {lastResult && (
        <div className="p-3.5 bg-emerald-100 border-2.5 border-slate-900 rounded-2xl shadow-comic flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-fredoka font-bold text-emerald-950">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              Successfully cleaned {lastResult.successful_count} duplicate files and reclaimed{' '}
              <strong className="font-comic text-emerald-900">{formatBytes(lastResult.total_freed_bytes, settings.unit)}</strong>!
            </span>
          </div>
          <button
            onClick={() => setLastResult(null)}
            className="text-xs font-comic uppercase text-emerald-800 hover:text-emerald-950 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Reclaimable summary banner & Action Toolbar */}
      {duplicateGroups.length > 0 && (
        <div className="p-3.5 bg-amber-100 border-2.5 border-slate-900 rounded-2xl shadow-comic flex flex-wrap items-center justify-between gap-3 text-xs font-fredoka font-bold">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400 dark:!bg-[#1e2638] border-2 border-slate-900 dark:!border-white/[0.12] flex items-center justify-center shrink-0 shadow-comic-sm">
              <Copy className="w-5 h-5 text-slate-900 dark:!text-amber-400" />
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

          {/* Quick Selection and Direct Action Buttons */}
          <div className="flex items-center space-x-2 flex-wrap gap-1.5">
            <button
              onClick={handleSelectAllSafe}
              className="px-3 py-1.5 bg-white hover:bg-amber-200 border-1.5 border-slate-900 text-slate-900 rounded-xl font-comic text-xs uppercase shadow-xs transition-all cursor-pointer flex items-center space-x-1"
              title="Automatically selects duplicate copies while keeping the original and sparing app libraries"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Select Safe Copies</span>
            </button>

            {selectedDuplicateFiles.length > 0 && (
              <>
                <button
                  onClick={clearCleanupSelection}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border-1.5 border-slate-900 text-slate-700 rounded-xl font-comic text-xs uppercase shadow-xs cursor-pointer"
                >
                  Clear Selection
                </button>

                {/* Direct Action: Delete Marked Duplicates Now */}
                <button
                  onClick={() => setShowConfirmModal(true)}
                  disabled={isDeleting}
                  className="flex items-center space-x-1.5 px-4 py-1.5 bg-rose-500 hover:bg-rose-400 text-white font-bangers text-xs uppercase tracking-wider border-2 border-slate-900 rounded-xl shadow-comic transition-all hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>
                    Trash Marked ({selectedDuplicateFiles.length} • {formatBytes(totalSelectedBytes, settings.unit)})
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Duplicate Groups List */}
      <div className="space-y-4">
        {duplicateGroups.map((group, groupIdx) => (
          <div
            key={group.hash}
            className="p-4 bg-white border-2.5 border-slate-900 rounded-2xl shadow-comic space-y-3"
          >
            <div className="flex items-center justify-between text-xs border-b-2 border-slate-900 pb-2 flex-wrap gap-2">
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

            <div className="space-y-2.5">
              {group.files.map((file, fileIdx) => {
                const isSelected = selectedCleanupIds.has(file.id);
                const isOriginal = fileIdx === 0;
                const intel = getFileIntelligence(file.name, file.path);
                const locBadge = getLocationBadge(file.path);

                return (
                  <div
                    key={file.id}
                    className={`p-3 rounded-xl border-2 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${
                      isOriginal
                        ? 'bg-emerald-50 border-emerald-600 shadow-xs'
                        : isSelected
                        ? 'bg-amber-100 border-slate-900 shadow-comic-sm'
                        : 'bg-slate-50 border-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-start space-x-3 truncate flex-1 min-w-0">
                      <span className="font-comic text-slate-600 w-5 text-center mt-1 shrink-0 font-bold">
                        {isOriginal ? '★' : fileIdx + 1}
                      </span>

                      <div className="shrink-0 p-1 bg-white border-1.5 border-slate-900 rounded-lg shadow-xs mt-0.5">
                        <CategoryIcon category={file.category} className="w-4 h-4" />
                      </div>

                      <div className="truncate flex-1 min-w-0">
                        <div className="flex items-center space-x-2 flex-wrap gap-1">
                          <span className="font-comicNeue font-bold text-sm text-slate-900 truncate">
                            {file.name}
                          </span>

                          {isOriginal && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] bg-emerald-400 dark:!bg-[#141923] border border-slate-900 dark:!border-emerald-500/45 text-slate-900 dark:!text-emerald-400 font-bangers uppercase tracking-wider shadow-xs">
                              Original File (Safe - Keep)
                            </span>
                          )}

                          {/* Critical Software Dependency Warning */}
                          {intel.isDependency && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] bg-rose-200 dark:!bg-[#141923] border border-slate-900 dark:!border-rose-500/45 text-rose-950 dark:!text-rose-400 font-fredoka font-bold shadow-xs flex items-center space-x-1">
                              <ShieldAlert className="w-3 h-3 text-rose-700 dark:!text-rose-400" />
                              <span>App Dependency (Keep — Do Not Delete)</span>
                            </span>
                          )}
                        </div>

                        <p
                          className="text-[11px] text-slate-500 font-mono truncate mt-0.5"
                          title={cleanDisplayPath(file.path)}
                        >
                          {cleanDisplayPath(file.path)}
                        </p>

                        <div className="flex items-center space-x-2 text-[10px] font-fredoka font-semibold text-slate-500 mt-1 flex-wrap gap-1">
                          <span>📅 Modified: {formatDate(file.modified_at)}</span>
                          <span>•</span>
                          <span className="uppercase">{file.category}</span>
                          {locBadge && (
                            <>
                              <span>•</span>
                              <span
                                className={`px-1.5 py-[1px] rounded border font-bold ${locBadge.color}`}
                              >
                                {locBadge.label}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0 justify-end">
                      <span className="font-mono font-bold text-slate-800 text-xs tabular-nums">
                        {formatBytes(file.size_bytes, settings.unit)}
                      </span>

                      <button
                        onClick={() => handleReveal(file.path)}
                        className="p-1.5 rounded-lg border border-slate-900 bg-white hover:bg-amber-200 text-slate-900 shadow-xs transition-colors cursor-pointer"
                        title="Reveal file in File Explorer / Finder"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>

                      {!isOriginal && (
                        intel.isDependency ? (
                          <span
                            className="px-2.5 py-1 rounded-lg text-[10px] font-fredoka font-bold bg-slate-200 dark:!bg-white/[0.04] border border-slate-400 dark:!border-white/10 text-slate-600 dark:!text-slate-400 cursor-not-allowed"
                            title="This file is required by installed software and should not be deleted."
                          >
                            Required Dependency
                          </span>
                        ) : (
                          <button
                            onClick={() => toggleCleanupSelection(file.id)}
                            className={`px-3 py-1 rounded-lg text-xs font-comic uppercase border-2 border-slate-900 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-rose-500 text-white shadow-comic-sm'
                                : 'bg-white hover:bg-rose-100 text-slate-900 shadow-comic-sm'
                            }`}
                          >
                            {isSelected ? 'Marked for Deletion' : 'Mark for Trash'}
                          </button>
                        )
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
              className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 border-2 border-slate-900 text-slate-900 text-xs font-comic uppercase rounded-xl shadow-comic transition-all cursor-pointer"
            >
              Analyze Duplicates Now
            </button>
          </div>
        )}
      </div>

      {/* Sticky Floating Action Dock when duplicates are marked */}
      {selectedDuplicateFiles.length > 0 && (
        <div className="sticky bottom-4 z-40 p-3.5 bg-slate-900 text-white border-2.5 border-slate-900 rounded-2xl shadow-comic-lg flex items-center justify-between flex-wrap gap-3 animate-comic-pop">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400 border border-slate-900 flex items-center justify-center text-slate-900 shrink-0 font-bangers text-base shadow-xs">
              {selectedDuplicateFiles.length}
            </div>
            <div>
              <p className="font-bangers text-sm uppercase tracking-wider text-amber-300">
                {selectedDuplicateFiles.length} Duplicate Copies Marked For Deletion
              </p>
              <p className="text-xs font-fredoka font-bold text-slate-300">
                Reclaimable Space:{' '}
                <strong className="text-emerald-400 font-mono text-sm">
                  {formatBytes(totalSelectedBytes, settings.unit)}
                </strong>{' '}
                <span className="text-slate-400 font-normal">
                  (Originals 100% preserved)
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={clearCleanupSelection}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-xl font-comic text-xs uppercase cursor-pointer transition-colors"
            >
              Clear
            </button>
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={isDeleting}
              className="flex items-center space-x-1.5 px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white font-bangers text-xs uppercase tracking-wider border-2 border-white/40 rounded-xl shadow-comic hover:-translate-y-0.5 cursor-pointer transition-all disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>
                {settings.prefer_trash
                  ? 'Move Marked to Trash Now'
                  : 'Permanently Delete Marked'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Direct Deletion Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border-3 border-slate-900 p-6 max-w-md w-full shadow-comic-lg space-y-4 animate-comic-pop">
            <div className="flex items-center space-x-3 text-rose-600">
              <AlertTriangle className="w-8 h-8 shrink-0" />
              <div>
                <h3 className="font-bangers text-xl text-slate-900 uppercase tracking-wide">
                  Move Duplicate Copies to Trash?
                </h3>
                <p className="text-xs font-fredoka font-bold text-slate-600">
                  {settings.prefer_trash
                    ? 'Target files will be moved safely to your OS Recycle Bin / Trash.'
                    : 'Target files will be permanently deleted from disk.'}
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border-2 border-slate-900 rounded-xl space-y-1.5 text-xs font-fredoka">
              <div className="flex justify-between font-bold text-slate-900">
                <span>Selected duplicate copies:</span>
                <span className="font-comic">{selectedDuplicateFiles.length} files</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900">
                <span>Disk space to reclaim:</span>
                <span className="font-comic text-emerald-700">
                  {formatBytes(totalSelectedBytes, settings.unit)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 text-[11px] pt-1 border-t border-slate-300">
                <span>Original copies:</span>
                <span className="text-emerald-700 font-bold">100% Preserved</span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 border-2 border-slate-900 rounded-xl font-comic text-xs uppercase hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteDelete}
                disabled={isDeleting}
                className="flex items-center space-x-2 px-5 py-2 bg-rose-500 hover:bg-rose-400 text-white font-bangers text-sm uppercase tracking-wider border-2 border-slate-900 rounded-xl shadow-comic transition-all cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Cleaning...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Confirm & Move to Trash</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
