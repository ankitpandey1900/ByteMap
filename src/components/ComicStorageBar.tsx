import React from 'react';

export interface ComicStorageBarProps {
  percent: number;
  className?: string;
  heightClass?: string;
  showLabel?: boolean;
  showStatusBadge?: boolean;
  label?: string;
}

export interface StorageStage {
  fillColor: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  stageName: string;
  stageEmoji: string;
}

export function getStorageStage(percent: number): StorageStage {
  const clamped = Math.min(100, Math.max(0, percent));

  if (clamped >= 90) {
    return {
      fillColor: 'bg-red-500',
      badgeBg: 'bg-red-500',
      badgeText: 'text-white',
      badgeBorder: 'border-slate-900',
      stageName: 'CRITICAL',
      stageEmoji: '🔥',
    };
  }

  if (clamped >= 75) {
    return {
      fillColor: 'bg-orange-500',
      badgeBg: 'bg-orange-400',
      badgeText: 'text-slate-900',
      badgeBorder: 'border-slate-900',
      stageName: 'HEAVY',
      stageEmoji: '⚡',
    };
  }

  if (clamped >= 50) {
    return {
      fillColor: 'bg-amber-400',
      badgeBg: 'bg-amber-300',
      badgeText: 'text-slate-900',
      badgeBorder: 'border-slate-900',
      stageName: 'RISING',
      stageEmoji: '🟡',
    };
  }

  return {
    fillColor: 'bg-emerald-500',
    badgeBg: 'bg-emerald-400',
    badgeText: 'text-slate-900',
    badgeBorder: 'border-slate-900',
    stageName: 'SAFE',
    stageEmoji: '🟢',
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
    <div className={`w-full flex flex-col gap-1.5 select-none ${className}`}>
      {/* Top Header Row: Status badge + Label on left, Clean Mono percentage on right */}
      {(showLabel || showStatusBadge) && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {showStatusBadge && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bangers uppercase tracking-wider border-2 shadow-[1px_1px_0px_#0f172a] ${stage.badgeBg} ${stage.badgeText} ${stage.badgeBorder}`}
              >
                <span>{stage.stageEmoji}</span>
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
        className={`relative w-full ${heightClass} rounded-lg bg-slate-100 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] overflow-hidden`}
      >
        {/* Milestone Tick Dividers at 25%, 50%, 75% */}
        <div className="absolute inset-0 flex pointer-events-none z-10">
          <div className="w-1/4 h-full border-r border-slate-900/10" />
          <div className="w-1/4 h-full border-r border-slate-900/10" />
          <div className="w-1/4 h-full border-r border-slate-900/10" />
          <div className="w-1/4 h-full" />
        </div>

        {/* Solid Saturated Fill — Clean & Flat, NO gel gloss blister, NO candy stripes */}
        <div
          className={`h-full border-r-2 border-slate-900 transition-all duration-500 ease-out ${stage.fillColor}`}
          style={{ width: `${visualWidth}%` }}
        />
      </div>
    </div>
  );
};
