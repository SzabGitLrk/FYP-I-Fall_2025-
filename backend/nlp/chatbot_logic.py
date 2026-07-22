import re
import string
from difflib import get_close_matches

# =========================================================
# GLOBAL CLINICAL STATE TRACKER
# =========================================================
latest_report = {}
latest_ocr_text = ""
latest_raw_json = {}
latest_report_type = ""
latest_analysis = {}

conversation_context = {
    "last_parameter": None,
    "last_topic": None
}

# =========================================================
# HELPERS
# =========================================================
def clean_text(text):
    return str(text).strip().lower()

greetings = {"hi", "hello", "hey", "assalamualaikum", "salam", "greetings"}

stopwords = {
    "is", "am", "are", "the", "a", "an", "tell", "me", "please",
    "can", "you", "i", "want", "to", "if", "my", "show", "give",
    "in", "what", "about"
}

# =========================================================
# SYNONYMS & GLOSSARIES
# =========================================================
synonyms = {
    "wbc":              ["white", "infection", "immunity", "leukocyte", "tlc"],
    "rbc":              ["red", "oxygen", "erythrocyte"],
    "hgb":              ["hb", "hemoglobin", "haemoglobin"],
    "plt":              ["platelet", "platelets", "clotting"],
    "neut":             ["neutrophil", "neutrophils"],
    "lymph":            ["lymphocyte", "lymphocytes"],
    "mono":             ["monocyte", "monocytes"],
    "eos":              ["eosinophil", "eosinophils"],
    "baso":             ["basophil", "basophils"],
    "hba1c_level":      ["hba1c", "a1c", "diabetes", "sugar", "average sugar"],
    "blood_glucose_level": ["glucose", "blood glucose", "fasting sugar", "random glucose", "fasting glucose"],
    "serum_creatinine": ["creatinine", "kidney", "serum creatinine"],
    "egfr":             ["gfr", "egfr", "kidney function", "filtration rate"]
}

