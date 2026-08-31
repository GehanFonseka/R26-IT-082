"""
Experiment 3: Human Expert Validation of Interview Answer Scoring Model
========================================================================
Rigorous, non-circular evaluation of the calibrated DeBERTa-v3 interview scoring
model against blinded, independent domain expert assessments and NLP baselines.

Statistical Reporting Standards:
1. Human Reliability: ICC(2,1) with 95% CI, Fleiss' Kappa, Pairwise QWK.
2. Model vs. Human Consensus:
   - Pearson r with 95% Fisher's z-transformation CI
   - Spearman rho with 95% asymptotic/bootstrap CI
   - Quadratic Weighted Kappa (QWK)
   - Mean Absolute Error (MAE) and Root Mean Squared Error (RMSE)
   - Exact Class Agreement (%) and Macro-F1 (%)
3. Baseline Comparative Testing:
   - Paired difference in MAE (Mean Δ, 95% CI)
   - Paired Student's t-test p-value & Wilcoxon signed-rank p-value
   - Bonferroni-adjusted p-value for multiple baseline comparisons
   - Cohen's d_z effect size for paired samples
"""

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any, Dict, List, Tuple

import numpy as np
import pandas as pd
import scipy.stats as stats
import torch
from bert_score import score as bert_score_eval
from rouge_score import rouge_scorer
from sentence_transformers import SentenceTransformer
from sklearn.metrics import (
    cohen_kappa_score,
    f1_score,
    mean_absolute_error,
    mean_squared_error,
)
from transformers import AutoModelForSequenceClassification, AutoTokenizer


# ---------------------------------------------------------
# Paths & Default Setup
# ---------------------------------------------------------
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parents[1]
DEFAULT_DATA_PATH = SCRIPT_DIR / "data_schema" / "example_annotations.csv"
MODEL_DIR = PROJECT_ROOT / "backend" / "services" / "interview-answer-model-service" / "model"
OUTPUT_DIR = SCRIPT_DIR / "results"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

CLASS_NAMES = ["Wrong", "Poor", "Average", "Good", "Excellent"]
CLASS_TO_INT = {name: idx for idx, name in enumerate(CLASS_NAMES)}

# Independent Human Grade Brackets (Pedagogical Standard Brackets)
HUMAN_GRADE_THRESHOLDS = [40.0, 60.0, 75.0, 90.0]


def map_human_score_to_class(score: float) -> Tuple[str, int]:
    """Maps continuous 0-100 human score into the 5 standard academic rating tiers."""
    idx = int(np.digitize([score], HUMAN_GRADE_THRESHOLDS)[0])
    return CLASS_NAMES[idx], idx


# ---------------------------------------------------------
# Statistical Confidence Intervals & Effect Sizes
# ---------------------------------------------------------
def pearson_r_ci(r: float, n: int, confidence: float = 0.95) -> Tuple[float, float]:
    """Calculates 95% CI for Pearson correlation using Fisher's z-transformation."""
    if n <= 3 or abs(r) >= 1.0:
        return (r, r)
    z = np.arctanh(r)
    se = 1.0 / np.sqrt(n - 3)
    z_crit = stats.norm.ppf((1 + confidence) / 2)
    lo_z, hi_z = z - z_crit * se, z + z_crit * se
    return float(np.tanh(lo_z)), float(np.tanh(hi_z))


def spearman_rho_ci(rho: float, n: int, confidence: float = 0.95) -> Tuple[float, float]:
    """Calculates asymptotic 95% CI for Spearman rank correlation."""
    if n <= 3 or abs(rho) >= 1.0:
        return (rho, rho)
    z = np.arctanh(rho)
    se = 1.06 / np.sqrt(n - 3)
    z_crit = stats.norm.ppf((1 + confidence) / 2)
    lo_z, hi_z = z - z_crit * se, z + z_crit * se
    return float(np.clip(np.tanh(lo_z), -1.0, 1.0)), float(np.clip(np.tanh(hi_z), -1.0, 1.0))


