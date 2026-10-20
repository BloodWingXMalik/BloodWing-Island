# Installing BloodWing Island

This guide covers downloading, installing, upgrading and uninstalling BloodWing
Island on Windows, plus first-launch setup and troubleshooting.

> **Verified scope:** the behaviour below was checked against the generated WiX MSI
> and NSIS scripts *and* by a live silent NSIS install + native uninstall on Windows
> 11 (per-user path, shortcuts, uninstall registration, settings retention). The
> interactive wizard, install-over-existing (upgrade), MSI install/uninstall, and
> launching the app from its installed location were **not** exercised — see
> [TEST-REPORT.md](TEST-REPORT.md#not-verified--disclosed) for the precise list.

## System requirements

| | |
| --- | --- |
| OS | Windows 11 x64 (verified) · Windows 10 1809+ x64 (expected, untested) |
| WebView2 runtime | Preinstalled on Windows 11. On Windows 10 the installer downloads Microsoft's bootstrapper if missing — an internet connection is needed **during setup only** in that case |
| Disk space | ~40 MB for the application (installers are ~6–10 MB) |
| Display | Any; single and multi-monitor setups supported |
| Administrator rights | **Not required** for the NSIS installer (per-user install under `%LOCALAPPDATA%`). The MSI installs machine-wide under `Program Files` and does need elevation |

There are **no services, drivers, or scheduled tasks**, and no kernel components.
Autostart (optional, off by default) is a single per-user `Run` entry that you can
toggle in **Settings → General**.

## Download

The **only official source** is this repository's
[Releases page](../../releases). Every release publishes:

| File | What it is |
| --- | --- |
| `BloodWing-Island-Setup-<version>-x64.exe` | NSIS installer — per-user, never asks for administrator rights |
| `BloodWing-Island-<version>-x64.msi` | WiX MSI installer — machine-wide install under `Program Files` (needs admin) |
| `BloodWing-Island-Portable-<version>-x64.zip` | Portable build — unpack and run, no installation |
| `SHA256SUMS.txt` | SHA-256 checksums of the files above |

Do not download builds from anywhere else. If you found this project mirrored
somewhere, verify the archive against the checksums published in the official
release.

### Which installer should I pick?

| Situation | Choice |
| --- | --- |
| Normal personal machine, no admin prompt wanted | **NSIS setup** (per-user, no elevation) |
| Shared machine / want it under `Program Files` | **MSI** (admin required) |
| No installation, just try it | **Portable zip** |

### Verifying your download (recommended)

Unsigned installers plus SmartScreen warnings make checksum verification worth the
30 seconds it takes. In PowerShell, in the folder you downloaded to:

```powershell
# Compare this output with SHA256SUMS.txt from the same release
Get-FileHash .\BloodWing-Island-Setup-1.4.1-bloodwing.1-x64.exe -Algorithm SHA256
```

If the hash matches, the file is exactly what was published. If it does not match,
delete the file and download it again from the official release page.

## Installation (step by step)

1. Download the installer you chose from the official Releases page.
2. Run it. Windows SmartScreen will show **"Windows protected your PC"** because the
   build is not code-signed. Choose **More info** → **Run anyway**. (Never disable
   Defender or SmartScreen for this — the prompt is normal for unsigned open-source
   binaries and the checksum above is the reliable check.)
3. The NSIS installer installs **for the current user only**, under
   `%LOCALAPPDATA%\BloodWing Island`, and never asks for elevation. If you
   need a machine-wide install, use the MSI instead.
4. Continue through the wizard. It installs the application, creates a **Start Menu
   shortcut** (`BloodWing Island`) and registers an entry in Windows Settings → Apps.
   The last page offers an optional **desktop shortcut** checkbox.
   (The MSI creates both the Start Menu and desktop shortcuts for all users.)
5. Finish the wizard. The app starts automatically (unless you ran it silently).

### Where things land

| Item | Location |
| --- | --- |
| Application (NSIS) | `%LOCALAPPDATA%\BloodWing Island\BloodWing.exe` |
| Application (MSI) | `%ProgramFiles%\BloodWing Island\BloodWing.exe` |
| Start Menu shortcut | `BloodWing Island` in the Start Menu |
| Desktop shortcut | Only if you enabled the checkbox (NSIS); always for the MSI |
| Your settings | `%APPDATA%\com.bloodwing.notch\settings.json` |
| Uninstaller | The Windows Settings → Apps entry; after the first launch a copy also exists as `uninstall.exe` in the install directory |

## First launch and setup

1. Launch **BloodWing** from the Start Menu.
2. The notch appears at the top center and the dock at the bottom. On first launch
   the dock imports your existing taskbar pins, in order.
3. **The native taskbar is hidden while the dock is enabled.** That is the point of
   the app; to get it back quickly, either:
   - **Settings → Dock → turn the dock off** (the native taskbar returns instantly), or
   - **tray icon → Quit BloodWing** (everything is restored on exit).
4. Configure it:
   - **Settings → Notch / Dock** — visibility mode (*Fixed*, *Smart*, *Peek*) and
     which monitor each appears on.
   - **Settings → Appearance** — accent colour, motion reduction, notch style.
   - **Settings → General** — start at login, language, behaviour.
   - **Settings → Weather** — location and units.
   - **Settings → Calendar** — optional CalDAV/ICS connection for the calendar mode.
5. All of it is also editable in `%APPDATA%\com.bloodwing.notch\settings.json` —
   the file is watched and applied as you save. See [SETTINGS.md](SETTINGS.md).

Every change is backed up: a `settings.backup.json` snapshot is written on startup,
and a timestamped copy is kept (three most recent) before any settings reset.

## Upgrading

There is **no in-app updater in this build** (the update endpoint is a placeholder
and no update artifacts are produced — the About tab's update check failing is
expected). Upgrades are done with the installer:

1. Quit BloodWing from the tray (**Quit BloodWing**). This restores the taskbar first.
2. Run the newer installer. Installing over an existing installation **replaces the
   application files in place**; it does not create a second entry, a second Start
   Menu shortcut, or a second autostart entry — the installer keeps the existing
   uninstaller registered and rewrites the shortcut. (This follows from the
   generated installer script; the upgrade path itself was not live-tested.)
3. **Your settings are preserved** — upgrades never touch
   `%APPDATA%\com.bloodwing.notch\`.
4. Start the app again. Your pin layout, dock/notch configuration and connected
   calendar remain in place.

**Rollback:** quit the app, then run the installer of the older version (keeping a
copy of your `settings.json` beforehand is a good habit). Settings written by a
newer version may contain keys the older build does not know; they are ignored, not
deleted.

## Uninstalling

Two supported routes, both restoring normal Windows behaviour:

**A. Windows Settings (recommended)**

1. Quit BloodWing from the tray.
2. **Settings → Apps → Installed apps** (or *Add or remove programs*).
3. Find **BloodWing Island**, choose **Uninstall** and confirm.
   - NSIS installs: BloodWing's own uninstaller runs (the registered command points at
     `uninstall.exe`, or at `BloodWing.exe --uninstall` before the app has been
     launched once).
   - MSI installs: the standard MSI uninstall runs.
4. The uninstaller removes the application files, the Start Menu shortcut, the
   desktop shortcut (if created) and the app's registry entries (the uninstall
   entry and the installer's manufacturer key). The native taskbar is restored as
   the app exits — the uninstaller does not need to touch Explorer.

**B. From inside the app**

**Settings → About → Uninstall** runs the same removal from within BloodWing. Its
confirmation text is explicit: *"This removes the app and its shortcuts. Your
settings are kept in case you reinstall."* It also unregisters the AppBar and
restores the taskbar before removing the files.

A reboot is **not** required.

### Your settings after uninstalling

Uninstalling intentionally **keeps your configuration** at
`%APPDATA%\com.bloodwing.notch\` so a reinstall feels like coming back, not starting
over. Nothing outside the app's own directories is touched.

To remove everything completely (your choice, manual):

```powershell
# 1. Make sure BloodWing is not running (tray -> Quit BloodWing), then:
Remove-Item -Recurse -Force "$env:APPDATA\com.bloodwing.notch"
```

That directory contains `settings.json`, `pinned_apps.json`, cached icons,
calendar cache and logs — see [SETTINGS.md](SETTINGS.md) for the full list. If you
connected a calendar, you may also want to remove the stored credential in
**Windows Credential Manager** (entries named `Nectar CalDAV` / `Nectar Calendar
Link`; the names are retained from upstream for compatibility).

## Troubleshooting installation

| Symptom | What to do |
| --- | --- |
| SmartScreen: "Windows protected your PC" | Expected for unsigned builds. *More info* → *Run anyway*, or verify the SHA-256 checksum first. Do not disable Defender. |
| "This app can't run on your PC" | You downloaded an ARM/32-bit build or the file is corrupted. Only x64 builds are published. |
| The installer asks for administrator rights | The NSIS build is per-user and should never prompt. The MSI always does. If the NSIS setup prompts, verify the SHA-256 checksum — your copy may be modified. |
| App installs but windows stay blank | WebView2 missing or blocked. Install the [WebView2 runtime](https://developer.microsoft.com/microsoft-edge/webview2/) or run the installer with internet access so it can fetch the bootstrapper. |
| The taskbar is hidden and the app won't start | Run `scripts/restore-taskbar.ps1` from the repository (no admin needed), or restore the taskbar manually: Task Manager → restart Windows Explorer. Then check `%APPDATA%\com.bloodwing.notch\logs\bloodwing.log`. |
| Antivirus flags the installer or the app | Unsigned, newly published installers sometimes trigger heuristic warnings. Verify the SHA-256 checksum before whitelisting, and prefer reporting the detection to your AV vendor if the checksum matches. |
| Uninstaller reports files in use | Quit BloodWing from the tray first (not just closing windows — the tray menu is the supported quit path), then uninstall again. |

## Security and authenticity

- **Official downloads only:** this repository's Releases page.
- **Checksums:** every release includes `SHA256SUMS.txt`; verify before running.
- **Unsigned binaries:** this build has no code-signing certificate, so SmartScreen
  and AV tools may warn. That is a property of unsigned open-source software, not
  evidence of tampering — but it is also why checksum verification matters.
- **Source builds:** every release is built from the tagged commit in this
  repository; `BUILD.md` describes how to reproduce a build yourself.
- **No telemetry:** the application contains no analytics or tracking; see the
  security section of the [README](README.md#security-and-privacy).
