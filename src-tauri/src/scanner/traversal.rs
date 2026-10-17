use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::{Instant, SystemTime, UNIX_EPOCH};
use walkdir::WalkDir;

use crate::errors::{AppError, AppResult};
use crate::models::{
    CategorySummary, CleanupCandidate, CleanupType, DuplicateGroup, ExtensionSummary, FileCategory,
    RiskLevel, ScanError, ScanOptions, ScanProgress, ScanStatus, ScanSummary, ScannedFile,
    ScannedFolder,
};
use crate::scanner::categorize::categorize_extension;
use crate::scanner::exclusions::{is_file_hidden, ExclusionFilter};

pub struct Scanner;

impl Scanner {
    pub fn scan<F>(
        options: ScanOptions,
        cancel_token: Arc<AtomicBool>,
        mut progress_callback: F,
    ) -> AppResult<ScanSummary>
    where
        F: FnMut(ScanProgress),
    {
        let start_time = Instant::now();
        let root_path = PathBuf::from(&options.root_path);

        if !root_path.exists() {
            return Err(AppError::PathNotFound(format!(
                "Scan root does not exist: {}",
                options.root_path
            )));
        }

        let exclusion_filter = ExclusionFilter::new(&options);

        let mut scanned_files: u64 = 0;
        let mut scanned_directories: u64 = 0;
        let mut scanned_bytes: u64 = 0;
        let mut errors: Vec<ScanError> = Vec::new();

        let mut files_list: Vec<ScannedFile> = Vec::new();
        let mut dir_sizes: HashMap<PathBuf, (u64, u64, u64)> = HashMap::new(); // (bytes, file_count, dir_count)
        let mut category_map: HashMap<FileCategory, (u64, u64)> = HashMap::new(); // (bytes, count)
        let mut extension_map: HashMap<String, (FileCategory, u64, u64)> = HashMap::new(); // (category, bytes, count)

        let mut last_progress_report = Instant::now();
        const PROGRESS_INTERVAL_MS: u128 = 80; // throttled progress reporting

        let mut walker = WalkDir::new(&root_path)
            .follow_links(options.follow_symlinks)
            .same_file_system(true);

        // Pre-insert root dir
        dir_sizes.insert(root_path.clone(), (0, 0, 0));

        let iterator = walker.into_iter();

        for entry_res in iterator {
            if cancel_token.load(Ordering::Relaxed) {
                return Err(AppError::Cancelled);
            }

            let entry = match entry_res {
                Ok(e) => e,
                Err(err) => {
                    let err_path = err
                        .path()
                        .map(|p| p.to_string_lossy().to_string())
                        .unwrap_or_else(|| "Unknown".to_string());
                    errors.push(ScanError {
                        path: err_path,
                        error: err.to_string(),
                    });
                    continue;
                }
            };

            let path = entry.path();
            let is_hidden = is_file_hidden(path);

            // Check exclusion
            if exclusion_filter.should_exclude(path, is_hidden) {
                continue;
            }

            let metadata = match entry.metadata() {
                Ok(m) => m,
                Err(err) => {
                    errors.push(ScanError {
                        path: path.to_string_lossy().to_string(),
                        error: err.to_string(),
                    });
                    continue;
                }
            };

            if metadata.is_dir() {
                scanned_directories += 1;
                dir_sizes.entry(path.to_path_buf()).or_insert((0, 0, 0));
            } else if metadata.is_file() {
                scanned_files += 1;
                let size = metadata.len();
                scanned_bytes += size;

                let file_name = path
                    .file_name()
                    .map(|n| n.to_string_lossy().to_string())
                    .unwrap_or_default();

                let ext = path
                    .extension()
                    .map(|e| e.to_string_lossy().to_lowercase())
                    .unwrap_or_default();

                let category = categorize_extension(&ext);

                let modified_at = metadata.modified().ok().and_then(|t| {
                    t.duration_since(UNIX_EPOCH)
                        .ok()
                        .map(|d| d.as_millis() as u64)
                });

                // Update category map
                let cat_entry = category_map.entry(category.clone()).or_insert((0, 0));
                cat_entry.0 += size;
                cat_entry.1 += 1;

                // Update extension map
                let ext_key = if ext.is_empty() {
                    "(no extension)".to_string()
                } else {
                    format!(".{}", ext)
                };
                let ext_entry = extension_map
                    .entry(ext_key)
                    .or_insert((category.clone(), 0, 0));
                ext_entry.1 += size;
                ext_entry.2 += 1;

                // Roll up file size into parent directories
                let mut current = path.parent();
                while let Some(parent) = current {
                    let d_entry = dir_sizes.entry(parent.to_path_buf()).or_insert((0, 0, 0));
                    d_entry.0 += size;
                    d_entry.1 += 1;

                    if parent == root_path {
                        break;
                    }
                    current = parent.parent();
                }

                files_list.push(ScannedFile {
                    id: format!("{}_{}", scanned_files, size),
                    name: file_name,
                    path: path.to_string_lossy().to_string(),
                    size_bytes: size,
                    category,
                    extension: ext,
                    modified_at,
                    is_hidden,
                    is_system: false,
                });
            }

            // Periodic progress report
            if last_progress_report.elapsed().as_millis() >= PROGRESS_INTERVAL_MS {
                progress_callback(ScanProgress {
                    status: ScanStatus::Scanning,
                    scanned_files,
                    scanned_directories,
                    scanned_bytes,
                    current_path: path.to_string_lossy().to_string(),
                    elapsed_ms: start_time.elapsed().as_millis() as u64,
                    error_count: errors.len() as u64,
                });
                last_progress_report = Instant::now();
            }
        }

        // Final aggregating notification
        progress_callback(ScanProgress {
            status: ScanStatus::Aggregating,
            scanned_files,
            scanned_directories,
            scanned_bytes,
            current_path: "Finalizing storage statistics...".to_string(),
            elapsed_ms: start_time.elapsed().as_millis() as u64,
            error_count: errors.len() as u64,
        });

        // Calculate largest files (top 100)
        files_list.sort_by(|a, b| b.size_bytes.cmp(&a.size_bytes));
        let largest_files: Vec<ScannedFile> = files_list.iter().take(100).cloned().collect();

        // Calculate largest folders (top 50)
        let mut folders_list: Vec<ScannedFolder> = dir_sizes
            .into_iter()
            .map(|(p, (bytes, f_count, d_count))| {
                let name = p
                    .file_name()
                    .map(|n| n.to_string_lossy().to_string())
                    .unwrap_or_else(|| p.to_string_lossy().to_string());
                ScannedFolder {
                    id: p.to_string_lossy().to_string(),
                    name,
                    path: p.to_string_lossy().to_string(),
                    size_bytes: bytes,
                    file_count: f_count,
                    dir_count: d_count,
                    children_dirs: None,
                }
            })
            .collect();
        folders_list.sort_by(|a, b| b.size_bytes.cmp(&a.size_bytes));
        let largest_folders: Vec<ScannedFolder> = folders_list.into_iter().take(50).collect();

        // Category summaries
        let mut categories: Vec<CategorySummary> = category_map
            .into_iter()
            .map(|(cat, (bytes, count))| {
                let percentage = if scanned_bytes > 0 {
                    (bytes as f64 / scanned_bytes as f64) * 100.0
                } else {
                    0.0
                };
                CategorySummary {
                    category: cat,
                    total_bytes: bytes,
                    file_count: count,
                    percentage,
                }
            })
            .collect();
        categories.sort_by(|a, b| b.total_bytes.cmp(&a.total_bytes));

        // Extension summaries (top 30)
        let mut extensions: Vec<ExtensionSummary> = extension_map
            .into_iter()
            .map(|(ext, (cat, bytes, count))| ExtensionSummary {
                extension: ext,
                category: cat,
                total_bytes: bytes,
                file_count: count,
            })
            .collect();
        extensions.sort_by(|a, b| b.total_bytes.cmp(&a.total_bytes));
        let extensions: Vec<ExtensionSummary> = extensions.into_iter().take(30).collect();

        // Cleanup recommendations
        let cleanup_candidates = Self::generate_cleanup_candidates(&files_list);

        let duration_ms = start_time.elapsed().as_millis() as u64;

        Ok(ScanSummary {
            root_path: options.root_path,
            total_bytes: scanned_bytes,
            total_files: scanned_files,
            total_directories: scanned_directories,
            scan_duration_ms: duration_ms,
            error_count: errors.len() as u64,
            errors,
            largest_files,
            largest_folders,
            categories,
            extensions,
            duplicate_groups: Vec::new(), // Duplicates generated upon user request or deep scan
            cleanup_candidates,
            timestamp: chrono::Local::now().to_rfc3339(),
        })
    }

