# Reproducibility and Publication Readiness Notes

This document records what is reproducible from the checked-in repository and what remains unavailable in the repository without making unsupported claims.

## Scope

The repository contains a benchmark study and a feature-ablation study for the attrition-risk model, plus the saved model artifact and dataset used by the production service.

The code that is directly available in this repository is:

- backend/services/attrition-model-service/attrition_risk_catboost_v7_optuna.joblib
- backend/services/attrition-model-service/Sri_Lankan_Hiring_Attrition_Dataset.csv
- experiments/experiment_1_attrition_benchmark/run_experiment.py
- experiments/experiment_2_feature_ablation/run_ablation.py
- experiments/experiment_1_attrition_benchmark/results/
- experiments/experiment_2_feature_ablation/results/

The production runtime logic is in:

- backend/services/attrition-model-service/src/feature_adapter.py
- backend/services/attrition-model-service/src/model_runner.py

## Dataset and schema

The dataset file is:

- backend/services/attrition-model-service/Sri_Lankan_Hiring_Attrition_Dataset.csv

Verified repository facts:

- Shape: 1470 rows x 53 columns
- Target column: Attrition
- Positive class count: 237
- Negative class count: 1233
- Positive rate: 16.12%
- Column names:
  Age, Attrition, BusinessTravel, DailyRate, Department, DistanceFromHome, Education, EducationField, EmployeeCount, EmployeeNumber, EnvironmentSatisfaction, Gender, HourlyRate, JobInvolvement, JobLevel, JobRole, JobSatisfaction, MaritalStatus, MonthlyRate, NumCompaniesWorked, Over18, OverTime, PercentSalaryHike, PerformanceRating, RelationshipSatisfaction, StandardHours, StockOptionLevel, TotalWorkingYears, TrainingTimesLastYear, WorkLifeBalance, YearsAtCompany, YearsInCurrentRole, YearsSinceLastPromotion, YearsWithCurrManager, MonthlyIncomeLKR, PreferredWorkLocation, WorkType, ExpectedSalaryLKR, OfferedSalaryLKR, SalaryGapLKR, SalaryGapPercentage, MatchScore, JobSimilarityScore, TechnicalScore, CommunicationScore, BehaviourScore, ConfidenceScore, InterviewScore, NoticePeriodDays, TrainingProgramme, MentorshipProgramme, CareerDevelopmentPlan, CertificationOpportunity

Important provenance note:

- Dataset source, collection protocol, institutional/ethical approval, consent procedure, and temporal coverage are NOT AVAILABLE IN REPOSITORY.

## Model artifact and saved metadata

The saved model artifact is:

- backend/services/attrition-model-service/attrition_risk_catboost_v7_optuna.joblib

Verified artifact metadata from the repository's saved object:

- model_name: CatBoost Attrition Risk V7 Optuna
- target: Attrition
- threshold: 0.3300000000000002
- cv_settings: {'folds': 5, 'minimum_recall': 0.5}
- best_parameters:
  {
    'iterations': 600,
    'depth': 4,
    'learning_rate': 0.06166089758824361,
    'l2_leaf_reg': 12.021762098987002,
    'random_strength': 2.109062640552058,
    'bagging_temperature': 1.0712964818091288,
    'border_count': 254,
    'boosting_type': 'Ordered'
  }
- categorical_features and numerical_features metadata are present in the artifact.
- Feature set metadata is present in the artifact.
- positive_class_weight: 1.347814 (default if not explicitly stored in artifact metadata)

Important tuning note:

- The repository contains the saved model artifact and its metadata, but it does not contain the original Optuna search script, the search space definition, or the pruning/selection logic used to produce that artifact.
- Optuna search implementation, search space details, and threshold-selection rationale are NOT AVAILABLE IN REPOSITORY.

## Reproducible experiment setup

### Experiment 1: benchmark study

Script:

- experiments/experiment_1_attrition_benchmark/run_experiment.py

This script:

- loads Sri_Lankan_Hiring_Attrition_Dataset.csv
- applies the 7 engineered domain features using the same logic as feature_adapter.py
- evaluates the following models using 5-fold StratifiedKFold with random_state=42:
  - Optuna CatBoost (Threshold=0.33)
  - Optuna CatBoost (Threshold=0.50)
  - Default CatBoost
  - XGBoost
  - LightGBM
  - Random Forest
  - Logistic Regression (ElasticNet)
- computes accuracy, balanced_accuracy, precision, recall, f1, roc_auc, and pr_auc
- writes outputs to experiments/experiment_1_attrition_benchmark/results/

