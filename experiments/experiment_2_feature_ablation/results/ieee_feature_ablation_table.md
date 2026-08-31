# IEEE Feature Ablation Table: Impact of Regional and Engineered Interaction Ratios

| Configuration                               |   Features | Accuracy (%)   | Balanced Acc (%)   | Precision (%)   | Recall (%)   | F1-Score (%)     | ROC-AUC           | PR-AUC            |
|:--------------------------------------------|-----------:|:---------------|:-------------------|:----------------|:-------------|:-----------------|:------------------|:------------------|
| Config A: Standard IBM Features (26)        |         26 | 84.22 ± 0.90   | 73.21 ± 1.20       | 51.15 ± 2.44    | 56.96 ± 3.44 | 53.78 ± 1.26     | 0.8160 ± 0.0204   | 0.5834 ± 0.0402   |
| Config B: Raw + Regional Features (45)      |         45 | 85.58 ± 2.41   | 72.14 ± 1.39       | 58.07 ± 11.27   | 52.31 ± 4.00 | 54.18 ± 3.29     | 0.8142 ± 0.0086   | 0.5817 ± 0.0517   |
| Config C: Full 52 Features (+ 7 Ratios)     |         52 | 83.81 ± 1.90   | 70.40 ± 1.50       | 50.44 ± 5.55    | 50.62 ± 2.72 | 50.34 ± 3.11     | 0.8071 ± 0.0239   | 0.5753 ± 0.0475   |
| Delta: (B - A) [Regional Features Uplift]   |        +19 | +1.36%         | -1.07%             | +6.91%          | -4.65%       | +0.40% (p=0.830) | -0.0018 (p=0.821) | -0.0017 (p=0.933) |
| Delta: (C - B) [7 Engineered Ratios Uplift] |         +7 | -1.77%         | -1.74%             | -7.63%          | -1.69%       | -3.85% (p=0.026) | -0.0071 (p=0.463) | -0.0063 (p=0.575) |

## Top 15 Features by Mean Absolute SHAP

| Feature                 |   Mean_Absolute_SHAP | Is_Engineered_Ratio   |   Rank |
|:------------------------|---------------------:|:----------------------|-------:|
| OverTime                |             0.593458 | False                 |      1 |
| StockOptionLevel        |             0.472327 | False                 |      2 |
| AverageSatisfaction     |             0.316731 | True                  |      3 |
| NumCompaniesWorked      |             0.218904 | False                 |      4 |
| DistanceFromHome        |             0.190801 | False                 |      5 |
| BusinessTravel          |             0.18264  | False                 |      6 |
| OfferedSalaryLKR        |             0.179602 | False                 |      7 |
| Department              |             0.15832  | False                 |      8 |
| EducationField          |             0.157867 | False                 |      9 |
| DailyRate               |             0.155065 | False                 |     10 |
| JobRole                 |             0.14214  | False                 |     11 |
| JobLevel                |             0.140402 | False                 |     12 |
| JobInvolvement          |             0.138607 | False                 |     13 |
| ExpectedSalaryLKR       |             0.138167 | False                 |     14 |
| EnvironmentSatisfaction |             0.121648 | False                 |     15 |