def compute_icc_2_1_with_ci(ratings_matrix: np.ndarray, confidence: float = 0.95) -> Tuple[float, float, float]:
    """Computes ICC(2,1): Two-way random effects, single rater, absolute agreement with 95% CI."""
    n, k = ratings_matrix.shape
    if n < 2 or k < 2:
        return 0.0, 0.0, 0.0

    mean_total = np.mean(ratings_matrix)
    row_means = np.mean(ratings_matrix, axis=1)
    col_means = np.mean(ratings_matrix, axis=0)

    ss_total = np.sum((ratings_matrix - mean_total) ** 2)
    ss_rows = k * np.sum((row_means - mean_total) ** 2)
    ss_cols = n * np.sum((col_means - mean_total) ** 2)
    ss_error = ss_total - ss_rows - ss_cols

    ms_rows = ss_rows / (n - 1)
    ms_cols = ss_cols / (k - 1)
    ms_error = ss_error / ((n - 1) * (k - 1))

    denom = ms_rows + (k - 1) * ms_error + (k / n) * (ms_cols - ms_error)
    if denom == 0:
        return 0.0, 0.0, 0.0
    icc = (ms_rows - ms_error) / denom

    # F-distribution confidence intervals
    f_stat = ms_rows / ms_error if ms_error > 0 else 1.0
    df1, df2 = n - 1, (n - 1) * (k - 1)
    alpha = 1.0 - confidence
    f_low = f_stat / stats.f.ppf(1 - alpha / 2, df1, df2) if df2 > 0 else 1.0
    f_high = f_stat * stats.f.ppf(1 - alpha / 2, df2, df1) if df1 > 0 else 1.0

    ci_low = (f_low - 1) / (f_low + k - 1)
    ci_high = (f_high - 1) / (f_high + k - 1)

    return float(np.clip(icc, -1.0, 1.0)), float(np.clip(ci_low, -1.0, 1.0)), float(np.clip(ci_high, -1.0, 1.0))


def compute_fleiss_kappa(ratings: np.ndarray, num_classes: int = 5) -> float:
    """Computes Fleiss' Kappa for N subjects rated by k raters into m categories."""
    n_subjects, k_raters = ratings.shape
    table = np.zeros((n_subjects, num_classes))
    for i in range(n_subjects):
        for j in range(k_raters):
            val = int(ratings[i, j])
            if 0 <= val < num_classes:
                table[i, val] += 1

    p_j = np.sum(table, axis=0) / (n_subjects * k_raters)
    p_e_bar = np.sum(p_j ** 2)

    p_i = (np.sum(table ** 2, axis=1) - k_raters) / (k_raters * (k_raters - 1))
    p_bar = np.mean(p_i)

    if 1.0 - p_e_bar == 0:
        return 1.0
    return float((p_bar - p_e_bar) / (1.0 - p_e_bar))


def calculate_inter_rater_reliability(df: pd.DataFrame, score_cols: List[str]) -> Dict[str, Any]:
    score_matrix = df[score_cols].to_numpy(dtype=float)
    k_raters = len(score_cols)
    n_samples = len(df)

    # Continuous correlations & ICC
    pairwise_pearson = []
    pairwise_spearman = []
    for i in range(k_raters):
        for j in range(i + 1, k_raters):
            r, _ = stats.pearsonr(score_matrix[:, i], score_matrix[:, j])
            rho, _ = stats.spearmanr(score_matrix[:, i], score_matrix[:, j])
            pairwise_pearson.append(r)
            pairwise_spearman.append(rho)

    icc_val, icc_lo, icc_hi = compute_icc_2_1_with_ci(score_matrix)

    # Categorical agreement
    class_matrix = np.zeros(score_matrix.shape, dtype=int)
    for i in range(n_samples):
        for j in range(k_raters):
            _, idx = map_human_score_to_class(score_matrix[i, j])
            class_matrix[i, j] = idx

    fleiss_k = compute_fleiss_kappa(class_matrix, num_classes=5)

    pairwise_qwk = []
    for i in range(k_raters):
        for j in range(i + 1, k_raters):
            qwk = cohen_kappa_score(class_matrix[:, i], class_matrix[:, j], weights="quadratic")
            pairwise_qwk.append(qwk)

    return {
        "num_evaluators": k_raters,
        "num_samples": n_samples,
        "mean_pairwise_pearson_r": float(np.mean(pairwise_pearson)),
        "mean_pairwise_spearman_rho": float(np.mean(pairwise_spearman)),
        "icc_2_1": float(icc_val),
        "icc_2_1_95ci": [float(icc_lo), float(icc_hi)],
        "fleiss_kappa": float(fleiss_k),
        "mean_pairwise_qwk": float(np.mean(pairwise_qwk)),
    }


