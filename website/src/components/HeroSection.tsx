import React, { useState, useEffect } from 'react';
import { Download, ShieldCheck, Zap, HardDrive, CheckCircle2, Sparkles, Apple } from 'lucide-react';
import { GithubIcon } from './GithubIcon';

export const HeroSection: React.FC = () => {
  const [downloadCount, setDownloadCount] = useState<number | null>(null);

  useEffect(() => {
    fetch('https://api.github.com/repos/ankitpandey1900/ByteMap/releases')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          let total = 0;
          for (const rel of data) {
            if (Array.isArray(rel.assets)) {
              for (const asset of rel.assets) {
                total += asset.download_count || 0;
              }
            }
          }
          if (total > 0) setDownloadCount(total);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section className="relative pt-12 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Halftone dot background */}
      <div className="absolute inset-0 bg-comic-dots opacity-40 pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10 text-center">
        {/* Top Tagline Badge & Live Counter */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-amber-300 border-2.5 border-slate-900 shadow-comic-sm font-comic text-xs uppercase tracking-wide text-slate-900">
            <Sparkles className="w-4 h-4 text-slate-900 animate-spin" style={{ animationDuration: '6s' }} />
            <span>Windows & macOS Desktop Storage Intelligence • v1.0.3</span>
          </div>
          {downloadCount !== null && (
            <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-emerald-400 border-2.5 border-slate-900 shadow-comic-sm font-comic text-xs uppercase tracking-wide text-slate-900">
              <Download className="w-3.5 h-3.5 text-slate-900" />
              <span><strong>{downloadCount}</strong> Community Downloads</span>
            </div>
          )}
        </div>

        {/* Massive Comic Headline - Crystal Clear Readability */}
        <h1 className="font-bangers text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-slate-900 tracking-wide uppercase leading-tight max-w-5xl mx-auto mb-6">
          SEE WHERE YOUR DISK SPACE{' '}
          <span className="text-amber-500 underline decoration-slate-900 decoration-4 underline-offset-8">
            ACTUALLY
          </span>{' '}
          WENT.
        </h1>

        {/* Subtitle description */}
        <p className="max-w-3xl mx-auto font-comicNeue text-lg sm:text-xl font-bold text-slate-700 leading-relaxed mb-8">
          Most disk analyzers feel like Windows 98 software or bloatware dumping gigabytes of SQLite caches to your SSD.
          <span className="text-slate-900 font-extrabold"> ByteMap is built differently</span>: it traverses files with native Rust parallel threads, maps your storage in vibrant pop-art rectangles, and <span className="underline decoration-amber-400 decoration-3">wipes everything from RAM</span> the second you close the window.
        </p>

        {/* Download Call to Action Group */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-8">
          {/* Windows Download */}
          <a
            href="https://github.com/ankitpandey1900/ByteMap/releases/download/v1.0.3/ByteMap_1.0.3_x64-setup.exe"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-3 px-7 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 border-3 border-slate-900 font-bangers text-xl uppercase tracking-wider text-slate-900 shadow-comic-lg hover:-translate-y-1 hover:shadow-comic-xl active:translate-y-0.5 active:shadow-comic transition-all cursor-pointer group"
          >
            <Download className="w-6 h-6 group-hover:translate-y-1 transition-transform" />
            <div className="text-left">
              <span className="block leading-none">Windows Setup</span>
              <span className="font-mono text-[11px] font-bold text-slate-800 tracking-normal block mt-1">
                .exe • Win 10/11 (~15 MB)
              </span>
            </div>
          </a>

          {/* macOS Download */}
          <a
            href="#download-mac"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-3 px-7 py-3.5 rounded-2xl bg-emerald-400 hover:bg-emerald-300 border-3 border-slate-900 font-bangers text-xl uppercase tracking-wider text-slate-900 shadow-comic-lg hover:-translate-y-1 hover:shadow-comic-xl active:translate-y-0.5 active:shadow-comic transition-all cursor-pointer group"
          >
            <Apple className="w-6 h-6 group-hover:scale-110 transition-transform text-slate-900" />
            <div className="text-left">
              <span className="block leading-none">macOS MacBook</span>
              <span className="font-mono text-[11px] font-bold text-slate-800 tracking-normal block mt-1">
                .dmg • Universal Apple Silicon / Intel
              </span>
            </div>
          </a>

          {/* All Formats / MSI */}
          <a
            href="#download"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-3.5 rounded-2xl bg-cyan-400 hover:bg-cyan-300 border-3 border-slate-900 font-bangers text-lg uppercase tracking-wide text-slate-900 shadow-comic hover:-translate-y-1 hover:shadow-comic-lg active:translate-y-0.5 transition-all cursor-pointer"
          >
            <span>MSI & Options</span>
          </a>

          <a
            href="https://github.com/ankitpandey1900/ByteMap"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-3.5 rounded-2xl bg-white hover:bg-slate-100 border-3 border-slate-900 font-comic text-sm uppercase text-slate-900 shadow-comic hover:-translate-y-0.5 transition-all"
          >
            <GithubIcon className="w-5 h-5" />
            <span>GitHub (MIT)</span>
          </a>
        </div>

        {/* Feature Trust Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 text-xs font-comic font-bold text-slate-800 mb-14">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-white border-2 border-slate-900 shadow-comic-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>100% Offline & Private</span>
          </span>
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-white border-2 border-slate-900 shadow-comic-sm">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Rayon Parallel Traversal</span>
          </span>
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-white border-2 border-slate-900 shadow-comic-sm">
            <HardDrive className="w-4 h-4 text-blue-600" />
            <span>Zero SQLite or Local DBs</span>
          </span>
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-white border-2 border-slate-900 shadow-comic-sm">
            <CheckCircle2 className="w-4 h-4 text-purple-600" />
            <span>Windows 10 & 11 Ready</span>
          </span>
        </div>

        {/* App Showcase Screenshot Card */}
        <div className="relative max-w-5xl mx-auto">
          {/* Comic background accent backdrop */}
          <div className="absolute -inset-2 bg-amber-400 rounded-3xl border-3 border-slate-900 shadow-comic-xl transform -rotate-0.5" />
          
          {/* Main App Frame */}
          <div className="relative bg-slate-900 rounded-2xl border-3 border-slate-900 shadow-comic-lg overflow-hidden">
            {/* Window titlebar */}
            <div className="px-4 py-3 bg-sky-400 border-b-2.5 border-slate-900 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-slate-900 inline-block" />
                <span className="w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-slate-900 inline-block" />
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-900 inline-block" />
                <span className="font-comic text-xs uppercase text-slate-900 ml-2 font-bold hidden sm:inline">
                  ByteMap — Desktop Storage Intelligence
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-lg bg-amber-300 border border-slate-900 font-bangers text-[11px] uppercase tracking-wider text-slate-900">
                Live App Preview
              </span>
            </div>

            {/* Showcase Screenshot */}
            <div className="bg-slate-100 p-2 sm:p-4">
              <img
                src="/screenshots/overview.png"
                alt="ByteMap Storage Intelligence Dashboard Screenshot"
                className="w-full h-auto rounded-xl border-2.5 border-slate-900 shadow-comic object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
