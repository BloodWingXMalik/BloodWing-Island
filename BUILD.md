# Building BloodWing

BloodWing is a BloodWing-branded build of [Nectar](https://github.com/kua8/Nectar) (Tauri 2 + Rust + React/TypeScript). This document covers everything needed to build it from a clean Windows machine, plus how to rebuild the brand assets.

## Prerequisites (Windows 11 x64)

| Requirement | Notes |
| --- | --- |
| Windows 11 x64 | WebView2 runtime is preinstalled on Windows 11. |
| Rust (MSVC toolchain) | `rustup default stable-x86_64-pc-windows-msvc`. GNU toolchains are **not** supported by this project. |
| Visual Studio Build Tools 2022 | Install workload **Desktop development with C++** — this provides MSVC (`link.exe`) and the Windows SDK. The free Build Tools edition is enough; the full IDE is not required. |
| Windows 11 SDK | Ships with the C++ workload (10.0.26100 or newer verified). |
| Bun | Used for the frontend and as the `tauri` CLI runner (`bun install`, `bun run tauri ...`). Node.js works too, but all scripts here are verified with Bun. |
| NSIS + WiX | **Not required to install manually** — Tauri downloads the NSIS and WiX toolchains on first bundle. |

Verify the Rust side before building:

```powershell
rustc -V          # expect: rustc 1.xx (…-msvc)
cargo -V
where.exe link    # must resolve to a Visual Studio …\VC\Tools\MSVC\…\bin\Hostx64\x64\link.exe
```

If `link.exe` is missing, open **x64 Native Tools Command Prompt for VS 2022** once, or reinstall the C++ workload. `rustup toolchain install stable-x86_64-pc-windows-msvc` also works if only the GNU toolchain is present.

## Build commands

From the repository root (wherever you cloned it):

```powershell
# 1. Install frontend dependencies (once)
bun install

# 2. Frontend typecheck + production build only
bun run build            # tsc && vite build → dist/

# 3. Rust checks and tests
cargo test --manifest-path src-tauri/Cargo.toml

# 4. Full release build: frontend + Rust + MSI + NSIS bundles
bun run tauri build
```

If `bun` is not on `PATH` in a fresh shell, prepend it (typical WinGet install):

```powershell
$env:Path = "$env:LOCALAPPDATA\Microsoft\WinGet\Links;$env:Path"
```

### Build artifacts

| Artifact | Path |
| --- | --- |
| App executable | `src-tauri/target/release/BloodWing.exe` |
| MSI installer | `src-tauri/target/release/bundle/msi/BloodWing_1.4.1_x64_en-US.msi` |
| NSIS installer (recommended) | `src-tauri/target/release/bundle/nsis/BloodWing_1.4.1_x64-setup.exe` |

The NSIS installer supports **Just me** and **All users** installs and uses the dark BloodWing wizard styling from `installer/build/installer.nsh` with the bitmaps in `installer/assets/`.

### Auto-updater note

`bundle.createUpdaterArtifacts` is set to `false` in `src-tauri/tauri.conf.json`, and the updater endpoint points at a placeholder GitHub repo. **Release builds therefore do not require a signing key.** If you ever want updater artifacts, set the flag back to `true` and provide `TAURI_SIGNING_PRIVATE_KEY` (and its password) as environment variables — otherwise the bundler fails at the very end with “A public key has been found, but no private key”.

## Rebuilding brand assets

The logo, installer bitmaps and app icon are generated, not hand-edited:

```powershell
# Writes public/bloodwing-logo.png (1024 master), public/bloodwing-mark.png (128 UI),
# installer/assets/header.bmp and installer/assets/sidebar.bmp
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/generate-brand-assets.ps1

# Regenerates the whole Tauri icon set (src-tauri/icons/*) from the master PNG
bun run tauri icon public/bloodwing-logo.png
```

`public/bloodwing.svg` (favicon) is a hand-written SVG that mirrors the same mark; update it by hand if the mark changes.

## Optional: the standalone installer app

`installer-app/` is an alternative custom-UI installer (a second Tauri app that embeds the main exe as a payload). It is **not** part of the normal release pipeline; the NSIS/MSI installers above are the supported ones. If you do want to build it:

```powershell
# 1. Build + embed the main app payload
./installer-app/scripts/build-payload.ps1

# 2. Build the installer itself
cd installer-app
bun install
bun run tauri build --no-bundle
# output: installer-app/src-tauri/target/release/… (a native exe, no NSIS wrapping)
```

Note: the installer app still carries its original upstream branding in its own UI; only its payload script was updated for the `BloodWing.exe` name.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `error: linker 'link.exe' not found` | MSVC Build Tools or the C++ workload is missing — see Prerequisites. |
| `failed to run beforeBuildCommand: bun run build` | `bun` is not on `PATH` in the shell that runs `tauri build` (see above). |
| First bundle run downloads NSIS/WiX and appears to hang | Expected; it caches into `%LOCALAPPDATA%\tauri`. Needs network access once. |
| “A public key has been found, but no private key” | `createUpdaterArtifacts` was re-enabled without a signing key — see the updater note. |
| Antivirus flags the installer | Unsigned local build; sign the exe/installer with your own certificate for distribution. |
