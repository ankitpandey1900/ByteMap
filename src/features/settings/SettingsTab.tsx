import React, { useState } from 'react';
import {
  Settings,
  Moon,
  Sun,
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
    <div className="space-y-6 max-w-4xl pb-10">
      {/* Top Banner */}
      <div className="flex items-center justify-between pb-4 border-b border-border/50">
        <div>
          <h2 className="text-xl font-bold text-foreground">Application Preferences</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure display units, safety policies, scan rules, and export data.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center space-x-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-sm"
        >
          {savedSuccess ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Preferences Saved</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>

      {/* General & Theme Settings */}
      <div className="p-5 bg-card/60 backdrop-blur border border-border/50 rounded-xl space-y-4">
        <h3 className="font-semibold text-sm text-foreground flex items-center space-x-2">
          <Settings className="w-4 h-4 text-primary" />
          <span>Appearance & Units</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Theme Mode */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Theme Mode</label>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => updateSettings({ theme: 'dark' })}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg border text-xs font-medium transition-colors ${
                  settings.theme === 'dark'
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'border-border/60 hover:bg-accent text-muted-foreground'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Dark Mode</span>
              </button>
              <button
                type="button"
                onClick={() => updateSettings({ theme: 'light' })}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg border text-xs font-medium transition-colors ${
                  settings.theme === 'light'
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'border-border/60 hover:bg-accent text-muted-foreground'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Light Mode</span>
              </button>
            </div>
          </div>

          {/* Unit calculation */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Storage Unit Standards
            </label>
            <select
              value={settings.unit}
              onChange={(e) => updateSettings({ unit: e.target.value as 'binary' | 'decimal' })}
              className="w-full px-3 py-2 bg-background border border-border/60 rounded-lg text-xs text-foreground focus:outline-none focus:border-primary"
            >
              <option value="binary">Binary Base 2 (1024 B = 1 KiB, GiB)</option>
              <option value="decimal">Decimal Base 10 (1000 B = 1 KB, GB)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Safety & Cleanup Policy */}
      <div className="p-5 bg-card/60 backdrop-blur border border-border/50 rounded-xl space-y-4">
        <h3 className="font-semibold text-sm text-foreground flex items-center space-x-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>Safety & Deletion Protocols</span>
        </h3>

        <div className="space-y-3 pt-1">
          {/* Prefer trash */}
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.prefer_trash}
              onChange={(e) => updateSettings({ prefer_trash: e.target.checked })}
              className="mt-0.5 rounded border-border text-primary focus:ring-primary"
            />
            <div>
              <p className="text-xs font-medium text-foreground">
                Move cleanup items to OS Recycle Bin / Trash (Recommended)
              </p>
              <p className="text-[11px] text-muted-foreground">
                When enabled, cleaned files are moved to the system Recycle Bin so they can be easily restored if needed.
              </p>
            </div>
          </label>

          {/* Show system files */}
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.show_system_files}
              onChange={(e) => updateSettings({ show_system_files: e.target.checked })}
              className="mt-0.5 rounded border-border text-primary focus:ring-primary"
            />
            <div>
              <p className="text-xs font-medium text-foreground">
                Include Hidden and System files in exploration views
              </p>
              <p className="text-[11px] text-muted-foreground">
                System and hidden files are protected from automated cleanup regardless of this setting.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Exclusion Rules */}
      <div className="p-5 bg-card/60 backdrop-blur border border-border/50 rounded-xl space-y-4">
        <h3 className="font-semibold text-sm text-foreground flex items-center space-x-2">
          <FolderMinus className="w-4 h-4 text-amber-400" />
          <span>Default Scan Exclusions</span>
        </h3>

        <p className="text-xs text-muted-foreground">
          Files and directories matching these name patterns will be skipped during scanning.
        </p>

        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="e.g. .cache or $Recycle.Bin..."
            value={newExcludePattern}
            onChange={(e) => setNewExcludePattern(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddExclude()}
            className="flex-1 px-3 py-1.5 bg-background border border-border/60 rounded-lg text-xs text-foreground focus:outline-none focus:border-primary"
          />
          <button
            onClick={handleAddExclude}
            className="px-3.5 py-1.5 bg-secondary hover:bg-accent text-xs font-medium text-foreground rounded-lg transition-colors"
          >
            Add Pattern
          </button>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {(settings.default_excludes || []).map((pat) => (
            <span
              key={pat}
              className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-secondary text-xs font-mono text-foreground border border-border/50"
            >
              <span>{pat}</span>
              <button
                onClick={() => handleRemoveExclude(pat)}
                className="text-muted-foreground hover:text-destructive"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Data Export & Privacy Notice */}
      <div className="p-5 bg-card/60 backdrop-blur border border-border/50 rounded-xl space-y-4">
        <h3 className="font-semibold text-sm text-foreground flex items-center space-x-2">
          <FileDown className="w-4 h-4 text-cyan-400" />
          <span>Report Export & Strict Local Privacy</span>
        </h3>

        <div className="p-3 bg-secondary/30 rounded-lg border border-border/40 text-xs text-muted-foreground space-y-1.5">
          <div className="flex items-center space-x-2 text-foreground font-semibold">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Strict No-Database & Zero-Telemetry Architecture</span>
          </div>
          <p>
            ByteMap stores all scan data exclusively in volatile system RAM while running. On shutdown,
            all scanned file catalogs and paths are cleared. No local databases, no hidden background
            indexes, and zero external telemetry network requests exist.
          </p>
        </div>

        <div className="flex items-center space-x-3 pt-2">
          <button
            onClick={handleExportJSON}
            disabled={!scanSummary}
            className="flex items-center space-x-2 px-3.5 py-2 border border-border/60 hover:bg-accent rounded-lg text-xs font-medium text-foreground disabled:opacity-40 transition-colors"
          >
            <FileDown className="w-4 h-4 text-primary" />
            <span>Export Report (JSON)</span>
          </button>
          <button
            onClick={handleExportCSV}
            disabled={!scanSummary}
            className="flex items-center space-x-2 px-3.5 py-2 border border-border/60 hover:bg-accent rounded-lg text-xs font-medium text-foreground disabled:opacity-40 transition-colors"
          >
            <FileDown className="w-4 h-4 text-emerald-400" />
            <span>Export Files Table (CSV)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
