use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter, State};

use crate::cleanup::{
    CleanupExecutionSummary, CleanupExecutor, DevCacheCleanSummary, DevCacheItem, DevCacheScanner,
};
use crate::drives::DriveDiscovery;
use crate::duplicates::DuplicateDetector;
use crate::errors::AppError;
use crate::models::{
    AppSettings, DriveInfo, DuplicateGroup, ScanOptions, ScanProgress, ScanStatus, ScanSummary,
};
use crate::scanner::Scanner;
use crate::security::PathValidator;

pub struct AppScanState {
    pub current_summary: Mutex<Option<ScanSummary>>,
    pub cancel_token: Arc<AtomicBool>,
    pub is_scanning: Arc<AtomicBool>,
}

impl Default for AppScanState {
    fn default() -> Self {
        Self {
            current_summary: Mutex::new(None),
            cancel_token: Arc::new(AtomicBool::new(false)),
            is_scanning: Arc::new(AtomicBool::new(false)),
        }
    }
}

#[tauri::command]
pub fn get_drives() -> Vec<DriveInfo> {
    DriveDiscovery::get_system_drives()
}

#[tauri::command]
pub async fn start_scan(
    app: AppHandle,
    state: State<'_, AppScanState>,
    options: ScanOptions,
) -> Result<ScanSummary, AppError> {
    // Validate path
    let validated_root = PathValidator::validate_scan_root(&options.root_path)?;

    // Check if already scanning
    if state.is_scanning.swap(true, Ordering::SeqCst) {
        return Err(AppError::ScanInProgress);
    }

    state.cancel_token.store(false, Ordering::SeqCst);
    let cancel_token = state.cancel_token.clone();
    let is_scanning = state.is_scanning.clone();

    let mut sanitized_options = options.clone();
    sanitized_options.root_path = validated_root.to_string_lossy().to_string();

    let app_clone = app.clone();
    let scan_res = tauri::async_runtime::spawn_blocking(move || {
        let res = Scanner::scan(sanitized_options, cancel_token, |prog| {
            let _ = app_clone.emit("scan_progress", &prog);
        });
        is_scanning.store(false, Ordering::SeqCst);
        res
    })
    .await
    .map_err(|_| AppError::General("Scan thread panicked".to_string()))?;

    match scan_res {
        Ok(summary) => {
            let mut lock = state.current_summary.lock().unwrap();
            *lock = Some(summary.clone());
            let _ = app.emit(
                "scan_progress",
                &ScanProgress {
                    status: ScanStatus::Completed,
                    scanned_files: summary.total_files,
                    scanned_directories: summary.total_directories,
                    scanned_bytes: summary.total_bytes,
                    current_path: "Scan completed successfully".to_string(),
                    elapsed_ms: summary.scan_duration_ms,
                    error_count: summary.error_count,
                },
            );
            Ok(summary)
        }
        Err(AppError::Cancelled) => {
            let _ = app.emit(
                "scan_progress",
                &ScanProgress {
                    status: ScanStatus::Cancelled,
                    scanned_files: 0,
                    scanned_directories: 0,
                    scanned_bytes: 0,
                    current_path: "Scan cancelled by user".to_string(),
                    elapsed_ms: 0,
                    error_count: 0,
                },
            );
            Err(AppError::Cancelled)
        }
        Err(err) => {
            let _ = app.emit(
                "scan_progress",
                &ScanProgress {
                    status: ScanStatus::Failed,
                    scanned_files: 0,
                    scanned_directories: 0,
                    scanned_bytes: 0,
                    current_path: format!("Scan failed: {}", err),
                    elapsed_ms: 0,
                    error_count: 1,
                },
            );
            Err(err)
        }
    }
}

#[tauri::command]
pub fn cancel_scan(state: State<'_, AppScanState>) {
    state.cancel_token.store(true, Ordering::SeqCst);
}

#[tauri::command]
pub fn get_scan_summary(state: State<'_, AppScanState>) -> Option<ScanSummary> {
    state.current_summary.lock().unwrap().clone()
}

#[tauri::command]
pub fn clear_scan_data(state: State<'_, AppScanState>) {
    let mut lock = state.current_summary.lock().unwrap();
    *lock = None;
}

