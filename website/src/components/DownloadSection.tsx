import React, { useState, useEffect } from 'react';
import { Download, ShieldCheck, Check, Copy, ExternalLink, HardDrive, Terminal, Apple } from 'lucide-react';
import { trackDownloadClick } from '../lib/analytics';

export const DownloadSection: React.FC = () => {
  const [copiedWinget, setCopiedWinget] = useState(false);
  const [copiedMac, setCopiedMac] = useState(false);
  const [downloadCount, setDownloadCount] = useState<number>(57);
  const [exeUrl, setExeUrl] = useState<string>('https://github.com/ankitpandey1900/ByteMap/releases/download/v1.0.9/ByteMap_1.0.9_x64-setup.exe');
  const [dmgUrl, setDmgUrl] = useState<string>('https://github.com/ankitpandey1900/ByteMap/releases/download/v1.0.9/ByteMap_1.0.9_universal.dmg');
  const [msiUrl, setMsiUrl] = useState<string>('https://github.com/ankitpandey1900/ByteMap/releases/download/v1.0.9/ByteMap_1.0.9_x64_en-US.msi');

  useEffect(() => {
    fetch('https://api.github.com/repos/ankitpandey1900/ByteMap/releases')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          let total = 0;
          for (const rel of data) {
            if (Array.isArray(rel.assets)) {
              for (const asset of rel.assets) {
                total += asset.download_count || 0;
              }
            }
          }
          if (total > 0) setDownloadCount(total);

          // Find direct asset URLs across releases
          for (const rel of data) {
            if (Array.isArray(rel.assets)) {
              const dmg = rel.assets.find((a: any) => a.name.endsWith('.dmg'));
              if (dmg && dmg.browser_download_url) {
                setDmgUrl(dmg.browser_download_url);
                break;
              }
            }
          }
          for (const rel of data) {
            if (Array.isArray(rel.assets)) {
              const exe = rel.assets.find((a: any) => a.name.endsWith('.exe'));
              if (exe && exe.browser_download_url) {
                setExeUrl(exe.browser_download_url);
                break;
              }
            }
          }
          for (const rel of data) {
            if (Array.isArray(rel.assets)) {
              const msi = rel.assets.find((a: any) => a.name.endsWith('.msi'));
              if (msi && msi.browser_download_url) {
                setMsiUrl(msi.browser_download_url);
                break;
              }
            }
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleCopyWinget = () => {
    navigator.clipboard.writeText('winget install ankitpandey1900.ByteMap');
    setCopiedWinget(true);
    setTimeout(() => setCopiedWinget(false), 2500);
  };

  const handleCopyMac = () => {
    navigator.clipboard.writeText('xattr -cr /Applications/ByteMap.app');
    setCopiedMac(true);
    setTimeout(() => setCopiedMac(false), 2500);
  };

  return (
    <section id="download" className="py-20 px-4 sm:px-6 lg:px-8 bg-sky-400 border-t-3 border-slate-900 relative">
      <div className="absolute inset-0 bg-comic-dots opacity-20 pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-xl bg-amber-400 border-2 border-slate-900 shadow-comic-sm font-comic text-xs uppercase text-slate-900 mb-3">
            <span>Official Releases • v1.0.9</span>
            <span>•</span>
            <span>{downloadCount} Downloads</span>
          </div>
          <h2 className="font-bangers text-5xl sm:text-6xl text-white uppercase tracking-wider comic-text-shadow-lg">
            DOWNLOAD BYTEMAP FOR WINDOWS & MACBOOK
          </h2>
          <p className="max-w-2xl mx-auto font-comicNeue text-base sm:text-lg font-bold text-slate-900 mt-2">
            100% Free, Safe, Signed, and Open Source. Zero ads, zero bloat, zero tracking telemetry.
          </p>
        </div>

        {/* Download Packages Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* 1. Windows NSIS Setup .exe (Recommended for Windows) */}
          <div className="p-6 sm:p-7 bg-white rounded-3xl border-3 border-slate-900 shadow-comic-xl flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-4 right-4">
              <span className="px-2.5 py-1 rounded-lg bg-amber-400 border-2 border-slate-900 font-bangers text-xs uppercase tracking-wider text-slate-900 shadow-xs">
                ⭐ Win Default
              </span>
            </div>

            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-300 border-2.5 border-slate-900 flex items-center justify-center shadow-comic-sm mb-4">
                <Download className="w-6 h-6 text-slate-900" />
              </div>
              <h3 className="font-bangers text-2xl sm:text-3xl text-slate-900 uppercase tracking-wide">
                Windows (.exe)
              </h3>
              <p className="font-comicNeue text-sm font-bold text-slate-600 mt-2 mb-4 leading-snug">
                Standard Windows user-mode installer. Includes automatic update checks and desktop shortcuts. No admin required.
              </p>
              <div className="p-3 bg-slate-50 rounded-xl border-2 border-slate-900 text-xs font-mono font-bold text-slate-600 space-y-1 mb-6">
                <div>File: ByteMap_1.0.9_x64-setup.exe</div>
                <div>Size: ~4.5 MB • Windows 10/11 64-bit</div>
              </div>
            </div>

            <a
              href={exeUrl}
              onClick={() => trackDownloadClick(exeUrl.split('/').pop() || 'ByteMap_1.0.9_x64-setup.exe', 'windows_exe', exeUrl)}
              className="w-full inline-flex items-center justify-center space-x-2 py-3.5 px-5 rounded-2xl bg-amber-400 hover:bg-amber-300 border-2.5 border-slate-900 font-bangers text-lg uppercase tracking-wider text-slate-900 shadow-comic hover:-translate-y-0.5 hover:shadow-comic-lg active:translate-y-0 transition-all text-center"
            >
              <Download className="w-5 h-5" />
              <span>Download Setup (.exe)</span>
            </a>
          </div>

          {/* 2. macOS Disk Image .dmg (Recommended for Mac / MacBook) */}
          <div id="download-mac" className="p-6 sm:p-7 bg-white rounded-3xl border-3 border-slate-900 shadow-comic-xl flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-4 right-4">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-400 border-2 border-slate-900 font-bangers text-xs uppercase tracking-wider text-slate-900 shadow-xs">
                🍏 Mac Universal
              </span>
            </div>

            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-300 border-2.5 border-slate-900 flex items-center justify-center shadow-comic-sm mb-4">
                <Apple className="w-6 h-6 text-slate-900" />
              </div>
              <h3 className="font-bangers text-2xl sm:text-3xl text-slate-900 uppercase tracking-wide">
                macOS (.dmg)
              </h3>
              <p className="font-comicNeue text-sm font-bold text-slate-600 mt-2 mb-4 leading-snug">
                Native Universal DMG for MacBook Air, Pro, iMac & Mac mini. Runs on Apple Silicon (M1/M2/M3/M4) & Intel.
              </p>
              <div className="p-3 bg-slate-50 rounded-xl border-2 border-slate-900 text-xs font-mono font-bold text-slate-600 space-y-1 mb-6">
                <div>Format: Native Apple Disk Image (.dmg)</div>
                <div>Target: macOS Big Sur, Monterey, Sonoma, Sequoia</div>
              </div>
            </div>

            <a
              href={dmgUrl}
              onClick={() => trackDownloadClick(dmgUrl.split('/').pop() || 'ByteMap_1.0.9_universal.dmg', 'mac_dmg', dmgUrl)}
              className="w-full inline-flex items-center justify-center space-x-2 py-3.5 px-5 rounded-2xl bg-emerald-400 hover:bg-emerald-300 border-2.5 border-slate-900 font-bangers text-lg uppercase tracking-wider text-slate-900 shadow-comic hover:-translate-y-0.5 hover:shadow-comic-lg active:translate-y-0 transition-all text-center"
            >
              <Apple className="w-5 h-5 text-slate-900" />
              <span>Download for Mac (.dmg)</span>
            </a>
          </div>

          {/* 3. Windows MSI Package .msi */}
          <div className="p-6 sm:p-7 bg-white rounded-3xl border-3 border-slate-900 shadow-comic-xl flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-4 right-4">
              <span className="px-2.5 py-1 rounded-lg bg-cyan-300 border-2 border-slate-900 font-bangers text-xs uppercase tracking-wider text-slate-900 shadow-xs">
                🏢 Enterprise / IT
              </span>
            </div>

            <div>
              <div className="w-12 h-12 rounded-2xl bg-cyan-300 border-2.5 border-slate-900 flex items-center justify-center shadow-comic-sm mb-4">
                <HardDrive className="w-6 h-6 text-slate-900" />
              </div>
              <h3 className="font-bangers text-2xl sm:text-3xl text-slate-900 uppercase tracking-wide">
                Windows MSI (.msi)
              </h3>
              <p className="font-comicNeue text-sm font-bold text-slate-600 mt-2 mb-4 leading-snug">
                Ideal for system administrators, computer labs, and scripted silent enterprise deployment via msiexec.
              </p>
              <div className="p-3 bg-slate-50 rounded-xl border-2 border-slate-900 text-xs font-mono font-bold text-slate-600 space-y-1 mb-6">
                <div>File: ByteMap_1.0.9_x64_en-US.msi</div>
                <div>Size: ~5.5 MB • Windows 10/11 64-bit</div>
              </div>
            </div>

            <a
              href={msiUrl}
              onClick={() => trackDownloadClick(msiUrl.split('/').pop() || 'ByteMap_1.0.9_x64_en-US.msi', 'windows_msi', msiUrl)}
              className="w-full inline-flex items-center justify-center space-x-2 py-3.5 px-5 rounded-2xl bg-cyan-400 hover:bg-cyan-300 border-2.5 border-slate-900 font-bangers text-lg uppercase tracking-wider text-slate-900 shadow-comic hover:-translate-y-0.5 hover:shadow-comic-lg active:translate-y-0 transition-all text-center"
            >
              <Download className="w-5 h-5" />
              <span>Download Package (.msi)</span>
            </a>
          </div>
        </div>

        {/* MacBook / macOS Installation Guide Pop-Art Box */}
        <div className="mb-10 p-6 sm:p-8 bg-white rounded-3xl border-3 border-slate-900 shadow-comic-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-comic-dots opacity-10 pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-400 border-2 border-slate-900 flex items-center justify-center shadow-comic-sm">
                <Apple className="w-5 h-5 text-slate-900" />
              </div>
              <div>
                <h3 className="font-bangers text-2xl sm:text-3xl text-slate-900 uppercase tracking-wide leading-none">
                  How to Install on macOS & MacBook 🍏
                </h3>
                <span className="text-xs font-comicNeue font-bold text-slate-600">
                  Quick 3-step setup guide for Apple Silicon (M1/M2/M3/M4) and Intel Macs
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
              {/* Step 1 */}
              <div className="p-4 bg-amber-50 rounded-2xl border-2 border-slate-900 shadow-comic-sm flex flex-col justify-between">
                <div>
                  <div className="inline-block px-2.5 py-0.5 rounded-lg bg-amber-400 border border-slate-900 font-bangers text-xs uppercase mb-2">
                    Step 1: Download
                  </div>
                  <h4 className="font-comic font-bold text-slate-900 text-sm mb-1">Get the .dmg Image</h4>
                  <p className="font-comicNeue text-xs font-bold text-slate-600">
                    Click the "Download for Mac (.dmg)" button above to download the Universal disk image.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-4 bg-sky-50 rounded-2xl border-2 border-slate-900 shadow-comic-sm flex flex-col justify-between">
                <div>
                  <div className="inline-block px-2.5 py-0.5 rounded-lg bg-sky-400 border border-slate-900 font-bangers text-xs uppercase mb-2">
                    Step 2: Drag & Drop
                  </div>
                  <h4 className="font-comic font-bold text-slate-900 text-sm mb-1">Move to Applications</h4>
                  <p className="font-comicNeue text-xs font-bold text-slate-600">
                    Double-click the downloaded <code className="bg-white px-1 py-0.5 rounded border border-slate-300">.dmg</code> file, then drag <strong>ByteMap</strong> into your <strong>Applications</strong> folder.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-4 bg-emerald-50 rounded-2xl border-2 border-slate-900 shadow-comic-sm flex flex-col justify-between">
                <div>
                  <div className="inline-block px-2.5 py-0.5 rounded-lg bg-emerald-400 border border-slate-900 font-bangers text-xs uppercase mb-2">
                    Step 3: First Launch
                  </div>
                  <h4 className="font-comic font-bold text-slate-900 text-sm mb-1">Open Gatekeeper</h4>
                  <p className="font-comicNeue text-xs font-bold text-slate-600">
                    Right-click (or Control+click) <strong>ByteMap</strong> in Applications and click <strong>Open</strong>. Or in <em>System Settings &gt; Privacy & Security</em>, click <strong>Open Anyway</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Terminal Command for Mac Power Users */}
            <div className="mt-4 p-3 bg-slate-900 rounded-xl border-2 border-slate-900 text-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-slate-400">Power user Gatekeeper bypass (Terminal):</span>
                <code className="text-amber-300 font-bold">xattr -cr /Applications/ByteMap.app</code>
              </div>
              <button
                onClick={handleCopyMac}
                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-bold transition-all cursor-pointer"
              >
                {copiedMac ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedMac ? 'Copied!' : 'Copy Command'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick CLI Winget Box for Windows */}
        <div className="mb-6 p-4 bg-white rounded-2xl border-2.5 border-slate-900 shadow-comic flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs font-mono font-bold text-slate-800">
            <Terminal className="w-4 h-4 text-slate-900" />
            <span className="text-slate-500">Windows Package Manager (winget):</span>
            <code className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-900 text-slate-900">
              winget install ankitpandey1900.ByteMap
            </code>
          </div>
          <button
            onClick={handleCopyWinget}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border-2 border-slate-900 bg-amber-400 hover:bg-amber-300 font-comic uppercase text-xs text-slate-900 shadow-comic-sm hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            {copiedWinget ? <Check className="w-3.5 h-3.5 text-slate-900" /> : <Copy className="w-3.5 h-3.5 text-slate-900" />}
            <span>{copiedWinget ? 'Copied Command!' : 'Copy'}</span>
          </button>
        </div>

        {/* System Requirements & Verification Box */}
        <div className="p-6 bg-amber-50 rounded-3xl border-3 border-slate-900 shadow-comic flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-comicNeue font-bold text-slate-800">
          <div className="flex items-center space-x-3">
            <ShieldCheck className="w-8 h-8 text-emerald-600 shrink-0" />
            <div>
              <p className="font-comic uppercase text-slate-900 text-sm">System Requirements & Cross-Platform Integrity</p>
              <p className="text-slate-600">
                Windows 10/11 64-bit OR macOS 10.15+ (Apple Silicon M1/M2/M3/M4 & Intel) • Minimum 100MB RAM • 25MB disk footprint
              </p>
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
