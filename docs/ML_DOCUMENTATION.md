# HealthAI — Machine Learning Architecture & Evaluation

HealthAI utilizes disease-specific, calibrated classification pipelines to generate early statistical screening scores.

---

## 1. Machine Learning Methodology

In clinical and public health screening, models must not be chosen on accuracy alone. In screening, **sensitivity (recall)** is paramount to minimize false negatives, while **ROC-AUC** and **Brier score calibration** ensure that output scores represent dependable risk probabilities.

### Model Comparison & Selection Workflow
For each screening module, three candidate architectures are trained and compared across stratified hold-out partitions:
1. **Calibrated Logistic Regression** (Balanced class weights, L2 regularization)
2. **Random Forest Classifier** (Ensemble of decision trees with restricted depth to prevent overfitting)
3. **Histogram Gradient Boosting Classifier** (Gradient boosting on binned numerical features)

---

## 2. Model Performance Benchmarks (Hold-Out Test Partitions)

All models evaluated on strict 15% unseen hold-out test sets ($N = 525$ per disease suite) with zero data leakage:

| Screening Module | Chosen Algorithm | Hold-Out ROC-AUC | Sensitivity (Recall) | Specificity | F1-Score | Brier Calibration | Accuracy |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Diabetes Screening** | Logistic Regression | **0.8031** | **74.44%** | 72.18% | 0.4820 | 0.1791 | 72.57% |
| **Cardiovascular Risk** | Logistic Regression | **0.7888** | **72.26%** | 67.03% | 0.5758 | 0.1966 | 68.57% |
| **Hypertension Risk** | Logistic Regression | **0.8117** | **73.93%** | 73.57% | 0.6933 | 0.1803 | 73.71% |

### Confusion Matrix Summaries (Test Partitions)
- **Diabetes**:
  - True Negatives: 314
  - False Positives: 121
  - False Negatives: 23 (Low false-negative rate prioritizing patient safety)
  - True Positives: 67
- **Cardiovascular**:
  - True Negatives: 248
  - False Positives: 122
  - False Negatives: 43
  - True Positives: 112
- **Hypertension**:
  - True Negatives: 231
  - False Positives: 83
  - False Negatives: 55
  - True Positives: 156

---

## 3. Dataset Characteristics & Benchmark Sourcing

Datasets are generated using clinical epidemiology benchmark parameters derived from:
- **CDC NHANES** (National Health and Nutrition Examination Survey)
- **Framingham Heart Study** cardiovascular risk parameters
- **Pima / CDC Diabetes Surveillance System**

### Features per Disease Engine
1. **Diabetes Engine**:
   - `age` (18–85 yrs)
   - `gender` (Biological sex)
   - `bmi` (Body Mass Index kg/m²)
   - `fasting_glucose` (Fasting plasma blood glucose mg/dL)
   - `systolic_bp` & `diastolic_bp` (mmHg)
   - `family_history` (First-degree relative diagnosed)
   - `physical_activity` (Aerobic hours/week)
   - `symptoms_score` (Cumulative score of polyuria, polydipsia, fatigue)
2. **Cardiovascular Engine**:
   - `age`, `gender`, `systolic_bp`, `cholesterol` (mg/dL), `fasting_blood_sugar` (>120 indicator), `heart_rate` (bpm), `smoking` (never/former/active), `chest_discomfort` (0 to 3 scale), `bmi`, `physical_activity`.
3. **Hypertension Engine**:
   - `systolic_bp`, `diastolic_bp`, `age`, `bmi`, `heart_rate`, `family_history`, `sodium_intake` (low/moderate/high), `smoking`, `physical_activity`, `symptoms_score`.

---

## 4. Explainable AI & Feature Attribution

HealthAI computes normalized feature attributions for every inference request.

$$\text{Standardized Deviation: } z_i = \frac{x_i - \mu_i}{\sigma_i}$$

$$\text{Raw Feature Impact: } I_i = z_i \times w_i$$

Where:
- $x_i$ is the patient's reported metric.
- $\mu_i$ and $\sigma_i$ are the population reference mean and standard deviation from metadata.
- $w_i$ is the model's standardized feature coefficient or importance weight.

Attributions are normalized into percentage influence and mapped to clinical context:
- `increases_risk`: Parameter lies above population reference, elevating statistical risk.
- `decreases_risk`: Parameter lies in a favorable baseline range, moderating risk.
- `neutral`: Parameter aligns closely with population reference levels.

### Mandatory Attribution Guardrail:
> *"These factors influenced the model's statistical output; they do not establish a medical cause or diagnosis."*

---

## 5. Limitations & Safety Boundaries

1. **Screening vs. Diagnosis**: HealthAI is explicitly designed for informational and early risk stratification. It cannot confirm the presence or absence of illness.
2. **Emergency Triage**: Extreme biometric values (e.g. Systolic BP $\ge 180\text{ mmHg}$, severe exertional chest pain) trigger immediate emergency advisory banners recommending urgent medical services.
3. **No Pharmaceutical Advice**: The models never generate medication prescriptions or dosage suggestions.
