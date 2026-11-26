import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Search,
  Maximize2,
  Minimize2,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  ShieldCheck,
  Sparkles,
  Keyboard,
  HardDrive,
  Compass,
  FileText,
  Layers,
  History,
  Trash2,
  AlertTriangle,
  Info,
  ExternalLink,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { ActiveTab } from '@/types';
import { api } from '@/lib/api';

interface DocCallout {
  variant: 'tip' | 'safety' | 'warning';
  title: string;
  body: string;
}

interface DocSection {
  id: string;
  group: 'Getting Started' | 'Core Views' | 'Cleanup & AI' | 'Time Machine & Export' | 'Reference';
  title: string;
  summary: string;
  icon: React.ReactNode;
  recommendedTab?: ActiveTab;
  tabLabel?: string;
  overview: string[];
  steps?: string[];
  keyFacts?: { label: string; value: string }[];
  callout?: DocCallout;
}

const DOC_SECTIONS: DocSection[] = [
  {
    id: 'quick-start',
    group: 'Getting Started',
    title: 'Overview & Quick Start',
    summary: 'Scan any drive or folder in seconds and locate gigabytes of hidden clutter safely.',
    icon: <BookOpen className="w-4 h-4" />,
    recommendedTab: 'overview',
    tabLabel: 'Open Kingdom Overview',
    overview: [
      'ByteMap is a native desktop storage analyzer powered by Rust and Tauri 2. Instead of locking your interface or building multi-gigabyte background databases, it traverses files in parallel and keeps the entire live index strictly in volatile RAM.',
      'Once you close ByteMap, all scanned file lists and folder trees vanish immediately from memory—leaving zero residual files on your SSD.',
    ],
    steps: [
      'Select a local drive on the Kingdom welcome screen or click Analyze in the top-right header.',
      'Wait a few seconds while native Rust threads walk directories and aggregate byte totals.',
      'Inspect the Storage Map in the center to see which folders hold the majority of your space.',
      'Switch to Large Files, Duplicates, or Cleanup to prune unwanted files safely to the OS Recycle Bin / Trash.',
    ],
    keyFacts: [
      { label: 'Engine Architecture', value: 'Rust 2021 + Rayon Parallel Traversal' },
      { label: 'Storage Policy', value: 'Zero-DB In-Memory (RAM only)' },
      { label: 'Deletion Default', value: 'Native OS Recycle Bin / macOS Trash' },
      { label: 'Network Telemetry', value: 'None (100% Offline)' },
    ],
    callout: {
      variant: 'tip',
      title: 'Quick Tip for Busy Drives',
      body: 'Want to reclaim space right away without scanning an entire 1 TB drive? Jump straight to Cleanup → Coding & IDE Caches to detect gigabytes of npm, pnpm, Cargo, and AI model caches in under a second.',
    },
  },
  {
    id: 'drive-health',
    group: 'Getting Started',
    title: 'Understanding Drive Health Badges',
    summary: 'How SSD utilization affects write speeds, OS paging, and hardware longevity.',
    icon: <HardDrive className="w-4 h-4" />,
    recommendedTab: 'drives',
    tabLabel: 'Inspect Hardware Drives',
    overview: [
      'Solid-state drives rely on free blocks for wear-leveling and TRIM garbage collection. Once an OS boot drive climbs past 75–85% full, write throughput degrades and Windows or macOS updates may stall due to insufficient staging headroom.',
      'ByteMap monitors live OS volume metrics via sysinfo and classifies every mounted partition into four operational stages.',
    ],
    keyFacts: [
      { label: 'SAFE (0% – 49%)', value: 'Optimal SSD headroom for OS updates, swaps, and builds.' },
      { label: 'RISING (50% – 74%)', value: 'Healthy working capacity. Monitor large media & downloads.' },
      { label: 'HEAVY (75% – 89%)', value: 'Warning range. Review Large Files & Dev Caches soon.' },
      { label: 'CRITICAL (90%+)', value: 'Action needed immediately to keep system updates and paging stable.' },
    ],
    callout: {
      variant: 'safety',
      title: 'Recommended Minimum Free Space',
      body: 'Try to maintain at least 15–20 GB (or ~15%) free on your primary OS partition so virtual memory pagefiles and system updates run without throttling.',
    },
  },
  {
    id: 'storage-treemap',
    group: 'Core Views',
    title: 'Kingdom & Interactive Storage Map',
    summary: 'Navigate nested folders visually with balanced proportions, spotlight search, and 1:1 category colors.',
    icon: <Compass className="w-4 h-4" />,
    recommendedTab: 'overview',
    tabLabel: 'Open Storage Map',
    overview: [
      'The center Storage Map lays out directories and root files as squarified rectangles whose colors match the File Types legend 1:1. Large storage consumers appear immediately without digging through nested Explorer trees.',
      'Small trailing items (<1.5% of the active view) are cleanly consolidated into a clickable "+N Smaller Items" bucket so bottom corners stay legible instead of collapsing into unreadable micro-slivers.',
    ],
    steps: [
      'Click any folder tile to drill directly into that folder and recompute the sub-map instantaneously.',
      'Use Balanced vs Exact (1:1) scale in the map bar: Balanced prevents one giant folder from squashing smaller neighbors into narrow ribbons, while Exact shows strict linear area.',
      'Click any category chip (System, Video, Dev, App, etc.) in the legend or File Types card to spotlight matching tiles.',
      'Press Ctrl+F / Cmd+F (or click Spotlight) to filter and highlight matching files or extensions live.',
      'Right-click any file or folder tile to drill in, reveal in File Explorer / Finder, or move safe items to Trash.',
    ],
    callout: {
      variant: 'tip',
      title: 'Drill Back Any Time',
      body: 'Use the interactive breadcrumb pills above the treemap or click Back to step up one directory at a time.',
    },
  },
  {
    id: 'file-types-explorer',
    group: 'Core Views',
    title: 'File Types, Top Extensions & Explorer',
    summary: 'Drill down by file category or extension and sort the heaviest files and directories.',
    icon: <Layers className="w-4 h-4" />,
    recommendedTab: 'file-types',
    tabLabel: 'Open File Types Analytics',
    overview: [
      'ByteMap maps file extensions across 9 specialized categories (System, Video, Image, Audio, Document, Archive, App, Dev, Game, and Other) using consistent colors across the Donut chart, Top Extensions bar, File Types tab, and Storage Map.',
      'Clicking any extension in Top Extensions (such as .mp4, .dll, .iso, or .rlib) opens Explorer pre-filtered to that extension.',
    ],
    steps: [
      'Click a category card in File Types to filter Top File Extensions for only that category.',
      'Click any extension card to jump directly into Explorer filtered to matching files.',
      'Toggle between Top Files (up to 500 largest) and Top Folders (up to 250 largest) inside Explorer.',
      'Click column headers (Name, Size, Category, Modified) to re-sort or reveal items in native File Explorer.',
    ],
  },
  {
    id: 'large-files-intel',
    group: 'Core Views',
    title: 'Large Files & Built-In File Intelligence',
    summary: 'Spot giant files (10 MB to 5 GB+) with plain-English explanations before touching anything critical.',
    icon: <FileText className="w-4 h-4" />,
    recommendedTab: 'large-files',
    tabLabel: 'Open Large Files',
    overview: [
      'Mysterious 4–15 GB files like pagefile.sys, hiberfil.sys, Windows Installer .msi caches, or Chrome OptGuide weights.bin often confuse users. ByteMap inspects file names and system paths to surface clear badges and plain-English guidance.',
      'You can filter by size tiers using the interactive histogram bars, filter by inactivity age (>3 mo, >6 mo, >1 yr Cold Storage), or batch-clean safe non-system files.',
    ],
    steps: [
      'Click any bar or tier pill in the File Size Distribution Histogram to isolate a size range.',
      'Read the yellow File Intelligence card beneath system or AI model files before taking action.',
      'Use Select Safe to quickly select non-system large files in view, then click Clean.',
    ],
    callout: {
      variant: 'warning',
      title: 'System File Protection',
      body: 'Critical OS files (like pagefile.sys and hiberfil.sys) are marked as protected and cannot be accidentally deleted from batch cleanup lists.',
    },
  },
  {
    id: 'duplicates-blake3',
    group: 'Cleanup & AI',
    title: '3-Stage Cryptographic BLAKE3 Duplicate Finder',
    summary: 'Find exact byte-for-byte duplicate files across your whole scanned directory without false positives.',
    icon: <Sparkles className="w-4 h-4" />,
    recommendedTab: 'duplicates',
    tabLabel: 'Open Duplicates Scanner',
    overview: [
      'Matching duplicates by filename alone is dangerous—two different builds or backups can share names. ByteMap uses a strict 3-stage pipeline to guarantee two files are cryptographically identical before grouping them:',
    ],
    steps: [
      'Stage 1 — Exact Byte Size Funnel: Groups files across the scanned root with identical byte lengths (skipping files < 1 KB).',
      'Stage 2 — Fast 4 KB Prefix Hash: Reads only the first 4 KB of same-size candidates to reject differing headers immediately.',
      'Stage 3 — Full BLAKE3 Cryptographic Digest: Streams remaining candidates through BLAKE3 to prove byte-for-byte equality.',
    ],
    callout: {
      variant: 'safety',
      title: 'App Dependency Safeguard',
      body: 'Identical .dll or runtime binaries inside Program Files / Application bundles are flagged as App Dependencies and kept protected so installed software never breaks.',
    },
  },
  {
    id: 'ai-dev-caches',
    group: 'Cleanup & AI',
    title: 'AI Models & Developer Cache Purger',
    summary: 'Reclaim tens of gigabytes from Ollama, HuggingFace, Chrome AI weights, npm, pnpm, Cargo, and stale builds.',
    icon: <Trash2 className="w-4 h-4" />,
    recommendedTab: 'cleanup',
    tabLabel: 'Open Cleanup Hub',
    overview: [
      'Modern coding workflows and local AI tools stash gigabytes inside hidden home and AppData directories (~/.ollama/models, ~/.cache/huggingface, Chrome OptGuideOnDeviceModel, npm-cache, pnpm-store, .cargo/registry).',
      'The Cleanup Hub splits recovery into four focused tabs so you never delete active source code by accident:',
    ],
    keyFacts: [
      { label: 'Coding & IDE Caches', value: 'Dedicated instant scan for AI models, IDE caches, npm/pnpm/Cargo/pip.' },
      { label: 'Junk & Temp Files', value: 'Non-system temp dumps, crash logs, and old archive installers found in scans.' },
      { label: 'Developer Build Bloat', value: 'Detects heavy node_modules, target, dist, .next, and .venv build folders.' },
      { label: 'Empty Folders & Ghosts', value: 'Finds 0-byte orphan directories left behind by uninstalled software.' },
    ],
    callout: {
      variant: 'tip',
      title: 'No Full Scan Needed',
      body: 'Coding & IDE Caches scans your user profile toolchain paths directly in ~1 second—no need to wait for a full C:\\ scan first.',
    },
  },
  {
    id: 'time-machine',
    group: 'Time Machine & Export',
    title: 'Time Machine Snapshots & Audit Reports',
    summary: 'Compare storage growth over days or weeks and export offline HTML/JSON storage reports.',
    icon: <History className="w-4 h-4" />,
    recommendedTab: 'overview',
    tabLabel: 'Open Kingdom & Time Machine',
    overview: [
      'Notice 20 GB suddenly vanish? Time Machine stores tiny client-side summary snapshots in localStorage only when you save a snapshot (or enable Auto-Save Snapshot in Settings). No full file index or SQLite DB is ever written to disk.',
      'Compare any two snapshots—or compare your current scan against any historical baseline—to pinpoint which categories and folders grew.',
    ],
    steps: [
      'Click Time Machine in the top Kingdom summary strip to save a baseline or inspect deltas.',
      'Filter snapshots by date range (All Time, Today, Last 7 Days, Last 30 Days) to isolate recent bloat.',
      'Click HTML Report in Kingdom to download a self-contained interactive audit page you can share or archive offline, or JSON for raw programmatic processing.',
      'Manage or clear saved snapshots anytime under Preferences in Settings.',
    ],
  },
  {
    id: 'shortcuts-zoom',
    group: 'Reference',
    title: 'Keyboard Shortcuts, Native Zoom & Units',
    summary: 'Control interface scale natively, configure GB units, and trigger quick spotlight searches.',
    icon: <Keyboard className="w-4 h-4" />,
    recommendedTab: 'settings',
    tabLabel: 'Open Settings',
    overview: [
      'ByteMap v1.0.14 uses native Tauri WebView scaling (and clean rem scaling in web previews) across standard desktop stops: 75%, 80%, 90%, 100%, 110%, 125%, and 150%.',
      'Storage sizes standardize on clean KB, MB, GB, and TB labels everywhere. In Settings you can switch between Decimal Base-10 (1000 B = 1 KB, matching drive labels) and Base-1024 (1024 B = 1 KB, Windows Explorer style).',
    ],
    keyFacts: [
      { label: 'Ctrl / Cmd +  or  Scroll Up', value: 'Zoom In cleanly to the next desktop scale stop' },
      { label: 'Ctrl / Cmd -  or  Scroll Down', value: 'Zoom Out cleanly without clipping edges' },
      { label: 'Ctrl / Cmd + 0', value: 'Reset display zoom immediately to 100%' },
      { label: 'Ctrl / Cmd + F', value: 'Open Spotlight Search in Kingdom Storage Map' },
      { label: 'Esc', value: 'Close active Spotlight bar or modal dialog' },
    ],
  },
  {
    id: 'safety-guards',
    group: 'Reference',
    title: 'Security & Path Boundary Protection',
    summary: 'How ByteMap prevents accidental system damage before touching any file.',
    icon: <ShieldCheck className="w-4 h-4" />,
    recommendedTab: 'settings',
    tabLabel: 'Review Safety Policy',
    overview: [
      'Every deletion request in the Rust backend runs through strict validation before any OS filesystem call executes:',
    ],
    steps: [
      'Canonical Boundary Check: Target paths are canonicalized and verified to sit strictly inside your authorized scan root or user profile cache directories. Path traversal (../) is rejected.',
      'Protected System Roots: Critical OS paths (C:\\Windows, C:\\Program Files, /System, /usr, /bin, /etc, and root drive mount points) are blocked from deletion.',
      'Pre-Deletion Size Verification: Immediately prior to trashing, Rust checks that the target still matches the scanned byte length—if another app modified the file concurrently, cleanup refuses to proceed.',
      'Recycle Bin / Trash First: Unless you explicitly disable Prefer Trash in Settings, all removals use the native OS trash bin so items remain recoverable.',
    ],
  },
];

