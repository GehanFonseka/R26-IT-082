# Lanka Talent Insights — Production Deployment & Operations Guide

This guide documents production operations, architecture, environment configuration, model storage, Docker Compose profiles, resource requirements, and the safe staging/cutover sequence for AWS EC2.

---

## 1. Production & Staging Architecture Overview

Lanka Talent Insights runs as a distributed microservice application orchestrated via Docker Compose:

```text
                  Internet Users & Recruiters
                               │
                ┌──────────────┴──────────────┐
                ▼ Port 80 (HTTP)              ▼ Port 8081 (HTTP)
            Production Ingress                 Staging Ingress
                │                             │
                ▼                             ▼
    Production Frontend (Nginx :80)   Staging Frontend (Nginx :8081)
    (Bridge: lti-network)             (Bridge: lti-v2-network)
                │                             │
                ▼                             ▼
    api-gateway (:8080)               api-gateway (:8080)
                │                             │
    ┌───────────┴───────────┐     ┌───────────┴───────────┐
    ▼ Node Services         │     ▼ Node Services         │
    - auth-service (3001)   │     - auth-service (3001)   │
    - candidate-service     │     - candidate-service     │
    - job-service           │     - job-service           │
    - cv-extraction         │     - cv-extraction         │
    - cv-profile-analysis   │     - cv-profile-analysis   │
    - interview-analysis    │     - interview-analysis    │
    - resume-explanation    │     - resume-explanation    │
    ▼ Python ML Services    │     ▼ Python ML Services    │
    - cv-matching (4002)    │     - cv-matching (4002)    │
    - attrition-model (4008)│     - attrition-model (4008)│
    - early-attrition (4011)│     - early-attrition (4011)│
    - resume-strength (4009)│     - resume-strength (4009)│
    - interview-answer(4010)│     - interview-answer(4010)│
    - speech-to-text (4005) │     - speech-to-text (4005) │
                │                             │
                ▼                             ▼
    Production MongoDB Atlas          Staging MongoDB Atlas
    (lanka_talent)                    (lanka_talent_staging)
```

### Key Networking Invariants:
1. **Network Host Isolation (`lti-v2-network`):** In `app-v2/docker-compose.yml`, the Docker network is assigned the explicit host name `lti-v2-network` (while keeping the internal Compose service key `lti-network`). This prevents Docker bridge network naming conflicts with the existing production `lti-network` when running side-by-side on the same EC2 instance.
2. **Dual-Port Staging Strategy:** Production binds port `80` on the host. Staging binds port `8081` on the host via `FRONTEND_PORT=8081`. Both environments can run concurrently without port collisions.
3. **Internal Routing:** Browser clients communicate through Nginx reverse proxy via `/api/...`. Internal microservices communicate strictly over their private Docker network via DNS names (`http://auth-service:3001`, `http://cv-matching-service:4002`, etc.).

---

## 2. Deployment Profiles

The application supports two profiles to optimize memory consumption:

### Profile A: Default Standard Stack (Recommended for EC2)
- **Command:**
  ```bash
  docker compose up -d
  ```
- **Active Containers (16 services):**
  - Frontend (Nginx), API Gateway, 9 Node.js services, 5 Python ML services (Whisper Tiny, CatBoost, Logistic Regression, DeBERTa Strength, ASAG V5 + NLI).
- **RAM Footprint:** ~9.5–11.5 GB RAM.
- **Certificate Verification Compatibility:** `CERTIFICATE_VERIFICATION_ENABLED` defaults to `false`. Public scraping and PDF extraction remain fully operational; the resource-intensive OCR/Vision inspection is skipped.

### Profile B: Full Stack with Certificate AI (`certificate-ai`)
- **Command:**
  ```bash
  docker compose --profile certificate-ai up -d
  ```
- **Active Containers (18 services):**
  - All 16 standard services + `certificate-reader-service` (PaddleOCR) + `ollama` (`qwen3-vl:2b`).
- **RAM Footprint:** ~14.5–16.5 GB RAM.
- **Host Requirement:** Requires an EC2 instance with at least 16 GB RAM (e.g., `t3.xlarge`, `c6i.xlarge`) with swap configured.

---

## 3. Decoupled Model Storage & Configurable Paths

ML model checkpoints and datasets are completely decoupled from Git tracking and Docker image builds. Images build cleanly without model binaries in the build context.

### Configurable Model Path Variables
Each ML service supports an explicit host-path environment variable in `docker-compose.yml`, with sensible defaults for local development:

