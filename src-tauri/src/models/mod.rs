use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum FileCategory {
    Video,
    Image,
    Audio,
    Document,
    Archive,
    App,
    Dev,
    Game,
    Other,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DriveInfo {
    pub id: String,
    pub name: String,
    pub mount_point: String,
    pub filesystem: String,
    pub total_bytes: u64,
    pub available_bytes: u64,
    pub used_bytes: u64,
    pub is_removable: bool,
    pub is_read_only: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanOptions {
    pub root_path: String,
    pub exclude_hidden: bool,
    pub exclude_patterns: Vec<String>,
    pub follow_symlinks: bool,
    pub deep_duplicate_scan: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ScanStatus {
    Idle,
    Scanning,
    Aggregating,
    Hashing,
    Completed,
    Cancelled,
    Failed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanProgress {
    pub status: ScanStatus,
    pub scanned_files: u64,
    pub scanned_directories: u64,
    pub scanned_bytes: u64,
    pub current_path: String,
    pub elapsed_ms: u64,
    pub error_count: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScannedFile {
    pub id: String,
    pub name: String,
    pub path: String,
    pub size_bytes: u64,
    pub category: FileCategory,
    pub extension: String,
    pub modified_at: Option<u64>,
    pub is_hidden: bool,
    pub is_system: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScannedFolder {
    pub id: String,
    pub name: String,
    pub path: String,
    pub size_bytes: u64,
    pub file_count: u64,
    pub dir_count: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub children_dirs: Option<Vec<ScannedFolder>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CategorySummary {
    pub category: FileCategory,
    pub total_bytes: u64,
    pub file_count: u64,
    pub percentage: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtensionSummary {
    pub extension: String,
    pub category: FileCategory,
    pub total_bytes: u64,
    pub file_count: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DuplicateGroup {
    pub hash: String,
    pub size_bytes: u64,
    pub reclaimable_bytes: u64,
    pub files: Vec<ScannedFile>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum CleanupType {
    Duplicate,
    OldInstaller,
    LargeDownload,
    TempFile,
    LargeArchive,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum RiskLevel {
    Safe,
    Low,
    Moderate,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CleanupCandidate {
    pub id: String,
    pub r#type: CleanupType,
    pub title: String,
    pub description: String,
    pub risk_level: RiskLevel,
    pub risk_explanation: String,
    pub file: ScannedFile,
    pub suggested_action: String, // "trash" or "delete"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanError {
    pub path: String,
    pub error: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanSummary {
    pub root_path: String,
    pub total_bytes: u64,
    pub total_files: u64,
    pub total_directories: u64,
    pub scan_duration_ms: u64,
    pub error_count: u64,
    pub errors: Vec<ScanError>,
    pub largest_files: Vec<ScannedFile>,
    pub largest_folders: Vec<ScannedFolder>,
    pub categories: Vec<CategorySummary>,
    pub extensions: Vec<ExtensionSummary>,
    pub duplicate_groups: Vec<DuplicateGroup>,
    pub cleanup_candidates: Vec<CleanupCandidate>,
    pub timestamp: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub theme: String,
    pub unit: String,
    pub large_file_threshold_mb: u64,
    pub auto_hash_duplicates: bool,
    pub prefer_trash: bool,
    pub show_system_files: bool,
    pub default_excludes: Vec<String>,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            theme: "dark".to_string(),
            unit: "binary".to_string(),
            large_file_threshold_mb: 100,
            auto_hash_duplicates: false,
            prefer_trash: true,
            show_system_files: false,
            default_excludes: vec![
                "$RECYCLE.BIN".to_string(),
                "System Volume Information".to_string(),
                ".git".to_string(),
                "node_modules".to_string(),
            ],
        }
    }
}
