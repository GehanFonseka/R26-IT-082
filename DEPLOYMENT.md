# Lanka Talent Insights — Production Deployment & Operations Guide

This guide documents production operations, architecture, environment configuration, model storage, Docker Compose profiles, resource requirements, and the safe staging/cutover sequence for AWS EC2.

---

## 1. Production Architecture Overview

Lanka Talent Insights runs as a distributed microservice application orchestrated via Docker Compose:

```text
                  Internet Users & Recruiters
                              │
                              ▼ Port 80 (HTTP)
                    AWS Security Group Ingress
                              │
                              ▼
                EC2 Host (Public IP: 54.179.93.147)
                              │
                              ▼
               Frontend Container (Nginx Port 80)
               ├── Static UI Assets (/)
               └── Reverse Proxy (/api/) ──► api-gateway (Internal Port 8080)
                                                    │
                                                    ▼ (Private Docker Bridge: lti-network)
                         ┌──────────────────────────┼──────────────────────────┐
                         ▼                          ▼                          ▼
                   Node Services             Python ML Services          External Cloud
               - auth-service (3001)       - cv-matching (4002)       - MongoDB Atlas
               - candidate-service (3002)  - attrition-model (4008)   - Gemini 3.5 API
               - job-service (4004)        - early-attrition (4011)   - LiveKit Cloud
               - cv-extraction (4001)      - resume-strength (4009)
               - cv-profile-analysis (4007)- interview-answer (4010)
               - interview-analysis (4006) - speech-to-text (4005)
               - resume-explanation (4012)
                                                    │
                                                    ▼ (Optional: certificate-ai Profile)
                                            - certificate-reader (4013)
                                            - ollama (11434, qwen3-vl:2b)
```

### Key Networking Invariants:
1. **Single Public Port:** Only port `80` (and `443` when SSL is terminated) is bound to the host interface.
2. **Internal API Routing:** The browser accesses `/api/...` through the Nginx reverse proxy.
3. **Private Microservices:** All internal services communicate strictly via Docker DNS names (`http://auth-service:3001`, etc.) across `lti-network`. No internal service binds directly to host ports in production.

---

## 2. Deployment Profiles

Due to the deep learning checkpoints, the application supports two deployment profiles:

### Profile A: Default Standard Stack (Low-Memory / Recommended for EC2)
- **Command:**
  ```bash
  docker compose up -d
  ```
- **Active Containers (16 services):**
  - Frontend (Nginx), API Gateway, 9 Node services, 5 Python ML services (Whisper Tiny, CatBoost, Logistic Regression, DeBERTa Strength, ASAG V5 + NLI).
- **RAM Footprint:** ~9.5–11.5 GB RAM.
- **Certificate Verification:** Handled gracefully with fallback (`CERTIFICATE_VERIFICATION_ENABLED=false`). Public scraping and PDF extraction remain active; heavy OCR/Vision inspection is skipped.

### Profile B: Full Stack with Certificate AI (`certificate-ai`)
- **Command:**
  ```bash
  docker compose --profile certificate-ai up -d
  ```
- **Active Containers (18 services):**
  - All 16 standard services + `certificate-reader-service` (PaddleOCR) + `ollama` (`qwen3-vl:2b`).
- **RAM Footprint:** ~14.5–16.5 GB RAM.
- **Host Requirement:** Requires an EC2 instance with at least 16 GB RAM (e.g. `t3.xlarge`, `c6i.xlarge`) with swap configured.

---

## 3. Decoupled Model Storage (`MODEL_ROOT`)

ML model weights are **completely decoupled** from Git tracking and Docker image builds. Docker images build cleanly without model binaries in the build context.

### Directory Structure Under `MODEL_ROOT=/opt/lti/models`
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
│   └── Sri_Lankan_Hiring_Attrition_Dataset.csv
└── early-attrition/
    └── model/model.pkl
```

### Model Validation Tool
Before launching services, validate model artifacts using:
```bash
npm run models:validate
# or specify explicit model root:
node scripts/validate-models.mjs --model-root=/opt/lti/models
```

---

## 4. Production Environment Configuration

Create `/opt/lti/app-v2/.env` by copying from `.env.example`:

| Variable | Description | Production Value |
|---|---|---|
| `NODE_ENV` | Application environment mode | `production` |
| `FRONTEND_PORT` | Host port for Nginx HTTP | `80` |
| `MONGODB_URI` | MongoDB Atlas replica set URI | `mongodb+srv://...` |
| `MONGODB_DB_NAME` | Primary database name | `lanka_talent` |
| `INTERVIEW_ANALYSIS_DB_NAME` | Analysis database | `lanka_talent_analysis` |
| `CV_ANALYSIS_DB_NAME` | CV analysis database | `lanka_talent_analysis` |
| `JWT_SECRET` | Secret key for JWT auth signing | Strong 64-char random string |
| `CORS_ORIGIN` | Allowed web origins | `http://54.179.93.147` |
| `VITE_API_BASE_URL` | Frontend API prefix | `/api` |
| `MODEL_ROOT` | Central model volume path | `/opt/lti/models` |
| `ATTRITION_DATASET_PATH` | Updated attrition dataset | `/opt/lti/models/attrition/Sri_Lankan_Hiring_Attrition_Dataset.csv` |
| `WHISPER_MODEL_SIZE` | Whisper transcription size | `tiny` |
| `CERTIFICATE_VERIFICATION_ENABLED` | Toggle heavy OCR/vision | `false` (default) or `true` |
| `GEMINI_API_KEY` | Google Gemini API Key | Required for explanation features |
| `LIVEKIT_*` | LiveKit Cloud WebRTC keys | Required for video interviews |

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

To prevent downtime and ensure rollback capability, deploy into a separate staging directory:

1. **Host Preparation:**
   ```bash
   sudo mkdir -p /opt/lti/app-v2
   sudo chown -R ec2-user:ec2-user /opt/lti/app-v2
   ```
2. **Transfer Remediated Source:**
   Transfer the contents of `New folder (3)` into `/opt/lti/app-v2`.
3. **Configure Environment:**
   ```bash
   cp /opt/lti/app/.env /opt/lti/app-v2/.env
   # Add any new variables (e.g. CERTIFICATE_VERIFICATION_ENABLED=false)
   ```
4. **Stage Updated Dataset:**
   ```bash
   cp /opt/lti/app-v2/backend/services/attrition-model-service/Sri_Lankan_Hiring_Attrition_Dataset.csv \
      /opt/lti/models/attrition/Sri_Lankan_Hiring_Attrition_Dataset.csv
   ```
5. **Validate Models:**
   ```bash
   cd /opt/lti/app-v2
   node scripts/validate-models.mjs --model-root=/opt/lti/models
   ```
6. **Build Container Images Offline:**
   While `/opt/lti/app` continues serving live users on port 80:
   ```bash
   docker compose build
   ```
7. **Perform Cutover (< 15 seconds downtime):**
   ```bash
   cd /opt/lti/app && docker compose down
   cd /opt/lti/app-v2 && docker compose up -d
   ```
8. **Verify Public Endpoints:**
   ```bash
   curl -I http://localhost/api/health
   curl -I http://54.179.93.147/
   docker compose ps
   ```

---

## 7. Rollback Procedure

If any unexpected regression is discovered post-cutover:

```bash
# 1. Stop updated v2 containers
cd /opt/lti/app-v2 && docker compose down

# 2. Restore previous v1 production containers
cd /opt/lti/app && docker compose up -d

# 3. Verify previous deployment is serving
curl -I http://localhost/api/health
```
Rollback takes less than 15 seconds and fully restores the previous known-good deployment state.
