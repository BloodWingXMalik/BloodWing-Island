# BloodWing Customization Guide

This document describes what the BloodWing build changes compared to upstream [Nectar](https://github.com/kua8/Nectar) (fork base commit `62c23243e326ae79af8855d5f0e542b98aa9ce3f`, version 1.4.1), where each change lives, and which identifiers are intentionally kept for compatibility.

Everything below is implemented in the real application — no mockups. All upstream functionality (media controls, visualizer, weather, battery, calendar, Pomodoro, taskbar mirroring, tray, search, multi-monitor) is preserved.

## 1. Product identity

| Thing | Upstream | BloodWing |
| --- | --- | --- |
| Product name | Nectar | **BloodWing** (`productName`) |
| App identifier | `com.kua8.nectar` | **`com.bloodwing.notch`** (isolates config from any installed Nectar) |
| Binary name | `nectar.exe` | **`BloodWing.exe`** (`mainBinaryName`) |
| Window titles | `nectar`, `Settings`, `Calendar`, `Overlay`, `Nectar Dock` | `BloodWing`, `BloodWing Settings`, `BloodWing Calendar`, `BloodWing Overlay`, `BloodWing Dock` |
| Tray menu | Quit/Restart Nectar | Quit/Restart BloodWing |
| Single-instance names | `NectarSingleInstance` / `NectarOpenSettings` | `BloodWingSingleInstance` / `BloodWingOpenSettings` |
| Uninstall registry key | `…\Uninstall\Nectar` | `…\Uninstall\BloodWing` (DisplayName/Publisher = BloodWing) |
| Log files | `%APPDATA%\com.kua8.nectar\logs\nectar.log` | `%APPDATA%\com.bloodwing.notch\logs\bloodwing.log` |
| Hidden display-monitor window class | `NectarDisplayMonitor` | `BloodWingDisplayMonitor` |
| NSIS installer functions | `NectarGuiInit` etc. | `BloodWingGuiInit` etc. |

Config directory: `%APPDATA%\com.bloodwing.notch\` (derived from the Tauri identifier). Because the identifier changed, BloodWing starts with fresh settings and can run side by side with an installed Nectar without either interfering with the other.

### Intentionally kept (do not “fix” these)

| Identifier | Why it is kept |
| --- | --- |
| `nectar-*` settings keys, `settings.json` name | Backwards-compatible schema; documented in `SETTINGS.md`; external scripts keep working. |
| Keyring services `Nectar CalDAV`, `Nectar Calendar Link` | Existing saved calendar credentials keep working after the rebrand. |
| Tauri command names (`quit_nectar`, `restart_nectar`, `uninstall_nectar`, …) | Internal IPC identifiers referenced from the frontend; renaming adds risk without user-visible benefit. |
| CSS custom properties `--nectar-*` and classes like `.nectar`, `.nectar-icon-img` | Runtime theme contract written by `src/theme.ts`; renaming would touch every stylesheet for no visual gain. |
| `NECTAR_*` → now `BLOODWING_RESTARTING` env var | Renamed for consistency (all four sites updated). |

## 2. Design system (charcoal + red glass)

All windows import a shared token layer, then a per-window theme layer:

| File | Purpose |
| --- | --- |
| `src/bloodwing.css` | Palette, radii, elevation, glass recipes, motion utility classes, bundled Inter `@font-face`. Imported by every entry point. |
| `src/notch-theme.css` | Notch window surfaces/states (the notch geometry itself stays in framer-motion). |
| `src/dock-theme.css` | Dock surfaces, icon plates, menus, previews. |
| `src/settings-theme.css` | Settings window: cards, rows, controls, toggles. |
| `src/calendar-theme.css` | Calendar window. |
| `src/overlay-theme.css` | Splash/HUD overlays. |

Palette tokens (`:root` in `src/bloodwing.css`):

| Token | Value | Use |
| --- | --- | --- |
| `--bw-bg` | `#0B0C0F` | Base background |
| `--bw-surface` / `--bw-surface-2` / `--bw-surface-3` | `#15171C` / `#1D2027` / `#262A33` | Elevated surfaces |
| `--bw-accent` / `--bw-accent-hover` / `--bw-accent-deep` | `#B51F2E` / `#D02C3D` / `#8E1622` | Brand red accent, hover, pressed |
| `--bw-text` / `--bw-text-muted` | `#F3F4F6` / `#A0A5B0` | Primary/secondary text |
| `--bw-border` / `--bw-border-strong` | translucent white | Hairline borders |
| `--bw-shadow-*`, `--bw-glass-*` | — | Elevation and glass sheen recipes |

To restyle the whole app, change the tokens in `src/bloodwing.css`; per-window files should only reference tokens. To change only the accent, use Settings › Appearance (writes `nectar-theme-color`) — the accent applies in every theme mode, and `theme.ts` still owns the runtime `--nectar-*` values.

The default accent is `#B51F2E` (brand red). Eight preset swatches plus a custom picker live in `src/settings/AppearanceTab.tsx`.

Fonts are bundled locally (`public/fonts/inter-latin*.woff2`); the Google Fonts `@import`s were removed from `App.css`/`Overlay.css` and the CSP no longer allows Google hosts.

## 3. Settings additions

New keys (validated in Rust, documented in `SETTINGS.md`):

- `nectar-reduce-motion`: `"system"` (default) | `"on"` | `"off"`.
- `nectar-motion-intensity`: `"full"` (default) | `"balanced"` | `"minimal"`.

Wiring: `src/motion.tsx` exposes `initMotionPreference()`, `MotionProvider` and `useMotionPreference()`; every entry point calls `initMotionPreference()` and wraps its root in `MotionProvider`. CSS reacts to `bw-reduce-motion` / `bw-motion-balanced` / `bw-motion-minimal` classes on `<html>`; framer-motion reacts through `MotionConfig`.

Settings UI: `src/settings/AppearanceTab.tsx` gained the accent presets and a Motion group; `src/settings/useSettings.ts` owns the state/sync. Unknown keys in `settings.json` are preserved on save (the whole map is read-modify-written).

## 4. Reliability and data safety (Rust)

| Change | Where |
| --- | --- |
| Startup snapshot `settings.backup.json` (once, never overwritten) | `utils::ensure_settings_backup`, called in `main.rs` setup |
| `settings.backup.<unix>.json` before reset, 3 newest kept | `utils::backup_settings_timestamped` / `prune_settings_backups_in`, called by `reset_settings` |
| Input validation for every `save_setting` (key schema, 256 KB cap, finite numbers with ranges, enum whitelists) | `commands::validate_setting` |
| `reset_settings` now emits `settings-reset`, so open windows clear localStorage and reload live | `commands.rs`; listeners in `App.tsx`, `Dock.tsx`, `Overlay.tsx` |
| LOGOFF/SHUTDOWN handled in the console ctrl handler (taskbar restored before Windows tears the process down) | `main.rs` |
| Explorer-restart watchdog: watches `GetShellWindow()`; on change re-registers AppBars with retries | `state::SHELL_WINDOW_HANDLE`, `services::handle_explorer_restart` / `reassert_appbars` |

### Taskbar safety model (unchanged contract, strengthened)

- The native taskbar is only ever hidden through `utils::set_taskbar_visibility`, which writes a marker file `taskbar_hidden.flag` (`abstate=<i32>`) before hiding.
- Every quit path (tray Quit, dock menu Quit, settings Quit, uninstall, ctrl-close/logoff/shutdown) goes through `restore_taskbar_and_exit`, which restores the taskbar and clears the marker.
- On next launch the marker triggers `restore_taskbar_after_crash`, so a force-killed session cannot leave a hidden taskbar.
- Disabling the dock restores the native taskbar; Explorer is never killed as a routine fix.
- `scripts/restore-taskbar.ps1` is the manual emergency fallback (see the script header).

## 5. Performance

| Change | Where |
| --- | --- |
| Brightness worker caches the WMI instance path (`__RELPATH`) instead of running a full `ExecQuery` per slider step; cache is dropped when a set call fails, so display hot-plug is picked up | `services::apply_wmi_brightness` |
| DDC/CI pass for external monitors runs only for the value a drag settles on (250 ms quiet window), not for every intermediate value | `services::setup_brightness_worker` |

Measured on the LOQ 15IRX10 (internal panel): WMI query 40 ms avg, WMI set 34 ms avg, DDC pass 14 ms avg — the old worker paid all three per step (~89 ms) against a 50 ms update cadence, which is what made the slider feel laggy. Numbers and method in `TEST-REPORT.md`.

## 6. Updater

The updater endpoint is a placeholder (`https://github.com/bloodwing/notch/releases/latest/download/latest.json`, which 404s) and `createUpdaterArtifacts` is `false`, so release builds need no signing key and the app never installs an upstream Nectar update over BloodWing. The upstream public key stays in the config; re-point the endpoint and enable signing if you publish updates (see `BUILD.md`).

## 7. Brand assets

Generated by `scripts/generate-brand-assets.ps1` (GDI+, works on Windows PowerShell 5.1):

- `public/bloodwing-logo.png` — 1024×1024 master (source for `bun run tauri icon`).
- `public/bloodwing-mark.png` — 128×128 in-app mark (dock icon, splash, About).
- `installer/assets/header.bmp`, `installer/assets/sidebar.bmp` — NSIS wizard bitmaps.
- `public/bloodwing.svg` — favicon, hand-written to mirror the mark.
- `src-tauri/icons/*` — regenerated from the master via `bun run tauri icon`.

## 8. Known limitations

- `installer-app/` (the optional standalone installer) still shows upstream branding in its own UI; only its payload script was updated.
- `public/nectar.png` / `public/nectar.svg` remain in the repo as unused upstream assets.
- Light theme keeps the upstream light surfaces (only the accent changed); the BloodWing charcoal palette is the dark/default mode.
- Per-monitor accent colors are not supported (one accent for all windows).