Verified output summary (from the checked-in results files):

- Optuna CatBoost (Threshold=0.33):
  - Accuracy: 83.81% ± 1.90
  - Balanced Acc: 70.40% ± 1.50
  - Precision: 50.44% ± 5.55
  - Recall: 50.62% ± 2.72
  - F1-Score: 50.34% ± 3.11
  - ROC-AUC: 0.8071 ± 0.0239
  - PR-AUC: 0.5753 ± 0.0475
  - Decision threshold: 0.3300000000000002
- Optuna CatBoost (Threshold=0.50):
  - Accuracy: 86.33% ± 1.48
  - Balanced Acc: 65.78% ± 2.24
  - Precision: 65.33% ± 11.14
  - Recall: 35.46% ± 4.78
  - F1-Score: 45.50% ± 4.77
  - ROC-AUC: 0.8071 ± 0.0239
  - PR-AUC: 0.5753 ± 0.0475
  - Decision threshold: 0.50

### Experiment 2: feature-ablation study

Script:

- experiments/experiment_2_feature_ablation/run_ablation.py

This script:

- defines configuration A, B, and C
- uses the same engineered feature logic as the main benchmark
- performs 5-fold StratifiedKFold with random_state=42
- trains CatBoost using the artifact's best_parameters and threshold=0.33
- compares Config A, Config B, and Config C
- computes paired fold-wise deltas and uses scipy.stats.ttest_rel for paired p-values
- computes SHAP values for the full feature set on each test fold
- writes outputs to experiments/experiment_2_feature_ablation/results/

Verified configuration definitions from the checked-in code:

- Config A: Standard IBM Features (26)
- Config B: Raw + Regional Features (45)
- Config C: Full 52 Features (+ 7 Ratios)

Verified p-value calculation method from code:

- scipy.stats.ttest_rel(vals_x, vals_y)

Verified summary metrics from the checked-in JSON output:

- B vs A F1-Score delta and p-value are recorded in summary_results.json
- C vs B F1-Score delta and p-value are recorded in summary_results.json
- The repository output includes a p_value for F1, ROC-AUC, and PR-AUC; the exact values are taken from the output files and not re-derived here.

Important note:

- The repository does not contain a second canonical script that reconstructs the exact ablation table from a raw intermediate dataset outside the checked-in results bundle.
- The ablation conclusions are therefore reproducible only through the checked-in script and outputs, not from absent raw search or derivation materials.

## Runtime and environment

The environment used for verification in this session was:

- Python 3.13.7
- pandas 2.3.3
- numpy 2.3.5
- scikit-learn 1.7.2
- scipy 1.16.3
- catboost 1.2.10
- lightgbm 4.7.0
- xgboost 3.4.1
- shap 0.52.0

These versions are the observed environment used to validate the artifact and scripts in the repository. They are not automatically guaranteed to match every future environment.

## Publication-readiness statements and missing items

The following items are explicitly not available in the repository and should be reported as such if required for publication:

- Original Optuna search code: NOT AVAILABLE IN REPOSITORY
- Optuna search space: NOT AVAILABLE IN REPOSITORY
- Trial history: NOT AVAILABLE IN REPOSITORY
- Threshold selection rationale: NOT AVAILABLE IN REPOSITORY
- Dataset provenance and source institution: NOT AVAILABLE IN REPOSITORY
- Data collection protocol: NOT AVAILABLE IN REPOSITORY
- Ethics approval/IRB status: NOT AVAILABLE IN REPOSITORY
- Consent or anonymization details: NOT AVAILABLE IN REPOSITORY
- Versioned preprocessing notebook or script beyond the engineering logic in the checked-in experiment files: NOT AVAILABLE IN REPOSITORY

## Reproducibility status

What is reproducible from the repository:

- Dataset shape and target distribution can be verified from the checked-in CSV.
- The saved CatBoost artifact metadata can be inspected directly from the joblib object.
- The feature-engineering logic matches the published code and can be reproduced.
- The benchmark and ablation scripts are present and executable from the repository structure.
- The outputs in the results directories are present and consistent with the script logic.

What remains unverified from repository evidence alone:

- The original tuning campaign outside the saved artifact metadata.
- The source of the dataset and its acquisition history.
- Ethics and consent statements.
- Any publication-specified preprocessing pipeline or threshold-selection method not represented in the checked-in code.

This repository is therefore publication-ready as a code-and-results archive only to the extent that it faithfully records the scripts, outputs, and artifact metadata present in the repository. It does not claim unavailable provenance or tuning details beyond the explicit repository evidence.