const GROUP_ORDER: DocSection['group'][] = [
  'Getting Started',
  'Core Views',
  'Cleanup & AI',
  'Time Machine & Export',
  'Reference',
];

export const UserManualModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { setActiveTab } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDocId, setActiveDocId] = useState<string>('quick-start');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Keyboard Escape handler (unconditional hook call before early return)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredDocs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return DOC_SECTIONS;
    return DOC_SECTIONS.filter(
      (doc) =>
        doc.title.toLowerCase().includes(q) ||
        doc.summary.toLowerCase().includes(q) ||
        doc.group.toLowerCase().includes(q) ||
        doc.overview.some((p) => p.toLowerCase().includes(q)) ||
        (doc.steps && doc.steps.some((s) => s.toLowerCase().includes(q))) ||
        (doc.keyFacts &&
          doc.keyFacts.some(
            (f) => f.label.toLowerCase().includes(q) || f.value.toLowerCase().includes(q)
          ))
    );
  }, [searchQuery]);

  const activeDoc = useMemo(() => {
    return (
      filteredDocs.find((d) => d.id === activeDocId) ||
      filteredDocs[0] ||
      DOC_SECTIONS[0]
    );
  }, [filteredDocs, activeDocId]);

  const activeIndex = DOC_SECTIONS.findIndex((d) => d.id === activeDoc.id);
  const prevDoc = activeIndex > 0 ? DOC_SECTIONS[activeIndex - 1] : null;
  const nextDoc = activeIndex < DOC_SECTIONS.length - 1 ? DOC_SECTIONS[activeIndex + 1] : null;

  if (!isOpen) return null;

  const handleJumpToTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    onClose();
  };

  const modalContent = (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/75 backdrop-blur-sm font-sans text-slate-900 dark:text-slate-100 ${
        isFullscreen ? 'p-0' : 'p-2 sm:p-4 md:p-6'
      }`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-manual-modal-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-white dark:bg-[#0e121b] border-2.5 border-slate-900 dark:border-white/10 shadow-comic-xl flex flex-col overflow-hidden transition-all duration-150 ${
          isFullscreen
            ? 'w-screen h-screen rounded-none border-0'
            : 'w-[96vw] max-w-7xl h-[92vh] rounded-2xl'
        }`}
      >
        {/* Top Documentation Header Bar */}
        <div className="px-4 sm:px-6 py-3 bg-sky-400 dark:bg-[#101521] border-b-2 border-slate-900 dark:border-white/10 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-400 border-2 border-slate-900 flex items-center justify-center shadow-comic-sm shrink-0">
              <BookOpen className="w-4 h-4 text-slate-900 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h2
                  id="user-manual-modal-title"
                  className="font-heading text-base sm:text-lg uppercase tracking-wide text-slate-900 dark:text-white leading-none truncate"
                >
                  ByteMap Documentation
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-slate-900 text-amber-300 dark:bg-white/[0.08] dark:text-slate-200 dark:border dark:border-white/[0.12] font-mono text-[10px] font-bold">
                  v1.0.14
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-900/80 dark:text-slate-400 hidden sm:block mt-0.5">
                Architecture, interactive workflows, shortcuts, and storage safety reference
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-1 max-w-md mx-2">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search docs (treemap, BLAKE3, AI caches, zoom)..."
                aria-label="Search documentation"
                className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-white dark:bg-[#171d2b] border-2 border-slate-900 dark:border-white/15 text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear doc search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsFullscreen((prev) => !prev)}
              aria-label={isFullscreen ? 'Exit full screen' : 'Expand to full screen'}
              title={isFullscreen ? 'Restore window size' : 'Expand full screen'}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#171d2b] hover:bg-amber-200 dark:hover:bg-[#1f2638] border-2 border-slate-900 dark:border-white/15 text-xs font-bold text-slate-900 dark:text-slate-200 shadow-comic-sm cursor-pointer transition-colors"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span className="hidden md:inline">{isFullscreen ? 'Restore' : 'Full Screen'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close User Guide"
              title="Close Documentation (Esc)"
              className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-white dark:bg-[#171d2b] hover:bg-rose-400 hover:text-white dark:hover:bg-rose-500/25 border-2 border-slate-900 dark:border-white/15 text-slate-900 dark:text-slate-200 shadow-comic-sm cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Two-Pane Body: Sidebar Tree + Spacious Doc Reader */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Left Navigation Sidebar */}
          <aside className="w-64 lg:w-72 border-r-2 border-slate-900/15 dark:border-white/[0.08] bg-slate-50 dark:bg-[#111622] overflow-y-auto p-3 sm:p-4 space-y-5 shrink-0 hidden sm:block">
            {GROUP_ORDER.map((groupName) => {
              const items = filteredDocs.filter((d) => d.group === groupName);
              if (items.length === 0) return null;
              return (
                <div key={groupName} className="space-y-1.5">
                  <div className="px-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    {groupName}
                  </div>
                  <div className="space-y-1">
                    {items.map((item) => {
                      const isSelected = activeDoc.id === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setActiveDocId(item.id)}
                          className={`w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-400 text-slate-900 font-bold border border-slate-900 shadow-comic-sm dark:border-amber-300/60'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-white/[0.06] border border-transparent'
                          }`}
                        >
                          <span className="shrink-0 opacity-85">{item.icon}</span>
                          <span className="truncate">{item.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {filteredDocs.length === 0 && (
              <div className="p-3 text-xs text-slate-500 dark:text-slate-400 text-center">
                No topics matching &ldquo;{searchQuery}&rdquo;.
              </div>
            )}

            {/* Quick External Links */}
            <div className="pt-4 border-t border-slate-200 dark:border-white/[0.08] space-y-1.5">
              <button
                type="button"
                onClick={() => api.openExternalUrl('https://github.com/ankitpandey1900/ByteMap')}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-white/[0.05] cursor-pointer"
              >
                <span>GitHub Repository</span>
                <ExternalLink className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => api.openExternalUrl('https://bytemap.alltracker.online/')}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-white/[0.05] cursor-pointer"
              >
                <span>ByteMap Website</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </aside>

          {/* Main Reading Pane */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-8 lg:p-10 bg-white dark:bg-[#0e121b]">
            {/* Mobile Topic Selector */}
            <div className="sm:hidden mb-4">
              <select
                value={activeDoc.id}
                onChange={(e) => setActiveDocId(e.target.value)}
                aria-label="Select documentation topic"
                className="w-full px-3 py-2 rounded-xl border-2 border-slate-900 dark:border-white/15 bg-slate-50 dark:bg-[#161c29] text-xs font-bold text-slate-900 dark:text-slate-100"
              >
                {DOC_SECTIONS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.group} — {d.title}
                  </option>
                ))}
              </select>
            </div>

            <article className="max-w-3xl mx-auto space-y-6">
              {/* Article Header */}
              <div className="pb-5 border-b border-slate-200 dark:border-white/[0.08] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-400/15 border border-slate-900/20 dark:border-amber-400/30 text-[11px] font-bold uppercase tracking-wider text-amber-950 dark:text-amber-300">
                    {activeDoc.icon}
                    <span>{activeDoc.group}</span>
                  </span>

                  {activeDoc.recommendedTab && activeDoc.tabLabel && (
                    <button
                      type="button"
                      onClick={() => handleJumpToTab(activeDoc.recommendedTab!)}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 border-2 border-slate-900 dark:border-amber-300/60 text-xs font-bold uppercase text-slate-900 shadow-comic-sm transition-transform hover:-translate-y-0.5 cursor-pointer"
                    >
                      <span>{activeDoc.tabLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <h1 className="font-heading text-2xl sm:text-3xl text-slate-900 dark:text-white tracking-tight">
                  {activeDoc.title}
                </h1>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  {activeDoc.summary}
                </p>
              </div>

              {/* Overview Paragraphs */}
              <div className="space-y-3.5 text-sm sm:text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed">
                {activeDoc.overview.map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>

              {/* Key Reference Table */}
              {activeDoc.keyFacts && activeDoc.keyFacts.length > 0 && (
                <div className="rounded-2xl border border-slate-200 dark:border-white/[0.09] bg-slate-50 dark:bg-[#141925] overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-slate-200 dark:border-white/[0.08] text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 bg-slate-100/80 dark:bg-[#192030]">
                    Quick Reference
                  </div>
                  <div className="divide-y divide-slate-200 dark:divide-white/[0.06]">
                    {activeDoc.keyFacts.map((fact) => (
                      <div
                        key={fact.label}
                        className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 text-xs sm:text-sm"
                      >
                        <span className="font-mono font-bold text-slate-900 dark:text-amber-300 shrink-0">
                          {fact.label}
                        </span>
                        <span className="text-slate-600 dark:text-slate-300 sm:text-right">
                          {fact.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step-by-Step Workflow */}
              {activeDoc.steps && activeDoc.steps.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    How It Works Step-by-Step
                  </h3>
                  <ol className="space-y-2.5">
                    {activeDoc.steps.map((step, idx) => (
                      <li
                        key={idx}
                        className="flex items-start space-x-3 p-3.5 rounded-xl bg-slate-50 dark:bg-[#141925] border border-slate-200 dark:border-white/[0.08]"
                      >
                        <span className="w-6 h-6 rounded-lg bg-amber-400 text-slate-900 font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                          {step}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Semantic Callout Box */}
              {activeDoc.callout && (
                <div
                  className={`p-4 rounded-2xl border flex items-start space-x-3 ${
                    activeDoc.callout.variant === 'warning'
                      ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-300 dark:border-rose-400/30 text-rose-950 dark:text-rose-200'
                      : activeDoc.callout.variant === 'safety'
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-400/30 text-emerald-950 dark:text-emerald-200'
                        : 'bg-sky-50 dark:bg-sky-500/10 border-sky-300 dark:border-sky-400/30 text-sky-950 dark:text-sky-200'
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {activeDoc.callout.variant === 'warning' ? (
                      <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-300" />
                    ) : activeDoc.callout.variant === 'safety' ? (
                      <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
                    ) : (
                      <Info className="w-5 h-5 text-sky-600 dark:text-sky-300" />
                    )}
                  </div>
                  <div className="space-y-1 text-xs sm:text-sm">
                    <div className="font-bold uppercase tracking-wide text-[11px]">
                      {activeDoc.callout.title}
                    </div>
                    <p className="leading-relaxed opacity-90">{activeDoc.callout.body}</p>
                  </div>
                </div>
              )}

              {/* Previous / Next Footer Navigation */}
              <div className="pt-6 mt-6 border-t border-slate-200 dark:border-white/[0.08] flex items-center justify-between gap-3">
                {prevDoc ? (
                  <button
                    type="button"
                    onClick={() => setActiveDocId(prevDoc.id)}
                    className="flex items-center space-x-2 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-[#141925] hover:bg-amber-50 dark:hover:bg-[#1b2233] text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                    <div className="text-left">
                      <span className="text-[10px] uppercase text-slate-400 block leading-none">
                        Previous
                      </span>
                      <span className="font-bold">{prevDoc.title}</span>
                    </div>
                  </button>
                ) : (
                  <span />
                )}

                {nextDoc && (
                  <button
                    type="button"
                    onClick={() => setActiveDocId(nextDoc.id)}
                    className="flex items-center space-x-2 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-[#141925] hover:bg-amber-50 dark:hover:bg-[#1b2233] text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer transition-colors ml-auto"
                  >
                    <div className="text-right">
                      <span className="text-[10px] uppercase text-slate-400 block leading-none">
                        Next Topic
                      </span>
                      <span className="font-bold">{nextDoc.title}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                  </button>
                )}
              </div>
            </article>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
