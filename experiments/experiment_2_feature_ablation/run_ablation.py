"""
Experiment 2: Feature Ablation Study for Attrition Prediction
=============================================================
Goal: Determine whether the 7 engineered attrition interaction ratios
and the Sri Lankan domain features provide statistically meaningful
predictive value to the CatBoost attrition model.

Configurations:
- Configuration A: Standard IBM HR features only.
- Configuration B: 45 raw features (IBM HR + Sri Lankan raw/regional features).
- Configuration C: Full 52 features (Configuration B + 7 engineered interaction ratios).

Algorithm & Hyperparameters:
- Optuna-tuned CatBoost (Ordered boosting, depth=4, lr=0.06166, l2_leaf_reg=12.0218,
  scale_pos_weight=1.3478, iterations=600, threshold=0.33).
- 5-Fold Stratified Cross-Validation (random_state=42).

Outputs:
1. fold_metrics.csv
2. summary_results.json
3. ieee_feature_ablation_table.csv
4. ieee_feature_ablation_table.md
5. feature_importance_ranking.csv
"""

import json
import time
from pathlib import Path
from typing import Any, Dict, List, Tuple

import joblib
import numpy as np
import pandas as pd
import scipy.stats as stats
import shap
from catboost import CatBoostClassifier, Pool
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


# ---------------------------------------------------------
# Paths
# ---------------------------------------------------------
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parents[1]
DATASET_PATH = PROJECT_ROOT / "backend" / "services" / "attrition-model-service" / "Sri_Lankan_Hiring_Attrition_Dataset.csv"
JOBLIB_PATH = PROJECT_ROOT / "backend" / "services" / "attrition-model-service" / "attrition_risk_catboost_v7_optuna.joblib"
OUTPUT_DIR = SCRIPT_DIR / "results"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


# ---------------------------------------------------------
# Feature Definitions
# ---------------------------------------------------------
ENGINEERED_FEATURE_NAMES = [
    "OfferExpectedRatio",
    "AverageSatisfaction",
    "InterviewComponentAverage",
    "MatchInterviewAverage",
    "RoleTenureRatio",
    "ManagerTenureRatio",
    "PromotionDelayRatio",
]

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


def compute_metrics(y_true: np.ndarray, y_prob: np.ndarray, threshold: float = 0.33) -> Dict[str, float]:
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


