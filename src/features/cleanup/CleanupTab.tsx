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
import { formatBytes } from '@/lib/utils';
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
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Safe
          </span>
        );
      case 'low':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Low Risk
          </span>
        );
      case 'moderate':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Moderate Risk
          </span>
        );
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'temp_file':
        return <Trash2 className="w-4 h-4 text-emerald-400" />;
      case 'old_installer':
        return <Terminal className="w-4 h-4 text-cyan-400" />;
      case 'large_archive':
        return <Archive className="w-4 h-4 text-amber-400" />;
      case 'large_download':
        return <Download className="w-4 h-4 text-blue-400" />;
      default:
        return <FileQuestion className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Banner */}
      <div className="p-4 bg-card/60 backdrop-blur border border-border/50 rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">Safe Cleanup Intelligence</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Conservative recommendations for space recovery. Zero automated deletion; requires explicit confirmation.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {selectedCleanupIds.size > 0 ? (
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={isExecuting}
              className="flex items-center space-x-2 px-4 py-2 bg-destructive text-destructive-foreground text-xs font-semibold rounded-lg hover:bg-destructive/90 transition-all shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>
                Clean Selected ({selectedCleanupIds.size} files • {formatBytes(totalSelectedBytes, settings.unit)})
              </span>
            </button>
          ) : (
            <button
              onClick={() => selectAllCleanup()}
              className="px-3.5 py-1.5 border border-border/60 hover:bg-accent text-xs font-medium text-foreground rounded-lg transition-colors"
            >
              Select All Recommendations
            </button>
          )}
        </div>
      </div>

      {/* Execution Feedback Banner */}
      {lastResult && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between text-xs animate-fade-in">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-semibold text-foreground text-sm">
                Cleanup completed: {formatBytes(lastResult.total_freed_bytes, settings.unit)} recovered
              </p>
              <p className="text-muted-foreground">
                Successfully processed {lastResult.successful_count} files
                {lastResult.failed_count > 0 && ` (${lastResult.failed_count} failed)`}
                {settings.prefer_trash ? ' • Moved safely to Recycle Bin' : ' • Permanently deleted'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setLastResult(null)}
            className="text-muted-foreground hover:text-foreground text-xs"
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
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap capitalize ${
              activeFilter === f
                ? 'bg-primary text-primary-foreground'
                : 'bg-card/40 border border-border/40 text-muted-foreground hover:text-foreground'
            }`}
          >
            {f === 'all' ? 'All Candidates' : f.replace('_', ' ')}
          </button>
        ))}

        {selectedCleanupIds.size > 0 && (
          <button
            onClick={clearCleanupSelection}
            className="text-xs text-muted-foreground hover:text-foreground underline ml-auto shrink-0"
          >
            Clear selection ({selectedCleanupIds.size})
          </button>
        )}
      </div>

      {/* Candidates List */}
      <div className="space-y-3">
        {filteredCandidates.map((candidate) => {
          const isSelected = selectedCleanupIds.has(candidate.id);
          return (
            <div
              key={candidate.id}
              onClick={() => toggleCleanupSelection(candidate.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                isSelected
                  ? 'bg-amber-500/5 border-amber-500/40 shadow-sm'
                  : 'bg-card/40 border-border/50 hover:border-border hover:bg-card/70'
              }`}
            >
              <div className="flex items-start space-x-3 truncate">
                <button
                  type="button"
                  className="mt-0.5 text-muted-foreground hover:text-foreground shrink-0"
                >
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-amber-500" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>

                <div className="truncate">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(candidate.type)}
                    <h4 className="font-semibold text-xs text-foreground truncate">
                      {candidate.title}
                    </h4>
                    {getRiskBadge(candidate.risk_level)}
                  </div>

                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">
                    {candidate.description}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono truncate mt-0.5">
                    {candidate.file.path}
                  </p>
                  <p className="text-[10px] text-amber-400/90 mt-1 flex items-center">
                    <Info className="w-3 h-3 mr-1 shrink-0" />
                    {candidate.risk_explanation}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4 shrink-0 pl-7 md:pl-0">
                <div className="text-right">
                  <span className="font-mono font-bold text-sm text-foreground">
                    {formatBytes(candidate.file.size_bytes, settings.unit)}
                  </span>
                  <p className="text-[10px] text-muted-foreground capitalize">
                    {settings.prefer_trash ? 'Recycle Bin' : 'Permanent'}
                  </p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReveal(candidate.file.path);
                  }}
                  className="p-1.5 rounded-lg border border-border/50 hover:bg-accent text-muted-foreground hover:text-foreground"
                  title="Reveal in native file explorer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredCandidates.length === 0 && (
          <div className="p-10 text-center text-muted-foreground bg-card/40 rounded-xl border border-border/40">
            <ShieldCheck className="w-12 h-12 mx-auto mb-2 text-emerald-400 opacity-60" />
            <h4 className="text-sm font-semibold text-foreground">
              No cleanup candidates in this category
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              Your storage root does not contain obvious temporary files or obsolete installers.
            </p>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-popover border border-border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center space-x-3 text-destructive">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-foreground">
                Confirm Safe Cleanup
              </h3>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              You are about to process{' '}
              <span className="font-bold text-foreground">
                {selectedCandidates.length} files
              </span>{' '}
              recovering{' '}
              <span className="font-mono font-bold text-foreground">
                {formatBytes(totalSelectedBytes, settings.unit)}
              </span>{' '}
              of disk space.
            </p>

            <div className="p-3 bg-secondary/50 rounded-lg text-xs space-y-1">
              <div className="flex justify-between text-muted-foreground">
                <span>Method:</span>
                <span className="font-medium text-foreground">
                  {settings.prefer_trash
                    ? 'Move to OS Recycle Bin (Recoverable)'
                    : 'Permanent Deletion'}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Target validation:</span>
                <span className="font-medium text-emerald-400">Strict Path Checked</span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-lg border border-border hover:bg-accent text-xs font-medium transition-colors text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleExecute}
                disabled={isExecuting}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-xs font-semibold hover:bg-destructive/90 transition-colors"
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
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
