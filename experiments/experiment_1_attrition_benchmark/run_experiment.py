"""
Experiment 1: Tabular Baseline Benchmark for Attrition Prediction
==================================================================
Evaluates the project's Optuna-tuned CatBoost model against standard tabular baselines
using identical 5-fold Stratified Cross-Validation on Sri_Lankan_Hiring_Attrition_Dataset.csv.

Models Evaluated:
1. Optuna-Tuned CatBoost (Project Model, threshold=0.33 and threshold=0.50)
2. Default CatBoost (threshold=0.50)
3. XGBoost (threshold=0.50)
4. LightGBM (threshold=0.50)
5. Random Forest (threshold=0.50)
6. Logistic Regression with ElasticNet (threshold=0.50)

Metrics:
- Accuracy
- Balanced Accuracy
- Precision
- Recall
- F1-Score
- ROC-AUC
- PR-AUC
- Training & Inference Time (seconds)
"""

import json
import time
from pathlib import Path
from typing import Any, Dict, List, Tuple

import joblib
import numpy as np
import pandas as pd
from catboost import CatBoostClassifier
from lightgbm import LGBMClassifier
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    balanced_accuracy_score,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import StratifiedKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from xgboost import XGBClassifier


# ---------------------------------------------------------
# Paths & Metadata
# ---------------------------------------------------------
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parents[1]
DATASET_PATH = PROJECT_ROOT / "backend" / "services" / "attrition-model-service" / "Sri_Lankan_Hiring_Attrition_Dataset.csv"
JOBLIB_PATH = PROJECT_ROOT / "backend" / "services" / "attrition-model-service" / "attrition_risk_catboost_v7_optuna.joblib"
OUTPUT_DIR = SCRIPT_DIR / "results"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


