use crate::models::FileCategory;

pub fn categorize_extension(ext: &str) -> FileCategory {
    let ext_lower = ext.to_lowercase();
    match ext_lower.as_str() {
        // Videos
        "mp4" | "mkv" | "mov" | "avi" | "wmv" | "flv" | "webm" | "m4v" | "mpg" | "mpeg" | "3gp"
        | "m2ts" | "mts" | "vob" => FileCategory::Video,

        // Images
        "jpg" | "jpeg" | "png" | "gif" | "bmp" | "webp" | "svg" | "tiff" | "tif" | "ico"
        | "raw" | "cr2" | "nef" | "heic" | "psd" | "ai" => FileCategory::Image,

        // Audio
        "mp3" | "wav" | "flac" | "aac" | "ogg" | "wma" | "m4a" | "alac" | "opus" | "aiff"
        | "mid" | "midi" => FileCategory::Audio,

        // Documents
        "pdf" | "doc" | "docx" | "xls" | "xlsx" | "ppt" | "pptx" | "odt" | "ods" | "odp"
        | "rtf" | "txt" | "md" | "csv" | "epub" | "pages" | "numbers" | "key" => {
            FileCategory::Document
        }

        // Archives
        "zip" | "rar" | "7z" | "tar" | "gz" | "bz2" | "xz" | "tgz" | "iso" | "dmg" | "cab"
        | "z" => FileCategory::Archive,

        // Applications & Installers
        "exe" | "msi" | "app" | "bat" | "cmd" | "ps1" | "sh" | "bin" | "deb" | "rpm" | "apk"
        | "ipa" | "jar" => FileCategory::App,

        // Development
        "rs" | "ts" | "tsx" | "js" | "jsx" | "py" | "go" | "c" | "cpp" | "h" | "hpp" | "cs"
        | "java" | "kt" | "swift" | "rb" | "php" | "html" | "css" | "scss" | "json" | "yaml"
        | "yml" | "toml" | "xml" | "sql" | "graphql" | "lock" => FileCategory::Dev,

        // Games
        "pak" | "vpk" | "wad" | "bsp" | "sav" | "rom" | "gba" | "nes" | "sfc" | "nds" => {
            FileCategory::Game
        }

        _ => FileCategory::Other,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_categorize_extension() {
        assert_eq!(categorize_extension("mp4"), FileCategory::Video);
        assert_eq!(categorize_extension("mkv"), FileCategory::Video);
        assert_eq!(categorize_extension("JPG"), FileCategory::Image);
        assert_eq!(categorize_extension("png"), FileCategory::Image);
        assert_eq!(categorize_extension("pdf"), FileCategory::Document);
        assert_eq!(categorize_extension("docx"), FileCategory::Document);
        assert_eq!(categorize_extension("zip"), FileCategory::Archive);
        assert_eq!(categorize_extension("7z"), FileCategory::Archive);
        assert_eq!(categorize_extension("rs"), FileCategory::Dev);
        assert_eq!(categorize_extension("ts"), FileCategory::Dev);
        assert_eq!(categorize_extension("tsx"), FileCategory::Dev);
        assert_eq!(categorize_extension("exe"), FileCategory::App);
        assert_eq!(categorize_extension("msi"), FileCategory::App);
        assert_eq!(categorize_extension("unknown_xyz"), FileCategory::Other);
    }
}
