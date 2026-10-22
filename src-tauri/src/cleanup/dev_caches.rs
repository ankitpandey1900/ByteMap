use crate::models::RiskLevel;
use crate::security::PathValidator;
use rayon::prelude::*;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

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

#[derive(Debug, Clone)]
pub struct CacheDescriptor {
    pub id: &'static str,
    pub tool: &'static str,
    pub tool_icon: &'static str,
    pub name: &'static str,
    pub description: &'static str,
    pub path: PathBuf,
    pub safety_level: RiskLevel,
    pub safety_explanation: &'static str,
}

pub struct DevCacheScanner;

impl DevCacheScanner {
    /// Builds the list of known toolchain and IDE cache directory candidates.
    pub fn get_candidate_descriptors() -> Vec<CacheDescriptor> {
        let mut descriptors = Vec::new();

        let home = dirs::home_dir();
        let appdata = dirs::data_dir(); // Roaming on Windows, Library/Application Support on macOS
        let local_appdata = dirs::data_local_dir(); // Local on Windows, Library/Caches or App Support on macOS
        let cache_dir = dirs::cache_dir();

        // 1. Google Antigravity IDE Caches
        if let Some(ref h) = home {
            descriptors.push(CacheDescriptor {
                id: "antigravity_brain",
                tool: "Antigravity IDE",
                tool_icon: "brain",
                name: "Session Brain, Transcripts & Media Recordings",
                description: "Temporary subagent screen captures, video recordings, scratch files, and trajectory logs.",
                path: h.join(".gemini").join("antigravity-ide").join("brain"),
                safety_level: RiskLevel::Safe,
                safety_explanation: "Safe to purge. These are scratch recordings and temp logs from completed agent sessions.",
            });

            descriptors.push(CacheDescriptor {
                id: "antigravity_model",
                tool: "Antigravity IDE",
                tool_icon: "sparkles",
                name: "AI On-Device Model Weights (weights.bin)",
                description: "Offline Gemma/Gemini model weights cached for the in-browser subagent.",
                path: h.join(".gemini").join("antigravity-browser-profile").join("OptGuideOnDeviceModel"),
                safety_level: RiskLevel::Safe,
                safety_explanation: "Safe to remove. Weights will automatically re-download if on-device model feature is used.",
            });

            descriptors.push(CacheDescriptor {
                id: "antigravity_browser_cache",
                tool: "Antigravity IDE",
                tool_icon: "globe",
                name: "Browser Subagent Chromium Web Cache",
                description: "HTTP disk cache, GPUCache, and IndexedDB blobs created during browser sessions.",
                path: h.join(".gemini").join("antigravity-browser-profile").join("Default").join("Cache"),
                safety_level: RiskLevel::Safe,
                safety_explanation: "100% safe to clear. Standard browser web cache.",
            });
        }

        // 2. VS Code Caches
        if let Some(ref ro) = appdata {
            descriptors.push(CacheDescriptor {
                id: "vscode_cache",
                tool: "VS Code",
                tool_icon: "code",
                name: "HTTP & Network Cache",
                description: "Editor webview cache, downloaded extension assets, and update temporary files.",
                path: ro.join("Code").join("Cache"),
                safety_level: RiskLevel::Safe,
                safety_explanation: "100% safe to clear. Does not touch code, workspace settings, or installed extensions.",
            });

            descriptors.push(CacheDescriptor {
                id: "vscode_cached_data",
                tool: "VS Code",
                tool_icon: "code",
                name: "V8 Bytecode & Extension AST Cache",
                description:
                    "Pre-compiled V8 JavaScript bytecode generated for fast VS Code startup.",
                path: ro.join("Code").join("CachedData"),
                safety_level: RiskLevel::Safe,
                safety_explanation: "Safe to purge. Rebuilds automatically on next editor launch.",
            });

            descriptors.push(CacheDescriptor {
                id: "vscode_workspace_storage",
                tool: "VS Code",
                tool_icon: "folder-code",
                name: "Workspace Language Server Storage",
                description: "Indexed symbol ASTs, search cache, and TypeScript project states.",
                path: ro.join("Code").join("User").join("workspaceStorage"),
                safety_level: RiskLevel::Low,
                safety_explanation:
                    "Safe to remove. Editor will re-index symbols next time you open a project.",
            });
        }

        // 3. Cursor AI Editor Caches
        if let Some(ref ro) = appdata {
            descriptors.push(CacheDescriptor {
                id: "cursor_cache",
                tool: "Cursor AI",
                tool_icon: "sparkles",
                name: "Cursor Editor Web & Model Cache",
                description:
                    "AI completions cache, extension assets, and temporary editor session state.",
                path: ro.join("Cursor").join("Cache"),
                safety_level: RiskLevel::Safe,
                safety_explanation: "100% safe to purge.",
            });

            descriptors.push(CacheDescriptor {
                id: "cursor_workspace_storage",
                tool: "Cursor AI",
                tool_icon: "code",
                name: "Cursor Workspace & Symbol Index",
                description: "Project-specific embeddings and language server caches.",
                path: ro.join("Cursor").join("User").join("workspaceStorage"),
                safety_level: RiskLevel::Low,
                safety_explanation: "Safe to purge. Re-indexes when projects are opened.",
            });
        }

        // 4. Node.js & Package Managers (npm, pnpm, yarn, bun)
        if let Some(ref loc) = local_appdata {
            descriptors.push(CacheDescriptor {
                id: "npm_cache",
                tool: "npm",
                tool_icon: "package",
                name: "Global npm Tarball Cache",
                description: "Cached `.tgz` tarballs of packages downloaded via `npm install`.",
                path: loc.join("npm-cache"),
                safety_level: RiskLevel::Safe,
                safety_explanation: "100% safe to purge (equivalent to `npm cache clean --force`). Packages re-download if requested.",
            });

            descriptors.push(CacheDescriptor {
                id: "pnpm_cache",
                tool: "pnpm",
                tool_icon: "package",
                name: "pnpm Download Cache",
                description: "HTTP response cache and downloaded package metadata for pnpm.",
                path: loc.join("pnpm-cache"),
                safety_level: RiskLevel::Safe,
                safety_explanation: "100% safe to delete. Does not corrupt project node_modules or global store hard links.",
            });

            descriptors.push(CacheDescriptor {
                id: "yarn_cache",
                tool: "Yarn",
                tool_icon: "package",
                name: "Yarn v1/v2 Package Cache",
                description: "Cached package archives stored from yarn installations.",
                path: loc.join("Yarn").join("Cache"),
                safety_level: RiskLevel::Safe,
                safety_explanation: "100% safe to purge.",
            });
        }

        // Unix/macOS package caches
        if let Some(ref c) = cache_dir {
            descriptors.push(CacheDescriptor {
                id: "npm_unix_cache",
                tool: "npm",
                tool_icon: "package",
                name: "npm HTTP Cache",
                description: "Package tarballs and registry cache.",
                path: c.join("npm"),
                safety_level: RiskLevel::Safe,
                safety_explanation: "Safe to purge.",
            });
        }

        // 5. Rust / Cargo Cache
        if let Some(ref h) = home {
            descriptors.push(CacheDescriptor {
                id: "cargo_cache",
                tool: "Rust Cargo",
                tool_icon: "cpu",
                name: "Cargo Downloaded .crate Archives",
                description: "Gzipped source tarballs of crates downloaded from crates.io.",
                path: h.join(".cargo").join("registry").join("cache"),
                safety_level: RiskLevel::Safe,
                safety_explanation: "100% safe to purge. Does not touch your project code or compiled binaries; Cargo will re-download on build if missing.",
            });
        }

        // 6. Python / pip / uv
        if let Some(ref loc) = local_appdata {
            descriptors.push(CacheDescriptor {
                id: "pip_cache",
                tool: "Python pip",
                tool_icon: "terminal",
                name: "Python Wheel & Source Cache",
                description: "Downloaded `.whl` and `.tar.gz` distribution wheels from PyPI.",
                path: loc.join("pip").join("cache"),
                safety_level: RiskLevel::Safe,
                safety_explanation: "100% safe to purge (equivalent to `pip cache purge`).",
            });

            descriptors.push(CacheDescriptor {
                id: "uv_cache",
                tool: "Astral uv",
                tool_icon: "terminal",
                name: "Fast Python Package Cache",
                description: "Pre-built virtualenv artifacts and wheel cache.",
                path: loc.join("uv").join("cache"),
                safety_level: RiskLevel::Safe,
                safety_explanation: "100% safe to purge.",
            });
        }

        // 7. Java / Gradle / Maven Caches
        if let Some(ref h) = home {
            descriptors.push(CacheDescriptor {
                id: "gradle_cache",
                tool: "Gradle",
                tool_icon: "coffee",
                name: "Gradle Dependency & Wrapper Cache",
                description: "Downloaded JAR dependencies, Gradle distribution wrappers, and build task output hashes.",
                path: h.join(".gradle").join("caches"),
                safety_level: RiskLevel::Safe,
                safety_explanation: "Safe to purge. Gradle will re-download required dependencies on the next project build.",
            });

            descriptors.push(CacheDescriptor {
                id: "maven_cache",
                tool: "Maven",
                tool_icon: "coffee",
                name: "Maven Local Artifact Repository",
                description: "Downloaded Java dependency libraries and POM descriptors.",
                path: h.join(".m2").join("repository"),
                safety_level: RiskLevel::Low,
                safety_explanation:
                    "Safe to purge. Cleaned artifacts will re-fetch from central repositories.",
            });
        }

        // 8. Go Build Cache
        if let Some(ref loc) = local_appdata {
            descriptors.push(CacheDescriptor {
                id: "go_cache",
                tool: "Go Toolchain",
                tool_icon: "binary",
                name: "Go Build & Test Cache",
                description: "Compiled object packages and test results.",
                path: loc.join("go-build"),
                safety_level: RiskLevel::Safe,
                safety_explanation: "100% safe to clear (equivalent to `go clean -cache`).",
            });
        }

        descriptors
    }