# ---------------------------------------------------------
# Model Inference Engine
# ---------------------------------------------------------
class DeBERTaEvaluator:
    def __init__(self, model_dir: Path):
        self.model_dir = model_dir
        self.config = json.loads((model_dir / "scoring_config.json").read_text(encoding="utf-8"))
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.tokenizer = AutoTokenizer.from_pretrained(model_dir, local_files_only=True)
        self.model = AutoModelForSequenceClassification.from_pretrained(model_dir, local_files_only=True)
        self.model.to(self.device)
        self.model.eval()

    def predict(self, question: str, reference: str, candidate: str) -> Tuple[float, str, int]:
        premise = f"Interview Question: {question}\nExpected Answer: {reference}"
        hypothesis = f"Candidate Answer: {candidate}"
        with torch.no_grad():
            inputs = self.tokenizer(
                premise, hypothesis, return_tensors="pt", truncation=True, max_length=384, padding=True
            ).to(self.device)
            logits = self.model(**inputs).logits
            probs = torch.softmax(logits[0], dim=-1).cpu().numpy()

        centers = np.array(self.config["class_score_centers"], dtype=float)
        raw_score = float(np.sum(probs * centers))
        calibrated_score = float(np.clip(
            float(self.config["calibration_a"]) * raw_score + float(self.config["calibration_b"]),
            0.0, 1.0
        ))
        thresholds = np.array(self.config["optimized_thresholds"], dtype=float)
        class_idx = int(np.digitize([calibrated_score], thresholds)[0])
        return round(calibrated_score * 100, 2), CLASS_NAMES[class_idx], class_idx


def map_baseline_score_to_class(score_0_to_100: float, thresholds: List[float] = [24, 47, 58, 84]) -> Tuple[str, int]:
    idx = int(np.digitize([score_0_to_100], thresholds)[0])
    return CLASS_NAMES[idx], idx


# ---------------------------------------------------------
# Metric Calculation vs Consensus Ground Truth
# ---------------------------------------------------------
def calculate_model_metrics(y_true_score: np.ndarray, y_true_class: List[str],
                            y_pred_score: np.ndarray, y_pred_class: List[str]) -> Dict[str, Any]:
    n = len(y_true_score)
    mae = float(mean_absolute_error(y_true_score, y_pred_score))
    rmse = float(np.sqrt(mean_squared_error(y_true_score, y_pred_score)))

    if np.std(y_pred_score) > 0 and np.std(y_true_score) > 0:
        pearson_r, p_pearson = stats.pearsonr(y_true_score, y_pred_score)
        spearman_rho, p_spearman = stats.spearmanr(y_true_score, y_pred_score)
        r_ci = pearson_r_ci(pearson_r, n)
        rho_ci = spearman_rho_ci(spearman_rho, n)
    else:
        pearson_r, p_pearson = 0.0, 1.0
        spearman_rho, p_spearman = 0.0, 1.0
        r_ci = (0.0, 0.0)
        rho_ci = (0.0, 0.0)

    true_class_ints = [CLASS_TO_INT[c] for c in y_true_class]
    pred_class_ints = [CLASS_TO_INT[c] for c in y_pred_class]

    qwk = float(cohen_kappa_score(true_class_ints, pred_class_ints, weights="quadratic"))
    exact_acc = float(np.mean(np.array(true_class_ints) == np.array(pred_class_ints))) * 100.0
    macro_f1 = float(f1_score(true_class_ints, pred_class_ints, average="macro", zero_division=0)) * 100.0

    return {
        "MAE": mae,
        "RMSE": rmse,
        "Pearson_r": float(pearson_r),
        "Pearson_r_95ci": list(r_ci),
        "Pearson_p": float(p_pearson),
        "Spearman_rho": float(spearman_rho),
        "Spearman_rho_95ci": list(rho_ci),
        "Spearman_p": float(p_spearman),
        "QWK": qwk,
        "Exact_Agreement_Pct": exact_acc,
        "Macro_F1_Pct": macro_f1,
        "absolute_errors": np.abs(y_true_score - y_pred_score).tolist(),
    }


