"""
HealthAI ML Inference and Explainability Service
Loads trained pipelines, runs statistical screening inference,
computes explainable feature contributions, checks safety flags,
and enforces non-diagnostic medical screening language.
"""

import os
import json
import logging
import numpy as np
import pandas as pd
import joblib

logger = logging.getLogger(__name__)

DISCLAIMER_TEXT = (
    "This AI-generated result is intended for screening and educational purposes only "
    "and is not a medical diagnosis. Please consult a qualified healthcare professional "
    "for medical advice, diagnosis, or treatment."
)

EMERGENCY_TEXT = (
    "If you are experiencing severe, sudden, or rapidly worsening symptoms, "
    "seek urgent medical attention or contact local emergency services."
)

class ModelRegistry:
    def __init__(self):
        self.models = {}
        self.metadata = {}
        self.metrics = {}
        self.base_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "saved_models")
        self.load_models()

    def load_models(self):
        diseases = ["diabetes", "cardiovascular", "kidney", "hypertension"]
        for disease in diseases:
            disease_dir = os.path.join(self.base_dir, disease)
            model_path = os.path.join(disease_dir, "model.joblib")
            meta_path = os.path.join(disease_dir, "metadata.json")
            metrics_path = os.path.join(disease_dir, "metrics.json")
            
            if os.path.exists(model_path) and os.path.exists(meta_path):
                try:
                    self.models[disease] = joblib.load(model_path)
                    with open(meta_path, "r") as f:
                        self.metadata[disease] = json.load(f)
                    if os.path.exists(metrics_path):
                        with open(metrics_path, "r") as f:
                            self.metrics[disease] = json.load(f)
                    logger.info(f"Loaded {disease} screening model version {self.metadata[disease].get('version')}")
                except Exception as e:
                    logger.error(f"Failed to load model for {disease}: {e}")
            else:
                logger.warning(f"Model artifacts not found at {disease_dir}")

    def get_model(self, disease: str):
        return self.models.get(disease)

    def get_metadata(self, disease: str):
        return self.metadata.get(disease, {})

    def get_metrics(self, disease: str):
        return self.metrics.get(disease, {})

# Global registry instance
registry = ModelRegistry()

def calculate_bmi(height_cm: float, weight_kg: float) -> float:
    if not height_cm or not weight_kg or height_cm <= 0:
        return 24.5 # population baseline
    h_m = height_cm / 100.0
    return round(weight_kg / (h_m * h_m), 1)

def explain_feature_contributions(disease: str, input_dict: dict, meta: dict) -> list:
    """
    Computes mathematical instance-level feature contributions using
    z-score standardized deviations from population baselines weighted by model importances.
    """
    features = meta.get("features", [])
    feature_details = meta.get("feature_details", {})
    feature_importances = meta.get("feature_importances", {})
    
    raw_effects = []
    
    for feat in features:
        val = float(input_dict.get(feat, 0))
        details = feature_details.get(feat, {})
        mean = details.get("mean", 0.0)
        std = details.get("std", 1.0)
        unit = details.get("unit", "")
        label = details.get("label", feat.replace("_", " ").title())
        importance = feature_importances.get(feat, 0.1)
        
        # Standardized shift
        z = (val - mean) / (std if std > 0 else 1.0)
        raw_effect = z * importance
        
        # Protective features invert direction (e.g. physical activity or optimal hemoglobin decreases risk)
        if feat in ["physical_activity", "hemoglobin"]:
            raw_effect = -raw_effect
            
        direction = "neutral"
        if raw_effect > 0.05:
            direction = "increases_risk"
        elif raw_effect < -0.05:
            direction = "decreases_risk"
            
        raw_effects.append({
            "feature": feat,
            "label": label,
            "raw_abs": abs(raw_effect),
            "signed_effect": raw_effect,
            "direction": direction,
            "patient_value": round(val, 1) if isinstance(val, float) else val,
            "baseline_value": round(mean, 1),
            "unit": unit
        })
        
    total_magnitude = sum(item["raw_abs"] for item in raw_effects) or 1.0
    
    # Sort by contribution impact
    raw_effects.sort(key=lambda x: x["raw_abs"], reverse=True)
    
    contributions = []
    for item in raw_effects:
        normalized_contrib = round(item["raw_abs"] / total_magnitude, 3)
        val = item["patient_value"]
        unit = item["unit"]
        feat = item["feature"]
        
        # Clean non-diagnostic explanation strictly attributing impact to model's estimated risk
        if item["direction"] == "increases_risk":
            explanation = f"{item['label']} ({val} {unit}) is higher than baseline and contributed to the model's estimated risk."
        elif item["direction"] == "decreases_risk":
            explanation = f"{item['label']} ({val} {unit}) is in a favorable range relative to baseline and moderated the model's estimated risk."
        else:
            explanation = f"{item['label']} ({val} {unit}) aligns closely with population reference levels."
            
        contributions.append({
            "feature": feat,
            "label": item["label"],
            "contribution": normalized_contrib,
            "direction": item["direction"],
            "patient_value": val,
            "unit": unit,
            "baseline_value": item["baseline_value"],
            "explanation": explanation
        })
        
    return contributions