report_info = {
    "wbc": {
        "name": "White Blood Cells",
        "unit": "10^3/uL",
        "range": (4.0, 11.0),
        "desc": "White blood cells are your immune army — they fight off infections and foreign threats.",
        "detail": (
            "White blood cells (WBC), also called leukocytes, are produced in bone marrow and are central to your immune response. "
            "There are several types: neutrophils tackle bacterial infections, lymphocytes handle viral threats, "
            "monocytes clean up dead cells, and eosinophils deal with allergens and parasites. "
            "A high count usually means your body is actively fighting something — an infection, inflammation, or stress. "
            "A low count can make it harder to fight minor illnesses. Either way, the change is usually temporary and treatable."
        )
    },
    "rbc": {
        "name": "Red Blood Cells",
        "unit": "10^6/uL",
        "range": (4.0, 5.9),
        "desc": "Red blood cells carry oxygen from your lungs to every part of your body.",
        "detail": (
            "Red blood cells (RBC), or erythrocytes, are the most abundant cells in your blood. "
            "They carry hemoglobin, which binds to oxygen in the lungs and releases it to tissues throughout the body. "
            "A low RBC count often points to anemia — your body is not making enough cells, losing them, or they are breaking down faster than normal. "
            "This can leave you feeling fatigued, short of breath, or dizzy. "
            "A high RBC count can occur with dehydration, smoking, or certain bone marrow conditions. "
            "Common causes of low RBC include iron deficiency, B12 or folate deficiency, chronic illness, or blood loss."
        )
    },
    "hgb": {
        "name": "Hemoglobin",
        "unit": "g/dL",
        "range": (12.0, 16.0),
        "desc": "Hemoglobin is the protein in red blood cells that actually carries the oxygen.",
        "detail": (
            "Hemoglobin is an iron-containing protein inside each red blood cell. It is what gives blood its red colour. "
            "It picks up oxygen in the lungs and delivers it to your muscles, brain, and organs, then carries back carbon dioxide. "
            "Low hemoglobin is the core definition of anemia and can cause tiredness, weakness, pale skin, and shortness of breath. "
            "Iron deficiency is the most common cause globally. Other causes include vitamin B12 or folate deficiency, chronic disease, or internal bleeding. "
            "High hemoglobin is less common and often linked to dehydration, smoking, or living at high altitude."
        )
    },
    "plt": {
        "name": "Platelets",
        "unit": "10^3/uL",
        "range": (150.0, 400.0),
        "desc": "Platelets are tiny cells that plug wounds and help your blood clot when you bleed.",
        "detail": (
            "Platelets, also called thrombocytes, are small cell fragments produced in the bone marrow. "
            "When you get a cut or injury, platelets rush to the site and clump together to form a plug, stopping the bleeding. "
            "A low count (thrombocytopenia) means clotting takes longer — you might bruise easily or bleed more than usual from minor cuts. "
            "Causes include viral infections, certain medications, autoimmune conditions, or liver disease. "
            "A high count (thrombocytosis) often occurs temporarily during inflammation, infection, or after surgery. "
            "Very high counts in rare cases can increase clot risk and need medical review."
        )
    },
    "hba1c_level": {
        "name": "HbA1c",
        "unit": "%",
        "range": (4.0, 5.6),
        "desc": "HbA1c shows your average blood sugar over the past 2 to 3 months — it is a longer-term picture than a single glucose test.",
        "detail": (
            "HbA1c measures the percentage of hemoglobin that has glucose attached to it. "
            "Since red blood cells live for about 3 months, this reading reflects your average blood sugar over that entire period — not just today. "
            "A result below 5.7% is normal. Between 5.7% and 6.4% is considered prediabetes, a reversible stage. "
            "At 6.5% or above, it meets the clinical threshold for a diabetes diagnosis. "
            "Elevated HbA1c over time can damage blood vessels and nerves, affecting kidneys, eyes, and the heart. "
            "The good news is that lifestyle changes — diet, exercise, weight management — can bring it down significantly."
        )
    },
    "blood_glucose_level": {
        "name": "Blood Glucose",
        "unit": "mg/dL",
        "range": (70.0, 140.0),
        "desc": "Blood glucose is your sugar level right now — a snapshot reading at the time of the test.",
        "detail": (
            "Blood glucose measures the amount of sugar (glucose) circulating in your blood at the time the sample was taken. "
            "Unlike HbA1c, this is an immediate reading that can vary based on when you last ate, stress levels, or physical activity. "
            "A fasting glucose above 126 mg/dL or a random reading above 200 mg/dL is generally diagnostic for diabetes. "
            "Between 100 and 125 mg/dL fasting falls in the prediabetes range. "
            "Very low glucose (below 70 mg/dL) is hypoglycemia and can cause shakiness, sweating, and confusion. "
            "Managing glucose involves balanced meals, limiting refined carbs, and regular movement."
        )
    },
    "serum_creatinine": {
        "name": "Serum Creatinine",
        "unit": "mg/dL",
        "range": (0.6, 1.2),
        "desc": "Creatinine is a waste product from muscle activity. Your kidneys filter it out — so high levels can signal kidney stress.",
        "detail": (
            "Creatinine is produced naturally when your muscles use energy. Healthy kidneys filter it from your blood and excrete it in urine. "
            "When kidney function is reduced, creatinine builds up in the bloodstream. "
            "Mildly elevated creatinine is common with dehydration and usually normalises with adequate fluid intake. "
            "Consistently elevated levels suggest the kidneys are not filtering efficiently. "
            "Other causes include high-protein diets, intense exercise before the test, certain medications, or chronic kidney disease. "
            "It is usually assessed alongside eGFR and urine tests to get the full picture of kidney health."
        )
    },
    "egfr": {
        "name": "eGFR",
        "unit": "mL/min/1.73m2",
        "range": (90.0, 120.0),
        "desc": "eGFR estimates how well your kidneys are filtering your blood each minute.",
        "detail": (
            "eGFR stands for estimated Glomerular Filtration Rate. It is calculated using your creatinine level, age, sex, and body size. "
            "It tells you how many millilitres of blood your kidneys are filtering per minute. "
            "Above 90 is considered normal. 60 to 89 suggests mildly reduced function. "
            "Below 60 for more than 3 months points to chronic kidney disease (CKD) and requires medical follow-up. "
            "Below 15 is kidney failure. eGFR naturally declines slightly with age, so context matters. "
            "Keeping blood pressure controlled, staying hydrated, and avoiding nephrotoxic drugs like NSAIDs helps preserve kidney function."
        )
    }
}

