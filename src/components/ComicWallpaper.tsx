import React from 'react';

export const ComicWallpaper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="relative w-full h-full overflow-hidden bg-[#38bdf8] flex flex-col p-1 sm:p-1.5 md:p-2 min-h-0 min-w-0">
      {/* Background Effects Layer */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Authentic Ben-Day halftone print dots overlay — flat retro newsprint style */}
        <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#ffffff_2px,transparent_2px)] [background-size:16px_16px]" />

        {/* Floating cloud — left, gently bouncing */}
        <div className="absolute top-6 left-6 opacity-90 animate-comic-float">
          <svg width="180" height="90" viewBox="0 0 180 90" fill="none">
            <path
              d="M30 70 C15 70 0 58 0 42 C0 28 12 16 28 16 C34 6 48 0 65 0 C86 0 102 10 110 26 C116 22 124 20 132 20 C148 20 160 32 160 48 C172 48 180 58 180 70 C180 82 170 90 156 90 L30 90 Z"
              fill="#ffffff"
              fillOpacity="0.92"
              stroke="#0f172a"
              strokeWidth="2"
            />
          </svg>
        </div>

        {/* Floating cloud — right, with slight delay */}
        <div className="absolute top-10 right-8 opacity-90" style={{ animation: 'comic-float 4s ease-in-out 0.5s infinite' }}>
          <svg width="220" height="110" viewBox="0 0 220 110" fill="none">
            <path
              d="M36 85 C18 85 0 70 0 52 C0 34 16 20 34 20 C42 8 58 0 80 0 C105 0 124 12 134 32 C142 27 152 25 162 25 C182 25 196 40 196 60 C210 60 220 72 220 86 C220 100 208 110 190 110 L36 110 Z"
              fill="#ffffff"
              fillOpacity="0.92"
              stroke="#0f172a"
              strokeWidth="2"
            />
          </svg>
        </div>

        {/* Small accent cloud — center-top, very gentle float */}
        <div className="absolute top-4 left-1/2 -translate-x-1/3 opacity-60" style={{ animation: 'comic-float 5s ease-in-out 1s infinite' }}>
          <svg width="100" height="50" viewBox="0 0 100 50" fill="none">
            <path
              d="M15 40 C7 40 0 33 0 24 C0 16 7 10 16 10 C18 4 26 0 36 0 C48 0 56 6 60 14 C63 12 67 11 72 11 C82 11 88 18 88 27 C94 27 100 32 100 39 C100 45 94 50 86 50 L15 50 Z"
              fill="#ffffff"
              fillOpacity="0.7"
              stroke="#0f172a"
              strokeWidth="1.5"
            />
          </svg>
        </div>

        {/* Playful cartoon sparkle stars */}
        <div className="absolute top-16 left-[20%] text-xl opacity-40 animate-pulse-subtle">✦</div>
        <div className="absolute top-28 right-[15%] text-lg opacity-30" style={{ animation: 'pulse-subtle 2.5s ease-in-out 0.7s infinite' }}>✧</div>
        <div className="absolute top-8 right-[40%] text-sm opacity-25 animate-pulse-subtle">⭐</div>

        {/* Mountain Silhouettes at bottom — layered for depth */}
        <div className="absolute bottom-0 inset-x-0 h-44 opacity-30">
          <svg viewBox="0 0 1440 320" className="w-full h-full" preserveAspectRatio="none">
            <path
              fill="#1e3a8a"
              d="M0,224L60,202.7C120,181,240,139,360,144C480,149,600,203,720,213.3C840,224,960,192,1080,165.3C1200,139,1320,117,1380,106.7L1440,96L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
            />
          </svg>
        </div>
        <div className="absolute bottom-0 inset-x-0 h-32 opacity-20">
          <svg viewBox="0 0 1440 320" className="w-full h-full" preserveAspectRatio="none">
            <path
              fill="#1e40af"
              d="M0,288L80,266.7C160,245,320,203,480,192C640,181,800,203,960,218.7C1120,235,1280,245,1360,250.7L1440,256L1440,320L0,320Z"
            />
          </svg>
        </div>
      </div>

      {/* Main ByteMap Window Container */}
      <div className="relative z-10 flex-1 flex flex-col rounded-2xl border-3 border-slate-900 bg-slate-100 dark:bg-slate-950 shadow-comic-xl overflow-hidden min-h-0 min-w-0">
        {/* Inner App Content (Clean full height without fake titlebar) */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
};
