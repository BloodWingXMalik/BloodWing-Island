# BloodWing 1.4.1 — Release Notes

BloodWing is a personal, rebranded build of [Nectar](https://github.com/kua8/Nectar)
1.4.1 (upstream commit `62c2324`, itself a fork of
[Bloom](https://github.com/SehajveerSingh2005/bloom) by Sehajveer Singh). All original
functionality is preserved: notch, dock, media, visualizer, weather, battery,
calendar, Pomodoro, taskbar mirroring, tray, search and multi-monitor support.
License: GPL-3.0, unchanged.

Built on `bloodwing-customization` from `62c2324`. Verified as described in
[TEST-REPORT.md](TEST-REPORT.md).

## What's in this build

**Identity.** The app is now BloodWing end to end: window titles, tray menu, mutex
and event names (`BloodWingSingleInstance`), installer and uninstaller, registry
keys (`Software\bloodwing\notch`, `…\Uninstall\BloodWing`), Run entry, log file
(`bloodwing.log`), diagnostics identity (`com.bloodwing.notch`) and a new icon set
generated from the BloodWing mark. Config lives in `%APPDATA%\com.bloodwing.notch`.
Credential storage keeps the upstream keyring service names on purpose so existing
CalDAV/calendar credentials survive the rename; the `nectar-*` settings schema is
also preserved for backward compatibility.

**Theme.** A charcoal-black and red design layer over every window
(`src/bloodwing.css` plus per-window theme layers): background `#0B0C0F`, elevated
`#15171C`, accent `#B51F2E` (hover `#D02C3D`), text `#F3F4F6`, muted `#A0A5B0`,
translucent borders. Inter is bundled locally (no font CDN). New appearance options
in Settings: accent presets, `nectar-reduce-motion` and `nectar-motion-intensity`
for motion control. Notch and dock geometry/animations are unchanged.

**Reliability.**
- The native taskbar is restored on every normal exit path, on logoff/shutdown, and
  after a crash (marker-file recovery on next launch).
- After an Explorer restart the dock re-registers its AppBars automatically
  (`GetShellWindow()` watchdog); Explorer is never killed as a workaround.
- Turning the dock off restores the native taskbar on all monitors.
- `scripts/restore-taskbar.ps1` — emergency manual restore, no admin rights needed.

**Settings.**
- `settings.json` is backed up on startup (`settings.backup.json`) and timestamped
  on reset (3 newest kept), so a bad edit is always recoverable.
- `save_setting` validates keys (`nectar-` prefix, shape, ≤128 chars), values
  (≤256 KB, finite numbers with per-key bounds, enum whitelists) and keeps unknown
  fields intact.
- Reset now emits a `settings-reset` event so open windows refresh immediately.

**Brightness latency.** Dragging the brightness slider no longer lags behind the
screen. The worker used to pay a full WMI query, the WMI set, and a DDC/CI pass on
every slider step (~89 ms average, up to ~300 ms, against a 50 ms update cadence).
Now the WMI instance path is cached and the slow DDC/CI pass runs only for the value
the drag settles on. Measured component costs and details in
[TEST-REPORT.md](TEST-REPORT.md).

**Docs.** [BUILD.md](BUILD.md) (build/package, prerequisites, troubleshooting),
[CUSTOMIZATION.md](CUSTOMIZATION.md) (every deliberate difference from upstream,
including internals kept for compatibility), [SETTINGS.md](SETTINGS.md) (updated for
this build), [TEST-REPORT.md](TEST-REPORT.md).

## Install

- **Installer (recommended):** run `BloodWing-Nectar-Setup-1.4.1-bloodwing.1-x64.exe`
  (NSIS — choose *Just me* for a no-admin install, or *All users*), or
  `BloodWing-Nectar-1.4.1-bloodwing.1-x64.msi` (WiX, machine-wide, needs admin).
  Both put your native taskbar back on uninstall.
- **Portable:** unzip `BloodWing-Nectar-Portable-1.4.1-bloodwing.1-x64.zip` and run
  `BloodWing.exe` directly; settings go to `%APPDATA%\com.bloodwing.notch`. Running
  the portable exe from a non-installed location intentionally skips the uninstaller
  registry "healing" (it only applies to installed copies).
- Step-by-step install, upgrade and uninstall instructions (including checksum
  verification and SmartScreen guidance): [INSTALLATION.md](INSTALLATION.md).

## Uninstall / rollback

- Uninstall from Windows Settings › Apps, or **Settings › About** inside the app.
  Both restore the taskbar as part of removal.
- Rollback: keep a copy of the previous `settings.json` (or the automatic
  `settings.backup.json`) and reinstall the previous build; no data migration is
  needed since the settings schema did not change.

## If the taskbar ever stays hidden

1. Quit BloodWing from the tray (**Quit BloodWing**).
2. Run `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/restore-taskbar.ps1`
   — it shows `Shell_TrayWnd` again and clears the recovery marker.
3. Still hidden? Restart Explorer from Task Manager (Windows Explorer › Restart) and
   run the script again.

## Known limitations

- `installer-app/` (the separate installer-UI project) is intentionally left
  unrebranded except for its payload script, which now builds `BloodWing.exe`.
- The updater is neutralized in this build: the endpoint points at a placeholder
  GitHub repository and updater artifacts are disabled, so the app will not
  self-update.
- Internal identifiers kept from upstream on purpose (documented in
  [CUSTOMIZATION.md](CUSTOMIZATION.md)): `nectar-*` settings keys, Tauri command
  names, `--nectar-*` CSS variables, keyring service names.
- Installers were built but not executed on this machine; install/uninstall paths
  are code-reviewed but not live-tested (see TEST-REPORT.md).

## Artifacts

Published release assets (all x64):

| File | Size |
| --- | --- |
| `BloodWing-Nectar-Setup-1.4.1-bloodwing.1-x64.exe` (NSIS) | 6.42 MB |
| `BloodWing-Nectar-1.4.1-bloodwing.1-x64.msi` (WiX) | 9.36 MB |
| `BloodWing-Nectar-Portable-1.4.1-bloodwing.1-x64.zip` | 9.07 MB |
| `SHA256SUMS.txt` | checksums for the three files above |

### Checksums (SHA-256)

```
7e982969b1a2159cb3503ec24b77793d2c0e57274b9270539bb3ea3bf50e5d90  BloodWing-Nectar-Setup-1.4.1-bloodwing.1-x64.exe
f2d35b45f505be41d335c16b0a0bf02ea28622131cd913acceb5dc771dbe9e9c  BloodWing-Nectar-1.4.1-bloodwing.1-x64.msi
52a1250c9e77d6669415f6f93a840261eb8c40c4c950111384b3b4b3ec5d4b13  BloodWing-Nectar-Portable-1.4.1-bloodwing.1-x64.zip
```

Verify on Windows:

```powershell
Get-FileHash .\BloodWing-Nectar-Setup-1.4.1-bloodwing.1-x64.exe -Algorithm SHA256
```

Local `bun run tauri build` output keeps Tauri's default artifact names
(`BloodWing_1.4.1_x64-setup.exe`, `BloodWing_1.4.1_x64_en-US.msi`); the release
workflow renames them to the assets above.