MEDICAL_JARGON_GLOSSARY = {
    "anisocytosis": "Your red blood cells are of different sizes rather than being uniform. Very common in anemia, especially iron deficiency.",
    "poikilocytosis": "Your red blood cells have abnormal shapes instead of the normal round form. Can be linked to nutritional deficiencies or liver issues.",
    "microcytic": "Your red blood cells are smaller than normal, usually because the body lacks enough iron to build hemoglobin.",
    "macrocytic": "Your red blood cells are larger than normal, often linked to vitamin B12 or folate deficiencies.",
    "hypochromic": "Your red blood cells look pale due to lower hemoglobin content. A strong sign of iron deficiency.",
    "normocytic": "Your red blood cells are normal in size.",
    "normochromic": "Your red blood cells have a normal, healthy color and hemoglobin concentration.",
    "microcytic hypochromic": "Your red blood cells are both smaller and paler than normal — the classic pattern of iron deficiency anemia.",
    "dimorphic": "Two distinct types of red blood cells are present, often indicating mixed nutritional deficiencies or a recent transfusion.",
    "target cells": "Red blood cells that look like a bullseye. Sometimes seen in liver disease or thalassemia traits.",
    "schistocytosis": "Fragmented red blood cells are present. Requires medical review.",
    "thrombocytopenia": "Platelet count is lower than normal, increasing bruising or bleeding risk.",
    "thrombocytosis": "Platelet count is elevated, sometimes occurring during inflammation or infection.",
    "leukocytosis": "Total white blood cell count is elevated — your immune system is actively responding to something.",
    "leukopenia": "White blood cell count is lower than normal, temporarily reducing infection-fighting ability.",
    "neutrophilia": "Increased neutrophils, usually indicating a bacterial infection or physical stress.",
    "lymphocytosis": "Increased lymphocytes, highly characteristic of a viral infection.",
    "viral infection": "Your blood pattern suggests the immune system is fighting a viral illness.",
    "bacterial infection": "Your white cell counts suggest a bacterial infection, which may need medical evaluation.",
    "iron deficiency": "Your red cell indices point towards low iron, improvable with diet or supplements.",
    "esr raised": "Erythrocyte Sedimentation Rate is elevated, indicating active inflammation or infection.",
    "stage 1 ckd": "Stage 1 Chronic Kidney Disease — normal function but with early signs of minor stress.",
    "stage 2 ckd": "Stage 2 CKD — mild reduction in filtration. Manageable with hydration and blood pressure control.",
    "stage 3 ckd": "Stage 3 CKD — moderate reduction in kidney function. Physician review recommended.",
    "stage 4 ckd": "Stage 4 CKD — severe reduction. Immediate medical guidance strongly recommended.",
    "stage 5 ckd": "Stage 5 Kidney Disease — immediate consult with a nephrologist is critical.",
    "prediabetes": "Blood glucose places you in the prediabetes range — a reversible stage with the right lifestyle changes.",
    "diabetes": "Parameters indicate blood sugar levels in the diabetes range. Consult a physician for a management plan."
}

# =========================================================
# STATE UPDATER
# =========================================================
def set_latest_report(ocr_text=None, data=None, raw_json=None, report_type="CBC", analysis=None):
    global latest_report, latest_ocr_text, latest_raw_json, latest_report_type, latest_analysis
    latest_ocr_text  = ocr_text or ""
    latest_report_type = clean_text(report_type).upper()
    latest_raw_json  = raw_json or {}
    latest_analysis  = analysis or {}
    latest_report    = {}
    if data:
        for k, v in data.items():
            key = clean_text(k)
            try:
                latest_report[key] = float(v["value"] if isinstance(v, dict) and "value" in v else v)
            except:
                latest_report[key] = v

# =========================================================
# UTILITIES
# =========================================================
def preprocess(text):
    text = clean_text(text)
    for src, dst in [("blood sugar", "glucose"), ("blood glucose", "glucose"), ("sugar level", "glucose")]:
        text = text.replace(src, dst)
    text = text.translate(str.maketrans('', '', string.punctuation))
    return [w for w in text.split() if w not in stopwords]

def normalize_tokens(tokens):
    out = []
    for token in tokens:
        token = clean_text(token)
        found = False
        for key, vals in synonyms.items():
            if token == key.lower() or token in [v.lower() for v in vals]:
                out.append(key.lower())
                found = True
                break
        if not found:
            out.append(token)
    return out

