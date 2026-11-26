use crate::duplicates::hasher::ContentHasher;
use crate::errors::{AppError, AppResult};
use crate::models::{DuplicateGroup, ScanOptions, ScannedFile};
use crate::scanner::categorize::categorize_file;
use crate::scanner::exclusions::{is_file_hidden, ExclusionFilter};
use crate::scanner::traversal::get_effective_file_size;
use rayon::prelude::*;
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, AtomicUsize, Ordering};
use std::sync::{Arc, Mutex};
use std::time::UNIX_EPOCH;
use walkdir::WalkDir;

const DEFAULT_ROOT_DUPLICATE_MIN_BYTES: u64 = 1_048_576; // 1 MB default avoids hashing 500k+ tiny cache/object stubs
const DEEP_ROOT_DUPLICATE_MIN_BYTES: u64 = 65_536; // 64 KB when deep scan is explicitly requested
const MAX_DUPLICATE_GROUPS: usize = 500;

pub struct DuplicateDetector;

impl DuplicateDetector {
    /// Detect duplicates across an entire scanned directory tree in parallel.
    pub fn find_duplicates_in_root<F>(
        options: &ScanOptions,
        cancel_token: Arc<AtomicBool>,
        progress_callback: F,
    ) -> AppResult<Vec<DuplicateGroup>>
    where
        F: FnMut(usize, usize) + Send,
    {
        let min_bytes = if options.deep_duplicate_scan {
            DEEP_ROOT_DUPLICATE_MIN_BYTES
        } else {
            DEFAULT_ROOT_DUPLICATE_MIN_BYTES
        };
        Self::find_duplicates_in_root_with_min_size(
            options,
            min_bytes,
            cancel_token,
            progress_callback,
        )
    }

    /// Stage 1: Walk directory with active exclusions and group `(size -> PathBuf)` for files >= `min_size_bytes`.
    /// Stage 2: Sort colliding size groups largest-reclaimable-first and parallel-hash 4KB prefixes via Rayon.
    /// Stage 3: Parallel full cryptographic BLAKE3 hash for prefix matches.
    pub fn find_duplicates_in_root_with_min_size<F>(
        options: &ScanOptions,
        min_size_bytes: u64,
        cancel_token: Arc<AtomicBool>,
        progress_callback: F,
    ) -> AppResult<Vec<DuplicateGroup>>
    where
        F: FnMut(usize, usize) + Send,
    {
        let root_path = PathBuf::from(&options.root_path);
        if !root_path.exists() {
            return Err(AppError::PathNotFound(format!(
                "Scan root does not exist: {}",
                options.root_path
            )));
        }

        let exclusion_filter = ExclusionFilter::new(options);
        let root_for_filter = root_path.clone();

        let mut size_groups: HashMap<u64, Vec<PathBuf>> = HashMap::new();
        let walker = WalkDir::new(&root_path)
            .follow_links(options.follow_symlinks)
            .same_file_system(true)
            .into_iter()
            .filter_entry(move |entry| {
                !exclusion_filter.should_exclude_dir_entry(entry, &root_for_filter)
            });

        for entry_res in walker {
            if cancel_token.load(Ordering::Relaxed) {
                return Err(AppError::Cancelled);
            }

            let entry = match entry_res {
                Ok(e) => e,
                Err(_) => continue,
            };

            let metadata = match entry.metadata() {
                Ok(m) => m,
                Err(_) => continue,
            };

            if metadata.is_file() {
                let size = get_effective_file_size(&metadata);
                if size >= min_size_bytes {
                    size_groups
                        .entry(size)
                        .or_default()
                        .push(entry.path().to_path_buf());
                }
            }
        }

        // Immediately drop singleton sizes so only collision candidates remain in memory,
        // then sort largest potential savings first.
        let mut candidate_groups: Vec<(u64, Vec<PathBuf>)> = size_groups
            .into_iter()
            .filter(|(_, group)| group.len() >= 2)
            .collect();
        candidate_groups.sort_by(|a, b| {
            let sav_a = (a.1.len() as u64 - 1).saturating_mul(a.0);
            let sav_b = (b.1.len() as u64 - 1).saturating_mul(b.0);
            sav_b.cmp(&sav_a)
        });

        let total_candidates: usize = candidate_groups.iter().map(|(_, g)| g.len()).sum();
        let processed_counter = AtomicUsize::new(0);
        let callback_mutex = Mutex::new(progress_callback);
        let file_id_counter = AtomicUsize::new(0);

        let result_groups: Vec<DuplicateGroup> = candidate_groups
            .into_par_iter()
            .flat_map(|(size, group)| -> Vec<DuplicateGroup> {
                if cancel_token.load(Ordering::Relaxed) {
                    return Vec::new();
                }

                // Stage 2: Parallel 4KB prefix hash within candidate size group
                let prefix_pairs: Vec<(String, PathBuf)> = group
                    .into_par_iter()
                    .filter_map(|path| {
                        if cancel_token.load(Ordering::Relaxed) {
                            return None;
                        }
                        let prefix = ContentHasher::hash_prefix(&path, 4096).ok();
                        let done = processed_counter.fetch_add(1, Ordering::Relaxed) + 1;
                        if done % 32 == 0 || done == total_candidates {
                            if let Ok(mut cb) = callback_mutex.try_lock() {
                                cb(done, total_candidates);
                            }
                        }
                        prefix.map(|h| (h, path))
                    })
                    .collect();

                let mut prefix_groups: HashMap<String, Vec<PathBuf>> = HashMap::new();
                for (prefix_hash, path) in prefix_pairs {
                    prefix_groups.entry(prefix_hash).or_default().push(path);
                }

                // Stage 3: Full BLAKE3 cryptographic hash for prefix matches
                let mut group_duplicates = Vec::new();
                for (_prefix, sub_group) in prefix_groups {
                    if sub_group.len() < 2 || cancel_token.load(Ordering::Relaxed) {
                        continue;
                    }

                    let full_pairs: Vec<(String, PathBuf)> = sub_group
                        .into_par_iter()
                        .filter_map(|path| {
                            if cancel_token.load(Ordering::Relaxed) {
                                return None;
                            }
                            ContentHasher::hash_full(&path, &cancel_token)
                                .ok()
                                .map(|h| (h, path))
                        })
                        .collect();

                    let mut full_hash_groups: HashMap<String, Vec<PathBuf>> = HashMap::new();
                    for (full_hash, path) in full_pairs {
                        full_hash_groups.entry(full_hash).or_default().push(path);
                    }

                    for (hash, matching_paths) in full_hash_groups {
                        if matching_paths.len() >= 2 {
                            let count = matching_paths.len() as u64;
                            let reclaimable = (count - 1).saturating_mul(size);
                            let scanned_files: Vec<ScannedFile> = matching_paths
                                .iter()
                                .map(|p| {
                                    let seq = file_id_counter.fetch_add(1, Ordering::Relaxed) + 1;
                                    Self::build_scanned_file(p, size, seq)
                                })
                                .collect();

                            group_duplicates.push(DuplicateGroup {
                                hash,
                                size_bytes: size,
                                reclaimable_bytes: reclaimable,
                                files: scanned_files,
                            });
                        }
                    }
                }
                group_duplicates
            })
            .collect();

        if cancel_token.load(Ordering::Relaxed) {
            return Err(AppError::Cancelled);
        }

        if total_candidates > 0 {
            if let Ok(mut cb) = callback_mutex.lock() {
                cb(total_candidates, total_candidates);
            }
        }

        let mut final_duplicate_groups = result_groups;
        final_duplicate_groups.sort_by(|a, b| b.reclaimable_bytes.cmp(&a.reclaimable_bytes));
        final_duplicate_groups.truncate(MAX_DUPLICATE_GROUPS);
        Ok(final_duplicate_groups)
    }

