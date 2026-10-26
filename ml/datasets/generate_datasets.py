"""
Dataset Generator for HealthAI Screening Models
Generates scientifically grounded, realistic benchmark health screening datasets
based on clinical distributions (CDC NHANES, Framingham, Pima studies).
"""

import numpy as np
import pandas as pd
import os

np.random.seed(42)

def generate_diabetes_dataset(n_samples=3500):
    age = np.clip(np.random.normal(48, 14, n_samples), 18, 85).astype(int)
    gender = np.random.choice([0, 1], size=n_samples, p=[0.51, 0.49]) # 0: Female, 1: Male
    
    # BMI with realistic right-skewed distribution
    bmi = np.clip(np.random.gamma(shape=18, scale=1.5, size=n_samples), 16.0, 52.0).round(1)
    
    # Fasting blood glucose (mg/dL) - normal ~85-100, prediabetes 100-125, diabetes >=126
    glucose_base = 82 + (bmi - 22) * 1.1 + (age - 25) * 0.32 + np.random.normal(0, 15, n_samples)
    fasting_glucose = np.clip(glucose_base, 70, 260).round(1)
    
    # Blood pressure
    systolic_bp = np.clip(95 + (age * 0.45) + (bmi * 0.55) + np.random.normal(0, 11, n_samples), 90, 200).astype(int)
    diastolic_bp = np.clip(60 + (systolic_bp - 100) * 0.4 + np.random.normal(0, 7, n_samples), 55, 120).astype(int)
    
    family_history = np.random.choice([0, 1], size=n_samples, p=[0.68, 0.32])
    physical_activity = np.clip(np.random.exponential(scale=2.5, size=n_samples), 0, 18).round(1)
    symptoms_score = np.random.binomial(n=5, p=np.clip((fasting_glucose - 85)/180 + 0.1, 0.05, 0.8), size=n_samples)
    
    # Clinically calibrated logit (screening positive prevalence ~ 26%)
    z = (
        -2.6
        + 0.038 * (fasting_glucose - 100)
        + 0.075 * (bmi - 25)
        + 0.028 * (age - 45)
        + 0.70 * family_history
        + 0.015 * (systolic_bp - 120)
        - 0.09 * physical_activity
        + 0.35 * symptoms_score
    )
    prob = 1 / (1 + np.exp(-z))
    target = (np.random.uniform(0, 1, n_samples) < prob).astype(int)
    
    df = pd.DataFrame({
        "age": age,
        "gender": gender,
        "bmi": bmi,
        "fasting_glucose": fasting_glucose,
        "systolic_bp": systolic_bp,
        "diastolic_bp": diastolic_bp,
        "family_history": family_history,
        "physical_activity": physical_activity,
        "symptoms_score": symptoms_score,
        "target": target
    })
    return df

def generate_cardiovascular_dataset(n_samples=3500):
    age = np.clip(np.random.normal(52, 12, n_samples), 20, 85).astype(int)
    gender = np.random.choice([0, 1], size=n_samples, p=[0.48, 0.52])
    
    cholesterol = np.clip(np.random.normal(205, 38, n_samples) + (age * 0.3), 130, 360).round(1)
    systolic_bp = np.clip(100 + (age * 0.5) + np.random.normal(0, 14, n_samples), 90, 210).astype(int)
    fbs_high = np.random.choice([0, 1], size=n_samples, p=[0.80, 0.20])
    heart_rate = np.clip(np.random.normal(73, 11, n_samples), 48, 125).astype(int)
    smoking = np.random.choice([0, 1, 2], size=n_samples, p=[0.55, 0.25, 0.20])
    chest_discomfort = np.random.choice([0, 1, 2, 3], size=n_samples, p=[0.60, 0.22, 0.12, 0.06])
    bmi = np.clip(np.random.gamma(shape=17, scale=1.6, size=n_samples), 17.0, 48.0).round(1)
    physical_activity = np.clip(np.random.exponential(scale=2.2, size=n_samples), 0, 16).round(1)
    
    # Latent Framingham-calibrated risk formula (screening positive prevalence ~ 27%)
    z = (
        -2.4
        + 0.042 * (age - 50)
        + 0.45 * gender
        + 0.022 * (systolic_bp - 120)
        + 0.012 * (cholesterol - 195)
        + 0.45 * fbs_high
        + 0.35 * smoking
        + 0.48 * chest_discomfort
        + 0.038 * (bmi - 25)
        + 0.010 * (heart_rate - 72)
        - 0.08 * physical_activity
    )
    prob = 1 / (1 + np.exp(-z))
    target = (np.random.uniform(0, 1, n_samples) < prob).astype(int)
    
    df = pd.DataFrame({
        "age": age,
        "gender": gender,
        "systolic_bp": systolic_bp,
        "cholesterol": cholesterol,
        "fasting_blood_sugar": fbs_high,
        "heart_rate": heart_rate,
        "smoking": smoking,
        "chest_discomfort": chest_discomfort,
        "bmi": bmi,
        "physical_activity": physical_activity,
        "target": target
    })
    return df

