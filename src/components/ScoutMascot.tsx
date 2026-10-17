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
      {/* Cartoon Explorer Scout Mascot Image */}
      <div className={`relative shrink-0 ${className} rounded-2xl border-2.5 border-slate-900 overflow-hidden bg-amber-300 shadow-comic-sm`}>
        <img
          src="/logo.png"
          alt="ByteMap Explorer Mascot"
          className={`w-full h-full object-cover ${isScanning ? 'animate-bounce' : ''}`}
        />
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
