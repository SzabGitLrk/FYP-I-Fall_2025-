import re
from utils.cbc_features import CBC_FEATURES

def safe_get_value(value):
    """
    Converts value safely to float and removes NA-type values.
    """
    if value is None:
        return None
    
    v = str(value).strip().lower()
    if v in {"na", "n/a", "nan", "none", "null", ""}:
        return None
    
    try:
        # Handle cases like '12.9g/dl' by removing units
        v = re.sub(r'[^0-9.]', '', v)
        if not v or v == ".": return None
        return float(v)
    except:
        return None

def clean_numeric_string(s):
    """
    Cleans OCR-misread numeric strings.
    """
    if not s:
        return s
    
    # Common misreads
    s = s.replace('O', '0').replace('o', '0')
    s = s.replace('I', '1').replace('l', '1')
    
    # Remove scientific notation noise
    if "10E" in s.upper() or "10^" in s:
        return None

    # Keep only digits and decimal
    s = re.sub(r'[^0-9.]', '', s)
    
    if s.count('.') > 1:
        parts = s.split('.')
        s = parts[0] + '.' + ''.join(parts[1:])
        
    return s

def sanitize_value(name, value):
    """
    Corrects common OCR errors based on medical ranges.
    """
    if value is None:
        return None

    name = name.lower()
    
    # RBC
    if any(k in name for k in ["rbc", "red blood", "erythrocyte"]):
        if value == 10.0 or value == 6.0: return None
        if value > 20.0: value = value / 10
        if 2.0 <= value <= 9.0: return value
        return None

    # Hemoglobin
    if any(k in name for k in ["hgb", "hb", "hemoglobin", "haemoglobin"]):
        if value > 100: return value / 10
        if 2.0 <= value <= 25.0: return value
        if 0.5 < value < 2.0: return value * 10
        return None

    # WBC
    if any(k in name for k in ["wbc", "white blood", "leucocyte", "tlc"]):
        if value > 1000: return value / 1000
        if value > 100: return value / 10
        return value
        
    # Platelets
    if any(k in name for k in ["plt", "platelet"]):
        if 5.0 < value < 50: return value * 10
        if value > 1000: return value / 1000
        return value

    # Percentages
    if any(k in name for k in ["%", "percentage"]) or any(k in name for k in ["neut", "lymph", "mid", "mono", "eos", "baso"]):
        if any(k in name for k in ["#", "count", "absolute"]): return value
        if value > 100:
            if value < 1000: return value / 10
            else: return value / 100
        return value

    # HCT
    if any(k in name for k in ["hct", "hematocrit", "haematocrit", "pcv"]):
        if 0 < value < 1: return value * 100
        if 10.0 <= value <= 70.0: return value
        if value > 100: return value / 10
        return None
        
    return value