def matches_intent(text, keywords):
    """Match keywords using word boundaries — prevents 'eat' matching inside 'creator'."""
    text = clean_text(text)
    for kw in keywords:
        kw_clean = clean_text(kw)
        pattern = r'\b' + re.escape(kw_clean) + r'\b'
        if re.search(pattern, text):
            return True
    return False

def is_greeting(tokens):
    return any(clean_text(t) in greetings for t in tokens)

def get_parameter_status(param_key, value):
    param_key = clean_text(param_key)
    if param_key not in report_info:
        return "NORMAL"
    try:
        val = float(value)
        low, high = report_info[param_key]["range"]
        if val < low:   return "LOW"
        if val > high:  return "HIGH"
        return "NORMAL"
    except:
        return "NORMAL"

def translate_remarks_to_layman(text):
    if not text:
        return ""
    found = []
    text_lower = text.lower()
    for jargon, explanation in MEDICAL_JARGON_GLOSSARY.items():
        if re.search(rf"\b{re.escape(jargon)}\b", text_lower):
            found.append(f"{jargon.title()}: {explanation}")
    if found:
        return "\nHere is what some of the medical terms mean:\n\n" + "\n\n".join(found)
    return ""

# =========================================================
# INTENT DETECTION HELPERS
# =========================================================
def is_detail_request(text):
    """User wants an in-depth explanation."""
    detail_words = [
        "explain", "detail", "describe", "more", "elaborate",
        "why", "how", "what does", "what is", "meaning", "means",
        "tell me more", "in depth", "deeper", "breakdown"
    ]
    return matches_intent(text, detail_words)

def is_value_request(text):
    """User just wants the number."""
    value_words = ["count", "value", "number", "result", "level", "reading", "score"]
    return matches_intent(text, value_words)

def detect_parameter(tokens_normalized):
    """Return the first recognised parameter key from a token list, or None."""
    for token in tokens_normalized:
        if token in report_info:
            return token
    for token in tokens_normalized:
        match = get_close_matches(token.lower(), list(report_info.keys()), n=1, cutoff=0.8)
        if match:
            return match[0]
    return None

# =========================================================
# RESPONSE TIERS
# =========================================================
def quick_param_reply(param_key):
    """One-liner conversational reply: value + status."""
    info = report_info[param_key]
    val  = latest_report.get(param_key)

    conversation_context["last_parameter"] = param_key
    conversation_context["last_topic"] = "parameter"

    if not latest_report:
        return (
            f"It looks like no report has been uploaded yet. "
            f"Once you upload your lab report, I can instantly tell you your {info['name']} result."
        )

    if val is None:
        return (
            f"Your {info['name']} does not appear in this report — it may not have been part of the tests run this time. "
            f"If you think it should be there, double-check the uploaded file or ask your lab."
        )

    status = get_parameter_status(param_key, val)
    low, high = info["range"]

    if status == "NORMAL":
        return (
            f"Your {info['name']} is {val} {info['unit']}, which is normal. "
            f"The healthy range is {low} to {high}. No concerns there."
        )
    elif status == "LOW":
        return (
            f"Your {info['name']} is {val} {info['unit']}, which is a bit low "
            f"(normal is {low} to {high}). Want me to explain what that means?"
        )
    else:
        return (
            f"Your {info['name']} is {val} {info['unit']}, which is above the normal range "
            f"of {low} to {high}. Want me to walk you through what that could mean?"
        )


