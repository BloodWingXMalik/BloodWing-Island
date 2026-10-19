# BloodWing 1.4.1 — Test Report

Verification of the BloodWing build of Nectar (upstream `kua8/Nectar` @ `62c2324`,
GPL-3.0). Everything below was run against this repository on the machine described
below. Items that were **not** verified are listed in
[Not verified](#not-verified--disclosed) — nothing in this report is estimated or
copied from upstream.

## Environment

| | |
| --- | --- |
| OS | Windows 11 Pro, build 26300 (x64) |
| Machine | Lenovo LOQ 15IRX10 — i7-13700HX (24 logical cores), 15.7 GB RAM |
| GPU | NVIDIA GeForce RTX 5060 Laptop + Intel UHD Graphics |
| Display | 1920×1080 @ 125% scaling, single monitor (internal panel) |
| rustc / cargo | 1.98.0 (MSVC toolchain) |
| bun | 1.4.3 |
| Tauri | CLI 2.11, crate 2.11 |
| Build | release, `bun run tauri build`, MSI + NSIS |

## Summary

| Check | Result |
| --- | --- |
| `cargo check` | **pass** (exit 0) |
| `cargo test` | **31 passed**, 0 failed, 1 ignored |
| `bun run build` (production frontend) | **pass** (exit 0, 2300 modules) |
| `bun run tauri build` (release + MSI + NSIS) | **pass** (exit 0) |
| Release exe launches, all windows created | **pass** (manual) |
| Notch UI renders and expands on hover | **pass** (manual, screenshot) |
| Dock UI renders on bottom-edge hover | **pass** (manual, screenshot) |
| Native taskbar hidden while dock is enabled | **pass** (manual) |
| Graceful quit restores the taskbar, clears the marker, leaves no stray processes | **pass** (manual, 2×) |
| `scripts/restore-taskbar.ps1` (emergency recovery) | **pass** (manual) |
| Idle CPU | **0.1 %** of total (24 logical cores) |
| Brightness slider latency fix | implemented; component costs measured (see below) |

## Automated checks

### `cargo test` — 31 passed, 0 failed, 1 ignored

```
test result: ok. 31 passed; 0 failed; 1 ignored; 0 measured; 0 filtered out
```

Covers (among others): `validate_setting` rules added in this build (key shape,
size limits, numeric bounds, enum whitelists, `null` handling) and
`prune_settings_backups_in` (keeps the 3 newest backups). The single ignored test is
inherited from upstream and requires a real display session.

### `bun run build` — production frontend

```
✓ 2300 modules transformed.
✓ built in 6.38s
```

Outputs all five windows (`index.html`, `settings.html`, `calendar.html`,
`dock.html`, `overlay.html`) plus hashed assets; largest chunk 223 kB (framer-motion).

### `bun run tauri build` — release bundle

Rust release compile 2m 15s, then MSI and NSIS bundles. See
[Artifacts](#artifacts). The updater signing step is disabled in this build
(`createUpdaterArtifacts: false`), so the build runs unattended end to end.

## Manual verification (release binary)

All of the following was done by launching `BloodWing.exe` from the release build
and driving it with screen captures and window enumeration.

**Launch and windows.** Process starts, and the expected windows are created:

| Window | Title | State at idle |
| --- | --- | --- |
| main | `BloodWing` | visible (notch strip, top center) |
| dock | `BloodWing Dock` | visible |
| overlay | `BloodWing Overlay` | hidden |
| settings | `BloodWing Settings` | hidden |
| calendar | `BloodWing Calendar` | hidden |
| `BloodWingDisplayMonitor` (hidden helper) | — | hidden |

Tray icon (`tray_icon_app`) is registered.

**Notch.** Collapsed state shows the clock at top center. Hovering the top edge
expands it: weather (22 °C), time, battery 95 % — rendered with the BloodWing
charcoal/red theme. Scrolling over the notch switches modes; the calendar/command
center views render correctly (verified October 2026 grid, Timer/Stopwatch panel,
red accent on the active controls).

**Dock.** Appears on bottom-edge hover as a dark glass pill with real app icons.
While the dock is enabled the native taskbar is hidden
(`Shell_TrayWnd visible=False`) and the crash-recovery marker
`%APPDATA%\com.bloodwing.notch\taskbar_hidden.flag` exists, as designed.

**Graceful quit (twice).** Sent `WM_CLOSE` to the overlay window — the same handler
the tray *Quit BloodWing* menu uses. Result both times:

- process exited within ~1 s,
- `Shell_TrayWnd visible=True` (taskbar back),
- marker file removed,
- 0 leftover `msedgewebview2.exe` processes (no leaks).

**Crash-recovery script.** `scripts/restore-taskbar.ps1` parses and runs on
PowerShell 5.1 (ASCII-only, no admin rights): found `Shell_TrayWnd`, made it
visible, exit code 0.

**Final post-fix build.** Relaunched `release/BloodWing.exe` after the brightness fix:
process starts, all five windows plus the display-monitor helper and tray icon are
created, dock active and taskbar hidden with the recovery marker present. CPU during
the first 10 s after startup: 0.25 % of total (startup work still settling); the
idle figure below is from a settled session.

## Performance measurements (real, this machine)

**Idle usage** — app running, notch and dock active, nothing playing:

| Metric | Value |
| --- | --- |
| CPU (10 s sample) | 234 ms over 24 cores = **0.1 % of total** |
| `BloodWing.exe` working set / private | 97.8 MB / 43.6 MB |
| WebView2 tree (browser, GPU, 5 renderers, utilities) | 794.8 MB working set |
| Whole app tree, working set | ~893 MB |

Working set includes shared WebView2 GPU/renderer memory; private bytes for the
whole tree are ≈ 709 MB. Five WebView2 renderers correspond to the five windows
(notch, dock, overlay, settings, calendar).

## Brightness latency — investigation and fix

**Reported symptom:** a small lag between dragging the brightness slider and the
screen changing.

**Measured component costs on this machine** (scripts: WMI `WmiSetBrightness`,
DXVA2 DDC/CI pass, 5 samples each, screen value written back unchanged):

| Step | avg | min | max |
| --- | --- | --- | --- |
| WMI `ExecQuery` (`WmiMonitorBrightnessMethods`) | 40.2 ms | 8.6 ms | 162 ms |
| WMI `WmiSetBrightness` | 34.3 ms | 18.7 ms | 91.4 ms |
| DDC/CI pass (enum + set, 1 monitor) | 14.3 ms | 5.0 ms | 50.6 ms |

The old worker ran **all three steps on every slider step** (≈ 89 ms average, up to
~300 ms worst case) while the UI sends a value every 50 ms. The pipeline was
saturated, the queue backed up, and the panel visibly trailed the slider.

**Fix** (`src-tauri/src/services.rs`, commit `fix(brightness): cache WMI path and
defer DDC during drags`):

1. The WMI instance path (`__RELPATH`) is resolved once and cached instead of a full
   `ExecQuery` per step (cache invalidated on failure or display hot-plug).
2. The slow DDC/CI pass for external monitors runs only for the value the drag
   *settles* on (250 ms quiet window) instead of every intermediate value.

Per-step cost during a drag is now the `WmiSetBrightness` call alone (≈ 34 ms avg,
well under the 50 ms update cadence), with the same end state for all monitors.

**Verified:** compiles (`cargo check` exit 0), all 31 tests pass, and the release
build succeeds with the fix. **Not verified:** an end-to-end drag measurement in the
UI (the session was stopped on request while setting up the drag test); the numbers
above are component-level measurements plus code inspection.

## Not verified / disclosed

- **Installer flows.** The MSI and NSIS installers were built but not executed —
  installing would modify this machine's registry and Start menu, which was out of
  scope for this session. Install/uninstall behavior is covered by the NSIS hooks
  added in this build and by the app's own uninstaller, but not exercised here.
- **Multi-monitor behavior, Explorer restart, sleep/resume, fullscreen restore.**
  Implemented and code-reviewed (watchdog re-registers AppBars after an Explorer
  restart; `WM_ENDSESSION` handler restores the taskbar on logoff/shutdown), but
  this machine has a single monitor, so these paths were not exercised live.
- **End-to-end brightness drag timing** — see above.
- **Updater.** Intentionally neutralized in this build (placeholder endpoint,
  signing artifacts disabled), so no update check was tested.
- **Autostart at login** (`Launch at Login`) was not toggled during testing.

## Artifacts

| File | Bytes | Size |
| --- | --- | --- |
| `release/BloodWing.exe` (portable) | 28,519,424 | 27.20 MB |
| `release/BloodWing_1.4.1_x64_en-US.msi` | 9,818,112 | 9.36 MB |
| `release/BloodWing_1.4.1_x64-setup.exe` (NSIS) | 6,734,967 | 6.42 MB |

All three are copied from `src-tauri/target/release/` after the final build. The
portable exe is self-contained (WebView2 runtime is required and already present on
Windows 11).
