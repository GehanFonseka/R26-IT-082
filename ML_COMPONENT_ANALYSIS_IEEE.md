# ML COMPONENTS ANALYSIS FOR IEEE RESEARCH PAPER
## Lanka Talent Insights — Detailed Technical Specifications

---

## 1. CV MATCHING — BERT SEQUENCE CLASSIFICATION

### Model/Algorithm
- **Name:** `Gehan77/cv-match-browser`
- **Type:** HuggingFace BERT-based sequence classification
- **Architecture:** Pre-trained transformer, fine-tuned
- **Framework:** @huggingface/transformers (Node.js binding)
- **Source:** HuggingFace Hub (downloaded on first startup)
- **File:** [backend/services/cv-matching-service/src/model/model.js](backend/services/cv-matching-service/src/model/model.js)

### Purpose
Match candidate CV profile to job description using semantic similarity scoring

### Input
- **Job Text:** Job title, seniority, industry, description, responsibilities, requirements
- **Candidate Text:** Role, seniority, years of experience, industry, education, skills, summary, experience bullets, projects
- **Preprocessing:** Text formatting + truncation to 256 tokens
- **File:** [backend/services/cv-matching-service/src/services/textFormatter.js](backend/services/cv-matching-service/src/services/textFormatter.js)

### Features
- NOT FOUND: No explicit feature engineering. Pre-trained model uses BERT embeddings directly.

### Target/Output
- **Type:** Binary classification or continuous matching score
- **Output Range:** 0.0–1.0 (probability)
- **Format:**
  ```json
  {
    "probability": 0.52,
    "percentage": 52.00,
    "threshold": 0.4399277865886688,
    "classification": "Suitable Match" | "Needs Review",
    "verdict": "Suitable Match" | "Needs Review",
    "model": "Gehan77/cv-match-browser",
    "inputVersion": "balanced-256-v2"
  }
  ```
- **File:** [backend/services/cv-matching-service/src/controllers/matchController.js](backend/services/cv-matching-service/src/controllers/matchController.js)

### Dataset/Source
- **Training Dataset:** NOT FOUND (model obtained from HuggingFace Hub; no local training documentation)
- **Training Data Size:** NOT FOUND
- **Domain:** CV-job matching
- **Language:** English (assumed)

### Preprocessing
- Text truncation: `max_length=256` tokens
- Tokenization: HuggingFace AutoTokenizer
- Padding: True
- Truncation strategy: Default (trim to max_length)
- File: [backend/services/cv-matching-service/src/model/modelInput.js](backend/services/cv-matching-service/src/model/modelInput.js)

### Feature Engineering
- **Lexical Features:** Job text and candidate text concatenation
- **Semantic:** BERT embeddings (learned from pre-training)
- **Custom Features:** None observed

### Training Method
- **Approach:** Transfer learning (using pre-trained HuggingFace model)
- **Local Training:** NOT FOUND (model is pre-trained, no fine-tuning in this project)
- **Optimization:** NOT FOUND

### Validation Method
- **Validation Approach:** NOT FOUND (no validation set mentioned)
- **Cross-validation:** NOT FOUND
- **Test Set:** NOT FOUND

### Hyperparameters
- **Threshold:** 0.4399277865886688 (hardcoded, configurable via ENV)
- **Max Sequence Length:** 256 tokens
- **Tokenizer:** `use_fast=true` (HuggingFace)
- **File:** [backend/services/cv-matching-service/src/config/env.js](backend/services/cv-matching-service/src/config/env.js)

### Thresholds
- **Classification Threshold:** 0.4399277865886688
- **Decision Rule:**
  - If probability ≥ 0.4399... → "Suitable Match"
  - If probability < 0.4399... → "Needs Review"
- **Justification:** NOT FOUND (hardcoded, no documentation)

### Inference Process
1. Load pre-trained model and tokenizer from HuggingFace Hub (once at startup)
2. Format job and candidate text via `buildJobText()` and `buildCandidateText()`
3. Tokenize as sequence pair: `[CLS] job_text [SEP] candidate_text [SEP]`
4. Forward pass through BERT layers
5. Extract logit from output
6. Apply sigmoid function: `sigmoid(logit) → [0, 1]`
7. Compare to threshold → return classification
- **File:** [backend/services/cv-matching-service/src/model/model.js](backend/services/cv-matching-service/src/model/model.js), lines 34–43

### Evaluation Metrics
- **Published Results:** NOT FOUND
- **Accuracy:** NOT FOUND
- **Precision:** NOT FOUND
- **Recall:** NOT FOUND
- **F1 Score:** NOT FOUND
- **ROC-AUC:** NOT FOUND
- **Calibration/Brier Score:** NOT FOUND

### Existing Results
- No validation results published in repository
- No test set metrics reported
- Model is production-ready but validation status unknown

### Model Limitations
1. **No Explainability:** BERT embeddings are opaque; no feature attribution or attention visualization provided
2. **Unknown Generalization:** No cross-domain or cross-region validation
3. **Fixed Threshold:** Hardcoded 0.4399...; no threshold optimization per domain
4. **Text Length Constraint:** 256 token limit may lose information in long CVs or job descriptions
5. **Language Bias:** Pre-trained on English; multilingual performance unknown
6. **Domain Specificity:** Trained on unknown domain; transfer to specialized industries untested

---

## 2. RESUME STRENGTH SCORING — DeBERTa SEQUENCE CLASSIFICATION

### Model/Algorithm
- **Name:** Supplied local DeBERTa checkpoint (details redacted)
- **Type:** 3-output sequence classification
- **Outputs:** `[projectStrength, skillEvidenceStrength, experienceProjectAlignment]`
- **Framework:** PyTorch + Transformers
- **Source:** Supplied as pre-trained checkpoint (local file)
- **File:** [backend/services/resume-strength-model-service/src/model_runner.py](backend/services/resume-strength-model-service/src/model_runner.py)

### Purpose
Score skill proficiency and project complexity from CV text, context, and professional experience

### Input
- **Skill:** Skill name (string)
- **Project:** Project description (string)
- **Experience:** Professional experience text (string)
- **Certifications:** Certification text (string)
- **ExperienceYears:** Explicit years of experience (numeric, optional)
- **File:** [backend/services/resume-strength-model-service/src/model_runner.py](backend/services/resume-strength-model-service/src/model_runner.py), lines 34–48

### Features
**Constructed Input Text (from `model_input()`):**
```
[SKILL]
{skill}

[PROJECT]
{project}

[PROFESSIONAL EXPERIENCE]
{experience}

[ESTIMATED PROFESSIONAL SKILL YEARS]
{duration_years}

[CERTIFICATIONS]
{certifications}
```
- **Duration Calculation:** Regex parsing of "years", "months", "yrs", "mos" from experience text
- **Fallback:** If no explicit duration, extract year ranges from dates (e.g., 2018–2023)
- **Cap:** Max 15 years
- **File:** [backend/services/resume-strength-model-service/src/model_runner.py](backend/services/resume-strength-model-service/src/model_runner.py), lines 9–28

