import re

def detect_report_type(text, frontend_type="CBC"):
    # Always prioritize the frontend selected type
    ftype = str(frontend_type).upper()
    if ftype in ["HBA1C", "CREATININE", "CBC"]:
        if ftype == "HBA1C": return "HBA1C"
        if ftype == "CREATININE": return "CREATININE"
        if ftype == "CBC": return "CBC"

    # Fallback auto-detection if somehow not passed
    text_lower = text.lower()
    if any(k in text_lower for k in ["hba1c", "glycated hemoglobin", "a1c", "glycohemoglobin"]):
        return "HBA1C"
    if any(k in text_lower for k in ["creatinine", "serum creatinine", "egfr", "glomerular", "kidney"]):
        return "CREATININE"
        
    return "CBC"

def extract_hba1c_values(text):
    val = None
    pattern = r"(hba1c|a1c)[^\d]*(\d+\.?\d*)\s*%"
    matches = re.finditer(pattern, text, re.IGNORECASE)
    for m in matches:
        try:
            val = float(m.group(2))
            break
        except ValueError:
            pass

    status = "normal"
    if val is not None:
        if val > 30.0: # unrealistic
            status = "possible OCR error"
        elif val < 4.0:
            status = "low"
        elif val > 6.0:
            status = "high"
            
    return {
        "report_type": "HBA1C",
        "parameters": {
            "HbA1c": {
                "value": val if val is not None else "N/A",
                "unit": "%",
                "range_str": "4.0 - 6.0 %",
                "status": status if val is not None else "unknown"
            }
        }
    }

def extract_creatinine_values(text):
    val = None
    unit = "mg/dL"
    
    # regex for getting creatinine value and unit
    pattern = r"(creatinine)[^\d]*(\d+\.?\d*)\s*(mg/dl|µmol/l|umol/l)?"
    matches = re.finditer(pattern, text, re.IGNORECASE)
    for m in matches:
        try:
            raw_val = float(m.group(2))
            u = m.group(3)
            
            # If value is something like 102 but unit is mg/dl, likely 1.02
            if u and "mg" in u.lower() and raw_val > 50:
                raw_val = raw_val / 100.0
            elif not u and raw_val > 50:
                raw_val = raw_val / 100.0 # assumption
                
            val = round(raw_val, 2)
            if u:
                unit = u.lower()
                if "umol" in unit or "µmol" in unit:
                    unit = "µmol/l"
            break
        except ValueError:
            pass

    status = "normal"
    if val is not None:
        if "µmol/l" in unit:
            # typical range ~ 53 to 115 
            if val < 50:
                status = "low"
            elif val > 120:
                status = "high"
            if val > 2000:
                status = "possible OCR error"
        else:
            if val < 0.6:
                status = "low"
            elif val > 1.3:
                status = "high"
            if val > 30.0:
                status = "possible OCR error"

    return {
        "report_type": "CREATININE",
        "parameters": {
            "Creatinine": {
                "value": val if val is not None else "N/A",
                "unit": unit,
                "range_str": "0.6 - 1.3 mg/dL" if "mg" in unit else "50 - 115 µmol/L",
                "status": status if val is not None else "unknown"
            }
        }
    }

def extract_patient_info(text):
    """
    Extracts patient name and report date from OCR text.
    """
    name = "Unknown Patient"
    date = "N/A"
    
    # Name patterns
    name_patterns = [
        r"(?:Name|Patient Name|Patient)\s*[:\-]?\s*([A-Za-z\s]{3,30})(?=\n|Age|Gender|Sex|Date|Reg|$)",
        r"(?:Mr\.|Ms\.|Mrs\.|Dr\.)\s*([A-Za-z\s]{3,30})(?=\n|Age|Gender|Sex|Date|$)"
    ]
    
    for p in name_patterns:
        match = re.search(p, text, re.IGNORECASE)
        if match:
            extracted = match.group(1).strip()
            # Basic validation: avoid single words or keywords
            if " " in extracted and not any(k in extracted.lower() for k in ["unknown", "report", "hospital", "laboratory"]):
                name = extracted
                break
                
    # Date patterns
    date_patterns = [
        r"(?:Date|Collected|Reported)\s*[:\-]?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})",
        r"(?:Date|Collected|Reported)\s*[:\-]?\s*(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})"
    ]
    
    for p in date_patterns:
        match = re.search(p, text, re.IGNORECASE)
        if match:
            date = match.group(1).strip()
            break
            
    return name, date