| Variable | Description | Local Dev Default | Host Staging/Prod Path |
|---|---|---|---|
| `CV_MATCHING_MODEL_PATH` | ONNX BERT model directory | `./backend/services/cv-matching-service/model` | `/opt/lti/models/cv-matching` |
| `ATTRITION_MODEL_PATH` | CatBoost V7 model file | `./backend/services/attrition-model-service/attrition_risk_catboost_v7_optuna.joblib` | `/opt/lti/models/attrition/attrition_risk_catboost_v7_optuna.joblib` |
| `ATTRITION_DATASET_PATH` | Attrition CSV dataset | `./backend/services/attrition-model-service/Sri_Lankan_Hiring_Attrition_Dataset.csv` | `/opt/lti/models/attrition/Sri_Lankan_Hiring_Attrition_Dataset_v2.csv` |
| `EARLY_ATTRITION_MODEL_PATH` | Logistic Regression model dir | `./backend/services/early-attrition-model-service/model` | `/opt/lti/models/early-attrition/model` |
| `RESUME_STRENGTH_MODEL_PATH` | DeBERTa model directory | `./backend/services/resume-strength-model-service/model` | `/opt/lti/models/resume-strength` |
| `INTERVIEW_ANSWER_MODEL_PATH`| ASAG V5 & NLI model dir | `./backend/services/interview-answer-model-service/model` | `/opt/lti/models/interview-answer` |
| `SPEECH_TO_TEXT_MODEL_PATH` | Faster-Whisper model dir | `./backend/services/speech-to-text-service/model` | `/opt/lti/models/speech-to-text` |
| `INTERVIEW_ANALYSIS_MODEL_PATH` | Quantized DeBERTa model dir | `./backend/services/interview-analysis-service/model` | `/opt/lti/models/interview-analysis` |

### Critical Invariant: Attrition Dataset Preservation
The updated **1,471-row attrition dataset** must be kept strictly separate from the older production dataset (836 rows).
- **Never overwrite or delete** `/opt/lti/models/attrition/Sri_Lankan_Hiring_Attrition_Dataset.csv`.
- Place the updated dataset as `/opt/lti/models/attrition/Sri_Lankan_Hiring_Attrition_Dataset_v2.csv`.
- Configure `ATTRITION_DATASET_PATH=/opt/lti/models/attrition/Sri_Lankan_Hiring_Attrition_Dataset_v2.csv` in staging.

### Model Directory Structure Under `/opt/lti/models`
```text
/opt/lti/models/
├── cv-matching/
│   ├── config.json
│   ├── tokenizer.json
│   └── onnx/model.onnx
├── interview-analysis/
│   ├── config.json
│   ├── spm.model
│   └── onnx/model_quantized.onnx
├── speech-to-text/
│   └── tiny/
│       ├── config.json
│       ├── model.bin
│       └── tokenizer.json
├── resume-strength/
│   ├── config.json
│   ├── spm.model
│   └── model.safetensors
├── interview-answer/
│   ├── v5/
│   │   ├── model_config.json
│   │   └── model_state.pt
│   └── nli/
│       ├── config.json
│       └── model.safetensors
├── attrition/
│   ├── attrition_risk_catboost_v7_optuna.joblib
│   ├── Sri_Lankan_Hiring_Attrition_Dataset.csv        # Production dataset (836 rows, untouched)
│   └── Sri_Lankan_Hiring_Attrition_Dataset_v2.csv     # Updated staging dataset (1,471 rows)
└── early-attrition/
    └── model/model.pkl
```

### Model Validation Tool
Validate model artifacts on the host:
```bash
npm run models:validate
# or specify explicit model root:
node scripts/validate-models.mjs --model-root=/opt/lti/models
```

---

## 4. Environment Configuration

> ⚠️ **CRITICAL WARNING: DO NOT COPY PRODUCTION `.env` INTO STAGING!**
>
> Copying production `.env` into staging connects staging containers directly to the live production MongoDB databases. This will pollute or corrupt live candidate data, interview records, and user credentials.
> Staging MUST have its own independent `.env` created from `.env.example`.

### Staging vs. Production Configuration Comparison

| Setting | Staging Value (`app-v2/.env`) | Production Value (`app/.env`) | Purpose / Impact |
|---|---|---|---|
| `NODE_ENV` | `production` | `production` | Enables optimized production builds |
| `FRONTEND_PORT` | `8081` | `80` | Prevents port 80 collision |
| `PORT` | `8080` | `8080` | Internal gateway container port |
| `MONGODB_URI` | `.../lanka_talent_staging?...` | `.../lanka_talent?...` | Dedicated staging MongoDB user & DB |
| `MONGODB_DB_NAME` | `lanka_talent_staging` | `lanka_talent` | Isolates core recruiter/candidate data |
| `INTERVIEW_ANALYSIS_DB_NAME` | `lanka_talent_analysis_staging` | `lanka_talent_analysis` | Isolates AI analysis transcripts |
| `CV_ANALYSIS_DB_NAME` | `lanka_talent_analysis_staging` | `lanka_talent_analysis` | Isolates parsed CV records |
| `JWT_SECRET` | Staging random secret | Production secret | Isolates session cookies and tokens |
| `CORS_ORIGIN` | `http://54.179.93.147:8081` | `http://54.179.93.147` | Allows web browser ingress on port 8081 |
| `VITE_API_BASE_URL` | `/api` | `/api` | Routes via Nginx reverse proxy |
| `ATTRITION_DATASET_PATH` | `/opt/lti/models/attrition/Sri_Lankan_Hiring_Attrition_Dataset_v2.csv` | `/opt/lti/models/attrition/Sri_Lankan_Hiring_Attrition_Dataset.csv` | Preserves 836-row dataset; uses 1,471-row CSV |
| `CERTIFICATE_VERIFICATION_ENABLED`| `false` | `false` | Disables heavy OCR/vision service |

