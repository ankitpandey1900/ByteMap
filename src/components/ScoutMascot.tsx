import React from 'react';
import { Compass, ShieldCheck } from 'lucide-react';

export interface ScoutAvatarProps {
  className?: string;
  isScanning?: boolean;
}

export const ScoutAvatar: React.FC<ScoutAvatarProps> = ({
  className = 'w-16 h-16',
  isScanning = false,
}) => {
  return (
    <div
      className={`relative shrink-0 ${className} flex items-center justify-center select-none overflow-hidden ${
        isScanning ? 'animate-scout-bob' : 'comic-hover-wiggle'
      }`}
    >
      <svg
        viewBox="0 0 120 120"
        className="w-full h-full overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="scoutBackdropIdle" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#fef9c3" />
            <stop offset="100%" stopColor="#fde047" />
          </radialGradient>
          <radialGradient id="scoutBackdropScan" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#d1fae5" />
            <stop offset="100%" stopColor="#38bdf8" />
          </radialGradient>
        </defs>

        {/* Full-bleed Soft Radial Portrait Backdrop (zero double inner border) */}
        <rect
          x="0"
          y="0"
          width="120"
          height="120"
          rx="20"
          fill={isScanning ? 'url(#scoutBackdropScan)' : 'url(#scoutBackdropIdle)'}
        />

        {/* Subtle radial spotlight / halftone dots */}
        <circle cx="24" cy="24" r="1.8" fill="#0f172a" opacity="0.12" />
        <circle cx="96" cy="24" r="1.8" fill="#0f172a" opacity="0.12" />
        <circle cx="18" cy="60" r="1.5" fill="#0f172a" opacity="0.1" />
        <circle cx="102" cy="60" r="1.5" fill="#0f172a" opacity="0.1" />

        {/* Animated Dashed Radar Orbit Ring while scanning */}
        {isScanning && (
          <circle
            cx="60"
            cy="60"
            r="50"
            stroke="#0284c7"
            strokeWidth="2.2"
            strokeDasharray="7 7"
            opacity="0.55"
            className="animate-scout-orbit"
          />
        )}

        {/* Scout Explorer Body / Jacket */}
        <path
          d="M32 98 C32 79 45 75 60 75 C75 75 88 79 88 98 L93 120 L27 120 Z"
          fill="#d97706"
          stroke="#0f172a"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        {/* Jacket Collar & Neckerchief */}
        <path d="M49 75 L60 90 L71 75 Z" fill="#dc2626" stroke="#0f172a" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M55 87 L60 101 L65 87 Z" fill="#ef4444" stroke="#0f172a" strokeWidth="2" strokeLinejoin="round" />
        <rect x="57" y="84" width="6" height="4.5" rx="1.5" fill="#facc15" stroke="#0f172a" strokeWidth="1.5" />

        {/* Scout Face */}
        <ellipse cx="60" cy="54" rx="21.5" ry="23" fill="#fed7aa" stroke="#0f172a" strokeWidth="3.5" />

        {/* Ears */}
        <circle cx="37.5" cy="54" r="5.5" fill="#fed7aa" stroke="#0f172a" strokeWidth="3" />
        <circle cx="82.5" cy="54" r="5.5" fill="#fed7aa" stroke="#0f172a" strokeWidth="3" />

        {/* Hair Fringe */}
        <path
          d="M42 44 C47 36 73 36 78 44 C75 40 67 40 60 41 C53 40 45 40 42 44 Z"
          fill="#78350f"
          stroke="#0f172a"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Eyes with natural blink animation */}
        <g className={isScanning ? '' : 'animate-scout-blink'}>
          <circle cx="51.5" cy="53" r="3.6" fill="#0f172a" />
          <circle cx="52.8" cy="51.7" r="1.3" fill="#ffffff" />
          <circle cx="68.5" cy="53" r="3.6" fill="#0f172a" />
          <circle cx="69.8" cy="51.7" r="1.3" fill="#ffffff" />
        </g>

        {/* Rosy Cheeks */}
        <ellipse cx="45.5" cy="61" rx="4" ry="2.2" fill="#f87171" opacity="0.55" />
        <ellipse cx="74.5" cy="61" rx="4" ry="2.2" fill="#f87171" opacity="0.55" />

        {/* Cheerful Explorer Smile */}
        <path
          d="M52 63 Q60 70.5 68 63"
          fill="#991b1b"
          stroke="#0f172a"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Explorer Hat */}
        <ellipse cx="60" cy="39" rx="36" ry="9.5" fill="#b45309" stroke="#0f172a" strokeWidth="3.5" />
        <path
          d="M35 38 C35 16 49 10 60 10 C71 10 85 16 85 38 Z"
          fill="#d97706"
          stroke="#0f172a"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <path
          d="M36 36 C44 34 76 34 84 36 L84 40 C76 38 44 38 36 40 Z"
          fill="#78350f"
          stroke="#0f172a"
          strokeWidth="2.5"
        />

        {/* Magnifying Glass & Active Scanning Sweep */}
        <g
          className={
            isScanning
              ? 'animate-[comic-magnifier-scan_1.35s_ease-in-out_infinite]'
              : ''
          }
          style={{ transformOrigin: '76px 76px' }}
        >
          {/* Active Scanning Beam radiating from lens */}
          {isScanning && (
            <g className="animate-[comic-scan-beam_1.1s_ease-in-out_infinite]">
              <path
                d="M73 74 L38 117 L108 117 Z"
                fill="#10b981"
                fillOpacity="0.22"
                stroke="#059669"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <path
                d="M55 95 Q73 101 91 95"
                stroke="#10b981"
                strokeWidth="2.2"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M47 107 Q73 114 99 107"
                stroke="#0284c7"
                strokeWidth="2.4"
                strokeLinecap="round"
                fill="none"
              />
            </g>
          )}

          {/* Scout Hand holding the glass */}
          <ellipse cx="83" cy="81" rx="6" ry="5" fill="#fed7aa" stroke="#0f172a" strokeWidth="2.5" />

          {/* Glass Handle */}
          <path
            d="M78 78 L96 96"
            stroke="#78350f"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d="M78 78 L96 96"
            stroke="#0f172a"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Glass Rim */}
          <circle
            cx="72"
            cy="70"
            r="16.5"
            fill={isScanning ? '#7dd3fc' : '#e0f2fe'}
            fillOpacity={isScanning ? 0.85 : 0.78}
            stroke="#0f172a"
            strokeWidth="3.5"
          />

          {/* Specular Shine Arc */}
          <path
            d="M63.5 62.5 Q70 59 78 63"
            stroke="#ffffff"
            strokeWidth="2.6"
            strokeLinecap="round"
          />

          {/* Precision Radar Reticle inside glass while scanning */}
          {isScanning && (
            <>
              <line x1="72" y1="60" x2="72" y2="80" stroke="#0369a1" strokeWidth="1.6" strokeDasharray="2 2" />
              <line x1="62" y1="70" x2="82" y2="70" stroke="#0369a1" strokeWidth="1.6" strokeDasharray="2 2" />
              <circle cx="72" cy="70" r="5" fill="none" stroke="#0369a1" strokeWidth="1.6" />
            </>
          )}
        </g>

        {/* Live Pulsing Radar Beacon in corner during scan (clean vector dot, no emoji) */}
        {isScanning && (
          <g>
            <circle cx="18" cy="18" r="9" fill="#10b981" fillOpacity="0.28" className="animate-ping" style={{ transformOrigin: '18px 18px' }} />
            <circle cx="18" cy="18" r="5.5" fill="#10b981" stroke="#0f172a" strokeWidth="2" />
          </g>
        )}
      </svg>
    </div>
  );
};

