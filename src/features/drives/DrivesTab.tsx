import React from 'react';
import {
  HardDrive,
  Play,
  Lock,
  RefreshCw,
  FolderPlus,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatBytes } from '@/lib/utils';
import { api } from '@/lib/api';
import { DriveInfo } from '@/types';

interface DrivesTabProps {
  onStartScan: (targetPath: string) => void;
}

export const DrivesTab: React.FC<DrivesTabProps> = ({ onStartScan }) => {
  const { drives, setDrives, selectedDrive, setSelectedDrive, settings, setScanPath } =
    useAppStore();

  const handleRefresh = async () => {
    const list = await api.getDrives();
    setDrives(list);
  };

  const handleSelectFolder = async () => {
    const path = await api.selectDirectory();
    if (path) {
      setScanPath(path);
      onStartScan(path);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl select-none font-sans text-slate-900">
      {/* Header bar card */}
      <div className="p-4 bg-white border-2.5 border-slate-900 rounded-2xl shadow-comic flex items-center justify-between flex-wrap gap-3">
        <div>
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
        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleRefresh}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border-2 border-slate-900 bg-white hover:bg-slate-100 font-comic text-xs uppercase text-slate-900 shadow-comic-sm transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleSelectFolder}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl border-2.5 border-slate-900 bg-amber-400 hover:bg-amber-300 font-comic text-xs uppercase tracking-wide text-slate-900 shadow-comic hover:-translate-y-0.5 active:translate-y-0.5 transition-all"
          >
            <FolderPlus className="w-4 h-4 text-slate-900" />
            <span>Select Folder...</span>
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
              className={`p-4 rounded-2xl border-2.5 border-slate-900 cursor-pointer transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-amber-50 shadow-comic ring-2 ring-amber-400'
                  : 'bg-white shadow-comic hover:bg-slate-50'
              }`}
            >
              {/* Drive Top Details */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-300 border-2 border-slate-900 flex items-center justify-center shadow-comic-sm shrink-0">
                    <HardDrive className="w-6 h-6 text-slate-900 stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="font-comic text-base uppercase text-slate-900 flex items-center space-x-2">
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
                          <span className="text-blue-600 font-comic uppercase text-[10px]">Removable</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-400 border border-slate-900 text-slate-900 font-comic text-[10px] uppercase shadow-comic-sm">
                    Selected
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              <div className="mt-4 space-y-1.5">
                <div className="w-full bg-slate-200 h-3 rounded-full border-2 border-slate-900 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      usedPercent > 90
                        ? 'bg-rose-500'
                        : usedPercent > 75
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    }`}
                    style={{ width: `${usedPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs font-fredoka font-bold text-slate-700">
                  <span>Used: {formatBytes(drive.used_bytes, settings.unit)} ({usedPercent}%)</span>
                  <span>Free: {formatBytes(drive.available_bytes, settings.unit)}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-4 pt-3 border-t-2 border-slate-900 flex items-center justify-between">
                <span className="text-xs font-comic text-slate-600 uppercase">
                  Total: {formatBytes(drive.total_bytes, settings.unit)}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDrive(drive);
                    onStartScan(drive.mount_point);
                  }}
                  className="flex items-center space-x-1.5 px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-comic text-xs uppercase rounded-xl border-2 border-slate-900 shadow-comic-sm hover:-translate-y-0.5 transition-all"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Scout Drive</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {drives.length === 0 && (
        <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border-2.5 border-slate-900 shadow-comic flex flex-col items-center justify-center">
          <HardDrive className="w-12 h-12 mb-3 text-slate-400 stroke-[1.8]" />
          <p className="font-comic text-base text-slate-900 uppercase">No Local Drives Detected</p>
          <p className="text-xs font-fredoka font-semibold text-slate-600 mt-1 max-w-sm">
            Refresh attached drives or use the folder picker to inspect any directory.
          </p>
          <button
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 rounded-xl border-2 border-slate-900 bg-amber-400 hover:bg-amber-300 font-comic text-xs uppercase text-slate-900 shadow-comic transition-all flex items-center space-x-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Detection</span>
          </button>
        </div>
      )}
    </div>
  );
};