PERIPHERAL_FILM_DESCRIPTIONS = { 
    "Anisocytosis": "Red blood cells are of different sizes instead of being uniform. This is commonly seen in anemia, iron deficiency, or vitamin deficiency conditions.", 
    "Poikilocytosis": "Red blood cells have abnormal shapes rather than the normal round shape. It may occur in anemia, liver disease, or bone marrow disorders.", 
    "Microcytic": "Red blood cells are smaller than normal. This is often linked with iron deficiency anemia or chronic disease.", 
    "Macrocytic": "Red blood cells are larger than normal. It can happen due to vitamin B12 deficiency, folate deficiency, or liver disease.", 
    "Hypochromic": "Red blood cells contain less hemoglobin and appear pale under the microscope. It is commonly associated with iron deficiency anemia.", 
    "Normochromic": "Red blood cells have a normal amount of hemoglobin and normal color appearance.", 
    "Normocytic": "Red blood cells are normal in size. Some diseases may still be present even when cell size appears normal.", 
    "Microcytic Hypochromic": "Red blood cells are both smaller and paler than normal. This pattern is strongly associated with iron deficiency anemia and chronic blood loss.", 
    "Macrocytic Normochromic": "Red blood cells are larger than normal but still contain a normal amount of hemoglobin. It may suggest vitamin deficiencies or bone marrow problems.", 
    "Dimorphic Blood Picture": "Two different populations of red blood cells are present in the blood sample. This may occur after blood transfusion or mixed nutritional deficiencies.", 
    "Target Cells": "Red blood cells appear like a target shape with a dark center. These may be seen in liver disease, thalassemia, or certain types of anemia.", 
    "Spherocytosis": "Red blood cells are round instead of flat disc-shaped. These cells break easily and may cause anemia or jaundice.", 
    "Elliptocytosis": "Red blood cells appear elongated or elliptical. This may be inherited or related to certain blood disorders.", 
    "Ovalocytosis": "Many oval-shaped red blood cells are present. It can be associated with anemia or hereditary blood conditions.", 
    "Schistocytosis": "Broken or fragmented red blood cells are seen. This may indicate serious conditions causing damage to blood cells.", 
    "Tear Drop Cells (Dacrocytes)": "Red blood cells appear tear-drop shaped. This may occur in bone marrow diseases or severe anemia.", 
    "Sickle Cells": "Abnormally curved or sickle-shaped red blood cells are present. These cells can block blood flow and cause pain or anemia.", 
    "Burr Cells (Echinocytes)": "Red blood cells have rough or spiky edges. This can occur in kidney disease or dehydration.", 
    "Acanthocytes": "Red blood cells have irregular thorn-like projections. These may be linked with liver disease or neurological disorders.", 
    "Rouleaux Formation": "Red blood cells are stacked together like coins. This can happen in infections, inflammation, or multiple myeloma.", 
    "Polychromasia": "Immature red blood cells are present in the bloodstream, usually showing increased bone marrow activity.", 
    "Basophilic Stippling": "Red blood cells contain tiny blue granules. This finding may be associated with lead poisoning or severe anemia.", 
    "Howell-Jolly Bodies": "Small nuclear remnants are seen inside red blood cells. This may occur after spleen removal or in certain anemias.", 
    "Heinz Bodies": "Damaged hemoglobin particles are present in red blood cells. These may appear in hemolytic anemia or enzyme deficiencies.", 
    "Nucleated RBCs (NRBCs)": "Immature red blood cells with nuclei are present in the blood circulation. This can suggest severe stress on the bone marrow.", 
    "Reticulocytosis": "There is an increased number of immature red blood cells, indicating the body is trying to replace lost or destroyed blood cells.", 
    "Neutrophilia": "Neutrophil white blood cells are increased, usually due to bacterial infection, inflammation, stress, or injury.", 
    "Neutropenia": "Neutrophil white blood cells are lower than normal, which may reduce the body's ability to fight infections.", 
    "Lymphocytosis": "Lymphocyte white blood cells are increased. This is commonly seen in viral infections or immune responses.", 
    "Lymphopenia": "Lymphocyte white blood cells are decreased, which may weaken the immune system.", 
    "Eosinophilia": "Eosinophil white blood cells are increased, often due to allergies, asthma, parasitic infections, or inflammation.", 
    "Monocytosis": "Monocyte white blood cells are increased, commonly associated with chronic infections or inflammation.", 
    "Basophilia": "Basophil white blood cells are increased. This may occur in allergies, inflammation, or certain blood disorders.", 
    "Leukocytosis": "The total white blood cell count is higher than normal, usually indicating infection, inflammation, or stress.", 
    "Leukopenia": "The total white blood cell count is lower than normal, which may increase the risk of infections.", 
    "Thrombocytosis": "Platelet count is higher than normal. This may increase the risk of blood clot formation.", 
    "Thrombocytopenia": "Platelet count is lower than normal, which may increase the risk of bleeding or easy bruising.", 
    "Giant Platelets": "Platelets appear unusually large, which may indicate increased platelet production or bone marrow disorders.", 
    "Platelet Clumping": "Platelets are sticking together in the sample, which can sometimes affect the accuracy of the platelet count.", 
    "Reactive Lymphocytes": "Activated lymphocytes are present, usually as a response to viral infections or immune stimulation.", 
    "Blast Cells Seen": "Very immature blood cells are present in circulation. Further medical evaluation is important to rule out serious blood disorders.", 
    "Atypical Cells Seen": "Abnormal-looking blood cells are observed and may require additional laboratory investigation.", 
    "Pancytopenia": "Red blood cells, white blood cells, and platelets are all reduced, which may indicate bone marrow or severe systemic disease.", 
    "Bicytopenia": "Two major blood cell types are decreased, suggesting possible marrow suppression or blood-related disease.", 
    "Left Shift": "More immature white blood cells are present, commonly due to bacterial infection or inflammation.", 
    "Hypersegmented Neutrophils": "Neutrophils have extra nuclear segments and are commonly seen in vitamin B12 or folate deficiency.", 
    "Toxic Granulation": "Neutrophils show dark granules, often indicating severe infection or inflammation.", 
    "Vacuolated Neutrophils": "Neutrophils contain vacuoles that may appear during serious infection or inflammatory conditions.", 
    "Malaria Parasite Seen": "Malaria parasites are detected in the blood sample, suggesting malaria infection.", 
    "Hemoparasites Seen": "Blood parasites are present in the sample and may require urgent medical treatment.", 
    "? Viral Infection": "Blood changes may suggest a viral infection. Common symptoms may include fever, cough, weakness, and body aches.", 
    "? Bacterial Infection": "Blood findings may suggest a bacterial infection, often associated with fever, inflammation, or pus-forming infections.", 
    "? Iron Deficiency Anemia": "The blood pattern may indicate iron deficiency anemia, commonly causing fatigue, weakness, dizziness, and pale skin.", 
    "? Megaloblastic Anemia": "Blood findings may suggest anemia caused by vitamin B12 or folate deficiency, leading to weakness and nerve-related symptoms.", 
    "? Hemolytic Anemia": "Red blood cells may be breaking down faster than normal, which can cause fatigue, jaundice, and dark urine.", 
    "? Leukemia Picture": "Blood findings appear abnormal and may require further evaluation to rule out blood cancer or bone marrow disorders.", 
    "ESR Raised": "The ESR level is higher than normal, suggesting inflammation, infection, or an ongoing disease process in the body.", 
    "ESR Normal": "The ESR level is within the normal range, suggesting no major inflammation is detected." 
} 

