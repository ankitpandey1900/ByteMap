import React, { useState } from 'react';
import {
  Settings,
  Shield,
  FileDown,
  Check,
  Save,
  FolderMinus,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';

export const SettingsTab: React.FC = () => {
  const { settings, updateSettings, scanSummary } = useAppStore();
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [newExcludePattern, setNewExcludePattern] = useState('');

  const handleSave = async () => {
    try {
      await api.saveSettings(settings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
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
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(scanSummary, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `bytemap-scan-report-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
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
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', encodeURI(csvContent));
    downloadAnchor.setAttribute('download', `bytemap-files-${Date.now()}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-4 max-w-5xl select-none font-sans text-slate-900 pb-10">
      {/* Top Banner */}
      <div className="p-4 bg-white border-2.5 border-slate-900 rounded-2xl shadow-comic flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-amber-400 border-2 border-slate-900 shadow-comic-sm font-comic text-xs uppercase tracking-wide text-slate-900 mb-1">
            <Settings className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Preferences</span>
          </div>
          <h2 className="font-comic text-xl text-slate-900 uppercase tracking-wider mt-1">
            Configuration & Rules
          </h2>
          <p className="text-xs font-fredoka font-semibold text-slate-600">
            Configure storage unit standards, safety policies, exclusion rules, and data export.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center space-x-1.5 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 font-comic text-xs uppercase tracking-wider text-slate-900 border-2.5 border-slate-900 rounded-xl shadow-comic transition-all hover:-translate-y-0.5 active:translate-y-0.5"
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

      {/* Storage Units */}
      <div className="p-4 bg-white border-2.5 border-slate-900 rounded-2xl shadow-comic space-y-3">
        <h3 className="font-comic text-sm uppercase text-slate-900 flex items-center space-x-2">
          <span>Storage Unit Calculation</span>
        </h3>

        <div className="space-y-1.5">
          <select
            value={settings.unit}
            onChange={(e) => updateSettings({ unit: e.target.value as 'binary' | 'decimal' })}
            className="w-full max-w-md px-3 py-2 bg-slate-50 border-2 border-slate-900 rounded-xl font-comic text-xs uppercase text-slate-900 focus:outline-none"
          >
            <option value="binary">Binary Base 2 (1024 B = 1 KiB, MiB, GiB) - OS Standard</option>
            <option value="decimal">Decimal Base 10 (1000 B = 1 KB, MB, GB) - Drive Label</option>
          </select>
        </div>
      </div>

      {/* Safety & Cleanup Policy */}
      <div className="p-4 bg-white border-2.5 border-slate-900 rounded-2xl shadow-comic space-y-3">
        <h3 className="font-comic text-sm uppercase text-slate-900 flex items-center space-x-2">
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
                Move cleanup items to OS Recycle Bin (Recommended)
              </p>
              <p className="text-[11px] font-fredoka font-semibold text-slate-600">
                Files are safely moved to the Windows Recycle Bin so they can be recovered if needed.
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
          <span>Report Export & Volatile Memory Privacy</span>
        </h3>

        <div className="p-3 bg-amber-50 rounded-xl border-2 border-slate-900 text-xs text-slate-700 font-fredoka font-semibold space-y-1">
          <div className="flex items-center space-x-2 font-comic text-slate-900 uppercase">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>Strict Zero-Database Architecture</span>
          </div>
          <p>
            ByteMap stores all scan data exclusively in volatile system RAM while running. On shutdown,
            all scanned files and paths are wiped. No local SQLite databases, no hidden background indexes,
            and zero external telemetry network requests exist.
          </p>
        </div>

        <div className="flex items-center space-x-3 pt-2">
          <button
            onClick={handleExportJSON}
            disabled={!scanSummary}
            className="flex items-center space-x-2 px-4 py-2 border-2 border-slate-900 bg-white hover:bg-amber-200 font-comic text-xs uppercase text-slate-900 rounded-xl shadow-comic-sm disabled:opacity-40 transition-all"
          >
            <FileDown className="w-4 h-4 text-slate-900" />
            <span>Export Report (JSON)</span>
          </button>
          <button
            onClick={handleExportCSV}
            disabled={!scanSummary}
            className="flex items-center space-x-2 px-4 py-2 border-2 border-slate-900 bg-white hover:bg-amber-200 font-comic text-xs uppercase text-slate-900 rounded-xl shadow-comic-sm disabled:opacity-40 transition-all"
          >
            <FileDown className="w-4 h-4 text-slate-900" />
            <span>Export Table (CSV)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