#[tauri::command]
pub async fn find_duplicates(
    app: AppHandle,
    state: State<'_, AppScanState>,
) -> Result<Vec<DuplicateGroup>, AppError> {
    let files = {
        let lock = state.current_summary.lock().unwrap();
        let summary = lock.as_ref().ok_or(AppError::NoScanData)?;
        summary.largest_files.clone()
    };

    let cancel_token = state.cancel_token.clone();
    cancel_token.store(false, Ordering::SeqCst);

    let app_clone = app.clone();
    let dup_res = tauri::async_runtime::spawn_blocking(move || {
        DuplicateDetector::find_duplicates(&files, cancel_token, |processed, total| {
            let _ = app_clone.emit("duplicate_progress", (processed, total));
        })
    })
    .await
    .map_err(|_| AppError::General("Duplicate detection thread panicked".to_string()))??;

    // Update in-memory scan summary with detected duplicates
    let mut lock = state.current_summary.lock().unwrap();
    if let Some(ref mut summary) = *lock {
        summary.duplicate_groups = dup_res.clone();
    }

    Ok(dup_res)
}

#[derive(serde::Deserialize)]
pub struct CleanupTargetRequest {
    pub path: String,
    pub expected_size: Option<u64>,
}

#[tauri::command]
pub async fn execute_cleanup(
    state: State<'_, AppScanState>,
    targets: Vec<CleanupTargetRequest>,
    prefer_trash: bool,
) -> Result<CleanupExecutionSummary, AppError> {
    let root_path_str = {
        let lock = state.current_summary.lock().unwrap();
        let summary = lock.as_ref().ok_or(AppError::NoScanData)?;
        summary.root_path.clone()
    };

    let target_tuples: Vec<(String, Option<u64>)> = targets
        .into_iter()
        .map(|t| (t.path, t.expected_size))
        .collect();

    let summary = tauri::async_runtime::spawn_blocking(move || {
        let root_path = Path::new(&root_path_str);
        CleanupExecutor::execute_cleanup(&target_tuples, root_path, prefer_trash)
    })
    .await
    .map_err(|e| AppError::General(format!("Cleanup execution panicked: {}", e)))?;

    // Refresh affected statistics in memory
    let mut lock = state.current_summary.lock().unwrap();
    if let Some(ref mut scan_summary) = *lock {
        let successful_paths: std::collections::HashSet<String> = summary
            .results
            .iter()
            .filter(|r| r.success)
            .map(|r| r.path.clone())
            .collect();

        scan_summary
            .cleanup_candidates
            .retain(|c| !successful_paths.contains(&c.file.path));
        scan_summary
            .largest_files
            .retain(|f| !successful_paths.contains(&f.path));
        scan_summary.total_bytes = scan_summary
            .total_bytes
            .saturating_sub(summary.total_freed_bytes);
        scan_summary.total_files = scan_summary
            .total_files
            .saturating_sub(summary.successful_count as u64);

        // Recursively roll down sizes for largest_folders in Rust in-memory snapshot
        fn update_scanned_folder(
            folder: &mut crate::models::ScannedFolder,
            successful_paths: &std::collections::HashSet<String>,
            results: &[crate::cleanup::executor::CleanupItemResult],
        ) -> bool {
            let norm_folder = folder.path.trim_end_matches(['\\', '/']).to_lowercase();
            if successful_paths
                .iter()
                .any(|p| p.trim_end_matches(['\\', '/']).to_lowercase() == norm_folder)
            {
                return false;
            }

            let mut bytes_inside: u64 = 0;
            let mut files_inside: u64 = 0;
            for r in results {
                if r.success {
                    let norm_path = r.path.trim_end_matches(['\\', '/']).to_lowercase();
                    if norm_path.starts_with(&format!("{}\\", norm_folder))
                        || norm_path.starts_with(&format!("{}/", norm_folder))
                    {
                        bytes_inside = bytes_inside.saturating_add(r.bytes_freed);
                        files_inside = files_inside.saturating_add(1);
                    }
                }
            }

            if let Some(ref mut children) = folder.children_dirs {
                children.retain_mut(|child| update_scanned_folder(child, successful_paths, results));
            }

            folder.size_bytes = folder.size_bytes.saturating_sub(bytes_inside);
            folder.file_count = folder.file_count.saturating_sub(files_inside);
            folder.size_bytes > 0 || folder.file_count > 0
        }

        scan_summary
            .largest_folders
            .retain_mut(|folder| update_scanned_folder(folder, &successful_paths, &summary.results));
        scan_summary
            .largest_folders
            .sort_by(|a, b| b.size_bytes.cmp(&a.size_bytes));

        // Prune duplicate groups in Rust in-memory snapshot
        scan_summary.duplicate_groups.retain_mut(|group| {
            group.files.retain(|f| !successful_paths.contains(&f.path));
            if group.files.len() > 1 {
                let single_size = group.files[0].size_bytes;
                group.reclaimable_bytes = (group.files.len() as u64 - 1).saturating_mul(single_size);
                true
            } else {
                false
            }
        });
    }

    Ok(summary)
}

