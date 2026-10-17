import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import { ComicWallpaper } from '@/components/ComicWallpaper';
import { ComicHeader } from '@/components/ComicHeader';
import { ScanModal } from '@/components/ScanModal';
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
    updateSettings,
    setDrives,
    setSelectedDrive,
    setScanPath,
  } = useAppStore();

  const [isScanModalOpen, setIsScanModalOpen] = useState(false);

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

  // Force light comic theme
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');
  }, []);

  const handleStartScanFromDrive = (targetPath: string) => {
    setScanPath(targetPath);
    setIsScanModalOpen(true);
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview':
        return <DigitalKingdomView />;
      case 'drives':
        return <DrivesTab onStartScan={handleStartScanFromDrive} />;
      case 'explore':
        return <ExplorerTab />;
      case 'large-files':
        return <LargeFilesTab />;
      case 'file-types':
        return <FileTypesTab />;
      case 'duplicates':
        return <DuplicatesTab />;
      case 'cleanup':
        return <CleanupTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return <DigitalKingdomView />;
    }
  };

  return (
    <ComicWallpaper>
      {/* Comic Header with Compass Badge and Analyze/Explore/Cleanup Tabs */}
      <ComicHeader onOpenScanModal={() => setIsScanModalOpen(true)} />

      {/* Main Content Body */}
      <main className="flex-1 overflow-y-auto p-2 sm:p-2.5 md:p-3 bg-slate-100 min-h-0 flex flex-col">
        {renderActiveTab()}
      </main>

      {/* Scan Configuration & Progress Modal */}
      <ScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
      />
    </ComicWallpaper>
  );
};

export default App;
