import re
from utils.hba1c_features import HBA1C_FEATURES

def safe_get_value(value):
    if value is None:
        return None
    
    v = str(value).strip().lower()
    if v in {"na", "n/a", "nan", "none", "null", ""}:
        return None
    
    try:
        v = re.sub(r'[^0-9.]', '', v)
        if not v or v == ".": return None
        return float(v)
    except:
        return None

def clean_numeric_string(s):
    if not s:
        return s
    s = s.replace('O', '0').replace('o', '0')
    s = s.replace('I', '1').replace('l', '1')
    
    # Handle comma as decimal separator
    if ',' in s and '.' not in s:
        if len(s.split(',')[1]) <= 2:
            s = s.replace(',', '.')

    if "10E" in s.upper() or "10^" in s:
        return None
    s = re.sub(r'[^0-9.]', '', s)
    if s.count('.') > 1:
        parts = s.split('.')
        s = parts[0] + '.' + ''.join(parts[1:])
    return s

def sanitize_value(name, value):
    if value is None:
        return None

    name = name.lower()
    
    # HbA1c Percentage
    if any(k in name for k in ["hba1c", "a1c", "glycated"]):
        if value > 30.0: return None
        if value < 2.0: return None
        return value

    # Blood Glucose
    if any(k in name for k in ["glucose", "sugar", "fbs", "rbs"]):
        if value > 1000: return value / 10
        if value < 20: return None
        return value

    # BMI
    if any(k in name for k in ["bmi", "body mass"]):
        if value > 100 or value < 10: return None
        return value

    return value

def extract_categorical(text_clean, key, aliases):
    text_lower = text_clean.lower()
    if key == "smoking_history":
        for alias in aliases:
            pattern = rf"{alias.lower()}[\s\S]{{0,50}}?(never|former|current|not current|ever|smoker|non-smoker)"
            match = re.search(pattern, text_lower)
            if match:
                val = match.group(1).strip()
                if val == 'smoker': return 'current'
                if val == 'non-smoker': return 'never'
                return val
                
    elif key in ["hypertension", "heart_disease"]:
        for alias in aliases:
            pattern = rf"{alias.lower()}[\s\S]{{0,30}}?(yes|no|positive|negative)"
            match = re.search(pattern, text_lower)
            if match:
                val = match.group(1).strip()
                if val in ['yes', 'positive']: return 1
                if val in ['no', 'negative']: return 0
                
    return None

def extract_hba1c_values(text):
    data = {key: None for key in HBA1C_FEATURES}
    units = {key: "" for key in HBA1C_FEATURES}
    
    # Normalize spaces
    text_clean = re.sub(r'[ \t]+', ' ', text)
    
    for key, aliases in HBA1C_FEATURES.items():
        best_val = None
        best_unit = ""
        
        # Check if categorical
        if key in ["smoking_history", "hypertension", "heart_disease"]:
            best_val = extract_categorical(text_clean, key, aliases)
        else:
            for alias in aliases:
                # 1. Alias -> Value -> Unit
                flexible_alias = r"\s*".join([re.escape(c) for i, c in enumerate(alias) if c.strip() or i == 0])
                pattern_val_unit = rf"{flexible_alias}[\s\S]{{0,50}}?([0-9OoIl]*[0-9][0-9OoIl]*\.?[0-9OoIl]*)\s*(%|mg/dl|mg/l|mmol/l|mmol/mol)?"
                
                matches = re.finditer(pattern_val_unit, text_clean, re.IGNORECASE)
                for match in matches:
                    raw_num = match.group(1)
                    raw_unit = match.group(2)
                    cleaned = clean_numeric_string(raw_num)
                    val = safe_get_value(cleaned)
                    
                    if val is not None:
                        sanitized = sanitize_value(alias, val)
                        if sanitized is not None:
                            best_val = sanitized
                            best_unit = raw_unit.strip() if raw_unit else ""
                            break
                if best_val is not None: break

                # 2. Alias -> Unit -> Value
                pattern_unit_val = rf"{flexible_alias}[\s\S]{{0,50}}?(%|mg/dl|mg/l|mmol/l|mmol/mol)[\s\S]{{0,50}}?([0-9OoIl]*[0-9][0-9OoIl]*\.?[0-9OoIl]*)"
                match = re.search(pattern_unit_val, text_clean, re.IGNORECASE)
                if match:
                    raw_unit = match.group(1)
                    raw_num = match.group(2)
                    cleaned = clean_numeric_string(raw_num)
                    val = safe_get_value(cleaned)
                    if val is not None:
                        sanitized = sanitize_value(alias, val)
                        if sanitized is not None:
                            best_val = sanitized
                            best_unit = raw_unit.strip()
                            break
                if best_val is not None: break

                # 3. Last resort
                pattern_loose = rf"{flexible_alias}[\s\S]{{0,150}}?([0-9OoIl]*[0-9][0-9OoIl]*\.?[0-9OoIl]*)"
                match = re.search(pattern_loose, text_clean, re.IGNORECASE)
                if match:
                    raw_num = match.group(1)
                    cleaned = clean_numeric_string(raw_num)
                    val = safe_get_value(cleaned)
                    if val is not None:
                        sanitized = sanitize_value(alias, val)
                        if sanitized is not None:
                            best_val = sanitized
                            break
        
        data[key] = best_val
        if best_unit:
            units[key] = best_unit
                
    return data, units