def detailed_param_reply(param_key):
    """Full conversational explanation with clinical context."""
    info   = report_info[param_key]
    val    = latest_report.get(param_key) if latest_report else None
    status = get_parameter_status(param_key, val) if val is not None else "UNKNOWN"
    low, high = info["range"]

    conversation_context["last_parameter"] = param_key
    conversation_context["last_topic"] = "parameter_detail"

    lines = []

    # Opening sentence
    if val is not None:
        if status == "NORMAL":
            lines.append(
                f"Your {info['name']} is {val} {info['unit']}, sitting comfortably within the normal range of {low} to {high}."
            )
        elif status == "LOW":
            lines.append(
                f"Your {info['name']} is {val} {info['unit']}, which is below the normal range of {low} to {high}."
            )
        else:
            lines.append(
                f"Your {info['name']} is {val} {info['unit']}, which is above the normal range of {low} to {high}."
            )
    else:
        lines.append(f"This is what {info['name']} measures and why it matters.")

    # What it is
    lines.append(info["detail"])

    # Status-specific interpretation
    if val is not None:
        if param_key == "hgb":
            if status == "LOW":
                lines.append("Low hemoglobin is the hallmark of anemia. Iron deficiency is the most common culprit. You might feel more tired than usual or get out of breath easily.")
            elif status == "HIGH":
                lines.append("High hemoglobin is less common. Dehydration is the first thing to rule out. Smoking can also elevate it.")
            else:
                lines.append("Your hemoglobin is healthy — your blood is carrying oxygen efficiently throughout your body.")
        elif param_key == "wbc":
            if status == "HIGH":
                lines.append("An elevated white cell count almost always means your immune system is responding to something — an infection, inflammation, or even physical stress. It is not automatically alarming.")
            elif status == "LOW":
                lines.append("A low white cell count can temporarily reduce your body's ability to fight off minor infections. Worth mentioning to your doctor, especially if you have been feeling unwell.")
            else:
                lines.append("Your white blood cell count is normal, which means your immune system has a healthy baseline.")
        elif param_key == "rbc":
            if status == "LOW":
                lines.append("Low red blood cell count usually means your body is not producing enough, or they are being lost or broken down. Nutritional deficiencies like iron or B12 are common reasons.")
            elif status == "HIGH":
                lines.append("A high RBC count is less typical. Dehydration can concentrate the count. Chronic smoking or living at altitude can also push it up.")
            else:
                lines.append("Your red blood cell count looks healthy — your blood is well-stocked to carry oxygen.")
        elif param_key == "plt":
            if status == "LOW":
                lines.append("Low platelets mean your clotting response is slower. You may bruise more easily. It is worth avoiding high-impact activity and reviewing this with your doctor.")
            elif status == "HIGH":
                lines.append("Elevated platelets during or after an illness or surgery is quite common and usually temporary.")
            else:
                lines.append("Your platelet count is perfectly normal, which is great for healthy clotting.")
        elif param_key == "hba1c_level":
            if status == "HIGH":
                if float(val) >= 6.5:
                    lines.append("At 6.5% or above, this falls in the diabetes range. It is important to work with a doctor on a management plan, but many people bring this down significantly with consistent lifestyle changes.")
                else:
                    lines.append("Between 5.7% and 6.4% is the prediabetes range. The good news is this stage is highly reversible — diet and exercise make a real difference here.")
            else:
                lines.append("Your HbA1c is in a healthy range, showing your blood sugar has been well controlled over the past few months.")
        elif param_key == "serum_creatinine":
            if status == "HIGH":
                lines.append("Elevated creatinine often simply reflects dehydration. If you were not well-hydrated before the test, that alone can push it up. It is worth re-testing after a few days of good fluid intake.")
            else:
                lines.append("Your creatinine is normal — your kidneys are clearing waste from your blood as expected.")
        elif param_key == "egfr":
            if status == "LOW":
                lines.append("A lower eGFR means your kidneys are filtering less efficiently than ideal. Staying well hydrated and keeping blood pressure in check are the most impactful things you can do day-to-day.")
            else:
                lines.append("Your eGFR reflects healthy kidney filtration. Keep up good hydration habits to maintain it.")

    lines.append("If you want to know how to improve this or have more questions, just ask.")
    return "\n\n".join(lines)


