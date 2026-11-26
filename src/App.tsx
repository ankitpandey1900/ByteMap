import React, { useEffect, useState } from 'react';
import { getCurrentWebview } from '@tauri-apps/api/webview';
import { useAppStore } from '@/lib/store';
import { api, isTauri } from '@/lib/api';
import { ComicWallpaper } from '@/components/ComicWallpaper';
import { ComicHeader } from '@/components/ComicHeader';
import { ScanModal } from '@/components/ScanModal';
import { ComicUpdateModal } from '@/components/ComicUpdateModal';
import { DigitalKingdomView } from '@/features/overview/DigitalKingdomView';
import { DrivesTab } from '@/features/drives/DrivesTab';
import { ExplorerTab } from '@/features/explorer/ExplorerTab';
import { LargeFilesTab } from '@/features/large-files/LargeFilesTab';
import { FileTypesTab } from '@/features/file-types/FileTypesTab';
import { DuplicatesTab } from '@/features/duplicates/DuplicatesTab';
import { CleanupTab } from '@/features/cleanup/CleanupTab';
import { SettingsTab } from '@/features/settings/SettingsTab';

export const App: React.FC = () => {
  const {
    activeTab,
    settings,
    updateSettings,
    setDrives,
    setSelectedDrive,
    setScanPath,
    zoomLevel,
    zoomIn,
    zoomOut,
    resetZoom,
  } = useAppStore();

  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [showZoomToast, setShowZoomToast] = useState(false);

  // Apply native WebView zoom in Tauri desktop app, or smooth rem scaling in browser preview
  useEffect(() => {
    let cancelled = false;
    (document.documentElement.style as any).zoom = '';

    if (isTauri) {
      document.documentElement.style.fontSize = '';
      getCurrentWebview()
        .setZoom(zoomLevel / 100)
        .catch(() => {
          if (!cancelled) {
            document.documentElement.style.fontSize =
              zoomLevel === 100 ? '' : `${(16 * zoomLevel) / 100}px`;
          }
        });
    } else {
      document.documentElement.style.fontSize =
        zoomLevel === 100 ? '' : `${(16 * zoomLevel) / 100}px`;
    }

    return () => {
      cancelled = true;
    };
  }, [zoomLevel]);

  // Global Ctrl + / Ctrl - / Ctrl 0 and Ctrl + MouseWheel zoom listener
  useEffect(() => {
    let toastTimer: any = null;
    let lastWheelAt = 0;
    const triggerZoomToast = () => {
      setShowZoomToast(true);
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(() => setShowZoomToast(false), 1400);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+' || e.code === 'NumpadAdd') {
          e.preventDefault();
          zoomIn();
          triggerZoomToast();
        } else if (e.key === '-' || e.key === '_' || e.code === 'NumpadSubtract') {
          e.preventDefault();
          zoomOut();
          triggerZoomToast();
        } else if (e.key === '0' || e.code === 'Numpad0') {
          e.preventDefault();
          resetZoom();
          triggerZoomToast();
        }
      }
    };

    // Standard desktop Ctrl + MouseWheel zoom support
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const now = Date.now();
        if (now - lastWheelAt < 90 || Math.abs(e.deltaY) < 4) return;
        lastWheelAt = now;
        if (e.deltaY < 0) {
          zoomIn();
        } else {
          zoomOut();
        }
        triggerZoomToast();
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
      if (toastTimer) clearTimeout(toastTimer);
    };
  }, [zoomIn, zoomOut, resetZoom]);

  // Initialize drives & settings
  useEffect(() => {
    async function init() {
      try {
        const loadedSettings = await api.loadSettings();
        updateSettings(loadedSettings);

        const loadedDrives = await api.getDrives();
        setDrives(loadedDrives);
        if (loadedDrives.length > 0) {
          setSelectedDrive(loadedDrives[0]);
          setScanPath(loadedDrives[0].mount_point);
        }
      } catch (err) {
        console.error('Initialization error:', err);
      }
    }
    init();
  }, [setDrives, setSelectedDrive, setScanPath, updateSettings]);

  // Apply configured light / dark / system theme
  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = (isDark: boolean) => {
      root.classList.toggle('dark', isDark);
      root.classList.toggle('light', !isDark);
    };

    if (settings.theme === 'dark') {
      applyTheme(true);
      return;
    }
    if (settings.theme === 'light') {
      applyTheme(false);
      return;
    }

    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    applyTheme(Boolean(media?.matches));
    const listener = (e: MediaQueryListEvent) => applyTheme(e.matches);
    media?.addEventListener?.('change', listener);
    return () => media?.removeEventListener?.('change', listener);
  }, [settings.theme]);

  const handleStartScanFromDrive = (targetPath: string) => {
    setScanPath(targetPath);
    setIsScanModalOpen(true);
  };

  const openScanModal = () => setIsScanModalOpen(true);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview':
        return <DigitalKingdomView onOpenScanModal={openScanModal} />;
      case 'drives':
        return <DrivesTab onStartScan={handleStartScanFromDrive} />;
      case 'explore':
        return <ExplorerTab onOpenScanModal={openScanModal} />;
      case 'large-files':
        return <LargeFilesTab onOpenScanModal={openScanModal} />;
      case 'file-types':
        return <FileTypesTab onOpenScanModal={openScanModal} />;
      case 'duplicates':
        return <DuplicatesTab onOpenScanModal={openScanModal} />;
      case 'cleanup':
        return <CleanupTab onOpenScanModal={openScanModal} />;
      case 'settings':
        return <SettingsTab />;
      default:
        return <DigitalKingdomView onOpenScanModal={openScanModal} />;
    }
  };

  return (
    <ComicWallpaper>
      {/* Comic Header with Compass Badge and Analyze/Explore/Cleanup Tabs */}
      <ComicHeader onOpenScanModal={() => setIsScanModalOpen(true)} />

      {/* Main Content Body */}
      <main className="flex-1 overflow-y-auto overflow-x-auto p-2 sm:p-2.5 md:p-3 bg-slate-100 min-h-0 min-w-0 flex flex-col">
        {renderActiveTab()}
      </main>

      {/* Scan Configuration & Progress Modal */}
      <ScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
      />

      {/* Comic Auto-Update Notification Modal */}
      <ComicUpdateModal />

      {/* Zoom HUD Floating Toast */}
      {showZoomToast && (
        <div className="fixed bottom-6 right-6 z-50 pointer-events-none animate-comic-pop">
          <div className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-amber-400 border-2.5 border-slate-900 shadow-comic-lg text-slate-900 font-comic uppercase text-xs font-black tracking-wider">
            <span>🔍 Zoom: {zoomLevel}%</span>
            {zoomLevel !== 100 && (
              <span className="text-[10px] font-fredoka font-bold text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-900">
                Ctrl 0 to reset
              </span>
            )}
          </div>
        </div>
      )}
    </ComicWallpaper>
  );
};

export default App;
