use std::path::{Path, PathBuf};
use serde::{Deserialize, Serialize};
use crate::errors::{AppError, AppResult};
use crate::models::RiskLevel;
use crate::security::PathValidator;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DevCacheItem {
    pub id: String,
    pub tool: String,
    pub tool_icon: String,
    pub name: String,
    pub description: String,
    pub path: String,
    pub size_bytes: u64,
    pub file_count: u64,
    pub safety_level: RiskLevel,
    pub safety_explanation: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DevCacheCleanResult {
    pub id: String,
    pub path: String,
    pub success: bool,
    pub bytes_freed: u64,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DevCacheCleanSummary {
    pub total_freed_bytes: u64,
    pub successful_count: usize,
    pub failed_count: usize,
    pub results: Vec<DevCacheCleanResult>,
}

pub struct DevCacheScanner;

impl DevCacheScanner {
    /// Discovers system-wide coding and IDE caches across known toolchain paths.
    pub fn scan_system_caches() -> Vec<DevCacheItem> {
        let mut items = Vec::new();

        let home = dirs::home_dir();
        let appdata = dirs::data_dir(); // Roaming on Windows, Library/Application Support on macOS
        let local_appdata = dirs::data_local_dir(); // Local on Windows, Library/Caches or App Support on macOS
        let cache_dir = dirs::cache_dir();

        // 1. Google Antigravity IDE Caches
        if let Some(ref h) = home {
            // Antigravity IDE brain, recordings, and logs
            let ag_ide_brain = h.join(".gemini").join("antigravity-ide").join("brain");
            if ag_ide_brain.exists() {
                if let Some(item) = Self::inspect_cache_dir(
                    "antigravity_brain",
                    "Antigravity IDE",
                    "brain",
                    "Session Brain, Transcripts & Media Recordings",
                    "Temporary subagent screen captures, video recordings, scratch files, and trajectory logs.",
                    &ag_ide_brain,
                    RiskLevel::Safe,
                    "Safe to purge. These are scratch recordings and temp logs from completed agent sessions.",
                ) {
                    items.push(item);
                }
            }

            // Antigravity Browser Profile & AI Model Weights
            let ag_profile_model = h.join(".gemini").join("antigravity-browser-profile").join("OptGuideOnDeviceModel");
            if ag_profile_model.exists() {
                if let Some(item) = Self::inspect_cache_dir(
                    "antigravity_model",
                    "Antigravity IDE",
                    "sparkles",
                    "AI On-Device Model Weights (weights.bin)",
                    "Offline Gemma/Gemini model weights cached for the in-browser subagent.",
                    &ag_profile_model,
                    RiskLevel::Safe,
                    "Safe to remove. Weights will automatically re-download if on-device model feature is used.",
                ) {
                    items.push(item);
                }
            }

            // Antigravity Browser Profile Chromium Web Cache
            let ag_profile_cache = h.join(".gemini").join("antigravity-browser-profile").join("Default").join("Cache");
            if ag_profile_cache.exists() {
                if let Some(item) = Self::inspect_cache_dir(
                    "antigravity_browser_cache",
                    "Antigravity IDE",
                    "globe",
                    "Browser Subagent Chromium Web Cache",
                    "HTTP disk cache, GPUCache, and IndexedDB blobs created during browser sessions.",
                    &ag_profile_cache,
                    RiskLevel::Safe,
                    "100% safe to clear. Standard browser web cache.",
                ) {
                    items.push(item);
                }
            }
        }

        // 2. VS Code Caches
        if let Some(ref ro) = appdata {
            let code_cache = ro.join("Code").join("Cache");
            if code_cache.exists() {
                if let Some(item) = Self::inspect_cache_dir(
                    "vscode_cache",
                    "VS Code",
                    "code",
                    "HTTP & Network Cache",
                    "Editor webview cache, downloaded extension assets, and update temporary files.",
                    &code_cache,
                    RiskLevel::Safe,
                    "100% safe to clear. Does not touch code, workspace settings, or installed extensions.",
                ) {
                    items.push(item);
                }
            }

            let code_cached_data = ro.join("Code").join("CachedData");
            if code_cached_data.exists() {
                if let Some(item) = Self::inspect_cache_dir(
                    "vscode_cached_data",
                    "VS Code",
                    "code",
                    "V8 Bytecode & Extension AST Cache",
                    "Pre-compiled V8 JavaScript bytecode generated for fast VS Code startup.",
                    &code_cached_data,
                    RiskLevel::Safe,
                    "Safe to purge. Rebuilds automatically on next editor launch.",
                ) {
                    items.push(item);
                }
            }

            let code_workspace = ro.join("Code").join("User").join("workspaceStorage");
            if code_workspace.exists() {
                if let Some(item) = Self::inspect_cache_dir(
                    "vscode_workspace_storage",
                    "VS Code",
                    "folder-code",
                    "Workspace Language Server Storage",
                    "Indexed symbol ASTs, search cache, and TypeScript project states.",
                    &code_workspace,
                    RiskLevel::Low,
                    "Safe to remove. Editor will re-index symbols next time you open a project.",
                ) {
                    items.push(item);
                }
            }
        }

        // 3. Cursor AI Editor Caches
        if let Some(ref ro) = appdata {
            let cursor_cache = ro.join("Cursor").join("Cache");
            if cursor_cache.exists() {
                if let Some(item) = Self::inspect_cache_dir(
                    "cursor_cache",
                    "Cursor AI",
                    "sparkles",
                    "Cursor Editor Web & Model Cache",
                    "AI completions cache, extension assets, and temporary editor session state.",
                    &cursor_cache,
                    RiskLevel::Safe,
                    "100% safe to purge.",
                ) {
                    items.push(item);
                }
            }

            let cursor_workspace = ro.join("Cursor").join("User").join("workspaceStorage");
            if cursor_workspace.exists() {
                if let Some(item) = Self::inspect_cache_dir(
                    "cursor_workspace_storage",
                    "Cursor AI",
                    "code",
                    "Cursor Workspace & Symbol Index",
                    "Project-specific embeddings and language server caches.",
                    &cursor_workspace,
                    RiskLevel::Low,
                    "Safe to purge. Re-indexes when projects are opened.",
                ) {
                    items.push(item);
                }
            }
        }

        // 4. Node.js & Package Managers (npm, pnpm, yarn, bun)
        if let Some(ref loc) = local_appdata {
            let npm_cache = loc.join("npm-cache");
            if npm_cache.exists() {
                if let Some(item) = Self::inspect_cache_dir(
                    "npm_cache",
                    "npm",
                    "package",
                    "Global npm Tarball Cache",
                    "Cached `.tgz` tarballs of packages downloaded via `npm install`.",
                    &npm_cache,
                    RiskLevel::Safe,
                    "100% safe to purge (equivalent to `npm cache clean --force`). Packages re-download if requested.",
                ) {
                    items.push(item);
                }
            }

            let pnpm_cache = loc.join("pnpm-cache");
            if pnpm_cache.exists() {
                if let Some(item) = Self::inspect_cache_dir(
                    "pnpm_cache",
                    "pnpm",
                    "package",
                    "pnpm Download Cache",
                    "HTTP response cache and downloaded package metadata for pnpm.",
                    &pnpm_cache,
                    RiskLevel::Safe,
                    "100% safe to delete. Does not corrupt project node_modules or global store hard links.",
                ) {
                    items.push(item);
                }
            }

            let yarn_cache = loc.join("Yarn").join("Cache");
            if yarn_cache.exists() {
                if let Some(item) = Self::inspect_cache_dir(
                    "yarn_cache",
                    "Yarn",
                    "package",
                    "Yarn v1/v2 Package Cache",
                    "Cached package archives stored from yarn installations.",
                    &yarn_cache,
                    RiskLevel::Safe,
                    "100% safe to purge.",
                ) {
                    items.push(item);
                }
            }
        }

        // Unix/macOS package caches
        if let Some(ref c) = cache_dir {
            let npm_unix = c.join("npm");
            if npm_unix.exists() {
                if let Some(item) = Self::inspect_cache_dir(
                    "npm_unix_cache",
                    "npm",
                    "package",
                    "npm HTTP Cache",
                    "Package tarballs and registry cache.",
                    &npm_unix,
                    RiskLevel::Safe,
                    "Safe to purge.",
                ) {
                    items.push(item);
                }
            }
        }

        // 5. Rust / Cargo Cache
        if let Some(ref h) = home {
            let cargo_cache = h.join(".cargo").join("registry").join("cache");
            if cargo_cache.exists() {
                if let Some(item) = Self::inspect_cache_dir(
                    "cargo_cache",
                    "Rust Cargo",
                    "cpu",
                    "Cargo Downloaded .crate Archives",
                    "Gzipped source tarballs of crates downloaded from crates.io.",
                    &cargo_cache,
                    RiskLevel::Safe,
                    "100% safe to purge. Does not touch your project code or compiled binaries; Cargo will re-download on build if missing.",
                ) {
                    items.push(item);
                }
            }
        }

        // 6. Python / pip / uv
        if let Some(ref loc) = local_appdata {
            let pip_cache = loc.join("pip").join("cache");
            if pip_cache.exists() {
                if let Some(item) = Self::inspect_cache_dir(
                    "pip_cache",
                    "Python pip",
                    "terminal",
                    "Python Wheel & Source Cache",
                    "Downloaded `.whl` and `.tar.gz` distribution wheels from PyPI.",
                    &pip_cache,
                    RiskLevel::Safe,
                    "100% safe to purge (equivalent to `pip cache purge`).",
                ) {
                    items.push(item);
                }
            }

            let uv_cache = loc.join("uv").join("cache");
            if uv_cache.exists() {
                if let Some(item) = Self::inspect_cache_dir(
                    "uv_cache",
                    "Astral uv",
                    "terminal",
                    "Fast Python Package Cache",
                    "Pre-built virtualenv artifacts and wheel cache.",
                    &uv_cache,
                    RiskLevel::Safe,
                    "100% safe to purge.",
                ) {
                    items.push(item);
                }
            }
        }

        // 7. Java / Gradle / Maven Caches
        if let Some(ref h) = home {
            let gradle_cache = h.join(".gradle").join("caches");
            if gradle_cache.exists() {
                if let Some(item) = Self::inspect_cache_dir(
                    "gradle_cache",
                    "Gradle",
                    "coffee",
                    "Gradle Dependency & Wrapper Cache",
                    "Downloaded JAR dependencies, Gradle distribution wrappers, and build task output hashes.",
                    &gradle_cache,
                    RiskLevel::Safe,
                    "Safe to purge. Gradle will re-download required dependencies on the next project build.",
                ) {
                    items.push(item);
                }
            }

            let m2_repo = h.join(".m2").join("repository");
            if m2_repo.exists() {
                if let Some(item) = Self::inspect_cache_dir(
                    "maven_cache",
                    "Maven",
                    "coffee",
                    "Maven Local Artifact Repository",
                    "Downloaded Java dependency libraries and POM descriptors.",
                    &m2_repo,
                    RiskLevel::Low,
                    "Safe to purge. Cleaned artifacts will re-fetch from central repositories.",
                ) {
                    items.push(item);
                }
            }
        }

        // 8. Go Build Cache
        if let Some(ref loc) = local_appdata {
            let go_cache = loc.join("go-build");
            if go_cache.exists() {
                if let Some(item) = Self::inspect_cache_dir(
                    "go_cache",
                    "Go Toolchain",
                    "binary",
                    "Go Build & Test Cache",
                    "Compiled object packages and test results.",
                    &go_cache,
                    RiskLevel::Safe,
                    "100% safe to clear (equivalent to `go clean -cache`).",
                ) {
                    items.push(item);
                }
            }
        }

        // Sort largest caches first
        items.sort_by(|a, b| b.size_bytes.cmp(&a.size_bytes));
        items
    }

    /// Fast non-blocking directory size and file count inspection.
    pub fn inspect_cache_dir(
        id: &str,
        tool: &str,
        tool_icon: &str,
        name: &str,
        description: &str,
        path: &Path,
        safety_level: RiskLevel,
        safety_explanation: &str,
    ) -> Option<DevCacheItem> {
        let (size_bytes, file_count) = Self::calculate_dir_stats(path);
        if size_bytes == 0 && file_count == 0 {
            return None;
        }

        Some(DevCacheItem {
            id: id.to_string(),
            tool: tool.to_string(),
            tool_icon: tool_icon.to_string(),
            name: name.to_string(),
            description: description.to_string(),
            path: path.to_string_lossy().to_string(),
            size_bytes,
            file_count,
            safety_level,
            safety_explanation: safety_explanation.to_string(),
        })
    }

    /// Recursively calculates total byte size and file count of a directory.
    pub fn calculate_dir_stats(path: &Path) -> (u64, u64) {
        let mut total_bytes = 0;
        let mut file_count = 0;

        let mut stack = vec![path.to_path_buf()];
        while let Some(current_dir) = stack.pop() {
            if let Ok(entries) = std::fs::read_dir(&current_dir) {
                for entry_res in entries {
                    if let Ok(entry) = entry_res {
                        if let Ok(meta) = entry.metadata() {
                            if meta.is_dir() {
                                stack.push(entry.path());
                            } else if meta.is_file() {
                                total_bytes += meta.len();
                                file_count += 1;
                            }
                        }
                    }
                }
            }
        }

        (total_bytes, file_count)
    }

    /// Purges the specified cache targets safely.
    pub fn clean_cache_targets(target_ids: &[String], prefer_trash: bool) -> DevCacheCleanSummary {
        let all_available = Self::scan_system_caches();
        let target_set: std::collections::HashSet<&str> = target_ids.iter().map(|s| s.as_str()).collect();

        let mut total_freed_bytes = 0;
        let mut successful_count = 0;
        let mut failed_count = 0;
        let mut results = Vec::new();

        for item in all_available {
            if !target_set.contains(item.id.as_str()) {
                continue;
            }

            let path = PathBuf::from(&item.path);
            if !path.exists() {
                failed_count += 1;
                results.push(DevCacheCleanResult {
                    id: item.id,
                    path: item.path,
                    success: false,
                    bytes_freed: 0,
                    error: Some("Path no longer exists".to_string()),
                });
                continue;
            }

            // Security check against protected paths
            if PathValidator::is_protected_system_path(&path) {
                failed_count += 1;
                results.push(DevCacheCleanResult {
                    id: item.id,
                    path: item.path,
                    success: false,
                    bytes_freed: 0,
                    error: Some("Protected system path cannot be purged".to_string()),
                });
                continue;
            }

            let freed = item.size_bytes;
            let op_res = if prefer_trash {
                trash::delete(&path).map_err(|e| format!("Recycle bin deletion failed: {}", e))
            } else {
                std::fs::remove_dir_all(&path).map_err(|e| format!("Directory removal failed: {}", e))
            };

            match op_res {
                Ok(_) => {
                    successful_count += 1;
                    total_freed_bytes += freed;
                    results.push(DevCacheCleanResult {
                        id: item.id,
                        path: item.path,
                        success: true,
                        bytes_freed: freed,
                        error: None,
                    });
                }
                Err(err_msg) => {
                    failed_count += 1;
                    results.push(DevCacheCleanResult {
                        id: item.id,
                        path: item.path,
                        success: false,
                        bytes_freed: 0,
                        error: Some(err_msg),
                    });
                }
            }
        }

        DevCacheCleanSummary {
            total_freed_bytes,
            successful_count,
            failed_count,
            results,
        }
    }
}