### Target/Output
- **Type:** 3-dimensional continuous score (sigmoid of logits × 100)
- **Output Dimensions:**
  1. `projectStrength`: 0–100
  2. `skillEvidenceStrength`: 0–100
  3. `experienceProjectAlignment`: 0–100
- **Proficiency Level:**
  - Advanced: score ≥ 70
  - Intermediate: 40 ≤ score < 70
  - Beginner: score < 40
- **Format:**
  ```json
  {
    "skill": "Python",
    "projectStrength": 85.23,
    "skillEvidenceStrength": 92.10,
    "experienceProjectAlignment": 78.45,
    "skillProficiency": "Advanced",
    "experienceYears": 5.5
  }
  ```

### Dataset/Source
- **Training Dataset:** NOT FOUND (supplied checkpoint; no dataset documentation)
- **Training Data Size:** NOT FOUND
- **Domain:** Professional skills + project context
- **Languages:** English (assumed)

### Preprocessing
- Tokenization: AutoTokenizer (from checkpoint)
- Max length: 256 tokens (default; configurable via `MODEL_MAX_LENGTH` env var)
- Padding: True
- Truncation: True
- Return tensors: PyTorch (`pt`)
- **File:** [backend/services/resume-strength-model-service/src/model_runner.py](backend/services/resume-strength-model-service/src/model_runner.py), lines 105–112

### Feature Engineering
- **Duration Parsing:** Regex extraction of explicit years + fallback year range calculation
- **Text Structuring:** Structured prompt with labeled sections `[SKILL]`, `[PROJECT]`, etc.
- **Manual Feature:** Estimated professional years (engineered from CV text)
- **Scaling:** Sigmoid of logits → 0–100 range

### Training Method
- **Approach:** Transfer learning from pre-trained DeBERTa checkpoint (frozen)
- **Local Fine-tuning:** NOT FOUND (checkpoint is loaded as-is)
- **Batch Inference:** Yes, supports `predict_many()` for efficiency

### Validation Method
- **Validation Approach:** NOT FOUND
- **Cross-validation:** NOT FOUND
- **Test Set:** NOT FOUND

### Hyperparameters
- **Model Max Length:** 256 tokens (ENV: `MODEL_MAX_LENGTH`, default 256)
- **Device:** CPU or CUDA (ENV: `MODEL_DEVICE`, default CPU)
- **Inference Mode:** `torch.inference_mode()` (no gradients computed)
- **Sigmoid Scaling:** Logits → sigmoid × 100
- **File:** [backend/services/resume-strength-model-service/src/model_runner.py](backend/services/resume-strength-model-service/src/model_runner.py), lines 58–70

### Thresholds
- **Proficiency Thresholds:**
  - Advanced: skillEvidenceStrength ≥ 70
  - Intermediate: 40 ≤ skillEvidenceStrength < 70
  - Beginner: skillEvidenceStrength < 40
- **Duration Cap:** 15 years (max)
- **Source:** [backend/services/resume-strength-model-service/src/model_runner.py](backend/services/resume-strength-model-service/src/model_runner.py), lines 30–34

### Inference Process
1. Load checkpoint once at startup (tokenizer + model)
2. For each skill-context:
   - Construct structured input text (see **Features** section)
   - Tokenize with padding/truncation
   - Forward pass → logits (3-dimensional)
   - Apply sigmoid: logits → [0, 1] × 100
   - Classify proficiency level based on skillEvidenceStrength
3. Batch inference (multiple skills in parallel): vectorized tokenization + forward pass
- **File:** [backend/services/resume-strength-model-service/src/model_runner.py](backend/services/resume-strength-model-service/src/model_runner.py), lines 95–128

### Evaluation Metrics
- **Published Results:** NOT FOUND
- **Accuracy/F1 on Test Set:** NOT FOUND
- **Correlation with Human Ratings:** NOT FOUND
- **Proficiency Classification Accuracy:** NOT FOUND
- **Domain-specific Validation:** NOT FOUND

### Existing Results
- No validation results published
- Model is deployed but validation approach unknown
- Called by CV Profile Analysis to score skill competency

### Model Limitations
1. **Black Box Output:** 3-dimensional scores lack interpretability; no per-component explanation
2. **Handcrafted Prompt:** Structured input format is ad-hoc; sensitivity to input order untested
3. **Duration Extraction Fragility:** Regex-based duration parsing prone to errors on unstructured CVs
4. **No Confidence Calibration:** Output scores are not calibrated to actual proficiency levels (no reference metrics)
5. **Text Length Truncation:** 256-token limit may omit evidence from longer contexts
6. **Unknown Supervision:** Checkpoint source unknown; unclear if trained on HR data, crowdsourced labels, or other

---

## 3. ATTRITION PREDICTION — CatBoost CLASSIFIER

### Model/Algorithm
- **Name:** `attrition_risk_catboost_v7_optuna.joblib`
- **Type:** CatBoost gradient boosting classifier
- **Framework:** CatBoost (scikit-learn compatible)
- **Source:** Pre-trained artifact (supplied locally; loaded once at startup)
- **File:** [backend/services/attrition-model-service/src/model_runner.py](backend/services/attrition-model-service/src/model_runner.py)

### Purpose
Predict employee attrition risk from CV + scenario features in a Sri Lankan hiring context

### Input
- **Candidate Fields:** 45+ fields from CV (mapped by FeatureAdapter)
- **Simulation Fields:** Salary adjustment, scenario parameters
- **Total Features:** NOT FOUND (exact count not disclosed; claimed 45+ mapping targets)
- **File:** [backend/services/attrition-model-service/src/feature_adapter.py](backend/services/attrition-model-service/src/feature_adapter.py)

### Features
**7 Engineered Features (from README & code):**
1. `OfferExpectedRatio` (computed from mappings)
2. `AverageSatisfaction` (mapped)
3. `InterviewComponentAverage` (mapped)
4. `MatchInterviewAverage` (mapped)
5. `RoleTenureRatio` (computed)
6. `ManagerTenureRatio` (computed)
7. `PromotionDelayRatio` (computed)

**Feature Types:**
- **Numerical:** Ratios, years, scores (encoded as float)
- **Categorical:** Role, location, work type, training participation (encoded as string, fillna("Missing"))
- **Imputation:** Missing values filled with dataset median (numerical) or "Missing" (categorical)

**Feature Engineering Process:**
- Candidate fields mapped from CV → model features (e.g., `candidateRole` → `JobRole`)
- Explicit field extraction with fallback keys
- Salary adjustment simulation: base_hike + salary_adjustment
- Missing features imputed from training dataset medians
- Metadata returned: `inputCoverage` (fraction of features explicitly provided) and `imputedFeatures` (list of imputed feature names)
- **File:** [backend/services/attrition-model-service/src/feature_adapter.py](backend/services/attrition-model-service/src/feature_adapter.py)

