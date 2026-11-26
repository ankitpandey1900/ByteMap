import React from 'react';
import { Zap, Flame, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface ComicStorageBarProps {
  percent: number;
  className?: string;
  heightClass?: string;
  showLabel?: boolean;
  showStatusBadge?: boolean;
  label?: string;
}

interface StorageStage {
  fillColor: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  stageName: string;
  stageEmoji: string;
  icon: React.ReactNode;
}

function getStorageStage(percent: number): StorageStage {
  const clamped = Math.min(100, Math.max(0, percent));

  if (clamped >= 90) {
    return {
      fillColor: 'bg-red-500',
      badgeBg: 'bg-red-500 dark:bg-rose-500/20',
      badgeText: 'text-white dark:text-rose-300',
      badgeBorder: 'border-slate-900 dark:border-rose-400/35',
      stageName: 'CRITICAL',
      stageEmoji: '🔥',
      icon: <Flame className="w-3 h-3 text-white dark:text-rose-300 fill-current shrink-0" />,
    };
  }

  if (clamped >= 75) {
    return {
      fillColor: 'bg-orange-500',
      badgeBg: 'bg-orange-400 dark:bg-orange-500/15',
      badgeText: 'text-slate-900 dark:text-orange-300',
      badgeBorder: 'border-slate-900 dark:border-orange-400/35',
      stageName: 'HEAVY',
      stageEmoji: '⚡',
      icon: <Zap className="w-3 h-3 text-slate-900 dark:text-orange-300 fill-current shrink-0" />,
    };
  }

  if (clamped >= 50) {
    return {
      fillColor: 'bg-amber-400',
      badgeBg: 'bg-amber-300 dark:bg-amber-500/15',
      badgeText: 'text-slate-900 dark:text-amber-300',
      badgeBorder: 'border-slate-900 dark:border-amber-400/35',
      stageName: 'RISING',
      stageEmoji: '🟡',
      icon: <AlertTriangle className="w-3 h-3 text-slate-900 dark:text-amber-300 stroke-[2.2] shrink-0" />,
    };
  }

  return {
    fillColor: 'bg-emerald-500',
    badgeBg: 'bg-emerald-400 dark:bg-emerald-500/15',
    badgeText: 'text-slate-900 dark:text-emerald-300',
    badgeBorder: 'border-slate-900 dark:border-emerald-400/35',
    stageName: 'SAFE',
    stageEmoji: '🟢',
    icon: <CheckCircle2 className="w-3 h-3 text-slate-900 dark:text-emerald-300 stroke-[2.2] shrink-0" />,
  };
}

export const ComicStorageBar: React.FC<ComicStorageBarProps> = ({
  percent,
  className = '',
  heightClass = 'h-3.5',
  showLabel = true,
  showStatusBadge = true,
  label = 'Storage Used',
}) => {
  const stage = getStorageStage(percent);
  const visualWidth = Math.max(0, Math.min(100, percent));

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {/* Top Header Row: Status badge + Label on left, Clean Mono percentage on right */}
      {(showLabel || showStatusBadge) && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {showStatusBadge && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bangers uppercase tracking-wider border-2 shadow-[1px_1px_0px_#0f172a] dark:border dark:shadow-none ${stage.badgeBg} ${stage.badgeText} ${stage.badgeBorder}`}
              >
                {stage.icon}
                <span>{stage.stageName}</span>
              </span>
            )}
            <span className="text-[11px] font-comicNeue font-bold text-slate-600 uppercase tracking-wide">
              {label}
            </span>
          </div>

          {showLabel && (
            <span className="font-mono font-bold text-xs text-slate-900 tabular-nums">
              {percent}%
            </span>
          )}
        </div>
      )}

      {/* Sleek Precision Track Bar */}
      <div
        className={`relative w-full ${heightClass} rounded-lg bg-slate-100 dark:bg-[#090c12] border-2 border-slate-900 dark:border-white/10 shadow-[2px_2px_0px_#0f172a] dark:shadow-none overflow-hidden`}
      >
        {/* Milestone Tick Dividers at 25%, 50%, 75% */}
        <div className="absolute inset-0 flex pointer-events-none z-10">
          <div className="w-1/4 h-full border-r border-slate-900/10 dark:border-white/10" />
          <div className="w-1/4 h-full border-r border-slate-900/10 dark:border-white/10" />
          <div className="w-1/4 h-full border-r border-slate-900/10 dark:border-white/10" />
          <div className="w-1/4 h-full" />
        </div>

        {/* Solid Saturated Fill */}
        <div
          className={`h-full border-r-2 border-slate-900 dark:border-r-0 transition-all duration-500 ease-out ${stage.fillColor}`}
          style={{ width: `${visualWidth}%` }}
        />
      </div>
    </div>
  );
};
