# Changelog

All notable changes to **this fork** (BloodWing Island) are documented in this file.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
versions track the upstream Nectar version they are based on, with a fork suffix
(`-bloodwing.N`).

Changes that belong to the original project before the fork point are upstream
Nectar's; see <https://github.com/kua8/Nectar> for that history.

## [Unreleased]

### Added

- Notch Wi-Fi button and in-notch connectivity panel: list saved/available Wi-Fi
  networks, connect to a network with an inline password prompt, disconnect, and
  toggle the Wi-Fi radio. When Windows Location Services is off, Windows blocks
  nearby-network lists, so the panel shows saved profiles and links to the Location
  settings page instead of failing silently.
- Bluetooth section in the connectivity panel: radio toggle, paired-device list with
  connected state, and a shortcut to Windows Settings for pairing new devices.
- Native WLAN backend (`connectivity.rs`) for scanning, WPA2/WPA3 profile creation,
  connecting and disconnecting, plus paired Bluetooth enumeration.
- WLAN/Bluetooth smoke tests (ignored by default) for manual verification on Windows.

### Fixed

- A running stopwatch now replaces the clock continuously in the notch, with a small
  stopwatch glyph, instead of rotating out with the clock or being masked by a
  finished timer. Pausing/resetting returns to the clock.

## [1.4.1-bloodwing.1] — first BloodWing release

Based on Nectar 1.4.1 (upstream commit `62c23243e326ae79af8855d5f0e542b98aa9ce3f`).

### Added

- BloodWing design layer: charcoal-black/red token system (`src/bloodwing.css`) with
  per-window theme layers for notch, dock, settings, calendar and overlay.
- Bundled Inter webfonts locally — the UI makes no font-CDN requests.
- New appearance settings: accent presets, `nectar-reduce-motion`
  (`system`/`on`/`off`) and `nectar-motion-intensity` (`full`/`balanced`/`minimal`).
- Automatic settings backups: `settings.backup.json` snapshot on startup, plus
  timestamped copies (3 kept) before any settings reset.
- Backend validation for every `save_setting` call: key schema, size cap, finite
  numeric ranges and enum whitelists.
- `settings-reset` event so open windows refresh immediately after a reset.
- Explorer-restart recovery: dock AppBars are re-registered automatically when
  `GetShellWindow()` changes — Explorer is never killed as a workaround.
- `scripts/restore-taskbar.ps1`: manual taskbar recovery, no admin rights needed.
- Brand asset generator (`scripts/generate-brand-assets.ps1`) and a complete
  BloodWing icon set.
- Repository documentation: `BUILD.md`, `INSTALLATION.md`, `CUSTOMIZATION.md`,
  `TEST-REPORT.md`, `RELEASE-NOTES.md`, `SECURITY.md`, `CONTRIBUTING.md`,
  `NOTICE.md`, `CHANGELOG.md`.
- CI and release workflows for Windows (`.github/workflows/`) and issue/PR templates
  for this repository.
- Themed NSIS installer (`installer/build/installer.nsh`): dark wizard, custom
  header/sidebar artwork, install-scope file and uninstaller-preserving upgrades.

### Changed

- Renamed the product to **BloodWing Island** end to end where the OS sees it:
  installer, Start Menu/desktop shortcuts, Apps list entry
  (`…\Uninstall\BloodWing Island`), uninstall dialogs, tray tooltip and the autostart
  Run value. The executable stays `BloodWing.exe` and the in-app brand stays
  "BloodWing"; see [CUSTOMIZATION.md](CUSTOMIZATION.md) for the rationale.
- The NSIS installer is now **per-user only** (no elevation, no UAC prompt); the MSI
  remains the machine-wide option.
- Settings and configuration now live in `%APPDATA%\com.bloodwing.notch`.
- Taskbar restore paths hardened: exit, `Ctrl`+`C`/console close, logoff and
  shutdown all restore the taskbar through one code path before the process ends.
- Rewrote the README for this fork; the licensing situation (`GPL-3.0`, upstream
  attribution) is now stated explicitly.

### Fixed

- **Brightness slider latency:** the worker ran a full WMI query, the WMI write and a
  DXVA2 DDC/CI pass on every slider step (~89 ms average, up to ~300 ms, against a
  50 ms update cadence), which made the drag feel laggy. The WMI instance path is now
  cached and the slow DDC/CI pass runs only for the value a drag settles on.
  Measured before/after numbers: [TEST-REPORT.md](TEST-REPORT.md#brightness-latency--investigation-and-fix).
- Settings could be lost if the file was edited into an invalid state; a startup
  backup plus validation now prevents that class of data loss.
- Uninstalling now also removes the installer's manufacturer key
  (`HKCU`/`HKLM` `\Software\BloodWing\BloodWing Island`), which previously survived
  and pointed at the deleted install directory.

### Security

- No telemetry, analytics or crash reporting — verified by scanning the dependency
  manifests and source for such endpoints.
- `*.key` / `*.key.pub` and `/release/` are gitignored; no signing keys or build
  artifacts are published to the repository.
- The in-app updater is neutralised (placeholder endpoint, no update artifacts) so
  this build can never install an upstream binary over itself; updates are
  installer-based and documented in [INSTALLATION.md](INSTALLATION.md).

### Known limitations

See the README's [Known issues and limitations](README.md#known-issues-and-limitations)
and [TEST-REPORT.md](TEST-REPORT.md) for the full, honest list — including that
verification was performed on a single Windows 11 x64 machine.
