# ByteMap Build & Release Guide

Instructions for creating development builds, production packages, code signing, and release artifacts.

---

## 1. Local Production Build

To build the standalone release binary and installer:

```bash
# Build production web bundle and native executable
pnpm tauri build
```

The resulting binaries will be placed in:
- **Windows**: `src-tauri/target/release/bundle/msi/bytemap_1.0.0_x64_en-US.msi` and `nsis/bytemap_1.0.0_x64-setup.exe`
- **macOS**: `src-tauri/target/release/bundle/dmg/ByteMap_1.0.0_x64.dmg`
- **Linux**: `src-tauri/target/release/bundle/deb/bytemap_1.0.0_amd64.deb` or `appimage/bytemap_1.0.0_amd64.AppImage`

---

## 2. Release Checklist

1. **Verify Unit Tests**: Run `pnpm test` (all 17 tests must pass).
2. **Type Check**: Run `pnpm build` (must compile with 0 TypeScript errors).
3. **Rust Formatting**: Run `cargo fmt --check` in `src-tauri`.
4. **Rust Lints**: Run `cargo clippy -- -D warnings`.
5. **Version Bump**: Ensure version numbers match in `package.json`, `src-tauri/Cargo.toml`, and `src-tauri/tauri.conf.json`.
6. **Code Signing**: Sign executable using EV Code Signing certificate for Windows Authenticode or Apple Developer ID for macOS notarization.