    /// Discovers system-wide coding and IDE caches across known toolchain paths concurrently using Rayon.
    pub fn scan_system_caches() -> Vec<DevCacheItem> {
        let candidates = Self::get_candidate_descriptors();

        let mut items: Vec<DevCacheItem> = candidates
            .into_par_iter()
            .filter_map(|c| {
                if c.path.exists() {
                    Self::inspect_cache_dir(
                        c.id,
                        c.tool,
                        c.tool_icon,
                        c.name,
                        c.description,
                        &c.path,
                        c.safety_level,
                        c.safety_explanation,
                    )
                } else {
                    None
                }
            })
            .collect();

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

    /// Recursively calculates total byte size and file count of a directory without blocking metadata calls.
    pub fn calculate_dir_stats(path: &Path) -> (u64, u64) {
        let mut total_bytes = 0;
        let mut file_count = 0;

        let mut stack = vec![path.to_path_buf()];
        while let Some(current_dir) = stack.pop() {
            if let Ok(entries) = std::fs::read_dir(&current_dir) {
                for entry_res in entries {
                    if let Ok(entry) = entry_res {
                        if let Ok(file_type) = entry.file_type() {
                            if file_type.is_dir() {
                                stack.push(entry.path());
                            } else if file_type.is_file() {
                                if let Ok(meta) = entry.metadata() {
                                    total_bytes += meta.len();
                                    file_count += 1;
                                }
                            }
                        }
                    }
                }
            }
        }

        (total_bytes, file_count)
    }

    /// Purges ONLY the specified cache targets safely without re-scanning untouched caches.
    pub fn clean_cache_targets(target_ids: &[String], prefer_trash: bool) -> DevCacheCleanSummary {
        let target_set: std::collections::HashSet<&str> =
            target_ids.iter().map(|s| s.as_str()).collect();

        let candidates = Self::get_candidate_descriptors();
        let target_candidates: Vec<CacheDescriptor> = candidates
            .into_iter()
            .filter(|c| target_set.contains(c.id))
            .collect();

        let mut total_freed_bytes = 0;
        let mut successful_count = 0;
        let mut failed_count = 0;
        let mut results = Vec::new();

        for desc in target_candidates {
            let path = desc.path;
            if !path.exists() {
                failed_count += 1;
                results.push(DevCacheCleanResult {
                    id: desc.id.to_string(),
                    path: path.to_string_lossy().to_string(),
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
                    id: desc.id.to_string(),
                    path: path.to_string_lossy().to_string(),
                    success: false,
                    bytes_freed: 0,
                    error: Some("Protected system path cannot be purged".to_string()),
                });
                continue;
            }

            let (freed, _) = Self::calculate_dir_stats(&path);
            let op_res = if prefer_trash {
                trash::delete(&path).map_err(|e| format!("Recycle bin deletion failed: {}", e))
            } else {
                std::fs::remove_dir_all(&path)
                    .map_err(|e| format!("Directory removal failed: {}", e))
            };

            match op_res {
                Ok(_) => {
                    successful_count += 1;
                    total_freed_bytes += freed;
                    results.push(DevCacheCleanResult {
                        id: desc.id.to_string(),
                        path: path.to_string_lossy().to_string(),
                        success: true,
                        bytes_freed: freed,
                        error: None,
                    });
                }
                Err(err_msg) => {
                    failed_count += 1;
                    results.push(DevCacheCleanResult {
                        id: desc.id.to_string(),
                        path: path.to_string_lossy().to_string(),
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
