import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { FileCategory } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format bytes into human-readable string with binary (1024) or decimal (1000) base.
 */
export function formatBytes(bytes: number, mode: 'binary' | 'decimal' = 'binary'): string {
  if (bytes === 0 || isNaN(bytes) || !isFinite(bytes)) return '0 B';
  if (bytes < 0) return `-${formatBytes(Math.abs(bytes), mode)}`;

  const base = mode === 'binary' ? 1024 : 1000;
  const units = mode === 'binary' 
    ? ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'] 
    : ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(base)),
    units.length - 1
  );

  const value = bytes / Math.pow(base, exponent);
  // Show 0 decimals for B, 2 decimals for KB/MB/GB/TB
  const decimals = exponent === 0 ? 0 : value >= 100 ? 1 : 2;
  return `${value.toFixed(decimals)} ${units[exponent]}`;
}

export function formatNumber(num: number): string {
  if (isNaN(num)) return '0';
  return new Intl.NumberFormat('en-US').format(num);
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = (ms / 1000).toFixed(1);
  if (ms < 60000) return `${seconds}s`;
  const minutes = Math.floor(ms / 60000);
  const remainingSeconds = Math.round((ms % 60000) / 1000);
  return `${minutes}m ${remainingSeconds}s`;
}

export function formatDate(timestamp?: number): string {
  if (!timestamp) return 'Unknown';
  try {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Invalid date';
  }
}

export function getCategoryColor(category: FileCategory | string): string {
  switch (category?.toLowerCase()) {
    case 'video':
    case 'media':
      return '#3b82f6'; // Comic Royal Blue
    case 'app':
    case 'applications':
    case 'system':
      return '#ef4444'; // Comic Crimson Red
    case 'image':
    case 'images':
      return '#ec4899'; // Comic Hot Pink
    case 'document':
    case 'documents':
      return '#10b981'; // Comic Emerald Green
    case 'audio':
    case 'music':
      return '#8b5cf6'; // Comic Electric Violet
    case 'archive':
    case 'archives':
    case 'zip':
      return '#f59e0b'; // Comic Warm Amber Gold
    case 'dev':
    case 'code':
      return '#06b6d4'; // Comic Cyan
    case 'game':
    case 'games':
      return '#f97316'; // Comic Tangerine
    case 'other':
    default:
      return '#64748b'; // Comic Slate Charcoal
  }
}

export function getCategoryEmoji(category: FileCategory | string): string {
  switch (category?.toLowerCase()) {
    case 'video':
    case 'media':
      return '🎬';
    case 'app':
    case 'applications':
    case 'system':
      return '⚙️';
    case 'image':
    case 'images':
      return '🖼️';
    case 'document':
    case 'documents':
      return '📄';
    case 'audio':
    case 'music':
      return '🎵';
    case 'archive':
    case 'archives':
    case 'zip':
      return '📦';
    case 'dev':
    case 'code':
      return '💻';
    case 'game':
    case 'games':
      return '🎮';
    case 'other':
    default:
      return '📁';
  }
}

export function getCategoryBadgeClass(category: FileCategory | string): string {
  switch (category?.toLowerCase()) {
    case 'video':
      return 'bg-blue-100 text-blue-900 border-2 border-slate-900 shadow-comic-sm';
    case 'image':
      return 'bg-pink-100 text-pink-900 border-2 border-slate-900 shadow-comic-sm';
    case 'audio':
      return 'bg-purple-100 text-purple-900 border-2 border-slate-900 shadow-comic-sm';
    case 'document':
      return 'bg-emerald-100 text-emerald-900 border-2 border-slate-900 shadow-comic-sm';
    case 'archive':
      return 'bg-amber-100 text-amber-900 border-2 border-slate-900 shadow-comic-sm';
    case 'app':
      return 'bg-red-100 text-red-900 border-2 border-slate-900 shadow-comic-sm';
    case 'dev':
      return 'bg-cyan-100 text-cyan-900 border-2 border-slate-900 shadow-comic-sm';
    case 'game':
      return 'bg-orange-100 text-orange-900 border-2 border-slate-900 shadow-comic-sm';
    case 'other':
    default:
      return 'bg-slate-100 text-slate-800 border-2 border-slate-900 shadow-comic-sm';
  }
}
