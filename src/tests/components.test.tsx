import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Sidebar } from '@/components/Sidebar';

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

describe('Sidebar Component', () => {
  it('renders all 8 primary navigation tabs', () => {
    render(<Sidebar />);

    expect(screen.getByText('ByteMap')).toBeDefined();
    expect(screen.getByText('Overview')).toBeDefined();
    expect(screen.getByText('Drives')).toBeDefined();
    expect(screen.getByText('Explore')).toBeDefined();
    expect(screen.getByText('Large Files')).toBeDefined();
    expect(screen.getByText('File Types')).toBeDefined();
    expect(screen.getByText('Duplicates')).toBeDefined();
    expect(screen.getByText('Cleanup')).toBeDefined();
    expect(screen.getByText('Settings')).toBeDefined();
  });

  it('renders memory-only privacy notice in sidebar', () => {
    render(<Sidebar />);
    expect(screen.getByText('Local & Memory-Only')).toBeDefined();
  });
});