### Target/Output
- **Type:** Binary classification (attrition vs. retention)
- **Output Format:**
  ```json
  {
    "success": true,
    "riskScore": 45,
    "riskLevel": "low" | "medium" | "high",
    "riskLabel": "Low attrition risk" | "Moderate attrition risk" | "High attrition risk",
    "probability": 0.453,
    "predictedAttrition": false,
    "threshold": 0.33,
    "modelId": "attrition-risk-catboost-v7",
    "method": "local-catboost-v7",
    "inputCoverage": 0.82,
    "imputedFeatures": ["YearsAtCompany", "NumCompaniesWorked", ...]
  }
  ```

### Dataset/Source
- **Training Dataset:** `Sri_Lankan_Hiring_Attrition_Dataset.csv`
- **Location:** [backend/services/attrition-model-service/Sri_Lankan_Hiring_Attrition_Dataset.csv](backend/services/attrition-model-service/Sri_Lankan_Hiring_Attrition_Dataset.csv)
- **Dataset Size:** NOT FOUND (file exists but not inspected in code)
- **Domain:** Sri Lankan hiring + attrition outcomes
- **Target Variable:** Attrition (binary: 0/1)
- **Data Distribution:** NOT FOUND (class balance, missing values unknown)
- **README reference:** "Copy those two files from the provided Downloads folder into that service directory before starting the model."

### Preprocessing
1. **Candidate + Simulation Mapping:**
   - CV fields extracted to flat dict
   - Simulation (salary, scenario) applied
   - Missing fields filled with medians/defaults
2. **Categorical Encoding:**
   - fillna("Missing")
   - astype(str)
3. **Numerical Encoding:**
   - pd.to_numeric(..., errors='coerce')
   - fillna(0)
4. **Frame Construction:** DataFrame with model_features as columns
- **File:** [backend/services/attrition-model-service/src/feature_adapter.py](backend/services/attrition-model-service/src/feature_adapter.py), lines 86–105

### Feature Engineering
- **Ratio Engineering:** Computed from CV fields (e.g., PromotionDelayRatio = YearsSinceLastPromotion / YearsWithCurrManager)
- **Salary Simulation:** Base salary hike adjusted by scenario parameter
- **Domain-Specific Features:** E.g., `MatchScore` (CV-job match), `InterviewScore`, behavioral/technical scores
- **Imputation Strategy:** Median from training set (numerical), "Missing" literal (categorical)
- **Coverage Tracking:** `inputCoverage` metric for transparency

### Training Method
- **Approach:** CatBoost (gradient boosting on decision trees)
- **Training Location:** NOT FOUND (no training code in project; model is pre-trained artifact)
- **Hyperparameters (from artifact):** NOT FOUND (joblib artifact; no hyperparameter dump)
- **Optimization:** Optuna-tuned (implied by filename `*_optuna.joblib`)
- **Feature Names:** Loaded from artifact metadata

### Validation Method
- **Validation Approach:** NOT FOUND (no validation results reported)
- **Cross-validation:** NOT FOUND
- **Test Set Performance:** NOT FOUND

### Hyperparameters
- **Threshold:** 0.33 (binary classification boundary; configurable via ENV)
- **Model Artifact Path:** ENV `MODEL_FILE` (default: `attrition_risk_catboost_v7_optuna.joblib`)
- **Dataset Medians Path:** ENV `MODEL_DATASET_FILE` (default: `Sri_Lankan_Hiring_Attrition_Dataset.csv`)
- **Risk Bucketing:**
  - Low: risk_score < 35 (probability < 0.35)
  - Medium: 35 ≤ risk_score < 65 (0.35 ≤ probability < 0.65)
  - High: risk_score ≥ 65 (probability ≥ 0.65)
- **File:** [backend/services/attrition-model-service/src/model_runner.py](backend/services/attrition-model-service/src/model_runner.py), lines 41–52

### Thresholds
- **Binary Classification Threshold:** 0.33
- **Risk Level Bucketing:**
  - Low: < 0.35
  - Medium: 0.35–0.65
  - High: > 0.65
- **Decision Rule:** probability ≥ 0.33 → predictedAttrition = True
- **Justification:** NOT FOUND (hardcoded, no sensitivity analysis)

### Inference Process
1. Load model artifact (CatBoost classifier) + feature metadata at startup
2. Receive candidate dict + simulation dict
3. Adapt features via FeatureAdapter:
   - Map CV fields → model features
   - Apply salary simulation
   - Impute missing values (medians from training set)
4. Construct pandas DataFrame with model_feature columns
5. Encode categorical/numerical
6. Forward pass: `model.predict_proba(features)[0][1]` → probability of attrition
7. Compute risk_score = round(probability × 100)
8. Classify risk level (low/medium/high)
9. Return result + metadata (inputCoverage, imputedFeatures)
- **File:** [backend/services/attrition-model-service/src/model_runner.py](backend/services/attrition-model-service/src/model_runner.py), lines 39–62

### Evaluation Metrics
- **Published Results:** NOT FOUND
- **Accuracy:** NOT FOUND
- **Precision/Recall:** NOT FOUND
- **F1 Score:** NOT FOUND
- **ROC-AUC:** NOT FOUND
- **Calibration Error:** NOT FOUND
- **Domain-Specific Validation:** NOT FOUND (Sri Lankan hiring context not validated against external benchmark)

### Existing Results
- No validation results published
- Model is production-ready but accuracy/precision claims unsupported
- Transparency: returns `inputCoverage` and `imputedFeatures` to indicate data quality

### Model Limitations
1. **Undocumented Features:** Only 7 engineered features mentioned; actual feature set unknown
2. **Imputation-Heavy:** When inputCoverage < 0.5, majority of features are imputed from dataset medians; predictions not validated under high imputation
3. **Single Threshold:** Hardcoded 0.33 threshold; no per-domain calibration
4. **Regional Specificity:** Trained on Sri Lankan hiring data; generalization to other regions untested
5. **No Feature Importance:** CatBoost supports SHAP; no per-candidate explanations provided
6. **Label Definition Unknown:** Does "attrition" mean voluntary resignation, any departure, or role-specific exit? Unknown.
7. **Temporal Validity:** Model age unknown; hiring/attrition patterns may have shifted
8. **Dataset Bias:** No fairness analysis (gender, ethnicity, tenure bias in predictions)

---

## 4. SPEECH-TO-TEXT — Faster-Whisper

### Model/Algorithm
- **Name:** `faster-whisper` (local Whisper model from OpenAI/HuggingFace)
- **Type:** Sequence-to-sequence speech recognition
- **Framework:** PyTorch + ONNX Runtime
- **Source:** Downloaded from HuggingFace Hub on first startup
- **File:** [backend/services/speech-to-text-service/src/server.py](backend/services/speech-to-text-service/src/server.py)

