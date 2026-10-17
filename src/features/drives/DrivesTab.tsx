import React from 'react';
import {
  HardDrive,
  Play,
  CheckCircle2,
  Lock,
  RefreshCw,
  FolderPlus,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatBytes } from '@/lib/utils';
import { api } from '@/lib/api';
import { DriveInfo } from '@/types';

import { CardSpotlight, ShimmerButton } from '@/components/ui';

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
    <div className="space-y-6 max-w-5xl">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-4 border-b border-border/50">
        <div>
          <h2 className="text-xl font-bold text-foreground">Storage Drives & Volumes</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Analyze physical storage drives or select custom directories with the native picker.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-border/60 hover:bg-accent text-xs font-medium text-foreground transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <ShimmerButton
            onClick={handleSelectFolder}
            className="shadow-primary/20"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>Select Folder...</span>
          </ShimmerButton>
        </div>
      </div>

      {/* Drives Grid with Aceternity CardSpotlight */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {drives.map((drive: DriveInfo) => {
          const isSelected = selectedDrive?.id === drive.id;
          const usedPercent =
            drive.total_bytes > 0
              ? Math.round((drive.used_bytes / drive.total_bytes) * 100)
              : 0;

          return (
            <CardSpotlight
              key={drive.id}
              color={isSelected ? "rgba(59, 130, 246, 0.25)" : "rgba(59, 130, 246, 0.12)"}
              onClick={() => setSelectedDrive(drive)}
              className={`p-5 cursor-pointer relative overflow-hidden transition-all duration-300 ${
                isSelected
                  ? 'border-primary ring-1 ring-primary/40 shadow-md bg-primary/5'
                  : 'hover:border-primary/40'
              }`}
            >
              {/* Drive Top Details */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                    <HardDrive className="w-6 h-6 stroke-[1.8]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-foreground flex items-center space-x-2">
                      <span>{drive.name}</span>
                      {drive.is_read_only && (
                        <span title="Read-only volume">
                          <Lock className="w-3.5 h-3.5 text-amber-400" />
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-0.5 font-mono">
                      <span>{drive.mount_point}</span>
                      <span>•</span>
                      <span>{drive.filesystem || 'NTFS'}</span>
                      {drive.is_removable && (
                        <>
                          <span>•</span>
                          <span className="text-cyan-400">Removable</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                )}
              </div>

              {/* Progress Bar */}
              <div className="mt-5 space-y-1.5">
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      usedPercent > 90
                        ? 'bg-red-500'
                        : usedPercent > 75
                        ? 'bg-amber-500'
                        : 'bg-primary'
                    }`}
                    style={{ width: `${usedPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground font-mono">
                  <span>Used: {formatBytes(drive.used_bytes, settings.unit)} ({usedPercent}%)</span>
                  <span>Free: {formatBytes(drive.available_bytes, settings.unit)}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-mono">
                  Total: {formatBytes(drive.total_bytes, settings.unit)}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDrive(drive);
                    onStartScan(drive.mount_point);
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary font-medium text-xs rounded-lg transition-colors"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Scan Drive</span>
                </button>
              </div>
            </CardSpotlight>
          );
        })}
      </div>

      {drives.length === 0 && (
        <CardSpotlight className="p-10 text-center text-muted-foreground flex flex-col items-center justify-center">
          <HardDrive className="w-12 h-12 mb-3 text-primary/40 stroke-[1.4]" />
          <p className="text-sm font-semibold text-foreground">No Local Drives Detected Yet</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            Refresh attached drives or use the folder picker to inspect any directory.
          </p>
          <button
            onClick={handleRefresh}
            className="mt-4 px-3.5 py-1.5 rounded-lg border border-border/60 hover:bg-accent text-xs font-medium text-foreground transition-colors flex items-center space-x-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Drive Detection</span>
          </button>
        </CardSpotlight>
      )}
    </div>
  );
};