#[tauri::command]
pub fn open_recycle_bin() -> Result<(), AppError> {
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        Command::new("explorer")
            .arg("shell:RecycleBinFolder")
            .spawn()
            .map_err(AppError::Io)?;
    }

    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        let home = std::env::var("HOME").unwrap_or_else(|_| "~".to_string());
        let trash_path = format!("{}/.Trash", home);
        Command::new("open")
            .arg(&trash_path)
            .spawn()
            .map_err(AppError::Io)?;
    }

    #[cfg(target_os = "linux")]
    {
        use std::process::Command;
        Command::new("xdg-open")
            .arg("trash:///")
            .spawn()
            .map_err(AppError::Io)?;
    }

    Ok(())
}

#[tauri::command]
pub fn reveal_in_folder(path: String) -> Result<(), AppError> {
    let target_path = Path::new(&path);
    if !target_path.exists() {
        return Err(AppError::PathNotFound(path));
    }

    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        Command::new("explorer")
            .arg("/select,")
            .arg(target_path)
            .spawn()
            .map_err(AppError::Io)?;
    }

    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        Command::new("open")
            .arg("-R")
            .arg(target_path)
            .spawn()
            .map_err(AppError::Io)?;
    }

    #[cfg(target_os = "linux")]
    {
        use std::process::Command;
        if let Some(parent) = target_path.parent() {
            Command::new("xdg-open")
                .arg(parent)
                .spawn()
                .map_err(AppError::Io)?;
        }
    }

    Ok(())
}

fn get_config_file_path() -> Option<PathBuf> {
    dirs::config_dir().map(|p| p.join("ByteMap").join("config.json"))
}

#[tauri::command]
pub fn load_settings() -> AppSettings {
    if let Some(path) = get_config_file_path() {
        if path.exists() {
            if let Ok(content) = std::fs::read_to_string(path) {
                if let Ok(settings) = serde_json::from_str::<AppSettings>(&content) {
                    return settings;
                }
            }
        }
    }
    AppSettings::default()
}

#[tauri::command]
pub fn save_settings(settings: AppSettings) -> Result<(), AppError> {
    if let Some(path) = get_config_file_path() {
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent).map_err(AppError::Io)?;
        }
        let json = serde_json::to_string_pretty(&settings)
            .map_err(|e| AppError::Serialization(e.to_string()))?;
        std::fs::write(path, json).map_err(AppError::Io)?;
        Ok(())
    } else {
        Err(AppError::General(
            "Could not determine user config directory".to_string(),
        ))
    }
}

#[tauri::command]
pub async fn scan_dev_caches() -> Result<Vec<DevCacheItem>, AppError> {
    tauri::async_runtime::spawn_blocking(DevCacheScanner::scan_system_caches)
        .await
        .map_err(|e| AppError::General(format!("Background dev cache scan failed: {}", e)))
}

#[tauri::command]
pub async fn clean_dev_caches(
    target_ids: Vec<String>,
    prefer_trash: bool,
) -> Result<DevCacheCleanSummary, AppError> {
    tauri::async_runtime::spawn_blocking(move || {
        DevCacheScanner::clean_cache_targets(&target_ids, prefer_trash)
    })
    .await
    .map_err(|e| AppError::General(format!("Background dev cache cleanup failed: {}", e)))
}
