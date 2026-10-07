# API Notes (from static analysis)

Base CEIR: `https://ceir.gov.mm`
Auth mirror: `https://ceir-auth.goldfish63.workers.dev`

## Auth (workers.dev)

- `POST /api/auth/login` — `{licenseKey, fingerprint, scriptVersion: "6.5", ts}`
- `POST /api/auth/verify` — `{token, fingerprint, ts}`
- Storage: `localStorage[_ct3]` = token, `localStorage[_cf3]` = `FP-...`
- Fingerprint: screen, colorDepth, language, platform, hardwareConcurrency, maxTouchPoints, timeZone, timezoneOffset, canvas `FP_v3`, WebGL vendor/renderer, plugins.length → hash.

## CEIR openapi (must run on ceir.gov.mm origin)

All need `altchaData` (Turnstile/Altcha mint, 4-min cache except `verify-imei` which is always fresh):

- `POST /openapi/API/IMEI/Verify?altchaData=` — JSON body
- `GET /openapi/API/Device/personal-device-info?altchaData=&imei=`
- `GET /openapi/API/IMEI/RegistrationStatus?DeclarationID=&altchaData=`
- `GET /openapi/API/request/applicant?altchaData=&declarationHash=`
- `POST /openapi/API/IMEI/RegistrationRequest?source=LEGAL_INDIVIDUAL&altchaData=` — JSON body

Headers used by script:

- `Content-Type: application/json`, `Accept: application/json`
- `Origin: https://ceir.gov.mm`, `Referer: https://ceir.gov.mm/`

Response wrapper: `{status, data}` or `{status: 403, isCloudflare: true}` on CF block / HTML block page. Token-invalid strings (`altcha/captcha/token/forbidden/unauthorized`) trigger cache clear + re-mint.

## ENC file

- Prefix `CEIR_ENC_V1:` + base64; `AES-GCM + PBKDF2(SHA-256, 100k)`.
- JSON inside: `{applicant: {fullName, taxpayerType, nationalId, phone}}`.
- Key is embedded in client — treat ENC as obfuscation, not secure storage.
  
