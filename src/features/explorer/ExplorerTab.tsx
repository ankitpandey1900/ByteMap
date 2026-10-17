import React, { useState, useMemo } from 'react';
import {
  Folder,
  FileText,
  Search,
  ExternalLink,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatBytes, formatDate, getCategoryBadgeClass } from '@/lib/utils';
import { api } from '@/lib/api';

type SortColumn = 'name' | 'size' | 'category' | 'date';

export const ExplorerTab: React.FC = () => {
  const { scanSummary, settings } = useAppStore();
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

  const handleSort = (col: SortColumn) => {
    if (sortCol === col) {
      setSortDesc(!sortDesc);
    } else {
      setSortCol(col);
      setSortDesc(true);
    }
    setPage(1);
  };

  // Combine folders and files for exploration
  const filteredItems = useMemo(() => {
    if (!scanSummary) return [];

    const files = scanSummary.largest_files;
    let result = files.filter((f) => {
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

    result.sort((a, b) => {
      let cmp = 0;
      if (sortCol === 'size') cmp = b.size_bytes - a.size_bytes;
      else if (sortCol === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortCol === 'category') cmp = a.category.localeCompare(b.category);
      else if (sortCol === 'date') cmp = (b.modified_at || 0) - (a.modified_at || 0);

      return sortDesc ? cmp : -cmp;
    });

    return result;
  }, [scanSummary, searchTerm, categoryFilter, sortCol, sortDesc]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const paginatedItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);

  if (!scanSummary) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
        <Folder className="w-16 h-16 mb-4 text-muted/50 stroke-[1.2]" />
        <h3 className="text-lg font-medium text-foreground mb-1">Explorer is empty</h3>
        <p className="text-sm max-w-sm">
          Run a scan on any drive or directory to browse files, sizes, and metadata.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 flex flex-col h-full max-w-6xl">
      {/* Search and Filters toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-card/60 backdrop-blur border border-border/50 rounded-xl">
        <div className="flex items-center space-x-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search file names or paths..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 bg-background border border-border/60 rounded-lg text-xs text-foreground focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 bg-background border border-border/60 rounded-lg text-xs text-foreground focus:outline-none focus:border-primary"
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

          <span className="text-xs text-muted-foreground font-mono">
            {filteredItems.length} items
          </span>
        </div>
      </div>

      {/* Explorer Table */}
      <div className="flex-1 bg-card/40 rounded-xl border border-border/50 overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border/50 bg-secondary/30 text-muted-foreground font-medium select-none">
                <th
                  onClick={() => handleSort('name')}
                  className="py-2.5 px-4 cursor-pointer hover:text-foreground"
                >
                  <div className="flex items-center space-x-1">
                    <span>Name</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('size')}
                  className="py-2.5 px-4 cursor-pointer hover:text-foreground text-right w-28"
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Size</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('category')}
                  className="py-2.5 px-4 cursor-pointer hover:text-foreground w-28"
                >
                  <div className="flex items-center space-x-1">
                    <span>Category</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('date')}
                  className="py-2.5 px-4 cursor-pointer hover:text-foreground w-36"
                >
                  <div className="flex items-center space-x-1">
                    <span>Modified</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-2.5 px-3 text-center w-16">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {paginatedItems.map((file) => (
                <tr
                  key={file.id}
                  className="hover:bg-accent/40 transition-colors group"
                >
                  <td className="py-2.5 px-4 max-w-md">
                    <div className="flex items-center space-x-2.5 truncate">
                      <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="truncate">
                        <p className="font-medium text-foreground truncate">{file.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate font-mono">
                          {file.path}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-medium text-foreground whitespace-nowrap">
                    {formatBytes(file.size_bytes, settings.unit)}
                  </td>
                  <td className="py-2.5 px-4 whitespace-nowrap">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium border capitalize ${getCategoryBadgeClass(
                        file.category
                      )}`}
                    >
                      {file.category}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-muted-foreground whitespace-nowrap text-[11px] font-mono">
                    {formatDate(file.modified_at)}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => handleReveal(file.path)}
                      className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                      title="Reveal in native file explorer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 border-t border-border/50 bg-secondary/20 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Showing {(page - 1) * pageSize + 1}–
            {Math.min(page * pageSize, filteredItems.length)} of {filteredItems.length}
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-2.5 py-1 rounded border border-border/50 disabled:opacity-40 hover:bg-accent transition-colors"
            >
              Previous
            </button>
            <span className="font-mono text-foreground">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-2.5 py-1 rounded border border-border/50 disabled:opacity-40 hover:bg-accent transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
