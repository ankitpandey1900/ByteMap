import React, { useState, useMemo } from 'react';
import {
  Search,
  ExternalLink,
  ArrowUpDown,
  Filter,
  Layers,
  X,
  Calendar,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import {
  formatBytes,
  formatDate,
  formatNumber,
  getCategoryColor,
  getCategoryEmoji,
  cleanDisplayPath,
} from '@/lib/utils';
import {
  ComicFolderIcon,
  ComicCategoryFileIcon,
  ComicExploreIcon,
} from '@/components/icons/ComicIcons';
import { ScoutAvatar } from '@/components/ScoutMascot';
import { api } from '@/lib/api';

type SortColumn = 'name' | 'size' | 'category' | 'date';

export const ExplorerTab: React.FC = () => {
  const { scanSummary, settings, setTreemapCurrentPath, setActiveTab } = useAppStore();
  const [viewMode, setViewMode] = useState<'files' | 'folders'>('files');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortCol, setSortCol] = useState<SortColumn>('size');
  const [sortDesc, setSortDesc] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const handleReveal = async (path: string) => {
    try {
      await api.revealInFolder(path);
    } catch (err) {
      console.error('Failed to reveal file:', err);
    }
  };

  const handleInspectInTreemap = (path: string) => {
    setTreemapCurrentPath(path);
    setActiveTab('overview');
  };

  const handleSort = (col: SortColumn) => {
    if (sortCol === col) {
      setSortDesc(!sortDesc);
    } else {
      setSortCol(col);
      setSortDesc(true);
    }
    setPage(1);
  };

  // Filter and sort items based on real scan data
  const filteredFiles = useMemo(() => {
    if (!scanSummary) return [];

    let files = scanSummary.largest_files.filter((f) => {
      if (categoryFilter !== 'all' && f.category !== categoryFilter) return false;
      if (
        searchTerm &&
        !f.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !f.path.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }
      return true;
    });

    files.sort((a, b) => {
      let cmp = 0;
      if (sortCol === 'size') cmp = b.size_bytes - a.size_bytes;
      else if (sortCol === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortCol === 'category') cmp = a.category.localeCompare(b.category);
      else if (sortCol === 'date') cmp = (b.modified_at || 0) - (a.modified_at || 0);

      return sortDesc ? cmp : -cmp;
    });

    return files;
  }, [scanSummary, searchTerm, categoryFilter, sortCol, sortDesc]);

  const filteredFolders = useMemo(() => {
    if (!scanSummary) return [];

    let folders = scanSummary.largest_folders.filter((f) => {
      if (
        searchTerm &&
        !f.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !f.path.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }
      return true;
    });

    folders.sort((a, b) => {
      let cmp = 0;
      if (sortCol === 'size') cmp = b.size_bytes - a.size_bytes;
      else if (sortCol === 'name') cmp = a.name.localeCompare(b.name);
      else cmp = b.size_bytes - a.size_bytes;

      return sortDesc ? cmp : -cmp;
    });

    return folders;
  }, [scanSummary, searchTerm, sortCol, sortDesc]);

  const currentList = viewMode === 'files' ? filteredFiles : filteredFolders;
  const totalPages = Math.max(1, Math.ceil(currentList.length / pageSize));
  const paginatedList = currentList.slice((page - 1) * pageSize, page * pageSize);

  const maxFileSize = useMemo(() => {
    if (!filteredFiles.length) return 1;
    return filteredFiles[0].size_bytes || 1;
  }, [filteredFiles]);

  const maxFolderSize = useMemo(() => {
    if (!filteredFolders.length) return 1;
    return filteredFolders[0].size_bytes || 1;
  }, [filteredFolders]);

  if (!scanSummary) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[420px] p-8 text-center bg-white rounded-2xl border-3 border-slate-900 shadow-[6px_6px_0px_#0f172a] select-none w-full">
        <div className="w-20 h-20 rounded-2xl bg-amber-400 border-3 border-slate-900 shadow-[3px_3px_0px_#0f172a] flex items-center justify-center mb-4">
          <ScoutAvatar isScanning={false} className="w-14 h-14" />
        </div>
        <div className="inline-flex items-center px-3 py-1 rounded-lg bg-amber-400 border-2.5 border-slate-900 shadow-[2px_2px_0px_#0f172a] font-bangers text-xs uppercase tracking-wider text-slate-900 mb-2">
          Storage Explorer Idle
        </div>
        <h3 className="font-bangers text-3xl text-slate-900 uppercase tracking-wide mb-1 font-black">
          Uncharted Explorer
        </h3>
        <p className="font-comicNeue text-sm text-slate-700 max-w-sm font-bold">
          No files have been scouted yet. Click the <strong>ANALYZE</strong> button at the top to scout your drive and explore every file and directory.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 flex flex-col h-full w-full select-none font-sans text-slate-900 min-h-0">
      {/* Search and Filters comic toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border-3 border-slate-900 rounded-2xl shadow-[4px_4px_0px_#0f172a]">
        <div className="flex items-center space-x-3 flex-1 flex-wrap gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center p-1 bg-slate-100 border-2.5 border-slate-900 rounded-xl space-x-1 shadow-[2px_2px_0px_#0f172a]">
            <button
              onClick={() => {
                setViewMode('files');
                setPage(1);
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bangers text-sm uppercase tracking-wider transition-all ${
                viewMode === 'files'
                  ? 'bg-amber-400 text-slate-900 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ComicCategoryFileIcon category="document" className="w-4 h-4" />
              <span>Files ({formatNumber(scanSummary.largest_files.length)})</span>
            </button>
            <button
              onClick={() => {
                setViewMode('folders');
                setPage(1);
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bangers text-sm uppercase tracking-wider transition-all ${
                viewMode === 'folders'
                  ? 'bg-amber-400 text-slate-900 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ComicFolderIcon className="w-4 h-4" />
              <span>Folders ({formatNumber(scanSummary.largest_folders.length)})</span>
            </button>
          </div>

          {/* Flexible Search bar */}
          <div className="relative flex-1 min-w-[220px] max-w-xl">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder={`Search ${viewMode === 'files' ? 'files by name or directory...' : 'folders...'}`}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border-2.5 border-slate-900 rounded-xl text-xs font-fredoka font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-amber-50 focus:border-amber-500 shadow-inner"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filter and Counts */}
        <div className="flex items-center space-x-3">
          {viewMode === 'files' && (
            <div className="flex items-center space-x-1.5">
              <Filter className="w-4 h-4 text-slate-800" />
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-1.5 bg-slate-50 border-2.5 border-slate-900 rounded-xl font-comic text-xs uppercase font-bold text-slate-900 focus:outline-none shadow-[2px_2px_0px_#0f172a] cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="video">🎬 Videos</option>
                <option value="image">🖼️ Images</option>
                <option value="audio">🎵 Audio</option>
                <option value="document">📄 Documents</option>
                <option value="archive">📦 Archives</option>
                <option value="app">⚙️ Applications</option>
                <option value="dev">💻 Development</option>
                <option value="game">🎮 Games</option>
                <option value="other">📁 Other</option>
              </select>
            </div>
          )}

          <div className="flex items-center space-x-1.5 font-comic text-xs uppercase font-black text-slate-900 px-3 py-1.5 rounded-xl bg-yellow-300 border-2.5 border-slate-900 shadow-[2px_2px_0px_#0f172a]">
            <ComicExploreIcon className="w-4 h-4" />
            <span>{formatNumber(currentList.length)} Items</span>
          </div>
        </div>
      </div>

      {/* Explorer Comic Table */}
      <div className="flex-1 bg-white rounded-2xl border-3 border-slate-900 shadow-[4px_4px_0px_#0f172a] overflow-hidden flex flex-col min-h-0 w-full">
        <div className="overflow-x-auto flex-1 w-full">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b-3 border-slate-900 bg-amber-200 text-slate-900 font-bangers uppercase tracking-wider select-none text-sm">
                <th
                  onClick={() => handleSort('name')}
                  className="py-3 px-4 cursor-pointer hover:bg-amber-300 transition-colors w-auto"
                >
                  <div className="flex items-center space-x-1">
                    <span>Name & Location</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-700" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('size')}
                  className="py-3 px-4 cursor-pointer hover:bg-amber-300 transition-colors text-right w-40"
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Size</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-700" />
                  </div>
                </th>
                {viewMode === 'files' ? (
                  <>
                    <th
                      onClick={() => handleSort('category')}
                      className="py-3 px-4 cursor-pointer hover:bg-amber-300 transition-colors w-36 text-center"
                    >
                      <div className="flex items-center justify-center space-x-1">
                        <span>Category</span>
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-700" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('date')}
                      className="py-3 px-4 cursor-pointer hover:bg-amber-300 transition-colors w-44 text-right"
                    >
                      <div className="flex items-center justify-end space-x-1">
                        <span>Modified</span>
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-700" />
                      </div>
                    </th>
                  </>
                ) : (
                  <th className="py-3 px-4 text-right w-36">Contained Files</th>
                )}
                <th className="py-3 px-4 text-center w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-200">
              {viewMode === 'files'
                ? (paginatedList as typeof filteredFiles).map((file) => {
                    const percent = Math.min(
                      100,
                      Math.max(6, Math.round((file.size_bytes / maxFileSize) * 100))
                    );
                    const catColor = getCategoryColor(file.category);
                    const catEmoji = getCategoryEmoji(file.category);

                    return (
                      <tr
                        key={file.id}
                        className="hover:bg-amber-50/80 transition-colors group"
                      >
                        {/* Name & Clean Path */}
                        <td className="py-2.5 px-4 min-w-0">
                          <div className="flex items-center space-x-3 min-w-0">
                            <div className="shrink-0 p-1 bg-amber-100 border-2 border-slate-900 rounded-lg shadow-[1.5px_1.5px_0px_#0f172a] group-hover:scale-105 transition-transform">
                              <ComicCategoryFileIcon category={file.category} className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-comicNeue font-bold text-slate-900 text-sm truncate">
                                {file.name}
                              </p>
                              <p
                                className="text-[11px] text-slate-500 truncate font-mono"
                                title={cleanDisplayPath(file.path)}
                              >
                                {cleanDisplayPath(file.path)}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Size with visual mini-bar */}
                        <td className="py-2.5 px-4 text-right whitespace-nowrap">
                          <div className="font-mono font-bold text-slate-900 text-sm tabular-nums">
                            {formatBytes(file.size_bytes, settings.unit)}
                          </div>
                          <div className="w-24 ml-auto mt-1 h-2 bg-slate-200 border border-slate-900 rounded-full overflow-hidden p-0.2">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${percent}%`,
                                backgroundColor: catColor,
                              }}
                            />
                          </div>
                        </td>

                        {/* Category Pill */}
                        <td className="py-2.5 px-4 text-center whitespace-nowrap">
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bangers uppercase tracking-wider border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a]"
                            style={{
                              backgroundColor: `${catColor}25`,
                              color: '#0f172a',
                            }}
                          >
                            <span>{catEmoji}</span>
                            <span>{file.category}</span>
                          </span>
                        </td>

                        {/* Modified Date */}
                        <td className="py-2.5 px-4 text-right whitespace-nowrap text-xs font-mono text-slate-600">
                          <div className="flex items-center justify-end gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{formatDate(file.modified_at)}</span>
                          </div>
                        </td>

                        {/* Action: Reveal in Folder */}
                        <td className="py-2.5 px-4 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleReveal(file.path)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border-2 border-slate-900 bg-white hover:bg-yellow-300 active:translate-y-0.5 shadow-[2px_2px_0px_#0f172a] text-xs font-bangers uppercase tracking-wider transition-all"
                            title="Reveal in File Explorer"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-slate-900" />
                            <span>Open</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                : (paginatedList as typeof filteredFolders).map((folder) => {
                    const percent = Math.min(
                      100,
                      Math.max(6, Math.round((folder.size_bytes / maxFolderSize) * 100))
                    );

                    return (
                      <tr
                        key={folder.id}
                        className="hover:bg-amber-50/80 transition-colors group"
                      >
                        {/* Folder Name & Clean Path */}
                        <td className="py-2.5 px-4 min-w-0">
                          <div className="flex items-center space-x-3 min-w-0">
                            <div className="shrink-0 p-1 bg-amber-100 border-2 border-slate-900 rounded-lg shadow-[1.5px_1.5px_0px_#0f172a] group-hover:scale-105 transition-transform">
                              <ComicFolderIcon className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-fredoka font-bold text-slate-900 text-sm truncate">
                                {folder.name}
                              </p>
                              <p
                                className="text-[11px] text-slate-500 truncate font-mono"
                                title={cleanDisplayPath(folder.path)}
                              >
                                {cleanDisplayPath(folder.path)}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Size */}
                        <td className="py-2.5 px-4 text-right whitespace-nowrap">
                          <div className="font-comic font-black text-slate-900 text-sm">
                            {formatBytes(folder.size_bytes, settings.unit)}
                          </div>
                          <div className="w-24 ml-auto mt-1 h-2 bg-slate-200 border border-slate-900 rounded-full overflow-hidden p-0.2">
                            <div
                              className="h-full bg-amber-400 rounded-full transition-all"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </td>

                        {/* Contained Files */}
                        <td className="py-2.5 px-4 text-right font-comic font-bold text-slate-700 text-sm">
                          {formatNumber(folder.file_count)} files
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleInspectInTreemap(folder.path)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border-2 border-slate-900 bg-cyan-300 hover:bg-cyan-200 active:translate-y-0.5 shadow-[2px_2px_0px_#0f172a] text-xs font-comic font-bold uppercase transition-all"
                              title="Inspect in Interactive Treemap"
                            >
                              <Layers className="w-3.5 h-3.5 text-slate-900" />
                              <span>Map</span>
                            </button>
                            <button
                              onClick={() => handleReveal(folder.path)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border-2 border-slate-900 bg-white hover:bg-yellow-300 active:translate-y-0.5 shadow-[2px_2px_0px_#0f172a] text-xs font-comic font-bold uppercase transition-all"
                              title="Reveal in File Explorer"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-slate-900" />
                              <span>Open</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>

        {/* Comic Pagination Bar */}
        <div className="p-3 border-t-3 border-slate-900 bg-amber-50 flex items-center justify-between flex-wrap gap-2 text-xs font-fredoka font-bold text-slate-700 w-full">
          <span className="font-comic font-bold text-slate-800">
            Showing {(page - 1) * pageSize + 1}–
            {Math.min(page * pageSize, currentList.length)} of {formatNumber(currentList.length)} items
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1 rounded-lg border-2 border-slate-900 bg-white hover:bg-amber-300 font-comic uppercase font-black shadow-[2px_2px_0px_#0f172a] disabled:opacity-40 transition-all active:translate-y-0.5 cursor-pointer"
            >
              Prev
            </button>
            <span className="font-comic font-black text-slate-900 px-3 py-1 rounded-md bg-amber-200 border-2 border-slate-900 shadow-[1.5px_1.5px_0px_#0f172a]">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1 rounded-lg border-2 border-slate-900 bg-white hover:bg-amber-300 font-comic uppercase font-black shadow-[2px_2px_0px_#0f172a] disabled:opacity-40 transition-all active:translate-y-0.5 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
