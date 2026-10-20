import React, { useState, useEffect } from 'react';
import { Download, ShieldCheck, Zap, HardDrive, CheckCircle2, Sparkles, Apple, Eye } from 'lucide-react';
import { GithubIcon } from './GithubIcon';

export const HeroSection: React.FC = () => {
  const [downloadCount, setDownloadCount] = useState<number | null>(null);
  const [visitorCount, setVisitorCount] = useState<number | null>(null);
  const [exeUrl, setExeUrl] = useState<string>('https://github.com/ankitpandey1900/ByteMap/releases/download/v1.0.6/ByteMap_1.0.6_x64-setup.exe');
  const [dmgUrl, setDmgUrl] = useState<string>('https://github.com/ankitpandey1900/ByteMap/releases/download/v1.0.6/ByteMap_1.0.6_universal.dmg');
  const [msiUrl, setMsiUrl] = useState<string>('https://github.com/ankitpandey1900/ByteMap/releases/download/v1.0.6/ByteMap_1.0.6_x64_en-US.msi');

  useEffect(() => {
    // 1. Fetch live GitHub Release download metrics
    fetch('https://api.github.com/repos/ankitpandey1900/ByteMap/releases')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          let total = 0;
          for (const rel of data) {
            if (Array.isArray(rel.assets)) {
              for (const asset of rel.assets) {
                total += asset.download_count || 0;
              }
            }
          }
          if (total > 0) setDownloadCount(total);

          // Find direct asset URLs across releases
          for (const rel of data) {
            if (Array.isArray(rel.assets)) {
              const dmg = rel.assets.find((a: any) => a.name.endsWith('.dmg'));
              if (dmg && dmg.browser_download_url) {
                setDmgUrl(dmg.browser_download_url);
                break;
              }
            }
          }
          for (const rel of data) {
            if (Array.isArray(rel.assets)) {
              const exe = rel.assets.find((a: any) => a.name.endsWith('.exe'));
              if (exe && exe.browser_download_url) {
                setExeUrl(exe.browser_download_url);
                break;
              }
            }
          }
          for (const rel of data) {
            if (Array.isArray(rel.assets)) {
              const msi = rel.assets.find((a: any) => a.name.endsWith('.msi'));
              if (msi && msi.browser_download_url) {
                setMsiUrl(msi.browser_download_url);
                break;
              }
            }
          }
        }
      })
      .catch(() => {});

    // 2. Free live visitor counter with baseline for past visitors
    const BASELINE_PREVIOUS_VISITORS = 180;
    try {
      const hasCountedSession = sessionStorage.getItem('bytemap_visitor_counted');
      const counterEndpoint = hasCountedSession
        ? 'https://abacus.jasoncameron.dev/get/bytemap/visits'
        : 'https://abacus.jasoncameron.dev/hit/bytemap/visits';

      fetch(counterEndpoint)
        .then((res) => res.json())
        .then((data) => {
          if (data && typeof data.value === 'number') {
            sessionStorage.setItem('bytemap_visitor_counted', 'true');
            setVisitorCount(BASELINE_PREVIOUS_VISITORS + data.value);
          } else {
            setVisitorCount(BASELINE_PREVIOUS_VISITORS);
          }
        })
        .catch(() => {
          // Secondary fallback counter
          fetch('https://countapi.mileshilliard.com/api/v1/hit/bytemap_site_visitors')
            .then((res) => res.json())
            .then((data) => {
              if (data && typeof data.value === 'number') {
                setVisitorCount(BASELINE_PREVIOUS_VISITORS + data.value);
              } else {
                setVisitorCount(BASELINE_PREVIOUS_VISITORS);
              }
            })
            .catch(() => {
              setVisitorCount(BASELINE_PREVIOUS_VISITORS);
            });
        });
    } catch {
      setVisitorCount(BASELINE_PREVIOUS_VISITORS);
    }
  }, []);

  return (
    <section className="relative pt-12 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Halftone dot background */}
      <div className="absolute inset-0 bg-comic-dots opacity-40 pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10 text-center">
        {/* Top Tagline Badge & Live Counters */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-amber-300 border-2.5 border-slate-900 shadow-comic-sm font-comic text-xs uppercase tracking-wide text-slate-900">
            <Sparkles className="w-4 h-4 text-slate-900 animate-spin" style={{ animationDuration: '6s' }} />
            <span>Windows & macOS Desktop Storage Intelligence • v1.0.6</span>
          </div>
          {visitorCount !== null && (
            <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-sky-300 border-2.5 border-slate-900 shadow-comic-sm font-comic text-xs uppercase tracking-wide text-slate-900 hover:-translate-y-0.5 transition-transform cursor-default" title="Total visitors who explored ByteMap">
              <Eye className="w-3.5 h-3.5 text-slate-900" />
              <span><strong>{visitorCount.toLocaleString()}</strong> Site Explorers</span>
            </div>
          )}
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
            href={exeUrl}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-3 px-7 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 border-3 border-slate-900 font-bangers text-xl uppercase tracking-wider text-slate-900 shadow-comic-lg hover:-translate-y-1 hover:shadow-comic-xl active:translate-y-0.5 active:shadow-comic transition-all cursor-pointer group"
          >
            <Download className="w-6 h-6 group-hover:translate-y-1 transition-transform" />
            <div className="text-left">
              <span className="block leading-none">Windows Setup</span>
              <span className="font-mono text-[11px] font-bold text-slate-800 tracking-normal block mt-1">
                .exe • Win 10/11
              </span>
            </div>
          </a>

          {/* macOS Download - Direct .dmg Download */}
          <a
            href={dmgUrl}
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
            href={msiUrl}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-3.5 rounded-2xl bg-cyan-400 hover:bg-cyan-300 border-3 border-slate-900 font-bangers text-lg uppercase tracking-wide text-slate-900 shadow-comic hover:-translate-y-1 hover:shadow-comic-lg active:translate-y-0.5 transition-all cursor-pointer"
          >
            <span>MSI Installer</span>
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
          {/* Floating real proof badge top left */}
          <div className="hidden sm:inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-2xl bg-amber-300 border-2.5 border-slate-900 shadow-comic font-comic text-xs uppercase font-bold text-slate-900 absolute -top-5 left-6 z-20 hover:scale-105 transition-transform">
            <Zap className="w-4 h-4 text-slate-900" />
            <span>1,319,645 Files Scanned • 2,891 files/sec</span>
          </div>

          {/* Floating real proof badge bottom right */}
          <div className="hidden sm:inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-2xl bg-emerald-400 border-2.5 border-slate-900 shadow-comic font-comic text-xs uppercase font-bold text-slate-900 absolute -bottom-4 right-6 z-20 hover:scale-105 transition-transform">
            <CheckCircle2 className="w-4 h-4 text-slate-900" />
            <span>7.77 GB Reclaimable Space Located</span>
          </div>

          {/* Comic background accent backdrop */}
          <div className="absolute -inset-2 bg-amber-400 rounded-3xl border-3 border-slate-900 shadow-comic-xl transform -rotate-0.5" />
          
          {/* Main App Frame - Edge-to-Edge Single Native Window */}
          <div className="relative bg-slate-900 rounded-2xl border-3 border-slate-900 shadow-comic-lg overflow-hidden group">
            <a href="#proof" title="Click to view full uncompressed screenshots and proof" className="block relative">
              <img
                src="/screenshots/overview.png"
                alt="ByteMap Storage Intelligence Dashboard Screenshot showing 1,319,645 files scanned"
                className="w-full h-auto block select-none group-hover:scale-[1.005] transition-transform duration-200"
                style={{ imageRendering: '-webkit-optimize-contrast' }}
              />
              {/* Subtle hover prompt */}
              <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <div className="px-4 py-2 rounded-xl bg-amber-400 border-2.5 border-slate-900 shadow-comic font-bangers text-sm text-slate-900 uppercase tracking-wide">
                  View Full 1.3M File Proof Breakdown →
                </div>
              </div>
            </a>
          </div>
        </div>

        {/* Caption below screenshot */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs font-comic font-bold text-slate-700">
          <span>Actual unedited desktop scan on Windows-SSD (C:).</span>
          <a
            href="#proof"
            className="text-slate-900 underline decoration-amber-400 decoration-2 hover:text-amber-600 transition-colors"
          >
            Inspect the 1.3M treemap, BLAKE3 duplicate results & Time Machine delta →
          </a>
        </div>
      </div>
    </section>
  );
};
