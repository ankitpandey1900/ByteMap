use crate::errors::AppError;
use crate::security::PathValidator;
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CleanupItemResult {
    pub path: String,
    pub success: bool,
    pub bytes_freed: u64,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CleanupExecutionSummary {
    pub total_freed_bytes: u64,
    pub successful_count: usize,
    pub failed_count: usize,
    pub results: Vec<CleanupItemResult>,
}

pub struct CleanupExecutor;

impl CleanupExecutor {
    /// Executes cleanup on a list of validated target files.
    /// `prefer_trash`: if true, moves to OS Recycle Bin/Trash using `trash::delete`.
    /// Otherwise, performs permanent deletion via `std::fs::remove_file`.
    pub fn execute_cleanup(
        targets: &[(String, Option<u64>)], // (path, expected_size)
        authorized_root: &Path,
        prefer_trash: bool,
    ) -> CleanupExecutionSummary {
        let mut total_freed_bytes: u64 = 0;
        let mut successful_count: usize = 0;
        let mut failed_count: usize = 0;
        let mut results: Vec<CleanupItemResult> = Vec::new();

        for (target_path_str, expected_size) in targets {
            let validation_res = PathValidator::validate_cleanup_target(
                target_path_str,
                authorized_root,
                *expected_size,
            );

            let validated_path = match validation_res {
                Ok(p) => p,
                Err(err) => {
                    failed_count += 1;
                    results.push(CleanupItemResult {
                        path: target_path_str.clone(),
                        success: false,
                        bytes_freed: 0,
                        error: Some(err.to_string()),
                    });
                    continue;
                }
            };

            let is_directory = validated_path.is_dir();
            let file_size = if is_directory {
                crate::cleanup::dev_caches::DevCacheScanner::calculate_dir_stats(&validated_path).0
            } else {
                std::fs::metadata(&validated_path)
                    .map(|m| m.len())
                    .unwrap_or(0)
            };

            let operation_res = if prefer_trash {
                trash::delete(&validated_path).map_err(|e| {
                    AppError::TrashFailed(format!("Failed to move target to trash: {}", e))
                })
            } else if is_directory {
                std::fs::remove_dir_all(&validated_path).map_err(AppError::Io)
            } else {
                std::fs::remove_file(&validated_path).map_err(AppError::Io)
            };

            match operation_res {
                Ok(_) => {
                    successful_count += 1;
                    total_freed_bytes += file_size;
                    results.push(CleanupItemResult {
                        path: target_path_str.clone(),
                        success: true,
                        bytes_freed: file_size,
                        error: None,
                    });
                }
                Err(err) => {
                    failed_count += 1;
                    results.push(CleanupItemResult {
                        path: target_path_str.clone(),
                        success: false,
                        bytes_freed: 0,
                        error: Some(err.to_string()),
                    });
                }
            }
        }

        CleanupExecutionSummary {
            total_freed_bytes,
            successful_count,
            failed_count,
            results,
        }
    }
}
