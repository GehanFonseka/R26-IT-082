# Lanka Talent Insights — Deployment & Operations Guide

This document describes local operations, deployment profiles, model configuration, production hardening, CI/CD pipeline, and the planned architecture for future AWS deployment.

---

## 1. Local Development

### Prerequisites
- Node.js 22 LTS or newer
- Python 3.11 or newer
- Docker Desktop (version 24+ recommended)

### Quick Start
1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd R26-IT-082
   ```
2. Copy the environment configuration:
   ```bash
   cp .env.example .env
   # Edit .env and supply your MONGODB_URI, JWT_SECRET, ADMIN_INVITE_CODE
   ```
3. Install dependencies:
   ```bash
   npm install
   npm run install:all
   ```
4. Validate model artifacts:
   ```bash
   npm run models:validate
   ```
5. Run the dev suite:
   ```bash
   npm run dev
   ```

---

## 2. Model Setup & Storage Architecture

### Configurable Model Root (`MODEL_ROOT`)
ML model weights and checkpoints are completely decoupled from Git source tracking and Docker image build contexts.

- In development, models reside in their respective service directory or in a centralized root:
  - Local default: `backend/services/<service>/model`
  - Centralized mount: `MODEL_ROOT=/opt/lti/models` or `MODEL_ROOT=./models`
- Docker builds do **not** copy model weights into container images (`.dockerignore` excludes them, and `COPY model` instructions have been removed from Dockerfiles).
- At container startup, model directories are mounted read-only via volumes:
  ```yaml
  volumes:
    - ${MODEL_ROOT:-./backend/services/cv-matching-service/model}:/app/model:ro
  ```

### Directory Structure Under `MODEL_ROOT`
```text
MODEL_ROOT/
├── cv-matching/
│   └── model.onnx
├── interview-analysis/
│   └── model_quantized.onnx
├── speech-to-text/
│   ├── tiny/ (recommended for low RAM)
│   └── small.en/
├── resume-strength/
│   └── model.safetensors
├── interview-answer/
│   ├── v5/ (Final_ASAG_Interview_Scorer_V5)
│   └── nli/ (cross-encoder/nli-deberta-v3-base)
├── attrition/
│   └── attrition_risk_catboost_v7_optuna.joblib
└── early-attrition/
    └── model.pkl
```

### Model Validation Tool
Run the built-in validator before launching services:
```bash
npm run models:validate
```
The validator checks for all mandatory model binaries across all 8 model domains, verifies file readability, and exits with a non-zero code if any required artifact is missing.

---

## 3. Deployment Profiles

Due to the heavy resource demands of certain deep learning checkpoints (full stack committed memory was measured at ~9.53 GB), the platform provides two deployment profiles:

### A. Full Profile (`docker-compose.yml`)
- **Containers**: All 16 services active (Frontend, Nginx/Gateway, 9 Node services, 5 Python ML services).
- **RAM Required**: ~12–16 GB host RAM.
- **Includes**:
  - Full Whisper transcription (`speech-to-text-service`)
  - Two-model ASAG + NLI scorer (`interview-answer-model-service`)
  - CatBoost + Early Attrition models
  - DeBERTa resume strength model
  - ONNX CV matching + NLI interview analysis
- **Command**:
  ```bash
  docker compose up -d
  ```

### B. Core Profile (`docker-compose.yml` + `docker-compose.core.yml`)
- **Containers**: 14 services active (Frontend, Gateway, Auth, Candidate, Job, CV Extraction, CV Matching, Attrition, Attrition Model, Early Attrition Model, CV Profile Analysis, Resume Strength, Resume Explanation).
- **Excluded**:
  - `speech-to-text-service` (~2.65 GB RAM saved)
  - `interview-answer-model-service` (~2.86 GB RAM saved)
- **RAM Required**: ~4–6 GB host RAM (suitable for t3.medium or 8 GB workstations).
- **Command**:
  ```bash
  docker compose -f docker-compose.yml -f docker-compose.core.yml up -d
  ```

### C. Developer Override Profile (`docker-compose.dev.yml`)
In production Compose, internal microservice ports are strictly hidden inside the private Docker bridge network (`lti-network`). For local debugging where direct port access is desired:
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

---

## 4. Docker Build & Operation

### Building Images (Decoupled from Models)
All images can now be built cleanly without needing any model binaries present in the build context:
```bash
docker compose build
```
This is essential for clean checkouts and CI/CD pipelines.

### Running Containers
```bash
# Start all containers in the background
docker compose up -d

