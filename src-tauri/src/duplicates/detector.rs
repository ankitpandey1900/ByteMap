use std::collections::HashMap;
use std::path::Path;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use crate::errors::{AppError, AppResult};
use crate::models::{DuplicateGroup, ScannedFile};
use crate::duplicates::hasher::ContentHasher;

pub struct DuplicateDetector;

impl DuplicateDetector {
    /// Detect duplicates among scanned files using a staged approach:
    /// Stage 1: Group by identical file size (skip sizes with < 2 files)
    /// Stage 2: Fast partial hash (4KB prefix)
    /// Stage 3: Full cryptographic BLAKE3 content hash
    pub fn find_duplicates<F>(
        files: &[ScannedFile],
        cancel_token: Arc<AtomicBool>,
        mut progress_callback: F,
    ) -> AppResult<Vec<DuplicateGroup>>
    where
        F: FnMut(usize, usize), // (processed_candidates, total_candidates)
    {
        // Stage 1: Group files by exact size (> 0 bytes)
        let mut size_groups: HashMap<u64, Vec<&ScannedFile>> = HashMap::new();
        for f in files {
            if f.size_bytes > 0 {
                size_groups.entry(f.size_bytes).or_default().push(f);
            }
        }

        // Keep only groups with 2 or more files
        let candidate_groups: Vec<(u64, Vec<&ScannedFile>)> = size_groups
            .into_iter()
            .filter(|(_, group)| group.len() >= 2)
            .collect();

        let total_candidates: usize = candidate_groups.iter().map(|(_, g)| g.len()).sum();
        let mut processed_candidates = 0;

        let mut final_duplicate_groups: Vec<DuplicateGroup> = Vec::new();

        for (size, group) in candidate_groups {
            if cancel_token.load(Ordering::Relaxed) {
                return Err(AppError::Cancelled);
            }

            // Stage 2: Prefix hash
            let mut prefix_groups: HashMap<String, Vec<&ScannedFile>> = HashMap::new();
            for file in group {
                if cancel_token.load(Ordering::Relaxed) {
                    return Err(AppError::Cancelled);
                }

                let path = Path::new(&file.path);
                if let Ok(prefix_hash) = ContentHasher::hash_prefix(path, 4096) {
                    prefix_groups.entry(prefix_hash).or_default().push(file);
                }
                processed_candidates += 1;
                progress_callback(processed_candidates, total_candidates);
            }

            // Stage 3: Full BLAKE3 cryptographic hash for files matching prefix hash
            for (_prefix, sub_group) in prefix_groups {
                if sub_group.len() < 2 {
                    continue;
                }

                let mut full_hash_groups: HashMap<String, Vec<&ScannedFile>> = HashMap::new();
                for file in sub_group {
                    if cancel_token.load(Ordering::Relaxed) {
                        return Err(AppError::Cancelled);
                    }

                    let path = Path::new(&file.path);
                    if let Ok(full_hash) = ContentHasher::hash_full(path, &cancel_token) {
                        full_hash_groups.entry(full_hash).or_default().push(file);
                    }
                }

                for (hash, matching_files) in full_hash_groups {
                    if matching_files.len() >= 2 {
                        let count = matching_files.len() as u64;
                        let reclaimable = (count - 1) * size;
                        final_duplicate_groups.push(DuplicateGroup {
                            hash,
                            size_bytes: size,
                            reclaimable_bytes: reclaimable,
                            files: matching_files.into_iter().cloned().collect(),
                        });
                    }
                }
            }
        }

        // Sort groups by reclaimable bytes descending
        final_duplicate_groups.sort_by(|a, b| b.reclaimable_bytes.cmp(&a.reclaimable_bytes));

        Ok(final_duplicate_groups)
    }
}
