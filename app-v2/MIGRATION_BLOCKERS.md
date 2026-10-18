# Lanka Talent Insights — Migration Blockers & Pre-Cutover Resolutions

This document records technical dependencies, database checks, and infrastructure sizing decisions that must be resolved prior to production cutover.

---

## 1. Active Pre-Cutover Items

### Blocker 1.1: EC2 Host Memory Capacity vs Deployment Profile
- **Severity:** HIGH (Risk of OOM container kill)
- **Status:** PENDING HOST HARDWARE CONFIRMATION
- **Details:**
  The full application stack with `certificate-ai` (PaddleOCR, Playwright, and Ollama Qwen3-VL:2b) requires ~15–16.5 GB committed RAM.
  - If the EC2 host is **8 GB RAM** (`t3.large` or similar): The host CANNOT support the `certificate-ai` profile. The deployment must run the standard profile (`docker compose up -d`) with `CERTIFICATE_VERIFICATION_ENABLED=false`. A 4–8 GB swapfile must also be active.
  - If the EC2 host is **16 GB RAM** (`t3.xlarge` or similar): The host can run the full stack with `docker compose --profile certificate-ai up -d`.
- **Required Decision from Project Owner:**
  Confirm EC2 instance type (`free -m` on host) and decide whether to run the standard low-memory profile or upgrade the EC2 instance to `t3.xlarge`.

---

### Blocker 1.2: MongoDB Atlas Legacy Admin Account Mapping
- **Severity:** MEDIUM-HIGH (Risk of admin login rejection)
- **Status:** RESOLUTION TOOL READY — PENDING DATABASE EXECUTION
- **Details:**
  `New folder (3)` enforces multi-tenancy in `authService.js`. If an existing admin account created in v1 does not have a `companyId`, the login endpoint throws a `403 Forbidden` error.
- **Resolution Provided:**
  A migration utility has been provided at `scripts/migrate-legacy-admin.mjs`.
  1. Before cutover, run dry-run: `node scripts/migrate-legacy-admin.mjs`
  2. If legacy admin accounts are detected, run live assignment:
     `node scripts/migrate-legacy-admin.mjs --execute --company-name="<Company Name>"`
- **Required Action:** Run the dry-run against the database prior to cutover.

---

### Blocker 1.3: Attrition Dataset CSV Staging on Host
- **Severity:** MEDIUM (Required for updated attrition model)
- **Status:** RESOLUTION SCRIPT & CONFIG READY — PENDING STAGING
- **Details:**
  The updated project includes a 1,471-row dataset CSV (`Sri_Lankan_Hiring_Attrition_Dataset.csv`), whereas the existing host `/opt/lti/models/attrition` directory contains the earlier 836-row dataset.
- **Resolution Provided:**
  `attrition-model-service` code and Compose have been updated with `ATTRITION_DATASET_PATH`.
- **Required Action on EC2:**
  Copy the updated CSV from `backend/services/attrition-model-service/Sri_Lankan_Hiring_Attrition_Dataset.csv` into `/opt/lti/models/attrition/` prior to container launch.

---

## 2. Resolved Architecture & Deployment Blockers

| Domain | Issue Identified in Discovery | Resolution Implemented |
|---|---|---|
| **Reverse Proxy** | `frontend/nginx.conf` had removed `/api/` proxy block | **RESOLVED:** Restored full Nginx reverse proxy configuration, 25MB body limit, 180s timeouts, and gzip. |
| **Port 80 Ingress** | Compose mapped frontend to `5173:80` | **RESOLVED:** Mapped frontend to `${FRONTEND_PORT:-80}:80`. |
| **Internal Port Leaks** | 6 internal ML service ports bound to host interfaces | **RESOLVED:** Removed all internal host port bindings. Services communicate strictly across `lti-network`. |
| **Docker Build Bloat** | Models embedded in images; unpinned CUDA PyTorch | **RESOLVED:** Added `.dockerignore` files for all model services. Pinned CPU-only PyTorch wheels. |
| **Alpine ONNX Failure** | `interview-analysis-service` used `node:22-alpine` | **RESOLVED:** Updated Dockerfile to `node:22-bookworm-slim` for glibc ONNX runtime support. |
| **Auto-Restart** | Missing container restart policies | **RESOLVED:** Added `restart: unless-stopped` to all 18 Compose services. Prepared `lti-compose.service` unit. |
