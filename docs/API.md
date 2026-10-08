# CEIR Read-Only API Reference

Base URL: `https://ceir.gov.mm/openapi/API`

These notes describe only the independently implemented read-only operations. This
project does not include an activation/auth API, fingerprinting, token minting, token
caching, automatic retry, registration, or payment requests.

## Requests

### Verify IMEI

```http
POST /openapi/API/IMEI/Verify?altchaData=TOKEN
Accept: application/json
Content-Type: application/json

{"imeis":["15-digit-imei"]}
```

### Device information

```http
GET /openapi/API/Device/personal-device-info?altchaData=TOKEN&imei=15-digit-imei
Accept: application/json
```

### Registration status

```http
GET /openapi/API/IMEI/RegistrationStatus?DeclarationID=VALUE&altchaData=TOKEN
Accept: application/json
```

### Applicant information

```http
GET /openapi/API/request/applicant?altchaData=TOKEN&declarationHash=VALUE
Accept: application/json
```

## Token Handling

- Copy a fresh `altchaData` value from an official request in CEIR's Network panel.
- Keep it only in the in-memory form field.
- Do not log, persist, share, or commit captured tokens.
- If the server returns an HTTP 400/401/403 response, obtain a fresh value manually.
- The script does not automatically replace or retry rejected tokens.

## Origin Constraint

Run the userscript on `https://ceir.gov.mm/*`. Calling these endpoints from another
origin will generally fail CORS and CEIR verification checks.

## Usage Limits

Send only authorized, read-only requests. Do not automate bulk enumeration, repeat
requests in loops, evade rate limits, or store returned personal information.