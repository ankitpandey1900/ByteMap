import React, { useState } from 'react';
import { Layers } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatBytes, formatNumber, getCategoryColor } from '@/lib/utils';
import { EmptyScanState } from '@/components/EmptyScanState';
import { CategoryIcon } from '@/components/CategoryIcon';

interface FileTypesTabProps {
  onOpenScanModal?: () => void;
}

export const FileTypesTab: React.FC<FileTypesTabProps> = ({ onOpenScanModal }) => {
  const { scanSummary, settings, setActiveTab, setSearchQuery } = useAppStore();
  const [selectedCat, setSelectedCat] = useState<string>('all');

  const handleDrilldown = (extName: string) => {
    setSearchQuery(extName.startsWith('.') ? extName : `.${extName}`);
    setActiveTab('explore');
  };

  const categories = scanSummary?.categories || [];
  const extensions = scanSummary?.extensions || [];

  const filteredExtensions = extensions.filter((ext) => {
    if (selectedCat === 'all') return true;
    return ext.category === selectedCat;
  });

  if (!scanSummary || categories.length === 0) {
    return (
      <EmptyScanState
        badge="File Types Idle"
        title="No File Types Scouted Yet"
        description="Run a storage scan to break down your disk space by file category and top space-consuming extensions."
        onStartScan={onOpenScanModal}
      />
    );
  }

  return (
    <div className="space-y-4 w-full font-sans text-slate-900">
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
              className={`p-3.5 rounded-2xl border-2.5 cursor-pointer transition-all flex flex-col justify-between comic-card-hover ${
                isSelected
                  ? 'bg-amber-100 dark:bg-[#16233d] border-slate-900 dark:border-amber-400 dark:ring-1 dark:ring-amber-400/40 shadow-[5px_5px_0px_#0f172a] -translate-y-0.5'
                  : 'bg-white border-slate-900 shadow-comic hover:bg-slate-50'
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
                <CategoryIcon category={cat.category} className="w-4 h-4" />
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
              onClick={() => handleDrilldown(ext.extension)}
              title={`Click to view all ${ext.extension} files in Explorer`}
              className="p-2.5 rounded-xl bg-slate-50 border-1.5 border-slate-900 flex items-center justify-between text-xs hover:bg-amber-100 hover:-translate-y-0.5 hover:shadow-comic-sm transition-all cursor-pointer group active:translate-y-0"
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
