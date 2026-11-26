import React, { useState } from 'react';
import {
  Settings,
  Shield,
  FileDown,
  Check,
  Save,
  FolderMinus,
  Globe,
  ExternalLink,
  ZoomIn,
  Sun,
  Moon,
  History,
  Trash2,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import { downloadTextFile } from '@/lib/utils';
import { getSavedSnapshots, clearAllSnapshots } from '@/lib/snapshots';
import packageJson from '../../../package.json';

export const SettingsTab: React.FC = () => {
  const { settings, updateSettings, scanSummary, zoomLevel, setZoomLevel, zoomIn, zoomOut, resetZoom } = useAppStore();
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [newExcludePattern, setNewExcludePattern] = useState('');
  const [snapshotCount, setSnapshotCount] = useState<number>(() => getSavedSnapshots().length);

  const handleSave = async () => {
    try {
      await api.saveSettings(settings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  const handleClearSnapshots = () => {
    clearAllSnapshots();
    setSnapshotCount(0);
  };

  const handleAddExclude = () => {
    if (!newExcludePattern.trim()) return;
    const current = settings.default_excludes || [];
    if (!current.includes(newExcludePattern.trim())) {
      updateSettings({ default_excludes: [...current, newExcludePattern.trim()] });
    }
    setNewExcludePattern('');
  };

  const handleRemoveExclude = (pattern: string) => {
    const current = settings.default_excludes || [];
    updateSettings({
      default_excludes: current.filter((p) => p !== pattern),
    });
  };

  const handleExportJSON = () => {
    if (!scanSummary) return;
    downloadTextFile(
      `bytemap-scan-report-${Date.now()}.json`,
      JSON.stringify(scanSummary, null, 2),
      'application/json;charset=utf-8'
    );
  };

  const handleExportCSV = () => {
    if (!scanSummary) return;
    const rows = [
      ['Name', 'Path', 'Size (Bytes)', 'Category', 'Extension'],
      ...scanSummary.largest_files.map((f) => [
        `"${f.name.replace(/"/g, '""')}"`,
        `"${f.path.replace(/"/g, '""')}"`,
        f.size_bytes.toString(),
        f.category,
        f.extension,
      ]),
    ];
    downloadTextFile(
      `bytemap-files-${Date.now()}.csv`,
      rows.map((e) => e.join(',')).join('\n'),
      'text/csv;charset=utf-8'
    );
  };

  return (
    <div className="space-y-4 w-full max-w-5xl mx-auto font-sans text-slate-900 pb-10">
      {/* Top Banner */}
      <div className="p-4 bg-white border-2.5 border-slate-900 rounded-2xl shadow-comic flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-amber-400 border-2 border-slate-900 shadow-comic-sm font-bangers text-xs uppercase tracking-wider text-slate-900 mb-1">
            <Settings className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Preferences</span>
          </div>
          <h2 className="font-bangers text-2xl text-slate-900 uppercase tracking-wider mt-1">
            Configuration & Rules
          </h2>
          <p className="text-xs font-comicNeue font-bold text-slate-600">
            Configure storage unit standards, safety policies, exclusion rules, and data export.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center space-x-1.5 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 font-bangers text-sm uppercase tracking-wider text-slate-900 border-2.5 border-slate-900 rounded-xl shadow-comic transition-all hover:-translate-y-0.5 active:translate-y-0.5"
        >
          {savedSuccess ? (
            <>
              <Check className="w-4 h-4" />
              <span>Preferences Saved!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Preferences</span>
            </>
          )}
        </button>
      </div>

      {/* Appearance & Theme */}
      <div className="p-4 bg-white border-2.5 border-slate-900 rounded-2xl shadow-comic space-y-3">
        <h3 className="font-bangers text-base uppercase tracking-wider text-slate-900 flex items-center space-x-2">
          <Sun className="w-4 h-4 text-amber-500" />
          <span>Appearance & Theme</span>
        </h3>
        <p className="text-xs font-fredoka font-semibold text-slate-600">
          Light Comic mode is the default. Switch manually to Dark Mode anytime here or from the top bar toggle.
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'light' as const, label: 'Light Comic (Default)', icon: <Sun className="w-3.5 h-3.5" /> },
            { id: 'dark' as const, label: 'Dark Mode', icon: <Moon className="w-3.5 h-3.5" /> },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => updateSettings({ theme: opt.id })}
              className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border-2 border-slate-900 font-comic text-xs uppercase transition-all cursor-pointer ${
                settings.theme === opt.id
                  ? 'bg-amber-400 text-slate-900 shadow-comic -translate-y-0.5 font-bold'
                  : 'bg-white hover:bg-amber-100 text-slate-700 shadow-comic-sm'
              }`}
            >
              {opt.icon}
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Storage Units */}
      <div className="p-4 bg-white border-2.5 border-slate-900 rounded-2xl shadow-comic space-y-3">
        <h3 className="font-bangers text-base uppercase tracking-wider text-slate-900 flex items-center space-x-2">
          <span>Storage Unit Calculation</span>
        </h3>

        <div className="space-y-1.5">
          <select
            value={settings.unit}
            onChange={(e) => updateSettings({ unit: e.target.value as 'binary' | 'decimal' })}
            className="w-full max-w-md px-3 py-2 bg-slate-50 border-2 border-slate-900 rounded-xl font-comicNeue font-bold text-xs uppercase text-slate-900 focus:outline-none"
          >
            <option value="decimal">Decimal Base 10 (1000 B = 1 KB, MB, GB) - Standard</option>
            <option value="binary">Base-1024 (1024 B = 1 KB, MB, GB) - Windows Style</option>
          </select>
        </div>
      </div>

      {/* UI Scale & Zoom Section */}
      <div className="p-4 bg-white border-2.5 border-slate-900 rounded-2xl shadow-comic space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bangers text-base uppercase tracking-wider text-slate-900 flex items-center space-x-2">
            <ZoomIn className="w-4 h-4 text-sky-600" />
            <span>Display Scale & Zoom</span>
          </h3>
          <div className="flex items-center space-x-2">
            <span className="font-mono font-bold text-xs bg-amber-200 px-2.5 py-1 rounded-md border border-slate-900 shadow-comic-sm">
              Current: {zoomLevel}%
            </span>
            {zoomLevel !== 100 && (
              <button
                type="button"
                onClick={resetZoom}
                className="px-2 py-1 bg-white hover:bg-rose-100 border border-slate-900 rounded-md font-comic text-xs uppercase font-bold text-slate-800 transition-all cursor-pointer shadow-comic-sm"
                title="Reset to 100%"
              >
                Reset (100%)
              </button>
            )}
          </div>
        </div>

        <p className="text-xs font-fredoka font-semibold text-slate-600">
          Scale the entire application interface to fit your screen resolution or visual comfort.
        </p>

        <div className="flex items-center gap-2 flex-wrap pt-1">
          <div className="flex items-center space-x-1 border-2 border-slate-900 rounded-xl p-1 bg-slate-50">
            <button
              type="button"
              onClick={zoomOut}
              disabled={zoomLevel <= 75}
              className="w-8 h-8 rounded-lg font-mono font-bold text-sm bg-white border border-slate-900 flex items-center justify-center hover:bg-amber-300 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer shadow-comic-sm"
              title="Zoom Out (Ctrl -)"
            >
              -
            </button>
            <span className="w-16 text-center font-mono font-bold text-xs tabular-nums text-slate-900">
              {zoomLevel}%
            </span>
            <button
              type="button"
              onClick={zoomIn}
              disabled={zoomLevel >= 150}
              className="w-8 h-8 rounded-lg font-mono font-bold text-sm bg-white border border-slate-900 flex items-center justify-center hover:bg-amber-300 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer shadow-comic-sm"
              title="Zoom In (Ctrl +)"
            >
              +
            </button>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {[75, 80, 90, 100, 110, 125, 150].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setZoomLevel(preset)}
                className={`px-2.5 py-1.5 rounded-xl border-2 border-slate-900 font-mono text-xs font-bold transition-all cursor-pointer ${
                  zoomLevel === preset
                    ? 'bg-amber-400 text-slate-900 shadow-comic -translate-y-0.5'
                    : 'bg-white hover:bg-amber-100 text-slate-700 shadow-comic-sm'
                }`}
              >
                {preset}%{preset === 100 ? ' (Default)' : ''}
              </button>
            ))}
          </div>
        </div>

        <div className="p-2.5 bg-sky-50 border-1.5 border-slate-900 rounded-xl text-[11px] font-fredoka font-semibold text-slate-700 flex items-center space-x-2">
          <span>💡</span>
          <span>
            Shortcut tip: You can press <kbd className="px-1.5 py-0.5 bg-white border border-slate-900 rounded font-mono text-[10px] font-bold">Ctrl +</kbd> to zoom in, <kbd className="px-1.5 py-0.5 bg-white border border-slate-900 rounded font-mono text-[10px] font-bold">Ctrl -</kbd> to zoom out, or <kbd className="px-1.5 py-0.5 bg-white border border-slate-900 rounded font-mono text-[10px] font-bold">Ctrl 0</kbd> to reset anywhere in ByteMap!
          </span>
        </div>
      </div>

      {/* Safety & Cleanup Policy */}
      <div className="p-4 bg-white border-2.5 border-slate-900 rounded-2xl shadow-comic space-y-3">
        <h3 className="font-bangers text-base uppercase tracking-wider text-slate-900 flex items-center space-x-2">
          <Shield className="w-4 h-4 text-emerald-600" />
          <span>Safety & Deletion Protocols</span>
        </h3>

        <div className="space-y-3 pt-1">
          {/* Prefer trash */}
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.prefer_trash}
              onChange={(e) => updateSettings({ prefer_trash: e.target.checked })}
              className="mt-0.5 w-4 h-4 rounded border-2 border-slate-900 text-blue-600 accent-blue-600 focus:ring-0 cursor-pointer"
            />
            <div>
              <p className="font-comic text-xs uppercase text-slate-900">
                Move cleanup items to OS Recycle Bin / macOS Trash (Recommended)
              </p>
              <p className="text-[11px] font-fredoka font-semibold text-slate-600">
                Files are safely moved to the OS Recycle Bin / macOS Trash so they can be easily restored if needed.
              </p>
            </div>
          </label>

          {/* Show system files */}
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.show_system_files}
              onChange={(e) => updateSettings({ show_system_files: e.target.checked })}
              className="mt-0.5 w-4 h-4 rounded border-2 border-slate-900 text-blue-600 accent-blue-600 focus:ring-0 cursor-pointer"
            />
            <div>
              <p className="font-comic text-xs uppercase text-slate-900">
                Include Hidden and System files in exploration views
              </p>
              <p className="text-[11px] font-fredoka font-semibold text-slate-600">
                System and hidden files are protected from automated cleanup regardless of this setting.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Exclusion Rules */}
      <div className="p-4 bg-white border-2.5 border-slate-900 rounded-2xl shadow-comic space-y-3">
        <h3 className="font-comic text-sm uppercase text-slate-900 flex items-center space-x-2">
          <FolderMinus className="w-4 h-4 text-amber-500" />
          <span>Default Scan Exclusions</span>
        </h3>

        <p className="text-xs font-fredoka font-semibold text-slate-600">
          Files and directories matching these name patterns will be skipped during scanning.
        </p>

        <div className="flex items-center space-x-2 max-w-lg">
          <input
            type="text"
            placeholder="e.g. .cache or node_modules..."
            value={newExcludePattern}
            onChange={(e) => setNewExcludePattern(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddExclude()}
            className="flex-1 px-3 py-2 bg-slate-50 border-2 border-slate-900 rounded-xl text-xs font-mono text-slate-900 focus:outline-none"
          />
          <button
            onClick={handleAddExclude}
            className="px-4 py-2 bg-amber-300 hover:bg-amber-400 font-comic text-xs uppercase text-slate-900 border-2 border-slate-900 rounded-xl shadow-comic-sm transition-all"
          >
            Add Pattern
          </button>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {(settings.default_excludes || []).map((pat) => (
            <span
              key={pat}
              className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-amber-100 text-xs font-mono font-bold text-slate-900 border-2 border-slate-900 shadow-comic-sm"
            >
              <span>{pat}</span>
              <button
                onClick={() => handleRemoveExclude(pat)}
                className="text-slate-500 hover:text-rose-600 font-bold ml-1"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Data Export & Privacy Notice */}
      <div className="p-4 bg-white border-2.5 border-slate-900 rounded-2xl shadow-comic space-y-3">
        <h3 className="font-comic text-sm uppercase text-slate-900 flex items-center space-x-2">
          <FileDown className="w-4 h-4 text-blue-600" />
          <span>Report Export, Time Machine & Privacy</span>
        </h3>

        <div className="p-3 bg-amber-50 rounded-xl border-2 border-slate-900 text-xs text-slate-700 font-fredoka font-semibold space-y-1">
          <div className="flex items-center space-x-2 font-comic text-slate-900 uppercase">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>Volatile Scan Index + Local-Only Snapshots</span>
          </div>
          <p>
            ByteMap keeps the full scan index strictly in volatile RAM and wipes it when you close the window—no
            SQLite database and zero outbound telemetry. Only lightweight Time Machine summary snapshots you choose
            to save (and preferences) are stored locally on your device.
          </p>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border-2 border-slate-900 flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-start space-x-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(settings.auto_save_snapshot)}
              onChange={(e) => updateSettings({ auto_save_snapshot: e.target.checked })}
              className="mt-0.5 w-4 h-4 rounded border-2 border-slate-900 text-blue-600 accent-blue-600 focus:ring-0 cursor-pointer"
            />
            <div>
              <p className="font-comic text-xs uppercase text-slate-900 flex items-center space-x-1.5">
                <History className="w-3.5 h-3.5 text-amber-600" />
                <span>Auto-save Time Machine snapshot after each scan</span>
              </p>
              <p className="text-[11px] font-fredoka font-semibold text-slate-600">
                Builds real Burn Velocity trends automatically without extra clicks ({snapshotCount} saved locally).
              </p>
            </div>
          </label>

          <button
            type="button"
            onClick={handleClearSnapshots}
            disabled={snapshotCount === 0}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border-2 border-slate-900 bg-rose-100 hover:bg-rose-500 hover:text-white text-rose-800 font-comic text-xs uppercase shadow-comic-sm disabled:opacity-40 transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Snapshots ({snapshotCount})</span>
          </button>
        </div>

        <div className="flex items-center space-x-3 pt-1">
          <button
            type="button"
            onClick={handleExportJSON}
            disabled={!scanSummary}
            className="flex items-center space-x-2 px-4 py-2 border-2 border-slate-900 bg-white hover:bg-amber-200 font-comic text-xs uppercase text-slate-900 rounded-xl shadow-comic-sm disabled:opacity-40 transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            <FileDown className="w-4 h-4 text-slate-900" />
            <span>Export Report (JSON)</span>
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={!scanSummary}
            className="flex items-center space-x-2 px-4 py-2 border-2 border-slate-900 bg-white hover:bg-amber-200 font-comic text-xs uppercase text-slate-900 rounded-xl shadow-comic-sm disabled:opacity-40 transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            <FileDown className="w-4 h-4 text-slate-900" />
            <span>Export Table (CSV)</span>
          </button>
        </div>
      </div>

      {/* Creator & Application Credits */}
      <div className="p-4 bg-white border-2.5 border-slate-900 rounded-2xl shadow-comic space-y-3 relative overflow-hidden">
        <div className="absolute inset-0 bg-comic-dots opacity-[0.06] pointer-events-none rounded-2xl" />

        <div className="relative flex items-center justify-between flex-wrap gap-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-amber-400 border-2 border-slate-900 shadow-comic-sm font-bangers text-xs uppercase tracking-wider text-slate-900">
            <span>Author & Credits 🧭</span>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500">
            ByteMap v{packageJson.version} • MIT License
          </span>
        </div>

        <div className="relative flex items-center sm:items-start space-x-4 p-4 bg-amber-50 rounded-2xl border-2.5 border-slate-900 shadow-comic-sm flex-col sm:flex-row gap-y-3">
          <div className="w-20 h-20 rounded-2xl bg-amber-300 border-2.5 border-slate-900 overflow-hidden shrink-0 shadow-comic relative group">
            <img
              src="/ankit.jpg"
              alt="Ankit Pandey"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          </div>
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <div className="flex items-center space-x-2 flex-wrap gap-1 justify-center sm:justify-start">
              <h4 className="font-bangers text-2xl text-slate-900 uppercase tracking-wide">
                Ankit Pandey
              </h4>
              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-400 border-2 border-slate-900 font-bangers text-xs uppercase tracking-wider text-slate-900 shadow-comic-sm">
                Creator & Lead Architect
              </span>
            </div>
            <p className="text-sm font-comicNeue font-bold text-slate-800 mt-1 italic">
              "I build products. Life? Still in debugging mode."
            </p>
            <div className="flex items-center space-x-3 text-xs font-mono text-slate-700 mt-1.5 flex-wrap gap-1 justify-center sm:justify-start">
              <span className="font-bold">ankit1pandey11@gmail.com</span>
              <span>•</span>
              <span>GitHub: @ankitpandey1900</span>
            </div>
            <div className="mt-3 flex items-center space-x-2 flex-wrap gap-2 justify-center sm:justify-start">
              <button
                type="button"
                onClick={() => api.openExternalUrl('https://bytemap.alltracker.online/')}
                className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 border-2 border-slate-900 font-comic font-bold text-xs uppercase shadow-comic-sm hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer group"
              >
                <Globe className="w-4 h-4 text-slate-900 group-hover:rotate-12 transition-transform" />
                <span>Website (bytemap.alltracker.online)</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-900" />
              </button>
              <button
                type="button"
                onClick={() => api.openExternalUrl('https://ankitpandey19.vercel.app/')}
                className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-900 border-2 border-slate-900 font-comic font-bold text-xs uppercase shadow-comic-sm hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer group"
              >
                <span>Portfolio</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-900" />
              </button>
              <button
                type="button"
                onClick={() => api.openExternalUrl('https://github.com/ankitpandey1900')}
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white hover:bg-amber-100 text-slate-900 border-2 border-slate-900 font-comic font-bold text-xs uppercase shadow-comic-sm hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
              >
                <span>GitHub</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-900" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
