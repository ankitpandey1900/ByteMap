import React from 'react';
import { useAppStore } from '@/lib/store';
import { ActiveTab } from '@/types';

interface ComicHeaderProps {
  onOpenScanModal: () => void;
}

export const ComicHeader: React.FC<ComicHeaderProps> = ({ onOpenScanModal }) => {
  const { activeTab, setActiveTab } = useAppStore();

  const navItems: { tab: ActiveTab; label: string; icon: string }[] = [
    { tab: 'overview', label: 'Kingdom', icon: '🗺️' },
    { tab: 'drives', label: 'Drives', icon: '💾' },
    { tab: 'explore', label: 'Explore', icon: '🔍' },
    { tab: 'large-files', label: 'Large Files', icon: '📁' },
    { tab: 'duplicates', label: 'Duplicates', icon: '📑' },
    { tab: 'cleanup', label: 'Cleanup', icon: '🧹' },
    { tab: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <header className="px-4 py-2.5 border-b-2.5 border-slate-900 bg-sky-300 select-none shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-2">
        {/* Left: Compass Badge + Comic 3D "BYTEMAP" Logo */}
        <div
          onClick={() => setActiveTab('overview')}
          className="flex items-center space-x-2.5 cursor-pointer group"
          title="Return to Digital Kingdom Overview"
        >
          {/* Mascot Logo Badge */}
          <div className="w-10 h-10 rounded-full bg-amber-400 border-2.5 border-slate-900 flex items-center justify-center shadow-comic-sm group-hover:rotate-6 group-hover:scale-105 transition-transform overflow-hidden p-0.5">
            <img
              src="/logo.png"
              alt="ByteMap Explorer Mascot"
              className="w-full h-full object-cover rounded-full"
            />
          </div>

          {/* 3D Comic Text Logo */}
          <div>
            <h1 className="font-comic text-2xl tracking-wider text-white uppercase drop-shadow-[2px_2px_0px_#0f172a] [text-shadow:2px_2px_0px_#0f172a,-1px_-1px_0px_#0f172a,1px_-1px_0px_#0f172a,-1px_1px_0px_#0f172a,2px_0px_0px_#0f172a]">
              BYTEMAP
            </h1>
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
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border-2 border-slate-900 font-comic text-xs uppercase tracking-wide transition-all ${
                  isActive
                    ? 'bg-amber-400 text-slate-900 shadow-comic translate-y-[-1px]'
                    : 'bg-white hover:bg-amber-100 text-slate-700 shadow-comic-sm hover:-translate-y-0.5'
                }`}
              >
                <span className="text-sm">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Big Glossy Action Button (ANALYZE / SCOUT) */}
        <div>
          <button
            onClick={onOpenScanModal}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl border-2.5 border-slate-900 bg-amber-400 hover:bg-amber-300 text-slate-900 font-comic text-xs uppercase tracking-wider shadow-comic hover:-translate-y-0.5 active:translate-y-0.5 transition-all"
          >
            <span className="text-sm">⚡</span>
            <span>Analyze</span>
          </button>
        </div>
      </div>
    </header>
  );
};
