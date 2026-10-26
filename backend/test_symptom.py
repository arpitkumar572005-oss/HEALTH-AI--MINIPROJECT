import re

def check_symptom_response(q: str, first_name: str = "John"):
    q = q.strip().lower()
    
    # 1. EMERGENCY RED FLAGS
    emergency_keywords = [
        "chest pain", "pressure in chest", "left arm pain", "can't breathe",
        "cannot breathe", "severe shortness of breath", "face drooping",
        "stroke", "paralysis", "passed out", "coughing blood", "blue lips"
    ]
    if any(k in q for k in emergency_keywords):
        return (
            "⚠️ **URGENT MEDICAL SAFETY ALERT**\n\n"
            f"You mentioned symptoms that may indicate an acute medical emergency, {first_name}.\n\n"
            "**Please take immediate action:**\n"
            "• Call your local emergency services (e.g., dial **911** or local emergency operator) immediately.\n"
            "• Do not attempt to drive yourself to the emergency department.\n"
            "• Sit upright, rest, and remain as calm as possible while emergency responders are en route.\n\n"
            "HealthAI is an educational screening companion and cannot diagnose or treat acute medical emergencies.",
            ["What emergency numbers should I call?", "What should I tell the emergency operator?"]
        )

    # 2. FEVER ASSESSMENT
    if any(k in q for k in ["fever", "feverish", "high temperature", "high temp", "chills", "pyrexia"]):
        return (
            f"I understand you're experiencing a fever, {first_name}.\n\n"
            f"**Immediate Safe Self-Care Guidance**:\n"
            f"• **Check and Record Temperature**: Measure your temperature with a reliable digital thermometer and note the exact reading and time.\n"
            f"• **Stay Well Hydrated**: Fever accelerates bodily fluid loss. Sip water, oral rehydration solutions, clear broths, or herbal teas frequently.\n"
            f"• **Rest & Cooling**: Rest in a comfortable, well-ventilated room. Wear lightweight, breathable clothing and use a light sheet rather than heavy blankets.\n"
            f"• **Fever Reducers**: Over-the-counter antipyretics (such as acetaminophen/paracetamol or ibuprofen) may help relieve discomfort if clinically suitable for your health history. Always adhere to package dosing instructions and never duplicate medications with identical active ingredients.\n\n"
            f"⚠️ **When to Seek Urgent Medical Care (Red Flags)**:\n"
            f"Seek immediate professional or emergency medical attention if you experience:\n"
            f"• Temperature of **103°F (39.4°C) or higher**, or a fever persisting for more than **3 days**.\n"
            f"• **Difficulty breathing**, shortness of breath, or chest pain.\n"
            f"• **Stiff neck**, confusion, extreme lethargy, or trouble waking up.\n"
            f"• **Persistent vomiting** or inability to retain fluids.\n"
            f"• A new unexplained rash, seizures, or severe abdominal pain.\n\n"
            f"**To Help Me Better Understand Your Situation**:\n"
            f"1. What is your current temperature reading?\n"
            f"2. How long have you had the fever?\n"
            f"3. What other symptoms are you experiencing (e.g., chills, cough, sore throat, headache, body aches)?\n"
            f"4. Have you taken any medications or fever reducers yet today?",
            ["My temperature is 101°F", "I have chills and body aches", "How much water should I drink with a fever?", "When should I see a doctor for fever?"]
        )

    return "OTHER", []

def test_symptom_logic():
    resp, followups = check_symptom_response("I am suffering from fever")
    assert "fever" in resp.lower()
    assert len(followups) > 0
