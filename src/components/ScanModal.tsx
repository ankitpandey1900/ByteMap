import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Square,
  FolderOpen,
  AlertTriangle,
  Loader2,
  HardDrive,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import { formatBytes, formatDuration, formatNumber } from '@/lib/utils';
import { ScanOptions } from '@/types';

interface ScanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScanModal: React.FC<ScanModalProps> = ({ isOpen, onClose }) => {
  const {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-popover border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-fade-in text-foreground">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">Configure Storage Scan</h3>
              <p className="text-[11px] text-muted-foreground">
                Genuine local filesystem traversal & storage analysis
              </p>
            </div>
          </div>

          {!isScanning && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Path Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">Scan Target Directory or Drive</label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={scanPath}
              onChange={(e) => setScanPath(e.target.value)}
              disabled={isScanning}
              placeholder="e.g. C:\ or D:\Projects"
              className="flex-1 px-3 py-2 bg-background border border-border/60 rounded-lg text-xs font-mono text-foreground focus:outline-none focus:border-primary disabled:opacity-50"
            />
            <button
              onClick={handleBrowse}
              disabled={isScanning}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg border border-border/60 hover:bg-accent text-xs font-medium text-foreground transition-colors disabled:opacity-50"
            >
              <FolderOpen className="w-3.5 h-3.5 text-primary" />
              <span>Browse</span>
            </button>
          </div>
        </div>

        {/* Scan Options */}
        <div className="space-y-2.5 pt-1">
          <span className="text-xs font-semibold text-foreground">Scanning Options</span>
          <div className="space-y-2 bg-secondary/30 p-3 rounded-xl border border-border/40 text-xs">
            <label className="flex items-center space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={scanOptions.exclude_hidden}
                onChange={(e) => setScanOptions({ exclude_hidden: e.target.checked })}
                disabled={isScanning}
                className="rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-foreground">Exclude hidden files & directories</span>
            </label>

            <label className="flex items-center space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={scanOptions.follow_symlinks}
                onChange={(e) => setScanOptions({ follow_symlinks: e.target.checked })}
                disabled={isScanning}
                className="rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-foreground">Follow symbolic links (Not recommended by default)</span>
            </label>
          </div>
        </div>

        {/* Live Progress Bar and Indicators if Scanning */}
        {isScanning && (
          <div className="space-y-3 p-4 bg-primary/5 rounded-xl border border-primary/20 text-xs">
            <div className="flex items-center justify-between font-mono">
              <span className="flex items-center space-x-2 text-primary font-semibold">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="capitalize">{scanProgress.status}...</span>
              </span>
              <span className="text-foreground font-bold">
                {formatBytes(scanProgress.scanned_bytes, settings.unit)}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 py-1 text-center font-mono">
              <div className="p-2 bg-background/60 rounded border border-border/40">
                <div className="text-[10px] text-muted-foreground uppercase">Files</div>
                <div className="font-bold text-foreground text-xs mt-0.5">
                  {formatNumber(scanProgress.scanned_files)}
                </div>
              </div>
              <div className="p-2 bg-background/60 rounded border border-border/40">
                <div className="text-[10px] text-muted-foreground uppercase">Folders</div>
                <div className="font-bold text-foreground text-xs mt-0.5">
                  {formatNumber(scanProgress.scanned_directories)}
                </div>
              </div>
              <div className="p-2 bg-background/60 rounded border border-border/40">
                <div className="text-[10px] text-muted-foreground uppercase">Elapsed</div>
                <div className="font-bold text-foreground text-xs mt-0.5">
                  {formatDuration(scanProgress.elapsed_ms)}
                </div>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground font-mono truncate">
              {scanProgress.current_path || 'Traversing file system...'}
            </p>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-destructive flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="truncate">{errorMessage}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          {isScanning ? (
            <button
              onClick={handleCancel}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-xs font-semibold hover:bg-destructive/90 transition-colors shadow-sm"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Cancel Scan</span>
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-border hover:bg-accent text-xs font-medium transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleStartScan}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Scan</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
