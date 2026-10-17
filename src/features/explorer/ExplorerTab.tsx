import React, { useState, useMemo } from 'react';
import {
  Folder,
  FileText,
  Search,
  ExternalLink,
  ArrowUpDown,
  Filter,
  Layers,
  Compass,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatBytes, formatDate, formatNumber, getCategoryBadgeClass } from '@/lib/utils';
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

  if (!scanSummary) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[420px] p-8 text-center bg-white rounded-2xl border-2.5 border-slate-900 shadow-comic select-none">
        <div className="w-16 h-16 rounded-2xl bg-amber-400 border-2.5 border-slate-900 shadow-comic flex items-center justify-center mb-4">
          <Compass className="w-8 h-8 text-slate-900" />
        </div>
        <div className="inline-flex items-center px-3 py-1 rounded-lg bg-amber-400 border-2 border-slate-900 shadow-comic-sm font-comic text-xs uppercase tracking-wide text-slate-900 mb-2">
          Storage Explorer Idle
        </div>
        <h3 className="font-comic text-xl text-slate-900 uppercase tracking-wide mb-1">
          Uncharted Explorer
        </h3>
        <p className="font-fredoka text-xs text-slate-600 max-w-sm font-semibold">
          No files have been scouted yet. Click the <strong>ANALYZE</strong> button at the top to scout your drive and explore every file and directory.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3.5 flex flex-col h-full max-w-7xl select-none font-sans text-slate-900">
      {/* Search and Filters comic toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border-2.5 border-slate-900 rounded-2xl shadow-comic">
        <div className="flex items-center space-x-2.5 flex-wrap gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center p-1 bg-slate-100 border-2 border-slate-900 rounded-xl space-x-1">
            <button
              onClick={() => {
                setViewMode('files');
                setPage(1);
              }}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg font-comic text-xs uppercase tracking-wide transition-all ${
                viewMode === 'files'
                  ? 'bg-amber-400 text-slate-900 border-2 border-slate-900 shadow-comic-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Files ({scanSummary.largest_files.length})</span>
            </button>
            <button
              onClick={() => {
                setViewMode('folders');
                setPage(1);
              }}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg font-comic text-xs uppercase tracking-wide transition-all ${
                viewMode === 'folders'
                  ? 'bg-amber-400 text-slate-900 border-2 border-slate-900 shadow-comic-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Folder className="w-3.5 h-3.5" />
              <span>Folders ({scanSummary.largest_folders.length})</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder={`Search ${viewMode}...`}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border-2 border-slate-900 rounded-xl text-xs font-fredoka font-bold text-slate-900 focus:outline-none focus:bg-amber-50"
            />
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {viewMode === 'files' && (
            <div className="flex items-center space-x-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-700" />
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-1.5 bg-slate-50 border-2 border-slate-900 rounded-xl font-comic text-xs uppercase text-slate-900 focus:outline-none"
              >
                <option value="all">All Categories</option>
                <option value="video">Videos</option>
                <option value="image">Images</option>
                <option value="audio">Audio</option>
                <option value="document">Documents</option>
                <option value="archive">Archives</option>
                <option value="app">Applications</option>
                <option value="dev">Development</option>
                <option value="game">Games</option>
                <option value="other">Other</option>
              </select>
            </div>
          )}

          <span className="font-comic text-xs uppercase text-slate-700 px-2.5 py-1 rounded-lg bg-amber-100 border border-slate-900">
            {currentList.length} items
          </span>
        </div>
      </div>

      {/* Explorer Comic Table */}
      <div className="flex-1 bg-white rounded-2xl border-2.5 border-slate-900 shadow-comic overflow-hidden flex flex-col min-h-0">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b-2 border-slate-900 bg-amber-200 text-slate-900 font-comic uppercase tracking-wide select-none">
                <th
                  onClick={() => handleSort('name')}
                  className="py-2.5 px-4 cursor-pointer hover:bg-amber-300 transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>Name</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('size')}
                  className="py-2.5 px-4 cursor-pointer hover:bg-amber-300 transition-colors text-right w-28"
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Size</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                {viewMode === 'files' ? (
                  <>
                    <th
                      onClick={() => handleSort('category')}
                      className="py-2.5 px-4 cursor-pointer hover:bg-amber-300 transition-colors w-28"
                    >
                      <div className="flex items-center space-x-1">
                        <span>Category</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('date')}
                      className="py-2.5 px-4 cursor-pointer hover:bg-amber-300 transition-colors w-36"
                    >
                      <div className="flex items-center space-x-1">
                        <span>Modified</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                  </>
                ) : (
                  <th className="py-2.5 px-4 text-right w-28">Files</th>
                )}
                <th className="py-2.5 px-3 text-center w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 border-slate-900">
              {viewMode === 'files'
                ? (paginatedList as typeof filteredFiles).map((file) => (
                    <tr
                      key={file.id}
                      className="hover:bg-amber-50 transition-colors"
                    >
                      <td className="py-2 px-4 max-w-md">
                        <div className="flex items-center space-x-2 truncate">
                          <FileText className="w-4 h-4 text-slate-700 shrink-0" />
                          <div className="truncate">
                            <p className="font-fredoka font-bold text-slate-900 truncate">{file.name}</p>
                            <p className="text-[10px] text-slate-500 truncate font-mono">
                              {file.path}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-4 text-right font-comic text-slate-900 whitespace-nowrap">
                        {formatBytes(file.size_bytes, settings.unit)}
                      </td>
                      <td className="py-2 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-comic uppercase border border-slate-900 ${getCategoryBadgeClass(
                            file.category
                          )}`}
                        >
                          {file.category}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-slate-600 whitespace-nowrap text-[11px] font-fredoka font-semibold">
                        {formatDate(file.modified_at)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          onClick={() => handleReveal(file.path)}
                          className="p-1 rounded-lg border border-slate-900 bg-white hover:bg-amber-300 shadow-comic-sm text-slate-900 transition-colors"
                          title="Reveal in native file explorer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                : (paginatedList as typeof filteredFolders).map((folder) => (
                    <tr
                      key={folder.id}
                      className="hover:bg-amber-50 transition-colors"
                    >
                      <td className="py-2 px-4 max-w-md">
                        <div className="flex items-center space-x-2 truncate">
                          <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                          <div className="truncate">
                            <p className="font-fredoka font-bold text-slate-900 truncate">{folder.name}</p>
                            <p className="text-[10px] text-slate-500 truncate font-mono">
                              {folder.path}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-4 text-right font-comic text-slate-900 whitespace-nowrap">
                        {formatBytes(folder.size_bytes, settings.unit)}
                      </td>
                      <td className="py-2 px-4 text-right font-fredoka font-bold text-slate-700">
                        {formatNumber(folder.file_count)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => handleInspectInTreemap(folder.path)}
                            className="p-1 rounded-lg border border-slate-900 bg-cyan-300 hover:bg-cyan-200 shadow-comic-sm text-slate-900 transition-colors"
                            title="Inspect in Interactive Map"
                          >
                            <Layers className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleReveal(folder.path)}
                            className="p-1 rounded-lg border border-slate-900 bg-white hover:bg-amber-300 shadow-comic-sm text-slate-900 transition-colors"
                            title="Reveal in native file explorer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Comic Pagination Bar */}
        <div className="p-3 border-t-2 border-slate-900 bg-amber-50 flex items-center justify-between text-xs font-fredoka font-bold text-slate-700">
          <span>
            Showing {(page - 1) * pageSize + 1}–
            {Math.min(page * pageSize, currentList.length)} of {currentList.length} items
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1 rounded-lg border-2 border-slate-900 bg-white hover:bg-amber-300 font-comic uppercase shadow-comic-sm disabled:opacity-40 transition-colors"
            >
              Prev
            </button>
            <span className="font-comic text-slate-900 px-2">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1 rounded-lg border-2 border-slate-900 bg-white hover:bg-amber-300 font-comic uppercase shadow-comic-sm disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
