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
  Shield,
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
      return <FileCode {...iconProps} className={`${className} text-cyan-600`} />;
    case 'app':
    case 'application':
    case 'applications':
      return <Terminal {...iconProps} className={`${className} text-red-600`} />;
    case 'system':
    case 'os':
      return <Shield {...iconProps} className={`${className} text-indigo-600`} />;
    case 'audio':
    case 'music':
    case 'sound':
      return <Music {...iconProps} className={`${className} text-violet-600`} />;
    case 'game':
    case 'games':
      return <Gamepad2 {...iconProps} className={`${className} text-orange-600`} />;
    case 'other':
      return <Folder {...iconProps} className={`${className} text-slate-600`} />;
    default:
      return <Layers {...iconProps} className={`${className} text-slate-600`} />;
  }
};