# =========================================================
# FULL REPORT SUMMARY
# =========================================================
def generate_empathetic_summary():
    if not latest_report:
        return "Please upload your lab report first so I can summarize it for you."

    p_name = (latest_raw_json.get("patient_name") or "there").title()
    lab    = latest_raw_json.get("lab_name") or "the laboratory"
    date   = latest_raw_json.get("test_date") or "recently"
    r_type = latest_report_type or "Lab"

    out = f"Hello, {p_name}. Here is a plain-language breakdown of your {r_type} report from {lab}, dated {date}.\n\n"

    keys_map = {
        "CBC":        ["wbc", "rbc", "hgb", "plt", "neut", "lymph", "mono", "eos", "baso"],
        "HBA1C":      ["hba1c_level", "blood_glucose_level"],
        "CREATININE": ["serum_creatinine", "egfr"]
    }
    keys_to_check = keys_map.get(r_type, list(latest_report.keys()))

    abnormal, normal = [], []
    for key in keys_to_check:
        val = latest_report.get(key)
        if val is None or key not in report_info:
            continue
        status = get_parameter_status(key, val)
        info   = report_info[key]
        if status != "NORMAL":
            abnormal.append((info, val, status.lower()))
        else:
            normal.append(info["name"])

    if abnormal:
        out += "A few values need your attention:\n\n"
        for info, val, dir_str in abnormal:
            key_check = clean_text(info["name"])
            if "hemoglobin" in key_check and dir_str == "low":
                meaning = "This points to anemia. Low hemoglobin can leave you feeling tired or short of breath."
            elif "platelet" in key_check and dir_str == "low":
                meaning = "Low platelets can cause easier bruising and slower clotting."
            elif "white blood" in key_check and dir_str == "high":
                meaning = "Your immune system is likely responding to an active infection or inflammation."
            elif "creatinine" in key_check and dir_str == "high":
                meaning = "Your kidneys may be under mild stress, or dehydration may be a factor."
            elif "hba1c" in key_check and dir_str == "high":
                meaning = "This is in the diabetes range." if float(val) >= 6.5 else "This is in the prediabetes range — a reversible warning sign."
            else:
                meaning = f"This value is {dir_str}er than the standard healthy range."
            out += (
                f"{info['name']} is {dir_str} at {val} {info['unit']} "
                f"(normal: {info['range'][0]} to {info['range'][1]}). {meaning}\n\n"
            )
    else:
        out += "All your tested values are within the normal range — nothing flagged to worry about.\n\n"

    if normal:
        out += f"These are all healthy and normal: {', '.join(normal[:6])}{'...' if len(normal) > 6 else ''}.\n\n"

    remarks       = latest_raw_json.get("remarks")
    interpretation = latest_raw_json.get("interpretation")
    if remarks or interpretation:
        out += "From the lab notes:\n"
        if remarks:       out += f"{remarks}\n"
        if interpretation: out += f"{interpretation}\n"
        jargon = translate_remarks_to_layman(f"{remarks or ''} {interpretation or ''}")
        if jargon:
            out += jargon + "\n"
        out += "\n"

    suggs = latest_raw_json.get("suggestions")
    if suggs:
        out += "Suggested next steps:\n" + "".join(f"- {s}\n" for s in suggs)
    else:
        if r_type == "HBA1C":
            out += "On the lifestyle side: cut back on refined carbs and sugary drinks, and try a 20-minute walk after meals — it genuinely moves the needle on blood sugar."
        elif r_type == "CREATININE":
            out += "Keep your water intake steady — 8 to 10 glasses a day takes a lot of pressure off your kidneys. Avoid frequent painkiller use like ibuprofen."
        else:
            hgb_val = latest_report.get("hgb")
            if hgb_val and get_parameter_status("hgb", hgb_val) == "LOW":
                out += "Focus on iron-rich foods — spinach, lentils, eggs — and pair them with vitamin C to help absorption."
            else:
                out += "Balanced meals, good hydration, and 7 to 8 hours of sleep go a long way for maintaining healthy blood counts."

    out += "\n\nThis summary is for general understanding. Please share your results with your doctor for proper clinical guidance."
    return out


# =========================================================
# REMARKS & PERIPHERAL FILM
# =========================================================
def explain_remarks_only():
    if not latest_report:
        return "Please upload a report first so I can look at the remarks."

    remarks       = latest_raw_json.get("remarks")
    interpretation = latest_raw_json.get("interpretation")

    if not remarks and not interpretation:
        return (
            "There are no clinical remarks or flags on your report. "
            "That means the lab did not note anything unusual beyond the numbers themselves."
        )

    out = "Here is what the lab notes on your report say, in plain language.\n\n"
    if remarks:        out += f"Lab remarks: {remarks}\n\n"
    if interpretation: out += f"Clinical interpretation: {interpretation}\n\n"

    jargon = translate_remarks_to_layman(f"{remarks or ''} {interpretation or ''}")
    out += jargon if jargon else "No complex medical jargon was detected in these notes."
    out += "\n\nAs always, bring these notes to your doctor for their specific clinical view."
    return out


