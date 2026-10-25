import React, { useState } from 'react';
import { HardDrive, Sparkles, AlertTriangle, Layers } from 'lucide-react';

interface MockDrive {
  letter: string;
  label: string;
  total: number;
  used: number;
  type: string;
  categories: { name: string; size: number; color: string; percent: number }[];
}

const mockDrives: MockDrive[] = [
  {
    letter: 'C:\\',
    label: 'Windows NVMe SSD',
    total: 512,
    used: 442,
    type: 'NTFS Fast Solid State',
    categories: [
      { name: 'Apps & Games', size: 185, color: '#06b6d4', percent: 42 },
      { name: 'Video & Media', size: 110, color: '#3b82f6', percent: 25 },
      { name: 'Archives & Zips', size: 68, color: '#f59e0b', percent: 15 },
      { name: 'Documents & Code', size: 45, color: '#10b981', percent: 10 },
      { name: 'System Temp Cache', size: 34, color: '#ef4444', percent: 8 },
    ],
  },
  {
    letter: 'D:\\',
    label: 'Projects & Backups',
    total: 1000,
    used: 620,
    type: 'exFAT High Capacity',
    categories: [
      { name: '4K Footage & Renders', size: 320, color: '#3b82f6', percent: 52 },
      { name: 'Git Repos & Node Modules', size: 140, color: '#6366f1', percent: 23 },
      { name: 'ISO Images & Installers', size: 110, color: '#f59e0b', percent: 18 },
      { name: 'Photos & RAW Assets', size: 50, color: '#ec4899', percent: 7 },
    ],
  },
];