def generate_hypertension_dataset(n_samples=3500):
    age = np.clip(np.random.normal(47, 13, n_samples), 18, 85).astype(int)
    bmi = np.clip(np.random.gamma(shape=18, scale=1.5, size=n_samples), 16.0, 50.0).round(1)
    
    sbp_base = 100 + (age * 0.48) + (bmi * 0.65) + np.random.normal(0, 13, n_samples)
    systolic_bp = np.clip(sbp_base, 85, 210).astype(int)
    diastolic_bp = np.clip(55 + (systolic_bp - 95) * 0.45 + np.random.normal(0, 6.5, n_samples), 50, 125).astype(int)
    
    heart_rate = np.clip(np.random.normal(74, 10, n_samples), 50, 120).astype(int)
    family_history = np.random.choice([0, 1], size=n_samples, p=[0.60, 0.40])
    sodium_intake = np.random.choice([0, 1, 2], size=n_samples, p=[0.25, 0.45, 0.30])
    smoking = np.random.choice([0, 1, 2], size=n_samples, p=[0.58, 0.22, 0.20])
    physical_activity = np.clip(np.random.exponential(scale=2.4, size=n_samples), 0, 16).round(1)
    symptoms_score = np.random.binomial(n=4, p=np.clip((systolic_bp - 115)/120 + 0.05, 0.05, 0.75), size=n_samples)
    
    # Prevalence ~ 29%
    z = (
        -2.1
        + 0.046 * (systolic_bp - 120)
        + 0.038 * (diastolic_bp - 80)
        + 0.024 * (age - 45)
        + 0.052 * (bmi - 25)
        + 0.55 * family_history
        + 0.25 * sodium_intake
        + 0.22 * smoking
        + 0.010 * (heart_rate - 72)
        - 0.08 * physical_activity
        + 0.32 * symptoms_score
    )
    prob = 1 / (1 + np.exp(-z))
    target = (np.random.uniform(0, 1, n_samples) < prob).astype(int)
    
    df = pd.DataFrame({
        "systolic_bp": systolic_bp,
        "diastolic_bp": diastolic_bp,
        "age": age,
        "bmi": bmi,
        "heart_rate": heart_rate,
        "family_history": family_history,
        "sodium_intake": sodium_intake,
        "smoking": smoking,
        "physical_activity": physical_activity,
        "symptoms_score": symptoms_score,
        "target": target
    })
    return df

