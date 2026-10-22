import React, { useState, useEffect, useRef } from 'react';
import {
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Info,
  Archive,
  Download,
  Terminal,
  FileQuestion,
  Loader2,
  CheckSquare,
  Square,
  Code2,
  FolderMinus,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatBytes, cleanDisplayPath } from '@/lib/utils';
import { api, CleanupExecutionResult } from '@/lib/api';
import { RiskLevel } from '@/types';
import { DevArtifactsCard } from './DevArtifactsCard';
import { EmptyFoldersCard } from './EmptyFoldersCard';
import { DevCachesCard } from './DevCachesCard';

export const CleanupTab: React.FC = () => {
  const {
    scanSummary,
    settings,
    selectedCleanupIds,
    toggleCleanupSelection,
    selectAllCleanup,
    clearCleanupSelection,
    applyCleanupResult,
  } = useAppStore();

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const [cleanupView, setCleanupView] = useState<'dev_caches' | 'junk' | 'dev' | 'empty'>('dev_caches');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [isExecuting, setIsExecuting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [lastResult, setLastResult] = useState<CleanupExecutionResult | null>(null);

  const candidates = scanSummary?.cleanup_candidates || [];

  const filteredCandidates = candidates.filter((c) => {
    if (activeFilter === 'all') return true;
    return c.type === activeFilter;
  });

  const selectedCandidates = candidates.filter((c) =>
    selectedCleanupIds.has(c.id)
  );

  const totalSelectedBytes = selectedCandidates.reduce(
    (acc, c) => acc + c.file.size_bytes,
    0
  );

  const handleExecute = async () => {
    if (selectedCandidates.length === 0) return;

    setIsExecuting(true);
    setShowConfirmModal(false);

    try {
      const targets = selectedCandidates.map((c) => ({
        path: c.file.path,
        expected_size: c.file.size_bytes,
      }));

      const res = await api.executeCleanup(targets, settings.prefer_trash);
      if (isMountedRef.current) {
        setLastResult(res);
      }
      clearCleanupSelection();

      // LIVE STORAGE SYNCHRONIZER: Update storage gauges & metrics immediately!
      const successPaths = res.results.filter((r) => r.success).map((r) => r.path);
      applyCleanupResult(res.total_freed_bytes, successPaths);
    } catch (err) {
      console.error('Cleanup execution failed:', err);
    } finally {
      if (isMountedRef.current) {
        setIsExecuting(false);
      }
    }
  };

  const handleReveal = async (path: string) => {
    try {
      await api.revealInFolder(path);
    } catch (err) {
      console.error('Failed to reveal file:', err);
    }
  };

  const getRiskBadge = (level: RiskLevel) => {
    switch (level) {
      case 'safe':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-comic uppercase bg-emerald-400 text-slate-900 border border-slate-900 shadow-comic-sm">
            Safe
          </span>
        );
      case 'low':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-comic uppercase bg-sky-300 text-slate-900 border border-slate-900 shadow-comic-sm">
            Low Risk
          </span>
        );
      case 'moderate':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-comic uppercase bg-amber-400 text-slate-900 border border-slate-900 shadow-comic-sm">
            Moderate
          </span>
        );
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'temp_file':
        return <Trash2 className="w-4 h-4 text-emerald-600" />;
      case 'old_installer':
        return <Terminal className="w-4 h-4 text-blue-600" />;
      case 'large_archive':
        return <Archive className="w-4 h-4 text-amber-600" />;
      case 'large_download':
        return <Download className="w-4 h-4 text-purple-600" />;
      default:
        return <FileQuestion className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-4 w-full font-sans text-slate-900">
      {/* Top Banner Card */}
      <div className="p-4 bg-white border-2.5 border-slate-900 rounded-2xl shadow-comic flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-amber-400 border-2 border-slate-900 shadow-comic-sm font-bangers text-xs uppercase tracking-wider text-slate-900 mb-1">
            <Trash2 className="w-3.5 h-3.5" />
            <span>Safe Cleanup Intelligence Hub</span>
          </div>
          <h2 className="font-bangers text-2xl text-slate-900 uppercase tracking-wider mt-1">
            Reclaim Valuable Disk Space
          </h2>
          <p className="text-xs font-comicNeue font-bold text-slate-600">
            Conservative recommendations for space recovery. Clear coding & IDE caches, project builds, and temporary junk safely.
          </p>
        </div>

        {cleanupView === 'junk' && scanSummary && (
          <div className="flex items-center space-x-3">
            {selectedCleanupIds.size > 0 ? (
              <button
                onClick={() => setShowConfirmModal(true)}
                disabled={isExecuting}
                className="flex items-center space-x-2 px-5 py-2.5 bg-rose-500 hover:bg-rose-400 text-white font-bangers text-sm uppercase tracking-wider border-2.5 border-slate-900 rounded-xl shadow-comic transition-all hover:-translate-y-0.5 active:translate-y-0.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>
                  Clean Selected ({selectedCleanupIds.size} files • {formatBytes(totalSelectedBytes, settings.unit)})
                </span>
              </button>
            ) : (
              <button
                onClick={() => selectAllCleanup()}
                className="px-4 py-2 bg-amber-300 hover:bg-amber-400 border-2 border-slate-900 font-bangers text-sm uppercase tracking-wider text-slate-900 rounded-xl shadow-comic-sm transition-all cursor-pointer"
              >
                Select All Recommendations
              </button>
            )}
          </div>
        )}
      </div>

      {/* Execution Feedback Banner */}
      {lastResult && (
        <div className="p-4 bg-emerald-100 border-2.5 border-slate-900 rounded-2xl shadow-comic flex items-center justify-between text-xs font-fredoka font-bold">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-400 border-2 border-slate-900 flex items-center justify-center shrink-0 shadow-comic-sm">
              <CheckCircle2 className="w-5 h-5 text-slate-900" />
            </div>
            <div>
              <p className="font-comic text-sm text-slate-900 uppercase">
                Cleanup completed: {formatBytes(lastResult.total_freed_bytes, settings.unit)} recovered!
              </p>
              <p className="text-slate-700">
                Processed {lastResult.successful_count} targets
                {lastResult.failed_count > 0 && ` (${lastResult.failed_count} failed)`}
                {settings.prefer_trash ? ' • Moved safely to Recycle Bin' : ' • Deleted'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setLastResult(null)}
            className="px-2.5 py-1 rounded-lg border border-slate-900 bg-white hover:bg-slate-50 font-comic text-[10px] uppercase shadow-comic-sm cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Cleanup Sub-Station Selector Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border-2.5 border-slate-900 shadow-comic-sm">
        <button
          onClick={() => setCleanupView('dev_caches')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl border-2 border-slate-900 font-comic text-xs uppercase tracking-wide transition-all cursor-pointer ${
            cleanupView === 'dev_caches'
              ? 'bg-sky-400 text-slate-900 shadow-comic -translate-y-0.5'
              : 'bg-white hover:bg-sky-100 text-slate-700 shadow-comic-sm'
          }`}
        >
          <Sparkles className="w-4 h-4 text-sky-800" />
          <span>Coding & IDE Caches</span>
        </button>

        <button
          onClick={() => setCleanupView('junk')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl border-2 border-slate-900 font-comic text-xs uppercase tracking-wide transition-all cursor-pointer ${
            cleanupView === 'junk'
              ? 'bg-amber-400 text-slate-900 shadow-comic -translate-y-0.5'
              : 'bg-white hover:bg-amber-100 text-slate-700 shadow-comic-sm'
          }`}
        >
          <Trash2 className="w-4 h-4 text-slate-900" />
          <span>Junk & Temp Files ({candidates.length})</span>
        </button>

        <button
          onClick={() => setCleanupView('dev')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl border-2 border-slate-900 font-comic text-xs uppercase tracking-wide transition-all cursor-pointer ${
            cleanupView === 'dev'
              ? 'bg-purple-400 text-slate-900 shadow-comic -translate-y-0.5'
              : 'bg-white hover:bg-purple-100 text-slate-700 shadow-comic-sm'
          }`}
        >
          <Code2 className="w-4 h-4 text-purple-700" />
          <span>Developer Build Bloat</span>
        </button>

        <button
          onClick={() => setCleanupView('empty')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl border-2 border-slate-900 font-comic text-xs uppercase tracking-wide transition-all cursor-pointer ${
            cleanupView === 'empty'
              ? 'bg-emerald-400 text-slate-900 shadow-comic -translate-y-0.5'
              : 'bg-white hover:bg-emerald-100 text-slate-700 shadow-comic-sm'
          }`}
        >
          <FolderMinus className="w-4 h-4 text-emerald-700" />
          <span>Empty Folders & Ghosts</span>
        </button>
      </div>

      {/* 1. Dedicated Coding & IDE Caches Sweeper (Available Immediately) */}
      {cleanupView === 'dev_caches' && (
        <DevCachesCard
          preferTrash={settings.prefer_trash}
          unit={settings.unit}
          onCleanupComplete={(summary) => {
            setLastResult({
              total_freed_bytes: summary.total_freed_bytes,
              successful_count: summary.successful_count,
              failed_count: summary.failed_count,
              results: summary.results.map((r) => ({
                path: r.path,
                success: r.success,
                bytes_freed: r.bytes_freed,
                error: r.error,
              })),
            });
          }}
        />
      )}

      {/* For views requiring a scanned drive inventory */}
      {cleanupView !== 'dev_caches' && !scanSummary && (
        <div className="flex flex-col items-center justify-center h-full min-h-[380px] p-8 text-center bg-white rounded-2xl border-2.5 border-slate-900 shadow-comic select-none">
          <div className="w-16 h-16 rounded-2xl bg-amber-400 border-2.5 border-slate-900 shadow-comic flex items-center justify-center mb-4">
            <Trash2 className="w-8 h-8 text-slate-900" />
          </div>
          <div className="inline-flex items-center px-3 py-1 rounded-lg bg-amber-400 border-2 border-slate-900 shadow-comic-sm font-comic text-xs uppercase tracking-wide text-slate-900 mb-2">
            Drive Scan Required
          </div>
          <h3 className="font-comic text-xl text-slate-900 uppercase tracking-wide mb-1">
            Drive Scout Not Performed
          </h3>
          <p className="font-fredoka text-xs text-slate-600 max-w-sm font-semibold">
            Click <strong>ANALYZE</strong> to scout your drive and detect safe reclaimable files, obsolete installers, and temp files. Or switch to <strong>Coding & IDE Caches</strong> above to purge developer caches right away.
          </p>
        </div>
      )}

      {/* 2. Developer Artifacts Sweeper View */}
      {cleanupView === 'dev' && scanSummary && (
        <DevArtifactsCard
          folders={scanSummary.largest_folders}
          preferTrash={settings.prefer_trash}
          unit={settings.unit}
          onCleanupComplete={(res) => {
            setLastResult(res);
            const successPaths = res.results.filter((r) => r.success).map((r) => r.path);
            applyCleanupResult(res.total_freed_bytes, successPaths);
          }}
        />
      )}

      {/* 3. Empty Folders & Zero-Byte Ghosts View */}
      {cleanupView === 'empty' && scanSummary && (
        <EmptyFoldersCard
          folders={scanSummary.largest_folders}
          largestFiles={scanSummary.largest_files}
          preferTrash={settings.prefer_trash}
          onCleanupComplete={(res) => {
            setLastResult(res);
            const successPaths = res.results.filter((r) => r.success).map((r) => r.path);
            applyCleanupResult(res.total_freed_bytes, successPaths);
          }}
        />
      )}

      {/* 4. Safe Junk & Cache Recommendations View */}
      {cleanupView === 'junk' && scanSummary && (
        <>
          {/* Filter Tabs */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
            {['all', 'temp_file', 'old_installer', 'large_archive', 'large_download'].map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3 py-1.5 rounded-xl border-2 border-slate-900 font-comic text-xs uppercase tracking-wide transition-all cursor-pointer ${
                  activeFilter === f
                    ? 'bg-amber-400 text-slate-900 shadow-comic translate-y-[-1px]'
                    : 'bg-white hover:bg-amber-100 text-slate-700 shadow-comic-sm'
                }`}
              >
                {f === 'all' ? 'All Candidates' : f.replace('_', ' ')}
              </button>
            ))}

            {selectedCleanupIds.size > 0 && (
              <button
                onClick={clearCleanupSelection}
                className="text-xs font-comic uppercase text-slate-700 hover:text-rose-600 underline ml-auto shrink-0 cursor-pointer"
              >
                Clear selection ({selectedCleanupIds.size})
              </button>
            )}
          </div>

          {/* Candidates List */}
          <div className="space-y-2.5">
            {filteredCandidates.map((candidate) => {
              const isSelected = selectedCleanupIds.has(candidate.id);
              return (
                <div
                  key={candidate.id}
                  onClick={() => toggleCleanupSelection(candidate.id)}
                  className={`p-3.5 rounded-2xl border-2 border-slate-900 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-amber-100 shadow-comic'
                      : 'bg-white shadow-comic-sm hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start space-x-3 truncate">
                    <button
                      type="button"
                      className="mt-0.5 text-slate-900 shrink-0 cursor-pointer"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-amber-600 fill-amber-300" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-500" />
                      )}
                    </button>

                    <div className="truncate">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(candidate.type)}
                        <h4 className="font-comic text-xs uppercase tracking-wide text-slate-900 truncate font-bold">
                          {candidate.title}
                        </h4>
                        {getRiskBadge(candidate.risk_level)}
                      </div>

                      <p className="text-[11px] font-fredoka font-semibold text-slate-600 mt-1 line-clamp-1">
                        {candidate.description}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono truncate mt-0.5" title={cleanDisplayPath(candidate.file.path)}>
                        {cleanDisplayPath(candidate.file.path)}
                      </p>
                      <p className="text-[10px] font-fredoka font-bold text-amber-700 mt-1 flex items-center">
                        <Info className="w-3 h-3 mr-1 shrink-0" />
                        {candidate.risk_explanation}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 shrink-0 pl-8 md:pl-0">
                    <span className="font-comic text-sm font-bold text-slate-900">
                      {formatBytes(candidate.file.size_bytes, settings.unit)}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReveal(candidate.file.path);
                      }}
                      className="p-1 rounded-lg border border-slate-900 bg-white hover:bg-amber-200 text-slate-900 shadow-comic-sm transition-colors cursor-pointer"
                      title="Reveal in native file explorer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredCandidates.length === 0 && (
              <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border-2.5 border-slate-900 shadow-comic">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
                <h4 className="font-comic text-sm uppercase text-slate-900">No candidates found</h4>
                <p className="text-xs font-fredoka font-semibold text-slate-600">
                  No {activeFilter === 'all' ? 'cleanup' : activeFilter.replace('_', ' ')} candidates detected in the current scan.
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-3 border-slate-900 rounded-3xl p-6 max-w-md w-full shadow-comic space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-400 border-2.5 border-slate-900 flex items-center justify-center shadow-comic-sm shrink-0">
                <AlertTriangle className="w-6 h-6 text-slate-900" />
              </div>
              <div>
                <h3 className="font-comic text-xl uppercase tracking-wide text-slate-900">
                  Confirm Cleanup
                </h3>
                <p className="text-xs font-fredoka font-semibold text-slate-600">
                  {settings.prefer_trash
                    ? 'Selected files will be moved to OS Recycle Bin.'
                    : 'WARNING: Files will be permanently deleted!'}
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border-2 border-slate-900 rounded-xl space-y-1 text-xs font-fredoka">
              <div className="flex justify-between font-bold text-slate-900">
                <span>Selected files:</span>
                <span className="font-comic">{selectedCandidates.length}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900">
                <span>Total space to recover:</span>
                <span className="font-comic text-emerald-700">
                  {formatBytes(totalSelectedBytes, settings.unit)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl border-2 border-slate-900 bg-slate-100 hover:bg-slate-200 font-comic text-xs uppercase shadow-comic-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecute}
                disabled={isExecuting}
                className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-comic text-xs uppercase border-2 border-slate-900 shadow-comic cursor-pointer"
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Cleaning...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm & Clean</span>
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
