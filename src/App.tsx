import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { ScanModal } from '@/components/ScanModal';
import { OverviewTab } from '@/features/overview/OverviewTab';
import { DrivesTab } from '@/features/drives/DrivesTab';
import { ExplorerTab } from '@/features/explorer/ExplorerTab';
import { LargeFilesTab } from '@/features/large-files/LargeFilesTab';
import { FileTypesTab } from '@/features/file-types/FileTypesTab';
import { DuplicatesTab } from '@/features/duplicates/DuplicatesTab';
import { CleanupTab } from '@/features/cleanup/CleanupTab';
import { SettingsTab } from '@/features/settings/SettingsTab';

import { BackgroundDots, Spotlight } from '@/components/ui';

export const App: React.FC = () => {
  const {
    activeTab,
    settings,
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

  // Apply theme class
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  const handleStartScanFromDrive = (targetPath: string) => {
    setScanPath(targetPath);
    setIsScanModalOpen(true);
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab />;
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
        return <OverviewTab />;
    }
  };

  return (
    <div className="flex h-screen w-screen bg-background text-foreground overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Container with Aceternity BackgroundDots & Spotlight */}
      <BackgroundDots variant="dots" className="flex-1">
        <Spotlight
          className="-top-40 right-10 md:right-60 md:-top-20"
          fill="#3b82f6"
        />

        {/* App Header */}
        <Header onOpenScanModal={() => setIsScanModalOpen(true)} />

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-6 relative z-10">
          {renderActiveTab()}
        </main>
      </BackgroundDots>

      {/* Scan Configuration & Progress Modal */}
      <ScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
      />
    </div>
  );
};

export default App;
