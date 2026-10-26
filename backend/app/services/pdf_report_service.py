"""
PDF Screening Report Generator
Generates clean, professional medical screening reports using FPDF.
Follows strict non-diagnostic naming: 'AI Health Screening Report'.
"""

import io
from datetime import datetime
from fpdf import FPDF

class HealthAIReportPDF(FPDF):
    def header(self):
        # Top banner with primary blue
        self.set_fill_color(37, 99, 235) # #2563EB
        self.rect(0, 0, 210, 16, "F")
        
        self.set_text_color(255, 255, 255)
        self.set_font("Helvetica", "B", 11)
        self.set_xy(14, 4)
        self.cell(0, 8, "HealthAI  |  Don't just store health data - detect the signals early.", 0, 0, "L")
        self.ln(18)

    def footer(self):
        self.set_y(-18)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(148, 163, 184) # Slate 400
        self.cell(0, 6, "Confidential Health Screening Report  *  Not for Diagnostic Use", 0, 0, "L")
        self.cell(0, 6, f"Page {self.page_no()}", 0, 0, "R")

def clean_text(text: str) -> str:
    """Replaces unicode characters not present in standard latin-1 encoding."""
    if not text:
        return ""
    replacements = {
        "’": "'",
        "‘": "'",
        "“": '"',
        "”": '"',
        "—": "-",
        "–": "-",
        "•": "*",
        "²": "2",
        "°": " deg ",
        "✓": "[x]",
        "●": "*",
        "○": "o",
        "\u2022": "*",
        "\u2013": "-",
        "\u2014": "-",
        "\u2018": "'",
        "\u2019": "'",
        "\u201c": '"',
        "\u201d": '"',
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    return text.encode('latin-1', 'replace').decode('latin-1')

def generate_screening_pdf(screening_dict: dict, user_dict: dict) -> bytes:
    pdf = HealthAIReportPDF(orientation="P", unit="mm", format="A4")
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.add_page()
    
    # Title
    pdf.set_font("Helvetica", "B", 18)
    pdf.set_text_color(15, 23, 42) # Slate 900
    pdf.cell(0, 10, "AI HEALTH SCREENING REPORT", 0, 1, "L")
    
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(100, 116, 139) # Slate 500
    date_str = screening_dict.get("created_at", datetime.now().strftime("%Y-%m-%d %H:%M"))
    pdf.cell(0, 6, clean_text(f"Report Generated: {date_str}   |   Screening ID: {screening_dict.get('id', 'N/A')[:12]}"), 0, 1, "L")
    pdf.ln(4)
    
    # 1. Patient & Screening Metadata Card
    pdf.set_fill_color(248, 250, 252) # #F8FAFC
    pdf.set_draw_color(226, 232, 240) # #E2E8F0
    pdf.rect(14, pdf.get_y(), 182, 32, "FD")
    
    cur_y = pdf.get_y() + 4
    pdf.set_xy(18, cur_y)
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(85, 6, "Patient Information", 0, 0, "L")
    pdf.cell(85, 6, "Screening Details", 0, 1, "L")
    
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(71, 85, 105)
    
    pdf.set_xy(18, cur_y + 7)
    name = user_dict.get("full_name", "Anonymous User")
    age = screening_dict.get("input_data", {}).get("age", "N/A")
    gender = screening_dict.get("input_data", {}).get("gender", "N/A").title()
    bmi = screening_dict.get("input_data", {}).get("bmi", "N/A")
    pdf.cell(85, 5, clean_text(f"Name: {name}   |   Age: {age}   |   Gender: {gender}"), 0, 0, "L")
    
    scr_title = screening_dict.get("screening_title", "General Screening")
    model_ver = screening_dict.get("model_version", "v1.0.0")
    algo = screening_dict.get("algorithm", "Logistic Regression")
    pdf.cell(85, 5, clean_text(f"Type: {scr_title}"), 0, 1, "L")
    
    pdf.set_xy(18, cur_y + 13)
    pdf.cell(85, 5, clean_text(f"Calculated BMI: {bmi}"), 0, 0, "L")
    pdf.cell(85, 5, clean_text(f"Model: {algo} ({model_ver})"), 0, 1, "L")
    
    pdf.set_xy(14, cur_y + 24)
    pdf.ln(10)
    
    # 2. Risk Estimation Box
    category = screening_dict.get("risk_category", "lower").lower()
    score_pct = screening_dict.get("risk_score_percentage", int(screening_dict.get("risk_score", 0) * 100))
    
    if category == "elevated":
        box_bg = (254, 242, 242) # #FEF2F2
        box_border = (254, 202, 202) # #FECACA
        cat_text = "ELEVATED RISK"
        cat_color = (185, 28, 28) # #B91C1C
    elif category == "moderate":
        box_bg = (255, 251, 235) # #FFFBEB
        box_border = (253, 230, 138) # #FDE68A
        cat_text = "MODERATE RISK"
        cat_color = (180, 83, 9) # #B45309
    else:
        box_bg = (240, 253, 244) # #F0FDF4
        box_border = (187, 247, 208) # #BBF7D0
        cat_text = "LOWER RISK"
        cat_color = (21, 128, 61) # #15803D
        
    pdf.set_fill_color(*box_bg)
    pdf.set_draw_color(*box_border)
    box_start_y = pdf.get_y()
    pdf.rect(14, box_start_y, 182, 36, "FD")
    
    pdf.set_xy(18, box_start_y + 4)
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(100, 116, 139)
    pdf.cell(0, 5, "SCREENING RISK EVALUATION", 0, 1, "L")
    
    pdf.set_xy(18, box_start_y + 11)
    pdf.set_font("Helvetica", "B", 20)
    pdf.set_text_color(*cat_color)
    pdf.cell(70, 9, f"{score_pct}%", 0, 0, "L")
    
    pdf.set_xy(80, box_start_y + 12)
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(110, 8, clean_text(cat_text), 0, 1, "L")
    
    pdf.set_xy(18, box_start_y + 22)
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(51, 65, 85)
    summary_text = screening_dict.get("risk_summary", "Model risk assessment complete.")
    pdf.multi_cell(174, 4.5, clean_text(summary_text))
    
    pdf.set_y(box_start_y + 40)
    
    # Emergency banner if flagged
    if screening_dict.get("emergency_warning"):
        pdf.set_fill_color(254, 226, 226)
        pdf.set_draw_color(239, 68, 68)
        pdf.rect(14, pdf.get_y(), 182, 14, "FD")
        pdf.set_xy(18, pdf.get_y() + 2.5)
        pdf.set_font("Helvetica", "B", 9)
        pdf.set_text_color(185, 28, 28)
        pdf.multi_cell(174, 4.5, clean_text(screening_dict.get("emergency_message", "Please seek emergency attention if experiencing severe symptoms.")))
        pdf.ln(8)
        
    # 3. Contributing Factors Table
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 7, "Key Influencing Factors (Explainable AI)", 0, 1, "L")
    
    pdf.set_font("Helvetica", "I", 8)
    pdf.set_text_color(100, 116, 139)
    pdf.cell(0, 4, clean_text("These factors influenced the statistical model output; they do not establish medical causation or diagnosis."), 0, 1, "L")
    pdf.ln(3)
    
    # Table Header
    pdf.set_fill_color(241, 245, 249)
    pdf.set_font("Helvetica", "B", 8)
    pdf.set_text_color(71, 85, 105)
    pdf.cell(50, 6, "  Feature / Parameter", 1, 0, "L", True)
    pdf.cell(32, 6, "  Recorded Value", 1, 0, "L", True)
    pdf.cell(30, 6, "  Influence Direction", 1, 0, "L", True)
    pdf.cell(70, 6, "  Model Impact Context", 1, 1, "L", True)
    
    pdf.set_font("Helvetica", "", 8)
    pdf.set_text_color(51, 65, 85)
    
    contributions = screening_dict.get("feature_contributions", [])[:6]
    for item in contributions:
        feat_label = clean_text(item.get("label", item.get("feature", "N/A")))[:26]
        val_str = clean_text(f"{item.get('patient_value', '-')} {item.get('unit', '')}")[:16]
        direction = item.get("direction", "neutral").replace("_", " ").title()
        explanation = clean_text(item.get("explanation", ""))[:48]
        
        pdf.cell(50, 6, f"  {feat_label}", 1, 0, "L")
        pdf.cell(32, 6, f"  {val_str}", 1, 0, "L")
        pdf.cell(30, 6, f"  {direction}", 1, 0, "L")
        pdf.cell(70, 6, f"  {explanation}", 1, 1, "L")
        
    pdf.ln(5)
    
    # 4. General Next Steps (Non-prescriptive)
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 7, "Suggested Next Steps", 0, 1, "L")
    
    pdf.set_font("Helvetica", "", 8.5)
    pdf.set_text_color(51, 65, 85)
    guidance = screening_dict.get("general_guidance", [
        "Consider discussing this screening result with a qualified healthcare professional.",
        "Keep your health measurements updated to track trends over time."
    ])
    for step in guidance:
        pdf.cell(5, 5, "*", 0, 0, "R")
        pdf.cell(177, 5, clean_text(f" {step}"), 0, 1, "L")
        
    pdf.ln(5)
    
    # 5. Prominent Medical Disclaimer Box
    pdf.set_fill_color(248, 250, 252)
    pdf.set_draw_color(203, 213, 225)
    disc_y = pdf.get_y()
    pdf.rect(14, disc_y, 182, 22, "FD")
    
    pdf.set_xy(18, disc_y + 2.5)
    pdf.set_font("Helvetica", "B", 8)
    pdf.set_text_color(71, 85, 105)
    pdf.cell(0, 4, "IMPORTANT MEDICAL DISCLAIMER", 0, 1, "L")
    
    pdf.set_xy(18, disc_y + 7.5)
    pdf.set_font("Helvetica", "", 8)
    pdf.set_text_color(100, 116, 139)
    disclaimer = screening_dict.get(
        "medical_disclaimer",
        "This AI-generated result is intended for screening and educational purposes only "
        "and is not a medical diagnosis. Please consult a qualified healthcare professional "
        "for medical advice, diagnosis, or treatment."
    )
    pdf.multi_cell(174, 4, clean_text(disclaimer))
    
    # Output to byte buffer
    return bytes(pdf.output(dest='S').encode('latin-1'))
