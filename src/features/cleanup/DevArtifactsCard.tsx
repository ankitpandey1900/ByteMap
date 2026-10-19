import React, { useState } from 'react';
import {
  Code2,
  ExternalLink,
  Trash2,
  ShieldAlert,
  Loader2,
  CheckSquare,
  Square,
} from 'lucide-react';
import { ScannedFolder } from '@/types';
import { formatBytes, cleanDisplayPath } from '@/lib/utils';
import { api, CleanupExecutionResult } from '@/lib/api';

export interface DevArtifactItem {
  id: string;
  name: string;
  projectName: string;
  path: string;
  size_bytes: number;
  type: 'node' | 'rust' | 'python' | 'java' | 'build';
}

interface DevArtifactsCardProps {
  folders?: ScannedFolder[];
  preferTrash: boolean;
  unit: 'binary' | 'decimal';
  onCleanupComplete?: (result: CleanupExecutionResult) => void;
}

export const DevArtifactsCard: React.FC<DevArtifactsCardProps> = ({
  folders = [],
  preferTrash,
  unit,
  onCleanupComplete,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isCleaning, setIsCleaning] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Traverse directory tree to identify developer build folders
  const artifacts: DevArtifactItem[] = React.useMemo(() => {
    if (!folders || folders.length === 0) return [];
    const list: DevArtifactItem[] = [];

    function walk(folder: ScannedFolder, parentName: string) {
      const lower = folder.name.toLowerCase();
      let type: DevArtifactItem['type'] | null = null;

      if (lower === 'node_modules') {
        type = 'node';
      } else if (lower === 'target' && (folder.path.includes('\\src') || folder.path.includes('/src') || folder.size_bytes > 5 * 1024 * 1024)) {
        type = 'rust';
      } else if (lower === '.venv' || lower === 'venv' || lower === '__pycache__') {
        type = 'python';
      } else if (lower === '.gradle' || lower === '.m2') {
        type = 'java';
      } else if (lower === '.next' || lower === '.nuxt' || lower === 'dist' || lower === 'build') {
        if (folder.size_bytes > 15 * 1024 * 1024) {
          type = 'build';
        }
      }

      if (type && folder.size_bytes > 1024 * 1024) {
        list.push({
          id: `dev_${folder.id || folder.path}`,
          name: folder.name,
          projectName: parentName || 'Workspace',
          path: folder.path,
          size_bytes: folder.size_bytes,
          type,
        });
        return; // Don't traverse deeper into node_modules or target
      }

      if (folder.children_dirs && folder.children_dirs.length > 0) {
        for (const child of folder.children_dirs) {
          walk(child, folder.name);
        }
      }
    }

    for (const folder of folders) {
      walk(folder, folder.name);
    }
    return list.sort((a, b) => b.size_bytes - a.size_bytes);
  }, [folders]);

  const totalReclaimable = artifacts.reduce((acc, item) => acc + item.size_bytes, 0);

  const selectedItems = artifacts.filter((item) => selectedIds.has(item.id));
  const totalSelectedBytes = selectedItems.reduce((acc, item) => acc + item.size_bytes, 0);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(artifacts.map((a) => a.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handlePurge = async () => {
    if (selectedItems.length === 0) return;
    setIsCleaning(true);
    setShowConfirm(false);

    try {
      const targets = selectedItems.map((item) => ({
        path: item.path,
        expected_size: item.size_bytes,
      }));

      const res = await api.executeCleanup(targets, preferTrash);
      clearSelection();
      if (onCleanupComplete) onCleanupComplete(res);
    } catch (err) {
      console.error('Failed to purge dev artifacts:', err);
    } finally {
      setIsCleaning(false);
    }
  };

  const getTypeBadge = (type: DevArtifactItem['type']) => {
    switch (type) {
      case 'node':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-100 text-emerald-900 border border-slate-900 shadow-comic-sm">Node.js (node_modules)</span>;
      case 'rust':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-orange-100 text-orange-900 border border-slate-900 shadow-comic-sm">Rust (target/)</span>;
      case 'python':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-100 text-blue-900 border border-slate-900 shadow-comic-sm">Python (.venv / cache)</span>;
      case 'java':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-slate-900 shadow-comic-sm">Java (.gradle / .m2)</span>;
      case 'build':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-purple-100 text-purple-900 border border-slate-900 shadow-comic-sm">Build Dist (.next / dist)</span>;
    }
  };

  if (artifacts.length === 0) {
    return (
      <div className="p-6 bg-white border-2.5 border-slate-900 rounded-2xl shadow-comic text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-amber-200 border-2 border-slate-900 flex items-center justify-center mx-auto shadow-comic-sm">
          <Code2 className="w-6 h-6 text-slate-900" />
        </div>
        <h4 className="font-bangers text-lg uppercase tracking-wider text-slate-900">
          No Heavy Developer Build Artifacts Found
        </h4>
        <p className="text-xs font-fredoka font-semibold text-slate-600 max-w-md mx-auto">
          No large <code className="bg-slate-100 px-1 rounded border">node_modules</code>, Rust <code className="bg-slate-100 px-1 rounded border">target/</code>, or Python <code className="bg-slate-100 px-1 rounded border">.venv</code> directories detected in the scanned drive path.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Banner Card */}
      <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2.5 border-slate-900 rounded-2xl shadow-comic flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-xl bg-amber-400 border-2.5 border-slate-900 flex items-center justify-center shadow-comic-sm shrink-0">
            <Code2 className="w-6 h-6 text-slate-900" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bangers text-xl uppercase tracking-wider text-slate-900">
                Developer Build Artifacts Sweeper
              </h3>
              <span className="font-mono font-bold text-xs bg-amber-300 px-2 py-0.5 rounded-md border border-slate-900 shadow-comic-sm">
                {artifacts.length} Projects
              </span>
            </div>
            <p className="text-xs font-fredoka font-semibold text-slate-600">
              Recover massive storage by safely removing cached build folders. Your actual source code is 100% safe (rebuild anytime with <code className="font-mono font-bold text-slate-900">npm i</code> or <code className="font-mono font-bold text-slate-900">cargo build</code>).
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
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
              onClick={selectAll}
              className="px-3.5 py-2 bg-amber-300 hover:bg-amber-400 font-bangers text-xs uppercase tracking-wider text-slate-900 border-2 border-slate-900 rounded-xl shadow-comic-sm transition-all cursor-pointer"
            >
              Select All ({formatBytes(totalReclaimable, unit)})
            </button>
          )}
        </div>
      </div>

      {/* Artifacts List */}
      <div className="bg-white rounded-2xl border-2.5 border-slate-900 shadow-comic divide-y-2 divide-slate-100 overflow-hidden">
        {artifacts.map((item) => {
          const isSelected = selectedIds.has(item.id);
          return (
            <div
              key={item.id}
              onClick={() => toggleSelect(item.id)}
              className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                isSelected ? 'bg-amber-100/70' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelect(item.id);
                  }}
                  className="shrink-0 text-slate-900 hover:text-amber-600"
                >
                  {isSelected ? (
                    <CheckSquare className="w-5 h-5 fill-amber-400 text-slate-900" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-400" />
                  )}
                </button>

                <div className="min-w-0">
                  <div className="flex items-center space-x-2 flex-wrap gap-1">
                    <span className="font-fredoka font-bold text-sm text-slate-900 truncate">
                      {item.projectName}
                    </span>
                    <span className="font-mono text-xs text-slate-500">
                      /{item.name}
                    </span>
                    {getTypeBadge(item.type)}
                  </div>
                  <p
                    className="text-[11px] font-mono text-slate-500 truncate mt-0.5"
                    title={cleanDisplayPath(item.path)}
                  >
                    {cleanDisplayPath(item.path)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 shrink-0">
                <span className="font-mono font-bold text-sm text-slate-900 tabular-nums bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-300">
                  {formatBytes(item.size_bytes, unit)}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    api.revealInFolder(item.path);
                  }}
                  title="Open folder in File Explorer"
                  className="p-1.5 rounded-lg border border-transparent hover:border-slate-900 hover:bg-amber-200 text-slate-700 transition-all cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border-3 border-slate-900 shadow-comic-xl max-w-md w-full p-6 space-y-4 animate-comic-pop select-none">
            <div className="w-12 h-12 rounded-xl bg-amber-400 border-2.5 border-slate-900 flex items-center justify-center shadow-comic-sm">
              <ShieldAlert className="w-6 h-6 text-slate-900" />
            </div>
            <div>
              <h3 className="font-bangers text-2xl uppercase tracking-wider text-slate-900">
                Confirm Developer Build Purge
              </h3>
              <p className="text-xs font-fredoka font-semibold text-slate-600 mt-1">
                You are about to purge <strong>{selectedIds.size} build folders</strong> totaling{' '}
                <strong className="text-slate-900 font-mono">{formatBytes(totalSelectedBytes, unit)}</strong>.
              </p>
            </div>
            <div className="p-3 bg-amber-50 border-2 border-slate-900 rounded-xl text-xs font-fredoka font-semibold text-slate-700 space-y-1">
              <p className="flex items-center space-x-1 font-bold text-slate-900">
                <span>🛡️ Safety Notice:</span>
              </p>
              <p>• Only compiled artifacts and dependency caches will be removed.</p>
              <p>• Your source code and git repositories will remain completely intact.</p>
              <p>
                • Files will be {preferTrash ? 'moved safely to the Recycle Bin' : 'permanently deleted'}.
              </p>
            </div>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 border-2 border-slate-900 rounded-xl font-comic text-xs uppercase bg-white hover:bg-slate-100 cursor-pointer shadow-comic-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePurge}
                disabled={isCleaning}
                className="flex items-center space-x-1.5 px-5 py-2 bg-rose-500 hover:bg-rose-400 text-white border-2 border-slate-900 rounded-xl font-bangers text-sm uppercase tracking-wider cursor-pointer shadow-comic"
              >
                {isCleaning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>Confirm & Purge</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
