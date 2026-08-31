# Methodology: Human Expert Validation of Automated Interview Answer Scoring

---

## 1. Research Objectives & Construct Validity

The primary goal of this validation study is to determine whether the automated **DeBERTa-v3 multi-task interview scoring model** exhibits strong empirical alignment with blinded, independent domain expert evaluations across standardized technical software engineering interview answers.

### Prevention of Circular Validation
In automated educational and interview assessment, **circular validation** occurs when human evaluators are instructed to follow the model's internal threshold boundaries (e.g., using $\theta = [0.24, 0.47, 0.58, 0.84]$) or when evaluators grade answers based on model-derived feature vectors. 

To guarantee strict construct validity:
1. **Independent Analytic Rubric:** Human evaluators grade answers using a standardized 6-dimension pedagogical rubric based on established assessment standards (Bloom's Revised Taxonomy for cognitive complexity).
2. **Independent Grade Categorization:** Human continuous scores ($0-100$) are mapped into ordinal tiers using standard academic assessment brackets ($<40$: Wrong, $40-59$: Poor, $60-74$: Average, $75-89$: Good, $90-100$: Excellent), completely independent of the model's internal decision cutoffs.
3. **Strict Model Invariance:** The production DeBERTa model weights, class score centers, linear calibration parameters, and decision thresholds remain completely unchanged during validation.
4. **Tri-Blinded Evaluation:** Evaluators are blinded to:
   - Model predictions and confidence scores
   - Other evaluators' scores and comments
   - Candidate demographic or metadata information

---

## 2. Multi-Dimensional Human Evaluation Rubric

Each candidate answer is evaluated on a $100$-point composite scale across six orthogonal dimensions:

| Evaluation Dimension | Maximum Points | Scoring Criteria |
| :--- | :---: | :--- |
| **1. Technical Correctness** | **30 pts** | **Factual & Algorithmic Accuracy:**<br>• $25-30$: Flawless; no technical errors or misconceptions.<br>• $18-24$: Minor inaccuracies that do not invalidate the core solution.<br>• $10-17$: Contains significant factual errors alongside valid statements.<br>• $0-9$: Fundamentally incorrect or invalid logic. |
| **2. Completeness & Concept Coverage** | **20 pts** | **Coverage of Expected Points:**<br>• $17-20$: Addresses all core concepts requested by the prompt.<br>• $12-16$: Covers the majority of core principles with minor omissions.<br>• $6-11$: Covers only high-level surface concepts.<br>• $0-5$: Completely omits critical requirements. |
| **3. Domain Depth & Precision** | **15 pts** | **Technical Sophistication & Terminology:**<br>• $13-15$: Uses precise domain terminology; explains time/space complexity or system trade-offs.<br>• $9-12$: Proficient practical understanding.<br>• $5-8$: Layman explanations lacking professional depth.<br>• $0-4$: Superficial buzzwords without substance. |
| **4. Relevance & Focus** | **15 pts** | **Alignment with Prompt:**<br>• $13-15$: Directly answers the specific question with zero filler.<br>• $9-12$: Largely focused with minor irrelevant digressions.<br>• $5-8$: Drifts off-topic or circumvents the prompt.<br>• $0-4$: Completely irrelevant response. |
| **5. Reasoning Quality & Trade-offs** | **10 pts** | **Technical Justification:**<br>• $9-10$: Articulates *why* architectural/algorithmic choices are made.<br>• $6-8$: Provides sound technical justification.<br>• $3-5$: Dogmatic assertions without justification.<br>• $0-2$: Erroneous causal claims. |
| **6. Communication Clarity** | **10 pts** | **Structure & Readability:**<br>• $9-10$: Crisp, coherent, well-structured explanation.<br>• $6-8$: Understandable with minor structural flaws.<br>• $3-5$: Disorganized, rambling, or ambiguous.<br>• $0-2$: Incoherent or unintelligible. |
| **Total Composite Score** | **100 pts** | **Sum of all 6 dimensional scores** |

---

## 3. Human Score Aggregation & Ordinal Mapping

For each answer $i$, the continuous human consensus score $y_i$ is computed as the arithmetic mean across all $K$ blinded evaluators:
$$y_i = \frac{1}{K} \sum_{k=1}^K S_{i,k}$$

The continuous consensus score is mapped into the **standard 5-tier ordinal scale**:
$$\text{Human Consensus Class}(y_i) = \begin{cases}
\text{"Wrong"}, & 0.0 \le y_i < 40.0 \\
\text{"Poor"}, & 40.0 \le y_i < 60.0 \\
\text{"Average"}, & 60.0 \le y_i < 75.0 \\
\text{"Good"}, & 75.0 \le y_i < 90.0 \\
\text{"Excellent"}, & 90.0 \le y_i \le 100.0
\end{cases}$$

---

## 4. Statistical Analysis Plan: Metrics & Estimators

### A. Inter-Rater Reliability Among Human Evaluators
1. **Intra-Class Correlation ($\text{ICC}(2,1)$) with $95\%$ Confidence Interval:**
   Evaluates absolute agreement on continuous $0-100$ scores using a two-way random-effects model.
2. **Fleiss' Kappa ($\kappa$):**
   Evaluates chance-corrected agreement on discrete 5-tier ratings across all evaluators.
3. **Mean Pairwise Quadratic Weighted Kappa ($\text{QWK}$):**
   Measures pairwise ordinal classification distance between human evaluators.

### B. Model vs. Human Consensus Evaluation
1. **Pearson Correlation Coefficient ($r$) with $95\%$ Confidence Interval:**
   Calculated using Fisher's $z$-transformation:
   $$z = \text{arctanh}(r), \quad \text{SE}_z = \frac{1}{\sqrt{N - 3}}, \quad 95\% \text{ CI} = \tanh(z \pm 1.96 \cdot \text{SE}_z)$$
2. **Spearman Rank Correlation ($\rho$) with $95\%$ Confidence Interval:**
   Non-parametric rank-order monotonicity.
3. **Quadratic Weighted Kappa ($\text{QWK}$):**
   Penalizes classification distance quadratically:
   $$w_{ij} = \frac{(i - j)^2}{(K - 1)^2}, \quad \text{QWK} = 1 - \frac{\sum_{i,j} w_{ij} O_{ij}}{\sum_{i,j} w_{ij} E_{ij}}$$
4. **Mean Absolute Error ($\text{MAE}$) and Root Mean Squared Error ($\text{RMSE}$):**
   Residual magnitude and variance on the continuous $0-100$ scale.
5. **Exact Class Agreement ($\%$) and Macro-F1 ($\%$):**
   Categorical exact-match accuracy and unweighted macro-averaged F1 across all 5 classes.

### C. Baseline Comparative Significance Testing
For each baseline model (Sentence-BERT, BERTScore, ROUGE-L) compared against the proposed DeBERTa model:
1. **Paired Mean Difference in Absolute Error ($\bar{\Delta}_{\text{MAE}}$) with $95\%$ Confidence Interval:**
   $$\bar{D} = \frac{1}{N}\sum_{i=1}^N (|y_i - \hat{y}_{\text{base}, i}| - |y_i - \hat{y}_{\text{DeBERTa}, i}|), \quad 95\% \text{ CI} = \bar{D} \pm t_{0.975, N-1} \cdot \frac{s_D}{\sqrt{N}}$$
2. **Paired Student's $t$-test and Wilcoxon Signed-Rank Test:**
   Evaluates whether error reduction is statistically significant ($p < 0.05$).
3. **Multiple-Comparison Correction:**
   Bonferroni adjusted $p$-values ($p_{\text{adj}} = \min(1.0, p \times 3)$) to control family-wise error rate across the 3 baseline comparisons.
4. **Effect Size (Cohen's $d_z$ for Paired Samples):**
   $$d_z = \frac{\bar{D}}{s_D}$$
   Quantifies practical significance ($d_z \ge 0.2$ small, $d_z \ge 0.5$ medium, $d_z \ge 0.8$ large).

---

## 5. Sample Size Justification & Power Analysis

* **Power Analysis for Linear Correlation ($r \ge 0.70$):**
  At significance level $\alpha = 0.05$ (two-tailed) and statistical power $1 - \beta = 0.90$, detecting a correlation $r \ge 0.70$ requires a minimum of $N \ge 20$ paired samples.
* **Confidence Interval Narrowness for QWK ($\text{QWK} \ge 0.75 \pm 0.10$):**
  To ensure narrow 95% confidence intervals on ordinal grading agreement:
  $$\text{Minimum Sample Size: } N = 60 \text{ samples}$$
  $$\text{Recommended Sample Size: } N = 100 \text{ samples}$$
* **Domain Stratification:** The 60–100 samples should be balanced across 5 software engineering domains (Frontend, Backend, Database, Cloud/DevOps, System Design).

---

## 6. Predefined Evaluation Targets and Interpretation Guidelines

To maintain scientific integrity, the research framework establishes clear distinctions between **predefined methodological targets**, **statistical significance**, **practical significance**, and **actual observed results**.

> **Note on Academic Standards:** IEEE conferences and journals do not prescribe arbitrary minimum cutoff numbers for publication; rather, peer review evaluates the rigor of the experimental methodology, the validity of the baselines, the transparency of confidence intervals, and whether conclusions are justified by the data.

### Methodological Distinction Framework

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. Predefined Target: A priori research benchmark set before data collection│
│    (e.g., QWK ≥ 0.70 indicating substantial grading alignment).             │
│ 2. Statistical Significance: Rejection of the null hypothesis at α = 0.05   │
│    with Bonferroni adjustment (p_adj < 0.05).                               │
│ 3. Practical Significance: Standardized effect size (Cohen's d_z ≥ 0.50)    │
│    demonstrating meaningful error reduction over baselines.                 │
│ 4. Actual Observed Result: The measured point estimate and 95% CI on the    │
│    collected 60–100 expert samples.                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Predefined Benchmark Tiers for Interpretation

| Evaluation Dimension | Predefined Target Benchmark | Statistical Significance Requirement | Practical Significance Benchmark |
| :--- | :---: | :---: | :---: |
| **Human Inter-Rater Reliability** | $\text{ICC}(2,1) \ge 0.75$ | $p < 0.001$ against $H_0: \text{ICC} \le 0$ | $95\% \text{ CI}$ lower bound $> 0.60$ |
| **Human Categorical Agreement** | $\text{Fleiss' } \kappa \ge 0.50$ | $p < 0.001$ against $H_0: \kappa \le 0$ | Substantial agreement ($\kappa \ge 0.60$) |
| **Model vs. Human Agreement** | $\text{QWK} \ge 0.70$ | $p < 0.001$ against $H_0: \text{QWK} \le 0$ | Close to inter-human QWK ($\Delta \le 0.10$) |
| **Linear Score Correlation** | $r \ge 0.70$ | $p < 0.001$ (two-tailed) | $95\% \text{ CI}$ lower bound $> 0.55$ |
| **Rank Order Monotonicity** | $\rho \ge 0.70$ | $p < 0.001$ (two-tailed) | $95\% \text{ CI}$ lower bound $> 0.55$ |
| **Prediction Residuals** | $\text{MAE} \le 10.0\text{ pts}$ | $95\% \text{ CI}$ reported | Relative error $< 15\%$ of score range |
| **Baseline Superiority** | $\Delta_{\text{MAE}} > 0$ vs. SBERT | $p_{\text{adj}} < 0.05$ (Bonferroni) | Cohen's $d_z \ge 0.50$ (Medium effect) |

*Final scientific conclusions regarding model validity, generalizability, and human agreement depend strictly on the actual empirical values measured on the collected 60–100 human-annotated samples.*
