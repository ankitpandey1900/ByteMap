import React, { useState, useEffect, useRef } from 'react';
import {
  FolderMinus,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Loader2,
  CheckSquare,
  Square,
} from 'lucide-react';
import { ScannedFolder, ScannedFile } from '@/types';
import { cleanDisplayPath } from '@/lib/utils';
import { api, CleanupExecutionResult } from '@/lib/api';

interface EmptyFoldersCardProps {
  folders?: ScannedFolder[];
  largestFiles?: ScannedFile[];
  preferTrash: boolean;
  onCleanupComplete?: (result: CleanupExecutionResult) => void;
}

export const EmptyFoldersCard: React.FC<EmptyFoldersCardProps> = ({
  folders = [],
  largestFiles = [],
  preferTrash,
  onCleanupComplete,
}) => {
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isCleaning, setIsCleaning] = useState(false);

  // Identify empty directory structures
  const emptyFolders: ScannedFolder[] = React.useMemo(() => {
    if (!folders || folders.length === 0) return [];
    const list: ScannedFolder[] = [];

    function walk(folder: ScannedFolder) {
      const hasNoFiles = folder.size_bytes === 0 && folder.file_count === 0;
      const hasNoChildren = !folder.children_dirs || folder.children_dirs.length === 0;

      if (hasNoFiles && hasNoChildren) {
        list.push(folder);
      } else if (folder.children_dirs) {
        for (const child of folder.children_dirs) {
          walk(child);
        }
      }
    }

    for (const folder of folders) {
      walk(folder);
    }
    return list.slice(0, 50); // limit to top 50 for UI performance
  }, [folders]);

  // Identify zero-byte orphan files
  const zeroByteFiles = React.useMemo(() => {
    return largestFiles.filter((f) => f.size_bytes === 0);
  }, [largestFiles]);

  const allItems = React.useMemo(() => {
    return [
      ...emptyFolders.map((f) => ({ id: `ef_${f.id || f.path}`, path: f.path, name: f.name, isFolder: true })),
      ...zeroByteFiles.map((f) => ({ id: `zf_${f.id || f.path}`, path: f.path, name: f.name, isFolder: false })),
    ];
  }, [emptyFolders, zeroByteFiles]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(allItems.map((i) => i.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handlePrune = async () => {
    const selected = allItems.filter((i) => selectedIds.has(i.id));
    if (selected.length === 0) return;

    setIsCleaning(true);
    try {
      const targets = selected.map((i) => ({ path: i.path, expected_size: 0 }));
      const res = await api.executeCleanup(targets, preferTrash);
      clearSelection();
      if (onCleanupComplete) onCleanupComplete(res);
    } catch (err) {
      console.error('Failed to prune empty items:', err);
    } finally {
      if (isMountedRef.current) {
        setIsCleaning(false);
      }
    }
  };

  if (allItems.length === 0) {
    return (
      <div className="p-6 bg-white border-2.5 border-slate-900 rounded-2xl shadow-comic text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-emerald-200 border-2 border-slate-900 flex items-center justify-center mx-auto shadow-comic-sm">
          <ShieldCheck className="w-6 h-6 text-emerald-800" />
        </div>
        <h4 className="font-bangers text-lg uppercase tracking-wider text-slate-900">
          Clean Filesystem! No Empty Ghost Folders Found
        </h4>
        <p className="text-xs font-fredoka font-semibold text-slate-600 max-w-md mx-auto">
          Your scanned directories have zero empty folders or 0-byte orphan files cluttering your filesystem tables.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Banner */}
      <div className="p-4 bg-gradient-to-r from-sky-50 to-blue-50 border-2.5 border-slate-900 rounded-2xl shadow-comic flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-xl bg-sky-300 border-2.5 border-slate-900 flex items-center justify-center shadow-comic-sm shrink-0">
            <FolderMinus className="w-6 h-6 text-slate-900" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bangers text-xl uppercase tracking-wider text-slate-900">
                Empty Directories & Ghost Files
              </h3>
              <span className="font-mono font-bold text-xs bg-sky-200 px-2 py-0.5 rounded-md border border-slate-900 shadow-comic-sm">
                {allItems.length} Candidates
              </span>
            </div>
            <p className="text-xs font-fredoka font-semibold text-slate-600">
              Clean up abandoned empty directories left behind by uninstalled apps and 0-byte orphan files.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {selectedIds.size > 0 ? (
            <button
              type="button"
              onClick={handlePrune}
              disabled={isCleaning}
              className="flex items-center space-x-1.5 px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white font-bangers text-sm uppercase tracking-wider border-2 border-slate-900 rounded-xl shadow-comic transition-all cursor-pointer"
            >
              {isCleaning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              <span>Prune Selected ({selectedIds.size})</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={selectAll}
              className="px-3.5 py-2 bg-sky-200 hover:bg-sky-300 font-bangers text-xs uppercase tracking-wider text-slate-900 border-2 border-slate-900 rounded-xl shadow-comic-sm transition-all cursor-pointer"
            >
              Select All ({allItems.length})
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border-2.5 border-slate-900 shadow-comic divide-y-2 divide-slate-100 overflow-hidden max-h-96 overflow-y-auto">
        {allItems.map((item) => {
          const isSelected = selectedIds.has(item.id);
          return (
            <div
              key={item.id}
              onClick={() => toggleSelect(item.id)}
              className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                isSelected ? 'bg-sky-100/70' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelect(item.id);
                  }}
                  className="shrink-0 text-slate-900 hover:text-sky-600"
                >
                  {isSelected ? (
                    <CheckSquare className="w-5 h-5 fill-sky-400 text-slate-900" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-400" />
                  )}
                </button>

                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-fredoka font-bold text-sm text-slate-900 truncate">
                      {item.name}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-200 text-slate-800 border border-slate-900">
                      {item.isFolder ? 'Empty Directory' : '0-Byte Ghost'}
                    </span>
                  </div>
                  <p
                    className="text-[11px] font-mono text-slate-500 truncate mt-0.5"
                    title={cleanDisplayPath(item.path)}
                  >
                    {cleanDisplayPath(item.path)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    api.revealInFolder(item.path);
                  }}
                  title="Open in File Explorer"
                  className="p-1.5 rounded-lg border border-transparent hover:border-slate-900 hover:bg-sky-200 text-slate-700 transition-all cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