def run_diabetes_screening(data: Any) -> dict:
    if hasattr(data, "model_dump"):
        data = data.model_dump()
    model = registry.get_model("diabetes")
    meta = registry.get_metadata("diabetes")
    if model is None:
        registry.load_models()
        model = registry.get_model("diabetes")
        meta = registry.get_metadata("diabetes")
    if model is None:
        raise ValueError("Diabetes ML screening model is currently unavailable on this server.")
    
    # Auto-calculate BMI if needed
    bmi = data.get("bmi")
    if not bmi and data.get("height_cm") and data.get("weight_kg"):
        bmi = calculate_bmi(data["height_cm"], data["weight_kg"])
    if not bmi:
        bmi = 25.0
        
    gender_code = 1 if data.get("gender", "").lower() in ["male", "m"] else 0
    symptoms = data.get("symptoms", [])
    symptoms_score = min(len(symptoms), 5)
    
    features_dict = {
        "age": float(data.get("age", 45)),
        "gender": float(gender_code),
        "bmi": float(bmi),
        "fasting_glucose": float(data.get("fasting_glucose", 95)),
        "systolic_bp": float(data.get("systolic_bp", 120)),
        "diastolic_bp": float(data.get("diastolic_bp", 80)),
        "family_history": 1.0 if data.get("family_history") else 0.0,
        "physical_activity": float(data.get("physical_activity_hours", 2.5)),
        "symptoms_score": float(symptoms_score)
    }
    
    features_order = meta.get("features", list(features_dict.keys()))
    X_df = pd.DataFrame([[features_dict[f] for f in features_order]], columns=features_order)
    
    # Predict calibrated probability
    risk_score = float(model.predict_proba(X_df)[0][1])
    risk_pct = int(round(risk_score * 100))
    
    # Categorize
    if risk_score < 0.35:
        category = "lower"
        heading = "Lower Diabetes Risk Detected"
        summary = "Based on the provided metrics and lifestyle factors, the model-estimated diabetes screening risk is lower."
    elif risk_score <= 0.65:
        category = "moderate"
        heading = "Moderate Diabetes Risk Detected"
        summary = "Certain metrics, such as glucose levels or family history, place this screening in a moderate risk category."
    else:
        category = "elevated"
        heading = "Elevated Diabetes Risk Detected"
        summary = "Elevated diabetes screening risk detected based on elevated fasting blood glucose, BMI, or associated factors. Further professional evaluation may be appropriate."
        
    # Emergency flags: Very high or low glucose
    emergency = False
    emergency_msg = None
    if features_dict["fasting_glucose"] >= 300 or features_dict["fasting_glucose"] <= 50:
        emergency = True
        emergency_msg = EMERGENCY_TEXT
        
    contributions = explain_feature_contributions("diabetes", features_dict, meta)
    
    guidance = [
        "Consider discussing this screening result with a qualified healthcare professional.",
        "Maintain periodic monitoring of your fasting blood glucose and blood pressure.",
        "Engage in regular aerobic physical activity as recommended by your physician.",
        "Keep your HealthAI health records updated to track trends over time."
    ]
    
    return {
        "screening_type": "diabetes",
        "screening_title": "Diabetes Risk Screening",
        "model_version": meta.get("version", "1.0.0"),
        "algorithm": meta.get("algorithm", "Logistic Regression"),
        "risk_score": round(risk_score, 4),
        "risk_score_percentage": risk_pct,
        "risk_category": category,
        "risk_heading": heading,
        "risk_summary": summary,
        "feature_contributions": contributions,
        "general_guidance": guidance,
        "emergency_warning": emergency,
        "emergency_message": emergency_msg,
        "medical_disclaimer": DISCLAIMER_TEXT,
        "input_data": data
    }

