import React, { useState } from 'react';
import { HelpCircle, Sun, Moon } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { ActiveTab } from '@/types';
import {
  ComicKingdomIcon,
  ComicDrivesIcon,
  ComicExploreIcon,
  ComicLargeFilesIcon,
  ComicPieChartIcon,
  ComicDuplicatesIcon,
  ComicCleanupIcon,
  ComicSettingsIcon,
  ComicZapIcon,
} from '@/components/icons/ComicIcons';
import { UserManualModal } from './UserManualModal';

interface ComicHeaderProps {
  onOpenScanModal: () => void;
}

export const ComicHeader: React.FC<ComicHeaderProps> = ({ onOpenScanModal }) => {
  const { activeTab, setActiveTab, zoomLevel, zoomIn, zoomOut, resetZoom, settings, updateSettings } =
    useAppStore();
  const [showGuide, setShowGuide] = useState(false);

  const isDark =
    settings.theme === 'dark' ||
    (settings.theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-color-scheme: dark)').matches);

  const handleToggleTheme = () => {
    updateSettings({ theme: isDark ? 'light' : 'dark' });
  };

  const navItems: { tab: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { tab: 'overview', label: 'Kingdom', icon: <ComicKingdomIcon className="w-4 h-4" /> },
    { tab: 'drives', label: 'Drives', icon: <ComicDrivesIcon className="w-4 h-4" /> },
    { tab: 'explore', label: 'Explore', icon: <ComicExploreIcon className="w-4 h-4" /> },
    { tab: 'large-files', label: 'Large Files', icon: <ComicLargeFilesIcon className="w-4 h-4" /> },
    { tab: 'file-types', label: 'File Types', icon: <ComicPieChartIcon className="w-4 h-4" /> },
    { tab: 'duplicates', label: 'Duplicates', icon: <ComicDuplicatesIcon className="w-4 h-4" /> },
    { tab: 'cleanup', label: 'Cleanup', icon: <ComicCleanupIcon className="w-4 h-4" /> },
    { tab: 'settings', label: 'Settings', icon: <ComicSettingsIcon className="w-4 h-4" /> },
  ];

  return (
    <header className="px-3 py-1.5 border-b-3 border-slate-900 dark:border-b dark:border-white/[0.08] bg-sky-400 dark:bg-[#10141d] select-none shadow-comic-sm relative shrink-0">
      {/* Subtle halftone dot background texture (Light mode only) */}
      <div className="absolute inset-0 bg-comic-dots opacity-25 dark:hidden pointer-events-none" />

      <div className="relative z-10 flex items-center justify-between gap-2 flex-wrap xl:flex-nowrap">
        {/* Left: Mascot Badge + BYTEMAP Logo */}
        <div
          onClick={() => setActiveTab('overview')}
          className="flex items-center space-x-2 cursor-pointer group shrink-0"
          title="Return to Digital Kingdom Overview"
        >
          <div className="w-9 h-9 rounded-full bg-amber-400 border-2 border-slate-900 flex items-center justify-center shadow-comic-sm group-hover:scale-105 transition-all duration-200 overflow-hidden p-0.5">
            <img
              src="/logo.png"
              alt="ByteMap Explorer Mascot"
              className="w-full h-full object-cover rounded-full"
            />
          </div>

          <div className="flex flex-col">
            <h1 className="font-bangers text-2xl tracking-tight text-white uppercase comic-text-shadow leading-none">
              BYTEMAP
            </h1>
            <span className="text-[9px] font-bold text-slate-900 dark:text-sky-200 tracking-widest uppercase leading-none mt-0.5">
              Storage Explorer
            </span>
          </div>
        </div>

        {/* Center: Ordered Single-Row Navigation Tabs */}
        <nav className="flex items-center gap-1 flex-wrap justify-center" aria-label="Primary sections">
          {navItems.map((item) => {
            const isActive = activeTab === item.tab;
            return (
              <button
                key={item.tab}
                type="button"
                onClick={() => setActiveTab(item.tab)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center space-x-1 px-2 py-1 rounded-lg border-2 border-slate-900 font-comic text-[11px] uppercase tracking-tight transition-all duration-150 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-400 text-slate-900 shadow-comic-sm dark:border-amber-300/60 dark:shadow-[0_0_14px_rgba(251,191,36,0.28)] -translate-y-0.5 font-bold'
                    : 'bg-white hover:bg-amber-100 text-slate-700 dark:bg-[#161b26] dark:hover:bg-[#1f2638] dark:text-slate-300 dark:hover:text-white dark:border-white/[0.08] shadow-[1.5px_1.5px_0px_#0f172a] hover:-translate-y-0.5'
                }`}
              >
                <span className="shrink-0">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Compact Zoom + Theme Toggle + User Guide + Analyze CTA */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div
            className="hidden sm:flex items-center space-x-0.5 px-1 py-0.5 rounded-lg border-2 border-slate-900 bg-white shadow-[1.5px_1.5px_0px_#0f172a]"
            title="App Zoom (Ctrl + / Ctrl - to adjust, Ctrl 0 to reset)"
          >
            <button
              type="button"
              onClick={zoomOut}
              disabled={zoomLevel <= 75}
              aria-label="Zoom out"
              title="Zoom Out (Ctrl -)"
              className="w-4 h-4 rounded font-mono font-bold text-[11px] flex items-center justify-center text-slate-800 hover:bg-amber-300 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              -
            </button>
            <button
              type="button"
              onClick={resetZoom}
              aria-label={`Reset zoom from ${zoomLevel}% to 100%`}
              title="Reset Zoom to 100% (Ctrl 0)"
              className="px-1 font-mono font-bold text-[10px] text-slate-800 hover:bg-amber-100 rounded transition-all tabular-nums cursor-pointer"
            >
              {zoomLevel}%
            </button>
            <button
              type="button"
              onClick={zoomIn}
              disabled={zoomLevel >= 150}
              aria-label="Zoom in"
              title="Zoom In (Ctrl +)"
              className="w-4 h-4 rounded font-mono font-bold text-[11px] flex items-center justify-center text-slate-800 hover:bg-amber-300 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={handleToggleTheme}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border-2 border-slate-900 bg-white hover:bg-amber-200 text-slate-900 shadow-[1.5px_1.5px_0px_#0f172a] hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            {isDark ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-indigo-700" />}
          </button>

          <button
            type="button"
            onClick={() => setShowGuide(true)}
            aria-label="Open User Guide"
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border-2 border-slate-900 bg-white hover:bg-amber-200 text-slate-900 shadow-[1.5px_1.5px_0px_#0f172a] hover:-translate-y-0.5 transition-all cursor-pointer"
            title="User Guide — How to solve everyday storage problems"
          >
            <HelpCircle className="w-4 h-4 text-amber-600" />
          </button>

          <button
            type="button"
            onClick={onOpenScanModal}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg border-2 border-slate-900 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bangers text-xs uppercase tracking-wider shadow-comic-sm hover:-translate-y-0.5 transition-all duration-150 cursor-pointer"
          >
            <ComicZapIcon className="w-3.5 h-3.5" />
            <span>Analyze</span>
          </button>
        </div>
      </div>

      {/* Interactive User Manual Survival Guide Modal */}
      <UserManualModal isOpen={showGuide} onClose={() => setShowGuide(false)} />
    </header>
  );
};
