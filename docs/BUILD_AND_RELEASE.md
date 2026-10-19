# ByteMap Packaging & Release Guide

How to build and package standalone release binaries for ByteMap.

---

## 1. Creating a Production Build

To build the optimized production application and native installers:

```bash
pnpm tauri build
```

This runs:
1. `pnpm build` (compiles TypeScript and bundles React via Vite into `dist/`).
2. `cargo build --release` (compiles the Rust backend with LTO and optimizations).
3. The Tauri packager (creates native desktop installers).

---

## 2. Output Locations

Once the build finishes, your installer files are located at:

### Windows
- **NSIS Setup Installer**: `src-tauri/target/release/bundle/nsis/ByteMap_<version>_x64-setup.exe`
- **MSI Package**: `src-tauri/target/release/bundle/msi/ByteMap_<version>_x64_en-US.msi`
- **Raw Executable**: `src-tauri/target/release/bytemap.exe`

### macOS
- **Universal DMG (Apple Silicon M1-M4 & Intel)**: `src-tauri/target/release/bundle/dmg/ByteMap_<version>_universal.dmg`
- **App Bundle**: `src-tauri/target/release/bundle/macos/ByteMap.app`

### Linux
- **Debian Package**: `src-tauri/target/release/bundle/deb/bytemap_<version>_amd64.deb`
- **AppImage**: `src-tauri/target/release/bundle/appimage/bytemap_<version>_amd64.AppImage`

---

## 3. Automated GitHub Actions CI/CD Pipeline

Official releases are automated through GitHub Actions (`.github/workflows/release.yml`):

1. **Trigger**: Pushing a version tag (e.g. `git tag -a v1.0.5 -m "Release v1.0.5" && git push origin v1.0.5`).
2. **Matrix Build**:
   - `windows-latest`: Builds Windows NSIS setup (`.exe`), MSI package (`.msi`), and updater tarballs.
   - `macos-latest`: Builds macOS Universal `.dmg` (compiling both `aarch64-apple-darwin` and `x86_64-apple-darwin` into a single universal binary) and `.app.tar.gz` updater bundles.
3. **Cryptographic Signing**: Tauri auto-updater payloads are signed with Minisign (`TAURI_SIGNING_PRIVATE_KEY`).
4. **Publishing**: Generates `latest.json` and attaches all artifacts to the GitHub Release.

---

## 4. Pre-Release Checklist

Before tagging a new release:
1. Run `pnpm test` to make sure all 26 unit and component tests pass.
2. Run `pnpm build` to verify 0 TypeScript compilation errors.
3. Run `pnpm website:build` to confirm the public landing site builds cleanly.
4. Run `cargo fmt --all --check` inside `src-tauri/` to satisfy CI formatting requirements.
5. Make sure the version string matches across:
   - `package.json`
   - `src-tauri/Cargo.toml`
   - `src-tauri/tauri.conf.json`
   - `website/package.json` and website download components.
