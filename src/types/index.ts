export type FileCategory =
  | 'video'
  | 'image'
  | 'audio'
  | 'document'
  | 'archive'
  | 'app'
  | 'dev'
  | 'game'
  | 'other';

export interface DriveInfo {
  id: string;
  name: string;
  mount_point: string;
  filesystem: string;
  total_bytes: number;
  available_bytes: number;
  used_bytes: number;
  is_removable: boolean;
  is_read_only: boolean;
}

export interface ScanOptions {
  root_path: string;
  exclude_hidden: boolean;
  exclude_patterns: string[];
  follow_symlinks: boolean;
  deep_duplicate_scan: boolean;
}

export type ScanStatus =
  | 'idle'
  | 'scanning'
  | 'aggregating'
  | 'hashing'
  | 'completed'
  | 'cancelled'
  | 'failed';

export interface ScanProgress {
  status: ScanStatus;
  scanned_files: number;
  scanned_directories: number;
  scanned_bytes: number;
  current_path: string;
  elapsed_ms: number;
  error_count: number;
}

export interface ScannedFile {
  id: string;
  name: string;
  path: string;
  size_bytes: number;
  category: FileCategory;
  extension: string;
  modified_at?: number; // epoch ms
  is_hidden: boolean;
  is_system: boolean;
}

export interface ScannedFolder {
  id: string;
  name: string;
  path: string;
  size_bytes: number;
  file_count: number;
  dir_count: number;
  children_dirs?: ScannedFolder[];
}

export interface CategorySummary {
  category: FileCategory;
  total_bytes: number;
  file_count: number;
  percentage: number;
}

export interface ExtensionSummary {
  extension: string;
  category: FileCategory;
  total_bytes: number;
  file_count: number;
}

export interface DuplicateGroup {
  hash: string;
  size_bytes: number;
  reclaimable_bytes: number;
  files: ScannedFile[];
}

export type CleanupType =
  | 'duplicate'
  | 'old_installer'
  | 'large_download'
  | 'temp_file'
  | 'large_archive'
  | 'custom';

export type RiskLevel = 'safe' | 'low' | 'moderate';

export interface CleanupCandidate {
  id: string;
  type: CleanupType;
  title: string;
  description: string;
  risk_level: RiskLevel;
  risk_explanation: string;
  file: ScannedFile;
  suggested_action: 'trash' | 'delete';
}

export interface ScanError {
  path: string;
  error: string;
}

export interface ScanSummary {
  root_path: string;
  total_bytes: number;
  total_files: number;
  total_directories: number;
  scan_duration_ms: number;
  error_count: number;
  errors: ScanError[];
  largest_files: ScannedFile[];
  largest_folders: ScannedFolder[];
  categories: CategorySummary[];
  extensions: ExtensionSummary[];
  duplicate_groups: DuplicateGroup[];
  cleanup_candidates: CleanupCandidate[];
  timestamp: string;
}

export interface TreemapNode {
  name: string;
  path: string;
  value: number;
  category?: FileCategory;
  is_dir: boolean;
  children?: TreemapNode[];
  file_count?: number;
}

export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  unit: 'binary' | 'decimal'; // binary = 1024 (GiB), decimal = 1000 (GB)
  large_file_threshold_mb: number;
  auto_hash_duplicates: boolean;
  prefer_trash: boolean;
  show_system_files: boolean;
  default_excludes: string[];
}

export type ActiveTab =
  | 'overview'
  | 'drives'
  | 'explore'
  | 'large-files'
  | 'file-types'
  | 'duplicates'
  | 'cleanup'
  | 'settings';
