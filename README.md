# CEIR Checker — HTML Mirror

Original binary: `CeirChecker.exe` (Go 1.27 + WebView2) injects `MIMI CEIR CHECKER 8.4` userscript into `https://ceir.gov.mm/*`.

This repo publishes the web part as GitHub-friendly files. No license bypass, no captcha bypass.

## Quick start (Tampermonkey — works)

1. Install Tampermonkey (Chrome/Edge).
2. Open `ceir-checker.user.js` → copy all → Tampermonkey Dashboard → `+` → paste → Save.
3. Visit `https://ceir.gov.mm/` → complete Turnstile checkbox → tool panel appears.

## Why GitHub Pages alone is not enough

- `index.html` on `*.github.io` is docs/installer only.
- Direct `fetch` from `github.io` to `ceir.gov.mm/openapi/...` fails:
  - CORS (`Origin` cannot be spoofed from browser).
  - Turnstile sitekeys are domain-locked to `ceir.gov.mm`.
  - Cloudflare 403 needs verification on the real domain.
- License flow still required: `POST workers.dev/api/auth/login` with `{licenseKey, fingerprint, scriptVersion: 6.5}` then `POST /api/auth/verify` with `{token, fingerprint}`.

To build a full standalone Pages app you need your own Turnstile keys + backend proxy (Worker) that forwards to CEIR. See `docs/API.md`.

## Files

- `ceir-checker.user.js` — Tampermonkey build.
- `index.html` — Pages landing page.
- `docs/API.md` — endpoints + flows from static analysis.
- `.nojekyll` — Pages helper.

## Deploy

- Repo Settings → Pages → Deploy from branch → `/ (root)`.
- Or push `github_repo/` contents to `username.github.io/ceir-checker-html`.

## Safety

- Unsigned EXE, third-party auth server, handles IMEI/applicant PII. Run original EXE only in VM.
- Do not commit license keys, `_ct3` tokens, or `CEIR_ENC_V1` files.
