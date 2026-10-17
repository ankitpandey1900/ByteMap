import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Square,
  FolderOpen,
  AlertTriangle,
  HardDrive,
  Compass,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import { formatBytes, formatDuration, formatNumber } from '@/lib/utils';
import { ScanOptions } from '@/types';
import { ScoutMascot } from '@/components/ScoutMascot';

interface ScanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScanModal: React.FC<ScanModalProps> = ({ isOpen, onClose }) => {
  const {
    drives,
    scanPath,
    setScanPath,
    scanOptions,
    setScanOptions,
    scanProgress,
    setScanProgress,
    setScanSummary,
    settings,
  } = useAppStore();

  const [isScanning, setIsScanning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let unlisten: (() => void) | null = null;

    api.onScanProgress((prog) => {
      setScanProgress(prog);
      if (prog.status === 'completed' || prog.status === 'cancelled' || prog.status === 'failed') {
        setIsScanning(false);
      }
    }).then((fn) => {
      unlisten = fn;
    });

    return () => {
      if (unlisten) unlisten();
    };
  }, [setScanProgress]);

  if (!isOpen) return null;

  const handleBrowse = async () => {
    const selected = await api.selectDirectory();
    if (selected) {
      setScanPath(selected);
    }
  };

  const handleStartScan = async () => {
    if (!scanPath.trim()) {
      setErrorMessage('Please select a folder or drive to scan.');
      return;
    }

    setErrorMessage(null);
    setIsScanning(true);

    const opts: ScanOptions = {
      root_path: scanPath.trim(),
      exclude_hidden: scanOptions.exclude_hidden,
      exclude_patterns: scanOptions.exclude_patterns.length > 0
        ? scanOptions.exclude_patterns
        : settings.default_excludes,
      follow_symlinks: scanOptions.follow_symlinks,
      deep_duplicate_scan: scanOptions.deep_duplicate_scan,
    };

    try {
      const summary = await api.startScan(opts);
      setScanSummary(summary);
      onClose();
    } catch (err: any) {
      console.error('Scan error:', err);
      setErrorMessage(typeof err === 'string' ? err : err.message || 'Scan failed');
    } finally {
      setIsScanning(false);
    }
  };

  const handleCancel = async () => {
    await api.cancelScan();
    setIsScanning(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 select-none">
      <div className="bg-white border-2.5 border-slate-900 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-comic-xl space-y-4 text-slate-900 font-sans relative max-h-[92vh] overflow-y-auto">
        {/* Top Header Badge */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 border-2 border-slate-900 flex items-center justify-center shadow-comic-sm">
              <Compass className="w-6 h-6 text-slate-900" />
            </div>
            <div>
              <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-400 border border-slate-900 font-comic text-[10px] uppercase text-slate-900 mb-0.5 shadow-comic-sm">
                Scout Mission
              </div>
              <h3 className="font-comic text-lg uppercase tracking-wide text-slate-900">
                Analyze Storage
              </h3>
            </div>
          </div>

          {!isScanning && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-rose-400 border-2 border-slate-900 flex items-center justify-center shadow-comic-sm transition-colors text-slate-900"
            >
              <X className="w-4 h-4 stroke-[3]" />
            </button>
          )}
        </div>

        {/* Path Selection */}
        <div className="space-y-1.5">
          <label className="font-comic text-xs uppercase tracking-wide text-slate-800">
            Target Drive or Directory:
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={scanPath}
              onChange={(e) => setScanPath(e.target.value)}
              disabled={isScanning}
              placeholder="e.g. C:\ or D:\Projects"
              className="flex-1 px-3 py-2 bg-slate-50 border-2 border-slate-900 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:bg-amber-50 disabled:opacity-50"
            />
            <button
              onClick={handleBrowse}
              disabled={isScanning}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border-2 border-slate-900 bg-amber-300 hover:bg-amber-400 font-comic text-xs uppercase tracking-wide shadow-comic-sm transition-all disabled:opacity-50"
            >
              <FolderOpen className="w-4 h-4 text-slate-900" />
              <span>Browse</span>
            </button>
          </div>

          {/* Quick Drive Pills */}
          {drives.length > 0 && !isScanning && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {drives.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setScanPath(d.mount_point)}
                  className={`px-2.5 py-1 rounded-lg border-2 border-slate-900 text-xs font-comic uppercase shadow-comic-sm transition-all ${
                    scanPath === d.mount_point
                      ? 'bg-cyan-300 text-slate-900'
                      : 'bg-white hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <HardDrive className="w-3 h-3 inline mr-1" />
                  {d.name || d.mount_point}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Scan Options */}
        <div className="space-y-2">
          <span className="font-comic text-xs uppercase tracking-wide text-slate-800">
            Explorer Settings:
          </span>
          <div className="space-y-2 bg-amber-50 p-3 rounded-xl border-2 border-slate-900 text-xs font-fredoka font-bold">
            <label className="flex items-center space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={scanOptions.exclude_hidden}
                onChange={(e) => setScanOptions({ exclude_hidden: e.target.checked })}
                disabled={isScanning}
                className="w-4 h-4 rounded border-2 border-slate-900 text-blue-600 accent-blue-600 focus:ring-0 cursor-pointer"
              />
              <span className="text-slate-800">Exclude hidden system folders & files</span>
            </label>

            <label className="flex items-center space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={scanOptions.follow_symlinks}
                onChange={(e) => setScanOptions({ follow_symlinks: e.target.checked })}
                disabled={isScanning}
                className="w-4 h-4 rounded border-2 border-slate-900 text-blue-600 accent-blue-600 focus:ring-0 cursor-pointer"
              />
              <span className="text-slate-800">Follow symbolic links</span>
            </label>
          </div>
        </div>

        {/* Live Progress Bar and Indicators if Scanning */}
        {isScanning && (
          <div className="space-y-3 p-3.5 bg-sky-50 rounded-xl border-2 border-slate-900 text-xs">
            <div className="flex items-center justify-between font-comic">
              <span className="flex items-center space-x-2 text-blue-900 text-sm uppercase">
                <span className="animate-spin text-base">🧭</span>
                <span>Scouting Active...</span>
              </span>
              <span className="text-slate-900 font-bold font-mono">
                {formatBytes(scanProgress.scanned_bytes, settings.unit)}
              </span>
            </div>

            {/* Scout Mascot with speech pill */}
            <ScoutMascot
              isScanning={true}
              statusText={`Scouting: ${formatNumber(scanProgress.scanned_files)} files processed`}
            />

            {/* Solid Cartoon Progress Bar with pulse */}
            <div className="w-full h-4 rounded-full bg-slate-200 border-2 border-slate-900 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 animate-pulse w-full" />
            </div>

            <div className="grid grid-cols-3 gap-2 py-1 text-center font-fredoka">
              <div className="p-2 bg-white rounded-lg border-2 border-slate-900 shadow-comic-sm">
                <div className="text-[10px] text-slate-500 uppercase font-comic">Files</div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">
                  {formatNumber(scanProgress.scanned_files)}
                </div>
              </div>
              <div className="p-2 bg-white rounded-lg border-2 border-slate-900 shadow-comic-sm">
                <div className="text-[10px] text-slate-500 uppercase font-comic">Folders</div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">
                  {formatNumber(scanProgress.scanned_directories)}
                </div>
              </div>
              <div className="p-2 bg-white rounded-lg border-2 border-slate-900 shadow-comic-sm">
                <div className="text-[10px] text-slate-500 uppercase font-comic">Time</div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">
                  {formatDuration(scanProgress.elapsed_ms)}
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-700 font-mono truncate bg-white px-2 py-1 rounded-md border border-slate-900">
              {scanProgress.current_path || 'Traversing file system...'}
            </p>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 bg-red-100 border-2 border-slate-900 rounded-xl text-xs font-fredoka font-bold text-red-900 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-700" />
            <span className="truncate">{errorMessage}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end space-x-3 pt-2 border-t-2 border-slate-900">
          {isScanning ? (
            <button
              onClick={handleCancel}
              className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-comic text-xs uppercase tracking-wide border-2 border-slate-900 shadow-comic transition-all"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Cancel Scan</span>
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl border-2 border-slate-900 bg-slate-100 hover:bg-slate-200 font-comic text-xs uppercase tracking-wide shadow-comic-sm transition-all"
              >
                Close
              </button>
              <button
                onClick={handleStartScan}
                className="flex items-center space-x-2 px-5 py-2 rounded-xl border-2.5 border-slate-900 bg-amber-400 hover:bg-amber-300 font-comic text-xs uppercase tracking-wide text-slate-900 shadow-comic transition-all hover:-translate-y-0.5 active:translate-y-0.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Scouting</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