---

## 5. Container Lifecycle & Auto-Restart

All long-running services configure `restart: unless-stopped`.

### Systemd Integration
A template systemd unit is supplied at `scripts/lti-compose.service`. To configure automatic startup after EC2 host reboots:
```bash
sudo cp scripts/lti-compose.service /etc/systemd/system/lti-compose.service
sudo systemctl daemon-reload
sudo systemctl enable lti-compose.service
```

---

## 6. Safe Staging & Cutover Sequence

To prevent production downtime and guarantee clean rollback capability, follow this exact staging sequence on AWS EC2:

### Step 1: Host Directory Setup
```bash
sudo mkdir -p /opt/lti/app-v2
sudo chown -R ec2-user:ec2-user /opt/lti/app-v2
```

### Step 2: Fetch the `deploy-v2-subfolder` Branch
```bash
# In the repository workspace on EC2:
git fetch origin deploy-v2-subfolder
# Sync app-v2/ files to /opt/lti/app-v2/
rsync -av --exclude='.git' app-v2/ /opt/lti/app-v2/
```

### Step 3: Configure Staging Environment (.env)
```bash
cp /opt/lti/app-v2/.env.example /opt/lti/app-v2/.env
```
*(DO NOT copy `/opt/lti/app/.env` into `/opt/lti/app-v2/.env`!)*

Edit `/opt/lti/app-v2/.env`:
- Set `FRONTEND_PORT=8081`.
- Provide staging MongoDB credentials with database `lanka_talent_staging`.
- Set `CORS_ORIGIN=http://54.179.93.147:8081`.
- Set `CERTIFICATE_VERIFICATION_ENABLED=false`.
- Ensure `ATTRITION_DATASET_PATH=/opt/lti/models/attrition/Sri_Lankan_Hiring_Attrition_Dataset_v2.csv`.

### Step 4: Stage the 1,471-Row Attrition Dataset Separately
```bash
# Copy the updated dataset under a distinct filename to preserve the production dataset:
cp /opt/lti/app-v2/backend/services/attrition-model-service/Sri_Lankan_Hiring_Attrition_Dataset.csv \
   /opt/lti/models/attrition/Sri_Lankan_Hiring_Attrition_Dataset_v2.csv
```

### Step 5: Validate Models on the Host
```bash
cd /opt/lti/app-v2
ATTRITION_DATASET_PATH=/opt/lti/models/attrition/Sri_Lankan_Hiring_Attrition_Dataset_v2.csv \
  node scripts/validate-models.mjs --model-root=/opt/lti/models
```

### Step 6: Build Staging Container Images Offline
While production in `/opt/lti/app` continues serving live users on port 80:
```bash
cd /opt/lti/app-v2
docker compose build
```

### Step 7: Launch Staging on Port 8081
```bash
cd /opt/lti/app-v2
docker compose up -d
```
Because `app-v2` uses the unique network `lti-v2-network` and port `8081`, both production and staging run concurrently without any interference.

### Step 8: Test Staging Health & Endpoints
```bash
# Verify staging health endpoint
curl -I http://localhost:8081/api/health
# Verify staging web UI
curl -I http://54.179.93.147:8081/
# Check container status
docker compose ps
```

### Step 9: Final Cutover (When Approved)
When staging verification is 100% complete and approved:
```bash
# 1. Stop staging
cd /opt/lti/app-v2 && docker compose down

# 2. Stop production
cd /opt/lti/app && docker compose down

# 3. Update /opt/lti/app-v2/.env to production port:
sed -i 's/FRONTEND_PORT=8081/FRONTEND_PORT=80/' /opt/lti/app-v2/.env
sed -i 's/:8081//' /opt/lti/app-v2/.env

# 4. Point app-v2 to production database (or migrate staging -> prod) and start
docker compose up -d
```
*Total cutover downtime is less than 15 seconds.*

---

## 7. Rollback Procedure

If any unexpected regression occurs post-cutover:
```bash
# 1. Stop updated v2 containers
cd /opt/lti/app-v2 && docker compose down

# 2. Restore previous v1 production containers
cd /opt/lti/app && docker compose up -d

# 3. Verify previous deployment is serving
curl -I http://localhost/api/health
```
Rollback takes less than 15 seconds and fully restores the previous known-good deployment state.
