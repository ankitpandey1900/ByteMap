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
- **NSIS Installer**: `src-tauri/target/release/bundle/nsis/bytemap_1.0.0_x64-setup.exe`
- **MSI Package**: `src-tauri/target/release/bundle/msi/bytemap_1.0.0_x64_en-US.msi`
- **Raw Executable**: `src-tauri/target/release/bytemap.exe`

### macOS
- **DMG Image**: `src-tauri/target/release/bundle/dmg/ByteMap_1.0.0_x64.dmg`
- **App Bundle**: `src-tauri/target/release/bundle/macos/ByteMap.app`

### Linux
- **Debian Package**: `src-tauri/target/release/bundle/deb/bytemap_1.0.0_amd64.deb`
- **AppImage**: `src-tauri/target/release/bundle/appimage/bytemap_1.0.0_amd64.AppImage`

---

## 3. Pre-Release Checklist

Before tagging a new release:
1. Run `pnpm test` to make sure all 18 unit and component tests pass.
2. Run `pnpm build` to verify 0 TypeScript compilation errors.
3. Make sure the version string matches across:
   - `package.json`
   - `src-tauri/Cargo.toml`
   - `src-tauri/tauri.conf.json`
4. Test running the generated `.exe` or installer on a clean machine to confirm WebView2 launches smoothly.
