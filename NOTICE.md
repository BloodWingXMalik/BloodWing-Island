# Notice and attribution

**BloodWing Island** (this repository) is a modified version of **Nectar**.

## Upstream project

| | |
| --- | --- |
| Project | Nectar |
| Author / maintainer | kua8 |
| Repository | <https://github.com/kua8/Nectar> |
| Fork point | commit `62c23243e326ae79af8855d5f0e542b98aa9ce3f` (version 1.4.1) |
| License | GNU General Public License v3.0 |

Nectar itself is a fork of [Bloom](https://github.com/SehajveerSingh2005/bloom) by
Sehajveer Singh. The concept and a large part of the codebase originate there.

## This fork's changes

The changes made on top of upstream Nectar are listed in
[CUSTOMIZATION.md](CUSTOMIZATION.md). In summary: BloodWing branding and identity, a
charcoal/red design layer, settings reliability work (backups, validation), taskbar
restore hardening, an Explorer-restart watchdog, a brightness-latency fix, packaging
and documentation for this fork, and the corresponding build/release tooling.

## Copyright and license

- The original code, architecture and documentation are the work of the upstream
  authors and remain their copyright.
- All upstream copyright notices are retained in this repository, including the
  `authors` field in `src-tauri/Cargo.toml` (`kua8`, `BloodWing contributors`).
- The combined work is distributed under the **GNU General Public License v3.0**
  (`GPL-3.0-only`) — see [LICENSE](LICENSE). There is no separate license for the
  BloodWing modifications; the GPL applies to the whole work.
- If you redistribute this software or a modified version of it, the GPL requires
  that you keep the license, provide the corresponding source, and preserve the
  notices in this file.

## Names and marks

"Nectar" and "Bloom" are the names of their respective projects and belong to their
authors. **BloodWing Island is not affiliated with, endorsed by, or supported by**
the Nectar or Bloom maintainers, and issues with this fork should be reported
[here](../../issues) rather than upstream.

## Third-party components

This application builds on open-source software, including Tauri, React,
framer-motion, lucide, and the Inter typeface, each under its own license as
recorded in `Cargo.lock`, `bun.lock` and the `public/fonts` directory. The Windows
installer can fetch Microsoft's WebView2 bootstrapper during setup on systems
without the runtime, subject to Microsoft's terms.