    fn build_scanned_file(path: &Path, size: u64, seq_id: usize) -> ScannedFile {
        let file_name = path
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_default();
        let ext = path
            .extension()
            .map(|e| e.to_string_lossy().to_lowercase())
            .unwrap_or_default();
        let path_lower = path.to_string_lossy().to_lowercase();
        let (category, is_system) = categorize_file(&file_name, &ext, &path_lower);
        let metadata = std::fs::metadata(path).ok();
        let is_hidden = is_file_hidden(path, metadata.as_ref());
        let modified_at = metadata.and_then(|m| {
            m.modified().ok().and_then(|t| {
                t.duration_since(UNIX_EPOCH)
                    .ok()
                    .map(|d| d.as_millis() as u64)
            })
        });

        ScannedFile {
            id: format!("dup_{}_{}", seq_id, size),
            name: file_name,
            path: path.to_string_lossy().to_string(),
            size_bytes: size,
            category,
            extension: ext,
            modified_at,
            is_hidden,
            is_system,
        }
    }

    /// Detect duplicates among a provided slice of scanned files using the staged BLAKE3 approach.
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
        final_duplicate_groups.truncate(MAX_DUPLICATE_GROUPS);

        Ok(final_duplicate_groups)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::time::{SystemTime, UNIX_EPOCH};

    #[test]
    fn finds_duplicates_beyond_top_largest_files() {
        let unique = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let temp_dir = std::env::temp_dir().join(format!("bytemap_dup_test_{}", unique));
        fs::create_dir_all(&temp_dir).unwrap();

        let payload_a = vec![b'A'; 2048];
        let payload_b = vec![b'B'; 4096];
        fs::write(temp_dir.join("photo_1.jpg"), &payload_a).unwrap();
        fs::write(temp_dir.join("photo_1_copy.jpg"), &payload_a).unwrap();
        fs::write(temp_dir.join("unique.bin"), &payload_b).unwrap();

        let options = ScanOptions {
            root_path: temp_dir.to_string_lossy().to_string(),
            exclude_hidden: false,
            exclude_patterns: vec![],
            follow_symlinks: false,
            deep_duplicate_scan: false,
        };

        let cancel = Arc::new(AtomicBool::new(false));
        let groups = DuplicateDetector::find_duplicates_in_root_with_min_size(
            &options,
            1024,
            cancel,
            |_, _| {},
        )
        .expect("duplicate scan should succeed");

        assert_eq!(groups.len(), 1);
        assert_eq!(groups[0].files.len(), 2);
        assert_eq!(groups[0].size_bytes, 2048);
        assert_eq!(groups[0].reclaimable_bytes, 2048);

        let _ = fs::remove_dir_all(&temp_dir);
    }
}
