import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Square,
  FolderOpen,
  AlertTriangle,
  HardDrive,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import { formatBytes, formatDuration, formatNumber, findDriveForPath } from '@/lib/utils';
import { ScanOptions } from '@/types';
import { ScoutMascot } from '@/components/ScoutMascot';
import { ComicFolderPickerModal } from '@/components/ComicFolderPickerModal';

interface ScanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScanModal: React.FC<ScanModalProps> = ({ isOpen, onClose }) => {
  const {
    drives,
    setSelectedDrive,
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
  const [isFolderPickerOpen, setIsFolderPickerOpen] = useState(false);

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

  const handleBrowse = () => {
    setIsFolderPickerOpen(true);
  };

  const handleStartScan = async () => {
    if (!scanPath.trim()) {
      setErrorMessage('Please select a folder or drive to scan.');
      return;
    }

    setErrorMessage(null);
    setIsScanning(true);

    const matched = findDriveForPath(scanPath.trim(), drives);
    if (matched) {
      setSelectedDrive(matched);
    }

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 select-none">
      {/* Modal Card with pop-in animation */}
      <div className="bg-white border-3 border-slate-900 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-[8px_8px_0px_#0f172a] space-y-4 text-slate-900 font-sans relative max-h-[92vh] overflow-y-auto animate-comic-pop">
        {/* Halftone texture on modal */}
        <div className="absolute inset-0 bg-comic-dots opacity-[0.08] pointer-events-none rounded-2xl" />

        {/* Top Header Badge */}
        <div className="relative flex items-center justify-between pb-3 border-b-2 border-slate-900">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-amber-400 border-2.5 border-slate-900 flex items-center justify-center shadow-comic-sm shrink-0 comic-hover-wiggle">
              <HardDrive className="w-6 h-6 text-slate-900" />
            </div>
            <div>
              <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-400 border border-slate-900 font-bangers text-xs uppercase tracking-wide text-slate-900 mb-0.5 shadow-comic-sm">
                Scout Mission 🗺️
              </div>
              <h3 className="font-bangers text-2xl uppercase tracking-wider text-slate-900 leading-none">
                Configure Storage Scan
              </h3>
              <p className="text-xs font-comicNeue font-bold text-slate-600 mt-1">
                Genuine local filesystem traversal & storage analysis
              </p>
            </div>
          </div>

          {!isScanning && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-rose-400 hover:text-white border-2 border-slate-900 flex items-center justify-center shadow-comic-sm transition-all hover:rotate-90 duration-200 text-slate-900"
            >
              <X className="w-4 h-4 stroke-[3]" />
            </button>
          )}
        </div>

        {/* Path Selection */}
        <div className="relative space-y-1.5">
          <label className="font-comic text-xs uppercase tracking-wide text-slate-800">
            Scan Target Directory or Drive
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={scanPath}
              onChange={(e) => setScanPath(e.target.value)}
              disabled={isScanning}
              placeholder="e.g. C:\ or D:\Projects"
              className="flex-1 px-3 py-2 bg-slate-50 border-2 border-slate-900 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:bg-amber-50 focus:border-amber-500 disabled:opacity-50 transition-colors"
            />
            <button
              onClick={handleBrowse}
              disabled={isScanning}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border-2 border-slate-900 bg-amber-300 hover:bg-amber-400 font-comic text-xs uppercase tracking-wide shadow-comic-sm transition-all disabled:opacity-50 text-slate-900 font-bold hover:-translate-y-0.5 active:translate-y-0.5"
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
                  onClick={() => {
                    setScanPath(d.mount_point);
                    setSelectedDrive(d);
                  }}
                  className={`px-2.5 py-1 rounded-lg border-2 border-slate-900 text-xs font-comic uppercase shadow-comic-sm transition-all hover:-translate-y-0.5 ${
                    scanPath === d.mount_point
                      ? 'bg-cyan-300 text-slate-900 shadow-comic'
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
        <div className="relative space-y-2">
          <span className="font-comic text-xs uppercase tracking-wide text-slate-800">
            Scanning Options
          </span>
          <div className="space-y-2.5 bg-amber-50 p-3.5 rounded-xl border-2 border-slate-900 text-xs font-fredoka font-bold shadow-comic-sm bg-comic-crosshatch">
            <label className="flex items-center space-x-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={scanOptions.exclude_hidden}
                onChange={(e) => setScanOptions({ exclude_hidden: e.target.checked })}
                disabled={isScanning}
                className="w-4 h-4 rounded border-2 border-slate-900 text-blue-600 accent-blue-600 focus:ring-0 cursor-pointer"
              />
              <span className="text-slate-800 group-hover:text-amber-900 transition-colors">Exclude hidden files & directories</span>
            </label>

            <label className="flex items-center space-x-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={scanOptions.follow_symlinks}
                onChange={(e) => setScanOptions({ follow_symlinks: e.target.checked })}
                disabled={isScanning}
                className="w-4 h-4 rounded border-2 border-slate-900 text-blue-600 accent-blue-600 focus:ring-0 cursor-pointer"
              />
              <span className="text-slate-800 group-hover:text-amber-900 transition-colors">Follow symbolic links (Not recommended by default)</span>
            </label>
          </div>
        </div>

        {/* Browser Mode Badge if previewing in web browser */}
        {!api.isNative() && !isScanning && (
          <div className="relative p-3 bg-cyan-50 border-2 border-slate-900 rounded-xl text-xs font-fredoka font-bold text-slate-800 flex items-center space-x-2.5 shadow-comic-sm bg-comic-dots">
            <div className="w-7 h-7 rounded-lg bg-cyan-300 border-2 border-slate-900 flex items-center justify-center shrink-0 text-sm shadow-comic-sm animate-comic-float">
              🧭
            </div>
            <div className="text-[11px] leading-tight">
              <span className="font-comic uppercase text-cyan-950 block text-xs">Interactive Scout Preview</span>
              Running browser test mode with live event simulation. In native desktop mode, raw multi-threaded Rust Rayon hardware traversal is executed.
            </div>
          </div>
        )}

        {/* Live Progress Bar and Indicators if Scanning */}
        {isScanning && (
          <div className="relative space-y-3 p-3.5 bg-sky-50 rounded-xl border-2 border-slate-900 text-xs bg-comic-dots">
            <div className="flex items-center justify-between font-comic">
              <span className="flex items-center space-x-2 text-blue-900 text-sm uppercase">
                <span className="animate-comic-spin-wobble text-base">🧭</span>
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

            {/* Solid Cartoon Progress Bar with candy stripe */}
            <div className="w-full h-5 rounded-full bg-slate-200 border-2 border-slate-900 overflow-hidden relative">
              <div className="h-full bg-emerald-400 w-full comic-progress-stripe" />
            </div>

            <div className="grid grid-cols-3 gap-2 py-1 text-center">
              <div className="p-2 bg-white rounded-lg border-2 border-slate-900 shadow-comic-sm comic-card-hover">
                <div className="text-xs text-slate-500 uppercase font-bangers tracking-wider">Files</div>
                <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                  {formatNumber(scanProgress.scanned_files)}
                </div>
              </div>
              <div className="p-2 bg-white rounded-lg border-2 border-slate-900 shadow-comic-sm comic-card-hover">
                <div className="text-xs text-slate-500 uppercase font-bangers tracking-wider">Folders</div>
                <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                  {formatNumber(scanProgress.scanned_directories)}
                </div>
              </div>
              <div className="p-2 bg-white rounded-lg border-2 border-slate-900 shadow-comic-sm comic-card-hover">
                <div className="text-xs text-slate-500 uppercase font-bangers tracking-wider">Time</div>
                <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">
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
          <div className="relative p-3 bg-red-100 border-2 border-slate-900 rounded-xl text-xs font-fredoka font-bold text-red-900 flex items-center space-x-2 shadow-comic-sm animate-comic-wiggle">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-700" />
            <span className="truncate">{errorMessage}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="relative flex items-center justify-end space-x-3 pt-2 border-t-2 border-slate-900">
          {isScanning ? (
            <button
              onClick={handleCancel}
              className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-comic text-xs uppercase tracking-wide border-2 border-slate-900 shadow-comic transition-all hover:-translate-y-0.5 active:translate-y-0.5"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Cancel Scan</span>
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border-2 border-slate-900 bg-slate-100 hover:bg-slate-200 font-bangers text-sm uppercase tracking-wider shadow-comic-sm transition-all text-slate-800 hover:-translate-y-0.5 active:translate-y-0.5"
              >
                Close
              </button>
              <button
                onClick={handleStartScan}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-xl border-2.5 border-slate-900 bg-amber-400 hover:bg-amber-300 font-bangers text-sm uppercase tracking-wider text-slate-900 shadow-comic transition-all hover:-translate-y-0.5 hover:shadow-comic-lg active:translate-x-0.5 active:translate-y-0.5 active:shadow-none relative overflow-hidden"
              >
                <Play className="w-3.5 h-3.5 fill-current relative" />
                <span className="relative">Start Scan</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Target Directory Picker Modal */}
      <ComicFolderPickerModal
        isOpen={isFolderPickerOpen}
        initialPath={scanPath}
        onClose={() => setIsFolderPickerOpen(false)}
        onSelect={(newPath) => setScanPath(newPath)}
      />
    </div>
  );
};
