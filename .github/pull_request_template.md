## Summary

<!-- One or two sentences: what does this PR change, and why? -->

Related issue: #

## What changed

<!-- Bullet points. Mention anything user-visible, and any deliberate
     behaviour change (taskbar handling, settings keys, IPC). -->

-

## How it was tested

- [ ] `bun run build` (type-check + production frontend build)
- [ ] `cargo test --manifest-path src-tauri/Cargo.toml`
- [ ] `bun run tauri build` (only if packaging, installer or Rust release code changed)

Manual verification (what you actually ran and observed — be specific, and say what
you could *not* verify):

-

## Checklist

- [ ] One logical change; no unrelated reformatting.
- [ ] No secrets, tokens, personal paths or machine-specific config in the diff.
- [ ] No telemetry or silent network calls added — if the network is used, the
      README's security section and the webview CSP were updated to match.
- [ ] Upstream attribution untouched (`LICENSE`, `NOTICE.md`), or the change is
      explained above.
- [ ] Internal `nectar-*` identifiers kept where they exist for compatibility
      (settings keys, Tauri command names, keyring service names — see
      `CUSTOMIZATION.md`).
- [ ] Screenshots attached for UI changes (neutral background, no personal content).
