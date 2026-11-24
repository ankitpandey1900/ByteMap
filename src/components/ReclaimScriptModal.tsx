import React, { useState } from 'react';
import { Terminal, Copy, Check, Download, X, Sparkles } from 'lucide-react';
import { formatBytes } from '@/lib/utils';

interface ReclaimScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  targets: Array<{ path: string; size_bytes?: number }>;
  totalBytes: number;
  unit: 'binary' | 'decimal';
}

export const ReclaimScriptModal: React.FC<ReclaimScriptModalProps> = ({
  isOpen,
  onClose,
  targets,
  totalBytes,
  unit,
}) => {
  const [shellType, setShellType] = useState<'powershell' | 'bash'>('powershell');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const count = targets.length;
  const formattedSize = formatBytes(totalBytes, unit);
  const dateStr = new Date().toLocaleString();

  const generateScript = () => {
    if (shellType === 'powershell') {
      const paths = targets
        .map((t) => `    "${t.path.replace(/`/g, '``').replace(/"/g, '`"')}"`)
        .join(',\n');

      return `# ========================================================
# ByteMap Storage Intelligence — Safe Cleanup Script
# Generated: ${dateStr}
# Target Items: ${count}
# Estimated Space Recovery: ${formattedSize}
# ========================================================

Write-Host "ByteMap: Starting cleanup of ${count} items (${formattedSize})..." -ForegroundColor Cyan

$targets = @(
${paths}
)

$reclaimed = 0
foreach ($item in $targets) {
    if (Test-Path -LiteralPath $item) {
        try {
            Write-Host "Purging: $item" -ForegroundColor Gray
            Remove-Item -LiteralPath $item -Recurse -Force -ErrorAction Stop
            $reclaimed++
        } catch {
            Write-Warning "Could not delete $item (File locked or in use)"
        }
    }
}

Write-Host "ByteMap: Done! Cleaned $reclaimed of ${count} targets." -ForegroundColor Green
`;
    } else {
      const paths = targets
        .map((t) => `  "${t.path.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`)
        .join(' \\\n');

      return `#!/usr/bin/env bash
# ========================================================
# ByteMap Storage Intelligence — Safe Cleanup Script
# Generated: ${dateStr}
# Target Items: ${count}
# Estimated Space Recovery: ${formattedSize}
# ========================================================

echo "ByteMap: Starting cleanup of ${count} items (${formattedSize})..."

rm -rf \\
${paths}

echo "ByteMap: Done! Cleaned ${count} targets."
`;
    }
  };

  const scriptContent = generateScript();

  const handleCopy = () => {
    navigator.clipboard?.writeText(scriptContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = shellType === 'powershell' ? 'ps1' : 'sh';
    const blob = new Blob([scriptContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bytemap-reclaim-${Date.now()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70">
      <div className="relative w-full max-w-2xl bg-white border-4 border-slate-900 rounded-3xl shadow-[8px_8px_0px_#0f172a] p-6 text-slate-900 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b-2.5 border-slate-900 mb-4 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-amber-400 border-2.5 border-slate-900 rounded-2xl flex items-center justify-center shadow-comic-sm shrink-0">
              <Terminal className="w-6 h-6 text-slate-900" />
            </div>
            <div>
              <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md bg-sky-300 border border-slate-900 text-[10px] font-comic uppercase text-slate-900 mb-1">
                <Sparkles className="w-3 h-3 text-slate-900" />
                <span>What-If Sandbox Script Generator</span>
              </div>
              <h3 className="font-bangers text-2xl text-slate-900 uppercase tracking-wide leading-none">
                Export Audit Shell Script
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-xl border border-slate-900 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer shadow-xs"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info callout */}
        <div className="p-3 bg-amber-50 border-2 border-slate-900 rounded-xl text-xs font-comicNeue text-slate-700 leading-relaxed mb-4 shrink-0 flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="font-bold text-slate-900 block">
              💻 For Developers, Sysadmins, and Scripting:
            </span>
            <span>
              Prefer running the cleanup via terminal instead of GUI? Review and copy the generated script below.
            </span>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[10px] font-comic uppercase text-slate-500 block">Staged Space</span>
            <span className="font-mono font-bold text-sm text-emerald-600 block">{formattedSize}</span>
          </div>
        </div>

        {/* Shell Type Toggle */}
        <div className="flex items-center justify-between mb-3 shrink-0">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShellType('powershell')}
              className={`px-3 py-1 rounded-xl border-2 border-slate-900 text-xs font-comic uppercase tracking-wider transition-all cursor-pointer ${
                shellType === 'powershell'
                  ? 'bg-amber-400 font-bold text-slate-900 shadow-comic-sm'
                  : 'bg-white hover:bg-slate-100 text-slate-700'
              }`}
            >
              🪟 PowerShell (.ps1)
            </button>
            <button
              type="button"
              onClick={() => setShellType('bash')}
              className={`px-3 py-1 rounded-xl border-2 border-slate-900 text-xs font-comic uppercase tracking-wider transition-all cursor-pointer ${
                shellType === 'bash'
                  ? 'bg-emerald-400 font-bold text-slate-900 shadow-comic-sm'
                  : 'bg-white hover:bg-slate-100 text-slate-700'
              }`}
            >
              🍏 Bash (.sh) / macOS
            </button>
          </div>

          <span className="text-[11px] font-mono font-bold text-slate-500">
            {count} targets staged
          </span>
        </div>

        {/* Code Block Container */}
        <div className="flex-1 min-h-[160px] overflow-hidden rounded-xl border-2 border-slate-900 bg-slate-950 p-3 text-slate-100 font-mono text-xs flex flex-col relative shadow-inner">
          <pre className="flex-1 overflow-auto whitespace-pre font-mono text-[11px] leading-relaxed select-all">
            {scriptContent}
          </pre>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t-2 border-slate-200 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bangers uppercase tracking-wider text-slate-600 hover:text-slate-900 transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-amber-300 hover:bg-amber-400 text-slate-900 font-bangers text-xs uppercase tracking-wider border-2 border-slate-900 rounded-xl shadow-comic-sm hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-800" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-900" />
                  <span>Copy Script</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-bangers text-xs uppercase tracking-wider border-2 border-slate-900 rounded-xl shadow-comic-sm hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-900" />
              <span>Download File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
