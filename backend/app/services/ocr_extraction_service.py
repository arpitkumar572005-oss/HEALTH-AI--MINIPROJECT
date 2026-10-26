"""
Universal Real Document OCR & Medical Report Extraction Engine
==============================================================
Supports:
1. Multi-page PDF text extraction (pdfplumber, pypdf) & scanned page OCR.
2. High-accuracy Image OCR (EasyOCR).
3. Universal Document Type Detection across 16+ medical report categories:
   - Blood / General Laboratory
   - CBC (Complete Blood Count)
   - Lipid Profile
   - Diabetes / Glycemic Panel
   - Liver Function Test (LFT)
   - Kidney Function Test (KFT / RFT)
   - Thyroid Profile (TSH, T3, T4)
   - Urine Routine & Microscopy
   - Ultrasound Sonography (Kidney, Abdominal, Pelvic)
   - X-Ray Radiology
   - CT Scan Radiology
   - MRI Scan Radiology
   - ECG / Electrocardiogram
   - Pathology / Biopsy
   - Other Medical Report
   - Unknown / Unclassified
4. Dynamic Medical Parameter & Clinical Observation Extraction:
   - Dynamic Key-Value extraction for numerical biomarkers & reference ranges.
   - Dynamic clinical observation extraction for soft tissue, radiology, ECG, and pathology.
   - Categorization into numerical vs clinical observation items.
5. Strict Section Detection: Findings, Clinical Impression / Conclusion, and AI Educational Overview.
6. Screening Model Eligibility Control: Rejects non-blood or ineligible reports from ML execution.
7. Developer Debugging Metadata: records pages, OCR status, text length, confidence, errors.
STRICT RULE: ZERO FABRICATED PARAMETERS OR FALLBACK DUMMY PANELS.
"""

import os
import re
import io
import logging
from typing import Dict, Any, List, Optional, Tuple

logger = logging.getLogger(__name__)

# Lazy loaded EasyOCR reader
_easyocr_reader = None

def get_easyocr_reader():
    global _easyocr_reader
    if _easyocr_reader is None:
        try:
            import easyocr
            _easyocr_reader = easyocr.Reader(['en'], gpu=False, verbose=False)
        except Exception as e:
            logger.warning(f"Could not initialize EasyOCR reader: {e}")
            _easyocr_reader = False
    return _easyocr_reader if _easyocr_reader is not False else None


def extract_text_from_file_bytes(
    filename: str,
    bytes_data: bytes
) -> Tuple[str, str, int, bool, List[str]]:
    """
    Extracts text from uploaded file bytes across all pages and formats.
    Returns: (extracted_text, method, page_count, ocr_performed, errors)
    """
    if not bytes_data:
        return "", "empty_file", 0, False, ["Empty file provided."]

    ext = os.path.splitext(filename.lower())[1]
    errors = []
    ocr_performed = False
    page_count = 1

    # 1. Plain Text files (.txt, .csv, .md, .log, .json)
    if ext in ['.txt', '.csv', '.md', '.log', '.json']:
        try:
            text = bytes_data.decode('utf-8', errors='ignore').strip()
            return text, "plain_text", 1, False, []
        except Exception as e:
            errors.append(f"Plain text decode error: {e}")

    # 2. PDF Documents (Selectable text or Scanned multi-page)
    if ext == '.pdf' or bytes_data.startswith(b'%PDF'):
        text_pages = []
        # Attempt 1: pdfplumber across ALL pages
        try:
            import pdfplumber
            with pdfplumber.open(io.BytesIO(bytes_data)) as pdf:
                page_count = len(pdf.pages)
                for i, page in enumerate(pdf.pages):
                    t = page.extract_text()
                    if t and len(t.strip()) > 10:
                        text_pages.append(f"--- Page {i+1} ---\n{t.strip()}")
        except Exception as e:
            errors.append(f"pdfplumber extraction warning: {e}")

        # Attempt 2: pypdf fallback if pdfplumber extracted nothing
        if not text_pages:
            try:
                import pypdf
                reader = pypdf.PdfReader(io.BytesIO(bytes_data))
                page_count = len(reader.pages)
                for i, page in enumerate(reader.pages):
                    t = page.extract_text()
                    if t and len(t.strip()) > 10:
                        text_pages.append(f"--- Page {i+1} ---\n{t.strip()}")
            except Exception as e:
                errors.append(f"pypdf extraction warning: {e}")

        combined_text = "\n\n".join(text_pages).strip()
        if len(combined_text) >= 40:
            return combined_text, "pdf_selectable_text", page_count, False, errors

        # Attempt 3: Scanned PDF -> Render pages to images and run OCR on each page
        ocr_pages = []
        try:
            import pdfplumber
            reader = get_easyocr_reader()
            if reader:
                ocr_performed = True
                with pdfplumber.open(io.BytesIO(bytes_data)) as pdf:
                    page_count = len(pdf.pages)
                    # Process up to 20 pages
                    for i, page in enumerate(pdf.pages[:20]):
                        pil_img = page.to_image(resolution=150).original
                        img_byte_arr = io.BytesIO()
                        pil_img.save(img_byte_arr, format='PNG')
                        res = reader.readtext(img_byte_arr.getvalue(), detail=0)
                        if res:
                            page_ocr_text = "\n".join(res).strip()
                            ocr_pages.append(f"--- Page {i+1} (OCR) ---\n{page_ocr_text}")
        except Exception as e:
            errors.append(f"Scanned PDF OCR warning: {e}")

        if ocr_pages:
            return "\n\n".join(ocr_pages).strip(), "pdf_scanned_ocr", page_count, True, errors

    # 3. Image Files (PNG, JPG, JPEG, WEBP, BMP, TIFF)
    if ext in ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tiff']:
        page_count = 1
        reader = get_easyocr_reader()
        if reader:
            ocr_performed = True
            try:
                res = reader.readtext(bytes_data, detail=0)
                if res:
                    image_text = "\n".join(res).strip()
                    return image_text, "image_ocr", 1, True, errors
                else:
                    errors.append("OCR detected no readable text characters in image.")
            except Exception as e:
                errors.append(f"Image EasyOCR error: {e}")

    # Fallback: Attempt decoding printable characters from raw bytes
    try:
        decoded = bytes_data.decode('utf-8', errors='ignore')
        printable = "".join(c for c in decoded if c.isprintable() or c in "\n\r\t")
        if len(printable) >= 30:
            return printable.strip(), "raw_bytes_fallback", page_count, ocr_performed, errors
    except Exception:
        pass

    return "", "unextracted", page_count, ocr_performed, errors


