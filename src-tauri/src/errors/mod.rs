use serde::{Serialize, Serializer};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Path not found or inaccessible: {0}")]
    PathNotFound(String),

    #[error("Invalid path or traversal attempt: {0}")]
    InvalidPath(String),

    #[error("Permission denied: {0}")]
    PermissionDenied(String),

    #[error("Operation cancelled by user")]
    Cancelled,

    #[error("Scan is already in progress")]
    ScanInProgress,

    #[error("Scan has not been run yet")]
    NoScanData,

    #[error("Protected system path cannot be modified or deleted: {0}")]
    ProtectedPath(String),

    #[error("Target file does not match scan metadata (file changed or moved): {0}")]
    TargetChanged(String),

    #[error("Trash operation failed: {0}")]
    TrashFailed(String),

    #[error("Serialization error: {0}")]
    Serialization(String),

    #[error("{0}")]
    General(String),
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

pub type AppResult<T> = Result<T, AppError>;
