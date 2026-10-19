# Security Policy

## Supported versions

Only the latest published release of BloodWing Nectar is supported with fixes.
Because this is a fork, security fixes in the shared codebase are usually made
upstream first; report those to [Nectar](https://github.com/kua8/Nectar) as well.

| Version | Supported |
| --- | --- |
| Latest release (`1.4.1-bloodwing.N`) | ✅ |
| Older releases / fork builds | ❌ |

## Reporting a vulnerability

Please **do not open a public issue** for security problems. Use GitHub's private
vulnerability reporting:

1. Go to the repository's **Security** tab → **Report a vulnerability**
   (`https://github.com/BloodWingXMalik/BloodWing-Nectar/security/advisories/new`).
2. Describe the issue, the affected version, and reproduction steps, and say whether
   you plan to disclose it publicly.

You can expect an acknowledgement within a few days. This is a hobby project, so
please allow reasonable time before public disclosure.

## What counts as in scope

- Privilege escalation, arbitrary code execution, or sandbox escapes through the
  application or its installers.
- Command injection through configuration values, file paths, or IPC (Tauri
  commands).
- Credential or data exposure (settings, calendar credentials, logs, crash output).
- Installer/uninstaller issues that delete or modify files outside the
  application's own directories.
- Anything that leaves the Windows shell in a broken state (taskbar left hidden
  after a crash, shell integration damaged).

## Security-relevant design notes

These are properties of the current implementation, useful when judging a report:

- **No telemetry or analytics.** The application does not collect or transmit usage
  data. Network access is limited to the weather service
  (`api.open-meteo.com`), coarse IP-based location for the initial weather position
  (`ipapi.co` / `ip-api.com`), and the CalDAV/ICS URL the user configures. The
  webview CSP in `src-tauri/tauri.conf.json` pins exactly these hosts.
- **Credentials** for calendar sync are stored in Windows Credential Manager
  (keyring), not in the settings file.
- **User data location:** `%APPDATA%\com.bloodwing.notch\` —
  `settings.json`, `pinned_apps.json`, icon/calendar caches, `logs/`, and the
  taskbar recovery marker `taskbar_hidden.flag`.
- **Updater:** this fork ships with the in-app updater neutralised (placeholder
  endpoint, no update artifacts, no signing keys in the repository). Releases are
  manual installer downloads verified by SHA-256 checksum.
- **Shell safety:** the native taskbar is only hidden through one code path that
  writes a recovery marker first, and every exit path restores it. `Ctrl`+`C`,
  logoff and shutdown are handled. If a report can leave the taskbar hidden, it is
  in scope.
- **Unsigned binaries:** releases are not code-signed; the published
  `SHA256SUMS.txt` is the integrity check for downloads.
- **No secrets in the repository:** there is no signing key, token or password in
  the tree; `*.key`/`*.key.pub` are gitignored.

## Out of scope

- Issues that require an attacker to already control your machine or user account.
- Vulnerabilities in Windows, WebView2, Tauri or other third-party components
  (please report those to their maintainers; a note here is still welcome).
- SmartScreen/AV warnings caused by the releases being unsigned (expected; see
  [INSTALLATION.md](INSTALLATION.md)).
- Missing hardening that has no demonstrated impact.
