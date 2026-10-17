use crate::errors::{AppError, AppResult};
use std::fs::File;
use std::io::Read;
use std::path::Path;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

pub struct ContentHasher;

impl ContentHasher {
    /// Hashes the first 4KB of a file for fast pre-filtering.
    pub fn hash_prefix(path: &Path, prefix_size: usize) -> AppResult<String> {
        let mut file = File::open(path).map_err(AppError::Io)?;
        let mut buffer = vec![0u8; prefix_size];
        let bytes_read = file.read(&mut buffer).map_err(AppError::Io)?;

        let mut hasher = blake3::Hasher::new();
        hasher.update(&buffer[..bytes_read]);
        Ok(hasher.finalize().to_hex().to_string())
    }

    /// Computes full cryptographic BLAKE3 hash by streaming in 64KB chunks.
    pub fn hash_full(path: &Path, cancel_token: &Arc<AtomicBool>) -> AppResult<String> {
        let mut file = File::open(path).map_err(AppError::Io)?;
        let mut hasher = blake3::Hasher::new();
        let mut buffer = [0u8; 65536]; // 64KB buffer

        loop {
            if cancel_token.load(Ordering::Relaxed) {
                return Err(AppError::Cancelled);
            }

            let bytes_read = file.read(&mut buffer).map_err(AppError::Io)?;
            if bytes_read == 0 {
                break;
            }
            hasher.update(&buffer[..bytes_read]);
        }

        Ok(hasher.finalize().to_hex().to_string())
    }
}
