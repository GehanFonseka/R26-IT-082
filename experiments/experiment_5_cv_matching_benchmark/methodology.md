# Methodology: Candidate-Job Relevance Ranking Benchmark

---

## 1. Research Objectives & Problem Statement

This experiment benchmarks the proposed **6-layer BERT Cross-Encoder** against established information retrieval and NLP embedding baselines across identical candidate-job evaluation pairs.

### Core Research Hypothesis
* **Hypothesis ($H_1$):** A joint sequence-pair Cross-Encoder leveraging all-to-all cross-attention across job requirements and candidate profiles achieves significantly higher ranking precision ($\text{NDCG}@K$, $\text{MRR}$, $\text{MAP}$) and rank correlation ($\rho$) than lexical matching (TF-IDF, BM25) and dense bi-encoder representations (Sentence-BERT).

---

## 2. Mathematical Formulation of Evaluated Models

### A. Proposed 6-Layer BERT Cross-Encoder (`Gehan77/cv-match-browser`)
Given formatted job text $\mathbf{t}_{\text{job}}$ and candidate text $\mathbf{t}_{\text{cand}}$, the input sequence is formatted as:
$$\mathbf{x} = [\text{CLS}] \circ \text{compact}(\mathbf{t}_{\text{job}}) \circ [\text{SEP}] \circ \text{compact}(\mathbf{t}_{\text{cand}}) \circ [\text{SEP}]$$
where `compact()` truncates text to a maximum of 440 characters per side at word boundaries. The subword tokenizer truncates the combined sequence to `max_length: 256`.

The forward pass through 6 transformer layers ($d = 384, h = 12, d_{\text{ff}} = 1536$) computes a pooled classification logit $z \in \mathbb{R}$:
$$P_{\text{match}} = \sigma(z) = \frac{1}{1 + e^{-z}}$$
$$\text{Score}_{\text{CrossEncoder}} = 100 \cdot P_{\text{match}}$$
A candidate is classified as a `"Suitable Match"` if $P_{\text{match}} \ge 0.4399277865886688$.

---

### B. Baseline 1: TF-IDF + Cosine Similarity
Job descriptions and CV texts are vectorized using sub-linear term frequency and inverse document frequency with unigram/bigram tokenization:
$$\mathbf{v}_{\text{job}} = \text{TF-IDF}(\mathbf{t}_{\text{job}}), \quad \mathbf{v}_{\text{cand}} = \text{TF-IDF}(\mathbf{t}_{\text{cand}})$$
$$\text{Score}_{\text{TFIDF}} = 100 \cdot \frac{\mathbf{v}_{\text{job}} \cdot \mathbf{v}_{\text{cand}}}{\|\mathbf{v}_{\text{job}}\| \|\mathbf{v}_{\text{cand}}\|}$$

---

### C. Baseline 2: Sentence-BERT Dense Bi-Encoder (`all-MiniLM-L6-v2`)
Job and candidate representations are encoded independently into 384-dimensional dense vectors using mean-pooled transformer embeddings:
$$\mathbf{e}_{\text{job}} = \text{Encoder}(\mathbf{t}_{\text{job}}), \quad \mathbf{e}_{\text{cand}} = \text{Encoder}(\mathbf{t}_{\text{cand}})$$
$$\text{Score}_{\text{SBERT}} = 100 \cdot \max\left(0, \frac{\mathbf{e}_{\text{job}} \cdot \mathbf{e}_{\text{cand}}}{\|\mathbf{e}_{\text{job}}\| \|\mathbf{e}_{\text{cand}}\|}\right)$$

---

### D. Baseline 3: BM25 Lexical Ranking
Calculates probabilistic relevance based on term frequency and document length normalization:
$$\text{Score}_{\text{BM25}}(q, D) = \sum_{t \in q} \text{IDF}(t) \cdot \frac{f(t, D) \cdot (k_1 + 1)}{f(t, D) + k_1 \cdot \left(1 - b + b \cdot \frac{|D|}{\text{avgdl}}\right)}$$
(where $k_1 = 1.5, b = 0.75$).

---

## 3. Human Relevance Grading Rubric (4-Tier Graded Scale)

Candidate-job pairs are independently graded on a $0 - 3$ integer scale:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   GRADED RELEVANCE SCALE (0 - 3)                       │
├───────┬────────────────────────┬───────────────────────────────────────┤
│ Grade │ Category               │ Operational Criteria                  │
├───────┼────────────────────────┼───────────────────────────────────────┤
│   0   │ Not Relevant           │ Unrelated field; missing all must-have│
│       │                        │ skills; wrong domain or experience.   │
├───────┼────────────────────────┼───────────────────────────────────────┤
│   1   │ Weakly Relevant        │ Shares minor peripheral skills; lacks │
│       │                        │ core stack or required seniority.     │
├───────┼────────────────────────┼───────────────────────────────────────┤
│   2   │ Moderately Relevant    │ Matches must-have skills; suitable for│
│       │                        │ review with minor gaps.               │
├───────┼────────────────────────┼───────────────────────────────────────┤
│   3   │ Highly Relevant        │ Direct match on role title, stack,    │
│       │                        │ seniority, domain, and experience.    │
└───────┴────────────────────────┴───────────────────────────────────────┘
```

---

## 4. Information Retrieval & Ranking Metrics

1. **Normalized Discounted Cumulative Gain at K ($\text{NDCG}@K$):**
   Evaluates graded ranking quality, heavily penalizing relevant candidates placed lower in the ranking:
   $$\text{DCG}@K = \sum_{i=1}^K \frac{2^{rel_i} - 1}{\log_2(i + 1)}, \quad \text{NDCG}@K = \frac{\text{DCG}@K}{\text{IDCG}@K}$$
   (where $\text{IDCG}@K$ is the ideal DCG obtained by sorting candidates by true relevance).
2. **Mean Reciprocal Rank ($\text{MRR}$):**
   Evaluates how early the first relevant candidate ($rel \ge 2$) appears:
   $$\text{MRR} = \frac{1}{|Q|} \sum_{q \in Q} \frac{1}{\text{rank}_q}$$
3. **Precision at K ($\text{P}@K$) & Recall at K ($\text{R}@K$):**
   $$\text{P}@K = \frac{|\text{Relevant in Top } K|}{K}, \quad \text{R}@K = \frac{|\text{Relevant in Top } K|}{|\text{Total Relevant in Pool}|}$$
4. **Mean Average Precision ($\text{MAP}$):**
   $$\text{AP} = \sum_{k=1}^N P(k) \cdot \Delta R(k), \quad \text{MAP} = \frac{1}{|Q|}\sum_{q \in Q} \text{AP}(q)$$
5. **Spearman Rank Correlation ($\rho$) & Pearson ($r$):**
   Quantifies overall monotonic ranking consistency and continuous score alignment.

---

## 5. Statistical Significance Testing

* **Paired Comparison:** Every model is evaluated on identical candidate pools per job vacancy query.
* **Hypothesis Testing:** Paired two-tailed Student's $t$-test and non-parametric Wilcoxon signed-rank test on per-query $\text{NDCG}@5$ and $\text{MAP}$ scores.
* **Multiple Testing Correction:** Bonferroni adjusted $p$-values ($p_{\text{adj}} = \min(1.0, p \times 3)$) to control family-wise error across baseline comparisons.
* **Standardized Effect Size:** Cohen's $d_z = \frac{\bar{D}}{s_D}$ for paired differences.
