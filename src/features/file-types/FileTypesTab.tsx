import React, { useState } from 'react';
import {
  Layers,
  FileCode,
  Film,
  Image,
  Music,
  Archive,
  Terminal,
  Gamepad,
  File,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatBytes, formatNumber, getCategoryColor } from '@/lib/utils';
import { FileCategory } from '@/types';

export const FileTypesTab: React.FC = () => {
  const { scanSummary, settings } = useAppStore();
  const [selectedCat, setSelectedCat] = useState<string>('all');

  const categories = scanSummary?.categories || [];
  const extensions = scanSummary?.extensions || [];

  const filteredExtensions = extensions.filter((ext) => {
    if (selectedCat === 'all') return true;
    return ext.category === selectedCat;
  });

  const getCategoryIcon = (category: FileCategory) => {
    switch (category) {
      case 'video':
        return <Film className="w-4 h-4 text-blue-600" />;
      case 'image':
        return <Image className="w-4 h-4 text-pink-600" />;
      case 'audio':
        return <Music className="w-4 h-4 text-purple-600" />;
      case 'document':
        return <File className="w-4 h-4 text-emerald-600" />;
      case 'archive':
        return <Archive className="w-4 h-4 text-amber-600" />;
      case 'app':
        return <Terminal className="w-4 h-4 text-cyan-600" />;
      case 'dev':
        return <FileCode className="w-4 h-4 text-indigo-600" />;
      case 'game':
        return <Gamepad className="w-4 h-4 text-orange-600" />;
      default:
        return <Layers className="w-4 h-4 text-slate-600" />;
    }
  };

  if (!scanSummary || categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[420px] p-8 text-center bg-white rounded-2xl border-2.5 border-slate-900 shadow-comic select-none">
        <div className="w-16 h-16 rounded-2xl bg-amber-400 border-2.5 border-slate-900 shadow-comic flex items-center justify-center mb-4">
          <Layers className="w-8 h-8 text-slate-900" />
        </div>
        <div className="inline-flex items-center px-3 py-1 rounded-lg bg-amber-400 border-2 border-slate-900 shadow-comic-sm font-comic text-xs uppercase tracking-wide text-slate-900 mb-2">
          File Types Idle
        </div>
        <h3 className="font-comic text-xl text-slate-900 uppercase tracking-wide mb-1">
          No File Types Scouted Yet
        </h3>
        <p className="font-fredoka text-xs text-slate-600 max-w-sm font-semibold">
          Click <strong>ANALYZE</strong> to scout your drive and analyze category distributions and file extension volumes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full select-none font-sans text-slate-900">
      {/* Top Banner Card */}
      <div className="p-4 bg-white border-2.5 border-slate-900 rounded-2xl shadow-comic">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-amber-400 border-2 border-slate-900 shadow-comic-sm font-bangers text-xs uppercase tracking-wider text-slate-900 mb-1">
          <Layers className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Category Analysis</span>
        </div>
        <h2 className="font-bangers text-2xl text-slate-900 uppercase tracking-wider mt-1">
          File-Type Analytics
        </h2>
        <p className="text-xs font-comicNeue font-bold text-slate-600">
          Breakdown of scanned data across categories and file extensions.
        </p>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
        {categories.map((cat) => {
          const isSelected = selectedCat === cat.category;
          const catColor = getCategoryColor(cat.category);
          return (
            <div
              key={cat.category}
              onClick={() => setSelectedCat(isSelected ? 'all' : cat.category)}
              className={`p-3.5 rounded-2xl border-2.5 border-slate-900 cursor-pointer transition-all flex flex-col justify-between comic-card-hover ${
                isSelected
                  ? 'bg-amber-100 shadow-[5px_5px_0px_#0f172a] -translate-y-0.5'
                  : 'bg-white shadow-comic hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-2">
                  <span
                    className="w-3.5 h-3.5 rounded-md border border-slate-900 shrink-0"
                    style={{ backgroundColor: catColor }}
                  />
                  <h3 className="font-bangers text-lg uppercase tracking-wider text-slate-900">
                    {cat.category}
                  </h3>
                </div>
                {getCategoryIcon(cat.category)}
              </div>

              <div className="text-2xl font-mono font-bold text-slate-900 mt-1 tabular-nums">
                {formatBytes(cat.total_bytes, settings.unit)}
              </div>

              <div className="w-full bg-slate-200 h-2.5 rounded-full mt-2.5 overflow-hidden border border-slate-900">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    backgroundColor: catColor,
                    width: `${Math.min(100, cat.percentage)}%`,
                  }}
                />
              </div>

              <div className="flex justify-between items-center text-xs font-comicNeue font-bold text-slate-600 mt-2">
                <span className="font-mono">{formatNumber(cat.file_count)} files</span>
                <span className="font-mono font-bold text-slate-900">{cat.percentage.toFixed(1)}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Top Extensions Comic Section */}
      <div className="p-4 bg-white border-2.5 border-slate-900 rounded-2xl shadow-comic">
        <div className="flex items-center justify-between mb-3 border-b-2 border-slate-900 pb-2">
          <div>
            <h3 className="font-comic text-base uppercase text-slate-900">
              {selectedCat === 'all'
                ? 'Top File Extensions'
                : `Extensions for ${selectedCat.toUpperCase()}`}
            </h3>
            <p className="text-xs font-fredoka font-semibold text-slate-500">
              Ranked by aggregated byte volume
            </p>
          </div>

          {selectedCat !== 'all' && (
            <button
              onClick={() => setSelectedCat('all')}
              className="px-2.5 py-1 rounded-lg border border-slate-900 bg-amber-200 font-comic text-xs uppercase shadow-comic-sm"
            >
              Show all categories
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {filteredExtensions.map((ext, idx) => (
            <div
              key={ext.extension}
              className="p-2.5 rounded-xl bg-slate-50 border-1.5 border-slate-900 flex items-center justify-between text-xs hover:bg-amber-50 transition-colors"
            >
              <div className="flex items-center space-x-2.5">
                <span className="font-comic text-slate-500 w-5">
                  #{idx + 1}
                </span>
                <span
                  className="w-2.5 h-2.5 rounded-sm border border-slate-900 shrink-0"
                  style={{ backgroundColor: getCategoryColor(ext.category) }}
                />
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {ext.extension}
                </span>
                <span className="text-[10px] font-comic uppercase text-slate-500">
                  ({ext.category})
                </span>
              </div>

              <div className="text-right">
                <span className="font-comic text-slate-900">
                  {formatBytes(ext.total_bytes, settings.unit)}
                </span>
                <p className="text-[10px] font-fredoka font-bold text-slate-500">
                  {formatNumber(ext.file_count)} files
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
