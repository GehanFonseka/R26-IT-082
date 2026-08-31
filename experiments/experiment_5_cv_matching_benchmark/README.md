# Experiment 5: Candidate-Job Relevance Ranking Benchmark

---

## 1. Research Objectives & Current Status

* **Objective:** Benchmark the proposed 6-layer BERT Cross-Encoder against standard information retrieval baselines (TF-IDF + cosine similarity, BM25) and dense representation models (Sentence-BERT `all-MiniLM-L6-v2`) on identical candidate-job evaluation pairs.
* **Current Status:**
  * The production ONNX model [`backend/cv-match-browser/onnx/model.onnx`](file:///c:/Users/acer/Downloads/Project/Project/backend/cv-match-browser/onnx/model.onnx) and tokenizer are verified and operational.
  * **No labeled ground-truth candidate-job relevance dataset exists in the repository.**
  * A representative schema template has been provided in `data_schema/example_pairs.csv` ($N=10$ candidate-job pairs) and blank template in `data_schema/annotation_template.csv`.

---

## 2. Model Architecture & Baselines

| Model / Method | Architecture | Input Sequence Format | Similarity / Score Calculation |
| :--- | :--- | :--- | :--- |
| **Proposed BERT Cross-Encoder** | 6-layer BERT ($d=384, h=12, d_{\text{ff}}=1536$) ONNX export | Joint sequence pair: `[CLS] Job Text [SEP] Candidate Text [SEP]` | $\sigma(\text{logit}) \times 100$ |
| **Sentence-BERT** | 6-layer MiniLM dense bi-encoder | Independent dual-encoder: $E(\text{Job}), E(\text{Candidate})$ | $\cos(E(\text{Job}), E(\text{Candidate})) \times 100$ |
| **TF-IDF + Cosine** | Unigram + bigram sublinear TF-IDF | Tokenized text vectors $\mathbf{v}_{\text{job}}, \mathbf{v}_{\text{cand}}$ | $\cos(\mathbf{v}_{\text{job}}, \mathbf{v}_{\text{cand}}) \times 100$ |
| **BM25 Lexical Ranking** | Okapi BM25 ($k_1=1.5, b=0.75$) | Bag-of-words document and query terms | Normalized BM25 score |

---

## 3. Human Annotation Requirements & Protocol

To make the evaluation academically defensible for an IEEE paper, annotate **at least 100 candidate-job pairs** (e.g., 10 job vacancies with 10 candidate profiles each):

### A. Graded Relevance Scale ($0 - 3$)
* **0 (Not Relevant):** Candidate has unrelated skills, mismatched domain, or inappropriate seniority.
* **1 (Weakly Relevant):** Shares minor adjacent skills; lacks core stack or required seniority.
* **2 (Moderately Relevant):** Matches core must-have skills; suitable for interview with minor gaps.
* **3 (Highly Relevant):** Direct match on role title, stack, seniority, domain, and experience.

### B. Evaluator Protocol
* **Panel:** 2 to 3 independent technical recruiters or software engineering hiring managers.
* **Blinding:** Evaluators have ZERO visibility into model scores, baseline scores, or peer grades.

---

## 4. How to Execute the Benchmark

Once your annotated CSV file is populated with blinded human grades:

```powershell
python Project/experiments/experiment_5_cv_matching_benchmark/run_benchmark.py --data Project/experiments/experiment_5_cv_matching_benchmark/data_schema/example_pairs.csv
```

To run on a newly collected dataset:
```powershell
python Project/experiments/experiment_5_cv_matching_benchmark/run_benchmark.py --data path/to/your_annotated_pairs.csv
```

---

## 5. Generated Artifacts

The benchmark script automatically generates:
1. `results/model_predictions.csv`: Itemized prediction log comparing Cross-Encoder, SBERT, TF-IDF, and BM25 against human consensus.
2. `results/summary_metrics.json`: JSON file with NDCG@5/10, P@5, R@5, MRR, MAP, Spearman $\rho$, and Pearson $r$.
3. `results/ieee_cv_benchmark_table.csv` & `results/ieee_cv_benchmark_table.md`: Publication-ready tables with paired $t$-test $p$-values and Cohen's $d_z$ effect sizes.
