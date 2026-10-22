import React, { useState, useEffect, useMemo } from 'react';
import {
  History,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  X,
  Camera,
  Folder,
  CheckCircle2,
  Calendar,
  ArrowRight,
  LineChart as LineChartIcon,
  BarChart3,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Cell,
} from 'recharts';
import { ScanSummary } from '@/types';
import { formatBytes, cleanDisplayPath } from '@/lib/utils';
import { CategoryIcon } from './CategoryIcon';
import {
  StorageSnapshot,
  getSavedSnapshots,
  saveSnapshotFromScan,
  deleteSnapshot,
  computeStorageDiff,
  computeSnapshotToSnapshotDiff,
  filterSnapshotsByDate,
  StorageDiffResult,
} from '@/lib/snapshots';

interface StorageDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  scanSummary: ScanSummary;
  unit: 'binary' | 'decimal';
}

type DatePreset = 'all' | 'today' | '7d' | '30d' | 'custom';

const toDateInputValue = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const StorageDiffModal: React.FC<StorageDiffModalProps> = ({
  isOpen,
  onClose,
  scanSummary,
  unit,
}) => {
  const [snapshots, setSnapshots] = useState<StorageSnapshot[]>([]);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>('');
  const [targetSnapshotId, setTargetSnapshotId] = useState<string>('');
  const [compareMode, setCompareMode] = useState<'live' | 'snapshot'>('live');

  // Chart Visibility Toggles
  const [showTimelineChart, setShowTimelineChart] = useState<boolean>(true);
  const [showDeltaChart, setShowDeltaChart] = useState<boolean>(true);

  // Date Filter State
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  const [newSnapshotName, setNewSnapshotName] = useState<string>('');
  const [showNameInput, setShowNameInput] = useState<boolean>(false);
  const [diffResult, setDiffResult] = useState<StorageDiffResult | null>(null);
  const [justSavedNotice, setJustSavedNotice] = useState<string | null>(null);

  const refreshSnapshots = () => {
    const list = getSavedSnapshots();
    setSnapshots(list);
    if (list.length > 0 && !selectedSnapshotId) {
      setSelectedSnapshotId(list[0].id);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshSnapshots();
    }
  }, [isOpen]);

  // Filter snapshots based on selected date range
  const filteredSnapshots = useMemo(() => {
    return filterSnapshotsByDate(snapshots, fromDate, toDate);
  }, [snapshots, fromDate, toDate]);

  // Ensure selectedSnapshotId stays valid within filtered list
  useEffect(() => {
    if (filteredSnapshots.length > 0) {
      const exists = filteredSnapshots.some((s) => s.id === selectedSnapshotId);
      if (!exists) {
        setSelectedSnapshotId(filteredSnapshots[0].id);
      }
    } else {
      setSelectedSnapshotId('');
    }
  }, [filteredSnapshots, selectedSnapshotId]);

  // Handle Date Presets
  const handleSelectPreset = (preset: DatePreset) => {
    setDatePreset(preset);
    const today = new Date();
    const todayStr = toDateInputValue(today);

    if (preset === 'all') {
      setFromDate('');
      setToDate('');
    } else if (preset === 'today') {
      setFromDate(todayStr);
      setToDate(todayStr);
    } else if (preset === '7d') {
      const past = new Date();
      past.setDate(past.getDate() - 7);
      setFromDate(toDateInputValue(past));
      setToDate(todayStr);
    } else if (preset === '30d') {
      const past = new Date();
      past.setDate(past.getDate() - 30);
      setFromDate(toDateInputValue(past));
      setToDate(todayStr);
    }
  };

  const handleCustomDateChange = (newFrom: string, newTo: string) => {
    setFromDate(newFrom);
    setToDate(newTo);
    setDatePreset('custom');
  };

  // Compute Diff whenever selection, mode, or scanSummary changes
  useEffect(() => {
    if (compareMode === 'live') {
      if (snapshots.length > 0 && selectedSnapshotId) {
        const snap = snapshots.find((s) => s.id === selectedSnapshotId);
        if (snap) {
          setDiffResult(computeStorageDiff(scanSummary, snap));
        } else {
          setDiffResult(null);
        }
      } else {
        setDiffResult(null);
      }
    } else {
      // compareMode === 'snapshot'
      if (selectedSnapshotId && targetSnapshotId && selectedSnapshotId !== targetSnapshotId) {
        const snapA = snapshots.find((s) => s.id === selectedSnapshotId);
        const snapB = snapshots.find((s) => s.id === targetSnapshotId);
        if (snapA && snapB) {
          const timeA = new Date(snapA.timestamp).getTime();
          const timeB = new Date(snapB.timestamp).getTime();
          const older = timeA <= timeB ? snapA : snapB;
          const newer = timeA <= timeB ? snapB : snapA;
          setDiffResult(computeSnapshotToSnapshotDiff(older, newer));
        } else {
          setDiffResult(null);
        }
      } else {
        setDiffResult(null);
      }
    }
  }, [compareMode, snapshots, selectedSnapshotId, targetSnapshotId, scanSummary]);

  // Chronological Timeline Data for Area Chart
  const timelineData = useMemo(() => {
    if (filteredSnapshots.length === 0) return [];
    const sorted = [...filteredSnapshots].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    return sorted.map((s) => {
      const d = new Date(s.timestamp);
      const label = isNaN(d.getTime())
        ? s.name
        : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      return {
        id: s.id,
        name: s.name,
        dateLabel: s.dateLabel || label,
        shortDate: label,
        sizeBytes: s.total_bytes,
        sizeGB: Number((s.total_bytes / (1024 * 1024 * 1024)).toFixed(2)),
        fileCount: s.total_files,
        isSelected: s.id === selectedSnapshotId,
      };
    });
  }, [filteredSnapshots, selectedSnapshotId]);

  // Diverging Category Delta Data for Bar Chart
  const categoryDeltaData = useMemo(() => {
    if (!diffResult) return [];
    return diffResult.category_diffs
      .filter((c) => Math.abs(c.delta_bytes) > 512 * 1024) // > 0.5 MB
      .map((c) => ({
        category: c.category.toUpperCase(),
        deltaMB: Number((c.delta_bytes / (1024 * 1024)).toFixed(1)),
        deltaGB: Number((c.delta_bytes / (1024 * 1024 * 1024)).toFixed(2)),
        rawBytes: c.delta_bytes,
        isPositive: c.delta_bytes > 0,
      }))
      .slice(0, 8);
  }, [diffResult]);

  if (!isOpen) return null;

  const handleCreateSnapshot = () => {
    const name = newSnapshotName.trim() || undefined;
    const created = saveSnapshotFromScan(scanSummary, name);
    setNewSnapshotName('');
    setShowNameInput(false);
    refreshSnapshots();
    setSelectedSnapshotId(created.id);
    setJustSavedNotice(`Baseline snapshot "${created.name}" saved!`);
    setTimeout(() => setJustSavedNotice(null), 3500);
  };

  const handleDeleteSnapshot = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteSnapshot(id);
    const updated = snapshots.filter((s) => s.id !== id);
    setSnapshots(updated);
    if (selectedSnapshotId === id) {
      setSelectedSnapshotId(updated[0]?.id || '');
    }
    if (targetSnapshotId === id) {
      setTargetSnapshotId('');
    }
  };

  const isNetExpansion = diffResult ? diffResult.delta_bytes > 0 : false;
  const isNetReduction = diffResult ? diffResult.delta_bytes < 0 : false;

  const selectedSnapObj = snapshots.find((s) => s.id === selectedSnapshotId);
  const targetSnapObj = snapshots.find((s) => s.id === targetSnapshotId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-xs font-sans">
      <div className="bg-white border-3 border-slate-900 rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-comic-xl flex flex-col max-h-[94vh] overflow-hidden text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b-2.5 border-slate-900 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-400 border-2.5 border-slate-900 shadow-comic flex items-center justify-center shrink-0">
              <History className="w-6 h-6 text-slate-900" />
            </div>
            <div>
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-lg bg-amber-300 border border-slate-900 text-[10px] font-comic uppercase tracking-wider text-slate-900">
                <Camera className="w-3 h-3" />
                <span>Time Machine • Storage Evolution</span>
              </div>
              <h2 className="font-bangers text-xl sm:text-2xl uppercase tracking-wider text-slate-900 leading-tight">
                Where Did My Space Go?
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl border-2 border-slate-900 bg-slate-100 hover:bg-rose-100 hover:text-rose-600 transition-colors shadow-comic-sm cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5 text-slate-900" />
          </button>
        </div>

        {/* Notice toast */}
        {justSavedNotice && (
          <div className="mt-2.5 p-2.5 bg-emerald-100 border-2 border-slate-900 rounded-xl shadow-comic-sm flex items-center space-x-2 text-xs font-fredoka font-bold text-emerald-900 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{justSavedNotice}</span>
          </div>
        )}

        {/* Date Filter & Range Controls */}
        {snapshots.length > 0 && (
          <div className="mt-3 py-2 px-3 bg-slate-50 border-2 border-slate-900 rounded-2xl shadow-comic-sm flex flex-wrap items-center justify-between gap-2.5 shrink-0">
            {/* Presets */}
            <div className="flex items-center flex-wrap gap-1.5">
              <span className="font-bangers tracking-wider uppercase text-slate-800 flex items-center gap-1 text-xs mr-1">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                Filter Dates:
              </span>
              {(['all', 'today', '7d', '30d'] as const).map((preset) => {
                const labels: Record<typeof preset, string> = {
                  all: 'All Time',
                  today: 'Today',
                  '7d': 'Last 7 Days',
                  '30d': 'Last 30 Days',
                };
                const isActive = datePreset === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`px-2.5 py-1 rounded-lg border-1.5 border-slate-900 font-comic uppercase tracking-wider text-[11px] transition-all cursor-pointer ${
                      isActive
                        ? 'bg-amber-400 font-bold text-slate-900 shadow-comic-sm -translate-y-0.5'
                        : 'bg-white hover:bg-amber-100 text-slate-700'
                    }`}
                  >
                    {labels[preset]}
                  </button>
                );
              })}
            </div>

            {/* From - To Date Pickers */}
            <div className="flex items-center flex-wrap gap-1.5 text-xs">
              <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border-1.5 border-slate-900 shadow-comic-sm">
                <span className="text-[10px] font-comic uppercase text-slate-500">From</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => handleCustomDateChange(e.target.value, toDate)}
                  className="text-xs font-mono font-semibold text-slate-900 bg-transparent outline-none cursor-pointer"
                  title="Filter snapshots from this date"
                />
              </div>
              <span className="text-slate-400 font-bold">&rarr;</span>
              <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border-1.5 border-slate-900 shadow-comic-sm">
                <span className="text-[10px] font-comic uppercase text-slate-500">To</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => handleCustomDateChange(fromDate, e.target.value)}
                  className="text-xs font-mono font-semibold text-slate-900 bg-transparent outline-none cursor-pointer"
                  title="Filter snapshots to this date"
                />
              </div>

              {(fromDate || toDate) && (
                <button
                  type="button"
                  onClick={() => handleSelectPreset('all')}
                  className="p-1 rounded-lg border border-slate-900 bg-rose-100 hover:bg-rose-200 text-rose-700 transition-colors cursor-pointer"
                  title="Clear date filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              <span className="text-[10px] font-fredoka font-semibold text-slate-500 ml-1">
                ({filteredSnapshots.length} of {snapshots.length})
              </span>
            </div>
          </div>
        )}

        {/* GRAPH 1: Interactive Storage Evolution Timeline Chart */}
        {timelineData.length >= 2 && (
          <div className="mt-2.5 p-3 bg-amber-50/70 border-2 border-slate-900 rounded-2xl shadow-comic-sm shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-1.5 text-xs font-bangers uppercase tracking-wider text-slate-800">
                <LineChartIcon className="w-4 h-4 text-amber-500" />
                <span>Storage Timeline Evolution ({timelineData.length} checkpoints)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowTimelineChart(!showTimelineChart)}
                className="text-[10px] font-comic uppercase text-slate-600 hover:text-slate-900 flex items-center space-x-1 cursor-pointer"
              >
                <span>{showTimelineChart ? 'Collapse Chart' : 'Expand Chart'}</span>
                {showTimelineChart ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {showTimelineChart && (
              <div className="h-28 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="snapshotGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.65} />
                        <stop offset="95%" stopColor="#fef08a" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="shortDate"
                      tick={{ fill: '#0f172a', fontSize: 10, fontWeight: 'bold' }}
                      axisLine={{ stroke: '#0f172a', strokeWidth: 1.5 }}
                      tickLine={{ stroke: '#0f172a' }}
                    />
                    <YAxis
                      tick={{ fill: '#0f172a', fontSize: 10, fontWeight: 'bold' }}
                      axisLine={{ stroke: '#0f172a', strokeWidth: 1.5 }}
                      tickLine={{ stroke: '#0f172a' }}
                      unit=" GB"
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="p-2 bg-yellow-50 border-2 border-slate-900 rounded-xl shadow-comic text-xs font-fredoka font-bold text-slate-900">
                              <p className="font-comic uppercase text-[11px] text-amber-700">{data.name}</p>
                              <p className="text-[10px] text-slate-500">{data.dateLabel}</p>
                              <p className="font-mono text-sm mt-0.5 text-slate-900">
                                {formatBytes(data.sizeBytes, unit)}
                              </p>
                              <p className="text-[10px] text-slate-600">Click point to select</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="sizeGB"
                      stroke="#0f172a"
                      strokeWidth={2.5}
                      fill="url(#snapshotGrad)"
                      activeDot={{
                        r: 6,
                        fill: '#f59e0b',
                        stroke: '#0f172a',
                        strokeWidth: 2,
                        onClick: (_, event) => {
                          const snapId = (event as unknown as { payload?: { id?: string } })?.payload?.id;
                          if (snapId) setSelectedSnapshotId(snapId);
                        },
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Snapshot Selector Bar & Action Button */}
        <div className="py-2.5 border-b-2 border-slate-200 shrink-0 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center flex-wrap gap-2">
              <span className="font-comic text-xs uppercase tracking-wide text-slate-700 font-bold shrink-0">
                Compare Baseline:
              </span>

              {/* Mode Toggle when 2+ snapshots exist */}
              {snapshots.length >= 2 && (
                <div className="inline-flex rounded-lg border border-slate-900 bg-slate-100 p-0.5 text-[10px] font-comic uppercase">
                  <button
                    type="button"
                    onClick={() => setCompareMode('live')}
                    className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                      compareMode === 'live'
                        ? 'bg-amber-400 font-bold text-slate-900 shadow-comic-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    vs Live Scan
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCompareMode('snapshot');
                      if (!targetSnapshotId && filteredSnapshots.length > 1) {
                        const other = filteredSnapshots.find((s) => s.id !== selectedSnapshotId);
                        if (other) setTargetSnapshotId(other.id);
                      }
                    }}
                    className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                      compareMode === 'snapshot'
                        ? 'bg-sky-400 font-bold text-slate-900 shadow-comic-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Snapshot vs Snapshot
                  </button>
                </div>
              )}
            </div>

            {/* Save Baseline Button */}
            <div>
              {!showNameInput ? (
                <button
                  onClick={() => setShowNameInput(true)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border-2 border-slate-900 bg-sky-400 hover:bg-sky-300 font-comic text-xs uppercase tracking-wide shadow-comic-sm transition-transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Take Snapshot Now</span>
                </button>
              ) : (
                <div className="flex items-center space-x-1.5 flex-wrap">
                  <input
                    type="text"
                    placeholder="Snapshot label..."
                    value={newSnapshotName}
                    onChange={(e) => setNewSnapshotName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateSnapshot()}
                    autoFocus
                    className="px-2.5 py-1 text-xs font-comic border-2 border-slate-900 rounded-xl shadow-comic-sm outline-none focus:bg-amber-50 w-40 sm:w-48"
                  />
                  <button
                    onClick={handleCreateSnapshot}
                    className="px-2.5 py-1 bg-emerald-400 hover:bg-emerald-300 border-2 border-slate-900 rounded-xl font-comic text-xs uppercase shadow-comic-sm cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setShowNameInput(false)}
                    className="px-2 py-1 bg-slate-200 border-2 border-slate-900 rounded-xl font-comic text-xs uppercase shadow-comic-sm cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Snapshot Chips with responsive flex-wrap (NO TRUNCATION!) */}
          <div className="flex flex-wrap items-center gap-2 pt-1 max-h-32 overflow-y-auto">
            {filteredSnapshots.length === 0 ? (
              <div className="text-xs font-fredoka text-slate-500 italic py-1">
                {snapshots.length === 0
                  ? 'No snapshots saved yet. Click "Take Snapshot Now" to create your first baseline!'
                  : 'No snapshots found within this date filter range. Click "All Time" to view all snapshots.'}
              </div>
            ) : (
              filteredSnapshots.map((snap) => {
                const isSelected = snap.id === selectedSnapshotId;
                return (
                  <div
                    key={snap.id}
                    onClick={() => setSelectedSnapshotId(snap.id)}
                    className={`group flex items-center space-x-2 px-3 py-1.5 rounded-xl border-2 border-slate-900 text-xs font-comic tracking-wide cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-amber-400 text-slate-900 shadow-comic -translate-y-0.5 font-bold'
                        : 'bg-white hover:bg-amber-100 text-slate-800 shadow-comic-sm'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                    <span className="whitespace-normal leading-tight font-comic">
                      {snap.name}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-900/10 font-bold border border-slate-900/20 shrink-0">
                      {formatBytes(snap.total_bytes, unit)}
                    </span>
                    <button
                      onClick={(e) => handleDeleteSnapshot(snap.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-rose-600 transition-opacity shrink-0 cursor-pointer"
                      title="Delete this snapshot"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Target Snapshot Row when comparing snapshot vs snapshot */}
          {compareMode === 'snapshot' && filteredSnapshots.length > 1 && (
            <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center gap-2">
              <span className="font-comic text-xs uppercase tracking-wide text-sky-800 shrink-0 font-bold flex items-center gap-1">
                <ArrowRight className="w-3.5 h-3.5 text-sky-600" />
                Target Comparison Snapshot:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {filteredSnapshots
                  .filter((s) => s.id !== selectedSnapshotId)
                  .map((snap) => {
                    const isTarget = snap.id === targetSnapshotId;
                    return (
                      <button
                        key={snap.id}
                        type="button"
                        onClick={() => setTargetSnapshotId(snap.id)}
                        className={`flex items-center space-x-2 px-2.5 py-1 rounded-xl border-1.5 border-slate-900 text-xs font-comic transition-all cursor-pointer ${
                          isTarget
                            ? 'bg-sky-400 text-slate-900 shadow-comic-sm font-bold -translate-y-0.5'
                            : 'bg-white hover:bg-sky-100 text-slate-700'
                        }`}
                      >
                        <span>{snap.name}</span>
                        <span className="text-[10px] font-mono font-bold text-slate-600">
                          ({formatBytes(snap.total_bytes, unit)})
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3.5 pr-1 min-h-0">
          {snapshots.length === 0 ? (
            <div className="p-8 text-center bg-amber-50 rounded-2xl border-2 border-slate-900 shadow-comic space-y-3">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-400 border-2 border-slate-900 shadow-comic flex items-center justify-center">
                <Camera className="w-8 h-8 text-slate-900" />
              </div>
              <h3 className="font-bangers text-xl uppercase tracking-wider text-slate-900">
                Track Space Evolution Over Time
              </h3>
              <p className="text-xs font-fredoka font-semibold text-slate-600 max-w-md mx-auto">
                Save a baseline snapshot now. When you scan again in the future, ByteMap will calculate
                exact byte differences, highlighting swollen folders and newly bloated categories.
              </p>
              <button
                onClick={handleCreateSnapshot}
                className="px-5 py-2.5 rounded-xl border-2.5 border-slate-900 bg-amber-400 hover:bg-amber-300 font-bangers text-sm uppercase tracking-wider shadow-comic transition-transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                Save Current Scan as Baseline
              </button>
            </div>
          ) : diffResult ? (
            <>
              {/* Summary Delta Banner */}
              <div
                className={`p-3.5 rounded-2xl border-2.5 border-slate-900 shadow-comic flex flex-wrap items-center justify-between gap-4 ${
                  isNetExpansion
                    ? 'bg-rose-100'
                    : isNetReduction
                    ? 'bg-emerald-100'
                    : 'bg-slate-100'
                }`}
              >
                <div className="flex items-center space-x-3.5">
                  <div
                    className={`w-12 h-12 rounded-2xl border-2 border-slate-900 shadow-comic flex items-center justify-center shrink-0 ${
                      isNetExpansion
                        ? 'bg-rose-400 text-slate-900'
                        : isNetReduction
                        ? 'bg-emerald-400 text-slate-900'
                        : 'bg-slate-300 text-slate-900'
                    }`}
                  >
                    {isNetExpansion ? (
                      <TrendingUp className="w-7 h-7" />
                    ) : (
                      <TrendingDown className="w-7 h-7" />
                    )}
                  </div>
                  <div>
                    <div className="text-[10px] font-comic uppercase tracking-wider text-slate-600">
                      {compareMode === 'live'
                        ? `Baseline: ${diffResult.snapshot.name} (${diffResult.snapshot.dateLabel}) vs Current Scan`
                        : `Baseline: ${selectedSnapObj?.name} vs Target: ${targetSnapObj?.name}`}
                    </div>
                    <div className="flex items-baseline space-x-2">
                      <span className="font-bangers text-xl sm:text-2xl uppercase tracking-wider text-slate-900">
                        {isNetExpansion
                          ? `Disk Expanded by +${formatBytes(diffResult.delta_bytes, unit)}`
                          : isNetReduction
                          ? `Disk Space Reclaimed: ${formatBytes(Math.abs(diffResult.delta_bytes), unit)} freed`
                          : 'Zero Net Storage Change'}
                      </span>
                    </div>
                    <p className="text-xs font-fredoka font-semibold text-slate-700">
                      {compareMode === 'live'
                        ? `Baseline: ${formatBytes(diffResult.snapshot.total_bytes, unit)} → Current: ${formatBytes(diffResult.current_total_bytes, unit)}`
                        : `Baseline: ${formatBytes(diffResult.snapshot.total_bytes, unit)} → Target: ${formatBytes(diffResult.current_total_bytes, unit)}`}
                    </p>
                  </div>
                </div>

                <div className="px-3.5 py-2 rounded-xl bg-white border-2 border-slate-900 shadow-comic-sm font-comic text-xs uppercase">
                  <span>File Count Delta: </span>
                  <span
                    className={`font-mono font-bold ${
                      diffResult.delta_files > 0
                        ? 'text-rose-600'
                        : diffResult.delta_files < 0
                        ? 'text-emerald-600'
                        : 'text-slate-700'
                    }`}
                  >
                    {diffResult.delta_files > 0 ? `+${diffResult.delta_files}` : diffResult.delta_files}{' '}
                    files
                  </span>
                </div>
              </div>

              {/* GRAPH 2: Category Space Delta Diverging Bar Chart */}
              {categoryDeltaData.length > 0 && (
                <div className="bg-white rounded-2xl border-2 border-slate-900 p-3.5 shadow-comic space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 text-xs font-bangers uppercase tracking-wider text-slate-900">
                      <BarChart3 className="w-4 h-4 text-sky-500" />
                      <span>Category Space Delta Visualizer (Expansion vs Reclaimed)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowDeltaChart(!showDeltaChart)}
                      className="text-[10px] font-comic uppercase text-slate-600 hover:text-slate-900 flex items-center space-x-1 cursor-pointer"
                    >
                      <span>{showDeltaChart ? 'Hide Chart' : 'Show Chart'}</span>
                      {showDeltaChart ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>

                  {showDeltaChart && (
                    <div className="h-40 w-full pt-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={categoryDeltaData}
                          margin={{ top: 10, right: 15, left: -10, bottom: 5 }}
                        >
                          <XAxis
                            dataKey="category"
                            tick={{ fill: '#0f172a', fontSize: 10, fontWeight: 'bold' }}
                            axisLine={{ stroke: '#0f172a', strokeWidth: 1.5 }}
                            tickLine={{ stroke: '#0f172a' }}
                          />
                          <YAxis
                            tick={{ fill: '#0f172a', fontSize: 10, fontWeight: 'bold' }}
                            axisLine={{ stroke: '#0f172a', strokeWidth: 1.5 }}
                            tickLine={{ stroke: '#0f172a' }}
                            unit=" MB"
                          />
                          <ReferenceLine y={0} stroke="#0f172a" strokeWidth={2} />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const d = payload[0].payload;
                                return (
                                  <div className="p-2 bg-yellow-50 border-2 border-slate-900 rounded-xl shadow-comic text-xs font-fredoka font-bold text-slate-900">
                                    <p className="font-comic uppercase text-[11px] text-slate-800">{d.category}</p>
                                    <p
                                      className={`font-mono text-sm mt-0.5 ${
                                        d.isPositive ? 'text-rose-600' : 'text-emerald-600'
                                      }`}
                                    >
                                      {d.isPositive ? '+' : ''}
                                      {formatBytes(d.rawBytes, unit)}
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="deltaMB" stroke="#0f172a" strokeWidth={2} radius={[4, 4, 0, 0]}>
                            {categoryDeltaData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.isPositive ? '#f43f5e' : '#10b981'}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}

              {/* Category Growth Breakdown Cards */}
              <div className="bg-white rounded-2xl border-2 border-slate-900 p-3.5 shadow-comic space-y-2.5">
                <h4 className="font-bangers text-base uppercase tracking-wider text-slate-900">
                  Detailed Category Breakdown
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {diffResult.category_diffs.map((cat) => {
                    const isGrowth = cat.delta_bytes > 0;
                    const isShrink = cat.delta_bytes < 0;
                    return (
                      <div
                        key={cat.category}
                        className="p-2.5 rounded-xl border-1.5 border-slate-900 bg-slate-50 flex items-center justify-between gap-2 shadow-comic-sm"
                      >
                        <div className="flex items-center space-x-2.5 truncate">
                          <CategoryIcon category={cat.category} className="w-5 h-5 shrink-0" />
                          <div className="truncate">
                            <span className="font-comic text-xs uppercase tracking-wide text-slate-900 block truncate font-bold">
                              {cat.category}
                            </span>
                            <span className="text-[10px] font-fredoka text-slate-500">
                              {formatBytes(cat.previous_bytes, unit)} &rarr;{' '}
                              {formatBytes(cat.current_bytes, unit)}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-bold border border-slate-900 ${
                              isGrowth
                                ? 'bg-rose-200 text-rose-900'
                                : isShrink
                                ? 'bg-emerald-200 text-emerald-900'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {isGrowth ? '+' : ''}
                            {formatBytes(cat.delta_bytes, unit)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Folder Diffs Breakdown */}
              {diffResult.folder_diffs.length > 0 && (
                <div className="bg-white rounded-2xl border-2 border-slate-900 p-3.5 shadow-comic space-y-2.5">
                  <h4 className="font-bangers text-base uppercase tracking-wider text-slate-900">
                    Folders with Significant Space Changes (&gt; 5 MB)
                  </h4>
                  <div className="space-y-2">
                    {diffResult.folder_diffs.map((f) => {
                      const isGrowth = f.delta_bytes > 0;
                      return (
                        <div
                          key={f.path}
                          className="p-2.5 rounded-xl border border-slate-900 bg-slate-50 flex items-center justify-between gap-3 text-xs shadow-comic-sm"
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                            <div className="truncate">
                              <span className="font-comic uppercase text-slate-900 truncate block font-bold">
                                {f.name}
                              </span>
                              <span
                                className="font-mono text-[10px] text-slate-500 truncate block"
                                title={cleanDisplayPath(f.path)}
                              >
                                {cleanDisplayPath(f.path)}
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span
                              className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold border border-slate-900 ${
                                isGrowth
                                  ? 'bg-rose-200 text-rose-900'
                                  : 'bg-emerald-200 text-emerald-900'
                              }`}
                            >
                              {isGrowth ? '+' : ''}
                              {formatBytes(f.delta_bytes, unit)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-6 text-center text-slate-500 font-comic text-xs">
              Select a baseline snapshot above to view storage differences.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t-2 border-slate-900 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl border-2 border-slate-900 bg-amber-400 hover:bg-amber-300 font-comic text-xs uppercase tracking-wider shadow-comic cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