def run_ablation_study():
    print("=" * 80)
    print("EXPERIMENT 2: ATTRITION FEATURE ABLATION STUDY (5-FOLD STRATIFIED CV)")
    print("=" * 80)

    # 1. Load Data & Joblib Metadata
    artifact = joblib.load(JOBLIB_PATH)
    raw_features_b = artifact.get("features", [])          # 45 raw features
    model_features_c = artifact.get("model_features", [])  # 52 full features
    cat_features_full = artifact.get("categorical_features", [])
    catboost_params = artifact.get("best_parameters", {})
    pos_weight = float(artifact.get("positive_class_weight", 1.347814))
    threshold = float(artifact.get("threshold", 0.33))

    raw_df = pd.read_csv(DATASET_PATH)
    y = raw_df["Attrition"].values
    df_engineered = engineer_features(raw_df)

    # Identify Configuration A features: Standard IBM features in raw_df (excluding non-varying IBM columns)
    # The 26 IBM features used in the project raw features
    sl_raw_features = [
        "MonthlyIncomeLKR", "PreferredWorkLocation", "WorkType", "ExpectedSalaryLKR",
        "OfferedSalaryLKR", "SalaryGapLKR", "SalaryGapPercentage", "MatchScore",
        "JobSimilarityScore", "TechnicalScore", "CommunicationScore", "BehaviourScore",
        "ConfidenceScore", "InterviewScore", "NoticePeriodDays", "TrainingProgramme",
        "MentorshipProgramme", "CareerDevelopmentPlan", "CertificationOpportunity"
    ]
    features_a = [f for f in raw_features_b if f not in sl_raw_features]
    cat_features_a = [f for f in features_a if f in cat_features_full]

    # Configuration B features: 45 raw features
    features_b = list(raw_features_b)
    cat_features_b = list(cat_features_full)

    # Configuration C features: 52 full features
    features_c = list(model_features_c)
    cat_features_c = list(cat_features_full)

    configurations = {
        "Config A: Standard IBM Features (26)": {
            "features": features_a,
            "cat_features": cat_features_a,
            "description": "Standard IBM HR attributes only (no regional compensation or ratios)",
        },
        "Config B: Raw + Regional Features (45)": {
            "features": features_b,
            "cat_features": cat_features_b,
            "description": "IBM HR attributes + Sri Lankan regional hiring & compensation features",
        },
        "Config C: Full 52 Features (+ 7 Ratios)": {
            "features": features_c,
            "cat_features": cat_features_c,
            "description": "Configuration B + 7 Domain-Engineered Interaction Ratios",
        },
    }

    print(f"Dataset Size: {len(raw_df)} instances")
    print(f"Target Distribution: {dict(pd.Series(y).value_counts())}")
    print(f"Features: Config A = {len(features_a)}, Config B = {len(features_b)}, Config C = {len(features_c)}")

    # Model Hyperparameters
    cb_hyperparams = {
        **catboost_params,
        "scale_pos_weight": pos_weight,
        "random_seed": 42,
        "verbose": False,
    }

    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    fold_records: List[Dict[str, Any]] = []
    summary_results: Dict[str, Dict[str, Any]] = {}
    config_fold_metrics: Dict[str, Dict[str, List[float]]] = {cfg: {k: [] for k in ["accuracy", "balanced_accuracy", "precision", "recall", "f1", "roc_auc", "pr_auc"]} for cfg in configurations}

    # Tracking SHAP values for Configuration C
    shap_values_list = []
    shap_test_dfs = []

    # 2. Cross-Validation Execution
    for config_name, cfg in configurations.items():
        print(f"\nRunning 5-Fold CV for: {config_name}...")
        feat_list = cfg["features"]
        cat_list = cfg["cat_features"]

        X_config = df_engineered[feat_list].copy()
        for col in cat_list:
            X_config[col] = X_config[col].fillna("Missing").astype(str)

        train_times = []

        for fold_idx, (train_idx, test_idx) in enumerate(skf.split(X_config, y), start=1):
            X_train, y_train = X_config.iloc[train_idx].copy(), y[train_idx]
            X_test, y_test = X_config.iloc[test_idx].copy(), y[test_idx]

            # Impute numerical missing strictly from training fold
            num_cols = [c for c in feat_list if c not in cat_list]
            for col in num_cols:
                med = pd.to_numeric(X_train[col], errors="coerce").median()
                X_train[col] = pd.to_numeric(X_train[col], errors="coerce").fillna(med)
                X_test[col] = pd.to_numeric(X_test[col], errors="coerce").fillna(med)

            t0 = time.perf_counter()
            model = CatBoostClassifier(cat_features=cat_list, **cb_hyperparams)
            model.fit(X_train, y_train)
            train_times.append(time.perf_counter() - t0)

            y_prob = model.predict_proba(X_test)[:, 1]
            metrics = compute_metrics(y_test, y_prob, threshold=threshold)
            metrics["fold"] = fold_idx
            metrics["configuration"] = config_name
            metrics["feature_count"] = len(feat_list)
            fold_records.append(metrics)

            for k in config_fold_metrics[config_name]:
                config_fold_metrics[config_name][k].append(metrics[k])

            # If Configuration C, compute SHAP values on the holdout test fold
            if config_name == "Config C: Full 52 Features (+ 7 Ratios)":
                explainer = shap.TreeExplainer(model)
                # CatBoost pool for test set
                test_pool = Pool(X_test, cat_features=cat_list)
                fold_shap = explainer.shap_values(test_pool)
                shap_values_list.append(fold_shap)
                shap_test_dfs.append(X_test)

        summary = {
            "configuration": config_name,
            "feature_count": len(feat_list),
            "description": cfg["description"],
            "threshold": threshold,
            "mean_fit_time_sec": float(np.mean(train_times)),
        }
        for k in ["accuracy", "balanced_accuracy", "precision", "recall", "f1", "roc_auc", "pr_auc"]:
            vals = config_fold_metrics[config_name][k]
            summary[f"{k}_mean"] = float(np.mean(vals))
            summary[f"{k}_std"] = float(np.std(vals))

        summary_results[config_name] = summary
        print(f"  Accuracy:          {summary['accuracy_mean']*100:.2f}% ± {summary['accuracy_std']*100:.2f}%")
        print(f"  Balanced Accuracy: {summary['balanced_accuracy_mean']*100:.2f}% ± {summary['balanced_accuracy_std']*100:.2f}%")
        print(f"  Precision:         {summary['precision_mean']*100:.2f}% ± {summary['precision_std']*100:.2f}%")
        print(f"  Recall:            {summary['recall_mean']*100:.2f}% ± {summary['recall_std']*100:.2f}%")
        print(f"  F1-Score:          {summary['f1_mean']*100:.2f}% ± {summary['f1_std']*100:.2f}%")
        print(f"  ROC-AUC:           {summary['roc_auc_mean']:.4f} ± {summary['roc_auc_std']:.4f}")
        print(f"  PR-AUC:            {summary['pr_auc_mean']:.4f} ± {summary['pr_auc_std']:.4f}")

    # 3. Calculate Deltas and Statistical Tests
    metrics_to_test = ["f1", "roc_auc", "pr_auc", "balanced_accuracy", "accuracy", "precision", "recall"]
    deltas_c_vs_b = {}
    deltas_b_vs_a = {}
    p_values_c_vs_b = {}
    p_values_b_vs_a = {}

    for m in metrics_to_test:
        vals_a = np.array(config_fold_metrics["Config A: Standard IBM Features (26)"][m])
        vals_b = np.array(config_fold_metrics["Config B: Raw + Regional Features (45)"][m])
        vals_c = np.array(config_fold_metrics["Config C: Full 52 Features (+ 7 Ratios)"][m])

        # Deltas
        delta_ba = float(np.mean(vals_b - vals_a))
        delta_cb = float(np.mean(vals_c - vals_b))
        deltas_b_vs_a[m] = delta_ba
        deltas_c_vs_b[m] = delta_cb

        # Statistical significance (Paired t-test)
        t_stat_ba, p_val_ba = stats.ttest_rel(vals_b, vals_a)
        t_stat_cb, p_val_cb = stats.ttest_rel(vals_c, vals_b)
        p_values_b_vs_a[m] = float(p_val_ba)
        p_values_c_vs_b[m] = float(p_val_cb)

    # 4. SHAP Feature Importance Analysis for Configuration C
    all_shap = np.concatenate(shap_values_list, axis=0)
    all_test_df = pd.concat(shap_test_dfs, axis=0)

    # Mean absolute SHAP value per feature
    mean_abs_shap = np.mean(np.abs(all_shap), axis=0)
    feature_importance_df = pd.DataFrame({
        "Feature": features_c,
        "Mean_Absolute_SHAP": mean_abs_shap,
        "Is_Engineered_Ratio": [f in ENGINEERED_FEATURE_NAMES for f in features_c],
    }).sort_values(by="Mean_Absolute_SHAP", ascending=False).reset_index(drop=True)
    feature_importance_df["Rank"] = feature_importance_df.index + 1

    feature_importance_df.to_csv(OUTPUT_DIR / "feature_importance_ranking.csv", index=False)

    # 5. Build IEEE Feature Ablation Table
    ieee_ablation_rows = []
    for cfg_name, s in summary_results.items():
        ieee_ablation_rows.append({
            "Configuration": cfg_name,
            "Features": s["feature_count"],
            "Accuracy (%)": f"{s['accuracy_mean']*100:.2f} ± {s['accuracy_std']*100:.2f}",
            "Balanced Acc (%)": f"{s['balanced_accuracy_mean']*100:.2f} ± {s['balanced_accuracy_std']*100:.2f}",
            "Precision (%)": f"{s['precision_mean']*100:.2f} ± {s['precision_std']*100:.2f}",
            "Recall (%)": f"{s['recall_mean']*100:.2f} ± {s['recall_std']*100:.2f}",
            "F1-Score (%)": f"{s['f1_mean']*100:.2f} ± {s['f1_std']*100:.2f}",
            "ROC-AUC": f"{s['roc_auc_mean']:.4f} ± {s['roc_auc_std']:.4f}",
            "PR-AUC": f"{s['pr_auc_mean']:.4f} ± {s['pr_auc_std']:.4f}",
        })

    # Add Delta Rows
    ieee_ablation_rows.append({
        "Configuration": "Delta: (B - A) [Regional Features Uplift]",
        "Features": "+19",
        "Accuracy (%)": f"{deltas_b_vs_a['accuracy']*100:+.2f}%",
        "Balanced Acc (%)": f"{deltas_b_vs_a['balanced_accuracy']*100:+.2f}%",
        "Precision (%)": f"{deltas_b_vs_a['precision']*100:+.2f}%",
        "Recall (%)": f"{deltas_b_vs_a['recall']*100:+.2f}%",
        "F1-Score (%)": f"{deltas_b_vs_a['f1']*100:+.2f}% (p={p_values_b_vs_a['f1']:.3f})",
        "ROC-AUC": f"{deltas_b_vs_a['roc_auc']:+.4f} (p={p_values_b_vs_a['roc_auc']:.3f})",
        "PR-AUC": f"{deltas_b_vs_a['pr_auc']:+.4f} (p={p_values_b_vs_a['pr_auc']:.3f})",
    })

    ieee_ablation_rows.append({
        "Configuration": "Delta: (C - B) [7 Engineered Ratios Uplift]",
        "Features": "+7",
        "Accuracy (%)": f"{deltas_c_vs_b['accuracy']*100:+.2f}%",
        "Balanced Acc (%)": f"{deltas_c_vs_b['balanced_accuracy']*100:+.2f}%",
        "Precision (%)": f"{deltas_c_vs_b['precision']*100:+.2f}%",
        "Recall (%)": f"{deltas_c_vs_b['recall']*100:+.2f}%",
        "F1-Score (%)": f"{deltas_c_vs_b['f1']*100:+.2f}% (p={p_values_c_vs_b['f1']:.3f})",
        "ROC-AUC": f"{deltas_c_vs_b['roc_auc']:+.4f} (p={p_values_c_vs_b['roc_auc']:.3f})",
        "PR-AUC": f"{deltas_c_vs_b['pr_auc']:+.4f} (p={p_values_c_vs_b['pr_auc']:.3f})",
    })

    ieee_df = pd.DataFrame(ieee_ablation_rows)
    ieee_df.to_csv(OUTPUT_DIR / "ieee_feature_ablation_table.csv", index=False)

    md_table = ieee_df.to_markdown(index=False)
    with open(OUTPUT_DIR / "ieee_feature_ablation_table.md", "w", encoding="utf-8") as f:
        f.write("# IEEE Feature Ablation Table: Impact of Regional and Engineered Interaction Ratios\n\n")
        f.write(md_table)
        f.write("\n\n## Top 15 Features by Mean Absolute SHAP\n\n")
        f.write(feature_importance_df.head(15).to_markdown(index=False))
        f.write("\n")

    # 6. Save JSON Summary & Fold Metrics
    pd.DataFrame(fold_records).to_csv(OUTPUT_DIR / "fold_metrics.csv", index=False)

    full_summary = {
        "summary_results": summary_results,
        "deltas_c_vs_b": deltas_c_vs_b,
        "deltas_b_vs_a": deltas_b_vs_a,
        "p_values_c_vs_b": p_values_c_vs_b,
        "p_values_b_vs_a": p_values_b_vs_a,
        "top_engineered_features": feature_importance_df[feature_importance_df["Is_Engineered_Ratio"]].to_dict(orient="records"),
    }
    with open(OUTPUT_DIR / "summary_results.json", "w", encoding="utf-8") as f:
        json.dump(full_summary, f, indent=2)

    print("\n" + "=" * 80)
    print("EXPERIMENT 2 COMPLETE. Output files saved to:")
    print(f" - {OUTPUT_DIR / 'fold_metrics.csv'}")
    print(f" - {OUTPUT_DIR / 'summary_results.json'}")
    print(f" - {OUTPUT_DIR / 'ieee_feature_ablation_table.csv'}")
    print(f" - {OUTPUT_DIR / 'ieee_feature_ablation_table.md'}")
    print(f" - {OUTPUT_DIR / 'feature_importance_ranking.csv'}")
    print("=" * 80)
    print("\n" + md_table)
    print("\nTop 10 Features by SHAP Importance:")
    print(feature_importance_df.head(10)[["Rank", "Feature", "Mean_Absolute_SHAP", "Is_Engineered_Ratio"]].to_string(index=False))


if __name__ == "__main__":
    run_ablation_study()