export const InteractiveDemo: React.FC = () => {
  const [selectedDriveIdx, setSelectedDriveIdx] = useState(0);
  const [unit, setUnit] = useState<'gb' | 'gib'>('gb');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const drive = mockDrives[selectedDriveIdx];
  const percentUsed = Math.round((drive.used / drive.total) * 100);
  const freeSpace = drive.total - drive.used;

  const multiplier = unit === 'gib' ? 0.9313 : 1;
  const formatVal = (val: number) => (val * multiplier).toFixed(0);

  return (
    <section id="demo" className="py-20 px-4 sm:px-6 lg:px-8 bg-amber-50 border-y-3 border-slate-900 relative">
      <div className="absolute inset-0 bg-comic-stripes opacity-30 pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header Badge & Title */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-xl bg-cyan-400 border-2 border-slate-900 shadow-comic-sm font-comic text-xs uppercase text-slate-900 mb-3">
            <Sparkles className="w-4 h-4 text-slate-900" />
            <span>Try The Experience Below</span>
          </div>
          <h2 className="font-bangers text-4xl sm:text-5xl md:text-6xl text-slate-900 uppercase tracking-wide">
            INTERACTIVE STORAGE SIMULATOR
          </h2>
          <p className="max-w-2xl mx-auto font-comicNeue text-base sm:text-lg font-bold text-slate-700 mt-2">
            Click to switch drives, toggle measurement units, and test how ByteMap’s precision milestone gauge and category breakdown behave in real time.
          </p>
        </div>

        {/* Simulator Box */}
        <div className="bg-white rounded-3xl border-3 border-slate-900 shadow-comic-xl overflow-hidden max-w-4xl mx-auto">
          {/* Top Control Bar */}
          <div className="p-4 sm:p-5 bg-sky-400 border-b-2.5 border-slate-900 flex flex-wrap items-center justify-between gap-3">
            {/* Drive Selector Buttons */}
            <div className="flex items-center space-x-2">
              {mockDrives.map((d, idx) => (
                <button
                  key={d.letter}
                  onClick={() => {
                    setSelectedDriveIdx(idx);
                    setActiveCategory(null);
                  }}
                  className={`inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl border-2 border-slate-900 font-comic text-xs uppercase shadow-comic-sm transition-all cursor-pointer ${
                    selectedDriveIdx === idx
                      ? 'bg-amber-400 text-slate-900 -translate-y-0.5 shadow-comic'
                      : 'bg-white hover:bg-amber-100 text-slate-700'
                  }`}
                >
                  <HardDrive className="w-4 h-4" />
                  <span>{d.letter} {d.label}</span>
                </button>
              ))}
            </div>

            {/* Unit Switcher */}
            <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border-2 border-slate-900 shadow-comic-sm">
              <span className="text-[11px] font-comic uppercase text-slate-600 px-2 font-bold">Unit:</span>
              <button
                onClick={() => setUnit('gb')}
                className={`px-2.5 py-1 rounded-lg text-xs font-comic font-bold transition-all cursor-pointer ${
                  unit === 'gb' ? 'bg-amber-400 text-slate-900 border border-slate-900 shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                GB (1000)
              </button>
              <button
                onClick={() => setUnit('gib')}
                className={`px-2.5 py-1 rounded-lg text-xs font-comic font-bold transition-all cursor-pointer ${
                  unit === 'gib' ? 'bg-amber-400 text-slate-900 border border-slate-900 shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                GiB (1024)
              </button>
            </div>
          </div>

          {/* Drive Health & Tactical Storage Bar */}
          <div className="p-5 sm:p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bangers text-2xl text-slate-900 uppercase tracking-wide">
                    {drive.letter} {drive.label}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-lg bg-emerald-400 border border-slate-900 font-bangers text-xs uppercase tracking-wider text-slate-900 shadow-comic-sm">
                    {drive.type}
                  </span>
                </div>
                <p className="text-xs font-mono font-bold text-slate-500 mt-1">
                  Used: {formatVal(drive.used)} {unit.toUpperCase()} of {formatVal(drive.total)} {unit.toUpperCase()} • Free: {formatVal(freeSpace)} {unit.toUpperCase()}
                </p>
              </div>

              {/* Status Badge */}
              <div className={`px-3 py-1.5 rounded-xl border-2 border-slate-900 font-comic text-xs uppercase shadow-comic-sm flex items-center space-x-1.5 ${
                percentUsed >= 85 ? 'bg-rose-400 text-slate-900 animate-pulse' : 'bg-emerald-300 text-slate-900'
              }`}>
                {percentUsed >= 85 ? <AlertTriangle className="w-4 h-4 text-slate-900" /> : <Sparkles className="w-4 h-4 text-slate-900" />}
                <span>{percentUsed >= 85 ? '🔥 Storage Critical' : '✅ Healthy Capacity'}</span>
              </div>
            </div>

            {/* Precision Storage Gauge */}
            <div className="p-4 bg-slate-50 rounded-2xl border-2.5 border-slate-900 shadow-comic-sm space-y-2">
              <div className="flex items-center justify-between font-comic text-xs uppercase text-slate-700 font-bold">
                <span>Disk Utilization Gauge</span>
                <span className="font-mono text-sm text-slate-900 font-black">{percentUsed}% FULL</span>
              </div>

              {/* Progress Track */}
              <div className="relative h-6 rounded-lg border-2.5 border-slate-900 bg-slate-200 overflow-hidden shadow-inner">
                {/* 25%, 50%, 75% tick marks */}
                <div className="absolute top-0 bottom-0 left-1/4 w-[2px] bg-slate-900/30 z-20 pointer-events-none" />
                <div className="absolute top-0 bottom-0 left-2/4 w-[2px] bg-slate-900/40 z-20 pointer-events-none" />
                <div className="absolute top-0 bottom-0 left-3/4 w-[2px] bg-slate-900/40 z-20 pointer-events-none" />

                {/* Fill Bar */}
                <div
                  className={`h-full transition-all duration-500 border-r-2 border-slate-900 relative ${
                    percentUsed >= 85 ? 'bg-rose-500' : percentUsed >= 70 ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${percentUsed}%` }}
                >
                  <div className="absolute inset-0 bg-comic-stripes opacity-20 pointer-events-none" />
                </div>
              </div>

              {/* Milestone Labels */}
              <div className="flex justify-between text-[10px] font-mono font-bold text-slate-500 pt-1">
                <span>0% Empty</span>
                <span>25% Nominal</span>
                <span>50% Mid</span>
                <span>75% Warning</span>
                <span className="text-rose-800 font-extrabold">100% Full</span>
              </div>
            </div>

            {/* Category Breakdown Interactive Grid */}
            <div className="space-y-3">
              <h4 className="font-bangers text-lg text-slate-900 uppercase tracking-wide flex items-center space-x-2">
                <Layers className="w-4 h-4 text-amber-500" />
                <span>Detected Space Hogs (Click to Inspect)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {drive.categories.map((cat) => {
                  const isSelected = activeCategory === cat.name;
                  return (
                    <div
                      key={cat.name}
                      onClick={() => setActiveCategory(isSelected ? null : cat.name)}
                      className={`p-3.5 rounded-xl border-2 border-slate-900 shadow-comic-sm transition-all cursor-pointer flex items-center justify-between ${
                        isSelected ? 'bg-amber-200 scale-[1.02] shadow-comic' : 'bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-4 h-4 rounded-md border-2 border-slate-900 shadow-xs shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <div>
                          <p className="font-comic text-xs uppercase text-slate-900 font-bold">{cat.name}</p>
                          <p className="text-[11px] font-mono text-slate-500 font-semibold">
                            {formatVal(cat.size)} {unit.toUpperCase()} • {cat.percent}% of drive
                          </p>
                        </div>
                      </div>

                      <span className="font-bangers text-sm text-slate-900 px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-900">
                        {cat.percent}%
                      </span>
                    </div>
                  );
                })}
              </div>

              {activeCategory && (
                <div className="p-3.5 bg-cyan-100 rounded-xl border-2 border-slate-900 text-xs font-comicNeue font-bold text-slate-800 flex items-center justify-between animate-fade-in">
                  <span>💡 In the full desktop app, clicking <strong>"{activeCategory}"</strong> jumps straight to the interactive Treemap drilldown!</span>
                  <a
                    href="#download"
                    className="ml-3 px-3 py-1 rounded-lg bg-amber-400 border border-slate-900 font-comic uppercase text-[11px] text-slate-900 shadow-comic-sm hover:-translate-y-0.5 transition-all shrink-0"
                  >
                    Get App Free
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
