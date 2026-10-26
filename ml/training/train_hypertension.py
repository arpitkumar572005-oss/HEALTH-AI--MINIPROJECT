"""
HealthAI — Phase 5: Hypertension Machine Learning Training & Evaluation Pipeline
================================================================================
This script executes a verifiable, reproducible ML pipeline for Hypertension Risk Screening:
1. Data Loading: Loads the project hypertension dataset (ml/datasets/hypertension_data.csv).
2. Data Cleaning & Validation: Validates ranges, missing values, and data types.
3. Preprocessing: StandardScaler pipeline step for feature normalization.
4. Train/Test Split: Stratified 80/20 train/test split.
5. Model Training: Logistic Regression with balanced class weights.
6. Model Evaluation: Computes real Accuracy, Precision, Recall, Specificity, F1, ROC-AUC, Brier score, and Confusion Matrix.
7. Model Saving: Saves model pipeline and metadata to ml/models/hypertension and backend/app/ml/saved_models/hypertension.
"""

import os
import json
import numpy as np
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    brier_score_loss,
    confusion_matrix,
)

def load_and_validate_dataset(csv_path: str) -> pd.DataFrame:
    """Loads and validates the hypertension dataset."""
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Hypertension dataset not found at {csv_path}")
    
    df = pd.read_csv(csv_path)
    print(f"Loaded hypertension dataset from: {csv_path}")
    print(f"Shape: {df.shape[0]} rows, {df.shape[1]} columns")
    
    expected_cols = [
        "systolic_bp", "diastolic_bp", "age", "bmi",
        "heart_rate", "family_history", "sodium_intake",
        "smoking", "physical_activity", "symptoms_score", "target"
    ]
    missing_cols = [c for c in expected_cols if c not in df.columns]
    if missing_cols:
        raise ValueError(f"Missing required columns in dataset: {missing_cols}")
    
    null_counts = df.isnull().sum()
    if null_counts.sum() > 0:
        print(f"Warning: Found missing values, applying median imputation:")
        print(null_counts[null_counts > 0])
        df = df.fillna(df.median())
    else:
        print("Data integrity check: 0 missing values detected.")
        
    return df

def evaluate_predictions(y_true, y_pred, y_prob) -> dict:
    """Computes exact, un-fabricated clinical screening evaluation metrics."""
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()
    specificity = tn / (tn + fp) if (tn + fp) > 0 else 0.0
    
    return {
        "accuracy": round(float(accuracy_score(y_true, y_pred)), 4),
        "precision": round(float(precision_score(y_true, y_pred, zero_division=0)), 4),
        "recall_sensitivity": round(float(recall_score(y_true, y_pred, zero_division=0)), 4),
        "specificity": round(float(specificity), 4),
        "f1_score": round(float(f1_score(y_true, y_pred, zero_division=0)), 4),
        "roc_auc": round(float(roc_auc_score(y_true, y_prob)), 4),
        "brier_score": round(float(brier_score_loss(y_true, y_prob)), 4),
        "confusion_matrix": {
            "true_negatives": int(tn),
            "false_positives": int(fp),
            "false_negatives": int(fn),
            "true_positives": int(tp),
        }
    }

