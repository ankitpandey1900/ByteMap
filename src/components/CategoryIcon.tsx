import React from 'react';
import {
  Film,
  Image as ImageIcon,
  FileText,
  Archive,
  FileCode,
  Terminal,
  Music,
  Gamepad2,
  Folder,
  Layers,
} from 'lucide-react';
import { FileCategory } from '@/types';

interface CategoryIconProps {
  category?: FileCategory | string;
  className?: string;
  size?: number;
}

/**
 * Returns a crisp, modern vector Lucide icon for any file category,
 * completely replacing low-res OS emojis with clean vector graphics.
 */
export const CategoryIcon: React.FC<CategoryIconProps> = ({
  category = 'other',
  className = 'w-4 h-4',
  size,
}) => {
  const cat = category?.toLowerCase();
  const iconProps = { className, ...(size ? { size } : {}) };

  switch (cat) {
    case 'video':
    case 'videos':
    case 'media':
      return <Film {...iconProps} className={`${className} text-blue-600`} />;
    case 'image':
    case 'images':
    case 'photo':
    case 'photos':
      return <ImageIcon {...iconProps} className={`${className} text-pink-600`} />;
    case 'document':
    case 'documents':
    case 'doc':
    case 'docs':
      return <FileText {...iconProps} className={`${className} text-emerald-600`} />;
    case 'archive':
    case 'archives':
    case 'zip':
    case 'compressed':
      return <Archive {...iconProps} className={`${className} text-amber-600`} />;
    case 'dev':
    case 'code':
    case 'developer':
      return <FileCode {...iconProps} className={`${className} text-indigo-600`} />;
    case 'app':
    case 'application':
    case 'applications':
    case 'system':
      return <Terminal {...iconProps} className={`${className} text-cyan-600`} />;
    case 'audio':
    case 'music':
    case 'sound':
      return <Music {...iconProps} className={`${className} text-purple-600`} />;
    case 'game':
    case 'games':
      return <Gamepad2 {...iconProps} className={`${className} text-orange-600`} />;
    case 'other':
      return <Folder {...iconProps} className={`${className} text-slate-600`} />;
    default:
      return <Layers {...iconProps} className={`${className} text-slate-600`} />;
  }
};

/**
 * A stylized comic badge wrapping the vector category icon with
 * solid ink border and shadow.
 */
export const CategoryBadge: React.FC<{
  category?: FileCategory | string;
  sizeClass?: string;
  iconClass?: string;
  bgClass?: string;
}> = ({
  category = 'other',
  sizeClass = 'w-6 h-6',
  iconClass = 'w-3.5 h-3.5',
  bgClass = 'bg-white',
}) => {
  return (
    <div
      className={`${sizeClass} ${bgClass} rounded-lg border-1.5 border-slate-900 shadow-[1.5px_1.5px_0px_#0f172a] flex items-center justify-center shrink-0`}
    >
      <CategoryIcon category={category} className={iconClass} />
    </div>
  );
};
