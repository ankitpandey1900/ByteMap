import React, { useState } from 'react';
import {
  Trash2,
  AlertTriangle,
  ShieldCheck,
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
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatBytes, cleanDisplayPath } from '@/lib/utils';
import { api, CleanupExecutionResult } from '@/lib/api';
import { RiskLevel } from '@/types';

export const CleanupTab: React.FC = () => {
  const {
    scanSummary,
    settings,
    selectedCleanupIds,
    toggleCleanupSelection,
    selectAllCleanup,
    clearCleanupSelection,
  } = useAppStore();

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
      setLastResult(res);
      clearCleanupSelection();
    } catch (err) {
      console.error('Cleanup execution failed:', err);
    } finally {
      setIsExecuting(false);
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

  if (!scanSummary) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[420px] p-8 text-center bg-white rounded-2xl border-2.5 border-slate-900 shadow-comic select-none">
        <div className="w-16 h-16 rounded-2xl bg-amber-400 border-2.5 border-slate-900 shadow-comic flex items-center justify-center mb-4">
          <Trash2 className="w-8 h-8 text-slate-900" />
        </div>
        <div className="inline-flex items-center px-3 py-1 rounded-lg bg-amber-400 border-2 border-slate-900 shadow-comic-sm font-comic text-xs uppercase tracking-wide text-slate-900 mb-2">
          Cleanup Station Idle
        </div>
        <h3 className="font-comic text-xl text-slate-900 uppercase tracking-wide mb-1">
          No Storage Scouted Yet
        </h3>
        <p className="font-fredoka text-xs text-slate-600 max-w-sm font-semibold">
          Click <strong>ANALYZE</strong> to scout your drive and detect safe reclaimable files, obsolete installers, and temp files.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full select-none font-sans text-slate-900">
      {/* Top Banner Card */}
      <div className="p-4 bg-white border-2.5 border-slate-900 rounded-2xl shadow-comic flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-amber-400 border-2 border-slate-900 shadow-comic-sm font-bangers text-xs uppercase tracking-wider text-slate-900 mb-1">
            <Trash2 className="w-3.5 h-3.5" />
            <span>Safe Cleanup Intelligence</span>
          </div>
          <h2 className="font-bangers text-2xl text-slate-900 uppercase tracking-wider mt-1">
            Reclaim Valuable Disk Space
          </h2>
          <p className="text-xs font-comicNeue font-bold text-slate-600">
            Conservative recommendations for space recovery. Zero automated deletion; files go to OS Recycle Bin.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {selectedCleanupIds.size > 0 ? (
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={isExecuting}
              className="flex items-center space-x-2 px-5 py-2.5 bg-rose-500 hover:bg-rose-400 text-white font-bangers text-sm uppercase tracking-wider border-2.5 border-slate-900 rounded-xl shadow-comic transition-all hover:-translate-y-0.5 active:translate-y-0.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>
                Clean Selected ({selectedCleanupIds.size} files • {formatBytes(totalSelectedBytes, settings.unit)})
              </span>
            </button>
          ) : (
            <button
              onClick={() => selectAllCleanup()}
              className="px-4 py-2 bg-amber-300 hover:bg-amber-400 border-2 border-slate-900 font-bangers text-sm uppercase tracking-wider text-slate-900 rounded-xl shadow-comic-sm transition-all"
            >
              Select All Recommendations
            </button>
          )}
        </div>
      </div>

      {/* Execution Feedback Banner */}
      {lastResult && (
        <div className="p-4 bg-emerald-100 border-2.5 border-slate-900 rounded-2xl shadow-comic flex items-center justify-between text-xs font-fredoka font-bold">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-400 border-2 border-slate-900 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-slate-900" />
            </div>
            <div>
              <p className="font-comic text-sm text-slate-900 uppercase">
                Cleanup completed: {formatBytes(lastResult.total_freed_bytes, settings.unit)} recovered!
              </p>
              <p className="text-slate-700">
                Processed {lastResult.successful_count} files
                {lastResult.failed_count > 0 && ` (${lastResult.failed_count} failed)`}
                {settings.prefer_trash ? ' • Moved safely to Recycle Bin' : ' • Deleted'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setLastResult(null)}
            className="px-2.5 py-1 rounded-lg border border-slate-900 bg-white font-comic text-[10px] uppercase shadow-comic-sm"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
        {['all', 'temp_file', 'old_installer', 'large_archive', 'large_download'].map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-3 py-1.5 rounded-xl border-2 border-slate-900 font-comic text-xs uppercase tracking-wide transition-all ${
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
            className="text-xs font-comic uppercase text-slate-700 hover:text-rose-600 underline ml-auto shrink-0"
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
                  className="mt-0.5 text-slate-900 shrink-0"
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
                    <h4 className="font-comic text-xs uppercase tracking-wide text-slate-900 truncate">
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
                <div className="text-right">
                  <span className="font-comic text-sm text-slate-900">
                    {formatBytes(candidate.file.size_bytes, settings.unit)}
                  </span>
                  <p className="text-[10px] font-fredoka font-bold text-slate-500 capitalize">
                    {settings.prefer_trash ? 'Recycle Bin' : 'Permanent'}
                  </p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReveal(candidate.file.path);
                  }}
                  className="p-1.5 rounded-lg border border-slate-900 bg-white hover:bg-amber-200 text-slate-900 shadow-comic-sm transition-colors"
                  title="Reveal in native file explorer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredCandidates.length === 0 && (
          <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border-2 border-slate-900 shadow-comic">
            <ShieldCheck className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
            <h4 className="font-comic text-sm uppercase text-slate-900">
              No cleanup candidates in this category
            </h4>
            <p className="text-xs font-fredoka font-semibold text-slate-600 mt-1">
              Your scanned storage does not contain obsolete temporary files or leftover archives.
            </p>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 select-none">
          <div className="bg-white border-2.5 border-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-comic-xl font-sans text-slate-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center space-x-3 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-100 border-2 border-slate-900 flex items-center justify-center shadow-comic-sm">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <span className="font-comic text-[10px] uppercase text-red-600">Safety Check</span>
                <h3 className="font-comic text-base uppercase text-slate-900">
                  Confirm Safe Cleanup
                </h3>
              </div>
            </div>

            <p className="text-xs font-fredoka font-semibold text-slate-700 leading-relaxed">
              You are about to process{' '}
              <strong className="text-slate-900">{selectedCandidates.length} files</strong>{' '}
              recovering{' '}
              <strong className="font-comic text-sm text-slate-900">
                {formatBytes(totalSelectedBytes, settings.unit)}
              </strong>{' '}
              of disk storage.
            </p>

            <div className="p-3 bg-amber-50 border-2 border-slate-900 rounded-xl text-xs font-fredoka font-bold space-y-1.5">
              <div className="flex justify-between text-slate-700">
                <span>Destination:</span>
                <span className="text-slate-900 font-comic uppercase">
                  {settings.prefer_trash ? 'OS Recycle Bin (Safe)' : 'Permanent Delete'}
                </span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Target validation:</span>
                <span className="text-emerald-700 font-comic uppercase">Strict Path Verified</span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2 border-t-2 border-slate-900">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl border-2 border-slate-900 bg-slate-100 hover:bg-slate-200 font-comic text-xs uppercase shadow-comic-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleExecute}
                disabled={isExecuting}
                className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-comic text-xs uppercase border-2 border-slate-900 shadow-comic"
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