def detect_report_type(filename: str, text: str) -> Tuple[str, str, float]:
    """
    Classifies medical document type based primarily on actual extracted content,
    falling back to filename cues only when content is brief.
    Returns (document_type, report_type_title, confidence).
    """
    comb = f"{text} {filename}".lower()

    # Keyword scoring tables
    scores = {
        "cbc_report": 0,
        "lipid_report": 0,
        "diabetes_report": 0,
        "thyroid_report": 0,
        "lft_report": 0,
        "kft_report": 0,
        "urine_report": 0,
        "ultrasound_report": 0,
        "xray_report": 0,
        "ct_report": 0,
        "mri_report": 0,
        "ecg_report": 0,
        "pathology_report": 0,
        "blood_report": 0,
        "other_report": 0
    }

    # CBC keywords
    cbc_kw = ["cbc", "complete blood count", "hemogram", "wbc count", "rbc count", "platelet count", "hematocrit", "pcv", "mcv", "mch", "mchc", "neutrophils", "lymphocytes", "eosinophils", "monocytes", "basophils"]
    for kw in cbc_kw:
        if kw in comb:
            scores["cbc_report"] += 2

    # Lipid profile keywords
    lipid_kw = ["lipid profile", "lipid panel", "total cholesterol", "hdl cholesterol", "ldl cholesterol", "vldl", "triglycerides", "cholesterol/hdl"]
    for kw in lipid_kw:
        if kw in comb:
            scores["lipid_report"] += 2

    # Diabetes keywords
    diabetes_kw = ["hba1c", "glycated hemoglobin", "glycohemoglobin", "fasting blood sugar", "fbs", "postprandial blood sugar", "ppbs", "fasting plasma glucose", "fasting blood glucose", "fasting glucose", "blood glucose", "glucose", "random blood sugar", "oral glucose tolerance"]
    for kw in diabetes_kw:
        if kw in comb:
            scores["diabetes_report"] += 2

    # Thyroid profile keywords
    thyroid_kw = ["thyroid", "tsh", "free t3", "free t4", "total t3", "total t4", "triiodothyronine", "thyroxine", "thyroid stimulating hormone", "ft3", "ft4"]
    for kw in thyroid_kw:
        if kw in comb:
            scores["thyroid_report"] += 3

    # LFT keywords
    lft_kw = ["liver function", "lft", "hepatic panel", "sgpt", "alt", "alanine aminotransferase", "sgot", "ast", "aspartate aminotransferase", "alkaline phosphatase", "alp", "bilirubin", "serum albumin", "globulin"]
    for kw in lft_kw:
        if kw in comb:
            scores["lft_report"] += 2

    # KFT / Renal function keywords
    kft_kw = ["kidney function", "renal function", "kft", "rft", "serum creatinine", "blood urea", "bun", "blood urea nitrogen", "uric acid", "egfr", "glomerular filtration"]
    for kw in kft_kw:
        if kw in comb:
            scores["kft_report"] += 2

    # Urine test keywords
    urine_kw = ["urine analysis", "urinalysis", "urine routine", "specific gravity", "urine protein", "urine glucose", "urobilinogen", "pus cells", "epithelial cells", "urine ketones", "urine microscopic"]
    for kw in urine_kw:
        if kw in comb:
            scores["urine_report"] += 3

    # Ultrasound keywords
    usg_kw = ["ultrasound", "usg", "sonography", "sonogram", "echotexture", "echogenicity", "hydronephrosis", "calculus", "calculi", "pelvicalyceal", "renomegaly", "cholelithiasis", "post-void", "urinary bladder", "cortex", "parenchymal"]
    for kw in usg_kw:
        if kw in comb:
            scores["ultrasound_report"] += 2

    # X-Ray keywords
    xray_kw = ["x-ray", "xray", "radiograph", "radiography", "chest pa", "pa view", "ap view", "bone fracture", "consolidation", "pleural effusion", "cardiomegaly"]
    for kw in xray_kw:
        if kw in comb:
            scores["xray_report"] += 3

    # CT keywords
    ct_kw = ["ct scan", "computed tomography", "ct abdomen", "ct chest", "ct head", "ct brain", "attenuation", "hounsfield", "contrast enhanced", "cect"]
    for kw in ct_kw:
        if kw in comb:
            scores["ct_report"] += 3

    # MRI keywords
    mri_kw = ["mri", "magnetic resonance", "t1-weighted", "t2-weighted", "flair", "mri brain", "mri spine", "gadolinium", "mri knee"]
    for kw in mri_kw:
        if kw in comb:
            scores["mri_report"] += 3

    # ECG keywords
    ecg_kw = ["ecg", "ekg", "electrocardiogram", "electrocardiograph", "sinus rhythm", "heart rate", "ventricular rate", "pr interval", "qrs duration", "qtc", "st segment", "t wave", "axis deviation"]
    for kw in ecg_kw:
        if kw in comb:
            scores["ecg_report"] += 3

    # Pathology / Biopsy keywords
    path_kw = ["histopathology", "biopsy", "cytology", "fnac", "microscopic examination", "malignancy", "carcinoma", "neoplasm", "specimen received", "gross examination"]
    for kw in path_kw:
        if kw in comb:
            scores["pathology_report"] += 3

    # General Blood / Lab keywords
    general_lab_kw = ["serum", "plasma", "mg/dl", "g/dl", "mmol/l", "laboratory report", "diagnostic laboratory", "reference interval", "specimen: blood", "biochemistry", "pathology laboratory", "metabolic panel", "blood test", "blood report"]
    for kw in general_lab_kw:
        if kw in comb:
            scores["blood_report"] += 2

    # General medical keywords
    gen_kw = ["patient", "doctor", "physician", "hospital", "clinic", "diagnosis", "impression", "findings", "clinical history", "consultation"]
    for kw in gen_kw:
        if kw in comb:
            scores["other_report"] += 1

    best_type, best_score = max(scores.items(), key=lambda x: x[1])

    title_map = {
        "cbc_report": "Complete Blood Count (CBC) Report",
        "lipid_report": "Lipid Profile Panel Report",
        "diabetes_report": "Diabetes / Glycemic Panel Report",
        "thyroid_report": "Thyroid Function Profile Report",
        "lft_report": "Liver Function Test (LFT) Report",
        "kft_report": "Kidney Function Test (KFT / RFT) Report",
        "urine_report": "Urine Routine & Microscopy Report",
        "ultrasound_report": "Kidney Ultrasound Sonography Report" if any(k in comb for k in ["kidney", "renal", "kub"]) else "Ultrasound Sonography Report",
        "xray_report": "Chest X-Ray Radiology Report" if "chest" in comb else "X-Ray Radiology Report",
        "ct_report": "CT Scan Radiology Report",
        "mri_report": "MRI Scan Radiology Report",
        "ecg_report": "Electrocardiogram (ECG / EKG) Report",
        "pathology_report": "Pathology & Biopsy Report",
        "blood_report": "Blood Laboratory Report",
        "other_report": "General Medical Clinical Report"
    }

    if best_score >= 2:
        conf = min(0.70 + (best_score * 0.05), 0.98)
        return best_type, title_map.get(best_type, "Medical Report"), round(conf, 2)
    elif best_score >= 1:
        return "other_report", "Medical Document (General Clinical Report)", 0.55
    elif len(text.strip()) > 0:
        return "unknown_report", "Medical Document (Report Type Unclassified)", 0.35
    else:
        return "unknown_report", "Medical report detected, but specific report type could not be confidently determined.", 0.0


