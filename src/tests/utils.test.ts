import { describe, it, expect } from 'vitest';
import {
  formatBytes,
  formatNumber,
  formatDuration,
  formatDate,
  getCategoryColor,
  cleanDisplayPath,
} from '@/lib/utils';

describe('formatBytes utility', () => {
  it('formats zero bytes correctly', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(0, 'decimal')).toBe('0 B');
  });

  it('formats binary units (1024 base) accurately', () => {
    expect(formatBytes(512, 'binary')).toBe('512 B');
    expect(formatBytes(1024, 'binary')).toBe('1.00 KiB');
    expect(formatBytes(1024 * 1024, 'binary')).toBe('1.00 MiB');
    expect(formatBytes(1536 * 1024 * 1024, 'binary')).toBe('1.50 GiB');
    expect(formatBytes(1024 * 1024 * 1024 * 1024, 'binary')).toBe('1.00 TiB');
  });

  it('formats decimal units (1000 base) accurately', () => {
    expect(formatBytes(500, 'decimal')).toBe('500 B');
    expect(formatBytes(1000, 'decimal')).toBe('1.00 KB');
    expect(formatBytes(1000 * 1000, 'decimal')).toBe('1.00 MB');
    expect(formatBytes(1500 * 1000 * 1000, 'decimal')).toBe('1.50 GB');
    expect(formatBytes(1000 * 1000 * 1000 * 1000, 'decimal')).toBe('1.00 TB');
  });

  it('handles negative bytes safely', () => {
    expect(formatBytes(-1024, 'binary')).toBe('-1.00 KiB');
  });

  it('handles invalid input safely', () => {
    expect(formatBytes(NaN)).toBe('0 B');
    expect(formatBytes(Infinity)).toBe('0 B');
  });
});

describe('formatNumber utility', () => {
  it('formats thousands separators', () => {
    expect(formatNumber(1000)).toBe('1,000');
    expect(formatNumber(1234567)).toBe('1,234,567');
  });
});

describe('formatDuration utility', () => {
  it('formats milliseconds', () => {
    expect(formatDuration(450)).toBe('450ms');
  });

  it('formats seconds', () => {
    expect(formatDuration(2500)).toBe('2.5s');
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(65000)).toBe('1m 5s');
    expect(formatDuration(125000)).toBe('2m 5s');
  });
});

describe('formatDate utility', () => {
  it('formats valid epoch timestamp or returns Unknown', () => {
    expect(formatDate(undefined)).toBe('Unknown');
    expect(formatDate(0)).toBe('Unknown');
    const formatted = formatDate(1700000000000);
    expect(typeof formatted).toBe('string');
    expect(formatted.length).toBeGreaterThan(0);
  });
});

describe('getCategoryColor utility', () => {
  it('returns appropriate hex color for categories', () => {
    expect(getCategoryColor('video')).toBe('#3b82f6');
    expect(getCategoryColor('image')).toBe('#ec4899');
    expect(getCategoryColor('document')).toBe('#10b981');
    expect(getCategoryColor('other')).toBe('#64748b');
  });
});

describe('cleanDisplayPath utility', () => {
  it('strips Windows NT extended prefix \\\\?\\', () => {
    expect(cleanDisplayPath('\\\\?\\E:\\Download\\file.mp4')).toBe('E:\\Download\\file.mp4');
    expect(cleanDisplayPath('\\\\?\\UNC\\server\\share\\file.txt')).toBe('\\\\server\\share\\file.txt');
    expect(cleanDisplayPath('C:\\normal\\path.zip')).toBe('C:\\normal\\path.zip');
    expect(cleanDisplayPath('')).toBe('');
  });
});

