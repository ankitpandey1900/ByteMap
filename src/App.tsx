import React, { Suspense, lazy, useEffect, useState } from 'react';
import { getCurrentWebview } from '@tauri-apps/api/webview';
import { useAppStore } from '@/lib/store';
import { api, isTauri } from '@/lib/api';
import { ComicWallpaper } from '@/components/ComicWallpaper';
import { ComicHeader } from '@/components/ComicHeader';
import { ScanModal } from '@/components/ScanModal';
import { DigitalKingdomView } from '@/features/overview/DigitalKingdomView';

const ComicUpdateModal = lazy(() =>
  import('@/components/ComicUpdateModal').then((m) => ({ default: m.ComicUpdateModal }))
);
const DrivesTab = lazy(() =>
  import('@/features/drives/DrivesTab').then((m) => ({ default: m.DrivesTab }))
);
const ExplorerTab = lazy(() =>
  import('@/features/explorer/ExplorerTab').then((m) => ({ default: m.ExplorerTab }))
);
const LargeFilesTab = lazy(() =>
  import('@/features/large-files/LargeFilesTab').then((m) => ({ default: m.LargeFilesTab }))
);
const FileTypesTab = lazy(() =>
  import('@/features/file-types/FileTypesTab').then((m) => ({ default: m.FileTypesTab }))
);
const DuplicatesTab = lazy(() =>
  import('@/features/duplicates/DuplicatesTab').then((m) => ({ default: m.DuplicatesTab }))
);
const CleanupTab = lazy(() =>
  import('@/features/cleanup/CleanupTab').then((m) => ({ default: m.CleanupTab }))
);
const SettingsTab = lazy(() =>
  import('@/features/settings/SettingsTab').then((m) => ({ default: m.SettingsTab }))
);

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
        // Default to Light Mode unless user explicitly chose Dark Mode
        const normalizedTheme = loadedSettings.theme === 'dark' ? 'dark' : 'light';
        updateSettings({ ...loadedSettings, theme: normalizedTheme });

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

  // Apply configured light / dark theme (Light default; user manually switches to Dark)
  useEffect(() => {
    const root = document.documentElement;
    const isDark = settings.theme === 'dark';
    root.classList.toggle('dark', isDark);
    root.classList.toggle('light', !isDark);
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
        <Suspense
          fallback={
            <div className="flex-1 flex items-center justify-center p-8 text-xs font-comic uppercase tracking-wider text-slate-500">
              Loading view...
            </div>
          }
        >
          {renderActiveTab()}
        </Suspense>
      </main>

      {/* Scan Configuration & Progress Modal */}
      <ScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
      />

      {/* Comic Auto-Update Notification Modal */}
      <Suspense fallback={null}>
        <ComicUpdateModal />
      </Suspense>

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
