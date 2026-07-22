
# Medical Reference Ranges (General Adult)
# These can be refined.
RANGES = {
    "wbc": {"min": 4.0, "max": 11.0, "critical_min": 2.0, "critical_max": 30.0},
    "rbc": {"min": 3.8, "max": 5.8, "critical_min": 2.5, "critical_max": 7.0},
    "hgb": {"min": 12.0, "max": 17.0, "critical_min": 7.0, "critical_max": 20.0},
    "hct": {"min": 36.0, "max": 50.0},
    "mcv": {"min": 80.0, "max": 100.0},
    "mch": {"min": 27.0, "max": 32.0},
    "mchc": {"min": 32.0, "max": 36.0},
    "plt": {"min": 150.0, "max": 450.0, "critical_min": 50.0, "critical_max": 1000.0},
    "neutp": {"min": 40.0, "max": 75.0},
    "lymp": {"min": 20.0, "max": 45.0},
    "monop": {"min": 2.0, "max": 10.0},
    "eosp": {"min": 1.0, "max": 6.0},
    "basop": {"min": 0.0, "max": 1.0}
}

HBA1C_RANGES = {
    "hypertension": {"label": "Hypertension"},
    "heart_disease": {"label": "Heart Disease"},
    "smoking_history": {"label": "Smoking History"},
    "hba1c_level": {"min": 4.0, "max": 5.6, "critical_max": 6.5, "unit": "%", "label": "HbA1c"},
    "blood_glucose_level": {"min": 70.0, "max": 99.0, "critical_max": 126.0, "unit": "mg/dL", "label": "Blood Glucose"},
    "bmi": {"min": 18.5, "max": 24.9, "critical_max": 30.0, "unit": "kg/m²", "label": "BMI"}
}

CREATININE_RANGES = {
    "gender": {"label": "Gender"},
    "serum_creatinine": {"min": 0.6, "max": 1.2, "critical_max": 2.0, "unit": "mg/dL", "label": "Serum Creatinine"},
    "egfr": {"min": 90.0, "max": 120.0, "critical_min": 60.0, "unit": "mL/min/1.73m²", "label": "eGFR"}
}

def _get_display_value(key, val):
    if val is None:
        return None
    
    if key == "gender":
        if val in [1, "1", "Male", "male", "M", "m"]:
            return "Male"
        elif val in [0, "0", "Female", "female", "F", "f"]:
            return "Female"
        return "Unknown"
    
    if key == "smoking_history":
        return str(val).capitalize()
    
    if key in ["hypertension", "heart_disease"]:
        if val in [1, "1", "Yes", "yes", "Positive", "positive"]:
            return "Yes"
        elif val in [0, "0", "No", "no", "Negative", "negative"]:
            return "No"
        return "Unknown"
    
    return val

def analyze_cbc(cbc_data):
    """
    Analyzes CBC values against standard ranges.
    Returns a dict with parameter keys, containing:
    {
        "value": float,
        "status": "normal" | "low" | "high" | "critical",
        "range_str": "4.0 - 11.0",
        "unit": "..."
    }
    """
    analysis = {}

    for key, val in cbc_data.items():
        if val is None:
            analysis[key] = {"value": None, "status": "missing", "range_str": "-", "unit": ""}
            continue
            
        # Get range info
        ref = RANGES.get(key)
        
        status = "normal"
        range_str = "-"
        unit = ""
        
        if ref:
            range_str = f"{ref['min']} - {ref['max']}"
            unit = ref.get("unit", "") # Some CBC ranges might have units defined later
            
            # Critical Checks
            if "critical_min" in ref and val < ref["critical_min"]:
                status = "critical"
            elif "critical_max" in ref and val > ref["critical_max"]:
                status = "critical"
            # Standard Checks
            elif val < ref["min"]:
                status = "low"
            elif val > ref["max"]:
                status = "high"
        
        analysis[key] = {
            "value": val,
            "status": status,
            "range_str": range_str,
            "unit": unit
        }

    return analysis

def analyze_hba1c(hba1c_data, units_data=None):
    analysis = {}
    units_data = units_data or {}
    for key, val in hba1c_data.items():
        if val is None or key in ["gender", "age", "hypertension", "heart_disease", "smoking_history"]:
            continue
            
        ref = HBA1C_RANGES.get(key)
        status = "normal"
        range_str = "-"
        unit = units_data.get(key, "")
        label = key
        
        if ref:
            label = ref.get("label", key)
            # Use detected unit if available, else fallback to reference unit
            unit = unit or ref.get("unit", "")
            
            # Handle categorical values for display
            display_val = _get_display_value(key, val)
 
            range_str = f"{ref['min']} - {ref['max']} {unit}" if "min" in ref else "-"
            if "critical_min" in ref and val < ref["critical_min"]:
                status = "critical"
            elif "critical_max" in ref and val >= ref["critical_max"]:
                status = "critical"
            elif "min" in ref and val < ref["min"]:
                status = "low"
            elif "max" in ref and val > ref["max"]:
                status = "high"

            # For categorical, status is usually normal
            if key in ["hypertension", "heart_disease", "smoking_history"]:
                status = "normal"
        
        analysis[label] = {
            "value": display_val if 'display_val' in locals() else val,
            "status": status,
            "range_str": range_str,
            "unit": unit
        }
    return analysis

def analyze_creatinine(creatinine_data, units_data=None):
    analysis = {}
    units_data = units_data or {}
    for key, val in creatinine_data.items():
        if val is None or key in ["gender", "age", "hypertension", "heart_disease", "smoking_history"]:
            continue
            
        ref = CREATININE_RANGES.get(key)
        status = "normal"
        range_str = "-"
        unit = units_data.get(key, "").lower()
        label = key
        
        if ref:
            label = ref.get("label", key)
            # Use detected unit if available, else fallback to reference unit
            unit = unit or ref.get("unit", "")
            
            # Handle categorical values for display
            display_val = _get_display_value(key, val)
            
            # Special handling for Creatinine µmol/L vs mg/dL
            if key == "serum_creatinine" and ("umol" in unit or "µmol" in unit):
                # typical range ~ 53 to 115 
                range_str = f"50 - 115 {unit}"
                if val < 50: status = "low"
                elif val > 120: status = "high"
                if val > 1000: status = "critical"
            else:
                range_str = f"{ref['min']} - {ref['max']} {unit}" if "min" in ref else "-"
                if "critical_min" in ref and val <= ref["critical_min"]:
                    status = "critical"
                elif "critical_max" in ref and val >= ref["critical_max"]:
                    status = "critical"
                elif "min" in ref and val < ref["min"]:
                    status = "low"
                elif "max" in ref and val > ref["max"]:
                    status = "high"
            
            # For categorical, status is usually normal unless it's a risk factor
            if key in ["gender", "age", "hypertension", "heart_disease", "smoking_history"]:
                status = "normal" # or "info"
        
        analysis[label] = {
            "value": display_val if 'display_val' in locals() else val,
            "status": status,
            "range_str": range_str,
            "unit": unit
        }
    return analysis


