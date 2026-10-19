import React from 'react';
import {
  Zap,
  Files,
  Trash2,
  LayoutGrid,
  Cpu,
  EyeOff,
  Sparkles,
  History,
  Code2,
  FileSpreadsheet,
} from 'lucide-react';

interface FeatureCard {
  icon: React.ReactNode;
  title: string;
  badge: string;
  badgeColor: string;
  description: string;
  highlight: string;
}

const features: FeatureCard[] = [
  {
    icon: <Zap className="w-6 h-6 text-slate-900" />,
    title: 'Parallel Rust Traversal',
    badge: 'Rayon Multithreading',
    badgeColor: 'bg-amber-300',
    description:
      'Walks directories asynchronously on native OS worker threads. Progress events throttle at ~80ms intervals so your desktop stays silky smooth even across 500,000 files.',
    highlight: 'Scans 1TB NVMe drives in ~4.2 seconds',
  },
  {
    icon: <History className="w-6 h-6 text-slate-900" />,
    title: 'Time Machine Storage Diff',
    badge: 'Where Did Space Go?',
    badgeColor: 'bg-amber-400',
    description:
      'Takes lightweight baseline snapshots of directory sizes and compares them over time. Caught 20GB vanishing overnight? ByteMap flags every swollen directory with >5MB delta.',
    highlight: 'Instantly spots hidden Windows update and game bloat',
  },
  {
    icon: <EyeOff className="w-6 h-6 text-slate-900" />,
    title: 'Strict Zero-Database Privacy',
    badge: '100% Volatile RAM',
    badgeColor: 'bg-emerald-300',
    description:
      'No SQLite database, no hidden background services, and zero analytics telemetry. Scan data lives strictly in RAM while the app is open and is wiped clean on exit.',
    highlight: 'Zero disk footprints left behind',
  },
  {
    icon: <Code2 className="w-6 h-6 text-slate-900" />,
    title: 'Developer Build Sweeper',
    badge: 'node_modules & target',
    badgeColor: 'bg-indigo-300',
    description:
      'Specifically scans and batches stale package directories: node_modules, target, .venv, .next, .gradle, and dist. Reclaim 50GB+ from abandoned client repos in one click.',
    highlight: 'Source code is 100% shielded and untouched',
  },
  {
    icon: <Files className="w-6 h-6 text-slate-900" />,
    title: '3-Stage BLAKE3 Duplicate Finder',
    badge: 'Cryptographic Precision',
    badgeColor: 'bg-cyan-300',
    description:
      'Compares files by exact byte size first, then hashes a 4KB prefix, and only runs a full BLAKE3 cryptographic hash on genuine collision candidates. Never deletes by name alone.',
    highlight: 'Zero false-positive deletions guaranteed',
  },
  {
    icon: <FileSpreadsheet className="w-6 h-6 text-slate-900" />,
    title: 'One-Click Offline HTML Audit',
    badge: 'Zero-Dependency Report',
    badgeColor: 'bg-sky-300',
    description:
      'Exports a self-contained, offline HTML audit report with interactive category breakdowns, top 20 storage hogs, and print-ready PDF styling to send to IT or colleagues.',
    highlight: 'Opens in any browser offline without internet',
  },
  {
    icon: <Trash2 className="w-6 h-6 text-slate-900" />,
    title: 'Safe Recycle Bin Guard',
    badge: 'Undo Anytime',
    badgeColor: 'bg-rose-300',
    description:
      'ByteMap never does permanent raw hard deletes by default. Cleaned files are safely sent to your Windows Recycle Bin, and protected system folders like C:\\Windows are strictly locked.',
    highlight: 'Accidental delete protection built-in',
  },
  {
    icon: <LayoutGrid className="w-6 h-6 text-slate-900" />,
    title: 'Squarified Pop-Art Treemap',
    badge: 'Interactive Hierarchy',
    badgeColor: 'bg-purple-300',
    description:
      'Turns nested directories into crisp, color-coded visual rectangles with one-click category spotlighting. Click into any folder to drill down into its contents and use breadcrumbs to jump back.',
    highlight: 'Instantly spots 10GB+ hidden movie/game folders',
  },
  {
    icon: <Cpu className="w-6 h-6 text-slate-900" />,
    title: 'Tauri 2 Native Architecture',
    badge: 'Only ~15MB Installer',
    badgeColor: 'bg-yellow-300',
    description:
      'Built with Tauri 2 and Rust 2021 instead of bloated Electron runtimes that chew 800MB RAM. Cold starts take under 400 milliseconds.',
    highlight: 'Uses 10x less RAM than web-wrapper software',
  },
];

export const FeaturesGrid: React.FC = () => {
  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative">
      {/* Title & Badge */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-xl bg-amber-400 border-2 border-slate-900 shadow-comic-sm font-comic text-xs uppercase text-slate-900 mb-3">
          <Sparkles className="w-4 h-4 text-slate-900" />
          <span>Engineered For Speed & Integrity</span>
        </div>
        <h2 className="font-bangers text-4xl sm:text-5xl md:text-6xl text-slate-900 uppercase tracking-wide">
          EVERYTHING YOU NEED TO RECLAIM YOUR DRIVE
        </h2>
        <p className="max-w-2xl mx-auto font-comicNeue text-base sm:text-lg font-bold text-slate-700 mt-2">
          Packed with high-performance tools designed to give you instant clarity without risking your data.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feat) => (
          <div
            key={feat.title}
            className="p-6 bg-white rounded-3xl border-3 border-slate-900 shadow-comic hover:shadow-comic-lg hover:-translate-y-1 transition-all flex flex-col justify-between group relative overflow-hidden"
          >
            {/* Halftone texture accent */}
            <div className="absolute inset-0 bg-comic-dots opacity-[0.05] pointer-events-none" />

            <div>
              {/* Header Icon + Badge */}
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-400 border-2.5 border-slate-900 flex items-center justify-center shadow-comic-sm group-hover:rotate-6 transition-transform">
                  {feat.icon}
                </div>
                <span className={`px-2.5 py-1 rounded-lg border-2 border-slate-900 font-comic text-[11px] uppercase tracking-wide text-slate-900 shadow-xs ${feat.badgeColor}`}>
                  {feat.badge}
                </span>
              </div>

              {/* Title */}
              <h3 className="font-bangers text-2xl text-slate-900 uppercase tracking-wide mb-2">
                {feat.title}
              </h3>

              {/* Description */}
              <p className="font-comicNeue text-sm font-bold text-slate-600 leading-relaxed mb-4">
                {feat.description}
              </p>
            </div>

            {/* Bottom Highlight */}
            <div className="pt-3 border-t-2 border-slate-900/10 flex items-center space-x-2 text-xs font-mono font-bold text-slate-800">
              <span className="text-emerald-600">✦</span>
              <span>{feat.highlight}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