# View logs
docker compose logs -f api-gateway

# Check status
docker compose ps
```

---

## 5. Production Configuration & Security

### Network Isolation
- **Public Entry Point**: Only Port `80` (HTTP) and `443` (HTTPS) are exposed on the host via Nginx / Reverse Proxy.
- **API Gateway**: Port `8080` is routed internally by Nginx to the API Gateway.
- **Internal Services**: Ports `3001-3002` and `4001-4012` are **not bound to host interfaces**. They communicate strictly via Docker's internal `lti-network` DNS names (`http://auth-service:3001`, etc.).

### Reverse Proxy & Nginx
`frontend/nginx.conf` acts as the production reverse proxy:
- Routes `/api/` directly to `api-gateway:8080`.
- Configured with `client_max_body_size 25M` for CV uploads.
- Configured with 180s proxy timeouts (`proxy_read_timeout 180s`) to support ML inference.
- Handles WebSocket upgrades (`Connection $connection_upgrade`, `Upgrade $http_upgrade`).
- Gzip compression enabled for static assets.

### Frontend API Base URL
- The frontend client uses `VITE_API_BASE_URL` to route requests.
- When served behind Nginx, `VITE_API_BASE_URL=/api` uses relative routing (zero CORS overhead, maximum performance).
- Can also be set to external URLs such as `https://api.example.com` at build time without code edits.

### CORS Hardening
- Backend API Gateway accepts `CORS_ORIGIN` as an environment variable (supports single origin or comma-separated list).
- Wildcard `*` is disabled for authenticated credential requests in production.

### JWT & Authentication Security
- In production (`NODE_ENV=production`), `JWT_SECRET` must be explicitly provided. Startup fails immediately if `JWT_SECRET` is missing or uses the `"development-only-secret"` placeholder.
- Secrets are never logged or exposed in API errors.
- `ADMIN_INVITE_CODE` is required for administrator account creation and is verified securely in memory without logging or returning it in API responses.

---

## 6. GitHub Actions CI/CD Pipeline

The CI workflow in `.github/workflows/ci.yml` runs automatically on pushes and pull requests to `main`/`master`:
1. **Lint & Test**:
   - Sets up Node.js 22 & Python 3.11.
   - Installs dependencies.
   - Runs `npm run lint` (ESLint, Node syntax checks, Python bytecode compilation).
   - Runs `npm test` (TAP test suites).
   - Runs `npm run build` (Vite production bundle verification).
2. **Docker Validation**:
   - Validates Compose files: `docker compose config`, `docker-compose.core.yml`, `docker-compose.dev.yml`.
   - Runs `docker compose build` across microservices to verify that images build completely without model weights.
   - Operates with zero cloud credentials and zero deployment side-effects.

---

## 7. Future AWS Architecture (Planned — No Cloud Provisioning Yet)

When ready for AWS deployment, the architecture is designed as follows:

```text
                  Users & Recruiters
                          │
                          ▼
               AWS CloudFront / Route 53
              (HTTPS / SSL Termination)
               ┌──────────┴──────────┐
               ▼                     ▼
       Static Assets             API Traffic
       (S3 Bucket)           (ALB / EC2 Instance)
                                     │
                                     ▼
                            Nginx Reverse Proxy
                               (Port 80/443)
                                     │
                                     ▼
                                API Gateway
                                (Port 8080)
                                     │
                        Private Docker Network
                       (14–16 Microservices)
                                     │
               ┌─────────────────────┼─────────────────────┐
               ▼                     ▼                     ▼
        MongoDB Atlas           LiveKit Cloud        S3 Model Bucket
      (Database Cluster)     (Video / Audio Mesh)  (/opt/lti/models mount)
```

### Planned Staging Steps for AWS
1. **Model Storage**: Upload model weights to a private AWS S3 bucket (`s3://lti-models-private/`).
2. **EC2 Host Bootstrap**: Provision an EC2 instance (e.g. `t3.large` or `c6i.xlarge`), install Docker, and download models via AWS CLI / IAM instance role into `/opt/lti/models`.
3. **Container Launch**: Point `MODEL_ROOT=/opt/lti/models` in `.env` and run `docker compose up -d` (or use the Core profile on smaller instances).
4. **Database & Services**: Connect to MongoDB Atlas via VPC peering or IP whitelist. Connect to LiveKit Cloud for WebRTC audio/video mesh.
