import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  const {
    devCaches,
    isScanningDevCaches,
    scanDevCachesAction,
    applyCleanupResult,
  } = useAppStore();

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isCleaning, setIsCleaning] = useState<boolean>(false);
  const [showConfirm, setShowConfirm] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<'all' | 'ai_ide' | 'packages' | 'build'>('all');
  const [lastPurged, setLastPurged] = useState<DevCacheCleanSummary | null>(null);

  const caches = devCaches || [];

  // When caches first arrive from a scan, pre-select safe items once
  useEffect(() => {
    if (devCaches && devCaches.length > 0 && selectedIds.size === 0) {
      const safeIds = new Set(
        devCaches.filter((c) => c.safety_level === 'safe').map((c) => c.id)
      );
      setSelectedIds(safeIds);
    }
  }, [devCaches]);

  const handleScan = async () => {
    try {
      const items = await scanDevCachesAction();
      if (isMountedRef.current) {
        const safeIds = new Set(
          items.filter((c) => c.safety_level === 'safe').map((c) => c.id)
        );
        setSelectedIds(safeIds);
      }
    } catch (err) {
      console.error('Failed to scan developer caches:', err);
    }
  };

  const isAiIde = (item: DevCacheItem) => {
    const t = item.tool.toLowerCase();
    return t.includes('antigravity') || t.includes('cursor') || t.includes('code');
  };

  const isPackages = (item: DevCacheItem) => {
    const t = item.tool.toLowerCase();
    return t.includes('npm') || t.includes('pnpm') || t.includes('cargo') || t.includes('pip') || t.includes('uv') || t.includes('yarn');
  };

  const isBuild = (item: DevCacheItem) => {
    const t = item.tool.toLowerCase();
    return t.includes('gradle') || t.includes('go') || t.includes('maven');
  };

  const aiIdeCount = useMemo(() => caches.filter(isAiIde).length, [caches]);
  const packagesCount = useMemo(() => caches.filter(isPackages).length, [caches]);
  const buildCount = useMemo(() => caches.filter(isBuild).length, [caches]);

  const filteredCaches = useMemo(() => {
    return caches.filter((item) => {
      if (activeCategory === 'all') return true;
      if (activeCategory === 'ai_ide') return isAiIde(item);
      if (activeCategory === 'packages') return isPackages(item);
      if (activeCategory === 'build') return isBuild(item);
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
      if (isMountedRef.current) {
        setLastPurged(summary);
      }

      // Extract successful paths
      const successfulPaths = summary.results
        .filter((r) => r.success)
        .map((r) => r.path);

      // LIVE STORAGE SYNCHRONIZER: Instantly update store drives, scan metrics, and caches (0ms latency!)
      applyCleanupResult(summary.total_freed_bytes, successfulPaths);

      // Remove purged IDs from current selection
      setSelectedIds((prev) => {
        const next = new Set(prev);
        targetIds.forEach((id) => next.delete(id));
        return next;
      });

      if (onCleanupComplete) {
        onCleanupComplete(summary);
      }
    } catch (err) {
      console.error('Developer cache purge failed:', err);
    } finally {
      if (isMountedRef.current) {
        setIsCleaning(false);
      }
    }
  };

  const getToolIcon = (tool: string) => {
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

  // 1. Initial State: No automatic scan on mount (user clicks when they want to scan)
  if (devCaches === null && !isScanningDevCaches) {
    return (
      <div className="p-8 bg-gradient-to-r from-sky-50 via-indigo-50 to-amber-50 border-3 border-slate-900 rounded-2xl shadow-comic flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-400 border-3 border-slate-900 flex items-center justify-center shadow-comic-sm">
          <Sparkles className="w-8 h-8 text-slate-900" />
        </div>
        <div>
          <div className="inline-block bg-sky-400 text-slate-900 text-xs font-bangers uppercase tracking-wider px-3 py-1 border-2 border-slate-900 rounded-full shadow-comic-sm mb-2">
            Developer Toolchain Intelligence
          </div>
          <h3 className="font-bangers text-3xl uppercase tracking-wider text-slate-900">
            Coding & IDE Cache Purger
          </h3>
          <p className="max-w-xl text-sm font-fredoka font-semibold text-slate-600 mt-1">
            Reclaim gigabytes from hidden AI models, IDE session artifacts (Google Antigravity, Cursor, VS Code), and package caches (npm, pnpm, Cargo, pip, Gradle, Go).
          </p>
        </div>
        <button
          type="button"
          onClick={handleScan}
          className="flex items-center space-x-2.5 px-6 py-3 bg-amber-400 hover:bg-amber-300 active:translate-y-0.5 text-slate-900 font-bangers text-lg uppercase tracking-wider border-3 border-slate-900 rounded-xl shadow-comic transition-all cursor-pointer"
        >
          <Zap className="w-5 h-5 fill-slate-900" />
          <span>Scan Developer Caches</span>
        </button>
        <span className="text-[11px] font-comic font-bold text-slate-500 uppercase tracking-wide">
          Safe & Non-blocking • Zero files scanned until you click
        </span>
      </div>
    );
  }

  // 2. Loading State: Scanning in background
  if (isScanningDevCaches) {
    return (
      <div className="p-10 bg-white border-3 border-slate-900 rounded-2xl shadow-comic flex flex-col items-center justify-center text-center space-y-4">
        <Loader2 className="w-12 h-12 text-sky-500 animate-spin" />
        <h3 className="font-bangers text-2xl uppercase tracking-wider text-slate-900">
          Auditing Developer Toolchains...
        </h3>
        <p className="text-xs font-fredoka font-semibold text-slate-600 max-w-md">
          Inspecting Antigravity session brain, on-device AI model weights, VS Code ASTs, and package stores in parallel with Rayon.
        </p>
      </div>
    );
  }

  // 3. Loaded State: Display interactive cache table & controls
  return (
    <div className="space-y-4">
      {/* Top Banner Card */}
      <div className="p-4 bg-gradient-to-r from-sky-50 via-indigo-50 to-amber-50 border-2.5 border-slate-900 rounded-2xl shadow-comic flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-sky-400 border-2.5 border-slate-900 flex items-center justify-center shadow-comic-sm shrink-0">
            <Sparkles className="w-6 h-6 text-slate-900" />
          </div>
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-1">
              <h3 className="font-bangers text-xl uppercase tracking-wider text-slate-900">
                Coding & IDE Cache Purger
              </h3>
              <span className="font-mono font-bold text-xs bg-amber-300 px-2 py-0.5 rounded-md border border-slate-900 shadow-comic-sm">
                {caches.length} Caches • {formatBytes(totalDiscoveredBytes, unit)}
              </span>
            </div>
            <p className="text-xs font-fredoka font-semibold text-slate-600">
              Reclaim gigabytes from hidden AI models, IDE session artifacts, and package stores.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 flex-wrap gap-2">
          <button
            type="button"
            onClick={handleScan}
            disabled={isScanningDevCaches || isCleaning}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-100 font-comic text-xs uppercase tracking-wider text-slate-900 border-2 border-slate-900 rounded-xl shadow-comic-sm transition-all cursor-pointer disabled:opacity-50"
            title="Scan for new cache files"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanningDevCaches ? 'animate-spin' : ''}`} />
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
                Drive gauges and storage metrics updated instantly.
              </span>
            </div>
          </div>
          <button
            onClick={() => setLastPurged(null)}
            className="text-xs font-comic uppercase text-slate-600 hover:text-slate-900 ml-2 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Responsive Filter and Selection Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {[
            { id: 'all', label: 'All Caches', count: caches.length },
            { id: 'ai_ide', label: 'AI & IDEs', count: aiIdeCount },
            { id: 'packages', label: 'Package Managers', count: packagesCount },
            { id: 'build', label: 'Build Systems', count: buildCount },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border-2 border-slate-900 font-comic text-xs uppercase tracking-wide transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-amber-400 text-slate-900 shadow-comic -translate-y-0.5 font-bold'
                  : 'bg-white hover:bg-amber-100 text-slate-700 shadow-comic-sm'
              }`}
            >
              <span>{cat.label}</span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900 text-white font-bold">
                {cat.count}
              </span>
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
            className="hover:text-slate-900 underline cursor-pointer"
          >
            Deselect
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="border-2.5 border-slate-900 rounded-2xl bg-white shadow-comic overflow-hidden">
        {filteredCaches.length === 0 ? (
          <div className="p-8 text-center text-slate-500 font-fredoka text-sm">
            ✨ No developer caches detected in this category. Your toolchain is clean!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b-2 border-slate-900 font-comic uppercase text-slate-700 tracking-wider">
                  <th className="p-3 w-10 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedIds.size === filteredCaches.length) {
                          deselectAll();
                        } else {
                          selectAll();
                        }
                      }}
                      className="cursor-pointer"
                    >
                      {selectedIds.size === filteredCaches.length && filteredCaches.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-slate-900" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </th>
                  <th className="p-3">Tool / Cache Type</th>
                  <th className="p-3">Path & Purpose</th>
                  <th className="p-3 text-center">Safety Level</th>
                  <th className="p-3 text-right">Size</th>
                  <th className="p-3 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-fredoka">
                {filteredCaches.map((item) => {
                  const isSelected = selectedIds.has(item.id);
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-amber-50/60 transition-colors ${
                        isSelected ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSelect(item.id)}
                          className="cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-slate-900" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 hover:text-slate-600" />
                          )}
                        </button>
                      </td>

                      <td className="p-3">
                        <div className="flex items-center space-x-2.5">
                          {getToolIcon(item.tool)}
                          <div>
                            <div className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                              <span>{item.tool}</span>
                              <span className="text-[10px] text-slate-500 font-normal">
                                ({item.name})
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium">
                              {item.file_count.toLocaleString()} files cached
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3 max-w-md">
                        <div
                          className="font-mono text-[11px] text-slate-700 truncate"
                          title={item.path}
                        >
                          {cleanDisplayPath(item.path)}
                        </div>
                        <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {item.description}
                        </div>
                      </td>

                      <td className="p-3 text-center">
                        <div className="flex flex-col items-center">
                          {getSafetyBadge(item.safety_level)}
                          <span
                            className="text-[10px] text-slate-500 mt-1 max-w-[130px] text-center truncate"
                            title={item.safety_explanation}
                          >
                            {item.safety_explanation}
                          </span>
                        </div>
                      </td>

                      <td className="p-3 text-right">
                        <div className="font-mono font-bold text-slate-900 text-sm">
                          {formatBytes(item.size_bytes, unit)}
                        </div>
                      </td>

                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleReveal(item.path)}
                          className="p-1.5 rounded-lg border border-slate-300 hover:border-slate-900 hover:bg-white text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
                          title="Open folder in File Explorer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border-3 border-slate-900 rounded-2xl p-6 max-w-lg w-full shadow-comic space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-amber-400 border-2.5 border-slate-900 flex items-center justify-center shadow-comic-sm shrink-0">
                <Trash2 className="w-6 h-6 text-slate-900" />
              </div>
              <div>
                <h3 className="font-bangers text-2xl uppercase tracking-wider text-slate-900">
                  Confirm Cache Purge
                </h3>
                <p className="text-xs font-comic text-slate-600">
                  You are about to reclaim {formatBytes(totalSelectedBytes, unit)} across{' '}
                  {selectedCaches.length} developer cache stations.
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border-2 border-slate-900 rounded-xl text-xs space-y-1.5">
              <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Zero Risk Guarantee</span>
              </div>
              <p className="text-slate-700 leading-relaxed">
                ByteMap will strictly purge temporary files and cached downloads. Your source code, git commits, configuration files, and active projects are 100% untouched.
              </p>
            </div>

            <div className="max-h-40 overflow-y-auto space-y-1.5 border border-slate-200 p-2 rounded-xl text-xs font-mono">
              {selectedCaches.map((c) => (
                <div key={c.id} className="flex justify-between items-center text-slate-700">
                  <span className="truncate max-w-[320px]">{c.name}</span>
                  <span className="font-bold">{formatBytes(c.size_bytes, unit)}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={isCleaning}
                className="px-4 py-2 border-2 border-slate-900 rounded-xl font-comic text-xs uppercase hover:bg-slate-100 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePurge}
                disabled={isCleaning}
                className="flex items-center space-x-2 px-5 py-2 bg-rose-500 hover:bg-rose-400 text-white font-bangers text-sm uppercase tracking-wider border-2 border-slate-900 rounded-xl shadow-comic transition-all cursor-pointer disabled:opacity-50"
              >
                {isCleaning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Purging Caches...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Confirm Purge ({formatBytes(totalSelectedBytes, unit)})</span>
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
