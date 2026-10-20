use crate::models::FileCategory;

pub fn categorize_extension(ext: &str) -> FileCategory {
    let ext_lower = ext.to_lowercase();
    match ext_lower.as_str() {
        // Videos
        "mp4" | "mkv" | "mov" | "avi" | "wmv" | "flv" | "webm" | "m4v" | "mpg" | "mpeg" | "3gp"
        | "3g2" | "m2ts" | "vob" | "ogv" | "divx" | "xvid" | "rm" | "rmvb" | "asf" | "f4v"
        | "m4p" | "mpv" | "mpe" | "bik" | "hevc" => FileCategory::Video,

        // Images
        "jpg" | "jpeg" | "png" | "gif" | "bmp" | "webp" | "svg" | "tiff" | "tif" | "ico"
        | "raw" | "cr2" | "cr3" | "nef" | "arw" | "dng" | "orf" | "rw2" | "pef" | "heic"
        | "heif" | "avif" | "jxl" | "psd" | "ai" | "eps" | "cdr" | "xcf" | "indd" | "dwg"
        | "dxf" | "svgz" | "icns" | "cur" => FileCategory::Image,

        // Audio
        "mp3" | "wav" | "flac" | "aac" | "ogg" | "wma" | "m4a" | "alac" | "opus" | "aiff"
        | "mid" | "midi" | "mka" | "ac3" | "dts" | "pcm" | "ra" | "amr" | "ape" | "au" | "voc"
        | "caf" | "wv" | "mp2" | "m4b" | "m4r" => FileCategory::Audio,

        // Documents
        "pdf" | "doc" | "docx" | "xls" | "xlsx" | "ppt" | "pptx" | "odt" | "ods" | "odp"
        | "rtf" | "txt" | "md" | "markdown" | "csv" | "tsv" | "epub" | "mobi" | "azw" | "azw3"
        | "djvu" | "fb2" | "cbr" | "cbz" | "pages" | "numbers" | "key" | "tex" | "latex"
        | "vcf" | "ics" | "pps" | "ppsx" | "xlsm" | "docm" | "pptm" | "xlt" | "xltx" | "dot"
        | "dotx" | "log" => FileCategory::Document,

        // Archives & Disk Images
        "zip" | "rar" | "7z" | "tar" | "gz" | "bz2" | "xz" | "tgz" | "tbz2" | "txz" | "lz"
        | "lzma" | "lzh" | "lz4" | "zst" | "zstd" | "iso" | "dmg" | "cab" | "z" | "wim" | "vhd"
        | "vhdx" | "vdi" | "vmdk" | "img" | "cue" | "nrg" | "mdf" | "cpio" | "ar" | "shar"
        | "sit" | "sitx" => FileCategory::Archive,

        // Applications & Executables
        "exe" | "msi" | "app" | "bat" | "cmd" | "ps1" | "sh" | "bin" | "deb" | "rpm" | "apk"
        | "ipa" | "jar" | "appimage" | "flatpak" | "snap" | "pkg" | "msix" | "appx" | "msp"
        | "run" | "gadget" | "com" | "scr" => FileCategory::App,

        // Development & Code (Comprehensive coverage across languages, frameworks, web, data & config)
        "rs" | "rlib" | "ron" | "ts" | "tsx" | "js" | "jsx" | "mjs" | "cjs" | "mts" | "cts"
        | "map" | "vue" | "svelte" | "astro" | "html" | "htm" | "xhtml" | "css" | "scss"
        | "sass" | "less" | "styl" | "postcss" | "pcss" | "wasm" | "wat" | "mdx" | "jinja"
        | "jinja2" | "j2" | "twig" | "blade" | "hbs" | "handlebars" | "ejs" | "liquid" | "pug"
        | "haml" | "mustache" | "py" | "pyw" | "pyx" | "pxd" | "pyi" | "ipynb" | "go" | "mod"
        | "sum" | "c" | "cc" | "cpp" | "cxx" | "c++" | "cp" | "h" | "hh" | "hpp" | "hxx"
        | "h++" | "inl" | "ipp" | "tpp" | "m" | "mm" | "cs" | "csx" | "fs" | "fsi" | "fsx"
        | "vb" | "vbs" | "xaml" | "razor" | "sln" | "csproj" | "fsproj" | "vbproj" | "props"
        | "targets" | "java" | "kt" | "kts" | "scala" | "sc" | "groovy" | "gvy" | "gradle"
        | "properties" | "pom" | "swift" | "rb" | "erb" | "rake" | "gemspec" | "php" | "phtml"
        | "php3" | "php4" | "php5" | "phps" | "dart" | "lua" | "r" | "rmd" | "jl" | "ex"
        | "exs" | "erl" | "hrl" | "hs" | "lhs" | "ml" | "mli" | "zig" | "nim" | "nims" | "d"
        | "clj" | "cljs" | "cljc" | "edn" | "lisp" | "lsp" | "scm" | "rkt" | "el" | "asm" | "s"
        | "sql" | "pgsql" | "plsql" | "psql" | "sqlite" | "sqlite3" | "graphql" | "gql"
        | "prisma" | "surql" | "json" | "json5" | "jsonc" | "jsonl" | "ndjson" | "geojson"
        | "yaml" | "yml" | "toml" | "xml" | "xsd" | "xsl" | "xslt" | "plist" | "ini" | "cfg"
        | "conf" | "cnf" | "config" | "env" | "envrc" | "example" | "tf" | "tfvars" | "hcl"
        | "dockerfile" | "containerfile" | "k8s" | "bicep" | "makefile" | "mk" | "cmake"
        | "ninja" | "bazel" | "bzl" | "lock" | "lockb" | "proto" | "thrift" | "avsc" => {
            FileCategory::Dev
        }

        // Games & Emulation
        "pak" | "vpk" | "wad" | "bsp" | "sav" | "rom" | "gba" | "nes" | "sfc" | "nds" | "gam"
        | "save" | "n64" | "z64" | "cso" | "gcm" | "xbe" | "xex" | "nsp" | "xci" | "3ds"
        | "cia" | "psx" | "pbp" | "chd" => FileCategory::Game,

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
        assert_eq!(categorize_extension("avif"), FileCategory::Image);
        assert_eq!(categorize_extension("pdf"), FileCategory::Document);
        assert_eq!(categorize_extension("docx"), FileCategory::Document);
        assert_eq!(categorize_extension("zip"), FileCategory::Archive);
        assert_eq!(categorize_extension("zst"), FileCategory::Archive);
        assert_eq!(categorize_extension("rs"), FileCategory::Dev);
        assert_eq!(categorize_extension("ts"), FileCategory::Dev);
        assert_eq!(categorize_extension("tsx"), FileCategory::Dev);
        assert_eq!(categorize_extension("vue"), FileCategory::Dev);
        assert_eq!(categorize_extension("py"), FileCategory::Dev);
        assert_eq!(categorize_extension("ipynb"), FileCategory::Dev);
        assert_eq!(categorize_extension("tf"), FileCategory::Dev);
        assert_eq!(categorize_extension("proto"), FileCategory::Dev);
        assert_eq!(categorize_extension("exe"), FileCategory::App);
        assert_eq!(categorize_extension("msi"), FileCategory::App);
        assert_eq!(categorize_extension("appimage"), FileCategory::App);
        assert_eq!(categorize_extension("flac"), FileCategory::Audio);
        assert_eq!(categorize_extension("gba"), FileCategory::Game);
        assert_eq!(categorize_extension("unknown_xyz"), FileCategory::Other);
    }
}