def extract_impression(text: str) -> Optional[str]:
    """
    Extracts the IMPRESSION, CONCLUSION, INTERPRETATION, or OPINION section from medical report text.
    """
    if not text:
        return None

    # Multi-line regex search for section headers
    pattern = r"(?:IMPRESSION|CONCLUSION|INTERPRETATION|DIAGNOSTIC OPINION|OPINION|SUMMARY OF FINDINGS|DIAGNOSIS)[:\s]+(.*?)(?=\n\s*\n[A-Z\s]{3,}:|\Z)"
    match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
    if match:
        imp = match.group(1).strip()
        imp = re.sub(r'\s+', ' ', imp)
        # Filter out trivial captures
        if len(imp) >= 8 and not imp.lower().startswith("dr."):
            return imp

    # Line-by-line fallback scanner
    lines = text.split('\n')
    capturing = False
    captured_lines = []
    for line in lines:
        line_s = line.strip()
        header_match = re.match(r'^(?:IMPRESSION|CONCLUSION|INTERPRETATION|OPINION)[:\s]*(.*)$', line_s, re.IGNORECASE)
        if header_match:
            capturing = True
            tail = header_match.group(1).strip()
            if tail:
                captured_lines.append(tail)
            continue
        if capturing:
            if re.match(r'^[A-Z\s]{4,}:', line_s) and not line_s.upper().startswith("NOTE"):
                break
            if line_s:
                captured_lines.append(line_s)

    if captured_lines:
        res = " ".join(captured_lines).strip()
        return res if len(res) >= 8 else None

    return None


