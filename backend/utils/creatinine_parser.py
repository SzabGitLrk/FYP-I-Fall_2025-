import re
from utils.creatinine_features import CREATININE_FEATURES

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
    
    # Handle comma as decimal separator (common in some medical reports)
    if ',' in s and '.' not in s:
        # Only replace if it looks like a decimal separator (e.g. 1,2 not 1,000)
        # For creatinine, values are usually small, so 1,2 is 1.2
        if len(s.split(',')[1]) <= 2:
            s = s.replace(',', '.')

    if "10E" in s.upper() or "10^" in s:
        return None
    s = re.sub(r'[^0-9.]', '', s)
    if s.count('.') > 1:
        parts = s.split('.')
        s = parts[0] + '.' + ''.join(parts[1:])
    return s

def sanitize_value(name, value, unit=""):
    if value is None:
        return None

    name = name.lower()
    unit = unit.lower()
    
    if any(k in name for k in ["creatinine", "serum creatinine"]):
        # If it looks like it's in mg/dL but value is high, it might be µmol/L or OCR error (e.g. 1.2 read as 12)
        if ("mg" in unit or not unit) and value > 30:
            # Heuristic: 1.2 often read as 12 or 120
            if value > 500: return value / 1000.0
            if value > 50: return value / 100.0
            return value / 10.0
        
        if "umol" in unit or "µmol" in unit:
            if value < 5: return value * 88.4 # Likely mg/dL read as µmol/L
            return value

        if value > 30: return None
        return value

    if any(k in name for k in ["egfr", "filtration"]):
        if value > 250: return None
        return value

    if "stage" in name:
        if value > 5 or value < 0: return None
        return int(value)

    return value

def extract_categorical(text_clean, key, aliases):
    text_lower = text_clean.lower()
    if key == "gender":
        for alias in aliases:
            # Look for gender indicators after the alias
            pattern = rf"{alias.lower()}[\s\S]{{0,30}}?(male|female|other|\bm\b|\bf\b)"
            match = re.search(pattern, text_lower)
            if match:
                val = match.group(1).strip()
                if val in ['m', 'male']: return 1
                if val in ['f', 'female']: return 0
                return None
    return None

def extract_creatinine_values(text):
    data = {key: None for key in CREATININE_FEATURES}
    units = {key: "" for key in CREATININE_FEATURES}
    
    # Pre-clean text: normalize spaces but keep newlines
    text_clean = re.sub(r'[ \t]+', ' ', text)
    
    for key, aliases in CREATININE_FEATURES.items():
        best_val = None
        best_unit = ""
        
        if key == "gender":
            best_val = extract_categorical(text_clean, key, aliases)
        else:
            for alias in aliases:
                # 1. Try Alias -> Value -> Unit
                flexible_alias = r"\s*".join([re.escape(c) for i, c in enumerate(alias) if c.strip() or i == 0])
                
                # Broaden regex: allow any characters including newlines between alias and value
                pattern_val_unit = rf"{flexible_alias}[\s\S]{{0,50}}?([0-9OoIl]*[0-9][0-9OoIl]*\.?[0-9OoIl]*)\s*(mg/dl|µmol/l|umol/l|ml/min)?"
                
                matches = re.finditer(pattern_val_unit, text_clean, re.IGNORECASE)
                for match in matches:
                    raw_num = match.group(1)
                    raw_unit = match.group(2)
                    cleaned = clean_numeric_string(raw_num)
                    val = safe_get_value(cleaned)
                    
                    if val is not None:
                        sanitized = sanitize_value(alias, val, raw_unit or "")
                        if sanitized is not None:
                            best_val = sanitized
                            best_unit = raw_unit.strip() if raw_unit else ""
                            break
                
                if best_val is not None: break

                # 2. Try Alias -> Unit -> Value
                pattern_unit_val = rf"{flexible_alias}[\s\S]{{0,50}}?(mg/dl|µmol/l|umol/l|ml/min)[\s\S]{{0,50}}?([0-9OoIl]*[0-9][0-9OoIl]*\.?[0-9OoIl]*)"
                match = re.search(pattern_unit_val, text_clean, re.IGNORECASE)
                if match:
                    raw_unit = match.group(1)
                    raw_num = match.group(2)
                    cleaned = clean_numeric_string(raw_num)
                    val = safe_get_value(cleaned)
                    if val is not None:
                        sanitized = sanitize_value(alias, val, raw_unit)
                        if sanitized is not None:
                            best_val = sanitized
                            best_unit = raw_unit.strip()
                            break

                if best_val is not None: break

                # 3. Last resort: look for any number within a larger window if alias is found
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