    fn generate_cleanup_candidates(files: &[ScannedFile]) -> Vec<CleanupCandidate> {
        let mut candidates = Vec::new();
        let now_ms = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis() as u64;

        let thirty_days_ms = 30 * 24 * 60 * 60 * 1000;
        let one_hundred_mb = 100 * 1024 * 1024;

        for f in files {
            let path_lower = f.path.to_lowercase();
            let is_temp = path_lower.contains("\\temp\\")
                || path_lower.contains("/tmp/")
                || path_lower.contains("\\tmp\\")
                || f.extension == "tmp"
                || f.extension == "bak"
                || f.name.ends_with(".log")
                || f.name.ends_with(".old");

            let is_installer = f.extension == "iso" || f.extension == "dmg" || f.extension == "msi";
            let is_large_archive = (f.extension == "zip"
                || f.extension == "tar"
                || f.extension == "gz"
                || f.extension == "7z")
                && f.size_bytes > one_hundred_mb;

            let is_download = path_lower.contains("downloads") && f.size_bytes > 50 * 1024 * 1024;

            if is_temp {
                candidates.push(CleanupCandidate {
                    id: format!("clean_temp_{}", f.id),
                    r#type: CleanupType::TempFile,
                    title: format!("Temporary file: {}", f.name),
                    description: "Temporary, backup, or cache file located in temporary or scratch directories.".to_string(),
                    risk_level: RiskLevel::Safe,
                    risk_explanation: "Usually safe to delete if application is not currently writing to it.".to_string(),
                    file: f.clone(),
                    suggested_action: "trash".to_string(),
                });
            } else if is_installer {
                let is_old = f
                    .modified_at
                    .map(|m| now_ms.saturating_sub(m) > thirty_days_ms)
                    .unwrap_or(false);
                if is_old || f.size_bytes > one_hundred_mb {
                    candidates.push(CleanupCandidate {
                        id: format!("clean_inst_{}", f.id),
                        r#type: CleanupType::OldInstaller,
                        title: format!("Setup installer / Disk image: {}", f.name),
                        description: "Disk image or application installer that may no longer be needed after installation.".to_string(),
                        risk_level: RiskLevel::Low,
                        risk_explanation: "If you already installed this program or can redownload it, this installer is safe to remove.".to_string(),
                        file: f.clone(),
                        suggested_action: "trash".to_string(),
                    });
                }
            } else if is_large_archive {
                candidates.push(CleanupCandidate {
                    id: format!("clean_arch_{}", f.id),
                    r#type: CleanupType::LargeArchive,
                    title: format!("Large archive: {}", f.name),
                    description: "Large compressed archive consuming substantial disk space."
                        .to_string(),
                    risk_level: RiskLevel::Moderate,
                    risk_explanation: "Ensure contents are extracted or backed up before deletion."
                        .to_string(),
                    file: f.clone(),
                    suggested_action: "trash".to_string(),
                });
            } else if is_download {
                candidates.push(CleanupCandidate {
                    id: format!("clean_dl_{}", f.id),
                    r#type: CleanupType::LargeDownload,
                    title: format!("Large download: {}", f.name),
                    description: "Large file in Downloads folder.".to_string(),
                    risk_level: RiskLevel::Low,
                    risk_explanation: "Check whether you still need this downloaded asset."
                        .to_string(),
                    file: f.clone(),
                    suggested_action: "trash".to_string(),
                });
            }

            if candidates.len() >= 100 {
                break;
            }
        }

        candidates
    }
}
