import React, { useState } from 'react';
import {
  HardDrive,
  Play,
  Lock,
  RefreshCw,
  FolderPlus,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatBytes } from '@/lib/utils';
import { ComicStorageBar } from '@/components/ComicStorageBar';
import { ComicFolderPickerModal } from '@/components/ComicFolderPickerModal';
import { api } from '@/lib/api';
import { DriveInfo } from '@/types';

interface DrivesTabProps {
  onStartScan: (targetPath: string) => void;
}

export const DrivesTab: React.FC<DrivesTabProps> = ({ onStartScan }) => {
  const { drives, setDrives, selectedDrive, setSelectedDrive, settings, setScanPath } =
    useAppStore();
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const handleRefresh = async () => {
    const list = await api.getDrives();
    setDrives(list);
  };

  const handleSelectFolder = () => {
    setIsPickerOpen(true);
  };

  const handleFolderSelected = (path: string) => {
    setScanPath(path);
    onStartScan(path);
  };

  return (
    <div className="space-y-4 w-full select-none font-sans text-slate-900">
      {/* Header bar card */}
      <div className="p-4 bg-white border-2.5 border-slate-900 rounded-2xl shadow-comic flex items-center justify-between flex-wrap gap-3 relative overflow-hidden">
        {/* Crosshatch texture */}
        <div className="absolute inset-0 bg-comic-crosshatch pointer-events-none rounded-2xl" />

        <div className="relative">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-amber-400 border-2 border-slate-900 shadow-comic-sm font-comic text-xs uppercase tracking-wide text-slate-900 mb-1">
            <HardDrive className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Hardware Drives</span>
          </div>
          <h2 className="font-comic text-xl text-slate-900 uppercase tracking-wider mt-1">
            Storage Drives & Volumes
          </h2>
          <p className="text-xs font-fredoka font-semibold text-slate-600">
            Real physical volumes detected by the native OS kernel. Select any drive or custom folder to scout.
          </p>
        </div>
        <div className="relative flex items-center space-x-2.5">
          <button
            onClick={handleRefresh}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border-2 border-slate-900 bg-white hover:bg-slate-100 font-comic text-xs uppercase text-slate-900 shadow-comic-sm transition-all hover:-translate-y-0.5 hover:shadow-comic comic-hover-wiggle"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleSelectFolder}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl border-2.5 border-slate-900 bg-amber-400 hover:bg-amber-300 font-bangers text-sm uppercase tracking-wider text-slate-900 shadow-comic hover:-translate-y-0.5 hover:shadow-comic-lg active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all relative overflow-hidden"
          >
            <FolderPlus className="w-4 h-4 text-slate-900 relative" />
            <span className="relative">Select Folder...</span>
          </button>
        </div>
      </div>

      {/* Drives Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {drives.map((drive: DriveInfo) => {
          const isSelected = selectedDrive?.id === drive.id;
          const usedPercent =
            drive.total_bytes > 0
              ? Math.round((drive.used_bytes / drive.total_bytes) * 100)
              : 0;

          return (
            <div
              key={drive.id}
              onClick={() => setSelectedDrive(drive)}
              className={`p-4 rounded-2xl border-2.5 border-slate-900 cursor-pointer transition-all flex flex-col justify-between relative overflow-hidden comic-card-hover ${
                isSelected
                  ? 'bg-amber-100/70 shadow-[5px_5px_0px_#0f172a] -translate-y-0.5'
                  : 'bg-white shadow-comic hover:bg-slate-50'
              }`}
            >
              {/* Card texture */}
              <div className="absolute inset-0 bg-comic-dots opacity-[0.05] pointer-events-none rounded-2xl" />

              {/* Drive Top Details */}
              <div className="relative flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-300 border-2 border-slate-900 flex items-center justify-center shadow-comic-sm shrink-0 comic-hover-wiggle">
                    <HardDrive className="w-6 h-6 text-slate-900 stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="font-bangers text-xl uppercase tracking-wide text-slate-900 flex items-center space-x-2">
                      <span>{drive.name}</span>
                      {drive.is_read_only && (
                        <span title="Read-only volume">
                          <Lock className="w-3.5 h-3.5 text-amber-500" />
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center space-x-2 text-xs font-mono text-slate-600 mt-0.5">
                      <span className="font-bold">{drive.mount_point}</span>
                      <span>•</span>
                      <span>{drive.filesystem || 'NTFS'}</span>
                      {drive.is_removable && (
                        <>
                          <span>•</span>
                          <span className="text-blue-600 font-comic uppercase text-[10px] px-1.5 py-0.5 bg-blue-100 rounded border border-blue-300">Removable</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-emerald-400 border-2 border-slate-900 text-slate-900 font-bangers text-xs uppercase tracking-wider shadow-comic-sm animate-comic-pop">
                    ✓ Active Drive
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              <div className="relative mt-4 space-y-1.5">
                <ComicStorageBar
                  percent={usedPercent}
                  heightClass="h-4"
                  showLabel={true}
                  showStatusBadge={true}
                />
                <div className="flex justify-between text-xs font-comicNeue font-bold text-slate-700">
                  <span>Used: <span className="font-mono">{formatBytes(drive.used_bytes, settings.unit)}</span> ({usedPercent}%)</span>
                  <span>Free: <span className="font-mono">{formatBytes(drive.available_bytes, settings.unit)}</span></span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="relative mt-4 pt-3 border-t-2 border-slate-900 flex items-center justify-between">
                <span className="text-xs font-comicNeue font-bold text-slate-600 uppercase">
                  Total: <span className="font-mono">{formatBytes(drive.total_bytes, settings.unit)}</span>
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDrive(drive);
                    onStartScan(drive.mount_point);
                  }}
                  className="flex items-center space-x-1.5 px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bangers text-xs uppercase tracking-wider rounded-xl border-2 border-slate-900 shadow-comic-sm hover:-translate-y-0.5 hover:shadow-comic active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all relative overflow-hidden"
                >
                  <Play className="w-3 h-3 fill-current relative" />
                  <span className="relative">Scout Drive</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {drives.length === 0 && (
        <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border-2.5 border-slate-900 shadow-comic flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-comic-dots pointer-events-none rounded-2xl" />
          <div className="relative">
            <HardDrive className="w-14 h-14 mb-3 text-slate-400 stroke-[1.8] mx-auto animate-comic-float" />
            <p className="font-comic text-base text-slate-900 uppercase">No Local Drives Detected</p>
            <p className="text-xs font-fredoka font-semibold text-slate-600 mt-1 max-w-sm mx-auto">
              Refresh attached drives or use the folder picker to inspect any directory.
            </p>
            <button
              onClick={handleRefresh}
              className="mt-4 px-4 py-2 rounded-xl border-2 border-slate-900 bg-amber-400 hover:bg-amber-300 font-comic text-xs uppercase text-slate-900 shadow-comic transition-all flex items-center space-x-1.5 mx-auto hover:-translate-y-0.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Detection</span>
            </button>
          </div>
        </div>
      )}

      {/* Custom Comic Folder Picker Modal */}
      <ComicFolderPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={handleFolderSelected}
      />
    </div>
  );
};
