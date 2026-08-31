# IEEE Table: Automated Interview Scoring Agreement with Human Expert Consensus

| Model / Method                   | Pearson r        |   Spearman rho |    QWK |   MAE |   RMSE | Exact Match (%)   | Macro-F1 (%)   |
|:---------------------------------|:-----------------|---------------:|-------:|------:|-------:|:------------------|:---------------|
| Proposed DeBERTa-v3 (Calibrated) | 0.429 (p=0.216)  |          0.587 |  0.259 |  9.06 |  11.58 | 60.0%             | 37.1%          |
| Sentence-BERT (all-MiniLM-L6-v2) | -0.072 (p=0.844) |          0.006 | -0.129 |  7.55 |  11.21 | 30.0%             | 15.4%          |
| BERTScore (F1)                   | 0.258 (p=0.471)  |          0.447 |  0     |  7.19 |   8.83 | 10.0%             | 9.1%           |
| ROUGE-L                          | 0.562 (p=0.091)  |          0.581 |  0.041 | 47.25 |  48.09 | 0.0%              | 0.0%           |

### Inter-Rater Reliability Summary
{
  "num_evaluators": 3,
  "num_samples": 10,
  "mean_pairwise_pearson_r": 0.9084311207531517,
  "mean_pairwise_spearman_rho": 0.8827560273541107,
  "fleiss_kappa": 0.5199999999999996,
  "mean_pairwise_qwk": 0.5352564102564102
}