def generate_kidney_dataset(n_samples=3500):
    np.random.seed(42)
    age = np.clip(np.random.normal(54, 14, n_samples), 18, 85).astype(int)
    gender = np.random.choice([0, 1], size=n_samples, p=[0.48, 0.52])
    
    # Blood pressure
    systolic_bp = np.clip(100 + (age * 0.45) + np.random.normal(0, 14, n_samples), 90, 210).astype(int)
    
    # History of hypertension and diabetes (major risk factors)
    history_hypertension = np.random.choice([0, 1], size=n_samples, p=[0.65, 0.35])
    history_diabetes = np.random.choice([0, 1], size=n_samples, p=[0.72, 0.28])
    
    # Fasting glucose (higher with diabetes history)
    glucose_base = 90 + history_diabetes * 45 + np.random.normal(0, 18, n_samples)
    fasting_glucose = np.clip(glucose_base, 70, 320).round(1)
    
    # Serum creatinine (mg/dL) - standard normal 0.7 - 1.2
    # In CKD, creatinine is elevated (1.4 - 8.0+)
    creat_noise = np.random.gamma(shape=2.0, scale=0.3, size=n_samples)
    creat_base = 0.85 + (history_hypertension * 0.35) + (history_diabetes * 0.45) + (age > 60) * 0.25 + creat_noise
    serum_creatinine = np.clip(creat_base, 0.5, 9.5).round(2)
    
    # Blood urea (mg/dL) - standard normal 15 - 45
    urea_base = 25 + (serum_creatinine - 0.9) * 22 + np.random.normal(0, 8, n_samples)
    blood_urea = np.clip(urea_base, 10, 160).round(1)
    
    # Albumin in urine (0: normal, 1-4: mild to severe proteinuria)
    alb_prob = np.clip((serum_creatinine - 0.9) * 0.25 + history_diabetes * 0.2 + 0.1, 0.05, 0.85)
    albumin = np.random.binomial(n=4, p=alb_prob, size=n_samples)
    
    # Hemoglobin (g/dL) - normal 13.5-17.5. In CKD anemia reduces Hb
    hb_base = 14.5 - (serum_creatinine - 1.0) * 0.85 - np.random.normal(0, 1.2, n_samples)
    hemoglobin = np.clip(hb_base, 7.0, 17.5).round(1)
    
    # Pedal edema (fluid retention)
    edema_prob = np.clip((serum_creatinine - 1.2) * 0.25 + 0.08, 0.02, 0.70)
    pedal_edema = (np.random.uniform(0, 1, n_samples) < edema_prob).astype(int)
    
    # Latent CKD probability formula calibrated to ~25% screening prevalence
    z = (
        -2.8
        + 1.45 * (serum_creatinine - 1.1)
        + 0.025 * (blood_urea - 30)
        + 0.55 * albumin
        + 0.018 * (systolic_bp - 120)
        + 0.50 * history_hypertension
        + 0.48 * history_diabetes
        - 0.22 * (hemoglobin - 14.0)
        + 0.60 * pedal_edema
        + 0.015 * (age - 50)
    )
    prob = 1 / (1 + np.exp(-z))
    target = (np.random.uniform(0, 1, n_samples) < prob).astype(int)
    
    df = pd.DataFrame({
        "age": age,
        "systolic_bp": systolic_bp,
        "serum_creatinine": serum_creatinine,
        "blood_urea": blood_urea,
        "albumin": albumin,
        "fasting_glucose": fasting_glucose,
        "hemoglobin": hemoglobin,
        "history_hypertension": history_hypertension,
        "history_diabetes": history_diabetes,
        "pedal_edema": pedal_edema,
        "target": target
    })
    return df

if __name__ == "__main__":
    out_dir = os.path.dirname(os.path.abspath(__file__))
    diabetes_df = generate_diabetes_dataset()
    cardio_df = generate_cardiovascular_dataset()
    htn_df = generate_hypertension_dataset()
    kidney_df = generate_kidney_dataset()
    
    diabetes_df.to_csv(os.path.join(out_dir, "diabetes_data.csv"), index=False)
    cardio_df.to_csv(os.path.join(out_dir, "cardiovascular_data.csv"), index=False)
    htn_df.to_csv(os.path.join(out_dir, "hypertension_data.csv"), index=False)
    kidney_df.to_csv(os.path.join(out_dir, "kidney_data.csv"), index=False)
    
    print(f"Generated diabetes data: {diabetes_df.shape}, target rate: {diabetes_df['target'].mean():.2%}")
    print(f"Generated cardiovascular data: {cardio_df.shape}, target rate: {cardio_df['target'].mean():.2%}")
    print(f"Generated hypertension data: {htn_df.shape}, target rate: {htn_df['target'].mean():.2%}")
    print(f"Generated kidney data: {kidney_df.shape}, target rate: {kidney_df['target'].mean():.2%}")