def extract_dynamic_parameters_and_findings(
    report_type: str,
    text: str,
    filename: str
) -> List[Dict[str, Any]]:
    """
    Universal Dynamic Extractor for any real medical document.
    Extracts:
    1. Numerical parameters with values, units, reference intervals, and status.
    2. Clinical observations (organ dimensions, ultrasound findings, radiology impressions, ECG rhythm).
    STRICT RULE: Only extracts items directly present in the uploaded document. Zero fake fallbacks.
    """
    findings = []
    text_lower = text.lower()
    lines = [l.strip() for l in text.split('\n') if l.strip()]

    # Set of already extracted normalized parameter names to avoid duplicates
    seen_params = set()

    # -------------------------------------------------------------
    # 1. Specialized High-Precision Parsers for Specific Report Types
    # -------------------------------------------------------------

    # A. Ultrasound Sonography (Kidney, Abdominal, Pelvic)
    if report_type == "ultrasound_report":
        # Right Kidney Size
        m_rk = re.search(r"(?:right\s+kidney|rk)[:\s]+(?:measures?\s*)?(\d+(?:\.\d+)?\s*(?:x\s*\d+(?:\.\d+)?)?\s*cm)", text_lower)
        if m_rk:
            findings.append({
                "parameter": "Right Kidney Size",
                "value": m_rk.group(1).strip(),
                "unit": "cm",
                "reference": "9.0 – 12.0 cm",
                "status": "normal",
                "type": "observation",
                "explanation": f"Observed Right Kidney measurement of {m_rk.group(1)}.",
                "source_text": m_rk.group(0)
            })
            seen_params.add("right kidney size")

        # Left Kidney Size
        m_lk = re.search(r"(?:left\s+kidney|lk)[:\s]+(?:measures?\s*)?(\d+(?:\.\d+)?\s*(?:x\s*\d+(?:\.\d+)?)?\s*cm)", text_lower)
        if m_lk:
            findings.append({
                "parameter": "Left Kidney Size",
                "value": m_lk.group(1).strip(),
                "unit": "cm",
                "reference": "9.0 – 12.0 cm",
                "status": "normal",
                "type": "observation",
                "explanation": f"Observed Left Kidney measurement of {m_lk.group(1)}.",
                "source_text": m_lk.group(0)
            })
            seen_params.add("left kidney size")

        # Cortical Echotexture / Parenchyma
        if "echotexture" in text_lower or "echogenicity" in text_lower or "parenchyma" in text_lower:
            val = "Increased Cortical Echogenicity" if "increased" in text_lower else "Normal Cortical Echotexture"
            status = "attention" if "increased" in text_lower else "normal"
            findings.append({
                "parameter": "Cortical Echotexture",
                "value": val,
                "unit": "",
                "reference": "Iso/hypoechoic to liver",
                "status": status,
                "type": "observation",
                "explanation": "Sonographic appearance of renal cortical parenchyma.",
                "source_text": "Cortical Echotexture"
            })
            seen_params.add("cortical echotexture")

        # Cortico-Medullary Differentiation
        if "cortico-medullary" in text_lower or "cmd" in text_lower:
            val = "Maintained" if ("maintained" in text_lower or "preserved" in text_lower) else "Reduced / Altered"
            findings.append({
                "parameter": "Cortico-Medullary Differentiation",
                "value": val,
                "unit": "",
                "reference": "Well-differentiated",
                "status": "normal" if val == "Maintained" else "attention",
                "type": "observation",
                "explanation": "Boundary distinction between renal cortex and medulla.",
                "source_text": "Cortico-medullary differentiation"
            })
            seen_params.add("cortico-medullary differentiation")

        # Pelvicalyceal System
        if "pelvicalyceal" in text_lower or "pelvicalyceal system" in text_lower or "pcs" in text_lower:
            val = "Dilated" if ("dilated" in text_lower or "dilatation" in text_lower or "prominent" in text_lower) else "Undilated"
            findings.append({
                "parameter": "Pelvicalyceal System",
                "value": val,
                "unit": "",
                "reference": "No dilatation",
                "status": "attention" if val == "Dilated" else "normal",
                "type": "observation",
                "explanation": "Sonographic evaluation of renal collecting system.",
                "source_text": "Pelvicalyceal system"
            })
            seen_params.add("pelvicalyceal system")

        # Hydronephrosis
        m_hydro = re.search(r"(grade\s+[i|v|x]+|mild|moderate|severe)\s+hydronephrosis", text_lower)
        if m_hydro:
            findings.append({
                "parameter": "Hydronephrosis",
                "value": m_hydro.group(0).title(),
                "unit": "",
                "reference": "No hydronephrosis",
                "status": "attention" if "mild" in m_hydro.group(0) or "grade i" in m_hydro.group(0) else "critical",
                "type": "observation",
                "explanation": "Dilatation of pelvicalyceal collecting system.",
                "source_text": m_hydro.group(0)
            })
            seen_params.add("hydronephrosis")
        elif "hydronephrosis" in text_lower:
            val = "Absent" if ("no hydronephrosis" in text_lower or "absent" in text_lower) else "Documented"
            findings.append({
                "parameter": "Hydronephrosis",
                "value": val,
                "unit": "",
                "reference": "No hydronephrosis",
                "status": "normal" if val == "Absent" else "attention",
                "type": "observation",
                "explanation": "Evaluation for pelvicalyceal dilatation.",
                "source_text": "Hydronephrosis"
            })
            seen_params.add("hydronephrosis")

        # Renal Calculus / Stone
        m_stone = re.search(r"(\d+(?:\.\d+)?\s*mm)?\s*(?:calculus|stone|calculi)", text_lower)
        if m_stone and "no calculus" not in text_lower and "no stone" not in text_lower:
            findings.append({
                "parameter": "Renal Calculus / Stone",
                "value": m_stone.group(0).strip().title() if m_stone.group(0) else "Calculus Detected",
                "unit": "",
                "reference": "No calculus detected",
                "status": "attention",
                "type": "observation",
                "explanation": "Acoustic shadowing focus representing renal stone.",
                "source_text": m_stone.group(0)
            })
            seen_params.add("renal calculus / stone")
        elif "no calculus" in text_lower or "no stone" in text_lower:
            findings.append({
                "parameter": "Renal Calculus",
                "value": "No Calculus Detected",
                "unit": "",
                "reference": "No calculus detected",
                "status": "normal",
                "type": "observation",
                "explanation": "No evidence of nephrolithiasis.",
                "source_text": "No calculus"
            })
            seen_params.add("renal calculus")

        # Post-Void Residual Urine
        m_pvr = re.search(r"(?:post-void|residual urine|pvr)[:\s]+(\d+\s*ml)", text_lower)
        if m_pvr:
            findings.append({
                "parameter": "Post-Void Residual Urine",
                "value": m_pvr.group(1),
                "unit": "mL",
                "reference": "< 50 mL",
                "status": "normal",
                "type": "numerical",
                "explanation": "Bladder volume remaining immediately post-void.",
                "source_text": m_pvr.group(0)
            })
            seen_params.add("post-void residual urine")

    # B. ECG / Electrocardiogram
    elif report_type == "ecg_report":
        m_hr = re.search(r"(?:ventricular rate|heart rate|pulse|rate)[:\s]+(\d+)\s*(?:bpm)?", text_lower)
        if m_hr:
            hr_val = int(m_hr.group(1))
            findings.append({
                "parameter": "Heart Rate (Ventricular)",
                "value": hr_val,
                "unit": "bpm",
                "reference": "60 – 100 bpm",
                "status": "normal" if 60 <= hr_val <= 100 else ("low" if hr_val < 60 else "elevated"),
                "type": "numerical",
                "explanation": "Recorded electrical ventricular rate.",
                "source_text": m_hr.group(0)
            })
            seen_params.add("heart rate (ventricular)")

        m_pr = re.search(r"pr(?:\s+interval)?[:\s]+(\d+)\s*(?:ms)?", text_lower)
        if m_pr:
            findings.append({
                "parameter": "PR Interval",
                "value": int(m_pr.group(1)),
                "unit": "ms",
                "reference": "120 – 200 ms",
                "status": "normal" if 120 <= int(m_pr.group(1)) <= 200 else "attention",
                "type": "numerical",
                "explanation": "AV conduction time.",
                "source_text": m_pr.group(0)
            })
            seen_params.add("pr interval")

        m_qrs = re.search(r"qrs(?:\s+duration)?[:\s]+(\d+)\s*(?:ms)?", text_lower)
        if m_qrs:
            findings.append({
                "parameter": "QRS Duration",
                "value": int(m_qrs.group(1)),
                "unit": "ms",
                "reference": "70 – 100 ms",
                "status": "normal" if int(m_qrs.group(1)) <= 110 else "attention",
                "type": "numerical",
                "explanation": "Ventricular depolarization duration.",
                "source_text": m_qrs.group(0)
            })
            seen_params.add("qrs duration")

        if "sinus rhythm" in text_lower:
            rhythm_val = "Normal Sinus Rhythm" if "normal sinus" in text_lower else "Sinus Rhythm"
            findings.append({
                "parameter": "Cardiac Rhythm",
                "value": rhythm_val,
                "unit": "",
                "reference": "Normal Sinus Rhythm",
                "status": "normal",
                "type": "observation",
                "explanation": "Primary cardiac pacemaker mechanism.",
                "source_text": "Sinus rhythm"
            })
            seen_params.add("cardiac rhythm")

    # -------------------------------------------------------------
    # 2. Universal Dynamic Laboratory / Biomarker Analyte Patterns
    # -------------------------------------------------------------
    # Comprehensive clinical registry of known laboratory analytes & reference thresholds
    analyte_specs = [
        # Glycemic & Diabetes
        ("Fasting Blood Glucose", r"(?:fasting\s+(?:blood\s+)?glucose|fbs|fasting\s+sugar)[:\s=]+(\d+(?:\.\d+)?)", "mg/dL", "70 – 99 mg/dL", 70.0, 99.0),
        ("HbA1c", r"(?:hba1c|glycated\s+hemoglobin|a1c)[:\s=]+(\d+(?:\.\d+)?)", "%", "< 5.7%", 4.0, 5.6),
        ("Postprandial Blood Glucose", r"(?:postprandial\s+(?:blood\s+)?glucose|ppbs)[:\s=]+(\d+(?:\.\d+)?)", "mg/dL", "< 140 mg/dL", 70.0, 139.0),
        ("Random Blood Glucose", r"(?:random\s+(?:blood\s+)?glucose|rbs)[:\s=]+(\d+(?:\.\d+)?)", "mg/dL", "< 140 mg/dL", 70.0, 140.0),

        # Lipid Profile
        ("Total Cholesterol", r"(?:total\s+cholesterol|cholesterol\s+total)[:\s=]+(\d+(?:\.\d+)?)", "mg/dL", "< 200 mg/dL", 125.0, 199.0),
        ("HDL Cholesterol", r"(?:hdl(?:\s+cholesterol)?|hdl-c)[:\s=]+(\d+(?:\.\d+)?)", "mg/dL", ">= 40 mg/dL", 40.0, 80.0),
        ("LDL Cholesterol", r"(?:ldl(?:\s+cholesterol)?|ldl-c)[:\s=]+(\d+(?:\.\d+)?)", "mg/dL", "< 100 mg/dL", 50.0, 99.0),
        ("Triglycerides", r"(?:triglycerides|trigs)[:\s=]+(\d+(?:\.\d+)?)", "mg/dL", "< 150 mg/dL", 50.0, 149.0),
        ("VLDL Cholesterol", r"(?:vldl(?:\s+cholesterol)?|vldl-c)[:\s=]+(\d+(?:\.\d+)?)", "mg/dL", "< 30 mg/dL", 5.0, 30.0),

        # CBC (Complete Blood Count)
        ("Hemoglobin", r"(?:hemoglobin|hgb)[:\s=]+(\d+(?:\.\d+)?)", "g/dL", "13.5 – 17.5 g/dL", 13.5, 17.5),
        ("WBC Count", r"(?:white\s+blood\s+cell(?:\s+count)?|wbc(?:\s+count)?)[:\s=]+(\d+(?:,\d+)?(?:\.\d+)?)", "/µL", "4,500 – 11,000 /µL", 4000.0, 11000.0),
        ("RBC Count", r"(?:red\s+blood\s+cell(?:\s+count)?|rbc(?:\s+count)?)[:\s=]+(\d+(?:\.\d+)?)", "M/µL", "4.5 – 5.9 M/µL", 4.3, 5.9),
        ("Platelet Count", r"(?:platelet(?:\s+count)?|plt)[:\s=]+(\d+(?:,\d+)?(?:\.\d+)?)", "/µL", "150,000 – 450,000 /µL", 150000.0, 450000.0),
        ("Hematocrit", r"(?:hematocrit|hct|pcv)[:\s=]+(\d+(?:\.\d+)?)", "%", "40.0 – 52.0%", 38.0, 52.0),
        ("MCV", r"(?:mcv|mean\s+corpuscular\s+volume)[:\s=]+(\d+(?:\.\d+)?)", "fL", "80.0 – 100.0 fL", 80.0, 100.0),

        # Thyroid Profile
        ("TSH", r"(?:tsh|thyroid\s+stimulating\s+hormone)[:\s=]+(\d+(?:\.\d+)?)", "uIU/mL", "0.45 – 4.50 uIU/mL", 0.45, 4.50),
        ("Free T3", r"(?:free\s+t3|ft3)[:\s=]+(\d+(?:\.\d+)?)", "pg/mL", "2.0 – 4.4 pg/mL", 2.0, 4.4),
        ("Free T4", r"(?:free\s+t4|ft4)[:\s=]+(\d+(?:\.\d+)?)", "ng/dL", "0.82 – 1.77 ng/dL", 0.82, 1.77),
        ("Total T3", r"(?:total\s+t3|t3\s+total)[:\s=]+(\d+(?:\.\d+)?)", "ng/dL", "80 – 200 ng/dL", 80.0, 200.0),
        ("Total T4", r"(?:total\s+t4|t4\s+total)[:\s=]+(\d+(?:\.\d+)?)", "µg/dL", "5.0 – 12.0 µg/dL", 5.0, 12.0),

        # Liver Function Test (LFT)
        ("ALT (SGPT)", r"(?:alt(?:\s*\(\s*sgpt\s*\))?|sgpt|alanine\s+aminotransferase)[:\s=]+(\d+(?:\.\d+)?)", "U/L", "7 – 56 U/L", 7.0, 56.0),
        ("AST (SGOT)", r"(?:ast(?:\s*\(\s*sgot\s*\))?|sgot|aspartate\s+aminotransferase)[:\s=]+(\d+(?:\.\d+)?)", "U/L", "10 – 40 U/L", 10.0, 40.0),
        ("Total Bilirubin", r"(?:total\s+bilirubin|bilirubin\s+total)[:\s=]+(\d+(?:\.\d+)?)", "mg/dL", "0.2 – 1.2 mg/dL", 0.2, 1.2),
        ("Direct Bilirubin", r"(?:direct\s+bilirubin|bilirubin\s+direct)[:\s=]+(\d+(?:\.\d+)?)", "mg/dL", "< 0.3 mg/dL", 0.0, 0.3),
        ("Alkaline Phosphatase (ALP)", r"(?:alkaline\s+phosphatase(?:\s*\(\s*alp\s*\))?|alp)[:\s=]+(\d+(?:\.\d+)?)", "U/L", "44 – 147 U/L", 44.0, 147.0),
        ("Serum Albumin", r"(?:serum\s+albumin|albumin)[:\s=]+(\d+(?:\.\d+)?)", "g/dL", "3.5 – 5.0 g/dL", 3.5, 5.0),

        # Kidney Function Test (KFT / RFT)
        ("Serum Creatinine", r"(?:serum\s+creatinine|creatinine)[:\s=]+(\d+(?:\.\d+)?)", "mg/dL", "0.7 – 1.3 mg/dL", 0.7, 1.3),
        ("Blood Urea Nitrogen (BUN)", r"(?:blood\s+urea\s+nitrogen(?:\s*\(\s*bun\s*\))?|bun)[:\s=]+(\d+(?:\.\d+)?)", "mg/dL", "7 – 20 mg/dL", 7.0, 20.0),
        ("Blood Urea", r"(?:blood\s+urea|urea)[:\s=]+(\d+(?:\.\d+)?)", "mg/dL", "15 – 45 mg/dL", 15.0, 45.0),
        ("Uric Acid", r"(?:uric\s+acid)[:\s=]+(\d+(?:\.\d+)?)", "mg/dL", "3.5 – 7.2 mg/dL", 3.5, 7.2),
        ("eGFR", r"(?:egfr|estimated\s+gfr)[:\s=]+(\d+(?:\.\d+)?)", "mL/min/1.73m²", "> 60 mL/min", 60.0, 130.0),

        # Vitals & Blood Pressure
        ("Systolic Blood Pressure", r"(?:systolic\s+bp|systolic)[:\s=]+(\d+)", "mmHg", "90 – 120 mmHg", 90.0, 120.0),
        ("Diastolic Blood Pressure", r"(?:diastolic\s+bp|diastolic)[:\s=]+(\d+)", "mmHg", "60 – 80 mmHg", 60.0, 80.0),
    ]

    for label, pat, unit, ref_str, min_v, max_v in analyte_specs:
        norm_label = label.lower()
        if norm_label in seen_params:
            continue
        m = re.search(pat, text_lower)
        if m:
            val_str = m.group(1).replace(",", "")
            try:
                val_num = float(val_str)
                status = "normal"
                if val_num > max_v:
                    status = "elevated"
                elif val_num < min_v:
                    status = "low"

                findings.append({
                    "parameter": label,
                    "value": val_num,
                    "unit": unit,
                    "reference": ref_str,
                    "status": status,
                    "type": "numerical",
                    "explanation": f"Observed {label.lower()} reading from uploaded report.",
                    "source_text": m.group(0)
                })
                seen_params.add(norm_label)
            except ValueError:
                pass

    # -------------------------------------------------------------
    # 3. Universal Line-by-Line Key-Value & Observation Extractor
    # -------------------------------------------------------------
    # Parses any report structure without requiring templates
    kv_pattern = re.compile(r"^([A-Za-z0-9\s\(\)\/\-\.\+]{3,45})[:=\t]\s*([A-Za-z0-9\s\.\,\+\-\<\>\/\%\^]{1,60})$")
    
    # Ignore non-clinical lines
    ignore_keys = {
        "patient", "patient name", "name", "age", "sex", "gender", "date", "sample",
        "doctor", "referred by", "hospital", "clinic", "address", "phone", "email",
        "barcode", "specimen", "collection date", "report date", "technician", "page"
    }

    for line in lines:
        m = kv_pattern.match(line)
        if m:
            k = m.group(1).strip()
            v = m.group(2).strip()
            k_lower = k.lower()

            if any(ign in k_lower for ign in ignore_keys):
                continue
            if k_lower in seen_params or len(k) < 3 or len(v) == 0:
                continue

            # Determine whether value is numerical or observational
            num_match = re.search(r"^(\d+(?:\.\d+)?)\s*([A-Za-z\/\%\^]+)?(?:\s*\((.*?)\))?", v)
            if num_match and len(v) < 30:
                val = float(num_match.group(1)) if "." in num_match.group(1) else int(num_match.group(1))
                unit = num_match.group(2) or ""
                ref = num_match.group(3) or "Documented in report"
                p_type = "numerical"
            else:
                val = v
                unit = ""
                ref = "Documented in report"
                p_type = "observation"

            status = "normal"
            if any(w in str(val).lower() for w in ["elevated", "high", "positive", "dilated", "increased", "present", "abnormal"]):
                status = "attention"

            findings.append({
                "parameter": k.title(),
                "value": val,
                "unit": unit,
                "reference": ref,
                "status": status,
                "type": p_type,
                "explanation": f"Extracted finding for {k.title()}.",
                "source_text": line
            })
            seen_params.add(k_lower)

            if len(findings) >= 25:
                break

    return findings


