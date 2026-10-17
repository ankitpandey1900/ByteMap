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

export function getCategoryColor(category: FileCategory): string {
  switch (category) {
    case 'video':
      return '#3b82f6'; // Blue
    case 'image':
      return '#ec4899'; // Pink
    case 'audio':
      return '#8b5cf6'; // Violet
    case 'document':
      return '#10b981'; // Emerald
    case 'archive':
      return '#f59e0b'; // Amber
    case 'app':
      return '#06b6d4'; // Cyan
    case 'dev':
      return '#6366f1'; // Indigo
    case 'game':
      return '#f97316'; // Orange
    case 'other':
    default:
      return '#64748b'; // Slate
  }
}

export function getCategoryBadgeClass(category: FileCategory): string {
  switch (category) {
    case 'video':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'image':
      return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
    case 'audio':
      return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    case 'document':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'archive':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'app':
      return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
    case 'dev':
      return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    case 'game':
      return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    case 'other':
    default:
      return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  }
}
