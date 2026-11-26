import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ComicHeader } from '@/components/ComicHeader';
import { ScoutMascot } from '@/components/ScoutMascot';
import { ScanModal } from '@/components/ScanModal';
import { ConfirmCleanupModal } from '@/components/ConfirmCleanupModal';
import { ExplorerTab } from '@/features/explorer/ExplorerTab';
import { DigitalKingdomView } from '@/features/overview/DigitalKingdomView';
import { useAppStore } from '@/lib/store';
import { ScanSummary } from '@/types';

// Mock Tauri invoke & listen APIs
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn().mockResolvedValue(() => {}),
}));

vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn(),
}));

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

beforeEach(() => {
  localStorage.clear();
  useAppStore.getState().clearScan();
  useAppStore.getState().setSearchQuery('');
});

describe('ComicHeader Component', () => {
  it('renders application branding, File Types tab, and theme toggle', () => {
    render(<ComicHeader onOpenScanModal={() => {}} />);

    expect(screen.getByText('BYTEMAP')).toBeDefined();
    expect(screen.getByText(/analyze/i)).toBeDefined();
    expect(screen.getByText(/kingdom/i)).toBeDefined();
    expect(screen.getByText(/drives/i)).toBeDefined();
    expect(screen.getAllByText(/explore/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/large files/i)).toBeDefined();
    expect(screen.getByText(/file types/i)).toBeDefined();
    expect(screen.getByText(/duplicates/i)).toBeDefined();
    expect(screen.getByText(/cleanup/i)).toBeDefined();
    expect(screen.getByText(/settings/i)).toBeDefined();
    expect(screen.getByLabelText(/switch to dark theme/i)).toBeDefined();
  });
});

describe('ScoutMascot Component', () => {
  it('renders scout status text and avatar', () => {
    render(<ScoutMascot isScanning={false} statusText="Scout Ready • Click ANALYZE" />);
    expect(screen.getByText('Scout Ready', { exact: true })).toBeDefined();
    expect(screen.getByText('Scout Ready • Click ANALYZE')).toBeDefined();
  });

  it('renders scouting active animation badge when scanning', () => {
    render(<ScoutMascot isScanning={true} statusText="Scanning drive..." />);
    expect(screen.getByText(/active scanning/i)).toBeDefined();
    expect(screen.getByText('Scanning drive...')).toBeDefined();
  });
});

describe('ScanModal Component', () => {
  it('renders accessible dialog elements when opened', () => {
    render(<ScanModal isOpen={true} onClose={() => {}} />);
    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText('Configure Storage Scan')).toBeDefined();
    expect(screen.getByText('Scan Target Directory or Drive')).toBeDefined();
    expect(screen.getByText('Scanning Options')).toBeDefined();
    expect(screen.getByText('Start Scan')).toBeDefined();
  });
});

describe('ConfirmCleanupModal Component', () => {
  it('renders accessible dialog and triggers Escape to cancel', () => {
    const onCancel = vi.fn();
    render(
      <ConfirmCleanupModal
        isOpen={true}
        targets={[{ name: 'movie.mkv', path: 'D:\\movie.mkv', size_bytes: 1024 * 1024 }]}
        preferTrash={true}
        unit="binary"
        onConfirm={() => {}}
        onCancel={onCancel}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(screen.getByText('movie.mkv')).toBeDefined();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

describe('ExplorerTab & DigitalKingdomView Audit Fixes', () => {
  it('syncs store searchQuery directly into ExplorerTab for extension drilldown', () => {
    const mockSummary: ScanSummary = {
      root_path: 'C:\\Test',
      total_bytes: 3000,
      total_files: 2,
      total_directories: 1,
      scan_duration_ms: 10,
      error_count: 0,
      errors: [],
      largest_files: [
        {
          id: '1',
          name: 'clip.mp4',
          path: 'C:\\Test\\clip.mp4',
          size_bytes: 2000,
          category: 'video',
          extension: 'mp4',
          is_hidden: false,
          is_system: false,
        },
        {
          id: '2',
          name: 'notes.pdf',
          path: 'C:\\Test\\notes.pdf',
          size_bytes: 1000,
          category: 'document',
          extension: 'pdf',
          is_hidden: false,
          is_system: false,
        },
      ],
      largest_folders: [],
      categories: [],
      extensions: [],
      duplicate_groups: [],
      cleanup_candidates: [],
      timestamp: new Date().toISOString(),
    };

    useAppStore.getState().setScanSummary(mockSummary);
    useAppStore.getState().setSearchQuery('.mp4');

    render(<ExplorerTab onOpenScanModal={() => {}} />);
    expect(screen.getByText('clip.mp4')).toBeDefined();
    expect(screen.queryByText('notes.pdf')).toBeNull();
  });

  it('renders a calm focused Welcome screen on first open before any scan', () => {
    render(<DigitalKingdomView onOpenScanModal={() => {}} />);
    expect(screen.getByText(/See Where Your Disk Space Went/i)).toBeDefined();
    expect(screen.getByText(/Scan Storage Now/i)).toBeDefined();
    expect(screen.queryByText(/\+150\.00 MB\/day/i)).toBeNull();
  });

  it('syncs Treemap colors and legend 1:1 with File Type Breakdown categories', () => {
    const mockSummary: ScanSummary = {
      root_path: 'C:\\',
      total_bytes: 1000,
      total_files: 2,
      total_directories: 1,
      scan_duration_ms: 10,
      error_count: 0,
      errors: [],
      largest_files: [
        {
          id: 'app-1',
          name: 'chrome.dll',
          path: 'C:\\chrome.dll',
          size_bytes: 700,
          category: 'app',
          extension: 'dll',
          is_hidden: false,
          is_system: false,
        },
        {
          id: 'game-1',
          name: 'save.pak',
          path: 'C:\\save.pak',
          size_bytes: 300,
          category: 'game',
          extension: 'pak',
          is_hidden: false,
          is_system: false,
        },
      ],
      largest_folders: [],
      categories: [
        { category: 'app', total_bytes: 700, file_count: 1, percentage: 70 },
        { category: 'game', total_bytes: 300, file_count: 1, percentage: 30 },
      ],
      extensions: [],
      duplicate_groups: [],
      cleanup_candidates: [],
      timestamp: new Date().toISOString(),
    };

    useAppStore.getState().setScanSummary(mockSummary);
    const { container } = render(<DigitalKingdomView onOpenScanModal={() => {}} />);

    // Both 'app' and 'game' appear in the synced Legend
    expect(screen.getByTitle('Click to spotlight game files')).toBeDefined();
    // First treemap rect (app) uses the exact canonical App red (#ef4444)
    const firstRect = container.querySelector('svg[aria-label="Interactive Storage Treemap"] rect');
    expect(firstRect?.getAttribute('fill')).toBe('#ef4444');
  });
});
