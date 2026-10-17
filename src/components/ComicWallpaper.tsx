import React from 'react';

export const ComicWallpaper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gradient-to-b from-sky-400 via-sky-300 to-blue-500 flex flex-col p-2 md:p-4 select-none">
      {/* Background Mountains & Clouds SVG */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Sun burst rays */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[140vw] h-[70vh] bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.4)_0%,transparent_70%)]" />

        {/* Comic Speed / Digital Data Particles */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1.5px,transparent_1.5px)] [background-size:16px_16px]" />

        {/* Left Clouds */}
        <div className="absolute top-6 left-6 opacity-80 animate-pulse-subtle">
          <svg width="180" height="90" viewBox="0 0 180 90" fill="none">
            <path
              d="M30 70 C15 70 0 58 0 42 C0 28 12 16 28 16 C34 6 48 0 65 0 C86 0 102 10 110 26 C116 22 124 20 132 20 C148 20 160 32 160 48 C172 48 180 58 180 70 C180 82 170 90 156 90 L30 90 Z"
              fill="#ffffff"
              fillOpacity="0.85"
            />
          </svg>
        </div>

        {/* Right Clouds */}
        <div className="absolute top-10 right-8 opacity-80">
          <svg width="220" height="110" viewBox="0 0 220 110" fill="none">
            <path
              d="M36 85 C18 85 0 70 0 52 C0 34 16 20 34 20 C42 8 58 0 80 0 C105 0 124 12 134 32 C142 27 152 25 162 25 C182 25 196 40 196 60 C210 60 220 72 220 86 C220 100 208 110 190 110 L36 110 Z"
              fill="#ffffff"
              fillOpacity="0.85"
            />
          </svg>
        </div>

        {/* Mountain Silhouettes at bottom */}
        <div className="absolute bottom-0 inset-x-0 h-40 opacity-40">
          <svg viewBox="0 0 1440 320" className="w-full h-full" preserveAspectRatio="none">
            <path
              fill="#1e3a8a"
              d="M0,224L60,202.7C120,181,240,139,360,144C480,149,600,203,720,213.3C840,224,960,192,1080,165.3C1200,139,1320,117,1380,106.7L1440,96L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
            />
          </svg>
        </div>
      </div>

      {/* Main ByteMap Window Container */}
      <div className="relative z-10 flex-1 flex flex-col rounded-2xl border-3 border-slate-900 bg-slate-100 dark:bg-slate-950 shadow-comic-xl overflow-hidden min-h-0">
        {/* macOS Style Window Frame Top Bar */}
        <div className="h-7 bg-slate-200 dark:bg-slate-900 border-b-2 border-slate-900 px-3 flex items-center justify-between shrink-0 select-none">
          {/* Window Traffic Lights */}
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-red-500 border border-slate-900 inline-block shadow-sm" />
            <span className="w-3 h-3 rounded-full bg-amber-400 border border-slate-900 inline-block shadow-sm" />
            <span className="w-3 h-3 rounded-full bg-emerald-500 border border-slate-900 inline-block shadow-sm" />
          </div>

          {/* Window Title */}
          <div className="font-comic text-xs tracking-wider text-slate-700 dark:text-slate-300 uppercase">
            ByteMap — Storage Intelligence
          </div>

          {/* Spacer */}
          <div className="w-12" />
        </div>

        {/* Inner App Content */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
};
