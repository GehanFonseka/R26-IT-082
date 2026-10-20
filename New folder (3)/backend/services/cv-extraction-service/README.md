# CV and certificate reading

The authenticated gateway endpoint `POST /api/cv/certificates/verify` accepts
`{ url, rawText }`. It forwards to this service's `/certificates/verify` route.
Only links extracted from the supplied CV's certificate section are accepted.
The comparison uses the name read from the CV, rather than the account display name.

Public Google Drive links and Google Docs links are converted to document downloads.
Direct PDF, DOCX, TXT, JPG, PNG and WEBP documents are supported. Selectable document
text is read locally; images, scanned PDFs and unclear recipient layouts use the
local certificate model service's `/read-certificate` endpoint using PaddleOCR and
Ollama/Qwen3-VL. Certificate checks require no cloud AI key.
Public certificate verification webpages are opened in a fresh Chromium browser,
including Coursera's "Completed by" pages, LinkedIn Learning's "Certificate recipient"
headings and public credential/badge pages. Public Udemy `/certificate/UC-…/` links
resolve to the corresponding official certificate PDF on Udemy's public storage;
the reader inspects the printed PDF instead of depending on the course page.
The reader scrolls with overlapping
screenshots, waits for lazy images and reads every captured image in one model call.
Before capturing screenshots, the browser waits for page load, visible images and
fonts to finish. It waits up to 1.2 seconds for network idle; continuous background
analytics do not block an already loaded certificate. Loading and scrolling share a maximum 60-second
deadline (`CERTIFICATE_BROWSER_TIMEOUT_MS=60000`); pages that exceed it return a
loading error so incomplete screenshots are not sent for verification.
Visible text from each viewport, including table labels and values, accompanies the
screenshots so names remain available even when scrolling replaces earlier content.
This reads certificates displayed as images among ordinary text or drawn on canvas.
Public PDFs loaded inside an embedded viewer are captured by the pinned downloader.
The first PDF and page screenshots are inspected together in one local model request,
so a small viewer zoom does not hide the full printed name. Other certificate PDFs
are inspected even when the page already exposes a recipient. A printed abbreviation
such as "Shehan G." is consolidated with "Shehan Gunasekara" only when exactly one
full recipient on the same page has matching name parts and initials. An abbreviation
alone still requires review when compared with the CV.
Rendered certificate text is also checked. Conflicting recipient names and scans
that stop before the bottom of a long page require review instead of confirming a match.
Navigation, account names, instructors and unrelated photos are excluded as evidence.
Private files, sharing/login pages and unsupported files return an unavailable result.

Results distinguish `matched`, `mismatched`, `needs_review`, `unreadable` and
`unavailable`. Initials, incomplete names and low-confidence OCR require review;
they do not produce a confirmed match. This compares printed names and does not
verify certificate authenticity.
The profile UI now uses candidate-service persistence: uploaded CV links are
checked in its background queue, and results are saved per account/CV revision/link
in MongoDB. Completed saved results are restored on reload; "Check again" requests
a new check. See `backend/services/candidate-service/README.md` for these endpoints
and the UI's case-insensitive name-status policy.
Concurrent checks of the same CV/link share the pending browser request, and
frontend certificate requests run in sequence. Leaving the page cancels only its
result observer, so returning does not start a second OCR job. The extraction
service retries a busy reader within the existing model timeout; it does not
turn temporary reader contention into an immediate failed certificate check.

Downloads have size, timeout and redirect limits. DNS addresses are checked and pinned
for each request; private, loopback and link-local destinations are blocked, including
redirects. Browser requests use the same pinned downloader; private subresources,
WebSockets, service workers and write requests are blocked. Same-origin `/graphql`
POST requests are permitted only when their parsed operations are queries. MongoDB
University's opaque persisted operations are limited to `PublicCertificateQuery`
for the current `/c/` page ID and `LanguagesQuery`, with their exact variable shapes.
GraphQL redirects are rejected. Browser sessions have no user cookies or storage.
User credentials, cookies and authorization headers are never forwarded to links.
The isolated page's public query token and nonce can accompany these permitted reads.
Browser downloads use Chromium's actual User-Agent and public request negotiation
headers. Public CORS response headers are retained so cross-origin JavaScript
modules can load. Page HTML is refreshed with the browser User-Agent when needed.
Blank pages wait for visible content before inspection. The browser permits up to
256 requests by default (`CERTIFICATE_BROWSER_MAX_REQUESTS`, capped at 500),
while retaining the 32 MB resource and 60-second rendering limits.
Request IDs are forwarded to the internal model service. Logs contain status and duration,
without document contents or names.

Use the service `.env.example` for certificate limits and the model service URL.
Image/scanned document and webpage reading uses the independently deployed local
certificate reader on port 4013. See
`backend/ai-services/certificate-reader-service/README.md` for Python 3.11, PaddleOCR
and Ollama installation, configuration, launch commands and API contracts.

After installing Node dependencies locally, run
`npm --prefix backend/services/cv-extraction-service exec -- playwright install --no-shell chromium`.
The Docker image installs Chromium and its OS dependencies automatically.
`CERTIFICATE_BROWSER_TIMEOUT_MS` and `CERTIFICATE_BROWSER_MAX_SCREENS` bound each scan
(defaults: 60 seconds and 8 screenshots). An optional
`CERTIFICATE_BROWSER_EXECUTABLE_PATH` selects an existing browser installation.

The response includes `found`, `verificationStatus`, evidence source, confidence
and scan completeness. `found` is null for incomplete or unclear inspection.
`officiallyVerified` remains false: this workflow compares printed content only.
The authenticated `/api/cv/certificates/content/verify` endpoint accepts public URLs,
target text and optional recipient, issuer, course and exact certificate ID fields.
The existing gateway rate limiter and local inference job limits bound requests.
