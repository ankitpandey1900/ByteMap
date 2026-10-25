import React, { useState } from 'react';
import {
  Sparkles,
  HardDrive,
  Files,
  History,
  PieChart,
  Maximize2,
  X,
  Zap,
  CheckCircle2,
} from 'lucide-react';

interface ProofTab {
  id: string;
  tabLabel: string;
  icon: React.ReactNode;
  badge: string;
  badgeColor: string;
  title: string;
  subtitle: string;
  imageSrc: string;
  imageAlt: string;
  aspectRatioClass?: string;
  metrics: {
    label: string;
    value: string;
    detail: string;
    color: string;
  }[];
  findings: string[];
  verdict: string;
}

const proofTabs: ProofTab[] = [
  {
    id: 'treemap',
    tabLabel: '1.3M+ Files Treemap',
    icon: <HardDrive className="w-4 h-4" />,
    badge: '1,319,645 Files In One Scan',
    badgeColor: 'bg-amber-300',
    title: 'Real-Time Squarified Treemap on Windows-SSD (C:)',
    subtitle:
      'Actual unedited run scanning a 300GB NVMe SSD at 91% capacity. Traversed over 1.3 million files at 2,891 files/second without freezing the desktop.',
    imageSrc: '/screenshots/proof-treemap.webp',
    imageAlt: 'ByteMap 1.3M Files Scanned Real Desktop Run',
    metrics: [
      {
        label: 'Total Files Scanned',
        value: '1,319,645',
        detail: 'Walked in pure Rust via Rayon',
        color: 'bg-amber-100 text-amber-900 border-amber-400',
      },
      {
        label: 'Traversal Speed',
        value: '2,891 files/s',
        detail: 'Instant responsive UI rendering',
        color: 'bg-sky-100 text-sky-900 border-sky-400',
      },
      {
        label: 'Top Storage Hog',
        value: 'Users (168.1 GB)',
        detail: 'Windows.old (38.4 GB) spotted',
        color: 'bg-rose-100 text-rose-900 border-rose-400',
      },
      {
        label: 'Immediate Reclaim',
        value: '7.77 GB',
        detail: '100 safe targets queued',
        color: 'bg-emerald-100 text-emerald-900 border-emerald-400',
      },
    ],
    findings: [
      'Discovered a forgotten 38.43 GB Windows.old directory leftover from the previous Windows feature update.',
      'Spotted oversized root virtual memory allocations: pagefile.sys (10.20 GB) and hiberfil.sys (6.74 GB).',
      'Pinpointed 100 safe junk targets in Reclaim Station worth 7.77 GB recoverable storage with one click.',
    ],
    verdict:
      'Zero spinning wheels. 1.3M files parsed and laid out into color-coded interactive rectangles in seconds.',
  },
  {
    id: 'categories',
    tabLabel: '9-Category Analytics',
    icon: <PieChart className="w-4 h-4" />,
    badge: '473,339 Dev Files Tracked',
    badgeColor: 'bg-cyan-300',
    title: 'Aggregated Storage Breakdown Across 9 Categories',
    subtitle:
      'ByteMap maps file extensions into 9 distinct buckets. Every single byte is accounted for without dumping heavy cache databases on your machine.',
    imageSrc: '/screenshots/proof-categories.webp',
    imageAlt: 'ByteMap 9 Category Storage Analytics Breakdown',
    metrics: [
      {
        label: 'Other & System Data',
        value: '158.6 GB (61%)',
        detail: '625,113 total files cataloged',
        color: 'bg-slate-100 text-slate-900 border-slate-400',
      },
      {
        label: 'Installed Apps',
        value: '43.85 GB (16.9%)',
        detail: '27,851 application binaries',
        color: 'bg-red-100 text-red-900 border-red-400',
      },
      {
        label: 'Developer Source & Builds',
        value: '10.64 GB (4.1%)',
        detail: '473,339 dev files & node_modules',
        color: 'bg-indigo-100 text-indigo-900 border-indigo-400',
      },
      {
        label: 'Images & Photos',
        value: '16.79 GB (6.5%)',
        detail: '152,287 visual assets',
        color: 'bg-pink-100 text-pink-900 border-pink-400',
      },
    ],
    findings: [
      'Developer workspace footprint isolated: 473,339 files inside code repositories accounted for 10.64 GB.',
      'Media audit: 2,008 video files consumed 22.09 GB (8.5%), while 152,287 image files took 16.79 GB (6.5%).',
      'Zero orphaned categories: Documents (1.93 GB), Games (3.51 GB), and Archives (2.23 GB) instantly viewable.',
    ],
    verdict:
      'Instant clarity on what is really eating your drive: binaries, video footage, or nested developer builds.',
  },
  {
    id: 'duplicates',
    tabLabel: 'BLAKE3 Duplicate Finder',
    icon: <Files className="w-4 h-4" />,
    badge: '21.40 GB Reclaimable Space',
    badgeColor: 'bg-emerald-300',
    title: '3-Tier Cryptographic BLAKE3 Duplicate Detector',
    subtitle:
      'ByteMap found 14 identical duplicate groups totaling 21.40 GB reclaimable. Files are verified byte-for-byte using size filters, prefix hashes, and full BLAKE3 hashes.',
    imageSrc: '/screenshots/proof-duplicates.webp',
    imageAlt: 'ByteMap Duplicate Detector 21.4GB Reclaimable Run',
    metrics: [
      {
        label: 'Reclaimable Storage',
        value: '21.40 GB',
        detail: 'Safe to delete identical copies',
        color: 'bg-emerald-100 text-emerald-900 border-emerald-400',
      },
      {
        label: 'Duplicate Groups Found',
        value: '14 Groups',
        detail: 'Cryptographically verified',
        color: 'bg-amber-100 text-amber-900 border-amber-400',
      },
      {
        label: 'Top Duplicate Hog',
        value: 'weights.bin (3x)',
        detail: '4.27 GB each • +8.54 GB reclaim',
        color: 'bg-rose-100 text-rose-900 border-rose-400',
      },
      {
        label: 'Duplicate Video Cache',
        value: 'VID MP4 (3x)',
        detail: '1.87 GB each • +3.75 GB reclaim',
        color: 'bg-purple-100 text-purple-900 border-purple-400',
      },
    ],
    findings: [
      'Caught 3 identical 4.27 GB AI model weight files (weights.bin) duplicated in Chrome caches, browser profile paths, and Windows.old, recovering 8.54 GB.',
      'Found 3 exact 1.87 GB copies of a video file duplicated inside Clipchamp video editor IndexedDB blob caches, recovering 3.75 GB.',
      'Byte-for-byte safety guarantee: Never flags by file name alone. Hash verification prevents accidental file loss.',
    ],
    verdict:
      '21.40 GB of genuine, byte-for-byte duplicate junk safely reclaimed without guessing or taking risks.',
  },
  {
    id: 'timemachine',
    tabLabel: 'Time Machine Delta',
    icon: <History className="w-4 h-4" />,
    badge: '+205.5 GB Surge Caught',
    badgeColor: 'bg-rose-300',
    title: 'Time Machine: Where Did My Space Go?',
    subtitle:
      'Compared against a baseline snapshot taken on 19 Oct. ByteMap immediately revealed a massive +205.5 GB expansion across 245,318 new files.',
    imageSrc: '/screenshots/proof-timemachine.webp',
    imageAlt: 'ByteMap Time Machine Storage Delta Comparison Modal',
    aspectRatioClass: 'max-w-2xl mx-auto',
    metrics: [
      {
        label: 'Total Disk Expansion',
        value: '+205.5 GB',
        detail: 'Baseline: 54.4 GB → Now: 259.9 GB',
        color: 'bg-rose-100 text-rose-900 border-rose-400',
      },
      {
        label: 'New Files Added',
        value: '+245,318',
        detail: 'Tracked across all subdirectories',
        color: 'bg-amber-100 text-amber-900 border-amber-400',
      },
      {
        label: 'App Bloat Surge',
        value: '+41.52 GB',
        detail: '2.33 GB grew to 43.85 GB',
        color: 'bg-red-100 text-red-900 border-red-400',
      },
      {
        label: 'Media Growth',
        value: '+20.70 GB',
        detail: 'Images (+16.5GB) + Videos (+4.2GB)',
        color: 'bg-sky-100 text-sky-900 border-sky-400',
      },
    ],
    findings: [
      'Spotted exactly which category blew up: System/Other grew by +132.4 GB and Installed Apps jumped by +41.52 GB.',
      'Developer workspace evolution caught: Dev directories increased by +4.44 GB (6.20 GB to 10.64 GB).',
      'No SQLite database needed: Snapshots are ultra-lightweight JSON trees saved locally only when you click save.',
    ],
    verdict:
      'Stop wondering why your drive is suddenly full. Compare two snapshots and see every swollen folder highlighted in red.',
  },
];