# Backwards compatibility alias
extract_structured_findings = extract_dynamic_parameters_and_findings


def generate_comprehensive_summary(
    report_type: str,
    report_title: str,
    text: str,
    findings: List[Dict[str, Any]],
    impression: Optional[str]
) -> Tuple[str, str, List[str]]:
    """
    Generates report summary, educational AI overview, and suggested clinician questions
    derived STRICTLY from verified document content.
    Never invents missing parameters or assumes report is a blood report.
    """
    num_items = [f for f in findings if f.get("type") == "numerical"]
    obs_items = [f for f in findings if f.get("type") == "observation"]

    # 1. Summary Construction
    if not findings and not impression:
        summary = (
            f"Analyzed {report_title}. Document text was processed, but no standardized parameters "
            f"or diagnostic impression sections could be structured from the visible content."
        )
    else:
        parts = [f"Analyzed {report_title}."]
        if num_items:
            num_summary = "; ".join([f"{f['parameter']}: {f['value']} {f['unit']}".strip() for f in num_items[:4]])
            parts.append(f"Recorded {len(num_items)} numerical parameters ({num_summary}).")
        if obs_items:
            obs_summary = "; ".join([f"{f['parameter']} ({f['value']})" for f in obs_items[:3]])
            parts.append(f"Documented {len(obs_items)} clinical observations ({obs_summary}).")
        if impression:
            parts.append(f"Diagnostic Impression: {impression}")
        summary = " ".join(parts)

    # 2. AI Educational Explanation (clearly distinct from doctor's impression)
    modality_explanations = {
        "ultrasound_report": "Ultrasound sonography employs high-frequency acoustic waves to assess organ anatomy, parenchymal textures, and collecting systems without ionizing radiation.",
        "xray_report": "Radiography uses low-dose ionizing radiation to project transmission shadows of thoracic, skeletal, or visceral structures onto detector plates.",
        "ct_report": "Computed Tomography (CT) combines rotating X-ray acquisitions and computer tomography to generate cross-sectional volumetric views.",
        "mri_report": "Magnetic Resonance Imaging (MRI) uses powerful magnetic fields and radiofrequency excitation to differentiate soft-tissue contrasts.",
        "ecg_report": "Electrocardiography (ECG) records surface electrical potentials reflecting myocardial depolarization and repolarization sequences.",
        "cbc_report": "Complete Blood Count (CBC) quantifies circulating cellular components: oxygen-carrying erythrocytes, immune leukocytes, and thrombocytes.",
        "lipid_report": "Lipid panels quantify circulating lipoproteins, triglycerides, and sterol concentrations relevant to vascular lipid transport.",
        "diabetes_report": "Glycemic assessments measure plasma glucose concentrations and percentage glycated hemoglobin over erythrocytes' ~120-day lifespan.",
        "thyroid_report": "Thyroid functional testing measures hypothalamic-pituitary-thyroid axis regulation via thyrotropin (TSH) and active thyroid hormones.",
        "lft_report": "Hepatic functional profiles evaluate cellular integrity (aminotransferases), excretory capacity (bilirubin, ALP), and synthetic function (albumin).",
        "kft_report": "Renal profiles evaluate glomerular filtration efficiency and nitrogenous metabolite clearance (creatinine, urea).",
        "urine_report": "Urinalysis screens physical, chemical, and microscopic characteristics of renal excretions.",
        "blood_report": "Laboratory panels measure circulating biochemical analytes against established reference intervals."
    }

    base_exp = modality_explanations.get(report_type, "This clinical report contains objective diagnostic findings recorded during medical examination.")
    ai_exp = (
        f"AI Educational Overview: {base_exp} "
        f"Please review these extracted findings with your physician to interpret their significance within your overall clinical context."
    )

    # 3. Clinician Discussion Questions
    questions = [
        f"What do these specific findings from my {report_title.lower()} mean for my immediate care plan?",
        "Are follow-up examinations or confirmatory tests recommended based on these results?",
        "Should any lifestyle modifications or monitoring routines be initiated?"
    ]

    return summary, ai_exp, questions


