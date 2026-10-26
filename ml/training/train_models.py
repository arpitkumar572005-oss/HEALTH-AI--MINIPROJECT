"""
HealthAI ML Training & Evaluation Pipeline
Trains and compares disease-specific risk screening models:
- Logistic Regression
- Random Forest
- Gradient Boosting

Evaluates precision, recall, specificity, F1-score, ROC-AUC, Brier score, and confusion matrix.
Saves reproducible models, scalers, metadata, and evaluation metrics.
"""

import json
import os
import shutil
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

def evaluate_model_performance(y_true, y_pred, y_prob):
    """Calculates comprehensive medical screening evaluation metrics."""
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

def train_screening_module(
    disease_name: str,
    data_path: str,
    feature_metadata: dict,
    model_dir: str,
    backend_model_dir: str
):
    print(f"\n==========================================")
    print(f"Training Model Suite for: {disease_name.upper()}")
    print(f"==========================================")
    
    df = pd.read_csv(data_path)
    X = df.drop(columns=["target"])
    y = df["target"]
    feature_names = list(X.columns)
    
    # 70% Train, 15% Validation, 15% Test
    X_train_val, X_test, y_train_val, y_test = train_test_split(
        X, y, test_size=0.15, random_state=42, stratify=y
    )
    X_train, X_val, y_train, y_val = train_test_split(
        X_train_val, y_train_val, test_size=0.1765, random_state=42, stratify=y_train_val
    )
    
    print(f"Dataset split -> Train: {len(X_train)}, Val: {len(X_val)}, Test: {len(X_test)}")
    
    # Candidate models
    candidates = {
        "LogisticRegression": LogisticRegression(max_iter=500, class_weight="balanced", random_state=42),
        "RandomForest": RandomForestClassifier(n_estimators=60, max_depth=6, min_samples_split=4, random_state=42, class_weight="balanced", n_jobs=1),
        "HistGradientBoosting": HistGradientBoostingClassifier(max_iter=60, max_depth=4, min_samples_leaf=10, random_state=42)
    }
    
    comparison_results = {}
    best_name = None
    best_score = -1
    best_pipeline = None
    
    for name, clf in candidates.items():
        pipeline = Pipeline([
            ("scaler", StandardScaler()),
            ("classifier", clf)
        ])
        
        # Train on train set
        pipeline.fit(X_train, y_train)
        
        # Validate on validation set
        val_probs = pipeline.predict_proba(X_val)[:, 1]
        val_preds = (val_probs >= 0.5).astype(int)
        val_metrics = evaluate_model_performance(y_val, val_preds, val_probs)
        
        print(f"[{name}] Val ROC-AUC: {val_metrics['roc_auc']:.4f} | F1: {val_metrics['f1_score']:.4f} | Recall: {val_metrics['recall_sensitivity']:.4f}")
        comparison_results[name] = val_metrics
        
        # Select best model based on ROC-AUC + Recall (critical in medical screening)
        composite_score = val_metrics["roc_auc"] * 0.6 + val_metrics["recall_sensitivity"] * 0.4
        if composite_score > best_score:
            best_score = composite_score
            best_name = name
            best_pipeline = pipeline

    print(f"--> Selected Best Architecture: {best_name}")
    
    # Refit best model on Train + Val combined, test on Hold-Out Test set
    best_pipeline.fit(X_train_val, y_train_val)
    test_probs = best_pipeline.predict_proba(X_test)[:, 1]
    test_preds = (test_probs >= 0.5).astype(int)
    final_test_metrics = evaluate_model_performance(y_test, test_preds, test_probs)
    
    print("\n--- Final Test Set Evaluation ---")
    for k, v in final_test_metrics.items():
        if k != "confusion_matrix":
            print(f"  {k}: {v}")
    print(f"  Confusion Matrix: {final_test_metrics['confusion_matrix']}")
    
    # Baseline stats for explainability
    feature_baselines = {
        col: {
            "mean": float(X[col].mean()),
            "std": float(X[col].std()),
            "min": float(X[col].min()),
            "max": float(X[col].max()),
            "unit": feature_metadata.get(col, {}).get("unit", ""),
            "label": feature_metadata.get(col, {}).get("label", col.replace("_", " ").title()),
            "description": feature_metadata.get(col, {}).get("description", "")
        }
        for col in feature_names
    }
    
    classifier = best_pipeline.named_steps["classifier"]
    if hasattr(classifier, "feature_importances_"):
        raw_importances = classifier.feature_importances_
    elif hasattr(classifier, "coef_"):
        raw_importances = np.abs(classifier.coef_[0])
    else:
        raw_importances = np.ones(len(feature_names)) / len(feature_names)
        
    normalized_importance = {
        col: round(float(imp / np.sum(raw_importances)), 4)
        for col, imp in zip(feature_names, raw_importances)
    }
    
    metadata = {
        "disease": disease_name,
        "version": "1.0.0",
        "algorithm": best_name,
        "features": feature_names,
        "feature_details": feature_baselines,
        "feature_importances": normalized_importance,
        "risk_thresholds": {
            "lower_max": 0.35,
            "moderate_max": 0.65
        },
        "all_model_evaluations": comparison_results
    }
    
    # Save artifacts
    for d in [model_dir, backend_model_dir]:
        os.makedirs(d, exist_ok=True)
        joblib.dump(best_pipeline, os.path.join(d, "model.joblib"))
        with open(os.path.join(d, "metadata.json"), "w") as f:
            json.dump(metadata, f, indent=2)
        with open(os.path.join(d, "metrics.json"), "w") as f:
            json.dump(final_test_metrics, f, indent=2)
            
    print(f"Artifacts successfully saved to {model_dir} and {backend_model_dir}")
    return metadata, final_test_metrics

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    datasets_dir = os.path.join(base_dir, "datasets")
    models_dir = os.path.join(base_dir, "models")
    backend_base = os.path.abspath(os.path.join(base_dir, "..", "backend", "app", "ml", "saved_models"))
    
    # Metadata for Diabetes
    diabetes_meta = {
        "age": {"unit": "years", "label": "Age", "description": "Patient age in years"},
        "gender": {"unit": "0=F, 1=M", "label": "Gender", "description": "Biological sex"},
        "bmi": {"unit": "kg/m²", "label": "Body Mass Index (BMI)", "description": "Ratio of weight to height squared"},
        "fasting_glucose": {"unit": "mg/dL", "label": "Fasting Blood Glucose", "description": "Blood sugar after overnight fasting"},
        "systolic_bp": {"unit": "mmHg", "label": "Systolic Blood Pressure", "description": "Peak arterial pressure during cardiac contraction"},
        "diastolic_bp": {"unit": "mmHg", "label": "Diastolic Blood Pressure", "description": "Resting arterial pressure between heartbeats"},
        "family_history": {"unit": "0=No, 1=Yes", "label": "Family History of Diabetes", "description": "First-degree relative diagnosed"},
        "physical_activity": {"unit": "hours/week", "label": "Physical Activity", "description": "Weekly moderate-to-vigorous exercise"},
        "symptoms_score": {"unit": "count (0-5)", "label": "Diabetes Symptoms Score", "description": "Reported classic symptoms (thirst, urination, fatigue)"}
    }
    
    # Metadata for Cardiovascular
    cardio_meta = {
        "age": {"unit": "years", "label": "Age", "description": "Patient age in years"},
        "gender": {"unit": "0=F, 1=M", "label": "Gender", "description": "Biological sex"},
        "systolic_bp": {"unit": "mmHg", "label": "Systolic Blood Pressure", "description": "Systolic pressure in mmHg"},
        "cholesterol": {"unit": "mg/dL", "label": "Total Cholesterol", "description": "Circulating total serum cholesterol"},
        "fasting_blood_sugar": {"unit": "0=Normal, 1=>120 mg/dL", "label": "Elevated Fasting Blood Sugar", "description": "Indicator of fasting hyperglycemia"},
        "heart_rate": {"unit": "bpm", "label": "Resting Heart Rate", "description": "Resting pulse in beats per minute"},
        "smoking": {"unit": "0=Never, 1=Former, 2=Active", "label": "Smoking Status", "description": "Tobacco exposure level"},
        "chest_discomfort": {"unit": "0=None to 3=Atypical", "label": "Chest Discomfort Severity", "description": "Exertional or resting chest sensation"},
        "bmi": {"unit": "kg/m²", "label": "Body Mass Index (BMI)", "description": "Weight relative to height"},
        "physical_activity": {"unit": "hours/week", "label": "Physical Activity", "description": "Weekly aerobic activity"}
    }
    
    # Metadata for Hypertension
    htn_meta = {
        "systolic_bp": {"unit": "mmHg", "label": "Systolic Blood Pressure", "description": "Systolic blood pressure"},
        "diastolic_bp": {"unit": "mmHg", "label": "Diastolic Blood Pressure", "description": "Diastolic blood pressure"},
        "age": {"unit": "years", "label": "Age", "description": "Age in years"},
        "bmi": {"unit": "kg/m²", "label": "Body Mass Index (BMI)", "description": "Body mass index"},
        "heart_rate": {"unit": "bpm", "label": "Resting Heart Rate", "description": "Resting heart rate in beats per minute"},
        "family_history": {"unit": "0=No, 1=Yes", "label": "Family History of Hypertension", "description": "Parental or sibling hypertension"},
        "sodium_intake": {"unit": "0=Low, 1=Moderate, 2=High", "label": "Dietary Sodium Intake", "description": "Self-reported daily salt consumption"},
        "smoking": {"unit": "0=Never, 1=Former, 2=Active", "label": "Smoking Status", "description": "Tobacco use pattern"},
        "physical_activity": {"unit": "hours/week", "label": "Physical Activity", "description": "Weekly exercise frequency"},
        "symptoms_score": {"unit": "count (0-4)", "label": "BP Related Symptoms", "description": "Headaches, dizziness, palpitations count"}
    }
    
    train_screening_module(
        "diabetes",
        os.path.join(datasets_dir, "diabetes_data.csv"),
        diabetes_meta,
        os.path.join(models_dir, "diabetes"),
        os.path.join(backend_base, "diabetes")
    )
    
    train_screening_module(
        "cardiovascular",
        os.path.join(datasets_dir, "cardiovascular_data.csv"),
        cardio_meta,
        os.path.join(models_dir, "cardiovascular"),
        os.path.join(backend_base, "cardiovascular")
    )
    
    train_screening_module(
        "hypertension",
        os.path.join(datasets_dir, "hypertension_data.csv"),
        htn_meta,
        os.path.join(models_dir, "hypertension"),
        os.path.join(backend_base, "hypertension")
    )
    print("\nAll 3 Screening Models Trained, Evaluated, and Exported Successfully!")