# ---------------------------------------------------------
# Feature Engineering (Replicating Project feature_adapter.py)
# ---------------------------------------------------------
def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Computes the 7 domain-specific interaction features as defined in the project."""
    data = df.copy()

    def num(col: str) -> pd.Series:
        return pd.to_numeric(data.get(col, pd.Series(0, index=data.index)), errors="coerce").fillna(0)

    expected = num("ExpectedSalaryLKR")
    offered = num("OfferedSalaryLKR")
    data["OfferExpectedRatio"] = np.where(expected != 0, offered / expected, 0)
    data["AverageSatisfaction"] = data[[
        "EnvironmentSatisfaction", "JobSatisfaction", "RelationshipSatisfaction", "WorkLifeBalance"
    ]].apply(pd.to_numeric, errors="coerce").mean(axis=1)
    data["InterviewComponentAverage"] = data[[
        "TechnicalScore", "CommunicationScore", "BehaviourScore", "ConfidenceScore"
    ]].apply(pd.to_numeric, errors="coerce").mean(axis=1)
    data["MatchInterviewAverage"] = (num("MatchScore") + num("InterviewScore")) / 2.0
    years = num("YearsAtCompany") + 1.0
    data["RoleTenureRatio"] = num("YearsInCurrentRole") / years
    data["ManagerTenureRatio"] = num("YearsWithCurrManager") / years
    data["PromotionDelayRatio"] = num("YearsSinceLastPromotion") / years

    return data


# ---------------------------------------------------------
# Load Project Artifact Metadata
# ---------------------------------------------------------
def load_project_metadata() -> Tuple[List[str], List[str], List[str], List[str], Dict[str, Any], float, float]:
    artifact = joblib.load(JOBLIB_PATH)
    raw_features = artifact.get("features", [])
    model_features = artifact.get("model_features", [])
    categorical_features = artifact.get("categorical_features", [])
    numerical_features = artifact.get("numerical_features", [])
    best_params = artifact.get("best_parameters", {})
    pos_weight = float(artifact.get("positive_class_weight", 1.347814))
    threshold = float(artifact.get("threshold", 0.33))
    return raw_features, model_features, categorical_features, numerical_features, best_params, pos_weight, threshold


# ---------------------------------------------------------
# Evaluation Helper
# ---------------------------------------------------------
def compute_metrics(y_true: np.ndarray, y_prob: np.ndarray, threshold: float = 0.5) -> Dict[str, float]:
    y_pred = (y_prob >= threshold).astype(int)
    return {
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "balanced_accuracy": float(balanced_accuracy_score(y_true, y_pred)),
        "precision": float(precision_score(y_true, y_pred, zero_division=0)),
        "recall": float(recall_score(y_true, y_pred, zero_division=0)),
        "f1": float(f1_score(y_true, y_pred, zero_division=0)),
        "roc_auc": float(roc_auc_score(y_true, y_prob)),
        "pr_auc": float(average_precision_score(y_true, y_prob)),
    }


# ---------------------------------------------------------
# Main Cross-Validation Routine
# ---------------------------------------------------------
def run_benchmark():
    print("=" * 80)
    print("EXPERIMENT 1: ATTRITION MODEL BENCHMARK (5-FOLD STRATIFIED CV)")
    print("=" * 80)

    # 1. Load Data & Metadata
    raw_features, model_features, cat_features, num_features, catboost_params, pos_weight, proj_threshold = load_project_metadata()
    raw_df = pd.read_csv(DATASET_PATH)
    print(f"Loaded dataset: {DATASET_PATH.name} with shape {raw_df.shape}")
    print(f"Target distribution: {dict(raw_df['Attrition'].value_counts())}")

    # 2. Engineer features
    df = engineer_features(raw_df)
    X = df[model_features].copy()
    y = raw_df["Attrition"].values

    # Clean categorical missing representations
    for col in cat_features:
        X[col] = X[col].fillna("Missing").astype(str)

    # 3. Setup Stratified 5-Fold Split
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    # Data structures to hold results
    fold_records: List[Dict[str, Any]] = []
    summary_results: Dict[str, Dict[str, Any]] = {}

    # Define Models to Benchmark
    model_configs = {
        "Optuna CatBoost (Threshold=0.33)": {
            "type": "catboost_optuna",
            "threshold": proj_threshold,
            "params": {
                **catboost_params,
                "scale_pos_weight": pos_weight,
                "random_seed": 42,
                "verbose": False,
            }
        },
        "Optuna CatBoost (Threshold=0.50)": {
            "type": "catboost_optuna",
            "threshold": 0.50,
            "params": {
                **catboost_params,
                "scale_pos_weight": pos_weight,
                "random_seed": 42,
                "verbose": False,
            }
        },
        "Default CatBoost": {
            "type": "catboost_default",
            "threshold": 0.50,
            "params": {
                "iterations": 500,
                "random_seed": 42,
                "verbose": False,
            }
        },
        "XGBoost": {
            "type": "sklearn_tree",
            "threshold": 0.50,
            "model_cls": XGBClassifier,
            "model_kwargs": {
                "n_estimators": 500,
                "max_depth": 4,
                "learning_rate": 0.05,
                "random_state": 42,
                "eval_metric": "logloss",
            }
        },
        "LightGBM": {
            "type": "sklearn_tree",
            "threshold": 0.50,
            "model_cls": LGBMClassifier,
            "model_kwargs": {
                "n_estimators": 500,
                "max_depth": 4,
                "num_leaves": 15,
                "learning_rate": 0.05,
                "random_state": 42,
                "verbose": -1,
            }
        },
        "Random Forest": {
            "type": "sklearn_tree",
            "threshold": 0.50,
            "model_cls": RandomForestClassifier,
            "model_kwargs": {
                "n_estimators": 500,
                "max_depth": 10,
                "random_state": 42,
            }
        },
        "Logistic Regression (ElasticNet)": {
            "type": "sklearn_linear",
            "threshold": 0.50,
            "model_cls": LogisticRegression,
            "model_kwargs": {
                "penalty": "elasticnet",
                "solver": "saga",
                "l1_ratio": 0.5,
                "C": 0.1,
                "max_iter": 3000,
                "random_state": 42,
            }
        }
    }

    # Preprocessing pipelines for non-CatBoost models (to prevent data leakage)
    tree_preprocessor = ColumnTransformer(
        transformers=[
            ("num", SimpleImputer(strategy="median"), num_features),
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), cat_features),
        ]
    )

    linear_preprocessor = ColumnTransformer(
        transformers=[
            ("num", Pipeline([("imp", SimpleImputer(strategy="median")), ("scale", StandardScaler())]), num_features),
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), cat_features),
        ]
    )

    # 4. Run Cross-Validation for Each Model
    for model_name, cfg in model_configs.items():
        print(f"\nEvaluating: {model_name}...")
        fold_metrics: List[Dict[str, float]] = []
        train_times: List[float] = []
        inference_times: List[float] = []

        for fold_idx, (train_idx, test_idx) in enumerate(skf.split(X, y), start=1):
            X_train, y_train = X.iloc[train_idx].copy(), y[train_idx]
            X_test, y_test = X.iloc[test_idx].copy(), y[test_idx]

            t_start = time.perf_counter()

            if cfg["type"].startswith("catboost"):
                # Handle median imputation on numerical features strictly from train fold
                for col in num_features:
                    med = pd.to_numeric(X_train[col], errors="coerce").median()
                    X_train[col] = pd.to_numeric(X_train[col], errors="coerce").fillna(med)
                    X_test[col] = pd.to_numeric(X_test[col], errors="coerce").fillna(med)

                model = CatBoostClassifier(cat_features=cat_features, **cfg["params"])
                model.fit(X_train, y_train)
                t_fit = time.perf_counter()

                y_prob = model.predict_proba(X_test)[:, 1]
                t_infer = time.perf_counter()

            elif cfg["type"] == "sklearn_tree":
                X_train_trans = tree_preprocessor.fit_transform(X_train)
                model = cfg["model_cls"](**cfg["model_kwargs"])
                model.fit(X_train_trans, y_train)
                t_fit = time.perf_counter()

                X_test_trans = tree_preprocessor.transform(X_test)
                y_prob = model.predict_proba(X_test_trans)[:, 1]
                t_infer = time.perf_counter()

            elif cfg["type"] == "sklearn_linear":
                X_train_trans = linear_preprocessor.fit_transform(X_train)
                model = cfg["model_cls"](**cfg["model_kwargs"])
                model.fit(X_train_trans, y_train)
                t_fit = time.perf_counter()

                X_test_trans = linear_preprocessor.transform(X_test)
                y_prob = model.predict_proba(X_test_trans)[:, 1]
                t_infer = time.perf_counter()

            train_time = t_fit - t_start
            infer_time = t_infer - t_fit
            train_times.append(train_time)
            inference_times.append(infer_time)

            metrics = compute_metrics(y_test, y_prob, threshold=cfg["threshold"])
            metrics["fold"] = fold_idx
            metrics["model"] = model_name
            metrics["train_time_sec"] = train_time
            metrics["infer_time_sec"] = infer_time
            fold_records.append(metrics)
            fold_metrics.append(metrics)

        # Aggregate across 5 folds
        keys = ["accuracy", "balanced_accuracy", "precision", "recall", "f1", "roc_auc", "pr_auc"]
        summary = {
            "model": model_name,
            "threshold": cfg["threshold"],
            "mean_train_time_sec": float(np.mean(train_times)),
            "mean_infer_time_sec": float(np.mean(inference_times)),
        }
        for k in keys:
            vals = [m[k] for m in fold_metrics]
            summary[f"{k}_mean"] = float(np.mean(vals))
            summary[f"{k}_std"] = float(np.std(vals))

        summary_results[model_name] = summary

        print(f"  Accuracy:          {summary['accuracy_mean']*100:.2f}% ± {summary['accuracy_std']*100:.2f}%")
        print(f"  Balanced Accuracy: {summary['balanced_accuracy_mean']*100:.2f}% ± {summary['balanced_accuracy_std']*100:.2f}%")
        print(f"  Precision:         {summary['precision_mean']*100:.2f}% ± {summary['precision_std']*100:.2f}%")
        print(f"  Recall:            {summary['recall_mean']*100:.2f}% ± {summary['recall_std']*100:.2f}%")
        print(f"  F1-Score:          {summary['f1_mean']*100:.2f}% ± {summary['f1_std']*100:.2f}%")
        print(f"  ROC-AUC:           {summary['roc_auc_mean']:.4f} ± {summary['roc_auc_std']:.4f}")
        print(f"  PR-AUC:            {summary['pr_auc_mean']:.4f} ± {summary['pr_auc_std']:.4f}")

    # 5. Save Artifacts
    fold_df = pd.DataFrame(fold_records)
    fold_df.to_csv(OUTPUT_DIR / "fold_metrics.csv", index=False)

    with open(OUTPUT_DIR / "summary_results.json", "w", encoding="utf-8") as f:
        json.dump(summary_results, f, indent=2)

    # 6. Generate IEEE Markdown & CSV Table
    ieee_rows = []
    for model_name, s in summary_results.items():
        ieee_rows.append({
            "Model / Algorithm": model_name,
            "Decision Threshold": s["threshold"],
            "Accuracy (%)": f"{s['accuracy_mean']*100:.2f} ± {s['accuracy_std']*100:.2f}",
            "Balanced Acc (%)": f"{s['balanced_accuracy_mean']*100:.2f} ± {s['balanced_accuracy_std']*100:.2f}",
            "Precision (%)": f"{s['precision_mean']*100:.2f} ± {s['precision_std']*100:.2f}",
            "Recall (%)": f"{s['recall_mean']*100:.2f} ± {s['recall_std']*100:.2f}",
            "F1-Score (%)": f"{s['f1_mean']*100:.2f} ± {s['f1_std']*100:.2f}",
            "ROC-AUC": f"{s['roc_auc_mean']:.4f} ± {s['roc_auc_std']:.4f}",
            "PR-AUC": f"{s['pr_auc_mean']:.4f} ± {s['pr_auc_std']:.4f}",
            "Fit Time (s)": f"{s['mean_train_time_sec']:.2f}",
        })

    ieee_table_df = pd.DataFrame(ieee_rows)
    ieee_table_df.to_csv(OUTPUT_DIR / "ieee_comparison_table.csv", index=False)

    md_table = ieee_table_df.to_markdown(index=False)
    with open(OUTPUT_DIR / "ieee_comparison_table.md", "w", encoding="utf-8") as f:
        f.write("# IEEE Table: Tabular Attrition Benchmark Comparison\n\n")
        f.write(md_table)
        f.write("\n")

    print("\n" + "=" * 80)
    print("EXPERIMENT 1 COMPLETE. Results successfully saved to:")
    print(f" - {OUTPUT_DIR / 'fold_metrics.csv'}")
    print(f" - {OUTPUT_DIR / 'summary_results.json'}")
    print(f" - {OUTPUT_DIR / 'ieee_comparison_table.csv'}")
    print(f" - {OUTPUT_DIR / 'ieee_comparison_table.md'}")
    print("=" * 80)
    print("\n" + md_table)


if __name__ == "__main__":
    run_benchmark()