def run_cardiovascular_screening(data: Any) -> dict:
    if hasattr(data, "model_dump"):
        data = data.model_dump()
    model = registry.get_model("cardiovascular")
    meta = registry.get_metadata("cardiovascular")
    if model is None:
        registry.load_models()
        model = registry.get_model("cardiovascular")
        meta = registry.get_metadata("cardiovascular")
    if model is None:
        raise ValueError("Cardiovascular ML screening model is currently unavailable on this server.")
    
    bmi = data.get("bmi")
    if not bmi and data.get("height_cm") and data.get("weight_kg"):
        bmi = calculate_bmi(data["height_cm"], data["weight_kg"])
    if not bmi:
        bmi = 25.0
        
    gender_code = 1 if data.get("gender", "").lower() in ["male", "m"] else 0
    
    # Smoking mapping
    smk = data.get("smoking_status", "never").lower()
    smoking_code = 2 if smk == "active" else (1 if smk == "former" else 0)
    
    fbs_high = 1 if float(data.get("fasting_glucose", 95)) > 120 else 0
    chest_disc = int(data.get("chest_discomfort_level", 0))
    
    features_dict = {
        "age": float(data.get("age", 50)),
        "gender": float(gender_code),
        "systolic_bp": float(data.get("systolic_bp", 120)),
        "cholesterol": float(data.get("cholesterol", 200)),
        "fasting_blood_sugar": float(fbs_high),
        "heart_rate": float(data.get("heart_rate", 72)),
        "smoking": float(smoking_code),
        "chest_discomfort": float(chest_disc),
        "bmi": float(bmi),
        "physical_activity": float(data.get("physical_activity_hours", 2.5))
    }
    
    features_order = meta.get("features", list(features_dict.keys()))
    X_df = pd.DataFrame([[features_dict[f] for f in features_order]], columns=features_order)
    
    risk_score = float(model.predict_proba(X_df)[0][1])
    risk_pct = int(round(risk_score * 100))
    
    if risk_score < 0.35:
        category = "lower"
        heading = "Lower Estimated Risk Detected"
        summary = "Model-estimated cardiovascular risk score is in the lower screening category (<35%) based on submitted blood pressure and lipid metrics."
    elif risk_score <= 0.65:
        category = "moderate"
        heading = "Moderate Estimated Risk Detected"
        summary = "Model-estimated cardiovascular risk score is in the moderate screening category (35% to 65%). Several cardiovascular factors show moderate variance from optimal baselines."
    else:
        category = "elevated"
        heading = "Elevated Estimated Risk Detected"
        summary = "Model-estimated cardiovascular risk score is in the elevated screening category (>65%). Further professional cardiovascular evaluation may be appropriate."
        
    emergency = False
    emergency_msg = None
    if chest_disc >= 2 or features_dict["systolic_bp"] >= 180:
        emergency = True
        emergency_msg = EMERGENCY_TEXT
        
    contributions = explain_feature_contributions("cardiovascular", features_dict, meta)
    
    guidance = [
        "Consider sharing this AI screening result with a certified cardiologist or primary physician.",
        "If recommended by your doctor, evaluate comprehensive lipid profiling (HDL, LDL, Triglycerides).",
        "Avoid tobacco smoke and follow heart-healthy nutritional patterns.",
        "Log resting heart rate and blood pressure regularly in your HealthAI dashboard."
    ]
    
    return {
        "screening_type": "cardiovascular",
        "screening_title": "Cardiovascular Risk Screening",
        "model_version": meta.get("version", "1.1.0"),
        "algorithm": meta.get("algorithm", "Logistic Regression"),
        "risk_score": round(risk_score, 4),
        "risk_score_percentage": risk_pct,
        "risk_category": category,
        "risk_heading": heading,
        "risk_summary": summary,
        "feature_contributions": contributions,
        "general_guidance": guidance,
        "emergency_warning": emergency,
        "emergency_message": emergency_msg,
        "medical_disclaimer": DISCLAIMER_TEXT,
        "input_data": data
    }

