import React from 'react';
import { useAppStore } from '@/lib/store';
import { ActiveTab } from '@/types';
import {
  ComicKingdomIcon,
  ComicDrivesIcon,
  ComicExploreIcon,
  ComicLargeFilesIcon,
  ComicDuplicatesIcon,
  ComicCleanupIcon,
  ComicSettingsIcon,
  ComicZapIcon,
} from '@/components/icons/ComicIcons';

interface ComicHeaderProps {
  onOpenScanModal: () => void;
}

export const ComicHeader: React.FC<ComicHeaderProps> = ({ onOpenScanModal }) => {
  const { activeTab, setActiveTab } = useAppStore();

  const navItems: { tab: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { tab: 'overview', label: 'Kingdom', icon: <ComicKingdomIcon className="w-4 h-4" /> },
    { tab: 'drives', label: 'Drives', icon: <ComicDrivesIcon className="w-4 h-4" /> },
    { tab: 'explore', label: 'Explore', icon: <ComicExploreIcon className="w-4 h-4" /> },
    { tab: 'large-files', label: 'Large Files', icon: <ComicLargeFilesIcon className="w-4 h-4" /> },
    { tab: 'duplicates', label: 'Duplicates', icon: <ComicDuplicatesIcon className="w-4 h-4" /> },
    { tab: 'cleanup', label: 'Cleanup', icon: <ComicCleanupIcon className="w-4 h-4" /> },
    { tab: 'settings', label: 'Settings', icon: <ComicSettingsIcon className="w-4 h-4" /> },
  ];

  return (
    <header className="px-4 py-2.5 border-b-2.5 border-slate-900 bg-gradient-to-r from-sky-300 via-sky-200 to-cyan-300 select-none shadow-sm relative overflow-hidden">
      {/* Subtle halftone dot background texture */}
      <div className="absolute inset-0 bg-comic-dots opacity-40 pointer-events-none" />

      <div className="relative z-10 flex items-center justify-between flex-wrap gap-2">
        {/* Left: Mascot Badge + Comic 3D "BYTEMAP" Logo */}
        <div
          onClick={() => setActiveTab('overview')}
          className="flex items-center space-x-2.5 cursor-pointer group"
          title="Return to Digital Kingdom Overview"
        >
          {/* Mascot Logo Badge with comic glow on hover */}
          <div className="w-11 h-11 rounded-full bg-amber-400 border-2.5 border-slate-900 flex items-center justify-center shadow-comic-sm group-hover:shadow-comic-glow-amber group-hover:scale-110 group-hover:rotate-3 transition-all duration-200 overflow-hidden p-0.5">
            <img
              src="/logo.png"
              alt="ByteMap Explorer Mascot"
              className="w-full h-full object-cover rounded-full"
            />
          </div>

          {/* 3D Comic Text Logo with stacked outline effect */}
          <div className="flex flex-col">
            <h1 className="font-comic text-2xl tracking-wider text-white uppercase comic-text-shadow leading-none">
              BYTEMAP
            </h1>
            <span className="text-[9px] font-fredoka font-bold text-sky-900/70 tracking-widest uppercase leading-none mt-0.5">
              Storage Explorer
            </span>
          </div>
        </div>

        {/* Center: Comic Navigation Tabs */}
        <nav className="flex items-center space-x-1.5 flex-wrap">
          {navItems.map((item) => {
            const isActive = activeTab === item.tab;
            return (
              <button
                key={item.tab}
                onClick={() => setActiveTab(item.tab)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border-2 border-slate-900 font-comic text-xs uppercase tracking-wide transition-all duration-150 ${
                  isActive
                    ? 'bg-amber-400 text-slate-900 shadow-comic translate-y-[-2px] scale-[1.02]'
                    : 'bg-white hover:bg-amber-100 text-slate-700 shadow-comic-sm hover:-translate-y-1 hover:shadow-comic active:translate-y-0.5 active:shadow-comic-sm'
                }`}
              >
                <span className={`text-sm ${isActive ? 'animate-comic-bounce' : ''}`}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Big Action Button — Glossy Cartoon Style */}
        <div>
          <button
            onClick={onOpenScanModal}
            className="flex items-center space-x-2 px-5 py-2 rounded-xl border-2.5 border-slate-900 bg-gradient-to-b from-amber-300 to-amber-500 hover:from-amber-200 hover:to-amber-400 text-slate-900 font-comic text-xs uppercase tracking-wider shadow-comic hover:-translate-y-1 hover:shadow-comic-lg active:translate-y-0.5 active:shadow-comic-sm transition-all duration-150 relative overflow-hidden group"
          >
            {/* Glossy shine sweep */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500 pointer-events-none" />
            <ComicZapIcon className="w-4 h-4 relative animate-comic-starburst" />
            <span className="relative font-bold">Analyze</span>
          </button>
        </div>
      </div>
    </header>
  );
};
