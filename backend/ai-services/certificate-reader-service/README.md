# Local Certificate Reader

The existing Certificates section checks the recipient on each public link against
the selected CV's name. No certificate link or candidate name is hardcoded. Reading
uses Playwright, PaddleOCR and local Qwen3-VL through Ollama. Certificate images
always invoke vision inspection, including when OCR already identifies a name.
The vision image limit and total inference budget bound that inspection; OCR reads
all decoded images. The certificate workflow never calls a cloud AI API.
Checks start automatically after a selected CV is available and run one link at a time.
Certificate PDF checks inspect bounded rasterized pages even when a text layer exists.

## Data Flow

`React -> authenticated gateway -> CV extraction service -> local OCR/vision service`

The CV service owns URL validation, browser isolation, extraction and comparison.
The model service receives document bytes and visible page text, not the expected
CV identity. OCR blocks retain positions and recognition scores. Vision names must
appear in OCR or visible source text before a match is confirmed. Vision-only names
are shown for review rather than confirmed. Approximate names,
initials, multiple recipients and incomplete scans require review. A content match
does not verify the certificate's authenticity or establish a person's identity.

## Windows Setup

The root `npm run install:all` command includes this complete setup automatically.
To install or retry just the certificate reader, run `npm run install:certificate`.
It preserves existing `.env` files, creates `.venv-certificate` using Python 3.11,
installs dependencies and Chromium, installs Ollama through `winget` if needed,
pulls `CERTIFICATE_VISION_MODEL`, and warms up OCR. Internet is required.
Existing Ollama installations and servers are reused. A temporary server started
for installation is stopped afterward; the normal development launcher starts it
when needed. The manual commands below remain available as an alternative.

Run from the repository root using Python 3.11:

```powershell
py -3.11 -m venv .venv-certificate
.\.venv-certificate\Scripts\python.exe -m pip install -r backend/ai-services/certificate-reader-service/requirements.txt
winget install --id Ollama.Ollama --exact --silent --accept-package-agreements --accept-source-agreements
& "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe" pull qwen3-vl:2b
npm --prefix backend/services/cv-extraction-service exec -- playwright install --no-shell chromium
npm run dev:certificate-model
```

On Linux/macOS, create the environment with `python3.11 -m venv .venv-certificate`
and use `.venv-certificate/bin/python` for pip. Install Ollama from its official
distribution and run `ollama pull qwen3-vl:2b`. The launcher supports both layouts.

For a smaller CPU-only Windows installation, the included installer can extract
the required files from the official Ollama archive using bounded range requests:

```powershell
.\.venv-certificate\Scripts\python.exe scripts/install-local-ollama.py
.\.local-ai\ollama\ollama.exe pull qwen3-vl:2b
```

The launcher detects this portable installation. It does not download GPU libraries.

PaddleOCR downloads its two public OCR models on first use. Run once while online:

```powershell
.\.venv-certificate\Scripts\python.exe backend/ai-services/certificate-reader-service/src/warmup.py
```

Subsequent OCR and vision inference run locally. Model installation needs internet;
certificate links still need access to their public websites. CPU inference can be
slow. `qwen3-vl:2b` is the default; replace it with a larger locally installed model
through `CERTIFICATE_VISION_MODEL` when suitable hardware is available.

## Configuration

Use the root and service `.env.example` files. The CV service defaults to
`CERTIFICATE_LOCAL_MODEL_SERVICE_URL=http://localhost:4013`. Existing Gemini settings
are used only by unrelated explanation features. Old certificate Gemini variables
are ignored. No API key is required for this workflow.

Controls include Ollama URL/model, OCR models/device/language, OCR confidence,
image/pixel/byte limits, timeout, concurrent jobs, scan count, matching threshold,
enable flags and optional cache TTL. Cache is disabled by default; enabled caching
is bounded, transient memory only. Neither screenshots nor OCR results are written
as fixtures. Raw documents and names are excluded from service logs.
Vision failure or disabled vision leaves certificate inspection incomplete, even
when OCR found a name. Responses include `visionUsed` to identify actual completed
vision calls. Error/login pages cannot supply invented certificate evidence.
Recipient names require agreement between vision and OCR/visible page text;
unconfirmed names remain available for review.
Vision receives an aspect-preserving thumbnail with a longest side of 1024 pixels
(`CERTIFICATE_VISION_MAX_SIDE`, 512–1600); OCR keeps the original decoded image.
Certificate vision output focuses on recipient evidence, bounded to 512 output
tokens. This reduces CPU inference work; unclear or truncated readings still need
review. General content transcription retains its separate larger output budget.
Qwen3-VL thinking tags receive a closed assistant thinking block before generation
to request direct structured extraction; `think: false` alone does not suppress the
reasoning of the default thinking weights. Instruct tags do not receive that prefix.

