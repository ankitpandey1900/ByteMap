import React, { useState, useEffect } from 'react';
import { Download, ShieldCheck, Check, Copy, ExternalLink, HardDrive, Terminal } from 'lucide-react';

export const DownloadSection: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [downloadCount, setDownloadCount] = useState<number | null>(null);

  useEffect(() => {
    fetch('https://api.github.com/repos/ankitpandey1900/ByteMap/releases')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          let total = 0;
          for (const rel of data) {
            if (Array.isArray(rel.assets)) {
              for (const asset of rel.assets) {
                total += asset.download_count || 0;
              }
            }
          }
          if (total > 0) setDownloadCount(total);
        }
      })
      .catch(() => {});
  }, []);

  const handleCopyCmd = () => {
    navigator.clipboard.writeText('winget install ankitpandey1900.ByteMap');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <section id="download" className="py-20 px-4 sm:px-6 lg:px-8 bg-sky-400 border-t-3 border-slate-900 relative">
      <div className="absolute inset-0 bg-comic-dots opacity-20 pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-xl bg-amber-400 border-2 border-slate-900 shadow-comic-sm font-comic text-xs uppercase text-slate-900 mb-3">
            <span>Official Releases • v1.0.2</span>
            {downloadCount !== null && (
              <>
                <span>•</span>
                <span>{downloadCount} Downloads</span>
              </>
            )}
          </div>
          <h2 className="font-bangers text-5xl sm:text-6xl text-white uppercase tracking-wider comic-text-shadow-lg">
            DOWNLOAD BYTEMAP FOR WINDOWS
          </h2>
          <p className="max-w-2xl mx-auto font-comicNeue text-base sm:text-lg font-bold text-slate-900 mt-2">
            100% Free, Safe, Signed, and Open Source. Zero ads, zero bloat, zero tracking telemetry.
          </p>
        </div>

        {/* Download Packages Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Windows NSIS Setup .exe (Recommended) */}
          <div className="p-6 sm:p-8 bg-white rounded-3xl border-3 border-slate-900 shadow-comic-xl flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 rounded-lg bg-amber-400 border-2 border-slate-900 font-bangers text-xs uppercase tracking-wider text-slate-900 shadow-xs">
                ⭐ Recommended
              </span>
            </div>

            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-300 border-2.5 border-slate-900 flex items-center justify-center shadow-comic-sm mb-4">
                <Download className="w-6 h-6 text-slate-900" />
              </div>
              <h3 className="font-bangers text-3xl text-slate-900 uppercase tracking-wide">
                Windows Standalone (.exe)
              </h3>
              <p className="font-comicNeue text-sm font-bold text-slate-600 mt-2 mb-4">
                Standard Windows user-mode installer. Includes automatic update checks and desktop shortcuts. No admin rights required.
              </p>
              <div className="p-3 bg-slate-50 rounded-xl border-2 border-slate-900 text-xs font-mono font-bold text-slate-600 space-y-1 mb-6">
                <div>File: ByteMap_1.0.2_x64-setup.exe</div>
                <div>Size: ~15.2 MB • Target: Windows 10/11 64-bit</div>
              </div>
            </div>

            <a
              href="https://github.com/ankitpandey1900/ByteMap/releases/download/v1.0.2/ByteMap_1.0.2_x64-setup.exe"
              className="w-full inline-flex items-center justify-center space-x-2 py-3.5 px-6 rounded-2xl bg-amber-400 hover:bg-amber-300 border-2.5 border-slate-900 font-bangers text-lg uppercase tracking-wider text-slate-900 shadow-comic hover:-translate-y-0.5 hover:shadow-comic-lg active:translate-y-0 transition-all text-center"
            >
              <Download className="w-5 h-5" />
              <span>Download Setup (.exe)</span>
            </a>
          </div>

          {/* Windows MSI Package (.msi) */}
          <div className="p-6 sm:p-8 bg-white rounded-3xl border-3 border-slate-900 shadow-comic-xl flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 rounded-lg bg-cyan-300 border-2 border-slate-900 font-bangers text-xs uppercase tracking-wider text-slate-900 shadow-xs">
                Enterprise & Silent
              </span>
            </div>

            <div>
              <div className="w-12 h-12 rounded-2xl bg-cyan-300 border-2.5 border-slate-900 flex items-center justify-center shadow-comic-sm mb-4">
                <HardDrive className="w-6 h-6 text-slate-900" />
              </div>
              <h3 className="font-bangers text-3xl text-slate-900 uppercase tracking-wide">
                Windows Installer (.msi)
              </h3>
              <p className="font-comicNeue text-sm font-bold text-slate-600 mt-2 mb-4">
                Ideal for system administrators, IT lab imaging, and scripted deployments with msiexec flags.
              </p>
              <div className="p-3 bg-slate-50 rounded-xl border-2 border-slate-900 text-xs font-mono font-bold text-slate-600 space-y-1 mb-6">
                <div>File: ByteMap_1.0.2_x64_en-US.msi</div>
                <div>Size: ~16.0 MB • Target: Windows 10/11 64-bit</div>
              </div>
            </div>

            <a
              href="https://github.com/ankitpandey1900/ByteMap/releases/download/v1.0.2/ByteMap_1.0.2_x64_en-US.msi"
              className="w-full inline-flex items-center justify-center space-x-2 py-3.5 px-6 rounded-2xl bg-cyan-400 hover:bg-cyan-300 border-2.5 border-slate-900 font-bangers text-lg uppercase tracking-wider text-slate-900 shadow-comic hover:-translate-y-0.5 hover:shadow-comic-lg active:translate-y-0 transition-all text-center"
            >
              <Download className="w-5 h-5" />
              <span>Download Package (.msi)</span>
            </a>
          </div>
        </div>

        {/* Quick CLI Winget Box */}
        <div className="mb-6 p-4 bg-white rounded-2xl border-2.5 border-slate-900 shadow-comic flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs font-mono font-bold text-slate-800">
            <Terminal className="w-4 h-4 text-slate-900" />
            <span className="text-slate-500">Terminal:</span>
            <code className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-900 text-slate-900">
              winget install ankitpandey1900.ByteMap
            </code>
          </div>
          <button
            onClick={handleCopyCmd}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border-2 border-slate-900 bg-amber-400 hover:bg-amber-300 font-comic uppercase text-xs text-slate-900 shadow-comic-sm hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-slate-900" /> : <Copy className="w-3.5 h-3.5 text-slate-900" />}
            <span>{copied ? 'Copied Command!' : 'Copy'}</span>
          </button>
        </div>

        {/* System Requirements & Verification Box */}
        <div className="p-6 bg-amber-50 rounded-3xl border-3 border-slate-900 shadow-comic flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-comicNeue font-bold text-slate-800">
          <div className="flex items-center space-x-3">
            <ShieldCheck className="w-8 h-8 text-emerald-600 shrink-0" />
            <div>
              <p className="font-comic uppercase text-slate-900 text-sm">System Requirements & Verification</p>
              <p className="text-slate-600">Requires 64-bit Windows 10 (1809+) or Windows 11 • Minimum 100MB RAM • 25MB disk footprint</p>
            </div>
          </div>

          <a
            href="https://github.com/ankitpandey1900/ByteMap/releases/latest"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-white hover:bg-amber-100 text-slate-900 border-2 border-slate-900 font-comic uppercase text-xs shadow-comic-sm shrink-0"
          >
            <span>View Release Hashes</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </section>
  );
};
