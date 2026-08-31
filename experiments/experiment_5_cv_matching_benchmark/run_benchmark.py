"""
Experiment 5: CV-Job Matching & Candidate Ranking Benchmark
============================================================
Benchmarks the proposed 6-layer ONNX BERT Cross-Encoder (Gehan77/cv-match-browser)
against TF-IDF cosine similarity, Sentence-BERT (all-MiniLM-L6-v2), and BM25.

Metrics:
- Information Retrieval: NDCG@5, NDCG@10, P@5, R@5, MRR, MAP
- Correlation: Spearman rho, Pearson r (with 95% Fisher's z CI)
- Regression Residuals: MAE, RMSE (on 0-100 continuous score scale)
- Statistical Testing: Paired t-tests, Bonferroni adjusted p-values, Cohen's d_z
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Tuple

import numpy as np
import onnxruntime as ort
import pandas as pd
import scipy.stats as stats
import torch
from rank_bm25 import BM25Okapi
from sentence_transformers import SentenceTransformer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import mean_absolute_error, mean_squared_error, ndcg_score
from transformers import AutoTokenizer


# ---------------------------------------------------------
# Paths & Default Setup
# ---------------------------------------------------------
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parents[1]
DEFAULT_DATA_PATH = SCRIPT_DIR / "data_schema" / "example_pairs.csv"
MODEL_DIR = PROJECT_ROOT / "backend" / "cv-match-browser"
ONNX_MODEL_PATH = MODEL_DIR / "onnx" / "model.onnx"
OUTPUT_DIR = SCRIPT_DIR / "results"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


# ---------------------------------------------------------
# Text Formatting (Exact Match with Project Service)
# ---------------------------------------------------------
def clean_text(text: Any, limit: int = 440) -> str:
    if pd.isna(text) or text is None:
        return ""
    val = re.sub(r"\s+", " ", str(text)).strip()
    if len(val) <= limit:
        return val
    sliced = val[:limit]
    last_space = sliced.rfind(" ")
    return sliced[:last_space].strip() if last_space > 0 else sliced.strip()


def build_job_text(row: pd.Series) -> str:
    title = clean_text(row.get("job_title", ""), 50)
    seniority = clean_text(row.get("job_seniority", ""), 20)
    industry = clean_text(row.get("job_industry", ""), 35)
    must_have = clean_text(row.get("must_have_skills", ""), 110)
    nice_to_have = clean_text(row.get("nice_to_have_skills", ""), 70)
    desc = clean_text(row.get("job_description", ""), 100)
    return clean_text(
        f"Job Title: {title}. Required Seniority: {seniority}. Industry: {industry}. "
        f"Must-Have Skills: {must_have}. Nice-to-Have Skills: {nice_to_have}. "
        f"Job Description: {desc}.",
        440
    )


def build_candidate_text(row: pd.Series) -> str:
    role = clean_text(row.get("candidate_role", ""), 50)
    seniority = clean_text(row.get("candidate_seniority", ""), 20)
    years = clean_text(row.get("years_experience", ""), 10)
    industry = clean_text(row.get("candidate_industry", ""), 35)
    skills = clean_text(row.get("candidate_skills", ""), 145)
    summary = clean_text(row.get("candidate_summary", ""), 50)
    return clean_text(
        f"Candidate Role: {role}. Seniority Level: {seniority}. Years of Experience: {years}. "
        f"Industry Experience: {industry}. Skills: {skills}. Professional Summary: {summary}.",
        440
    )


# ---------------------------------------------------------
# Model Inference Implementations
# ---------------------------------------------------------
class ONNXCrossEncoderMatcher:
    def __init__(self, model_dir: Path, onnx_path: Path):
        self.tokenizer = AutoTokenizer.from_pretrained(model_dir, local_files_only=True)
        self.session = ort.InferenceSession(str(onnx_path))
        self.input_names = [i.name for i in self.session.get_inputs()]

    def predict_batch(self, job_texts: List[str], cand_texts: List[str]) -> np.ndarray:
        scores = []
        for j_text, c_text in zip(job_texts, cand_texts):
            encoded = self.tokenizer(
                j_text,
                text_pair=c_text,
                padding=True,
                truncation=True,
                max_length=256,
                return_tensors="np"
            )
            inputs = {k: encoded[k] for k in self.input_names if k in encoded}
            out = self.session.run(None, inputs)
            logit = float(out[0][0][0]) if len(out[0].shape) > 1 else float(out[0][0])
            prob = 1.0 / (1.0 + np.exp(-logit))
            scores.append(prob * 100.0)
        return np.array(scores)


def compute_tfidf_scores(job_texts: List[str], cand_texts: List[str]) -> np.ndarray:
    scores = []
    vectorizer = TfidfVectorizer(ngram_range=(1, 2), stop_words="english")
    for j_text, c_text in zip(job_texts, cand_texts):
        try:
            mat = vectorizer.fit_transform([j_text, c_text])
            cos_sim = float((mat[0] * mat[1].T).toarray()[0][0])
            scores.append(np.clip(cos_sim * 100.0, 0.0, 100.0))
        except Exception:
            scores.append(0.0)
    return np.array(scores)


def compute_sbert_scores(job_texts: List[str], cand_texts: List[str]) -> np.ndarray:
    model = SentenceTransformer("all-MiniLM-L6-v2")
    j_emb = model.encode(job_texts, convert_to_tensor=True)
    c_emb = model.encode(cand_texts, convert_to_tensor=True)
    cos_sims = torch.cosine_similarity(j_emb, c_emb).cpu().numpy()
    return np.clip(cos_sims * 100.0, 0.0, 100.0)


def compute_bm25_scores(job_texts: List[str], cand_texts: List[str]) -> np.ndarray:
    scores = []
    for j_text, c_text in zip(job_texts, cand_texts):
        tokenized_cand = c_text.lower().split()
        tokenized_job = j_text.lower().split()
        if not tokenized_cand or not tokenized_job:
            scores.append(0.0)
            continue
        bm25 = BM25Okapi([tokenized_cand])
        s = float(bm25.get_scores(tokenized_job)[0])
        scores.append(s)
    # Min-max normalize BM25 to 0-100 scale for comparison
    arr = np.array(scores)
    if np.max(arr) > np.min(arr):
        norm = (arr - np.min(arr)) / (np.max(arr) - np.min(arr)) * 100.0
    else:
        norm = arr
    return norm


# ---------------------------------------------------------
# Information Retrieval & Ranking Metrics
# ---------------------------------------------------------
def calculate_ranking_metrics_by_query(df: pd.DataFrame, score_col: str,
                                       grade_col: str = "consensus_grade",
                                       rel_threshold: int = 2) -> Dict[str, float]:
    """Calculates query-level NDCG, MRR, MAP, P@5, R@5 grouped by job_id."""
    ndcg5_list, ndcg10_list, mrr_list, map_list, p5_list, r5_list = [], [], [], [], [], []

    grouped = df.groupby("job_id")
    for job_id, group in grouped:
        if len(group) < 2:
            continue
        y_true_grades = group[grade_col].to_numpy(dtype=float)
        y_pred_scores = group[score_col].to_numpy(dtype=float)

        # NDCG@5 and NDCG@10
        if np.sum(y_true_grades) > 0:
            k5 = min(5, len(group))
            k10 = min(10, len(group))
            ndcg5 = ndcg_score(np.asarray([y_true_grades]), np.asarray([y_pred_scores]), k=k5)
            ndcg10 = ndcg_score(np.asarray([y_true_grades]), np.asarray([y_pred_scores]), k=k10)
            ndcg5_list.append(ndcg5)
            ndcg10_list.append(ndcg10)

        # Ranking order
        sorted_indices = np.argsort(-y_pred_scores)
        sorted_grades = y_true_grades[sorted_indices]

        # Precision@5 & Recall@5 (rel >= 2)
        binary_rel = (sorted_grades >= rel_threshold).astype(int)
        total_rel = np.sum(binary_rel)

        k_eval = min(5, len(sorted_grades))
        p5 = np.sum(binary_rel[:k_eval]) / k_eval
        r5 = (np.sum(binary_rel[:k_eval]) / total_rel) if total_rel > 0 else 0.0
        p5_list.append(p5)
        r5_list.append(r5)

        # MRR
        rel_pos = np.where(binary_rel == 1)[0]
        if len(rel_pos) > 0:
            mrr_list.append(1.0 / (rel_pos[0] + 1))
        else:
            mrr_list.append(0.0)

        # Average Precision (AP) for MAP
        if total_rel > 0:
            precisions = [np.sum(binary_rel[:idx + 1]) / (idx + 1) for idx in range(len(binary_rel)) if binary_rel[idx] == 1]
            map_list.append(np.mean(precisions) if precisions else 0.0)
        else:
            map_list.append(0.0)

    return {
        "NDCG@5": float(np.mean(ndcg5_list)) if ndcg5_list else 0.0,
        "NDCG@10": float(np.mean(ndcg10_list)) if ndcg10_list else 0.0,
        "Precision@5": float(np.mean(p5_list)) if p5_list else 0.0,
        "Recall@5": float(np.mean(r5_list)) if r5_list else 0.0,
        "MRR": float(np.mean(mrr_list)) if mrr_list else 0.0,
        "MAP": float(np.mean(map_list)) if map_list else 0.0,
        "per_query_ndcg5": ndcg5_list,
        "per_query_map": map_list,
    }


def pearson_r_ci(r: float, n: int, confidence: float = 0.95) -> Tuple[float, float]:
    if n <= 3 or abs(r) >= 1.0:
        return (r, r)
    z = np.arctanh(r)
    se = 1.0 / np.sqrt(n - 3)
    z_crit = stats.norm.ppf((1 + confidence) / 2)
    return float(np.tanh(z - z_crit * se)), float(np.tanh(z + z_crit * se))


# ---------------------------------------------------------
# Main Execution Routine
# ---------------------------------------------------------
def run_benchmark(data_file: Path):
    print("=" * 80)
    print("EXPERIMENT 5: CV-JOB RELEVANCE MATCHING BENCHMARK")
    print("=" * 80)

    if not data_file.exists():
        print(f"Error: Dataset file not found at {data_file}")
        sys.exit(1)

    df = pd.read_csv(data_file)
    print(f"Loaded dataset: {data_file.name} ({len(df)} candidate-job pairs)")

    # 1. Check for Evaluator Grades / Scores
    grade_cols = [c for c in df.columns if c.startswith("evaluator_") and c.endswith("_grade")]
    score_cols = [c for c in df.columns if c.startswith("evaluator_") and c.endswith("_score")]

    if grade_cols and df[grade_cols].isna().all().all():
        print("\n" + "!" * 80)
        print("NOTICE: The dataset contains blank evaluator grades.")
        print("Please enter human relevance grades (0-3) into the CSV before running.")
        print("!" * 80 + "\n")
        sys.exit(0)

    # Compute consensus grade and score dynamically if missing
    if "consensus_grade" not in df.columns or df["consensus_grade"].isna().all():
        if grade_cols:
            df["consensus_grade"] = df[grade_cols].median(axis=1).round().astype(int)
        else:
            df["consensus_grade"] = 0

    if "consensus_score" not in df.columns or df["consensus_score"].isna().all():
        if score_cols:
            df["consensus_score"] = df[score_cols].mean(axis=1)
        else:
            df["consensus_score"] = df["consensus_grade"] * 33.33

    # Format texts
    job_texts = [build_job_text(row) for _, row in df.iterrows()]
    cand_texts = [build_candidate_text(row) for _, row in df.iterrows()]

    # 2. Run Model Inference
    print("\n--- Running Proposed 6-Layer BERT Cross-Encoder (ONNX) ---")
    cross_encoder = ONNXCrossEncoderMatcher(MODEL_DIR, ONNX_MODEL_PATH)
    df["cross_encoder_score"] = cross_encoder.predict_batch(job_texts, cand_texts)

    print("--- Running Baseline 1: TF-IDF + Cosine Similarity ---")
    df["tfidf_score"] = compute_tfidf_scores(job_texts, cand_texts)

    print("--- Running Baseline 2: Sentence-BERT Cosine Similarity ---")
    df["sbert_score"] = compute_sbert_scores(job_texts, cand_texts)

    print("--- Running Baseline 3: BM25 Lexical Ranking ---")
    df["bm25_score"] = compute_bm25_scores(job_texts, cand_texts)

    # 3. Calculate Comprehensive IR and Ranking Metrics
    models = {
        "Proposed BERT Cross-Encoder (6-Layer ONNX)": "cross_encoder_score",
        "Sentence-BERT (all-MiniLM-L6-v2)": "sbert_score",
        "TF-IDF + Cosine Similarity": "tfidf_score",
        "BM25 Lexical Ranking": "bm25_score",
    }

    y_true_grades = df["consensus_grade"].to_numpy(dtype=float)
    y_true_scores = df["consensus_score"].to_numpy(dtype=float)
    n_samples = len(df)

    benchmark_results = []
    full_metrics = {}

    ref_model_name = "Proposed BERT Cross-Encoder (6-Layer ONNX)"
    ref_ndcg5 = calculate_ranking_metrics_by_query(df, models[ref_model_name])["per_query_ndcg5"]

    for model_name, score_col in models.items():
        y_pred = df[score_col].to_numpy(dtype=float)
        ir_m = calculate_ranking_metrics_by_query(df, score_col)

        # Correlation metrics
        spearman_rho, p_spearman = stats.spearmanr(y_true_grades, y_pred)
        if np.std(y_pred) > 0 and np.std(y_true_scores) > 0:
            pearson_r, p_pearson = stats.pearsonr(y_true_scores, y_pred)
            r_ci = pearson_r_ci(pearson_r, n_samples)
        else:
            pearson_r, p_pearson, r_ci = 0.0, 1.0, (0.0, 0.0)

        mae = float(mean_absolute_error(y_true_scores, y_pred))
        rmse = float(np.sqrt(mean_squared_error(y_true_scores, y_pred)))

        # Statistical comparison on per-query NDCG@5
        if model_name != ref_model_name and len(ir_m["per_query_ndcg5"]) > 1 and len(ref_ndcg5) > 1:
            diffs = np.array(ref_ndcg5) - np.array(ir_m["per_query_ndcg5"])
            mean_diff = float(np.mean(diffs))
            std_diff = float(np.std(diffs, ddof=1)) if len(diffs) > 1 else 0.0
            _, p_raw = stats.ttest_rel(ref_ndcg5, ir_m["per_query_ndcg5"])
            p_bonf = float(np.clip(p_raw * (len(models) - 1), 0.0, 1.0))
            cohen_dz = float(mean_diff / std_diff) if std_diff > 0 else 0.0
            ndcg_sig_str = f"{ir_m['NDCG@5']:.3f} (Delta={mean_diff:+.3f}, p={p_bonf:.3f}, d_z={cohen_dz:.2f})"
        elif model_name == ref_model_name:
            ndcg_sig_str = f"{ir_m['NDCG@5']:.3f} (Reference)"
        else:
            ndcg_sig_str = f"{ir_m['NDCG@5']:.3f}"

        full_metrics[model_name] = {
            "NDCG@5": ir_m["NDCG@5"],
            "NDCG@10": ir_m["NDCG@10"],
            "Precision@5": ir_m["Precision@5"],
            "Recall@5": ir_m["Recall@5"],
            "MRR": ir_m["MRR"],
            "MAP": ir_m["MAP"],
            "Spearman_rho": float(spearman_rho),
            "Pearson_r": float(pearson_r),
            "Pearson_r_95ci": list(r_ci),
            "MAE": mae,
            "RMSE": rmse,
        }

        benchmark_results.append({
            "Model / Method": model_name,
            "NDCG@5 (vs Reference)": ndcg_sig_str,
            "NDCG@10": f"{ir_m['NDCG@10']:.3f}",
            "MRR": f"{ir_m['MRR']:.3f}",
            "MAP": f"{ir_m['MAP']:.3f}",
            "Precision@5": f"{ir_m['Precision@5']:.3f}",
            "Spearman rho": f"{spearman_rho:.3f}",
            "Pearson r (95% CI)": f"{pearson_r:.3f} [{r_ci[0]:.2f}, {r_ci[1]:.2f}]",
            "MAE": f"{mae:.2f}",
        })

    # Save outputs
    df.to_csv(OUTPUT_DIR / "model_predictions.csv", index=False)

    ieee_df = pd.DataFrame(benchmark_results)
    ieee_df.to_csv(OUTPUT_DIR / "ieee_cv_benchmark_table.csv", index=False)

    md_table = ieee_df.to_markdown(index=False)
    with open(OUTPUT_DIR / "ieee_cv_benchmark_table.md", "w", encoding="utf-8") as f:
        f.write("# IEEE Table: Candidate-Job Relevance Ranking Benchmark\n\n")
        f.write(md_table)
        f.write("\n")

    with open(OUTPUT_DIR / "summary_metrics.json", "w", encoding="utf-8") as f:
        json.dump(full_metrics, f, indent=2)

    print("\n" + "=" * 80)
    print("BENCHMARK EVALUATION COMPLETE. Outputs saved to:")
    print(f" - {OUTPUT_DIR / 'model_predictions.csv'}")
    print(f" - {OUTPUT_DIR / 'summary_metrics.json'}")
    print(f" - {OUTPUT_DIR / 'ieee_cv_benchmark_table.csv'}")
    print(f" - {OUTPUT_DIR / 'ieee_cv_benchmark_table.md'}")
    print("=" * 80)
    print("\n" + md_table)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=Path, default=DEFAULT_DATA_PATH, help="Path to labeled CV-job dataset")
    args = parser.parse_args()
    run_benchmark(args.data)