export interface ScoutMascotProps {
  className?: string;
  isScanning?: boolean;
  statusText?: string;
}

export const ScoutMascot: React.FC<ScoutMascotProps> = ({
  className = 'w-20 h-20',
  isScanning = false,
  statusText,
}) => {
  return (
    <div className="flex items-center space-x-3 bg-amber-100 dark:bg-slate-800/90 p-2.5 rounded-xl border-2.5 border-slate-900 dark:border-slate-700 shadow-comic relative overflow-hidden">
      <div className="absolute inset-0 bg-comic-dots opacity-20 dark:opacity-10 pointer-events-none" />

      {/* Scout Avatar Tile */}
      <div className="relative shrink-0">
        <div
          className={`rounded-2xl border-2.5 border-slate-900 overflow-hidden shadow-comic-sm flex items-center justify-center ${className}`}
        >
          <ScoutAvatar isScanning={isScanning} className="w-full h-full" />
        </div>
        {isScanning && (
          <div className="absolute -inset-1 border-2 border-emerald-400 rounded-2xl animate-pulse pointer-events-none opacity-75" />
        )}
      </div>

      {/* Status Badge & Speech Bubble */}
      <div className="relative flex-1 min-w-0 z-10">
        <div
          className={`inline-flex items-center pl-1.5 pr-2.5 py-0.5 rounded-full border-2 border-slate-900 text-xs font-bangers uppercase tracking-wider mb-1 shadow-comic-sm transition-colors ${
            isScanning
              ? 'bg-emerald-400 text-slate-900'
              : 'bg-sky-400 text-slate-900'
          }`}
        >
          <span
            className="w-4 h-4 rounded-full bg-white border border-slate-900 flex items-center justify-center mr-1.5 shrink-0 shadow-[1px_1px_0px_#0f172a]"
            style={{ backgroundColor: '#ffffff' }}
          >
            {isScanning ? (
              <Compass className="w-2.5 h-2.5 text-slate-900 animate-spin" />
            ) : (
              <ShieldCheck className="w-2.5 h-2.5 text-slate-900 stroke-[3]" />
            )}
          </span>
          {isScanning ? 'Active Scanning' : 'Scout Ready'}
        </div>

        <div className="relative bg-yellow-50 dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-600 rounded-lg px-2.5 py-1.5 shadow-comic-sm overflow-hidden">
          {isScanning && (
            <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-emerald-300/25 to-transparent animate-scout-sweep pointer-events-none" />
          )}
          <div className="absolute -left-2 top-2 w-0 h-0 border-t-[6px] border-t-transparent border-r-[8px] border-r-slate-900 dark:border-r-slate-600 border-b-[6px] border-b-transparent" />
          <div className="absolute -left-[6px] top-[9px] w-0 h-0 border-t-[5px] border-t-transparent border-r-[7px] border-r-yellow-50 dark:border-r-slate-900 border-b-[5px] border-b-transparent" />

          <p className="relative text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug truncate">
            {statusText || (isScanning ? 'Scanning filesystem in parallel...' : 'Ready to scout storage!')}
          </p>
        </div>
      </div>
    </div>
  );
};