### Purpose
Transcribe audio segments to text from live interview WebRTC streams or uploaded files

### Input
- **Audio Format:** WebM, WAV, OGG, MP4, M4A
- **Max File Size:** 5 MB (configurable via ENV `MAX_AUDIO_BYTES`)
- **Language:** English (default; can be auto-detected or specified)
- **Sample Rate:** NOT FOUND (Whisper handles arbitrary rates)

### Features
- NOT FOUND (Whisper uses learned audio embeddings; no handcrafted features)

### Target/Output
- **Type:** Transcribed text (string)
- **Output Format:**
  ```json
  {
    "success": true,
    "text": "I am interested in this role because...",
    "language": "en",
    "duration": 12.5,
    "segments": [
      {"id": 0, "seek": 0, "start": 0.0, "end": 2.5, "text": "I am interested", "confidence": 0.95, "temperature": 0.0}
    ]
  }
  ```

### Dataset/Source
- **Model:** Pre-trained Whisper (OpenAI)
- **Training Data:** 680K hours of multilingual audio from web (OpenAI)
- **Model Size Options:**
  - `tiny`: ~39M parameters (default)
  - `base`: ~74M parameters (ENV: `WHISPER_MODEL_SIZE=base`)
  - `medium`: ~308M parameters
  - `large`: ~1.5B parameters
- **Download Location:** HuggingFace Hub or custom path (ENV: `WHISPER_MODEL_DIR`)
- **Cache:** `~/.cache/huggingface` (or Docker volume `whisper-model-cache`)

### Preprocessing
- **Audio Decoding:** `ffmpeg` (via `faster-whisper` backend)
- **Resampling:** Whisper normalizes to 16 kHz
- **Normalization:** Audio amplitude normalized
- **Frame Length:** 30-second segments (Whisper standard)
- **Sliding Window:** Overlapping frames for temporal continuity

### Feature Engineering
- NOT FOUND (Whisper uses learned spectral features; no handcrafted features)

### Training Method
- **Approach:** Multi-task learning (speech recognition + language classification)
- **Training Data:** 680K hours of multilingual audio (OpenAI Whisper paper)
- **Local Training:** NOT FOUND (model is pre-trained)

### Validation Method
- **Validation Dataset:** NOT FOUND (not published in this project)
- **Test Set (from Whisper paper):** Multiple multilingual benchmarks (LibriSpeech, CoVoice, etc.)
- **Word Error Rate (WER):** NOT FOUND in this project (refer to OpenAI Whisper paper)

### Hyperparameters
- **Model Size:** `tiny` (default; ENV: `WHISPER_MODEL_SIZE`)
- **Device:** `cpu` (default; ENV: `WHISPER_DEVICE`; cuda supported)
- **Compute Type:** `int8` (for CPU; ENV: `WHISPER_COMPUTE_TYPE`; float16 for GPU)
- **Beam Size:** 1 (ENV: `WHISPER_BEAM_SIZE`; default 1 = greedy decoding)
- **Language:** Auto-detected or specified
- **File:** [backend/services/speech-to-text-service/src/server.py](backend/services/speech-to-text-service/src/server.py), lines 22–28

### Thresholds
- **Max Audio Duration:** NOT FOUND (Whisper handles variable-length audio)
- **Max Upload Size:** 5 MB
- **Confidence Threshold:** NOT FOUND (Whisper returns confidence per-segment)

### Inference Process
1. Load model once at startup (tokenizer + layers, size depends on `tiny`/`base`/`medium`/`large`)
2. Receive audio file (multipart upload)
3. Validate: file size ≤ 5 MB, format in [webm, wav, ogg, mp4, m4a]
4. Decode audio (ffmpeg backend)
5. Resample to 16 kHz
6. Run inference:
   - If beam_size=1: greedy decoding
   - Otherwise: beam search (slower, more accurate)
7. Return transcription + confidence per segment
8. Store transcript in MongoDB (via Job Service)
- **File:** [backend/services/speech-to-text-service/src/server.py](backend/services/speech-to-text-service/src/server.py), lines 50–100 (inferred from structure)

