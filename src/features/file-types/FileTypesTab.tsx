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

import { CardSpotlight } from '@/components/ui';

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
        return <Film className="w-4 h-4 text-blue-400" />;
      case 'image':
        return <Image className="w-4 h-4 text-pink-400" />;
      case 'audio':
        return <Music className="w-4 h-4 text-purple-400" />;
      case 'document':
        return <File className="w-4 h-4 text-emerald-400" />;
      case 'archive':
        return <Archive className="w-4 h-4 text-amber-400" />;
      case 'app':
        return <Terminal className="w-4 h-4 text-cyan-400" />;
      case 'dev':
        return <FileCode className="w-4 h-4 text-indigo-400" />;
      case 'game':
        return <Gamepad className="w-4 h-4 text-orange-400" />;
      default:
        return <Layers className="w-4 h-4 text-slate-400" />;
    }
  };

  if (!scanSummary || categories.length === 0) {
    return (
      <div className="space-y-6 max-w-5xl">
        <div className="p-4 bg-card/60 backdrop-blur border border-border/50 rounded-xl">
          <h2 className="text-lg font-bold text-foreground">File-Type Analytics</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Breakdown of scanned data across categories and file extensions.
          </p>
        </div>

        <CardSpotlight className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center">
          <Layers className="w-12 h-12 mb-3 text-primary/40 stroke-[1.4]" />
          <p className="text-sm font-semibold text-foreground">No File Types Scanned Yet</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            Scan any drive or directory to analyze category distributions and file extension volumes.
          </p>
        </CardSpotlight>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Banner */}
      <div className="p-4 bg-card/60 backdrop-blur border border-border/50 rounded-xl">
        <h2 className="text-lg font-bold text-foreground">File-Type Analytics</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Breakdown of scanned data across categories and file extensions.
        </p>
      </div>

      {/* Categories Grid with Aceternity CardSpotlight */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const isSelected = selectedCat === cat.category;
          const catColor = getCategoryColor(cat.category);
          return (
            <CardSpotlight
              key={cat.category}
              color={`${catColor}25`}
              onClick={() => setSelectedCat(isSelected ? 'all' : cat.category)}
              className={`p-4 cursor-pointer transition-all duration-300 ${
                isSelected
                  ? 'border-primary ring-1 ring-primary/40 shadow-sm bg-primary/10'
                  : 'hover:border-border'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: catColor }}
                  />
                  <h3 className="font-semibold text-sm capitalize text-foreground">
                    {cat.category}
                  </h3>
                </div>
                {getCategoryIcon(cat.category)}
              </div>

              <div className="text-xl font-bold font-mono text-foreground mt-2">
                {formatBytes(cat.total_bytes, settings.unit)}
              </div>

              <div className="w-full bg-secondary h-1.5 rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    backgroundColor: catColor,
                    width: `${Math.min(100, cat.percentage)}%`,
                  }}
                />
              </div>

              <div className="flex justify-between items-center text-xs text-muted-foreground mt-2 mono-num">
                <span>{formatNumber(cat.file_count)} files</span>
                <span className="font-medium text-foreground">{cat.percentage.toFixed(1)}%</span>
              </div>
            </CardSpotlight>
          );
        })}
      </div>

      {/* Top Extensions Table */}
      <div className="p-4 bg-card/60 backdrop-blur border border-border/50 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-sm text-foreground">
              {selectedCat === 'all'
                ? 'Top File Extensions'
                : `Extensions for ${selectedCat.toUpperCase()}`}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ranked by total aggregated byte volume
            </p>
          </div>

          {selectedCat !== 'all' && (
            <button
              onClick={() => setSelectedCat('all')}
              className="text-xs text-primary hover:underline"
            >
              Show all categories
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredExtensions.map((ext, idx) => (
            <div
              key={ext.extension}
              className="p-3 rounded-lg bg-background/50 border border-border/40 flex items-center justify-between text-xs"
            >
              <div className="flex items-center space-x-3">
                <span className="text-muted-foreground font-mono w-4">
                  #{idx + 1}
                </span>
                <span
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: getCategoryColor(ext.category) }}
                />
                <span className="font-mono font-semibold text-foreground text-sm">
                  {ext.extension}
                </span>
                <span className="text-[11px] text-muted-foreground capitalize">
                  ({ext.category})
                </span>
              </div>

              <div className="text-right">
                <span className="font-mono font-semibold text-foreground">
                  {formatBytes(ext.total_bytes, settings.unit)}
                </span>
                <p className="text-[10px] text-muted-foreground mono-num">
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
