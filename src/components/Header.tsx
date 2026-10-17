import React from 'react';
import {
  Play,
  FolderOpen,
  Trash2,
  HardDrive,
  Sun,
  Moon,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import { formatBytes } from '@/lib/utils';
import { ShimmerButton } from '@/components/ui';

interface HeaderProps {
  onOpenScanModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenScanModal }) => {
  const {
    scanPath,
    setScanPath,
    scanProgress,
    scanSummary,
    clearScan,
    settings,
    updateSettings,
    selectedDrive,
  } = useAppStore();

  const handleSelectFolder = async () => {
    const path = await api.selectDirectory();
    if (path) {
      setScanPath(path);
      onOpenScanModal();
    }
  };

  const handleClear = async () => {
    await api.clearScanData();
    clearScan();
  };

  const isScanning = scanProgress.status === 'scanning' || scanProgress.status === 'aggregating';

  return (
    <header className="h-14 border-b border-border bg-card/40 backdrop-blur px-6 flex items-center justify-between shrink-0 select-none">
      {/* Current Target Path */}
      <div className="flex items-center space-x-3 overflow-hidden mr-4">
        <button
          onClick={handleSelectFolder}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border border-border/60 hover:bg-accent text-xs font-medium text-foreground transition-colors shrink-0"
          title="Select a different drive or directory to analyze"
        >
          <FolderOpen className="w-3.5 h-3.5 text-primary" />
          <span>Browse...</span>
        </button>

        <div className="flex items-center space-x-2 truncate text-xs text-muted-foreground font-mono">
          <HardDrive className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate max-w-sm text-foreground font-medium">
            {scanPath || selectedDrive?.mount_point || 'Select a drive or folder'}
          </span>
          {scanSummary && (
            <span className="text-muted-foreground shrink-0">
              • {formatBytes(scanSummary.total_bytes, settings.unit)}
            </span>
          )}
        </div>
      </div>

      {/* Action Controls & Status */}
      <div className="flex items-center space-x-3 shrink-0">
        {/* Status Pill */}
        {isScanning && (
          <div className="flex items-center space-x-2 px-2.5 py-1 bg-primary/10 border border-primary/20 rounded-full text-xs font-medium text-primary animate-pulse-subtle">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Scanning... ({scanProgress.scanned_files} files)</span>
          </div>
        )}

        {scanProgress.status === 'completed' && (
          <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs font-medium text-emerald-400">
            <CheckCircle2 className="w-3 h-3" />
            <span>Scan Ready</span>
          </div>
        )}

        {scanProgress.status === 'failed' && (
          <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-destructive/10 border border-destructive/20 rounded-full text-xs font-medium text-destructive">
            <AlertCircle className="w-3 h-3" />
            <span>Scan Failed</span>
          </div>
        )}

        {/* Clear Scan memory button */}
        {scanSummary && (
          <button
            onClick={handleClear}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent border border-border/50 text-xs transition-colors"
            title="Clear scan data from memory"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Primary Start Scan Action with Aceternity ShimmerButton */}
        <ShimmerButton
          onClick={onOpenScanModal}
          disabled={isScanning}
          className="shadow-primary/20 hover:shadow-primary/30"
        >
          <Play className="w-3 h-3 fill-current" />
          <span>Start Scan</span>
        </ShimmerButton>

        {/* Theme quick toggle */}
        <button
          onClick={() =>
            updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })
          }
          className="p-1.5 rounded-lg border border-border/60 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          title={`Switch to ${settings.theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {settings.theme === 'dark' ? (
            <Sun className="w-3.5 h-3.5" />
          ) : (
            <Moon className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </header>
  );
};
