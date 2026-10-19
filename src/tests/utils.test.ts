import { describe, it, expect } from 'vitest';
import {
  formatBytes,
  formatNumber,
  formatDuration,
  formatDate,
  getCategoryColor,
  cleanDisplayPath,
  findDriveForPath,
} from '@/lib/utils';
import { DriveInfo } from '@/types';

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

describe('findDriveForPath utility', () => {
  const mockDrives: DriveInfo[] = [
    {
      id: 'c',
      name: 'WINDOWS-SSD (C:)',
      mount_point: 'C:\\',
      filesystem: 'NTFS',
      total_bytes: 300000000000,
      available_bytes: 30000000000,
      used_bytes: 270000000000,
      is_removable: false,
      is_read_only: false,
    },
    {
      id: 'e',
      name: 'DATA (E:)',
      mount_point: 'E:\\',
      filesystem: 'NTFS',
      total_bytes: 1000000000000,
      available_bytes: 500000000000,
      used_bytes: 500000000000,
      is_removable: false,
      is_read_only: false,
    },
    {
      id: 'backup',
      name: 'Backup Volume',
      mount_point: '/Volumes/Backup',
      filesystem: 'APFS',
      total_bytes: 2000000000000,
      available_bytes: 1000000000000,
      used_bytes: 1000000000000,
      is_removable: true,
      is_read_only: false,
    },
    {
      id: 'root',
      name: 'Macintosh HD',
      mount_point: '/',
      filesystem: 'APFS',
      total_bytes: 500000000000,
      available_bytes: 200000000000,
      used_bytes: 300000000000,
      is_removable: false,
      is_read_only: false,
    },
  ];

  it('matches Windows drive letter with extended NT prefix \\\\?\\E:\\', () => {
    const matched = findDriveForPath('\\\\?\\E:\\', mockDrives);
    expect(matched?.id).toBe('e');
    expect(matched?.name).toBe('DATA (E:)');
  });

  it('matches subfolder on Windows drive \\\\?\\E:\\Games\\Cyberpunk', () => {
    const matched = findDriveForPath('\\\\?\\E:\\Games\\Cyberpunk', mockDrives);
    expect(matched?.id).toBe('e');
  });

  it('matches normal C:\\ drive path', () => {
    const matched = findDriveForPath('C:\\Users\\ankit\\Downloads', mockDrives);
    expect(matched?.id).toBe('c');
  });

  it('matches Unix mount point hierarchy correctly', () => {
    const external = findDriveForPath('/Volumes/Backup/Photos', mockDrives);
    expect(external?.id).toBe('backup');

    const root = findDriveForPath('/Users/macuser/Desktop', mockDrives);
    expect(root?.id).toBe('root');
  });

  it('returns null when path is empty or drives empty', () => {
    expect(findDriveForPath('', mockDrives)).toBeNull();
    expect(findDriveForPath(undefined, mockDrives)).toBeNull();
    expect(findDriveForPath('E:\\', [])).toBeNull();
  });
});