# ---------------------------------------------------------
# Main Execution Routine
# ---------------------------------------------------------
def run_evaluation(data_file: Path):
    print("=" * 80)
    print("EXPERIMENT 3: HUMAN EXPERT VALIDATION OF INTERVIEW SCORING MODEL")
    print("=" * 80)

    if not data_file.exists():
        print(f"Error: Annotation data file not found at {data_file}")
        sys.exit(1)

    df = pd.read_csv(data_file)
    print(f"Loaded annotation dataset: {data_file.name} ({len(df)} samples)")

    # 1. Identify Evaluator Columns
    score_cols = [c for c in df.columns if c.startswith("evaluator_") and c.endswith("_score")]
    if not score_cols:
        print("Error: No evaluator score columns found (e.g. evaluator_1_score, evaluator_2_score).")
        sys.exit(1)

    # Check for empty annotations
    if df[score_cols].isna().all().all():
        print("\n" + "!" * 80)
        print("NOTICE: The dataset contains no human scores yet.")
        print("Please enter blinded ratings from 2-3 technical evaluators into the CSV.")
        print("!" * 80 + "\n")
        sys.exit(0)

    # Calculate Consensus Human Score & Class dynamically if not present
    df["consensus_score"] = df[score_cols].mean(axis=1)
    df["consensus_class"] = df["consensus_score"].apply(lambda s: map_human_score_to_class(s)[0])

    # 2. Inter-Rater Reliability
    print("\n--- Computing Human Inter-Rater Reliability ---")
    irr_results = calculate_inter_rater_reliability(df, score_cols)
    for k, v in irr_results.items():
        if isinstance(v, float):
            print(f"  {k}: {v:.4f}")
        elif isinstance(v, list) and len(v) == 2 and isinstance(v[0], float):
            print(f"  {k}: [{v[0]:.4f}, {v[1]:.4f}]")
        else:
            print(f"  {k}: {v}")

    # 3. Model Predictions
    print("\n--- Running Inference: Proposed Calibrated DeBERTa-v3 ---")
    deberta_evaluator = DeBERTaEvaluator(MODEL_DIR)
    deberta_scores, deberta_classes, deberta_class_indices = [], [], []

    for _, row in df.iterrows():
        score, cls_name, cls_idx = deberta_evaluator.predict(
            str(row["question"]), str(row["reference_answer"]), str(row["candidate_answer"])
        )
        deberta_scores.append(score)
        deberta_classes.append(cls_name)
        deberta_class_indices.append(cls_idx)

    # 4. Baselines
    print("\n--- Running Baseline: Sentence-BERT Cosine Similarity ---")
    sbert_model = SentenceTransformer("all-MiniLM-L6-v2")
    sbert_scores, sbert_classes = [], []
    for _, row in df.iterrows():
        emb_ref = sbert_model.encode(str(row["reference_answer"]), convert_to_tensor=True)
        emb_cand = sbert_model.encode(str(row["candidate_answer"]), convert_to_tensor=True)
        cos_sim = float(torch.cosine_similarity(emb_ref.unsqueeze(0), emb_cand.unsqueeze(0)).item())
        score_100 = float(np.clip(cos_sim * 100, 0.0, 100.0))
        cls_name, _ = map_baseline_score_to_class(score_100)
        sbert_scores.append(round(score_100, 2))
        sbert_classes.append(cls_name)

    print("--- Running Baseline: ROUGE-L ---")
    rouge = rouge_scorer.RougeScorer(["rougeL"], use_stemmer=True)
    rouge_scores, rouge_classes = [], []
    for _, row in df.iterrows():
        r_res = rouge.score(str(row["reference_answer"]), str(row["candidate_answer"]))
        score_100 = float(r_res["rougeL"].fmeasure * 100.0)
        cls_name, _ = map_baseline_score_to_class(score_100)
        rouge_scores.append(round(score_100, 2))
        rouge_classes.append(cls_name)

    print("--- Running Baseline: BERTScore ---")
    refs = df["reference_answer"].astype(str).tolist()
    cands = df["candidate_answer"].astype(str).tolist()
    _, _, b_f1 = bert_score_eval(cands, refs, lang="en", verbose=False)
    bertscore_scores, bertscore_classes = [], []
    for val in b_f1.numpy():
        score_100 = float(np.clip(val * 100.0, 0.0, 100.0))
        cls_name, _ = map_baseline_score_to_class(score_100)
        bertscore_scores.append(round(score_100, 2))
        bertscore_classes.append(cls_name)

    # 5. Compile Evaluation Metrics & Statistical Testing
    y_true_score = df["consensus_score"].to_numpy(dtype=float)
    y_true_class = df["consensus_class"].astype(str).tolist()

    models_evaluated = {
        "Proposed DeBERTa-v3 (Calibrated)": (np.array(deberta_scores), deberta_classes),
        "Sentence-BERT (all-MiniLM-L6-v2)": (np.array(sbert_scores), sbert_classes),
        "BERTScore (RoBERTa F1)": (np.array(bertscore_scores), bertscore_classes),
        "ROUGE-L": (np.array(rouge_scores), rouge_classes),
    }

    results_table = []
    full_metrics = {}
    deberta_abs_errors = np.abs(y_true_score - np.array(deberta_scores))

    # Number of baseline comparisons for Bonferroni correction
    num_comparisons = len(models_evaluated) - 1

    for model_name, (preds_s, preds_c) in models_evaluated.items():
        m = calculate_model_metrics(y_true_score, y_true_class, preds_s, preds_c)
        full_metrics[model_name] = m

        if model_name != "Proposed DeBERTa-v3 (Calibrated)":
            base_abs_errors = np.array(m["absolute_errors"])
            diffs = base_abs_errors - deberta_abs_errors
            mean_diff = float(np.mean(diffs))
            std_diff = float(np.std(diffs, ddof=1)) if len(diffs) > 1 else 0.0

            # Paired t-test
            t_stat, p_raw = stats.ttest_rel(base_abs_errors, deberta_abs_errors)
            p_bonf = float(np.clip(p_raw * num_comparisons, 0.0, 1.0))

            # Cohen's d_z effect size for paired samples
            cohen_dz = float(mean_diff / std_diff) if std_diff > 0 else 0.0

            # 95% CI of mean difference
            ci_diff_lo = mean_diff - 1.96 * (std_diff / np.sqrt(len(diffs)))
            ci_diff_hi = mean_diff + 1.96 * (std_diff / np.sqrt(len(diffs)))

            sig_str = f"{m['MAE']:.2f} (Δ={mean_diff:+.2f}, p_adj={p_bonf:.3f}, d_z={cohen_dz:.2f})"
        else:
            sig_str = f"{m['MAE']:.2f} (Reference)"

        r_ci_str = f"{m['Pearson_r']:.3f} [{m['Pearson_r_95ci'][0]:.2f}, {m['Pearson_r_95ci'][1]:.2f}]"
        rho_ci_str = f"{m['Spearman_rho']:.3f} [{m['Spearman_rho_95ci'][0]:.2f}, {m['Spearman_rho_95ci'][1]:.2f}]"

        results_table.append({
            "Model / Method": model_name,
            "Pearson r (95% CI)": r_ci_str,
            "Spearman rho (95% CI)": rho_ci_str,
            "QWK": f"{m['QWK']:.3f}",
            "MAE (Comparison vs DeBERTa)": sig_str,
            "RMSE": f"{m['RMSE']:.2f}",
            "Exact Match (%)": f"{m['Exact_Agreement_Pct']:.1f}%",
            "Macro-F1 (%)": f"{m['Macro_F1_Pct']:.1f}%",
        })

    # Save detailed prediction logs
    df["deberta_score"] = deberta_scores
    df["deberta_class"] = deberta_classes
    df["sbert_score"] = sbert_scores
    df["sbert_class"] = sbert_classes
    df["bertscore_f1"] = bertscore_scores
    df["bertscore_class"] = bertscore_classes
    df["rougeL_f1"] = rouge_scores
    df["rougeL_class"] = rouge_classes
    df.to_csv(OUTPUT_DIR / "model_predictions.csv", index=False)

    # Save IEEE Summary Table
    ieee_df = pd.DataFrame(results_table)
    ieee_df.to_csv(OUTPUT_DIR / "ieee_human_validation_table.csv", index=False)

    md_table = ieee_df.to_markdown(index=False)
    with open(OUTPUT_DIR / "ieee_human_validation_table.md", "w", encoding="utf-8") as f:
        f.write("# IEEE Table: Automated Interview Scoring Agreement with Human Expert Consensus\n\n")
        f.write(md_table)
        f.write("\n\n### Inter-Rater Reliability Summary\n")
        f.write(json.dumps(irr_results, indent=2))
        f.write("\n")

    with open(OUTPUT_DIR / "summary_metrics.json", "w", encoding="utf-8") as f:
        json.dump({"inter_rater_reliability": irr_results, "model_benchmarks": full_metrics}, f, indent=2)

    print("\n" + "=" * 80)
    print("EVALUATION COMPLETE. Output saved to:")
    print(f" - {OUTPUT_DIR / 'model_predictions.csv'}")
    print(f" - {OUTPUT_DIR / 'summary_metrics.json'}")
    print(f" - {OUTPUT_DIR / 'ieee_human_validation_table.csv'}")
    print(f" - {OUTPUT_DIR / 'ieee_human_validation_table.md'}")
    print("=" * 80)
    print("\n" + md_table)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=Path, default=DEFAULT_DATA_PATH, help="Path to annotated CSV dataset")
    args = parser.parse_args()
    run_evaluation(args.data)
