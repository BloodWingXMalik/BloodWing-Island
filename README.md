<div align="center">

<img src="public/bloodwing-mark.png" width="128" alt="BloodWing Island mark" />

# BloodWing Island

**A customised Windows desktop notch and animated dock — dark glass styling with restrained red accents.**

[![License: GPL-3.0](https://img.shields.io/badge/license-GPL--3.0-blue.svg)](LICENSE)
![Platform: Windows](https://img.shields.io/badge/platform-Windows%2011%20x64-0078D4.svg)
[![Built with Tauri](https://img.shields.io/badge/built%20with-Tauri%202-24C8DB.svg)](https://tauri.app)
[![Based on Nectar](https://img.shields.io/badge/based%20on-Nectar%20by%20kua8-8A2BE2.svg)](https://github.com/kua8/Nectar)

</div>

---

## Overview

**BloodWing Island** is a personally maintained, rebranded build of
[Nectar](https://github.com/kua8/Nectar) — a notch and dock replacement for the
Windows taskbar. It keeps everything the upstream project does (media, visualizer,
weather, battery, calendar, Pomodoro, taskbar mirroring, tray, search and
multi-monitor support) and layers on:

- a **charcoal-and-red design system** across every window,
- **reliability hardening** for the taskbar (crash recovery, logoff/shutdown
  restore, Explorer-restart recovery),
- **settings safety** (automatic backups, input validation),
- a **brightness-latency fix** for dragging the brightness slider,
- and its own documentation, test report and release process.

It is a fork, not a rewrite: upstream Nectar is the project this is built on, and
credit belongs there. See [NOTICE.md](NOTICE.md) for the full attribution and
[Credits](#credits) below.

> **Status:** built and verified on a single Windows 11 x64 machine with one
> 1920×1080 display. See [TEST-REPORT.md](TEST-REPORT.md) for exactly what was
> tested, what was not, and the measured results. Nothing in this README claims
> functionality that has not been implemented; claims about *verification* are
> limited to what the test report records.

## Screenshots

> **Placeholder — no screenshots are committed to this repository yet.**
> The images that used to live in `docs/screenshots/` are upstream Nectar's and no
> longer represent this build, so they are intentionally not shown here.
>
> To add genuine captures: run the app, use `Win`+`Shift`+`S` (Snipping Tool) or any
> screenshot tool, and save the files as described in
> [`docs/screenshots/README.md`](docs/screenshots/README.md). A neutral desktop
> background photographs best; avoid capturing personal content.
>
> Recommended set: notch expanded, command center, dock, settings, calendar.

## Features

Everything below exists in this build and is inherited from upstream Nectar unless
noted. See [CUSTOMIZATION.md](CUSTOMIZATION.md) for what this fork changed.

### Notch

- **Four modes**, switched by scrolling or swiping over the notch:
  - **Music** — album art, track info, playback controls and a five-band visualizer
    driven by real system audio (WASAPI loopback).
  - **Command Center** — Wi-Fi, Bluetooth, Do Not Disturb, per-app volume mixer,
    brightness and quick actions.
  - **Status** — battery (hidden automatically on systems without one), weather,
    clock and configurable status widgets.
  - **Calendar** — month view with CalDAV/ICS integration and a built-in Pomodoro
    timer plus stopwatch.
- **Connectivity panel** — the Wi-Fi button on the notch opens an in-notch panel
  that lists saved/available networks and connects with a password prompt. Bluetooth
  has its own toggle and paired-device list; pairing new devices opens Windows
  Settings. Nearby-network scanning requires Windows Location Services, so the panel
  falls back to saved profiles and shows a shortcut when location is off.
- **Stopwatch in the notch** — a running stopwatch replaces the clock continuously
  (with a stopwatch glyph) and returns to the clock when paused or reset. The timer
  still alternates with the clock while it runs.
- **Mouse-wheel or trackpad-swipe** mode switching, or pin a mode in place.
- **Media awareness** — when music starts, the notch can surface the player
  automatically.

### Dock

- **Mirrors your real taskbar** — pinned apps are imported in the same order,
  including Store apps, with real icons and names.
- **Window previews** on hover, context menus that open above the dock, and
  right-click → Quit that ends an app like Task Manager's *End task*.
- **Pinned/running split** with an optional "Mix Pinned & Running" layout.
- **Built-in search** that opens Windows Search, and a tray button that opens the
  real Windows hidden-icons flyout.
- **`Win`+`1`…`9`** shortcuts to launch or focus pinned apps while the dock
  replaces the taskbar.

### Window and taskbar behaviour

- **Visibility modes** for both notch and dock: **Fixed**, **Smart** (hides when
  overlapped by a window) and **Peek** (hidden until you approach the screen edge).
- **Multi-monitor support** — notch and dock each independently target primary, all,
  or one specific monitor.
- **Native taskbar is hidden while the dock is enabled and restored when it is
  disabled, when the app exits, on logoff/shutdown, and after a crash** (see
  [Taskbar safety](#taskbar-safety) below).
- **Explorer-restart recovery** — if Explorer restarts, the dock re-registers
  itself without you doing anything.

### Settings

- All options live in a single `settings.json` that the app watches and applies as
  you save; the settings UI writes the same file.
- **Automatic backups**: a snapshot on startup, plus timestamped copies (3 kept)
  before any reset.
- **Validated input**: keys, sizes, numeric ranges and enum values are checked in
  the Rust backend before anything is written.
- Unknown fields are preserved, and the settings schema is backward compatible with
  upstream Nectar (`nectar-*` keys).

## Visual design

The BloodWing layer is defined in [`src/bloodwing.css`](src/bloodwing.css) and
per-window theme files. Core tokens:

| Token | Value | Use |
| --- | --- | --- |
| `--bw-bg` | `#0B0C0F` | Base background |
| `--bw-elevated` | `#15171C` | Panels, cards |
| `--bw-secondary` | `#1D2027` | Secondary surfaces |
| `--bw-accent` | `#B51F2E` | Accent (restrained red) |
| `--bw-accent-hover` | `#D02C3D` | Hover/active accent |
| `--bw-text` | `#F3F4F6` | Primary text |
| `--bw-text-muted` | `#A0A5B0` | Secondary text |

- Inter is **bundled locally** (no font CDN, no external requests in the UI).
- Translucent borders and glass surfaces are used instead of heavy shadows.
- Accent presets are available in **Settings → Appearance**; the red is the default.
- Motion can be reduced: `nectar-reduce-motion` (`system`/`on`/`off`) and
  `nectar-motion-intensity` (`full`/`balanced`/`minimal`).

Notch and dock geometry and animation springs are unchanged from upstream.

## Technology stack

| Layer | Technology |
| --- | --- |
| Shell | [Tauri 2](https://tauri.app) (WebView2) |
| Backend | Rust (Windows APIs: Win32, COM, WASAPI, WMI, DXVA2) |
| Frontend | React 19 + TypeScript, Vite 7, framer-motion, lucide-react |
| Styling | Hand-written CSS with custom properties (Tailwind is present for tooling) |
| Package manager | [Bun](https://bun.sh) (lockfile committed) |
| Packaging | WiX MSI + NSIS installers via `tauri build` |

## Supported Windows versions

| Version | Status |
| --- | --- |
| **Windows 11 (x64)** | **Verified** — built, launched and tested on Windows 11 Pro build 26300 |
| Windows 10 (x64) | Expected to work (Tauri 2 supports Windows 10 1809+), but **not verified by this fork** |

Windows on ARM and 32-bit Windows are not supported.

## System requirements

- Windows 11 x64 (or Windows 10 1809+ x64, untested — see above)
- **WebView2 runtime** — preinstalled on Windows 11; on Windows 10 the installer
  downloads and installs Microsoft's bootstrapper when it is missing (needs an
  internet connection during setup)
- ~40 MB free disk space for the application (installer is ~6–10 MB)
- A display (multi-monitor supported)

The NSIS installer installs per-user and never asks for administrator rights. There
are no services, drivers or scheduled tasks; autostart (optional) is a single per-user
Run entry, which you can toggle in **Settings → General**.

## Installation

Pick either route — **the GitHub Releases page is the only official source**:

1. **Installer (recommended):** download the latest
   [`BloodWing-Island-Setup-<version>-x64.exe`](../../releases/latest) (NSIS) — it
   installs for the current user with no administrator prompt. An MSI is published
   alongside it for machine-wide installs.
2. **Portable:** download `BloodWing-Island-Portable-<version>-x64.zip`, unpack
   anywhere, run `BloodWing.exe`. Settings live in
   `%APPDATA%\com.bloodwing.notch` either way.

Full step-by-step instructions, upgrade and uninstall procedures, and
troubleshooting live in **[INSTALLATION.md](INSTALLATION.md)**.

> The installers are **not code-signed** (this is an open-source hobby build), so
> Windows SmartScreen will show a "Windows protected your PC" prompt on first run.
> That is expected for unsigned binaries — INSTALLATION.md explains how to verify
> the download with its published SHA-256 checksum. This build never asks you to
> disable Windows Defender or any other protection.

## Build from source

Prerequisites: [Rust](https://rustup.rs) (MSVC toolchain), [Bun](https://bun.sh),
and the Visual Studio C++ build tools (the Rust MSVC target needs them).
[BUILD.md](BUILD.md) has the detailed, tested instructions.

```powershell
git clone https://github.com/BloodWingXMalik/BloodWing-Island.git
cd BloodWing-Island
bun install
bun run tauri dev        # dev run with hot reload
bun run tauri build      # production build + MSI + NSIS installers
```

Output lands in `src-tauri/target/release/` (binary) and
`src-tauri/target/release/bundle/` (installers).

## Development commands

| Command | What it does |
| --- | --- |
| `bun run tauri dev` | Runs the app with the Vite dev server (hot reload) |
| `bun run dev` | Frontend only, in a browser at `http://localhost:1420` |
| `bun run build` | Type-check (`tsc`) + production frontend build |
| `bun run tauri build` | Full release build: app + MSI + NSIS |
| `cargo test` (in `src-tauri/`) | Rust unit tests |
| `bun run bump <version>` | Bumps the version across all manifests |

## Configuration and customization

- **User settings:** `%APPDATA%\com.bloodwing.notch\settings.json`
  (portable and installed builds share this path). It is hot-reloaded on save.
- **Full settings reference:** [SETTINGS.md](SETTINGS.md) — every key, its type,
  range and defaults.
- **Change history of this fork:** [CUSTOMIZATION.md](CUSTOMIZATION.md) documents
  each deliberate difference from upstream, including internals kept for
  compatibility (`nectar-*` setting keys, Tauri command names, keyring service
  names).
- **Branding / theme:** tokens in `src/bloodwing.css` and the per-window theme
  files; logo and installer artwork are generated by
  `scripts/generate-brand-assets.ps1`.

Configuration lives entirely on your machine and is never uploaded anywhere.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| **Taskbar is hidden and you want it back** | Quit BloodWing from the tray (**Quit BloodWing**). That restores the taskbar. Disabling the dock in **Settings → Dock** also restores it. |
| **Taskbar still hidden after a force-kill** | Run `scripts/restore-taskbar.ps1` (no admin needed). If it is still hidden, restart Explorer from Task Manager, then run it again. See [Taskbar safety](#taskbar-safety). |
| **SmartScreen blocks the installer** | Expected for unsigned builds — choose *More info* → *Run anyway*, or verify the SHA-256 checksum first (INSTALLATION.md). Never disable Defender for this. |
| **App doesn't start / blank windows** | Make sure the WebView2 runtime is installed (it ships with Windows 11; the installer can fetch it on Windows 10 when needed). The portable build is a single self-contained `BloodWing.exe` — nothing else needs to sit next to it. |
| **Dock doesn't mirror my taskbar** | The import runs on first launch; re-run it from **Settings → Dock → Import from taskbar**. |
| **Weather shows nothing** | Weather needs internet access to `api.open-meteo.com`; if location detection is blocked, set the city manually in **Settings → Weather**. |
| **Brightness slider does not change the screen** | Some external monitors do not implement DDC/CI brightness control; the internal laptop panel uses WMI instead. |
| **Settings file got broken by an edit** | Restore `settings.backup.json` next to it (created on startup), or reset from **Settings → About**. |

## Known issues and limitations

- **In-app updater is neutralised.** The update endpoint points at a placeholder and
  no update artifacts are produced, so the app never installs anything by itself.
  Updates are manual: download and run a newer installer. The About tab's update
  check will therefore fail — that is expected.
- **Single-machine verification.** Everything listed in [TEST-REPORT.md](TEST-REPORT.md)
  was verified on one Windows 11 x64 laptop with a single display. Multi-monitor,
  Explorer-restart, sleep/resume, the interactive installer wizard, upgrades and
  MSI installs are implemented and code-reviewed but not live-verified there; the
  per-user NSIS install/uninstall path was exercised (see the test report).
- **Installers are unsigned** (no code-signing certificate), hence SmartScreen
  warnings.
- **`installer-app/`** (upstream's separate installer UI project) ships
  unrebranded and is not used by this build's releases; only the NSIS/MSI
  installers are produced.
- **Upstream internals kept on purpose** for compatibility: `nectar-*` settings
  keys, Tauri command names (e.g. `quit_nectar`), some CSS variable names, and the
  keyring service names `Nectar CalDAV`/`Nectar Calendar Link` so existing
  credentials keep working.

## Taskbar safety

Hiding the native taskbar is the riskiest thing a taskbar replacement can do, so
this build treats it as a contract (documented in
[CUSTOMIZATION.md](CUSTOMIZATION.md#taskbar-safety-model-unchanged-contract-strengthened)):

- the taskbar is only hidden through one function that first writes a recovery
  marker (`taskbar_hidden.flag`) containing your previous taskbar state;
- every exit path — tray Quit, settings Quit, uninstall, `Ctrl`+`C`/console close,
  logoff/shutdown — restores the taskbar **before** the process ends;
- a force-kill leaves the marker behind, and the next launch restores the taskbar
  from it;
- if Explorer restarts, AppBar registrations are re-created automatically;
- `scripts/restore-taskbar.ps1` is the manual fallback and needs no admin rights;
- Explorer is never killed as a workaround.

## Security and privacy

Grounded in the source code of this repository:

- **No telemetry, analytics, crash reporting or tracking of any kind.** There is no
  telemetry dependency in `package.json`/`Cargo.toml` and no telemetry endpoint in
  the code.
- **No credentials in the repository**; there is no signing key, token or password
  anywhere in the tree, and `.gitignore` excludes `*.key`/`*.key.pub`.
- **Network access happens only for features you can recognise:**
  - weather: `api.open-meteo.com` and `geocoding-api.open-meteo.com` (no API key);
  - coarse location for the initial weather position: `ipapi.co` / `ip-api.com`
    (can be avoided by setting the city manually);
  - calendar sync: only the CalDAV/ICS URL **you** configure.
  The webview's Content-Security-Policy restricts connections to exactly these
  hosts plus the local IPC channel.
- **Calendar credentials** are stored in the Windows Credential Manager (keyring),
  not in settings files.
- **All configuration is local** (`%APPDATA%\com.bloodwing.notch`). Uninstalling
  keeps it; INSTALLATION.md shows how to remove it manually.
- **Shell safety:** the app restores taskbar visibility on exit; the uninstaller
  removes its own files, shortcuts and registry entries and touches nothing else.
- **Reporting a vulnerability:** see [SECURITY.md](SECURITY.md).

## License and attribution

This project is distributed under the **GNU General Public License v3.0** — see
[LICENSE](LICENSE). It is a modified version of a GPL-3.0 project, and the same
license applies to the whole work.

- **Upstream:** [Nectar](https://github.com/kua8/Nectar) by **kua8** — the original
  project this build is based on (fork point: commit
  `62c23243e326ae79af8855d5f0e542b98aa9ce3f`, version 1.4.1).
- **Nectar** itself is a fork of [Bloom](https://github.com/SehajveerSingh2005/bloom)
  by Sehajveer Singh.
- All upstream copyright notices are retained. The modifications made by this fork
  are listed in [CUSTOMIZATION.md](CUSTOMIZATION.md) and summarised in
  [NOTICE.md](NOTICE.md).

In short: the original code is not mine, the GPL applies, and the fork's changes are
documented rather than implied. "Nectar" and "Bloom" remain the names of their
respective projects; this build is not affiliated with or endorsed by their authors.

## Contributing

This is a personal fork maintained in the open. Bug reports and pull requests are
welcome — see [CONTRIBUTING.md](CONTRIBUTING.md) for scope, setup and expectations.
For changes that are not specific to this fork, please consider sending them to
[upstream Nectar](https://github.com/kua8/Nectar/issues) as well.

## Credits

- **[Nectar](https://github.com/kua8/Nectar)** — the upstream project: architecture,
  nearly all application code, and the original documentation.
- **[Bloom](https://github.com/SehajveerSingh2005/bloom)** — the origin of the
  Nectar codebase.
- **[Tauri](https://tauri.app)**, **[React](https://react.dev)**,
  **[framer-motion](https://motion.dev)**, **[lucide](https://lucide.dev)**,
  **[Inter](https://rsms.me/inter/)** — the stack this runs on.
- The BloodWing customisation layer (theme, hardening, docs and this README) is my
  own work on top of the above.

## Project documentation

| Document | Contents |
| --- | --- |
| [INSTALLATION.md](INSTALLATION.md) | Download, install, upgrade, uninstall, troubleshooting |
| [BUILD.md](BUILD.md) | Building and packaging from source |
| [CUSTOMIZATION.md](CUSTOMIZATION.md) | Every deliberate difference from upstream |
| [SETTINGS.md](SETTINGS.md) | Complete settings reference |
| [TEST-REPORT.md](TEST-REPORT.md) | What was tested, how, and with what results |
| [RELEASE-NOTES.md](RELEASE-NOTES.md) | What is in the current release |
| [CHANGELOG.md](CHANGELOG.md) | Version history of this fork |
| [SECURITY.md](SECURITY.md) | Security policy and reporting |
| [NOTICE.md](NOTICE.md) | Attribution and licensing details |