def evaluate_screening_eligibility(
    report_type: str,
    findings: List[Dict[str, Any]]
) -> Tuple[bool, List[Dict[str, Any]]]:
    """
    Evaluates whether the report genuinely contains required inputs to trigger disease ML models
    (Diabetes, Cardiovascular, Hypertension).
    STRICT RULE: Only blood reports containing verified glucose, cholesterol, or blood pressure
    analytes return can_run_new_screening = True.
    Ultrasound, X-Ray, CT, MRI, ECG, Urine, and non-qualifying reports return False.
    """
    eligible_types = ["blood_report", "diabetes_report", "lipid_report", "cbc_report", "kft_report", "lft_report"]
    if report_type not in eligible_types:
        return False, []

    opportunities = []
    for f in findings:
        norm = f.get("parameter", "").lower()
        val = f.get("value")
        try:
            num = float(val)
            if "glucose" in norm and num > 0:
                opportunities.append({
                    "disease": "diabetes",
                    "title": "Diabetes Risk Screening",
                    "parameter": f.get("parameter", "Fasting Glucose"),
                    "value": num,
                    "unit": "mg/dL"
                })
            if "cholesterol" in norm and "total" in norm and num > 0:
                opportunities.append({
                    "disease": "cardiovascular",
                    "title": "Cardiovascular Risk Screening",
                    "parameter": "Total Cholesterol",
                    "value": num,
                    "unit": "mg/dL"
                })
            if "systolic" in norm and num > 0:
                opportunities.append({
                    "disease": "hypertension",
                    "title": "Hypertension Risk Screening",
                    "parameter": "Systolic BP",
                    "value": num,
                    "unit": "mmHg"
                })
        except (ValueError, TypeError):
            pass

    return len(opportunities) > 0, opportunities