def explain_peripheral_film_only():
    if not latest_report:
        return "Please upload your report first so I can go through the peripheral film findings."

    if latest_report_type != "CBC":
        return (
            f"Peripheral blood smears are part of a CBC report. "
            f"Your current report is a {latest_report_type}, so there is no smear to look at here. "
            "Upload a CBC and I can walk you through those findings."
        )

    findings = latest_raw_json.get("peripheral_film")
    if not findings and latest_ocr_text:
        from utils.cbc_parser import extract_peripheral_film_findings
        findings = [f["term"] for f in extract_peripheral_film_findings(latest_ocr_text)]

    if not findings:
        return (
            "No atypical findings were recorded on your blood smear. "
            "Your blood cells appear normal in shape and structure under the microscope."
        )

    out = (
        "Your blood was examined under a microscope to look at the shape and structure of your cells. "
        "Here is what was found:\n\n"
    )
    for item in findings:
        item_clean = str(item).strip()
        desc = MEDICAL_JARGON_GLOSSARY.get(item_clean.lower())
        if not desc:
            try:
                from utils.cbc_parser import PERIPHERAL_FILM_DESCRIPTIONS
                desc = PERIPHERAL_FILM_DESCRIPTIONS.get(item_clean)
            except:
                pass
        if not desc:
            desc = "This is a microscopic finding your doctor should interpret in the context of your full picture."
        out += f"{item_clean}: {desc}\n\n"

    out += "Review these findings together with your physician for the full clinical picture."
    return out


