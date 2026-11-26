import React, { useEffect } from 'react';
import { Trash2, AlertTriangle, X, Loader2 } from 'lucide-react';
import { formatBytes, cleanDisplayPath } from '@/lib/utils';

export interface ConfirmCleanupTarget {
  name: string;
  path: string;
  size_bytes: number;
}

interface ConfirmCleanupModalProps {
  isOpen: boolean;
  targets: ConfirmCleanupTarget[];
  preferTrash: boolean;
  unit: 'binary' | 'decimal';
  isExecuting?: boolean;
  title?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Accessible confirmation modal shared across Cleanup, Large Files, Explorer, and Treemap actions.
 */
export const ConfirmCleanupModal: React.FC<ConfirmCleanupModalProps> = ({
  isOpen,
  targets,
  preferTrash,
  unit,
  isExecuting = false,
  title = 'Confirm Space Reclamation',
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!isOpen || isExecuting) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isExecuting, onCancel]);

  if (!isOpen || targets.length === 0) return null;

  const totalBytes = targets.reduce((acc, t) => acc + t.size_bytes, 0);
  const singleTarget = targets.length === 1 ? targets[0] : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-cleanup-title"
      onClick={() => !isExecuting && onCancel()}
    >
      <div
        className="bg-white dark:bg-slate-900 border-3 border-slate-900 dark:border-slate-700 rounded-2xl max-w-md w-full p-5 shadow-[8px_8px_0px_#0f172a] space-y-4 text-slate-900 dark:text-slate-100 animate-comic-pop relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 pb-3 border-b-2 border-slate-900 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-xl border-2 border-slate-900 flex items-center justify-center shrink-0 shadow-comic-sm ${
                preferTrash ? 'bg-amber-400 text-slate-900' : 'bg-rose-500 text-white'
              }`}
            >
              {preferTrash ? <Trash2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <div>
              <h3
                id="confirm-cleanup-title"
                className="font-bangers text-xl uppercase tracking-wider leading-none"
              >
                {title}
              </h3>
              <p className="text-xs font-fredoka font-semibold text-slate-600 dark:text-slate-400 mt-1">
                {preferTrash
                  ? 'Items will be moved safely to your OS Recycle Bin / Trash.'
                  : 'Warning: Permanent deletion cannot be undone.'}
              </p>
            </div>
          </div>

          {!isExecuting && (
            <button
              type="button"
              onClick={onCancel}
              aria-label="Close confirmation dialog"
              className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-400 hover:text-white border-2 border-slate-900 dark:border-slate-700 flex items-center justify-center shadow-comic-sm transition-all cursor-pointer"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}
        </div>

        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-slate-800 border-2 border-slate-900 dark:border-slate-700 space-y-2">
          <div className="flex items-center justify-between text-xs font-fredoka font-bold">
            <span className="text-slate-600 dark:text-slate-300 uppercase">Targets Selected:</span>
            <span className="font-mono text-slate-900 dark:text-white">
              {targets.length} {targets.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs font-fredoka font-bold">
            <span className="text-slate-600 dark:text-slate-300 uppercase">Estimated Space:</span>
            <span className="font-mono text-emerald-700 dark:text-emerald-400 text-sm">
              {formatBytes(totalBytes, unit)}
            </span>
          </div>
          {singleTarget && (
            <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {singleTarget.name}
              </p>
              <p
                className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate"
                title={cleanDisplayPath(singleTarget.path)}
              >
                {cleanDisplayPath(singleTarget.path)}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-2.5 pt-1">
          <button
            type="button"
            onClick={onCancel}
            disabled={isExecuting}
            className="px-4 py-2 rounded-xl border-2 border-slate-900 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 font-comic text-xs uppercase tracking-wide shadow-comic-sm cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isExecuting}
            className={`flex items-center space-x-1.5 px-5 py-2 rounded-xl border-2 border-slate-900 font-bangers text-sm uppercase tracking-wider shadow-comic transition-all hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 ${
              preferTrash
                ? 'bg-amber-400 hover:bg-amber-300 text-slate-900'
                : 'bg-rose-500 hover:bg-rose-400 text-white'
            }`}
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Cleaning...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>{preferTrash ? 'Move to Recycle Bin' : 'Delete Permanently'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