def run_hypertension_screening(data: Any) -> dict:
    if hasattr(data, "model_dump"):
        data = data.model_dump()
    model = registry.get_model("hypertension")
    meta = registry.get_metadata("hypertension")
    if model is None:
        registry.load_models()
        model = registry.get_model("hypertension")
        meta = registry.get_metadata("hypertension")
    if model is None:
        raise ValueError("Hypertension ML screening model is currently unavailable on this server.")
    
    bmi = data.get("bmi")
    if not bmi and data.get("height_cm") and data.get("weight_kg"):
        bmi = calculate_bmi(data["height_cm"], data["weight_kg"])
    if not bmi:
        bmi = 25.0
        
    sodium_str = data.get("sodium_intake", "moderate").lower()
    sodium_code = 2 if sodium_str == "high" else (1 if sodium_str == "moderate" else 0)
    
    smk = data.get("smoking_status", "never").lower()
    smoking_code = 2 if smk == "active" else (1 if smk == "former" else 0)
    
    symptoms = data.get("symptoms", [])
    symptoms_score = min(len(symptoms), 4)
    
    features_dict = {
        "systolic_bp": float(data.get("systolic_bp", 120)),
        "diastolic_bp": float(data.get("diastolic_bp", 80)),
        "age": float(data.get("age", 45)),
        "bmi": float(bmi),
        "heart_rate": float(data.get("heart_rate", 72)),
        "family_history": 1.0 if data.get("family_history") else 0.0,
        "sodium_intake": float(sodium_code),
        "smoking": float(smoking_code),
        "physical_activity": float(data.get("physical_activity_hours", 2.5)),
        "symptoms_score": float(symptoms_score)
    }
    
    features_order = meta.get("features", list(features_dict.keys()))
    X_df = pd.DataFrame([[features_dict[f] for f in features_order]], columns=features_order)
    
    risk_score = float(model.predict_proba(X_df)[0][1])
    risk_pct = int(round(risk_score * 100))
    
    if risk_score < 0.35:
        category = "lower"
        heading = "Lower Estimated Risk Detected"
        summary = "Model-estimated hypertension risk score is in the lower screening category (<35%) based on submitted blood pressure and lifestyle metrics."
    elif risk_score <= 0.65:
        category = "moderate"
        heading = "Moderate Estimated Risk Detected"
        summary = "Model-estimated hypertension risk score is in the moderate screening category (35% to 65%). Blood pressure readings or family history indicate borderline elevation."
    else:
        category = "elevated"
        heading = "Elevated Estimated Risk Detected"
        summary = "Model-estimated hypertension risk score is in the elevated screening category (>65%). Further professional cardiovascular evaluation may be appropriate."
        
    emergency = False
    emergency_msg = None
    if features_dict["systolic_bp"] >= 180 or features_dict["diastolic_bp"] >= 120:
        emergency = True
        emergency_msg = (
            "Your reported blood pressure meets criteria for hypertensive urgency or crisis "
            "(systolic >= 180 mmHg or diastolic >= 120 mmHg). If accompanied by headache, chest discomfort, "
            "shortness of breath, or visual changes, please seek emergency medical evaluation immediately."
        )
        
    contributions = explain_feature_contributions("hypertension", features_dict, meta)
    
    guidance = [
        "Consider scheduling a blood pressure verification check with a healthcare provider.",
        "Take resting blood pressure readings at consistent times of day, noting systolic and diastolic values.",
        "Consider dietary moderation of sodium and alcohol intake in alignment with medical guidance.",
        "Continue logging blood pressure measurements in HealthAI to track trends over time."
    ]
    
    return {
        "screening_type": "hypertension",
        "screening_title": "Hypertension Risk Screening",
        "model_version": meta.get("version", "1.1.0"),
        "algorithm": meta.get("algorithm", "Logistic Regression"),
        "risk_score": round(risk_score, 4),
        "risk_score_percentage": risk_pct,
        "risk_category": category,
        "risk_heading": heading,
        "risk_summary": summary,
        "feature_contributions": contributions,
        "general_guidance": guidance,
        "emergency_warning": emergency,
        "emergency_message": emergency_msg,
        "medical_disclaimer": DISCLAIMER_TEXT,
        "input_data": data
    }

