import React from 'react';
import {
  LayoutDashboard,
  HardDrive,
  FolderTree,
  FileText,
  PieChart,
  Copy,
  Trash2,
  Settings,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { ActiveTab } from '@/types';

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, scanSummary } = useAppStore();

  const navItems: NavItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'drives', label: 'Drives', icon: HardDrive },
    { id: 'explore', label: 'Explore', icon: FolderTree },
    { id: 'large-files', label: 'Large Files', icon: FileText },
    { id: 'file-types', label: 'File Types', icon: PieChart },
    {
      id: 'duplicates',
      label: 'Duplicates',
      icon: Copy,
      badge:
        scanSummary && scanSummary.duplicate_groups.length > 0
          ? `${scanSummary.duplicate_groups.length}`
          : undefined,
    },
    {
      id: 'cleanup',
      label: 'Cleanup',
      icon: Trash2,
      badge:
        scanSummary && scanSummary.cleanup_candidates.length > 0
          ? `${scanSummary.cleanup_candidates.length}`
          : undefined,
    },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-56 h-screen flex flex-col bg-sidebar border-r border-sidebar-border select-none shrink-0">
      {/* Brand logo header */}
      <div className="p-4 flex items-center space-x-3 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
          <svg
            className="w-5 h-5 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M3 9h18" />
            <path d="M9 21V9" />
          </svg>
        </div>
        <div>
          <h1 className="font-bold text-sm text-foreground tracking-tight flex items-center space-x-1">
            <span>ByteMap</span>
          </h1>
          <p className="text-[10px] text-muted-foreground font-mono">Storage Intelligence</p>
        </div>
      </div>

      {/* Navigation menu */}
      <nav className="flex-1 px-2.5 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold font-mono ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-primary/10 text-primary'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom privacy badge */}
      <div className="p-3 border-t border-sidebar-border m-2 rounded-xl bg-card/40 border border-border/40 text-[11px] text-muted-foreground">
        <div className="flex items-center space-x-1.5 text-foreground font-medium mb-1">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Local & Memory-Only</span>
        </div>
        <p className="text-[10px] leading-tight">
          No external database. All scan data resides strictly in volatile memory.
        </p>
      </div>
    </aside>
  );
};
