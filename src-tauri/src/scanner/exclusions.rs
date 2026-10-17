use crate::models::ScanOptions;
use std::path::Path;

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

    pub fn should_exclude(&self, path: &Path, is_hidden: bool) -> bool {
        if self.exclude_hidden && is_hidden {
            return true;
        }

        let file_name = match path.file_name() {
            Some(name) => name.to_string_lossy().to_lowercase(),
            None => return false,
        };

        for pattern in &self.exclude_patterns {
            if file_name == *pattern || file_name.contains(pattern) {
                return true;
            }
        }

        false
    }
}

pub fn is_file_hidden(path: &Path) -> bool {
    // Unix-style hidden check: starts with '.'
    if let Some(file_name) = path.file_name() {
        if file_name.to_string_lossy().starts_with('.') {
            return true;
        }
    }

    #[cfg(windows)]
    {
        use std::os::windows::fs::MetadataExt;
        if let Ok(metadata) = std::fs::metadata(path) {
            const FILE_ATTRIBUTE_HIDDEN: u32 = 0x2;
            const FILE_ATTRIBUTE_SYSTEM: u32 = 0x4;
            let attrs = metadata.file_attributes();
            if (attrs & FILE_ATTRIBUTE_HIDDEN) != 0 || (attrs & FILE_ATTRIBUTE_SYSTEM) != 0 {
                return true;
            }
        }
    }

    false
}
