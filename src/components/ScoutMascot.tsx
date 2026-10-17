import React from 'react';

interface ScoutMascotProps {
  className?: string;
  isScanning?: boolean;
  statusText?: string;
}

export const ScoutMascot: React.FC<ScoutMascotProps> = ({
  className = 'w-24 h-24',
  isScanning = false,
  statusText,
}) => {
  return (
    <div className="flex items-center space-x-2.5 bg-gradient-to-r from-amber-100 to-amber-50 dark:from-amber-950/40 dark:to-slate-900/60 p-2.5 rounded-xl border-2 border-slate-900 shadow-comic-sm">
      {/* Cartoon Explorer Scout SVG */}
      <div className="relative shrink-0">
        <svg
          viewBox="0 0 120 120"
          className={`${className} drop-shadow-[2px_2px_0px_rgba(15,23,42,0.8)]`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background circle badge */}
          <circle cx="60" cy="60" r="54" fill="#fef3c7" stroke="#0f172a" strokeWidth="4" />
          
          {/* Scout Body / Khaki Vest */}
          <path
            d="M36 94 C36 78 48 76 60 76 C72 76 84 78 84 94 L88 114 L32 114 Z"
            fill="#d97706"
            stroke="#0f172a"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* Inner Shirt & Neckerchief */}
          <path d="M52 76 L60 88 L68 76 Z" fill="#dc2626" stroke="#0f172a" strokeWidth="2.5" />
          <path d="M56 86 L60 98 L64 86 Z" fill="#ef4444" stroke="#0f172a" strokeWidth="2" />
          
          {/* Scout Face */}
          <ellipse cx="60" cy="56" rx="20" ry="22" fill="#fed7aa" stroke="#0f172a" strokeWidth="3.5" />
          {/* Ears */}
          <circle cx="39" cy="56" r="5" fill="#fed7aa" stroke="#0f172a" strokeWidth="3" />
          <circle cx="81" cy="56" r="5" fill="#fed7aa" stroke="#0f172a" strokeWidth="3" />
          
          {/* Hair fringe */}
          <path
            d="M44 46 C48 38 72 38 76 46 C74 42 66 42 60 43 C54 42 46 42 44 46 Z"
            fill="#78350f"
            stroke="#0f172a"
            strokeWidth="2.5"
          />
          
          {/* Eyes & Smile */}
          <circle cx="53" cy="55" r="3.2" fill="#0f172a" />
          <circle cx="54.2" cy="53.8" r="1.2" fill="#ffffff" />
          <circle cx="67" cy="55" r="3.2" fill="#0f172a" />
          <circle cx="68.2" cy="53.8" r="1.2" fill="#ffffff" />
          {/* Rosy Cheeks */}
          <ellipse cx="48" cy="62" rx="3.5" ry="2" fill="#f87171" opacity="0.6" />
          <ellipse cx="72" cy="62" rx="3.5" ry="2" fill="#f87171" opacity="0.6" />
          {/* Cheerful Smile */}
          <path
            d="M53 64 Q60 72 67 64"
            fill="#991b1b"
            stroke="#0f172a"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          
          {/* Safari Pith Helmet / Explorer Hat */}
          {/* Hat Brim */}
          <ellipse cx="60" cy="42" rx="34" ry="9" fill="#b45309" stroke="#0f172a" strokeWidth="3.5" />
          {/* Hat Crown */}
          <path
            d="M36 41 C36 20 50 14 60 14 C70 14 84 20 84 41 Z"
            fill="#d97706"
            stroke="#0f172a"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* Hat Leather Band */}
          <path
            d="M37 39 C44 37 76 37 83 39 L83 43 C76 41 44 41 37 43 Z"
            fill="#78350f"
            stroke="#0f172a"
            strokeWidth="2.5"
          />
          
          {/* Magnifying Glass held in hand */}
          <g className={isScanning ? "animate-[bounce_1s_infinite]" : ""}>
            {/* Glass Handle */}
            <path
              d="M74 74 L92 92"
              stroke="#92400e"
              strokeWidth="5"
              strokeLinecap="round"
            />
            {/* Glass Rim */}
            <circle
              cx="72"
              cy="72"
              r="14"
              fill="#e0f2fe"
              fillOpacity="0.75"
              stroke="#0f172a"
              strokeWidth="3.5"
            />
            {/* Glass Highlight */}
            <path
              d="M66 65 Q70 63 76 66"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>
        </svg>
      </div>

      {/* Scout Speech / Status Pill */}
      <div className="flex-1 min-w-0">
        <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500 text-slate-900 border border-slate-900 text-[10px] font-extrabold font-fredoka uppercase tracking-wider mb-1">
          {isScanning ? 'Active Scanning' : 'Scout Ready'}
        </div>
        <p className="text-[11px] font-bold text-slate-800 dark:text-amber-200 font-fredoka leading-snug truncate">
          {statusText || (isScanning ? '80ms Telemetry • In Progress' : 'Ready to scout storage!')}
        </p>
      </div>
    </div>
  );
};
