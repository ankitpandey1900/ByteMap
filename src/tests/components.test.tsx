import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ComicHeader } from '@/components/ComicHeader';
import { ScoutMascot } from '@/components/ScoutMascot';
import { ScanModal } from '@/components/ScanModal';

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

describe('ComicHeader Component', () => {
  it('renders application branding and cartoon adventure badge', () => {
    render(<ComicHeader onOpenScanModal={() => {}} />);

    expect(screen.getByText('BYTEMAP')).toBeDefined();
    expect(screen.getByText(/analyze/i)).toBeDefined();
    expect(screen.getByText(/kingdom/i)).toBeDefined();
    expect(screen.getByText(/drives/i)).toBeDefined();
    expect(screen.getByText(/explore/i)).toBeDefined();
    expect(screen.getByText(/large files/i)).toBeDefined();
    expect(screen.getByText(/duplicates/i)).toBeDefined();
    expect(screen.getByText(/cleanup/i)).toBeDefined();
    expect(screen.getByText(/settings/i)).toBeDefined();
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
  it('renders dialog elements when opened', () => {
    render(<ScanModal isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('Configure Storage Scan')).toBeDefined();
    expect(screen.getByText('Scan Target Directory or Drive')).toBeDefined();
    expect(screen.getByText('Scanning Options')).toBeDefined();
    expect(screen.getByText('Start Scan')).toBeDefined();
  });
});