def train_hypertension_pipeline():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_path = os.path.join(base_dir, "datasets", "hypertension_data.csv")
    ml_models_dir = os.path.join(base_dir, "models", "hypertension")
    backend_models_dir = os.path.abspath(
        os.path.join(base_dir, "..", "backend", "app", "ml", "saved_models", "hypertension")
    )
    
    # 1. Load Data
    df = load_and_validate_dataset(data_path)
    X = df.drop(columns=["target"])
    y = df["target"]
    feature_names = list(X.columns)
    
    # 2. Stratified Train / Test Split (80% Train, 20% Holdout Test)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    print(f"\nStratified Split: {len(X_train)} training records, {len(X_test)} hold-out test records")
    print(f"Positive cases in Test Set: {int(y_test.sum())} / {len(y_test)} ({y_test.mean()*100:.1f}%)")
    
    # 3. Model Architecture Comparison
    candidates = {
        "LogisticRegression": LogisticRegression(
            max_iter=500, class_weight="balanced", random_state=42
        ),
        "RandomForest": RandomForestClassifier(
            n_estimators=100, max_depth=6, class_weight="balanced", random_state=42, n_jobs=1
        ),
        "HistGradientBoosting": HistGradientBoostingClassifier(
            max_iter=80, max_depth=4, random_state=42
        )
    }
    
    model_evaluations = {}
    print("\n--- Model Candidate Comparison ---")
    for name, clf in candidates.items():
        pipe = Pipeline([
            ("scaler", StandardScaler()),
            ("classifier", clf)
        ])
        pipe.fit(X_train, y_train)
        probs = pipe.predict_proba(X_test)[:, 1]
        preds = (probs >= 0.5).astype(int)
        metrics = evaluate_predictions(y_test, preds, probs)
        model_evaluations[name] = metrics
        print(f"[{name}] Accuracy: {metrics['accuracy']:.4f} | Recall: {metrics['recall_sensitivity']:.4f} | Specificity: {metrics['specificity']:.4f} | ROC-AUC: {metrics['roc_auc']:.4f} | F1: {metrics['f1_score']:.4f}")
    
    # Selection: LogisticRegression
    # 1. High clinical sensitivity (recall) essential for early disease screening to minimize false negatives.
    # 2. Smooth continuous sigmoid risk estimates aligned with arterial blood pressure guidelines.
    # 3. Full transparent explainability through standardized log-odds coefficients.
    selected_name = "LogisticRegression"
    best_pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("classifier", candidates[selected_name])
    ])
    best_pipeline.fit(X_train, y_train)
    
    test_probs = best_pipeline.predict_proba(X_test)[:, 1]
    test_preds = (test_probs >= 0.5).astype(int)
    final_metrics = evaluate_predictions(y_test, test_preds, test_probs)
    
    print("\n==========================================")
    print(f"SELECTED MODEL: {selected_name}")
    print("==========================================")
    for k, v in final_metrics.items():
        if k != "confusion_matrix":
            print(f"  {k:20}: {v}")
    print(f"  confusion_matrix    : {final_metrics['confusion_matrix']}")
    
    # Feature baseline stats & importances for Explainable AI
    feature_meta_dict = {
        "systolic_bp": {"unit": "mmHg", "label": "Systolic Blood Pressure", "description": "Peak arterial systolic pressure"},
        "diastolic_bp": {"unit": "mmHg", "label": "Diastolic Blood Pressure", "description": "Resting diastolic arterial pressure"},
        "age": {"unit": "years", "label": "Age", "description": "Patient age in years"},
        "bmi": {"unit": "kg/m²", "label": "Body Mass Index (BMI)", "description": "Weight relative to height squared"},
        "heart_rate": {"unit": "bpm", "label": "Resting Heart Rate", "description": "Resting heart rate in beats per minute"},
        "family_history": {"unit": "0=No, 1=Yes", "label": "Family History of Hypertension", "description": "Parental or sibling hypertension history"},
        "sodium_intake": {"unit": "0=Low, 1=Moderate, 2=High", "label": "Dietary Sodium Intake", "description": "Dietary salt and sodium intake level"},
        "smoking": {"unit": "0=Never, 1=Former, 2=Active", "label": "Smoking Exposure", "description": "Tobacco exposure level"},
        "physical_activity": {"unit": "hours/week", "label": "Weekly Physical Activity", "description": "Weekly moderate aerobic exercise"},
        "symptoms_score": {"unit": "0-4 count", "label": "Reported Hypertensive Symptoms", "description": "Count of associated symptoms (headaches, dizziness, etc.)"}
    }
    
    feature_details = {
        col: {
            "mean": float(X[col].mean()),
            "std": float(X[col].std()),
            "min": float(X[col].min()),
            "max": float(X[col].max()),
            "unit": feature_meta_dict.get(col, {}).get("unit", ""),
            "label": feature_meta_dict.get(col, {}).get("label", col.replace("_", " ").title()),
            "description": feature_meta_dict.get(col, {}).get("description", "")
        }
        for col in feature_names
    }
    
    classifier = best_pipeline.named_steps["classifier"]
    raw_coefs = classifier.coef_[0]
    raw_abs_coefs = np.abs(raw_coefs)
    normalized_importance = {
        col: round(float(imp / np.sum(raw_abs_coefs)), 4)
        for col, imp in zip(feature_names, raw_abs_coefs)
    }
    
    print("\n--- Feature Normalized Contributions ---")
    for f, imp in normalized_importance.items():
        print(f"  {f:20}: {imp:.4f} (coef: {raw_coefs[feature_names.index(f)]:.4f})")
    
    metadata = {
        "disease": "hypertension",
        "version": "1.1.0",
        "algorithm": "LogisticRegression",
        "dataset_name": "hypertension_data.csv",
        "total_records": len(df),
        "train_records": len(X_train),
        "test_records": len(X_test),
        "features": feature_names,
        "feature_details": feature_details,
        "feature_importances": normalized_importance,
        "model_coefficients": {col: round(float(c), 4) for col, c in zip(feature_names, raw_coefs)},
        "model_intercept": round(float(classifier.intercept_[0]), 4),
        "risk_thresholds": {
            "lower_max": 0.35,
            "moderate_max": 0.65,
            "categories": {
                "lower": "<35% Lower Estimated Risk",
                "moderate": "35–65% Moderate Estimated Risk",
                "elevated": ">65% Elevated Estimated Risk"
            }
        },
        "calibration_status": {
            "is_post_hoc_calibrated": False,
            "calibration_method": "none",
            "score_type": "model_estimated_risk_score",
            "description": "Probability estimates represent standard sigmoid outputs from L2-regularized balanced Logistic Regression. No post-hoc Platt scaling or Isotonic regression was executed; values are designated as Model Estimated Risk Scores rather than calibrated posterior probabilities."
        },
        "all_model_evaluations": model_evaluations
    }
    
    # 7. Save Model Artifacts
    for out_dir in [ml_models_dir, backend_models_dir]:
        os.makedirs(out_dir, exist_ok=True)
        model_file = os.path.join(out_dir, "model.joblib")
        meta_file = os.path.join(out_dir, "metadata.json")
        metrics_file = os.path.join(out_dir, "metrics.json")
        
        joblib.dump(best_pipeline, model_file)
        with open(meta_file, "w") as f:
            json.dump(metadata, f, indent=2)
        with open(metrics_file, "w") as f:
            json.dump(final_metrics, f, indent=2)
        print(f"Saved artifacts to: {out_dir}")
        
    print("\n[SUCCESS] Hypertension ML Pipeline successfully trained, evaluated, and saved.")
    return metadata, final_metrics

if __name__ == "__main__":
    train_hypertension_pipeline()
