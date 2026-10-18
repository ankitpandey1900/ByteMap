import React, { useEffect, useState } from 'react';
import { ScoutAvatar } from './ScoutMascot';
import { ComicZapIcon } from './icons/ComicIcons';

interface UpdateInfo {
  version: string;
  body?: string;
  date?: string;
}

export const ComicUpdateModal: React.FC = () => {
  const [updateAvailable, setUpdateAvailable] = useState<UpdateInfo | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [updateHandle, setUpdateHandle] = useState<any>(null);

  useEffect(() => {
    // Only check if running inside Tauri
    if (typeof window === 'undefined' || !(window as any).__TAURI_INTERNALS__) {
      return;
    }

    let isMounted = true;

    async function checkForUpdates() {
      try {
        const { check } = await import('@tauri-apps/plugin-updater');
        const update = await check();
        if (update && isMounted) {
          setUpdateHandle(update);
          setUpdateAvailable({
            version: update.version,
            body: update.body || 'Performance upgrades, bug fixes, and comic visual improvements!',
            date: update.date,
          });
          setIsOpen(true);
        }
      } catch (err) {
        // Silently ignore if offline or rate-limited
        console.debug('Tauri auto-updater check status:', err);
      }
    }

    // Check after a brief delay so app finishes initializing
    const timer = setTimeout(checkForUpdates, 3000);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  const handleInstallAndRestart = async () => {
    if (!updateHandle) return;

    try {
      setIsDownloading(true);
      setErrorMsg(null);

      let downloadedBytes = 0;
      let totalBytes = 0;

      await updateHandle.downloadAndInstall((event: any) => {
        if (event.event === 'Started') {
          totalBytes = event.data.contentLength || 0;
        } else if (event.event === 'Progress') {
          downloadedBytes += event.data.chunkLength || 0;
          if (totalBytes > 0) {
            setDownloadProgress(Math.min(99, Math.round((downloadedBytes / totalBytes) * 100)));
          }
        } else if (event.event === 'Finished') {
          setDownloadProgress(100);
        }
      });

      // Relaunch the app to apply the update
      const { relaunch } = await import('@tauri-apps/plugin-process');
      await relaunch();
    } catch (err: any) {
      console.error('Update installation failed:', err);
      setIsDownloading(false);
      setErrorMsg(err?.message || 'Failed to download update. Please try again later.');
    }
  };

  if (!isOpen || !updateAvailable) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70">
      <div className="relative w-full max-w-lg bg-amber-50 border-4 border-slate-900 rounded-2xl shadow-[8px_8px_0px_#0f172a] p-6 text-slate-900 overflow-hidden">
        {/* Comic halftone background accent */}
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-amber-200/50 rounded-full border-2 border-slate-900 pointer-events-none" />

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-yellow-400 border-3 border-slate-900 rounded-xl flex items-center justify-center shadow-[3px_3px_0px_#0f172a] shrink-0">
            <ComicZapIcon className="w-7 h-7 text-slate-900" />
          </div>
          <div>
            <div className="inline-block bg-pink-500 text-white text-xs font-bangers uppercase tracking-wider px-2.5 py-0.5 border-2 border-slate-900 rounded shadow-[1.5px_1.5px_0px_#0f172a] mb-1">
              New Episode Alert!
            </div>
            <h3 className="text-2xl font-bangers uppercase tracking-wide text-slate-900">
              ByteMap v{updateAvailable.version} Ready!
            </h3>
          </div>
        </div>

        {/* Mascot & Speech Bubble */}
        <div className="flex items-start gap-4 p-3 bg-white border-3 border-slate-900 rounded-xl shadow-[3px_3px_0px_#0f172a] mb-4">
          <div className="shrink-0">
            <ScoutAvatar isScanning={true} className="w-14 h-14" />
          </div>
          <div className="text-xs font-comicNeue font-bold text-slate-700 leading-relaxed">
            <span className="font-bangers text-sm text-slate-900 block mb-0.5">Scout Scouted an Upgrade! 🔍</span>
            A newer, faster edition of ByteMap has been released. Would you like to update now and enjoy the latest powers?
          </div>
        </div>

        {/* Release Notes */}
        {updateAvailable.body && (
          <div className="mb-4">
            <div className="text-xs font-bangers uppercase text-slate-500 mb-1 tracking-wider">What's New:</div>
            <div className="p-2.5 bg-amber-100/70 border-2 border-slate-900 rounded-lg text-xs font-mono text-slate-800 max-h-24 overflow-y-auto whitespace-pre-wrap">
              {updateAvailable.body}
            </div>
          </div>
        )}

        {/* Download Progress Bar */}
        {isDownloading && (
          <div className="mb-4">
            <div className="flex justify-between text-xs font-bangers uppercase tracking-wider mb-1">
              <span>Downloading Update...</span>
              <span className="font-mono">{downloadProgress}%</span>
            </div>
            <div className="w-full h-4 bg-slate-200 border-2 border-slate-900 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-emerald-400 border border-slate-900 rounded-full transition-all duration-200"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="p-2 mb-4 bg-red-100 border-2 border-red-500 rounded-lg text-xs font-comicNeue font-bold text-red-700">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          {!isDownloading && (
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-xs font-bangers uppercase tracking-wider text-slate-600 hover:text-slate-900 transition-colors"
            >
              Later
            </button>
          )}

          <button
            type="button"
            onClick={handleInstallAndRestart}
            disabled={isDownloading}
            className="flex items-center gap-2 px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 active:translate-y-0.5 text-slate-900 text-sm font-bangers uppercase tracking-wider border-3 border-slate-900 rounded-xl shadow-[3px_3px_0px_#0f172a] hover:shadow-[1px_1px_0px_#0f172a] transition-all disabled:opacity-50"
          >
            <ComicZapIcon className="w-4 h-4" />
            {isDownloading ? 'Installing & Restarting...' : 'Update & Restart'}
          </button>
        </div>
      </div>
    </div>
  );
};
