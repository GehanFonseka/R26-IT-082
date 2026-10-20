# Lanka Talent Insights — AWS Deployment Migration Checklist

This checklist defines the strict sequential workflow for safely migrating the production EC2 deployment from `/opt/lti/app` (v1) to `/opt/lti/app-v2` (remediated v2).

---

## Phase 1: Local Remediation & Verification (COMPLETED LOCALLY)

- [x] **1.1. Reverse Proxy Restored:**
  - `frontend/nginx.conf` has `/api/` reverse proxy restored with 25MB body limit, 180s proxy timeout, gzip, and WebSocket upgrade headers.
- [x] **1.2. Public Port Exposure Corrected:**
  - `docker-compose.yml` maps frontend to `${FRONTEND_PORT:-80}:80`.
  - Removed host port bindings for API Gateway (`8080:8080`) and internal ML services (`4005`, `4008`, `4009`, `4010`, `4011`, `4012`).
  - Added explicit internal bridge network `lti-network`.
- [x] **1.3. Model Decoupling & Builds Hardened:**
  - Removed `COPY model` from `cv-matching-service`, `speech-to-text-service`, and `interview-analysis-service` Dockerfiles.
  - Added `.dockerignore` files for all model services to exclude binaries, weights, and caches from build contexts.
  - Pinned CPU-only PyTorch (`--index-url https://download.pytorch.org/whl/cpu`) in `interview-answer-model-service` and `resume-strength-model-service` Dockerfiles.
  - Updated `interview-analysis-service` Dockerfile to `node:22-bookworm-slim` for glibc/ONNX compatibility.
- [x] **1.4. Low-Memory Deployment Profile:**
  - Added `profiles: ["certificate-ai"]` to `certificate-reader-service` and `ollama` in `docker-compose.yml`.
  - Default `docker compose up -d` boots the 16 standard containers (~9.5–11.5 GB RAM).
  - Documented `--profile certificate-ai` for hosts with ≥16 GB RAM.
- [x] **1.5. Attrition Dataset Path Configurable:**
  - Made dataset path configurable in `attrition-model-service` via `ATTRITION_DATASET_PATH`.
- [x] **1.6. Container Restart Policies & Systemd Template:**
  - Added `restart: unless-stopped` to all 18 production services in `docker-compose.yml`.
  - Created `scripts/lti-compose.service` template targeting `/opt/lti/app-v2`.
- [x] **1.7. Legacy Admin Migration Tool:**
  - Created `scripts/migrate-legacy-admin.mjs` with safe dry-run default.
- [x] **1.8. Environment Documentation:**
  - Updated `.env.example` with full production variable specifications.
- [x] **1.9. Local Model Validation:**
  - Created `scripts/validate-models.mjs` and verified 100% pass across all 8 model domains.

---

## Phase 2: Remote AWS EC2 Staging (REQUIRES AWS EXECUTION)

The following steps must be executed on the live EC2 host when deployment is authorized:

- [ ] **2.1. Disk & Memory Pre-Flight Check:**
  ```bash
  free -h
  df -h /
  ```
  *Requirement:* At least 15 GB free disk space and adequate RAM/swap.
- [ ] **2.2. Create Isolated Staging Directory:**
  ```bash
  sudo mkdir -p /opt/lti/app-v2
  sudo chown -R ec2-user:ec2-user /opt/lti/app-v2
  ```
  *(CRITICAL: Do NOT delete, touch, or overwrite `/opt/lti/app`)*
- [ ] **2.3. Transfer Remediated Source:**
  Transfer the remediated contents of `New folder (3)` into `/opt/lti/app-v2`.
- [ ] **2.4. Synchronize Production `.env`:**
  ```bash
  cp /opt/lti/app/.env /opt/lti/app-v2/.env
  ```
  Add new configuration flags:
  ```bash
  echo "CERTIFICATE_VERIFICATION_ENABLED=false" >> /opt/lti/app-v2/.env
  echo "ATTRITION_DATASET_PATH=/opt/lti/models/attrition/Sri_Lankan_Hiring_Attrition_Dataset.csv" >> /opt/lti/app-v2/.env
  ```
- [ ] **2.5. Stage Updated Attrition Dataset:**
  Backup old CSV and copy the 1,471-row CSV into the model directory:
  ```bash
  cp /opt/lti/models/attrition/Sri_Lankan_Hiring_Attrition_Dataset.csv \
     /opt/lti/models/attrition/Sri_Lankan_Hiring_Attrition_Dataset.csv.bak-836
  cp /opt/lti/app-v2/backend/services/attrition-model-service/Sri_Lankan_Hiring_Attrition_Dataset.csv \
     /opt/lti/models/attrition/Sri_Lankan_Hiring_Attrition_Dataset.csv
  ```
- [ ] **2.6. Validate Model Artifacts on Host:**
  ```bash
  cd /opt/lti/app-v2
  node scripts/validate-models.mjs --model-root=/opt/lti/models
  ```
  *Requirement:* Must exit with code 0 ("ALL REQUIRED MODEL ARTIFACTS ARE PRESENT").
- [ ] **2.7. Offline Image Build (Zero Downtime):**
  While existing containers in `/opt/lti/app` continue serving live traffic:
  ```bash
  cd /opt/lti/app-v2
  docker compose build
  ```
  *Requirement:* All images build successfully without downloading CUDA PyTorch wheels.

---

## Phase 3: Database Admin Account Verification (PRE-CUTOVER)

- [ ] **3.1. Legacy Admin Dry-Run Check:**
  ```bash
  cd /opt/lti/app-v2
  node scripts/migrate-legacy-admin.mjs
  ```
- [ ] **3.2. Apply Admin Tenant Mapping (if required):**
  If legacy admins are reported, apply company mapping:
  ```bash
  node scripts/migrate-legacy-admin.mjs --execute --company-name="Lanka Talent Insights"
  ```

---

## Phase 4: Production Cutover (< 15 Seconds Window)

- [ ] **4.1. Stop v1 Containers:**
  ```bash
  cd /opt/lti/app && docker compose down
  ```
- [ ] **4.2. Launch v2 Containers (Standard Profile):**
  ```bash
  cd /opt/lti/app-v2 && docker compose up -d
  ```
- [ ] **4.3. Monitor Startup Health:**
  ```bash
  docker compose ps
  docker compose logs -f api-gateway
  ```

---

## Phase 5: Live Verification & Testing

- [ ] **5.1. Local Health Endpoint Check:**
  ```bash
  curl -s http://localhost/api/health | jq .
  ```
- [ ] **5.2. Public IP Accessibility Check:**
  Visit in a browser: `http://54.179.93.147`
  - Verify homepage loads cleanly.
  - Verify static assets (JS, CSS, SVGs) deliver HTTP 200.
- [ ] **5.3. Functional Authentication Test:**
  - Sign in with an existing administrator account.
  - Verify JWT is returned and dashboard loads without 403 error.
- [ ] **5.4. Functional Feature Tests:**
  - Upload a test CV PDF and verify text extraction.
  - Test CV matching against an existing job description.
  - Test attrition simulation calculation.

---

## Phase 6: Systemd Auto-Restart & Post-Cutover

- [ ] **6.1. Install Systemd Service:**
  ```bash
  sudo cp /opt/lti/app-v2/scripts/lti-compose.service /etc/systemd/system/lti-compose.service
  sudo systemctl daemon-reload
  sudo systemctl enable lti-compose.service
  ```
- [ ] **6.2. Retain Rollback Backup:**
  Keep `/opt/lti/app` intact for at least 7 days before archiving.