### Evaluation Metrics
- **Word Error Rate (WER):** Per OpenAI Whisper paper (NOT in this project)
- **Character Error Rate (CER):** NOT FOUND
- **Local Validation:** NOT FOUND (assume Whisper's published benchmarks)

### Existing Results
- No validation in this project
- Refer to OpenAI Whisper paper for multilingual WER benchmarks
- Tiny model reported ~6–12% WER on English (LibriSpeech test-clean)

### Model Limitations
1. **Domain Shift:** Pre-trained on general web audio; interview speech may have different acoustic/linguistic patterns
2. **Speaker Diarization:** Not performed; no speaker labels in output
3. **Confidence Calibration:** Segment-level confidence not post-calibrated to actual accuracy
4. **Language Assumption:** English-only in this project; multilingual support available but not leveraged
5. **Computational Cost:** Tiny model acceptable on CPU; larger models require GPU
6. **Hallucination Risk:** Whisper known to hallucinate text in low-SNR audio
7. **Punctuation:** Whisper does not add punctuation; raw transcription may lack sentence breaks

---

## 5. INTERVIEW ANSWER SCORING — DeBERTa (V2 Checkpoint)

### Model/Algorithm
- **Name:** `Final_Interview_Answer_Scoring_Model_V2` (supplied checkpoint)
- **Type:** DeBERTa-based sequence classification (5-class)
- **Classes:** ["Wrong", "Poor", "Average", "Good", "Excellent"]
- **Framework:** PyTorch + Transformers
- **Source:** Supplied local checkpoint (pre-trained, no fine-tuning in project)
- **File:** [backend/services/interview-answer-model-service/src/model_runner.py](backend/services/interview-answer-model-service/src/model_runner.py)

### Purpose
Score interview answer quality on a 0–100 scale, mapping to rating classes (Wrong/Poor/Average/Good/Excellent)

### Input
- **Question:** Interview question text (string, required)
- **Reference Answer:** Expected or sample answer (string, required)
- **Candidate Answer:** Actual candidate response (string, required)
- **Prompt Format:**
  ```
  Premise: "Interview Question: {question}\nExpected Answer: {reference_answer}"
  Hypothesis: "Candidate Answer: {candidate_answer}"
  ```
- **Max Length:** 384 tokens (default; configurable via ENV `MODEL_MAX_LENGTH`)
- **File:** [backend/services/interview-answer-model-service/src/model_runner.py](backend/services/interview-answer-model-service/src/model_runner.py), lines 70–85

### Features
- **Input Encoding:** Premise-hypothesis pair (NLI-style)
- **Tokenization:** AutoTokenizer from checkpoint
- **Padding/Truncation:** Max 384 tokens
- **Feature Extraction:** Pre-trained DeBERTa embeddings

### Target/Output
- **Type:** Continuous score 0–100 (calibrated from logits)
- **Classification:** Map calibrated score → rating class (Wrong/Poor/Average/Good/Excellent)
- **Output Format:**
  ```json
  {
    "score": 82.45,
    "rating": "Good" | "Excellent" | "Average" | "Poor" | "Wrong",
    "confidence": 92.30,
    "probabilities": {
      "Wrong": 2.50,
      "Poor": 5.20,
      "Average": 10.15,
      "Good": 35.80,
      "Excellent": 46.35
    },
    "modelId": "Final_Interview_Answer_Scoring_Model_V2"
  }
  ```

### Dataset/Source
- **Training Dataset:** NOT FOUND (supplied checkpoint; origin unknown)
- **Training Data Size:** NOT FOUND
- **Domain:** Interview answers (general HR context assumed)
- **Languages:** English (assumed)

### Preprocessing
- **Tokenization:** AutoTokenizer (from checkpoint directory)
- **Max Length:** 384 tokens (configurable)
- **Padding:** True
- **Truncation:** True
- **Return Tensors:** PyTorch (`pt`)
- **Device:** CPU or CUDA (configurable)
- **Inference Mode:** `torch.no_grad()` (no gradient computation)
- **File:** [backend/services/interview-answer-model-service/src/model_runner.py](backend/services/interview-answer-model-service/src/model_runner.py), lines 74–95

### Feature Engineering
- **Structured Prompt:** Question + reference answer → premise; candidate answer → hypothesis
- **Class Score Centers:** Configured in `scoring_config.json` (loaded from checkpoint dir)
- **Calibration:** Linear calibration applied: `calibration_a × raw_score + calibration_b`

### Training Method
- **Approach:** Transfer learning from pre-trained DeBERTa (no local fine-tuning)
- **Supervision:** NOT FOUND (checkpoint origin unknown; possibly supervised on interview answer ratings)
- **Loss Function:** NOT FOUND

### Validation Method
- **Validation Approach:** NOT FOUND
- **Cross-validation:** NOT FOUND
- **Test Set:** NOT FOUND

### Hyperparameters
- **Model Max Length:** 384 tokens (ENV: `MODEL_MAX_LENGTH`)
- **Device:** CPU (default; ENV: `MODEL_DEVICE`; cuda supported)
- **Model ID:** `Final_Interview_Answer_Scoring_Model_V2` (ENV: `MODEL_ID`)
- **Calibration Parameters:** Loaded from `scoring_config.json`:
  - `calibration_a`: Linear scaling factor
  - `calibration_b`: Linear bias term
  - `class_score_centers`: Expected logit values per class
  - `optimized_thresholds`: Thresholds to map calibrated score → class
- **File:** [backend/services/interview-answer-model-service/src/model_runner.py](backend/services/interview-answer-model-service/src/model_runner.py), lines 37–48

### Thresholds
- **Classification Thresholds:** Stored in `scoring_config.json` (optimized, not disclosed)
- **Calibration:** Linear transform from raw logit score to [0, 1]
- **Clipping:** Final calibrated score clipped to [0.0, 1.0]
- **Class Mapping:** `np.digitize(calibrated_score, thresholds)` → class ID
- **File:** [backend/services/interview-answer-model-service/src/model_runner.py](backend/services/interview-answer-model-service/src/model_runner.py), lines 78–97

### Inference Process
1. Load checkpoint once at startup (tokenizer + model + scoring_config.json)
2. Receive question, reference_answer, candidate_answer
3. Format premise/hypothesis strings
4. Tokenize with padding/truncation (max 384 tokens)
5. Forward pass (no gradients): outputs.logits shape [batch=1, num_classes=5]
6. Apply softmax to logits → probabilities per class
7. Compute raw score: weighted sum of logit centers (expected class logit values)
8. Apply calibration: `calibration_a × raw_score + calibration_b`
9. Clip to [0.0, 1.0]
10. Map calibrated score → class ID using `optimized_thresholds`
11. Return score (×100), rating name, confidence, class probabilities
- **File:** [backend/services/interview-answer-model-service/src/model_runner.py](backend/services/interview-answer-model-service/src/model_runner.py), lines 62–97

### Evaluation Metrics
- **Published Results:** NOT FOUND
- **Accuracy/F1 on Test Set:** NOT FOUND
- **Agreement with Human Raters:** NOT FOUND
- **Correlation with Job Performance:** NOT FOUND
- **Calibration Error:** NOT FOUND

### Existing Results
- No validation results published
- Model is deployed in production but validation status unknown
- Returns confidence and class probabilities for user review

### Model Limitations
1. **Black Box Calibration:** Calibration parameters in `scoring_config.json` not documented; unclear how thresholds were optimized
2. **Limited Context:** Max 384 tokens may truncate long Q&A pairs
3. **Reference Answer Dependency:** Requires reference answer; when auto-generated from job skills, quality affects scoring
4. **No Explainability:** No attention visualization or feature attribution for individual scores
5. **Unknown Domain:** Checkpoint origin unknown; interview answer rating distribution on supplied data uncertain
6. **Threshold Optimization Unknown:** "optimized_thresholds" likely from training set; generalization to new domains untested
7. **Bias Risk:** No fairness analysis for different interview styles, accents, or demographic groups

---

## 6. INTERVIEW NLI (NATURAL LANGUAGE INFERENCE) — DeBERTa NLI

### Model/Algorithm
- **Name:** `Xenova/nli-deberta-v3-xsmall`
- **Type:** DeBERTa-based 3-class NLI (Natural Language Inference)
- **Classes:** ["entailment", "neutral", "contradiction"]
- **Framework:** HuggingFace Transformers (JavaScript binding)
- **Source:** HuggingFace Hub (downloaded on first startup)
- **File:** [backend/services/interview-analysis-service/src/model/nliModel.js](backend/services/interview-analysis-service/src/model/nliModel.js)

### Purpose
Assess semantic relationship between interview question and candidate answer (or question vs. job context)
- **Application 1:** Question relevance to job (premise = job context, hypothesis = "This question evaluates a requirement")
- **Application 2:** Answer relevance to question (premise = candidate answer, hypothesis = "This answer addresses the question")
- **Application 3:** Concept coverage (premise = candidate answer, hypothesis = "This answer covers concept X")

### Input
- **Premise:** Reference text (job description, question, or candidate answer)
- **Hypothesis:** Claim to evaluate (e.g., "This is relevant", "Covers concept X")
- **Format:** Tokenized premise-hypothesis pair
- **Max Length:** 256 tokens (hardcoded in model.js)
- **File:** [backend/services/interview-analysis-service/src/model/nliModel.js](backend/services/interview-analysis-service/src/model/nliModel.js), line 36

### Features
- NOT FOUND (DeBERTa uses learned embeddings; no handcrafted features)

### Target/Output
- **Type:** 3-way classification (entailment, neutral, contradiction)
- **Output Format:**
  ```json
  {
    "label": "entailment" | "neutral" | "contradiction",
    "confidence": 0.92,
    "probabilities": {
      "entailment": 0.92,
      "neutral": 0.06,
      "contradiction": 0.02
    }
  }
  ```
- **Usage in Analysis:**
  - Question Relevance: `entailment_prob × 0.7 + lexical_overlap × 0.3`
  - Answer Relevance: `entailment_prob × 0.7 + answer_overlap × 0.3`
  - Concept Coverage: `entailment_prob` (higher = better support)
  - Concept Contradiction: `contradiction_prob` (higher = more problematic)
- **File:** [backend/services/interview-analysis-service/src/services/scoringService.js](backend/services/interview-analysis-service/src/services/scoringService.js), lines 24–56

### Dataset/Source
- **Training Dataset:** NOT FOUND (HuggingFace pre-trained model; dataset unknown)
- **Model Publisher:** Xenova (Hugging Face Model Hub)
- **Training Data Size:** NOT FOUND
- **Domain:** NLI (general textual inference; likely from MNLI or SNLI)
- **Languages:** English (assumed)

### Preprocessing
- **Tokenization:** AutoTokenizer (from HuggingFace Hub)
- **Max Length:** 256 tokens (hardcoded in `classify()`)
- **Padding:** True
- **Truncation:** True
- **Return Tensors:** Browser-compatible (WASM tensors)
- **File:** [backend/services/interview-analysis-service/src/model/nliModel.js](backend/services/interview-analysis-service/src/model/nliModel.js), line 36

### Feature Engineering
- NOT FOUND (Pre-trained model; no local feature engineering)

### Training Method
- **Approach:** Transfer learning from pre-trained NLI model (no local fine-tuning)
- **Local Training:** NOT FOUND

### Validation Method
- **Validation Approach:** NOT FOUND (refer to HuggingFace model card for upstream validation)
- **Cross-validation:** NOT FOUND
- **Test Set:** NOT FOUND

### Hyperparameters
- **Model ID:** `Xenova/nli-deberta-v3-xsmall` (ENV: `INTERVIEW_NLI_MODEL_ID`)
- **Max Sequence Length:** 256 tokens (hardcoded)
- **Inference Mode:** Sequential queue-based (to avoid concurrent GPU bottleneck)
- **File:** [backend/services/interview-analysis-service/src/config/env.js](backend/services/interview-analysis-service/src/config/env.js), line 19

### Thresholds
**Question Relevance Scoring:**
- Relevance Score = max(entailment_prob × 0.7 + lexical_overlap × 0.3, 78 if matched_job_areas > 0)
- Classification: "Relevant" if score ≥ 60, else "Needs review"
- **File:** [backend/services/interview-analysis-service/src/services/scoringService.js](backend/services/interview-analysis-service/src/services/scoringService.js), lines 27–30

**Answer Relevance Scoring:**
- Relevance = max(entailment_prob × 0.7 + answer_overlap × 0.3, answer_overlap × 100)
- **File:** [backend/services/interview-analysis-service/src/services/scoringService.js](backend/services/interview-analysis-service/src/services/scoringService.js), line 38

**Concept Coverage:**
- Covered if entailment_prob × 0.7 + lexical_support ≥ 0.5
- Contradicted if contradiction_prob ≥ 0.6 AND label includes "contradiction"
- Not Mentioned otherwise
- **File:** [backend/services/interview-analysis-service/src/services/scoringService.js](backend/services/interview-analysis-service/src/services/scoringService.js), lines 44–54

### Inference Process
1. Load model once at startup (tokenizer + model)
2. For each analysis task:
   - Format premise/hypothesis strings
   - Tokenize (max 256 tokens)
   - Queue forward pass (to avoid GPU contention)
   - Apply softmax to logits → class probabilities
   - Extract label from config.id2label
   - Return label, confidence, probabilities
3. Use results in scoring logic:
   - Blend NLI confidence with lexical overlap
   - Aggregate concept coverage across reference concepts
   - Flag contradictions for manual review
- **File:** [backend/services/interview-analysis-service/src/model/nliModel.js](backend/services/interview-analysis-service/src/model/nliModel.js), lines 23–42

### Evaluation Metrics
- **Published Results:** NOT FOUND (refer to HuggingFace model card)
- **Accuracy on MNLI Test Set:** ~93% (approx., from Xenova model card)
- **Accuracy on SNLI Test Set:** ~93% (approx., from Xenova model card)
- **Local Validation:** NOT FOUND (no interview-specific validation in project)

### Existing Results
- No validation in this project
- Model is HuggingFace community model; refer to upstream card for metrics
- Used as fallback when interview answer model unavailable (hybrid approach)

### Model Limitations
1. **Domain Mismatch:** NLI models trained on general textual pairs; interview Q&A may have different linguistic patterns
2. **Threshold Mixing:** NLI confidence combined with ad-hoc lexical overlap weights (0.7/0.3); thresholds not tuned for interview domain
3. **Binary Entailment:** NLI produces probabilities but threshold (60 for "Relevant", 0.5 for concept coverage) appears arbitrary
4. **No Interview Semantics:** Model may not understand job-specific terminology or technical jargon
5. **Concept Hallucination:** Lexical overlap insufficient; may incorrectly classify concepts as "covered" if keywords appear out of context
6. **Contradiction Sensitivity:** contradiction_prob threshold (0.6) not calibrated to interview answer corrections/clarifications

---

## SUMMARY TABLE: ML COMPONENTS PUBLICATION READINESS

| Model | Published Results | Validation Data | Test Metrics | Hyperparameter Tuning | Domain-Specific Eval | Production Ready |
|-------|-------------------|------------------|--------------|----------------------|----------------------|-----------------|
| CV Matching (BERT) | ❌ NOT FOUND | ❌ NOT FOUND | ❌ NOT FOUND | ❌ NOT FOUND | ❌ NOT FOUND | ✅ Yes (pre-trained) |
| Resume Strength (DeBERTa) | ❌ NOT FOUND | ❌ NOT FOUND | ❌ NOT FOUND | ❌ NOT FOUND | ❌ NOT FOUND | ✅ Yes (supplied) |
| Attrition (CatBoost) | ❌ NOT FOUND | ✅ Training set known | ❌ NOT FOUND | ⚠️ Optuna (unclear) | ❌ NOT FOUND | ✅ Yes (local artifact) |
| Speech-to-Text (Whisper) | ✅ OpenAI paper | ✅ Public benchmarks | ✅ WER reported | ✅ Published | ⚠️ On general audio | ✅ Yes (pre-trained) |
| Interview Answer (DeBERTa V2) | ❌ NOT FOUND | ❌ NOT FOUND | ❌ NOT FOUND | ⚠️ Calibration (unclear) | ❌ NOT FOUND | ✅ Yes (supplied) |
| Interview NLI (DeBERTa NLI) | ✅ HuggingFace card | ✅ Public MNLI/SNLI | ✅ ~93% accuracy | ✅ Published | ❌ NOT on interviews | ✅ Yes (pre-trained) |

---

## EXPERIMENTS & METRICS REQUIRED FOR IEEE PUBLICATION

### For Each Model: Minimum Required Experiments

#### **1. CV Matching (BERT)**
**Required Experiments:**
1. **Validation Set Evaluation:**
   - Curate 200–500 matched/unmatched CV-job pairs (manual labeling)
   - Compute: Accuracy, Precision, Recall, F1, ROC-AUC
   - Report: Threshold sensitivity (vary threshold 0.30–0.60)

2. **Domain Generalization:**
   - Evaluate on job sectors: tech, healthcare, finance, manufacturing
   - Report per-sector ROC-AUC and F1

3. **Error Analysis:**
   - Failure cases: unmatched pairs ranked high vs. matched pairs ranked low
   - Linguistic patterns: text length, skill specificity, job context richness

4. **Ablation Study:**
   - Without job description
   - Without candidate skills
   - Impact on F1 and ROC-AUC

**Metrics to Report:**
- Accuracy, Precision, Recall, F1, ROC-AUC, Brier Score (calibration)
- Per-sector performance (if applicable)
- Threshold optimization analysis

**File to Create:** `experiments/cv_matching_validation.md`

---

#### **2. Resume Strength Scoring (DeBERTa)**
**Required Experiments:**
1. **Proficiency Calibration:**
   - Collect 500+ skill annotations with proficiency levels (Beginner/Intermediate/Advanced)
   - Compute: Accuracy of proficiency classification
   - Report: Confusion matrix

2. **Skill Extraction Precision/Recall:**
   - Gold standard: 200 manually annotated skills per CV
   - Compute: Precision, Recall, F1 for skill detection
   - Break down by skill category (technical, soft, domain-specific)

3. **Project Strength Correlation:**
   - Collect human ratings (1–10) for 100 projects
   - Compute: Spearman/Pearson correlation with model scores
   - Report: Correlation coefficient, p-value

4. **Duration Extraction Error:**
   - Test on 200 CVs with explicit duration mentions
   - Compute: MAPE (Mean Absolute Percentage Error) for years extraction
   - Identify failure patterns

**Metrics to Report:**
- Proficiency classification accuracy
- Skill extraction precision/recall/F1
- Project strength correlation (r, p-value)
- Duration extraction MAPE

**File to Create:** `experiments/resume_strength_validation.md`

---

#### **3. Attrition Prediction (CatBoost)**
**Required Experiments:**
1. **Model Performance on Test Set:**
   - Split Sri Lankan dataset: 70% train, 15% validation, 15% test
   - Compute: Accuracy, Precision, Recall, F1, ROC-AUC, PR-AUC
   - Report: Confusion matrix

2. **Input Coverage Impact:**
   - Stratify test set by inputCoverage buckets (< 0.5, 0.5–0.7, > 0.7)
   - Report: F1 score per bucket
   - Show degradation as coverage decreases

3. **Feature Importance:**
   - Compute SHAP values or permutation importance
   - Identify: top 5 most influential features
   - Report: Feature importance ranking

4. **Fairness Analysis:**
   - Stratify by gender (if available), tenure, role, location
   - Report: False positive/negative rates per group
   - Identify demographic bias

5. **Threshold Sensitivity:**
   - Vary threshold 0.25–0.50
   - Plot: Precision-Recall curve
   - Optimize threshold for recall (avoid false negatives in attrition risk)

6. **External Validation (if possible):**
   - Apply model to non-Sri Lankan hiring data
   - Report: ROC-AUC drop as evidence of regional specificity

**Metrics to Report:**
- Accuracy, Precision, Recall, F1, ROC-AUC, PR-AUC on test set
- Performance by inputCoverage bucket
- Top 5 feature importances (SHAP or permutation)
- Demographic parity metrics (FPR/FNR by group)
- Threshold optimization curve

**File to Create:** `experiments/attrition_validation.md`

---

#### **4. Speech-to-Text (Faster-Whisper)**
**Required Experiments:**
1. **Word Error Rate (WER) on Interview Audio:**
   - Record/collect 50–100 interview transcripts (annotated ground truth)
   - Compute: WER = (S + D + I) / N (Substitutions, Deletions, Insertions, reference words)
   - Report: WER for tiny, base model sizes

2. **Language Detection:**
   - Test on multilingual audio (if applicable)
   - Report: Accuracy of language identification

3. **Speaker Diarization Error:**
   - Assess impact of overlapping speech
   - Report: WER with/without overlapping speakers

4. **Confidence Calibration:**
   - Collect confidence scores from Whisper
   - Group by confidence bin (0–20%, 20–40%, ..., 80–100%)
   - Plot: Actual WER vs. predicted confidence
   - Compute: ECE (Expected Calibration Error)

5. **Domain Adaptation:**
   - Compare WER on interview audio vs. general speech (LibriSpeech)
   - Report: Domain shift impact

**Metrics to Report:**
- WER (tiny, base models)
- Language detection accuracy (if multilingual)
- Confidence calibration curve, ECE
- Domain-specific WER

**File to Create:** `experiments/whisper_validation.md`

---

#### **5. Interview Answer Scoring (DeBERTa V2)**
**Required Experiments:**
1. **Rating Classification Accuracy:**
   - Collect 200–500 interview answers with expert human ratings
   - Compute: Accuracy, Macro-F1 (across 5 classes), Weighted-F1
   - Report: Confusion matrix (actual vs. predicted rating)

2. **Score Calibration:**
   - Plot: Predicted score (0–100) vs. human rating (1–5)
   - Compute: Spearman correlation, Brier score
   - Identify: miscalibrated score ranges

3. **Concept Coverage Correlation:**
   - For 100 answers with reference answers
   - Compute: Correlation between model's coverage score and human judgment
   - Report: r, p-value

4. **Fairness Across Demographics:**
   - Stratify answers by speaker accent, gender (if available), native language
   - Report: Rating distribution and potential bias (e.g., native speakers rated higher?)

5. **Threshold Optimization:**
   - Vary classification thresholds
   - Report: Precision-Recall curve, optimal threshold for "Strong answer" vs. "Needs review"

**Metrics to Report:**
- Accuracy, Macro-F1, Weighted-F1 (5-class classification)
- Confusion matrix
- Score-to-rating correlation (Spearman r, p-value)
- Fairness: rating distribution by demographic group
- Threshold optimization PR curve

**File to Create:** `experiments/interview_answer_validation.md`

---

#### **6. Interview NLI (DeBERTa NLI)**
**Required Experiments:**
1. **Question Relevance Validation:**
   - Collect 100 interview questions + job descriptions
   - Manual labels: relevant vs. not relevant
   - Compute: NLI model precision/recall for relevance (using entailment threshold 0.6)
   - Compare to lexical baseline (keyword overlap)

2. **Concept Coverage Recall:**
   - For 100 reference answers, compute concept keywords
   - Run NLI for each concept vs. candidate answer
   - Compute: Precision/Recall for concept detection
   - Report: per-concept breakdown

3. **Contradiction Detection:**
   - Collect 50 candidate answers with contradictions (explicit inconsistencies)
   - Compute: Precision/Recall for contradiction detection (threshold 0.6)

4. **Hybrid vs. NLI-Only:**
   - Compare NLI-only scoring vs. NLI + lexical overlap (0.7/0.3 blend)
   - Report: Which performs better on domain data?

5. **Threshold Sensitivity:**
   - Vary entailment threshold (0.40–0.80)
   - Plot: Precision-Recall curve
   - Optimize threshold for interview domain

**Metrics to Report:**
- Precision/Recall for relevance classification
- Precision/Recall for concept coverage
- Precision/Recall for contradiction detection
- Hybrid vs. NLI-only comparison (F1)
- Threshold optimization curve

**File to Create:** `experiments/nli_validation.md`

---

### Cross-Model Experiments

#### **7. End-to-End Interview Analysis Pipeline**
**Required Experiment:**
1. **Full Pipeline Validation:**
   - Run 50 complete interviews through: speech-to-text → NLI analysis → answer scoring
   - Collect ground truth: expert human evaluation of interviews
   - Compute: Correlation between automated scores and human evaluation
   - Report: Spearman r, agreement metrics (% rated same tier)

2. **Error Propagation:**
   - Measure impact of ASR errors on downstream NLI/scoring
   - Report: Score degradation per 10% WER increase

**Metrics to Report:**
- Pipeline precision/recall for "Strong" vs. "Needs review" classification
- Correlation with human expert ratings (r, p-value)
- Error propagation analysis

**File to Create:** `experiments/pipeline_validation.md`

---

#### **8. Attrition + CV Matching Integration**
**Required Experiment:**
1. **Combined Signal Validation:**
   - Hypothesis: candidates with high match score + low attrition risk are most likely to succeed
   - Collect: hiring outcomes for 500+ candidates (hired + 6-month retention)
   - Stratify by: (match score bucket) × (attrition risk bucket)
   - Report: Retention rate per stratum
   - Compute: Correlation of combined signal with actual retention

**Metrics to Report:**
- Retention rate by (match score, attrition risk) stratum
- ROC-AUC of combined signal
- Evidence for/against synergistic benefit

**File to Create:** `experiments/combined_signal_validation.md`

---

## CHECKLIST FOR IEEE PUBLICATION

### Data & Validation
- [ ] **Test Set Defined:** For each model, define and freeze test set (no data leakage)
- [ ] **Human Annotation:** Hire 2–3 annotators; report inter-annotator agreement (Cohen's κ)
- [ ] **Gold Standard:** For each metric, establish ground truth via human experts or public benchmarks
- [ ] **Documentation:** Publish dataset descriptions (size, splits, label distribution) in appendix

### Model Evaluation
- [ ] **Standard Metrics:** Report accuracy, precision, recall, F1, ROC-AUC for all classification tasks
- [ ] **Correlation Metrics:** For continuous outputs, report Spearman/Pearson r with p-values
- [ ] **Calibration:** Plot predicted vs. actual scores; compute ECE or Brier score
- [ ] **Uncertainty Quantification:** Report confidence intervals for key metrics

### Fairness & Bias
- [ ] **Demographic Parity:** Stratify results by gender, ethnicity, tenure, region (if available)
- [ ] **Equalized Odds:** Report FPR/FNR per demographic group
- [ ] **Disclosure:** Document known limitations and biases

### Reproducibility
- [ ] **Code Release:** Publish evaluation scripts (with data redaction for privacy)
- [ ] **Hyperparameters:** Document all thresholds, model sizes, device settings
- [ ] **Random Seeds:** Set seeds for reproducibility; report variance across runs
- [ ] **Dependencies:** List versions: Python 3.11+, PyTorch X.X, Transformers X.X, CatBoost X.X

### Error Analysis
- [ ] **Failure Cases:** For each model, document 20–30 representative failure modes
- [ ] **Linguistic Patterns:** Identify text characteristics that cause errors (length, terminology, ambiguity)
- [ ] **Recommendations:** Suggest mitigation strategies (data augmentation, fine-tuning, ensemble methods)

### Statistical Significance
- [ ] **Hypothesis Tests:** For each metric comparison, compute p-values (t-test, Mann-Whitney-U)
- [ ] **Confidence Intervals:** Report 95% CI for all reported metrics
- [ ] **Multiple Comparison Correction:** Apply Bonferroni/FDR if testing many hypotheses

### Limitations & Future Work
- [ ] **Documented Limitations:** List all 5–10 key limitations per model (see above)
- [ ] **Generalization:** Discuss transfer to unseen domains, languages, demographics
- [ ] **Computational Cost:** Report inference latency, memory footprint (CPU/GPU)
- [ ] **Future Directions:** Fine-tuning opportunities, ensemble approaches, active learning

---

## SAMPLE EXPERIMENTAL WORKFLOW (First Priority)

**Phase 1: Attrition Model (Highest Priority — Domain-Specific Contribution)**

1. **Week 1–2:** Obtain Sri Lankan hiring dataset; document schema, label distribution, missing values
2. **Week 3:** Conduct human annotation study:
   - Recruit 2 HR experts
   - Annotate 200 random samples (agree/disagree on attrition prediction)
   - Compute inter-rater κ (Cohen's kappa)
3. **Week 4:** Train-test split; compute baseline (always-predict-no-attrition, majority class)
4. **Week 5:** Run CatBoost model on test set; compute ROC-AUC, Precision, Recall, F1, Brier score
5. **Week 6:** Feature importance analysis (SHAP)
6. **Week 7:** Fairness analysis (FPR/FNR by gender, tenure, role)
7. **Week 8:** Report writing + submission

**Phase 2: Interview Pipeline (Secondary Priority)**

8. **Week 9–11:** Collect 100 interview transcripts + expert ratings
9. **Week 12:** Evaluate speech-to-text WER; NLI relevance; answer scoring accuracy
10. **Week 13:** End-to-end pipeline validation (correlation with human evaluation)

---

**Bottom Line:** The attrition model (CatBoost) is the most research-relevant component. Focus publication efforts there. Whisper and NLI are off-the-shelf; focus on application validation (does NLI work for interview analysis?) rather than model development.

