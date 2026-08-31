# Experiment 3: Human Expert Validation of Automated Interview Scoring

---

## 1. Objective & Scientific Safeguards

* **Objective:** Benchmark the proposed calibrated DeBERTa-v3 interview scoring model against blinded, independent domain expert consensus and NLP baselines (Sentence-BERT, BERTScore, ROUGE-L).
* **Prevention of Circular Validation:** Human evaluators do **NOT** use the model's internal score cutoffs. Evaluators grade answers on an independent, multi-criteria 100-point rubric based on Bloom's Revised Taxonomy. Human scores are converted to the 5 standard academic rating tiers ($<40$ Wrong, $40-59$ Poor, $60-74$ Average, $75-89$ Good, $90-100$ Excellent), completely independent of the model.

---

## 2. Multi-Dimensional Human Evaluation Rubric

Each candidate answer is evaluated by 2–3 independent technical evaluators across 6 dimensions:

| Dimension | Points | Description |
| :--- | :---: | :--- |
| **1. Technical Correctness** | $0 - 30$ | Factual and conceptual accuracy; absence of misconceptions. |
| **2. Completeness & Coverage** | $0 - 20$ | Extent to which all core concepts requested by the question are addressed. |
| **3. Domain Depth & Precision** | $0 - 15$ | Correct professional terminology, algorithmic complexity, or architectural nuances. |
| **4. Relevance & Focus** | $0 - 15$ | Direct alignment with the specific prompt without off-topic filler. |
| **5. Reasoning Quality** | $0 - 10$ | Technical justification, analysis of trade-offs, and edge-case awareness. |
| **6. Communication Clarity** | $0 - 10$ | Coherence, structure, and readability of the explanation. |
| **Total Composite Score** | **$0 - 100$** | Sum of dimensional scores. |

---

## 3. Dataset Format & Blank Annotation Template

Use the provided template: [`data_schema/annotation_template.csv`](file:///c:/Users/acer/Downloads/Project/Project/experiments/experiment_3_interview_human_validation/data_schema/annotation_template.csv).

```csv
item_id,domain,question,reference_answer,candidate_answer,evaluator_1_score,evaluator_2_score,evaluator_3_score
1,Frontend,"What is state vs props in React?","...","...",,,
```

---

## 4. Predefined Evaluation Targets and Interpretation Guidelines

The evaluation framework clearly distinguishes between **predefined targets**, **statistical significance**, **practical significance**, and **actual observed results**:

* **Statistical Significance:** Paired two-tailed Student's $t$-test / Wilcoxon signed-rank test at $\alpha = 0.05$ with Bonferroni multiple-comparison correction.
* **Practical Significance:** Standardized Cohen's $d_z$ effect size on paired error differences.
* **Confidence Intervals:** 95% CIs reported for Pearson $r$ (Fisher's $z$-transform), Spearman $\rho$, and $\text{ICC}(2,1)$.
* **Actual Results:** Final paper conclusions depend strictly on empirical values measured on the collected 60–100 expert samples.

---

## 5. How to Execute the Evaluation

Once your CSV file is populated with blinded human scores:

```powershell
python Project/experiments/experiment_3_interview_human_validation/run_evaluation.py --data Project/experiments/experiment_3_interview_human_validation/data_schema/annotation_template.csv
```

---

## 6. Generated Artifacts & Statistical Outputs

The evaluation script automatically produces:
1. `results/model_predictions.csv`: Detailed predictions across all models alongside human consensus.
2. `results/summary_metrics.json`: JSON summary of Inter-Rater Reliability (ICC(2,1) with 95% CI, Fleiss' $\kappa$, Pearson $r$) and model benchmark scores.
3. `results/ieee_human_validation_table.csv` & `results/ieee_human_validation_table.md`: Publication-ready comparison tables reporting 95% CIs, effect sizes ($d_z$), and Bonferroni-adjusted $p$-values.
