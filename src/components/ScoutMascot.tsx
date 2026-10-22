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
      className={`relative shrink-0 ${className} flex items-center justify-center select-none ${
        isScanning ? 'animate-bounce' : 'comic-hover-wiggle'
      }`}
    >
      <svg
        viewBox="0 0 120 120"
        className="w-full h-full drop-shadow-[2px_2px_0px_rgba(15,23,42,0.9)] overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer Circular Comic Badge */}
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="#fef08a"
          stroke="#0f172a"
          strokeWidth="4"
        />

        {/* Halftone dots texture on avatar background */}
        <circle cx="36" cy="30" r="1.5" fill="#0f172a" opacity="0.15" />
        <circle cx="48" cy="24" r="1.5" fill="#0f172a" opacity="0.15" />
        <circle cx="72" cy="24" r="1.5" fill="#0f172a" opacity="0.15" />
        <circle cx="84" cy="30" r="1.5" fill="#0f172a" opacity="0.15" />
        <circle cx="28" cy="50" r="1.5" fill="#0f172a" opacity="0.15" />
        <circle cx="92" cy="50" r="1.5" fill="#0f172a" opacity="0.15" />

        {/* Scout Explorer Body / Khaki Jacket */}
        <path
          d="M34 96 C34 78 46 75 60 75 C74 75 86 78 86 96 L90 114 L30 114 Z"
          fill="#d97706"
          stroke="#0f172a"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        {/* Jacket Collar & Red Neckerchief */}
        <path d="M50 75 L60 89 L70 75 Z" fill="#dc2626" stroke="#0f172a" strokeWidth="2.5" />
        <path d="M55 86 L60 99 L65 86 Z" fill="#ef4444" stroke="#0f172a" strokeWidth="2" />
        {/* Yellow Neckerchief Ring */}
        <rect x="57" y="84" width="6" height="4" rx="1.5" fill="#facc15" stroke="#0f172a" strokeWidth="1.5" />

        {/* Scout Face */}
        <ellipse cx="60" cy="55" rx="21" ry="23" fill="#fed7aa" stroke="#0f172a" strokeWidth="3.5" />
        
        {/* Ears */}
        <circle cx="38" cy="55" r="5.5" fill="#fed7aa" stroke="#0f172a" strokeWidth="3" />
        <circle cx="82" cy="55" r="5.5" fill="#fed7aa" stroke="#0f172a" strokeWidth="3" />

        {/* Hair Fringe */}
        <path
          d="M43 45 C48 37 72 37 77 45 C75 41 67 41 60 42 C53 41 45 41 43 45 Z"
          fill="#78350f"
          stroke="#0f172a"
          strokeWidth="2.5"
        />

        {/* Eyes & Gaze */}
        <circle cx="52" cy="54" r="3.5" fill="#0f172a" />
        <circle cx="53.3" cy="52.7" r="1.3" fill="#ffffff" />
        <circle cx="68" cy="54" r="3.5" fill="#0f172a" />
        <circle cx="69.3" cy="52.7" r="1.3" fill="#ffffff" />

        {/* Rosy Cheeks */}
        <ellipse cx="46" cy="62" rx="4" ry="2.2" fill="#f87171" opacity="0.65" />
        <ellipse cx="74" cy="62" rx="4" ry="2.2" fill="#f87171" opacity="0.65" />

        {/* Cheerful Explorer Smile */}
        <path
          d="M52 64 Q60 72 68 64"
          fill="#991b1b"
          stroke="#0f172a"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Safari Pith Helmet / Explorer Hat */}
        {/* Hat Brim */}
        <ellipse cx="60" cy="41" rx="36" ry="10" fill="#b45309" stroke="#0f172a" strokeWidth="3.5" />
        {/* Hat Crown */}
        <path
          d="M35 40 C35 18 50 12 60 12 C70 12 85 18 85 40 Z"
          fill="#d97706"
          stroke="#0f172a"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        {/* Hat Leather Band */}
        <path
          d="M36 38 C44 36 76 36 84 38 L84 42 C76 40 44 40 36 42 Z"
          fill="#78350f"
          stroke="#0f172a"
          strokeWidth="2.5"
        />

        {/* Magnifying Glass Hand & Scanner Device */}
        <g
          className={
            isScanning
              ? 'animate-[comic-magnifier-scan_1.6s_ease-in-out_infinite] origin-[72px_72px]'
              : ''
          }
        >
          {/* Active Scanning Beam radiating from lens */}
          {isScanning && (
            <g className="animate-[comic-scan-beam_1.2s_ease-in-out_infinite] origin-[74px_74px]">
              <path
                d="M74 74 L40 115 L108 115 Z"
                fill="#38bdf8"
                fillOpacity="0.25"
                stroke="#0f172a"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              {/* Radar rings inside beam */}
              <path
                d="M56 94 Q74 99 92 94"
                stroke="#34d399"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M48 106 Q74 112 100 106"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
            </g>
          )}

          {/* Scout Hand holding the glass */}
          <ellipse cx="82" cy="80" rx="6" ry="5" fill="#fed7aa" stroke="#0f172a" strokeWidth="2.5" />

          {/* Glass Handle */}
          <path
            d="M76 76 L94 94"
            stroke="#78350f"
            strokeWidth="5.5"
            strokeLinecap="round"
          />

          {/* Glass Rim */}
          <circle
            cx="72"
            cy="70"
            r="16"
            fill={isScanning ? '#38bdf8' : '#e0f2fe'}
            fillOpacity={isScanning ? 0.95 : 0.8}
            stroke="#0f172a"
            strokeWidth="3.5"
          />

          {/* Glass Highlight Arc */}
          <path
            d="M64 63 Q70 60 78 64"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Center Scanner Reticle Crosshair during scan */}
          {isScanning && (
            <>
              <line x1="72" y1="62" x2="72" y2="78" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="2 2" />
              <line x1="64" y1="70" x2="80" y2="70" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="2 2" />
              <circle cx="72" cy="70" r="4" fill="none" stroke="#0284c7" strokeWidth="1.5" />
            </>
          )}
        </g>

        {/* Active Scanning Indicator Badge in corner */}
        {isScanning && (
          <g>
            <circle cx="20" cy="20" r="14" fill="#10b981" stroke="#0f172a" strokeWidth="2.5" />
            <text
              x="20"
              y="25"
              textAnchor="middle"
              fontSize="13"
              fill="#ffffff"
              fontWeight="bold"
            >
              🔍
            </text>
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
    <div className="flex items-center space-x-3 bg-amber-100 p-2.5 rounded-xl border-2.5 border-slate-900 shadow-comic relative overflow-hidden">
      {/* Subtle halftone background texture */}
      <div className="absolute inset-0 bg-comic-dots opacity-20 pointer-events-none" />

      {/* Cartoon Explorer Scout Mascot Avatar */}
      <div className="relative shrink-0">
        <div className={`rounded-2xl border-2.5 border-slate-900 overflow-hidden bg-amber-300 shadow-comic-sm flex items-center justify-center p-0.5 ${className}`}>
          <ScoutAvatar isScanning={isScanning} className="w-full h-full" />
        </div>
        {/* Pulsing ring during scan */}
        {isScanning && (
          <div className="absolute -inset-1 border-2 border-emerald-400 rounded-2xl animate-ping pointer-events-none opacity-60" />
        )}
      </div>

      {/* Scout Speech Bubble & Status */}
      <div className="relative flex-1 min-w-0 z-10">
        {/* Status Badge Pill */}
        <div
          className={`inline-flex items-center pl-1.5 pr-2.5 py-0.5 rounded-full border-2 border-slate-900 text-xs font-bangers uppercase tracking-wider mb-1 shadow-comic-sm transition-colors ${
            isScanning
              ? 'bg-emerald-400 text-slate-900'
              : 'bg-sky-400 text-slate-900'
          }`}
        >
          <span className="w-4 h-4 rounded-full bg-white border border-slate-900 flex items-center justify-center mr-1.5 shrink-0 shadow-[1px_1px_0px_#0f172a]">
            {isScanning ? (
              <Compass className="w-2.5 h-2.5 text-slate-900 animate-spin" />
            ) : (
              <ShieldCheck className="w-2.5 h-2.5 text-slate-900 stroke-[3]" />
            )}
          </span>
          {isScanning ? 'Active Scanning' : 'Scout Ready'}
        </div>

        {/* Speech text with cartoon tail */}
        <div className="relative bg-yellow-50 border-2 border-slate-900 rounded-lg px-2.5 py-1.5 shadow-comic-sm">
          {/* Speech bubble tail pointing to mascot */}
          <div className="absolute -left-2 top-2 w-0 h-0 border-t-[6px] border-t-transparent border-r-[8px] border-r-slate-900 border-b-[6px] border-b-transparent" />
          <div className="absolute -left-[6px] top-[9px] w-0 h-0 border-t-[5px] border-t-transparent border-r-[7px] border-r-yellow-50 border-b-[5px] border-b-transparent" />

          <p className="text-xs font-bold text-slate-900 font-comicNeue leading-snug truncate">
            {statusText || (isScanning ? '80ms Telemetry • In Progress' : 'Ready to scout storage!')}
          </p>
        </div>
      </div>
    </div>
  );
};
