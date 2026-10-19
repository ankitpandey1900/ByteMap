import React, { useState, useEffect } from 'react';
import {
  History,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  X,
  Camera,
  Folder,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { ScanSummary } from '@/types';
import { formatBytes, cleanDisplayPath } from '@/lib/utils';
import { CategoryIcon } from './CategoryIcon';
import {
  StorageSnapshot,
  getSavedSnapshots,
  saveSnapshotFromScan,
  deleteSnapshot,
  computeStorageDiff,
  StorageDiffResult,
} from '@/lib/snapshots';

interface StorageDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  scanSummary: ScanSummary;
  unit: 'binary' | 'decimal';
}

export const StorageDiffModal: React.FC<StorageDiffModalProps> = ({
  isOpen,
  onClose,
  scanSummary,
  unit,
}) => {
  const [snapshots, setSnapshots] = useState<StorageSnapshot[]>([]);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>('');
  const [newSnapshotName, setNewSnapshotName] = useState<string>('');
  const [showNameInput, setShowNameInput] = useState<boolean>(false);
  const [diffResult, setDiffResult] = useState<StorageDiffResult | null>(null);
  const [justSavedNotice, setJustSavedNotice] = useState<string | null>(null);

  const refreshSnapshots = () => {
    const list = getSavedSnapshots();
    setSnapshots(list);
    if (list.length > 0 && !selectedSnapshotId) {
      setSelectedSnapshotId(list[0].id);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshSnapshots();
    }
  }, [isOpen]);

  useEffect(() => {
    if (snapshots.length > 0 && selectedSnapshotId) {
      const snap = snapshots.find((s) => s.id === selectedSnapshotId);
      if (snap) {
        setDiffResult(computeStorageDiff(scanSummary, snap));
      } else {
        setDiffResult(null);
      }
    } else {
      setDiffResult(null);
    }
  }, [snapshots, selectedSnapshotId, scanSummary]);

  if (!isOpen) return null;

  const handleCreateSnapshot = () => {
    const name = newSnapshotName.trim() || undefined;
    const created = saveSnapshotFromScan(scanSummary, name);
    setNewSnapshotName('');
    setShowNameInput(false);
    refreshSnapshots();
    setSelectedSnapshotId(created.id);
    setJustSavedNotice(`Baseline snapshot "${created.name}" saved!`);
    setTimeout(() => setJustSavedNotice(null), 3500);
  };

  const handleDeleteSnapshot = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteSnapshot(id);
    const updated = snapshots.filter((s) => s.id !== id);
    setSnapshots(updated);
    if (selectedSnapshotId === id) {
      setSelectedSnapshotId(updated[0]?.id || '');
    }
  };

  const isNetExpansion = diffResult ? diffResult.delta_bytes > 0 : false;
  const isNetReduction = diffResult ? diffResult.delta_bytes < 0 : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 select-none backdrop-blur-xs font-sans">
      <div className="bg-white border-3 border-slate-900 rounded-3xl max-w-3xl w-full p-6 shadow-comic-xl flex flex-col max-h-[90vh] overflow-hidden text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b-2.5 border-slate-900 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-400 border-2.5 border-slate-900 shadow-comic flex items-center justify-center">
              <History className="w-6 h-6 text-slate-900" />
            </div>
            <div>
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-lg bg-amber-300 border border-slate-900 text-[10px] font-comic uppercase tracking-wider text-slate-900">
                <Camera className="w-3 h-3" />
                <span>Time Machine • Storage Delta</span>
              </div>
              <h2 className="font-bangers text-2xl uppercase tracking-wider text-slate-900 leading-tight">
                Where Did My Space Go?
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl border-2 border-slate-900 bg-slate-100 hover:bg-rose-100 hover:text-rose-600 transition-colors shadow-comic-sm"
            title="Close"
          >
            <X className="w-5 h-5 text-slate-900" />
          </button>
        </div>

        {/* Notice toast */}
        {justSavedNotice && (
          <div className="mt-3 p-3 bg-emerald-100 border-2 border-slate-900 rounded-xl shadow-comic-sm flex items-center space-x-2 text-xs font-fredoka font-bold text-emerald-900 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{justSavedNotice}</span>
          </div>
        )}

        {/* Action & Snapshot Selector Bar */}
        <div className="py-4 border-b-2 border-slate-200 shrink-0 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2 overflow-x-auto max-w-full pb-1">
            <span className="font-comic text-xs uppercase tracking-wide text-slate-600 shrink-0">
              Compare with:
            </span>
            {snapshots.length === 0 ? (
              <span className="text-xs font-fredoka text-slate-500 italic">
                No snapshots saved yet
              </span>
            ) : (
              snapshots.map((snap) => {
                const isSelected = snap.id === selectedSnapshotId;
                return (
                  <div
                    key={snap.id}
                    onClick={() => setSelectedSnapshotId(snap.id)}
                    className={`group flex items-center space-x-2 px-3 py-1.5 rounded-xl border-2 border-slate-900 text-xs font-comic uppercase tracking-wide cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-amber-400 text-slate-900 shadow-comic -translate-y-0.5'
                        : 'bg-white hover:bg-amber-100 text-slate-700 shadow-comic-sm'
                    }`}
                  >
                    <Calendar className="w-3 h-3 text-slate-700" />
                    <span className="truncate max-w-[140px]">{snap.name}</span>
                    <button
                      onClick={(e) => handleDeleteSnapshot(snap.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-rose-600 transition-opacity"
                      title="Delete this snapshot"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <div>
            {!showNameInput ? (
              <button
                onClick={() => setShowNameInput(true)}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl border-2 border-slate-900 bg-sky-400 hover:bg-sky-300 font-comic text-xs uppercase tracking-wide shadow-comic transition-transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save Baseline Snapshot</span>
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Snapshot name (optional)..."
                  value={newSnapshotName}
                  onChange={(e) => setNewSnapshotName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateSnapshot()}
                  autoFocus
                  className="px-3 py-1.5 text-xs font-comic border-2 border-slate-900 rounded-xl shadow-comic-sm outline-none focus:bg-amber-50 w-48"
                />
                <button
                  onClick={handleCreateSnapshot}
                  className="px-3 py-1.5 bg-emerald-400 hover:bg-emerald-300 border-2 border-slate-900 rounded-xl font-comic text-xs uppercase shadow-comic-sm"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowNameInput(false)}
                  className="px-2 py-1.5 bg-slate-200 border-2 border-slate-900 rounded-xl font-comic text-xs uppercase shadow-comic-sm"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {snapshots.length === 0 ? (
            <div className="p-8 text-center bg-amber-50 rounded-2xl border-2 border-slate-900 shadow-comic space-y-3">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-400 border-2 border-slate-900 shadow-comic flex items-center justify-center">
                <Camera className="w-8 h-8 text-slate-900" />
              </div>
              <h3 className="font-bangers text-xl uppercase tracking-wider text-slate-900">
                Track Space Evolution Over Time
              </h3>
              <p className="text-xs font-fredoka font-semibold text-slate-600 max-w-md mx-auto">
                Save a baseline snapshot now. When you scan again in the future, ByteMap will calculate
                exact byte differences, highlighting swollen folders and newly bloated categories.
              </p>
              <button
                onClick={handleCreateSnapshot}
                className="px-5 py-2.5 rounded-xl border-2.5 border-slate-900 bg-amber-400 hover:bg-amber-300 font-bangers text-sm uppercase tracking-wider shadow-comic transition-transform hover:-translate-y-0.5 active:translate-y-0"
              >
                Save Current Scan as Baseline
              </button>
            </div>
          ) : diffResult ? (
            <>
              {/* Summary Delta Banner */}
              <div
                className={`p-4 rounded-2xl border-2.5 border-slate-900 shadow-comic flex flex-wrap items-center justify-between gap-4 ${
                  isNetExpansion
                    ? 'bg-rose-100'
                    : isNetReduction
                    ? 'bg-emerald-100'
                    : 'bg-slate-100'
                }`}
              >
                <div className="flex items-center space-x-3.5">
                  <div
                    className={`w-12 h-12 rounded-2xl border-2 border-slate-900 shadow-comic flex items-center justify-center ${
                      isNetExpansion
                        ? 'bg-rose-400 text-slate-900'
                        : isNetReduction
                        ? 'bg-emerald-400 text-slate-900'
                        : 'bg-slate-300 text-slate-900'
                    }`}
                  >
                    {isNetExpansion ? (
                      <TrendingUp className="w-7 h-7" />
                    ) : (
                      <TrendingDown className="w-7 h-7" />
                    )}
                  </div>
                  <div>
                    <div className="text-[10px] font-comic uppercase tracking-wider text-slate-600">
                      Comparison with {diffResult.snapshot.name} ({diffResult.snapshot.dateLabel})
                    </div>
                    <div className="flex items-baseline space-x-2">
                      <span className="font-bangers text-2xl uppercase tracking-wider text-slate-900">
                        {isNetExpansion
                          ? `Disk Expanded by +${formatBytes(diffResult.delta_bytes, unit)}`
                          : isNetReduction
                          ? `Disk Space Reclaimed: ${formatBytes(Math.abs(diffResult.delta_bytes), unit)} freed`
                          : 'Zero Net Storage Change'}
                      </span>
                    </div>
                    <p className="text-xs font-fredoka font-semibold text-slate-700">
                      Baseline: {formatBytes(diffResult.snapshot.total_bytes, unit)} &rarr; Now:{' '}
                      {formatBytes(diffResult.current_total_bytes, unit)}
                    </p>
                  </div>
                </div>

                <div className="px-3.5 py-2 rounded-xl bg-white border-2 border-slate-900 shadow-comic-sm font-comic text-xs uppercase">
                  <span>File Count Delta: </span>
                  <span
                    className={`font-mono font-bold ${
                      diffResult.delta_files > 0
                        ? 'text-rose-600'
                        : diffResult.delta_files < 0
                        ? 'text-emerald-600'
                        : 'text-slate-700'
                    }`}
                  >
                    {diffResult.delta_files > 0 ? `+${diffResult.delta_files}` : diffResult.delta_files}{' '}
                    files
                  </span>
                </div>
              </div>

              {/* Category Growth Breakdown */}
              <div className="bg-white rounded-2xl border-2 border-slate-900 p-4 shadow-comic space-y-3">
                <h4 className="font-bangers text-base uppercase tracking-wider text-slate-900">
                  Category Storage Evolution
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {diffResult.category_diffs.map((cat) => {
                    const isGrowth = cat.delta_bytes > 0;
                    const isShrink = cat.delta_bytes < 0;
                    return (
                      <div
                        key={cat.category}
                        className="p-3 rounded-xl border-1.5 border-slate-900 bg-slate-50 flex items-center justify-between gap-2 shadow-comic-sm"
                      >
                        <div className="flex items-center space-x-2.5 truncate">
                          <CategoryIcon category={cat.category} className="w-5 h-5 shrink-0" />
                          <div className="truncate">
                            <span className="font-comic text-xs uppercase tracking-wide text-slate-900 block truncate">
                              {cat.category}
                            </span>
                            <span className="text-[10px] font-fredoka text-slate-500">
                              {formatBytes(cat.previous_bytes, unit)} &rarr;{' '}
                              {formatBytes(cat.current_bytes, unit)}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-bold border border-slate-900 ${
                              isGrowth
                                ? 'bg-rose-200 text-rose-900'
                                : isShrink
                                ? 'bg-emerald-200 text-emerald-900'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {isGrowth ? '+' : ''}
                            {formatBytes(cat.delta_bytes, unit)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Folder Diffs Breakdown */}
              {diffResult.folder_diffs.length > 0 && (
                <div className="bg-white rounded-2xl border-2 border-slate-900 p-4 shadow-comic space-y-3">
                  <h4 className="font-bangers text-base uppercase tracking-wider text-slate-900">
                    Folders with Significant Space Changes (&gt; 5 MB)
                  </h4>
                  <div className="space-y-2">
                    {diffResult.folder_diffs.map((f) => {
                      const isGrowth = f.delta_bytes > 0;
                      return (
                        <div
                          key={f.path}
                          className="p-2.5 rounded-xl border border-slate-900 bg-slate-50 flex items-center justify-between gap-3 text-xs shadow-comic-sm"
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                            <div className="truncate">
                              <span className="font-comic uppercase text-slate-900 truncate block">
                                {f.name}
                              </span>
                              <span
                                className="font-mono text-[10px] text-slate-500 truncate block"
                                title={cleanDisplayPath(f.path)}
                              >
                                {cleanDisplayPath(f.path)}
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span
                              className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold border border-slate-900 ${
                                isGrowth
                                  ? 'bg-rose-200 text-rose-900'
                                  : 'bg-emerald-200 text-emerald-900'
                              }`}
                            >
                              {isGrowth ? '+' : ''}
                              {formatBytes(f.delta_bytes, unit)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t-2 border-slate-900 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl border-2 border-slate-900 bg-amber-400 hover:bg-amber-300 font-comic text-xs uppercase tracking-wider shadow-comic"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
