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
    let scan_res = std::thread::spawn(move || {
        let res = Scanner::scan(sanitized_options, cancel_token, |prog| {
            let _ = app_clone.emit("scan_progress", &prog);
        });
        is_scanning.store(false, Ordering::SeqCst);
        res
    })
    .join()
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
    let dup_res = std::thread::spawn(move || {
        DuplicateDetector::find_duplicates(&files, cancel_token, |processed, total| {
            let _ = app_clone.emit("duplicate_progress", (processed, total));
        })
    })
    .join()
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
pub fn execute_cleanup(
    state: State<'_, AppScanState>,
    targets: Vec<CleanupTargetRequest>,
    prefer_trash: bool,
) -> Result<CleanupExecutionSummary, AppError> {
    let root_path_str = {
        let lock = state.current_summary.lock().unwrap();
        let summary = lock.as_ref().ok_or(AppError::NoScanData)?;
        summary.root_path.clone()
    };

    let root_path = Path::new(&root_path_str);
    let target_tuples: Vec<(String, Option<u64>)> = targets
        .into_iter()
        .map(|t| (t.path, t.expected_size))
        .collect();

    let summary = CleanupExecutor::execute_cleanup(&target_tuples, root_path, prefer_trash);

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
    }

    Ok(summary)
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
pub fn scan_dev_caches() -> Vec<DevCacheItem> {
    DevCacheScanner::scan_system_caches()
}

#[tauri::command]
pub fn clean_dev_caches(
    target_ids: Vec<String>,
    prefer_trash: bool,
) -> Result<DevCacheCleanSummary, AppError> {
    Ok(DevCacheScanner::clean_cache_targets(&target_ids, prefer_trash))
}