## APIs

`POST /api/cv/certificates/verify` uses `{ "url": "<link extracted from CV>",
"rawText": "<selected CV text>" }`. The response includes the CV name, certificate
name, existing UI status, evidence source, confidence, completeness, `found` and
`verificationStatus`. `found` is null when inspection or recipient identification
is incomplete. A confirmed different recipient gives `found: false`.

`POST /api/cv/certificates/content/verify` also supports arbitrary public content:

```json
{
  "url": "https://issuer.example/public-credential",
  "targetText": "Example Student",
  "expectedFields": { "recipientName": "Example Student", "certificateId": "ABC-123" }
}
```

Responses use `{ success, data, requestId }`; errors use
`{ success: false, message, requestId }`. Exact/normalized text is accepted;
approximate OCR matches require review. Certificate IDs use exact matching.
All results include `officiallyVerified: false`; no trusted issuer validation
has been inferred from finding content. Existing features remain separate.

## Containers

```text
docker compose up -d ollama certificate-reader-service cv-extraction-service api-gateway
docker compose exec ollama ollama pull qwen3-vl:2b
```

OCR and Ollama models live in named volumes. The inference services have no public
container ports. Gateway authentication and rate limits protect external requests;
the CV reader validates and pins DNS/IPs for requests and redirects. Private IPs,
credential URLs, WebSockets, service workers and browser write operations are
blocked. The browser allows validated same-origin GraphQL queries, including the
public persisted MongoDB certificate and language queries. CAPTCHA and access
restrictions are reported, not bypassed. Scrolling and
linked document reading are bounded; this is not an unrestricted web crawler.
Embedded PDFs and screenshots can be decoded together for one inspection. Printed
initials are consolidated only with one compatible full recipient already read from
the document. Explicit issuer and organization values are excluded from recipients.

## Integration Files

- `src/` here: local inference contracts, image/PDF decoding, OCR, grounded vision,
  supervised worker timeouts, request limits, server and model warmup.
- `cv-extraction-service/src/services/certificate*`: isolated browser, visible text,
  local reader client, optional transient cache and selected CV name comparison.
- `cv-extraction-service/src/services/websiteVerification.js` and
  `src/utils/contentMatching.js`: general content and optional exact ID checks.
- Gateway certificate routes: authenticated forwarding with the inference timeout.
- Frontend `ProfilePage`, `useCertificateChecks`, `CertificateNameCheck`: automatic
  sequential checks, existing result states and retry for incomplete checks.
- Root/service environment examples, Compose, dependency manifests and
  `scripts/start-local-certificate.mjs`: independent local execution and deployment.

## Verification

Local runtime checks read the existing scanned certificate with PaddleOCR and
mandatory Qwen3-VL inspection, returning `visionUsed: true`, corroborated recipient
evidence and no warnings. An image-only vision call also identified its recipient
without CV/OCR hints. Vision inspection of a public error page returned no recipient
or certificate evidence. CPU inference took about 69–92 seconds in these checks;
the browser's one-minute loading limit is separate from the model reading budget.
The public Credly badge runtime check also returned one corroborated recipient,
`visionUsed: true`, `source: local_vision`, complete inspection and no warnings in
about 133 seconds, using the already-installed model with direct extraction.
The MongoDB University page runtime check read its embedded PDF and screenshots,
returning the full printed recipient, one consolidated recipient, `matched` against
the supplied diagnostic CV identity, `visionUsed: true`, complete inspection and no
warnings in about 118 seconds. Recipient OCR confidence was approximately 0.993.
The first embedded PDF receives vision inspection; page screenshots remain OCR
evidence and any additional recipient not confirmed by vision requires review.
Recipient confidence uses whole name parts, excluding unrelated OCR letters.
Existing tests, the frontend build, lint and Compose configuration checks passed.
No new test cases or private certificate URL fixtures were added for this change.
The Docker daemon was unavailable, so container execution was not validated.
