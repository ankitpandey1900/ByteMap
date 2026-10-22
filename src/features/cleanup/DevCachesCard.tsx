import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Trash2,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Loader2,
  CheckSquare,
  Square,
  RefreshCw,
  FolderOpen,
  Info,
  Terminal,
  Layers,
  Cpu,
  Package,
  Boxes,
  Zap,
} from 'lucide-react';
import { DevCacheItem, DevCacheCleanSummary } from '@/types';
import { formatBytes, cleanDisplayPath } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAppStore } from '@/lib/store';

interface DevCachesCardProps {
  preferTrash: boolean;
  unit: 'binary' | 'decimal';
  onCleanupComplete?: (summary: DevCacheCleanSummary) => void;
}

export const DevCachesCard: React.FC<DevCachesCardProps> = ({
  preferTrash,
  unit,
  onCleanupComplete,
}) => {
  const { applyCleanupResult } = useAppStore();
  const [caches, setCaches] = useState<DevCacheItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isCleaning, setIsCleaning] = useState<boolean>(false);
  const [showConfirm, setShowConfirm] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<'all' | 'ai_ide' | 'packages' | 'build'>('all');
  const [lastPurged, setLastPurged] = useState<DevCacheCleanSummary | null>(null);

  // Scan developer caches
  const loadDevCaches = async () => {
    setIsLoading(true);
    try {
      const items = await api.scanDevCaches();
      setCaches(items);
      // Pre-select safe caches by default for immediate developer convenience
      const safeIds = new Set(
        items.filter((c) => c.safety_level === 'safe').map((c) => c.id)
      );
      setSelectedIds(safeIds);
    } catch (err) {
      console.error('Failed to scan developer caches:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDevCaches();
  }, []);

  const filteredCaches = useMemo(() => {
    return caches.filter((item) => {
      if (activeCategory === 'all') return true;
      if (activeCategory === 'ai_ide') {
        return (
          item.tool.toLowerCase().includes('antigravity') ||
          item.tool.toLowerCase().includes('cursor') ||
          item.tool.toLowerCase().includes('code')
        );
      }
      if (activeCategory === 'packages') {
        return (
          item.tool.toLowerCase().includes('npm') ||
          item.tool.toLowerCase().includes('pnpm') ||
          item.tool.toLowerCase().includes('cargo') ||
          item.tool.toLowerCase().includes('pip')
        );
      }
      if (activeCategory === 'build') {
        return (
          item.tool.toLowerCase().includes('gradle') ||
          item.tool.toLowerCase().includes('go')
        );
      }
      return true;
    });
  }, [caches, activeCategory]);

  const totalDiscoveredBytes = useMemo(() => {
    return caches.reduce((acc, c) => acc + c.size_bytes, 0);
  }, [caches]);

  const selectedCaches = useMemo(() => {
    return caches.filter((c) => selectedIds.has(c.id));
  }, [caches, selectedIds]);

  const totalSelectedBytes = useMemo(() => {
    return selectedCaches.reduce((acc, c) => acc + c.size_bytes, 0);
  }, [selectedCaches]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(caches.map((c) => c.id)));
  };

  const selectSafeOnly = () => {
    setSelectedIds(
      new Set(caches.filter((c) => c.safety_level === 'safe').map((c) => c.id))
    );
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleReveal = async (path: string) => {
    try {
      await api.revealInFolder(path);
    } catch (err) {
      console.error('Failed to open directory:', err);
    }
  };

  const handlePurge = async () => {
    if (selectedCaches.length === 0) return;
    setIsCleaning(true);
    setShowConfirm(false);

    try {
      const targetIds = Array.from(selectedIds);
      const summary = await api.cleanDevCaches(targetIds, preferTrash);
      setLastPurged(summary);

      // Extract successful paths
      const successfulPaths = summary.results
        .filter((r) => r.success)
        .map((r) => r.path);

      // LIVE STORAGE SYNCHRONIZER: Instantly update store drives and scan metrics!
      applyCleanupResult(summary.total_freed_bytes, successfulPaths);

      if (onCleanupComplete) {
        onCleanupComplete(summary);
      }

      // Re-scan caches to refresh UI table
      await loadDevCaches();
    } catch (err) {
      console.error('Developer cache purge failed:', err);
    } finally {
      setIsCleaning(false);
    }
  };

  const getToolIcon = (tool: string, _iconKey: string) => {
    const t = tool.toLowerCase();
    if (t.includes('antigravity')) {
      return (
        <div className="w-8 h-8 rounded-lg bg-sky-100 border border-slate-900 flex items-center justify-center text-sky-700 shadow-comic-sm shrink-0">
          <Sparkles className="w-4 h-4 fill-sky-300" />
        </div>
      );
    }
    if (t.includes('cursor')) {
      return (
        <div className="w-8 h-8 rounded-lg bg-indigo-100 border border-slate-900 flex items-center justify-center text-indigo-700 shadow-comic-sm shrink-0">
          <Cpu className="w-4 h-4" />
        </div>
      );
    }
    if (t.includes('code')) {
      return (
        <div className="w-8 h-8 rounded-lg bg-blue-100 border border-slate-900 flex items-center justify-center text-blue-700 shadow-comic-sm shrink-0">
          <Terminal className="w-4 h-4" />
        </div>
      );
    }
    if (t.includes('npm')) {
      return (
        <div className="w-8 h-8 rounded-lg bg-red-100 border border-slate-900 flex items-center justify-center text-red-600 shadow-comic-sm shrink-0">
          <Package className="w-4 h-4" />
        </div>
      );
    }
    if (t.includes('pnpm')) {
      return (
        <div className="w-8 h-8 rounded-lg bg-amber-100 border border-slate-900 flex items-center justify-center text-amber-700 shadow-comic-sm shrink-0">
          <Boxes className="w-4 h-4" />
        </div>
      );
    }
    if (t.includes('cargo') || t.includes('rust')) {
      return (
        <div className="w-8 h-8 rounded-lg bg-orange-100 border border-slate-900 flex items-center justify-center text-orange-700 shadow-comic-sm shrink-0">
          <Zap className="w-4 h-4" />
        </div>
      );
    }
    if (t.includes('gradle')) {
      return (
        <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-slate-900 flex items-center justify-center text-emerald-700 shadow-comic-sm shrink-0">
          <Layers className="w-4 h-4" />
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-900 flex items-center justify-center text-slate-700 shadow-comic-sm shrink-0">
        <FolderOpen className="w-4 h-4" />
      </div>
    );
  };

  const getSafetyBadge = (level: string) => {
    switch (level) {
      case 'safe':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-comic uppercase bg-emerald-400 text-slate-900 border border-slate-900 shadow-comic-sm">
            <ShieldCheck className="w-3 h-3" />
            <span>100% Safe</span>
          </span>
        );
      case 'low':
      case 'low_risk':
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-comic uppercase bg-amber-300 text-slate-900 border border-slate-900 shadow-comic-sm">
            <Info className="w-3 h-3" />
            <span>Re-downloads</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner Card */}
      <div className="p-4 bg-gradient-to-r from-sky-50 via-indigo-50 to-amber-50 border-2.5 border-slate-900 rounded-2xl shadow-comic flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-sky-400 border-2.5 border-slate-900 flex items-center justify-center shadow-comic-sm shrink-0">
            <Sparkles className="w-6 h-6 text-slate-900" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bangers text-xl uppercase tracking-wider text-slate-900">
                Coding & IDE Cache Purger
              </h3>
              <span className="font-mono font-bold text-xs bg-amber-300 px-2 py-0.5 rounded-md border border-slate-900 shadow-comic-sm">
                {caches.length} Caches • {formatBytes(totalDiscoveredBytes, unit)}
              </span>
            </div>
            <p className="text-xs font-fredoka font-semibold text-slate-600">
              Reclaim gigabytes from hidden AI models, IDE session artifacts (Google Antigravity, Cursor, VS Code), and package caches (npm, pnpm, Cargo, pip).
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={loadDevCaches}
            disabled={isLoading || isCleaning}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-100 font-comic text-xs uppercase tracking-wider text-slate-900 border-2 border-slate-900 rounded-xl shadow-comic-sm transition-all cursor-pointer disabled:opacity-50"
            title="Scan for new cache files"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Re-Scan</span>
          </button>

          {selectedIds.size > 0 ? (
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              disabled={isCleaning}
              className="flex items-center space-x-1.5 px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white font-bangers text-sm uppercase tracking-wider border-2 border-slate-900 rounded-xl shadow-comic transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>
                Purge Selected ({selectedIds.size} • {formatBytes(totalSelectedBytes, unit)})
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={selectSafeOnly}
              className="px-3.5 py-2 bg-amber-300 hover:bg-amber-400 font-bangers text-xs uppercase tracking-wider text-slate-900 border-2 border-slate-900 rounded-xl shadow-comic-sm transition-all cursor-pointer"
            >
              Select Safe Caches
            </button>
          )}
        </div>
      </div>

      {/* Celebration Notification when purged */}
      {lastPurged && (
        <div className="p-3.5 bg-emerald-100 border-2 border-slate-900 rounded-xl shadow-comic flex items-center justify-between text-xs font-fredoka font-bold text-slate-900 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center space-x-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
            <div>
              <span>
                🎉 Reclaimed {formatBytes(lastPurged.total_freed_bytes, unit)} across{' '}
                {lastPurged.successful_count} developer caches!
              </span>
              <span className="text-slate-600 ml-1 font-medium">
                Drive gauges and file breakdowns updated instantly.
              </span>
            </div>
          </div>
          <button
            onClick={() => setLastPurged(null)}
            className="text-xs font-comic uppercase text-slate-600 hover:text-slate-900 ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Selection Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center space-x-1.5 overflow-x-auto text-xs pb-0.5">
          {[
            { id: 'all', label: 'All Caches' },
            { id: 'ai_ide', label: 'AI & IDEs (Antigravity/Cursor/VSCode)' },
            { id: 'packages', label: 'Package Managers (npm/pnpm/Cargo/pip)' },
            { id: 'build', label: 'Build Systems (Gradle/Go)' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-3 py-1.5 rounded-xl border-2 border-slate-900 font-comic text-xs uppercase tracking-wide transition-all ${
                activeCategory === cat.id
                  ? 'bg-amber-400 text-slate-900 shadow-comic -translate-y-0.5'
                  : 'bg-white hover:bg-amber-100 text-slate-700 shadow-comic-sm'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-3 text-xs font-comic uppercase text-slate-600">
          <button
            onClick={selectAll}
            className="hover:text-slate-900 underline cursor-pointer"
          >
            Select All
          </button>
          <span>•</span>
          <button
            onClick={selectSafeOnly}
            className="hover:text-slate-900 underline cursor-pointer"
          >
            Safe Only
          </button>
          <span>•</span>
          <button
            onClick={deselectAll}
            className="hover:text-rose-600 underline cursor-pointer"
          >
            Clear ({selectedIds.size})
          </button>
        </div>
      </div>

      {/* Caches List */}
      {isLoading ? (
        <div className="p-8 bg-white border-2.5 border-slate-900 rounded-2xl shadow-comic flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
          <p className="font-comic text-sm uppercase text-slate-800">
            Scanning User Profile & Developer Cache Directories...
          </p>
        </div>
      ) : filteredCaches.length === 0 ? (
        <div className="p-8 bg-white border-2.5 border-slate-900 rounded-2xl shadow-comic text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 border-2 border-slate-900 flex items-center justify-center mx-auto shadow-comic-sm">
            <ShieldCheck className="w-6 h-6 text-emerald-700" />
          </div>
          <h4 className="font-bangers text-lg uppercase tracking-wider text-slate-900">
            No Heavy Developer Caches Detected
          </h4>
          <p className="text-xs font-fredoka font-semibold text-slate-600 max-w-md mx-auto">
            Your developer environment is already lean. As you run Google Antigravity, Cursor, npm, and Cargo, newly accumulated build artifacts and model weights will show up here.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredCaches.map((item) => {
            const isSelected = selectedIds.has(item.id);
            return (
              <div
                key={item.id}
                onClick={() => toggleSelect(item.id)}
                className={`p-3.5 rounded-2xl border-2 border-slate-900 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-amber-50 shadow-comic'
                    : 'bg-white shadow-comic-sm hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start space-x-3 truncate">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelect(item.id);
                    }}
                    className="mt-1 text-slate-900 shrink-0"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-amber-600 fill-amber-300" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-400" />
                    )}
                  </button>

                  {getToolIcon(item.tool, item.tool_icon)}

                  <div className="truncate">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-comic text-xs uppercase tracking-wide text-slate-900 font-bold truncate">
                        {item.name}
                      </h4>
                      {getSafetyBadge(item.safety_level)}
                      <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-300">
                        {item.tool}
                      </span>
                    </div>

                    <p className="text-[11px] font-fredoka font-semibold text-slate-600 mt-0.5 line-clamp-1">
                      {item.description}
                    </p>

                    <p
                      className="text-[10px] text-slate-500 font-mono truncate mt-0.5"
                      title={cleanDisplayPath(item.path)}
                    >
                      {cleanDisplayPath(item.path)}
                    </p>

                    <p className="text-[10px] font-fredoka font-bold text-slate-700 mt-1 flex items-center">
                      <Info className="w-3 h-3 mr-1 text-sky-600 shrink-0" />
                      {item.safety_explanation}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 shrink-0 pl-11 md:pl-0 justify-between md:justify-end">
                  <div className="text-right">
                    <span className="font-comic text-sm font-bold text-slate-900 block">
                      {formatBytes(item.size_bytes, unit)}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      ~{item.file_count.toLocaleString()} files
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReveal(item.path);
                    }}
                    className="p-1.5 rounded-lg border border-slate-900 bg-white hover:bg-amber-200 text-slate-900 shadow-comic-sm transition-colors cursor-pointer"
                    title="Reveal folder in Explorer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-3 border-slate-900 rounded-3xl p-6 max-w-lg w-full shadow-comic space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500 border-2.5 border-slate-900 flex items-center justify-center text-white shadow-comic-sm shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bangers text-2xl uppercase tracking-wider text-slate-900">
                  Confirm Cache Purge
                </h3>
                <p className="text-xs font-fredoka font-semibold text-slate-600">
                  You are about to reclaim space from developer caches.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50 border-2 border-slate-900 rounded-xl space-y-2 text-xs font-fredoka">
              <div className="flex justify-between font-bold text-slate-900 pb-1 border-b border-slate-300">
                <span>Selected Caches:</span>
                <span className="font-comic font-bold">{selectedCaches.length} targets</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900">
                <span>Total Storage to Reclaim:</span>
                <span className="font-comic font-bold text-emerald-700 text-sm">
                  {formatBytes(totalSelectedBytes, unit)}
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-600 font-fredoka space-y-1">
              <p className="font-bold text-slate-800">Safety Verification:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Your source code, git commits, and repos will NOT be touched.</li>
                <li>AI models and packages will re-download on demand when requested.</li>
                <li>Ensure any active IDEs or builds are idle for smooth file unlocking.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border-2 border-slate-900 font-comic text-xs uppercase tracking-wider rounded-xl shadow-comic-sm cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handlePurge}
                disabled={isCleaning}
                className="flex items-center space-x-1.5 px-5 py-2.5 bg-rose-500 hover:bg-rose-400 text-white font-bangers text-sm uppercase tracking-wider border-2 border-slate-900 rounded-xl shadow-comic cursor-pointer transition-all"
              >
                {isCleaning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Purging Caches...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Confirm & Reclaim {formatBytes(totalSelectedBytes, unit)}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
