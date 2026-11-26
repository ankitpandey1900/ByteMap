import React from 'react';
import { ScoutAvatar } from './ScoutMascot';
import { ComicZapIcon } from './icons/ComicIcons';

interface EmptyScanStateProps {
  badge: string;
  title: string;
  description: string;
  onStartScan?: () => void;
  actionLabel?: string;
}

/**
 * Shared actionable empty state shown on tabs before a scan has been performed.
 */
export const EmptyScanState: React.FC<EmptyScanStateProps> = ({
  badge,
  title,
  description,
  onStartScan,
  actionLabel = 'Start Storage Scan',
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[420px] p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border-2.5 border-slate-900 dark:border-slate-700 shadow-comic select-none w-full">
      <div className="w-20 h-20 rounded-2xl border-2.5 border-slate-900 shadow-comic flex items-center justify-center mb-4 overflow-hidden">
        <ScoutAvatar isScanning={false} className="w-full h-full" />
      </div>
      <div className="inline-flex items-center px-3 py-1 rounded-lg bg-amber-300 border-2 border-slate-900 shadow-comic-sm font-comic text-xs uppercase tracking-wide text-slate-900 mb-2">
        {badge}
      </div>
      <h3 className="font-bangers text-3xl text-slate-900 dark:text-slate-100 uppercase tracking-wide mb-1.5">
        {title}
      </h3>
      <p className="font-fredoka text-sm text-slate-600 dark:text-slate-300 max-w-md font-medium mb-5">
        {description}
      </p>
      {onStartScan && (
        <button
          type="button"
          onClick={onStartScan}
          className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl border-2.5 border-slate-900 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bangers text-base uppercase tracking-wider shadow-comic hover:-translate-y-0.5 hover:shadow-comic-lg active:translate-y-0.5 transition-all cursor-pointer"
        >
          <ComicZapIcon className="w-4 h-4" />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
};