def run_kidney_screening(data: Any) -> dict:
    if hasattr(data, "model_dump"):
        data = data.model_dump()
    model = registry.get_model("kidney")
    meta = registry.get_metadata("kidney")
    if model is None:
        registry.load_models()
        model = registry.get_model("kidney")
        meta = registry.get_metadata("kidney")
    if model is None:
        raise ValueError("Chronic Kidney Disease ML screening model is currently unavailable on this server.")
    
    features_dict = {
        "age": float(data.get("age", 50)),
        "systolic_bp": float(data.get("systolic_bp", 120)),
        "serum_creatinine": float(data.get("serum_creatinine", 0.9)),
        "blood_urea": float(data.get("blood_urea", 28.0)),
        "albumin": float(data.get("albumin", 0.0)),
        "fasting_glucose": float(data.get("fasting_glucose", 95.0)),
        "hemoglobin": float(data.get("hemoglobin", 14.5)),
        "history_hypertension": 1.0 if data.get("history_hypertension") else 0.0,
        "history_diabetes": 1.0 if data.get("history_diabetes") else 0.0,
        "pedal_edema": 1.0 if data.get("pedal_edema") else 0.0,
    }
    
    features_order = meta.get("features", list(features_dict.keys()))
    X_df = pd.DataFrame([[features_dict[f] for f in features_order]], columns=features_order)
    
    risk_score = float(model.predict_proba(X_df)[0][1])
    risk_pct = int(round(risk_score * 100))
    
    if risk_score < 0.35:
        category = "lower"
        heading = "Lower Estimated Risk Detected"
        summary = "Model-estimated chronic kidney disease risk score is in the lower screening category (<35%) based on submitted renal and blood pressure metrics."
    elif risk_score <= 0.65:
        category = "moderate"
        heading = "Moderate Estimated Risk Detected"
        summary = "Model-estimated chronic kidney disease risk score is in the moderate screening category (35% to 65%). Borderline serum creatinine or associated risk factors were observed."
    else:
        category = "elevated"
        heading = "Elevated Estimated Risk Detected"
        summary = "Model-estimated chronic kidney disease risk score is in the elevated screening category (>65%). Notable elevation in renal markers indicates further clinical evaluation is recommended."
        
    emergency = False
    emergency_msg = None
    if features_dict["serum_creatinine"] >= 4.5 or (features_dict["systolic_bp"] >= 180 and features_dict["pedal_edema"] == 1.0):
        emergency = True
        emergency_msg = (
            "Markedly elevated serum creatinine or severe fluid retention with severe hypertension "
            "may indicate acute renal impairment. Seek prompt medical evaluation."
        )
        
    contributions = explain_feature_contributions("kidney", features_dict, meta)
    
    guidance = [
        "Consult a qualified healthcare provider for comprehensive renal function testing (eGFR and urinalysis).",
        "Maintain adequate daily hydration unless specifically restricted by your physician.",
        "Routinely monitor blood pressure and blood glucose, as both significantly influence kidney health.",
        "Avoid unverified over-the-counter NSAIDs (such as high-dose ibuprofen) that can stress renal function."
    ]
    
    return {
        "screening_type": "kidney",
        "screening_title": "Chronic Kidney Disease Risk Screening",
        "model_version": meta.get("version", "1.0.0"),
        "algorithm": meta.get("algorithm", "Calibrated Logistic Regression"),
        "risk_score": round(risk_score, 4),
        "risk_score_percentage": risk_pct,
        "risk_category": category,
        "risk_heading": heading,
        "risk_summary": summary,
        "feature_contributions": contributions,
        "general_guidance": guidance,
        "emergency_warning": emergency,
        "emergency_message": emergency_msg,
        "medical_disclaimer": DISCLAIMER_TEXT,
        "input_data": data
    }
