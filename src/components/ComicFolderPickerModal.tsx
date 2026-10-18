import React, { useState, useEffect } from 'react';
import {
  Folder,
  FolderOpen,
  HardDrive,
  Monitor,
  Download,
  FileText,
  Image,
  Video,
  X,
  Check,
  Compass,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import { cleanDisplayPath } from '@/lib/utils';

export interface ComicFolderPickerModalProps {
  isOpen: boolean;
  initialPath?: string;
  onClose: () => void;
  onSelect: (path: string) => void;
}

export const ComicFolderPickerModal: React.FC<ComicFolderPickerModalProps> = ({
  isOpen,
  initialPath = '',
  onClose,
  onSelect,
}) => {
  const { drives } = useAppStore();
  const [selectedPath, setSelectedPath] = useState(initialPath || 'D:\\');
  const [isBrowsingNative, setIsBrowsingNative] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialPath) {
        setSelectedPath(cleanDisplayPath(initialPath));
      } else if (drives.length > 0) {
        setSelectedPath(drives[0].mount_point);
      } else {
        setSelectedPath('D:\\');
      }
    }
  }, [isOpen, initialPath, drives]);

  if (!isOpen) return null;

  // Common quick shortcuts for desktop systems
  const commonShortcuts = [
    { label: 'Desktop', path: 'C:\\Users\\Default\\Desktop', icon: <Monitor className="w-4 h-4 text-amber-600" /> },
    { label: 'Downloads', path: 'C:\\Users\\Default\\Downloads', icon: <Download className="w-4 h-4 text-blue-600" /> },
    { label: 'Documents', path: 'C:\\Users\\Default\\Documents', icon: <FileText className="w-4 h-4 text-emerald-600" /> },
    { label: 'Pictures', path: 'C:\\Users\\Default\\Pictures', icon: <Image className="w-4 h-4 text-pink-600" /> },
    { label: 'Videos', path: 'C:\\Users\\Default\\Videos', icon: <Video className="w-4 h-4 text-purple-600" /> },
  ];

  const handleNativeBrowse = async () => {
    setIsBrowsingNative(true);
    try {
      const nativeDir = await api.selectDirectory();
      if (nativeDir) {
        setSelectedPath(cleanDisplayPath(nativeDir));
      }
    } catch (err) {
      console.error('Native folder picker failed:', err);
    } finally {
      setIsBrowsingNative(false);
    }
  };

  const handleConfirm = () => {
    const trimmed = selectedPath.trim();
    if (trimmed) {
      onSelect(cleanDisplayPath(trimmed));
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 select-none animate-fade-in">
      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-lg bg-white border-3 border-slate-900 rounded-2xl shadow-[8px_8px_0px_#0f172a] p-5 sm:p-6 space-y-4 text-slate-900 animate-comic-pop overflow-hidden">
        {/* Subtle Comic Halftone Dot Background */}
        <div className="absolute inset-0 bg-comic-dots opacity-[0.06] pointer-events-none rounded-2xl" />

        {/* Header with Scout Badge */}
        <div className="relative flex items-center justify-between pb-3 border-b-2 border-slate-900">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-amber-400 border-2.5 border-slate-900 flex items-center justify-center shadow-comic-sm shrink-0 comic-hover-wiggle">
              <FolderOpen className="w-6 h-6 text-slate-900" />
            </div>
            <div>
              <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-400 border border-slate-900 font-bangers text-xs uppercase tracking-wider text-slate-900 mb-0.5 shadow-comic-sm">
                Target Selector 🗺️
              </div>
              <h3 className="font-bangers text-2xl uppercase tracking-wider text-slate-900 leading-none">
                Select Folder or Drive
              </h3>
              <p className="text-xs font-comicNeue font-bold text-slate-600 mt-0.5">
                Choose a storage location to analyze with Scout
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-rose-400 hover:text-white border-2 border-slate-900 flex items-center justify-center shadow-comic-sm transition-all hover:rotate-90 duration-200 text-slate-900"
            title="Cancel"
          >
            <X className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        {/* Path Input Box */}
        <div className="relative space-y-1.5">
          <label className="flex items-center justify-between font-bangers text-xs uppercase tracking-wider text-slate-800">
            <span>Directory Path</span>
            {selectedPath && (
              <span className="text-[11px] font-comicNeue font-bold text-emerald-700 flex items-center gap-1">
                <Check className="w-3 h-3 stroke-[3]" /> Target Set
              </span>
            )}
          </label>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Folder className="w-4 h-4 text-amber-500 fill-amber-300" />
              </div>
              <input
                type="text"
                value={selectedPath}
                onChange={(e) => setSelectedPath(e.target.value)}
                placeholder="e.g. C:\ or D:\Projects"
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border-2 border-slate-900 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:bg-amber-50 focus:border-amber-500 transition-colors"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirm();
                }}
              />
              {selectedPath && (
                <button
                  type="button"
                  onClick={() => setSelectedPath('')}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-rose-500 transition-colors"
                  title="Clear path"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Native OS Picker Button */}
            {api.isNative() && (
              <button
                type="button"
                onClick={handleNativeBrowse}
                disabled={isBrowsingNative}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border-2 border-slate-900 bg-amber-300 hover:bg-amber-400 font-bangers text-xs uppercase tracking-wider shadow-comic-sm transition-all text-slate-900 hover:-translate-y-0.5 active:translate-y-0.5 shrink-0"
                title="Browse using native OS file picker"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Browse...</span>
              </button>
            )}
          </div>
        </div>

        {/* Available Mounted Drives Section */}
        {drives.length > 0 && (
          <div className="relative space-y-1.5">
            <span className="font-bangers text-xs uppercase tracking-wider text-slate-800">
              Mounted Volumes & Disks
            </span>
            <div className="grid grid-cols-2 gap-2">
              {drives.map((d) => {
                const isSelected = selectedPath === d.mount_point;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setSelectedPath(d.mount_point)}
                    className={`p-2.5 rounded-xl border-2 border-slate-900 text-left transition-all flex items-center space-x-2.5 ${
                      isSelected
                        ? 'bg-amber-200 shadow-comic -translate-y-0.5'
                        : 'bg-white hover:bg-slate-50 shadow-comic-sm hover:-translate-y-0.5'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-300 border-1.5 border-slate-900 flex items-center justify-center shrink-0">
                      <HardDrive className="w-4 h-4 text-slate-900 stroke-[2.2]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bangers text-sm text-slate-900 uppercase truncate leading-none">
                        {d.name || d.mount_point}
                      </div>
                      <div className="text-[10px] font-mono text-slate-600 truncate mt-0.5">
                        {d.mount_point} • {d.filesystem || 'NTFS'}
                      </div>
                    </div>
                    {isSelected && (
                      <span className="text-emerald-700 font-bold text-xs">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick System Shortcuts */}
        <div className="relative space-y-1.5">
          <span className="font-bangers text-xs uppercase tracking-wider text-slate-800">
            Quick System Shortcuts
          </span>
          <div className="flex flex-wrap gap-1.5">
            {commonShortcuts.map((sc) => (
              <button
                key={sc.label}
                type="button"
                onClick={() => setSelectedPath(sc.path)}
                className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border-2 border-slate-900 text-xs font-comicNeue font-bold shadow-comic-sm transition-all hover:-translate-y-0.5 ${
                  selectedPath === sc.path
                    ? 'bg-amber-300 text-slate-900 shadow-comic'
                    : 'bg-slate-50 hover:bg-amber-100 text-slate-800'
                }`}
              >
                {sc.icon}
                <span>{sc.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="relative flex items-center justify-end space-x-3 pt-3 border-t-2 border-slate-900">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border-2 border-slate-900 bg-slate-100 hover:bg-slate-200 font-bangers text-sm uppercase tracking-wider shadow-comic-sm transition-all text-slate-800 hover:-translate-y-0.5 active:translate-y-0.5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedPath.trim()}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl border-2.5 border-slate-900 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 font-bangers text-sm uppercase tracking-wider text-slate-900 shadow-comic transition-all hover:-translate-y-0.5 hover:shadow-comic-lg active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            <Compass className="w-4 h-4 text-slate-900" />
            <span>Scout Target</span>
          </button>
        </div>
      </div>
    </div>
  );
};