# =========================================================
# CHATBOT MAIN ROUTER
# =========================================================
def chatbot(text):
    text_clean = clean_text(text)
    tokens     = preprocess(text_clean)
    normalized = normalize_tokens(tokens)

    # ── 1. GREETING
    if is_greeting(tokens):
        return (
            "Hey! Good to have you here. I am RepoAssist AI, your personal medical report assistant. "
            "I can help you understand your CBC, HbA1c, or Creatinine report in plain language — "
            "no confusing medical terms, just clear answers. "
            "You can ask me something like 'what is my hemoglobin' for a quick result, "
            "or 'explain my RBC' if you want a deeper breakdown. "
            "Whenever you are ready, just upload your report and fire away."
        )

    # ── 2. IDENTITY — who made you / who are you / about repoassist
    creator_keywords = [
        "who made you", "who created you", "who built you", "who developed you",
        "your creator", "your developer", "your team", "who are your creators",
        "made by", "created by", "built by", "developed by", "who is behind you"
    ]
    if matches_intent(text_clean, creator_keywords):
        return (
            "RepoAssist AI was created by a team of three: Rateeka, Deepak, and Ubaid Bhutto. "
            "They built me to make lab reports less confusing for everyday people — "
            "so you do not need a medical background to understand what your results actually mean."
        )

    about_keywords = [
        "what are you", "who are you", "tell me about you", "tell me about repoassist",
        "about repoassist", "what is repoassist", "what can you do", "what do you do",
        "your purpose", "how do you work", "what kind of assistant", "introduce yourself"
    ]
    if matches_intent(text_clean, about_keywords):
        return (
            "I am RepoAssist AI, a voice-based medical report assistant. "
            "I help you make sense of your lab reports in plain, everyday language — no medical jargon, no confusion. "
            "Right now I support three types of reports: CBC (Complete Blood Count), "
            "HbA1c for blood sugar and diabetes monitoring, and Creatinine for kidney function. "
            "Upload your report and ask me anything — what a result means, whether a value is normal, "
            "what your lab remarks say, or how to improve your numbers through diet and lifestyle. "
            "I will walk you through all of it in simple language."
        )

    # ── 3. PARAMETER DETECTION — always resolve this first so a named test
    #       is never swallowed by a generic intent match below.
    param = detect_parameter(normalized)

    # ── 3. FULL REPORT SUMMARY
    summary_keywords = ["summary", "summarize", "full report", "whole report", "analyse", "analysis",
                        "tell me about my report", "explain report", "overview"]
    if not param and matches_intent(text_clean, summary_keywords):
        return generate_empathetic_summary()

    # ── 4. REMARKS
    if not param and matches_intent(text_clean, ["remark", "remarks", "interpretation", "interpret", "comment", "comments"]):
        return explain_remarks_only()

    # ── 5. PERIPHERAL FILM
    if not param and matches_intent(text_clean, ["peripheral", "periphiral", "film", "smear", "slide", "microscope", "microscopic"]):
        return explain_peripheral_film_only()

    # ── 6. DIET / LIFESTYLE  (only if no specific test was named)
    if not param and matches_intent(text_clean, ["improve", "reduce", "lower", "increase", "food", "diet", "eat",
                                                  "lifestyle", "exercise", "manage", "tips", "advice", "do next"]):
        if not latest_report_type:
            return "Upload a report first and I can give you personalised lifestyle suggestions based on your numbers."

        intro = "Here are some practical suggestions based on your report.\n\n"
        if latest_report_type == "HBA1C":
            return intro + (
                "Cut back on refined carbs and sugary drinks — they spike blood sugar fast. "
                "Focus on vegetables, legumes, and lean proteins. "
                "A 20 to 30 minute walk after meals is one of the most effective things you can do for insulin sensitivity. "
                "Aim for 8 to 10 glasses of water daily."
            )
        elif latest_report_type == "CREATININE":
            return intro + (
                "Consistent hydration is the single most impactful thing — 8 to 10 glasses of water a day. "
                "Avoid frequent use of ibuprofen or diclofenac, as these strain kidney blood flow. "
                "Cut back on salt and heavily processed foods to ease blood pressure on the kidneys."
            )
        else:
            hgb_val = latest_report.get("hgb")
            if hgb_val and get_parameter_status("hgb", hgb_val) == "LOW":
                return intro + (
                    "Your hemoglobin is low, so focus on iron-rich foods: spinach, lentils, beans, eggs, and lean meat. "
                    "Always pair them with a vitamin C source — a squeeze of lemon or a piece of fruit — since vitamin C significantly boosts iron absorption. "
                    "Avoid tea and coffee right after meals as they block iron uptake."
                )
            return intro + (
                "Keep your meals balanced with folate-rich greens, nuts, and whole grains. "
                "Good sleep — 7 to 8 hours — supports your bone marrow in producing healthy blood cells."
            )

    # ── 7. DANGEROUS / WORRIED
    if not param and matches_intent(text_clean, ["serious", "danger", "dangerous", "worry", "worried", "scared"]):
        return (
            "I understand it can feel unsettling to see something flagged. "
            "Most out-of-range values have straightforward explanations — dehydration, a mild infection, recent diet, or temporary stress. "
            "A single result does not give the full picture on its own. "
            "Look at the summary to understand the context, and share the report with your doctor for a proper assessment."
        )

    # ── 8. PARAMETER FOUND — decide brief vs detailed based on phrasing
    if param:
        # "explain rbc", "what is rbc", "describe hemoglobin", "tell me in detail about wbc" → detailed
        # "my rbc count", "rbc", "wbc level", "what is my wbc" → quick
        if is_detail_request(text_clean):
            return detailed_param_reply(param)
        else:
            return quick_param_reply(param)

    # ── 9. FOLLOW-UP on last parameter when no new param was named
    #       e.g. "why is that bad?", "tell me more", "is that serious?"
    follow_up_words = ["more", "why", "elaborate", "deeper", "breakdown", "meaning",
                       "bad", "good", "serious", "danger", "worried", "concern"]
    last_param = conversation_context.get("last_parameter")
    if last_param and matches_intent(text_clean, follow_up_words):
        return detailed_param_reply(last_param)

    # ── 10. FALLBACK
    last = conversation_context.get("last_parameter")
    if last:
        info = report_info.get(last, {})
        return (
            f"Not sure what you meant there. I was last talking about {info.get('name', last)}. "
            "You can ask me to explain it in more detail, or ask about a different test."
        )

    return (
        "I want to make sure I help you with the right thing. You can ask me:\n\n"
        "- The name of any test (like 'RBC' or 'hemoglobin') to get the quick result.\n"
        "- 'Explain my RBC' or 'tell me more about hemoglobin' for a detailed breakdown.\n"
        "- 'Give me a summary' for a full overview of your report.\n"
        "- 'What do my remarks mean' to decode the lab notes.\n"
        "- 'How can I improve my results' for diet and lifestyle tips."
    )