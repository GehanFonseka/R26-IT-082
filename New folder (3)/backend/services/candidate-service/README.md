# Candidate certificate results

Saving an uploaded CV through `/profiles/me` creates a server-owned SHA-256
`cv.revision` from the filename, extracted text, CV name and certificate metadata.
The candidate service queues public certificate links for local reading through
`CV_EXTRACTION_SERVICE_URL`. Upload/profile saving returns while these jobs run.
The authenticated gateway provides all frontend access.

Results live in MongoDB's `candidate_certificate_checks` collection. A unique
index on `{ userId, cvRevision, url }` separates accounts, CV versions and links.
Each record includes the CV filename, certificate title, status, validation status,
recipient names, reason, checked time, OCR confidence and inspection metadata.
Pending records have `status: checking` and `validationStatus: pending`.
Completed name checks use `valid`, `invalid`, `needs_review`, `unreadable` or
`unavailable` as their validation status. Historical CV results remain stored;
current profile responses return only the current revision's results.

The UI's requested name comparison ignores case and extra whitespace. Identical
nonempty printed names produce `matched` / `valid`, including when local vision
reported an incomplete scan. Original inspection status, reason and completeness
remain recorded separately. `officiallyVerified` remains false: this records
recipient-name agreement rather than issuer authentication.

Gateway endpoints:

- `GET /api/candidates/profiles/me/certificates?cvRevision=...` returns saved results.
- `POST /api/candidates/profiles/me/certificates/verify` accepts
  `{ url, cvRevision, force }`, queues a missing check or an explicit retry, and
  returns its saved status. Completed results are reused unless `force` is true.
- `GET /api/candidates/profiles/me` includes `cv.revision` and
  `cv.certificateChecks`; the admin profile endpoint includes the same records.

Identity comes from authenticated gateway claims. The candidate service reads
the saved CV's text itself; clients cannot submit names or verification results.
Client-supplied `cv.revision` and `cv.certificateChecks` are discarded on save.
Unknown links and stale CV revisions are rejected. Request IDs propagate to the
reader and remain attached to saved results; logs contain no CV contents.

Jobs run in sequence and keep running when the frontend closes. Pending jobs
resume on service startup and profile/result reads. Jobs queued for a replaced
CV are marked unavailable and do not enter the new CV's results. The frontend
polls while checks are pending and restores completed results on reload.

Configure the candidate service with its `.env.example`; Compose supplies the
internal extraction URL. Use `npm test` for existing candidate-service tests.

A live gateway/candidate/extraction/model check persisted a public MongoDB
credential as `matched` / `valid`, with vision inspection complete, and restored
the result through profile reload. Replacing the diagnostic CV generated another
revision, excluded its earlier results, rejected the stale revision with HTTP 409,
and retained the earlier result in MongoDB. The isolated diagnostic account records
were removed afterward. No new test cases were added.