def extract_peripheral_film_findings(text):
    """
    Detects and explains peripheral film/remarks findings from the report text.
    Only checks if "peripheral" or "remarks" sections exist.
    """
    findings = []
    
    # Check if peripheral or remarks section exists in the text
    has_peripheral = re.search(r"peripheral", text, re.IGNORECASE)
    has_remarks = re.search(r"remarks", text, re.IGNORECASE)
    
    if not (has_peripheral or has_remarks):
        return findings

    # Look for terms from the dictionary in the text
    for term, description in PERIPHERAL_FILM_DESCRIPTIONS.items():
        # Handle cases like "? Viral Infection" by escaping
        safe_term = re.escape(term)
        # Use word boundaries if the term is purely alphanumeric
        if term[0].isalnum():
            pattern = rf"\b{safe_term}\b"
        else:
            pattern = safe_term
            
        if re.search(pattern, text, re.IGNORECASE):
            findings.append({
                "term": term,
                "description": description
            })
            
    return findings

def extract_cbc_values(text):
    """
    Robust extraction using a global search with proximity windows.
    Handles multi-line labels and scientific units.
    """
    cbc = {key: None for key in CBC_FEATURES}
    
    # Normalize text for better searching
    # 1. Remove commas
    # 2. Collapse spaces (but keep newlines)
    text_clean = text.replace(",", "")
    
    for key, aliases in CBC_FEATURES.items():
        best_val = None
        
        for alias in aliases:
            # 1. Create a flexible pattern for the alias (handle spaces between letters)
            # e.g. "WBC" -> "W\s*B\s*C"
            flexible_alias = r"\s*".join([re.escape(c) for i, c in enumerate(alias) if c.strip() or i == 0])
            
            # 2. Search for the alias and look ahead 100 characters
            # We look for numbers that aren't inside parentheses (ranges)
            pattern = rf"{flexible_alias}[\s\S]{{0,100}}?([0-9OoIl]*[0-9][0-9OoIl]*\.?[0-9OoIl]*)"
            
            matches = re.finditer(pattern, text_clean, re.IGNORECASE)
            for match in matches:
                raw_num = match.group(1)
                start_idx = match.start(1)
                
                # Units check (scientific notation)
                pre_context = text_clean[max(0, start_idx-10):start_idx]
                if 'x10' in pre_context.lower() or '*10' in pre_context:
                    continue
                
                cleaned = clean_numeric_string(raw_num)
                val = safe_get_value(cleaned)
                
                if val is not None:
                    sanitized = sanitize_value(alias, val)
                    if sanitized is not None:
                        best_val = sanitized
                        break # Found a good value for this alias
            
            if best_val is not None:
                break # Found a good value for this key
        
        cbc[key] = best_val
                
    return cbc
