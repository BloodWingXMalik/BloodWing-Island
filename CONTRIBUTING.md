# Contributing to BloodWing Island

Thanks for taking a look. This is a personal fork of
[Nectar](https://github.com/kua8/Nectar) maintained in the open, so a few things are
different from a regular project.

## Scope — what belongs here

**Fits this repository:**

- Bugs introduced by this fork's customisation layer (theme, branding, settings
  reliability, taskbar restore logic, installer/packaging).
- Improvements to the docs in this repository.
- Platform/build fixes for Windows.

**Belongs upstream instead (or as well):**

- Core Nectar functionality (notch modes, dock behaviour, media handling,
  multi-monitor logic). These are shared with upstream — please also open an issue
  or PR at <https://github.com/kua8/Nectar> so everyone benefits, and link the two.

If you are unsure, open an issue here and say so; sorting it out is cheap.

## Reporting bugs

Use the [issue templates](../../issues/new/choose). Useful reports include:

- Windows version and build (`winver`), monitor setup (count, resolution, scaling),
- whether the dock is enabled and the notch/dock visibility modes in use,
- steps to reproduce, what you expected, what happened,
- screenshots where relevant (blank out anything personal),
- recent `%APPDATA%\com.bloodwing.notch\logs\bloodwing.log` lines if the app
  misbehaved.

## Development setup

Prerequisites: [Rust](https://rustup.rs) (MSVC toolchain), [Bun](https://bun.sh),
and the Visual Studio C++ build tools. Full instructions in [BUILD.md](BUILD.md).

```powershell
bun install
bun run tauri dev          # app with hot reload
```

### Before you open a pull request

Run what CI runs:

```powershell
bun run build                       # tsc + production frontend build
cd src-tauri; cargo test; cd ..     # Rust unit tests
```

If your change touches the installer or packaging, also run `bun run tauri build`
and say in the PR what you verified (and what you could not).

### Code style

- Match the surrounding code; the frontend is TypeScript/React with function
  components and hooks, the backend is Rust with the `windows` crate for Win32.
- Keep user-visible strings in the existing naming conventions, and remember the
  internal `nectar-*` identifiers (settings keys, command names, keyring services)
  are intentionally kept for compatibility — see
  [CUSTOMIZATION.md](CUSTOMIZATION.md#intentionally-kept-do-not-fix-these).
- Don't reformat unrelated files in a PR; it makes review harder and the history
  noisier.

### Commit messages

Conventional Commits style, as used in the history:

```
feat(settings): add per-monitor dock mode
fix(taskbar): restore taskbar when the dock is disabled
docs: document the installer scope options
chore(brand): regenerate icons
```

Short, imperative, scoped. Explain *why* in the body when it is not obvious.

## Pull requests

- One logical change per PR when practical.
- Describe what you changed, why, and exactly how you tested it. Untested changes
  are still welcome if that is clearly stated — just don't claim verification that
  did not happen.
- Link the issue it addresses, if there is one.
- Screenshots of UI changes are very welcome (please use a neutral desktop
  background and no personal content).

## Security and privacy expectations

- **Never** commit tokens, keys, credentials, personal paths or machine-specific
  configuration. `.gitignore` covers `*.key`, `*.key.pub` and `/release/`; check
  your staged diff before committing.
- Don't add telemetry, analytics or any silent network call. If a feature needs the
  network, it must be user-visible, documented in the README's security section, and
  covered by the webview CSP in `src-tauri/tauri.conf.json`.
- Report vulnerabilities privately as described in [SECURITY.md](SECURITY.md).

## License of contributions

By contributing you agree that your changes are licensed under the **GPL-3.0**
([LICENSE](LICENSE)), like the rest of this work, and that upstream attribution
(see [NOTICE.md](NOTICE.md)) must be preserved.
