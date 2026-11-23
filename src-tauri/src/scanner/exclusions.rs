use crate::models::ScanOptions;
use std::path::Path;
use walkdir::DirEntry;

pub struct ExclusionFilter {
    exclude_hidden: bool,
    exclude_patterns: Vec<String>,
}

impl ExclusionFilter {
    pub fn new(options: &ScanOptions) -> Self {
        Self {
            exclude_hidden: options.exclude_hidden,
            exclude_patterns: options
                .exclude_patterns
                .iter()
                .map(|p| p.to_lowercase())
                .collect(),
        }
    }

    /// Primary filter used by WalkDir's filter_entry to prune entire subtrees immediately
    pub fn should_exclude_dir_entry(&self, entry: &DirEntry, root_path: &Path) -> bool {
        let path = entry.path();

        // 1. Never exclude the scan root directory itself
        if path == root_path {
            return false;
        }

        let file_name = entry.file_name().to_string_lossy();
        let file_name_lower = file_name.to_lowercase();
        let path_str = path.to_string_lossy();
        let path_lower = path_str.to_lowercase();

        // 2. macOS & Unix Filesystem Boundary & Loop Protection
        #[cfg(unix)]
        {
            let root_str = root_path.to_string_lossy();

            // When scanning root '/', never cross into '/Volumes' (which mounts all external drives, network shares, and DMGs)
            if root_str == "/" && (path_lower == "/volumes" || path_lower.starts_with("/volumes/")) {
                return true;
            }

            // In macOS Catalina+, '/' is a read-only system snapshot; user data lives at '/System/Volumes/Data'.
            // To prevent double-counting 256GB into 500GB+, block recursing into '/System/Volumes/Data' if root is '/'
            if root_str == "/"
                && (path_lower == "/system/volumes/data"
                    || path_lower.starts_with("/system/volumes/data/"))
            {
                return true;
            }

            // Block macOS internal virtual/preboot/update sub-volumes
            if path_lower.starts_with("/system/volumes/vm")
                || path_lower.starts_with("/system/volumes/preboot")
                || path_lower.starts_with("/system/volumes/update")
            {
                return true;
            }

            // Block macOS Time Machine local snapshots and system databases
            if file_name_lower == ".timemachine"
                || file_name_lower == ".mobilebackups"
                || file_name_lower == ".documentrevisions-v100"
                || file_name_lower == ".spotlight-v100"
                || file_name_lower == ".fseventsd"
                || path_lower.contains("com.apple.timemachine.localsnapshots")
            {
                return true;
            }

            // Block virtual POSIX pseudo-filesystems
            if path_lower == "/dev"
                || path_lower.starts_with("/dev/")
                || path_lower == "/proc"
                || path_lower.starts_with("/proc/")
                || path_lower == "/sys"
                || path_lower.starts_with("/sys/")
                || path_lower == "/net"
                || path_lower.starts_with("/net/")
            {
                return true;
            }
        }

        // 3. Hidden file / directory check
        if self.exclude_hidden {
            if file_name.starts_with('.') {
                return true;
            }
            #[cfg(windows)]
            {
                use std::os::windows::fs::MetadataExt;
                if let Ok(meta) = entry.metadata() {
                    const FILE_ATTRIBUTE_HIDDEN: u32 = 0x2;
                    let attrs = meta.file_attributes();
                    if (attrs & FILE_ATTRIBUTE_HIDDEN) != 0 {
                        return true;
                    }
                }
            }
        }

        // 4. Pattern matching on file name and path components
        for pattern in &self.exclude_patterns {
            if file_name_lower == *pattern || file_name_lower.contains(pattern) {
                return true;
            }
            // Also check path segments (e.g. '$recycle.bin', 'system volume information')
            if path_lower.contains(pattern) {
                return true;
            }
        }

        false
    }

    pub fn should_exclude(&self, path: &Path, is_hidden: bool) -> bool {
        if self.exclude_hidden && is_hidden {
            return true;
        }

        let file_name = match path.file_name() {
            Some(name) => name.to_string_lossy().to_lowercase(),
            None => return false,
        };

        let path_lower = path.to_string_lossy().to_lowercase();

        for pattern in &self.exclude_patterns {
            if file_name == *pattern || file_name.contains(pattern) || path_lower.contains(pattern) {
                return true;
            }
        }

        false
    }
}

pub fn is_file_hidden(path: &Path, _metadata: Option<&std::fs::Metadata>) -> bool {
    // Unix-style hidden check: starts with '.' (zero syscalls)
    if let Some(file_name) = path.file_name() {
        if file_name.to_string_lossy().starts_with('.') {
            return true;
        }
    }

    #[cfg(windows)]
    {
        use std::os::windows::fs::MetadataExt;
        if let Some(meta) = _metadata {
            const FILE_ATTRIBUTE_HIDDEN: u32 = 0x2;
            const FILE_ATTRIBUTE_SYSTEM: u32 = 0x4;
            let attrs = meta.file_attributes();
            return (attrs & FILE_ATTRIBUTE_HIDDEN) != 0 || (attrs & FILE_ATTRIBUTE_SYSTEM) != 0;
        }
    }

    false
}