export const RealWorldProof: React.FC = () => {
  const [activeTabId, setActiveTabId] = useState<string>('treemap');
  const [zoomModalOpen, setZoomModalOpen] = useState<boolean>(false);

  const currentTab = proofTabs.find((t) => t.id === activeTabId) || proofTabs[0];

  return (
    <section id="proof" className="py-20 px-4 sm:px-6 lg:px-8 bg-sky-50 border-b-3 border-slate-900 relative">
      {/* Comic background dots */}
      <div className="absolute inset-0 bg-comic-dots opacity-25 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-xl bg-amber-400 border-2 border-slate-900 shadow-comic-sm font-comic text-xs uppercase text-slate-900 mb-3">
            <Sparkles className="w-4 h-4 text-slate-900" />
            <span>Unedited Field Proof • Real Desktop Scans</span>
          </div>
          <h2 className="font-bangers text-4xl sm:text-5xl md:text-6xl text-slate-900 uppercase tracking-wide">
            REAL PRODUCTION PROOF ON 1,300,000+ FILES
          </h2>
          <p className="max-w-3xl mx-auto font-comicNeue text-base sm:text-lg font-bold text-slate-700 mt-2">
            No marketing renders or fake mockups. Below are actual unedited screenshots from a live Windows 11 system with 1.3M+ files, 21.4 GB in verified duplicates, and a +205.5 GB Time Machine storage delta.
          </p>
        </div>

        {/* Tab Selector Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-10">
          {proofTabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`inline-flex items-center space-x-2 px-4 py-2.5 rounded-2xl border-2.5 border-slate-900 font-comic text-xs sm:text-sm uppercase tracking-wide transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-400 text-slate-900 shadow-comic -translate-y-1'
                    : 'bg-white hover:bg-amber-100 text-slate-800 shadow-comic-sm'
                }`}
              >
                {tab.icon}
                <span>{tab.tabLabel}</span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border border-slate-900 ${tab.badgeColor}`}>
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Main Proof Showcase Card */}
        <div className="bg-white rounded-3xl border-3 border-slate-900 shadow-comic-xl overflow-hidden">
          {/* Top Titlebar */}
          <div className="p-4 sm:p-5 bg-amber-400 border-b-2.5 border-slate-900 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-slate-900 inline-block" />
                <span className="w-3.5 h-3.5 rounded-full bg-amber-300 border-2 border-slate-900 inline-block" />
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-900 inline-block" />
              </div>
              <span className="font-comic text-xs uppercase font-bold text-slate-900 hidden sm:inline">
                ByteMap Live Capture • {currentTab.title}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setZoomModalOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border-2 border-slate-900 font-comic text-xs uppercase text-slate-900 shadow-comic-sm cursor-pointer transition-transform hover:scale-105"
                title="Click to view full uncompressed screenshot"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Zoom Proof</span>
              </button>
              <span className="px-2.5 py-1 rounded-xl bg-slate-900 text-amber-300 font-bangers text-xs uppercase tracking-wider">
                Live Evidence
              </span>
            </div>
          </div>

          {/* Screenshot Display Area */}
          <div className="p-2 sm:p-4 md:p-6 bg-slate-100 border-b-2.5 border-slate-900">
            <div className={`relative group ${currentTab.aspectRatioClass || 'max-w-6xl mx-auto'}`}>
              <div
                onClick={() => setZoomModalOpen(true)}
                className="cursor-zoom-in relative rounded-2xl border-3 border-slate-900 shadow-comic-lg overflow-hidden bg-slate-900 hover:shadow-comic-xl transition-all"
              >
                <img
                  src={currentTab.imageSrc}
                  alt={currentTab.imageAlt}
                  width={1920}
                  height={988}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-auto object-contain block hover:scale-[1.008] transition-transform duration-200"
                  style={{ imageRendering: '-webkit-optimize-contrast', aspectRatio: '1920 / 988' }}
                />
                {/* Hover overlay hint */}
                <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <div className="px-4 py-2 rounded-xl bg-amber-400 border-2 border-slate-900 shadow-comic font-bangers text-sm text-slate-900 uppercase tracking-wide flex items-center space-x-2">
                    <Maximize2 className="w-4 h-4" />
                    <span>Click to Zoom & Inspect Numbers</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Live Data Breakdown & Analysis */}
          <div className="p-6 sm:p-8 bg-white">
            <div className="mb-6">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`px-2.5 py-0.5 rounded-lg border-2 border-slate-900 font-comic text-xs uppercase font-bold text-slate-900 ${currentTab.badgeColor}`}>
                  {currentTab.badge}
                </span>
                <span className="font-comic text-xs text-slate-500 font-bold uppercase">
                  Verified In-App Metrics
                </span>
              </div>
              <h3 className="font-bangers text-3xl sm:text-4xl text-slate-900 uppercase tracking-wide">
                {currentTab.title}
              </h3>
              <p className="font-comicNeue text-base sm:text-lg font-bold text-slate-700 mt-1 max-w-4xl">
                {currentTab.subtitle}
              </p>
            </div>

            {/* Metric Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
              {currentTab.metrics.map((m) => (
                <div
                  key={m.label}
                  className={`p-4 rounded-2xl border-2.5 border-slate-900 shadow-comic-sm ${m.color}`}
                >
                  <div className="text-[11px] font-comic font-bold uppercase opacity-80 mb-1">
                    {m.label}
                  </div>
                  <div className="font-bangers text-2xl sm:text-3xl uppercase tracking-wide leading-none mb-1">
                    {m.value}
                  </div>
                  <div className="text-[11px] font-comicNeue font-bold opacity-90 leading-tight">
                    {m.detail}
                  </div>
                </div>
              ))}
            </div>

            {/* Key Findings List */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {currentTab.findings.map((f, i) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl bg-amber-50 border-2 border-slate-900 shadow-comic-sm flex items-start space-x-3"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="font-comicNeue text-sm font-bold text-slate-800 leading-snug">
                    {f}
                  </p>
                </div>
              ))}
            </div>

            {/* Bottom Verdict Quote */}
            <div className="p-4 rounded-2xl bg-sky-100 border-2.5 border-slate-900 shadow-comic flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-sky-400 border-2 border-slate-900 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5 text-slate-900" />
                </div>
                <div>
                  <span className="font-comic text-[11px] uppercase font-bold text-slate-600 block leading-tight">
                    Performance Verdict
                  </span>
                  <span className="font-comicNeue text-sm sm:text-base font-bold text-slate-900">
                    "{currentTab.verdict}"
                  </span>
                </div>
              </div>

              <a
                href="#download"
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 border-2 border-slate-900 font-bangers text-sm uppercase tracking-wide text-slate-900 shadow-comic-sm transition-transform hover:-translate-y-0.5 cursor-pointer ml-auto"
              >
                <span>Test on Your Own Drive</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Zoom Modal */}
      {zoomModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6"
          onClick={() => setZoomModalOpen(false)}
        >
          <div
            className="relative bg-white rounded-3xl border-3 border-slate-900 shadow-comic-2xl max-w-6xl w-full max-h-[95vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Titlebar */}
            <div className="px-4 py-3 bg-amber-400 border-b-2.5 border-slate-900 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-comic text-xs uppercase font-bold text-slate-900">
                  🔍 Full-Resolution Evidence • {currentTab.title}
                </span>
              </div>
              <button
                onClick={() => setZoomModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-white hover:bg-rose-400 border-2 border-slate-900 flex items-center justify-center shadow-comic-sm cursor-pointer transition-colors"
                aria-label="Close Preview"
              >
                <X className="w-4 h-4 text-slate-900" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-3 sm:p-6 overflow-auto bg-slate-900 flex-1 flex items-center justify-center">
              <img
                src={currentTab.imageSrc}
                alt={currentTab.imageAlt}
                className="max-w-full max-h-[85vh] w-auto h-auto rounded-xl border-2.5 border-slate-900 shadow-comic object-contain"
                style={{ imageRendering: '-webkit-optimize-contrast' }}
              />
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-2.5 bg-white border-t-2 border-slate-900 flex items-center justify-between text-xs font-comic font-bold text-slate-700">
              <span>Unmodified screenshot captured directly from ByteMap desktop application.</span>
              <button
                onClick={() => setZoomModalOpen(false)}
                className="px-3 py-1 rounded-lg bg-amber-300 border border-slate-900 hover:bg-amber-400 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
