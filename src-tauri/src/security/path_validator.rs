use crate::errors::{AppError, AppResult};
use std::path::{Path, PathBuf};

pub struct PathValidator;

impl PathValidator {
    /// Validates that a scan root exists, is a directory, and is canonicalizable.
    pub fn validate_scan_root(path_str: &str) -> AppResult<PathBuf> {
        let trimmed = path_str.trim();
        if trimmed.is_empty() {
            return Err(AppError::InvalidPath(
                "Scan path cannot be empty".to_string(),
            ));
        }

        let path = Path::new(trimmed);
        if !path.exists() {
            return Err(AppError::PathNotFound(format!(
                "Path does not exist: {}",
                trimmed
            )));
        }

        let canonical = path.canonicalize().map_err(|e| {
            AppError::InvalidPath(format!("Failed to canonicalize path {}: {}", trimmed, e))
        })?;

        if !canonical.is_dir() {
            return Err(AppError::InvalidPath(format!(
                "Path is not a directory: {}",
                trimmed
            )));
        }

        Ok(canonical)
    }

    /// Verifies if a path is considered a critical system path that must be protected.
    pub fn is_protected_system_path(path: &Path) -> bool {
        let path_str = path.to_string_lossy().to_lowercase();

        // Windows protected directories
        let protected_windows = [
            "c:\\windows",
            "c:\\program files",
            "c:\\program files (x86)",
            "c:\\recovery",
            "c:\\boot",
            "c:\\system volume information",
            "c:\\$recycle.bin",
        ];

        for protected in &protected_windows {
            if path_str == *protected || path_str.starts_with(&format!("{}\\", protected)) {
                return true;
            }
        }

        // Unix protected directories
        let protected_unix = [
            "/bin", "/sbin", "/usr", "/etc", "/var", "/dev", "/proc", "/sys", "/boot", "/root",
            "/lib", "/lib64",
        ];

        for protected in &protected_unix {
            if path_str == *protected || path_str.starts_with(&format!("{}/", protected)) {
                return true;
            }
        }

        // Never allow deleting the drive root directly (e.g., "C:\" or "/")
        if let Some(parent) = path.parent() {
            if parent == path {
                return true;
            }
        } else {
            return true;
        }

        false
    }

    /// Validates a target file path for cleanup operations:
    /// 1. Must be within the authorized scan root
    /// 2. Must not be a protected system path
    /// 3. Must currently exist and be a regular file
    /// 4. Must match expected file size if provided
    pub fn validate_cleanup_target(
        target_path_str: &str,
        authorized_root: &Path,
        expected_size: Option<u64>,
    ) -> AppResult<PathBuf> {
        let path = Path::new(target_path_str);
        if !path.exists() {
            return Err(AppError::PathNotFound(format!(
                "Target file does not exist: {}",
                target_path_str
            )));
        }

        let canonical_target = path.canonicalize().map_err(|e| {
            AppError::InvalidPath(format!(
                "Failed to canonicalize target path {}: {}",
                target_path_str, e
            ))
        })?;

        let canonical_root = authorized_root
            .canonicalize()
            .unwrap_or_else(|_| authorized_root.to_path_buf());

        // Ensure canonical target begins with canonical root (prevent directory traversal)
        if !canonical_target.starts_with(&canonical_root) {
            return Err(AppError::InvalidPath(format!(
                "Security violation: Target {} is outside the authorized scan root {}",
                canonical_target.display(),
                canonical_root.display()
            )));
        }

        // Check against protected system paths
        if Self::is_protected_system_path(&canonical_target) {
            return Err(AppError::ProtectedPath(format!(
                "Protected system path cannot be deleted: {}",
                canonical_target.display()
            )));
        }

        let metadata = std::fs::metadata(&canonical_target).map_err(|e| AppError::Io(e))?;

        if !metadata.is_file() {
            return Err(AppError::InvalidPath(format!(
                "Target is not a regular file: {}",
                canonical_target.display()
            )));
        }

        if let Some(exp_size) = expected_size {
            if metadata.len() != exp_size {
                return Err(AppError::TargetChanged(format!(
                    "File size has changed since scan (expected {} bytes, found {} bytes): {}",
                    exp_size,
                    metadata.len(),
                    canonical_target.display()
                )));
            }
        }

        Ok(canonical_target)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_protected_system_path() {
        assert!(PathValidator::is_protected_system_path(Path::new(
            "C:\\Windows"
        )));
        assert!(PathValidator::is_protected_system_path(Path::new(
            "C:\\Windows\\System32"
        )));
        assert!(PathValidator::is_protected_system_path(Path::new(
            "C:\\Program Files\\App"
        )));
        assert!(PathValidator::is_protected_system_path(Path::new(
            "/bin/sh"
        )));
        assert!(PathValidator::is_protected_system_path(Path::new(
            "/usr/bin"
        )));
        assert!(PathValidator::is_protected_system_path(Path::new("C:\\")));

        // Normal user folders should not be protected
        assert!(!PathValidator::is_protected_system_path(Path::new(
            "D:\\Projects\\Data"
        )));
        assert!(!PathValidator::is_protected_system_path(Path::new(
            "C:\\Users\\User\\Downloads"
        )));
    }

    #[test]
    fn test_validate_scan_root_empty() {
        let result = PathValidator::validate_scan_root("");
        assert!(result.is_err());
    }
}
