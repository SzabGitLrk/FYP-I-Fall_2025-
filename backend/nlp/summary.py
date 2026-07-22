def safe_text(label, value, low_msg, high_msg, normal_msg):
    """
    Smart text generator:
    - Handles missing values
    - Applies medical logic
    """
    if value is None:
        return f"{label} could not be determined from the report."

    if low_msg and value < low_msg[0]:
        return low_msg[1]

    if high_msg and value > high_msg[0]:
        return high_msg[1]

    return normal_msg


def _is_na(value):
    if value is None:
        return True

    if isinstance(value, float) and value != value:
        return True

    if isinstance(value, str):
        v = value.strip().lower()
        return v in {"na", "n/a", "nan", "none", "null", ""}

    return False


def _to_float(value):
    if isinstance(value, (int, float)):
        return float(value)

    if isinstance(value, str):
        try:
            return float(value.strip())
        except ValueError:
            return None

    return None


def clean_for_tts(text):
    """
    Final cleanup to ensure no NA words go to audio
    """
    text = text.replace("None", "")
    text = text.replace("NA", "")
    text = text.replace("N/A", "")
    text = text.replace("nan", "")
    return text


def append_remarks_and_suggestions(summary_text, raw_json):
    if not raw_json or not isinstance(raw_json, dict):
        return summary_text
    
    import re
    
    # ---------------------------------------------------------
    # 1. HELPER: Clean strings from any malformed JSON slices
    # ---------------------------------------------------------
    def sanitize_field(value):
        if not value:
            return ""
        if isinstance(value, list):
            cleaned_items = []
            for v in value:
                if v:
                    s_v = sanitize_field(v)
                    if s_v:
                        cleaned_items.append(s_v)
            return ", ".join(cleaned_items)
        
        val_str = str(value).strip()
        
        # If it looks like a JSON slice (contains keys like "key": or raw brackets/quotes/colons)
        if '"' in val_str or '{' in val_str or '[' in val_str or ':' in val_str:
            val_str = re.sub(r'"[a-zA-Z0-9_\-]+"[:\s]+', ' ', val_str)
            val_str = re.sub(r'[{}""\[\]]', ' ', val_str)
            val_str = val_str.replace('\\n', ' ').replace('\\t', ' ').replace('\\', '')
        else:
            val_str = val_str.replace('\\n', ' ').replace('\\t', ' ').replace('\\', '')
            
        # Remove leftover markdown markers
        val_str = val_str.replace('**', '').replace('__', '').replace('*', '')
        # Clean up question marks for better TTS
        val_str = re.sub(r'\?\s*([a-zA-Z])', r'possible \1', val_str)
        val_str = re.sub(r'\s+', ' ', val_str).strip()
        return val_str

    GLOSSARY = {
        "anisocytosis": "your red blood cells are of different sizes rather than being uniform, which is common in iron deficiency",
        "poikilocytosis": "your red blood cells have abnormal shapes instead of the normal round form",
        "microcytic": "your red blood cells are smaller than normal, usually because the body lacks enough iron to build hemoglobin",
        "macrocytic": "your red blood cells are larger than normal, often linked to vitamin B12 or folate deficiencies",
        "hypochromic": "your red blood cells look pale due to lower hemoglobin content, a strong sign of iron deficiency",
        "normocytic": "your red blood cells are normal in size",
        "normochromic": "your red blood cells have a normal, healthy color and hemoglobin concentration",
        "microcytic hypochromic": "your red blood cells are both smaller and paler than normal, which is the classic pattern of iron deficiency anemia",
        "dimorphic": "two distinct types of red blood cells are present, indicating mixed nutritional deficiencies",
        "target cells": "red blood cells look like a bullseye, sometimes seen in liver issues or thalassemia traits",
        "schistocytosis": "fragmented red blood cells are present, which requires clinical correlation",
        "thrombocytopenia": "your platelet count is lower than normal, which can increase bruising or bleeding risk",
        "thrombocytosis": "your platelet count is elevated, sometimes occurring during active inflammation or infection",
        "leukocytosis": "your total white blood cell count is elevated, meaning your immune system is actively responding to something",
        "leukopenia": "your white blood cell count is lower than normal, temporarily reducing your infection-fighting ability",
        "neutrophilia": "increased neutrophils, which usually indicates a bacterial infection or physical stress",
        "lymphocytosis": "increased lymphocytes, highly characteristic of a viral infection",
        "viral infection": "blood patterns suggest your immune system is fighting off a viral illness",
        "bacterial infection": "white cell counts suggest a bacterial infection that may require medical evaluation",
        "possible bacterial infection": "white cell counts suggest a possible bacterial infection that may require medical evaluation",
        "iron deficiency": "your red cell indices point towards low iron levels",
        "esr raised": "your erythrocyte sedimentation rate is elevated, indicating active inflammation or infection"
    }

    # ---------------------------------------------------------
    # 2. Extract & Sanitize raw fields
    # ---------------------------------------------------------
    remarks_raw = raw_json.get("remarks", "")
    is_remarks_fallback = False
    if isinstance(remarks_raw, str) and ('"peripheral_film"' in remarks_raw or '"interpretation"' in remarks_raw or '"suggestions"' in remarks_raw):
        is_remarks_fallback = True

    if is_remarks_fallback:
        parts = re.split(r'"[a-zA-Z0-9_\-]+"[:\s]+', remarks_raw)
        prefix = parts[0].strip() if parts else ""
        prefix = re.sub(r'^[,\s:{}""\[\]]+', '', prefix)
        prefix = re.sub(r'[,\s:{}""\[\]]+$', '', prefix).strip()
        remarks = prefix if prefix.lower() not in {"na", "n/a", "none", "null", ""} else ""
    else:
        remarks = sanitize_field(remarks_raw)

    if remarks in {":", '":"', '"', "", "none", "null", "n/a", "na"}:
        remarks = ""

    interpretation = sanitize_field(raw_json.get("interpretation", ""))
    if interpretation in {":", '":"', '"', "", "none", "null", "n/a", "na"}:
        interpretation = ""
    
    pf = raw_json.get("peripheral_film")
    pf_list = []
    if isinstance(pf, list):
        pf_list = [sanitize_field(item) for item in pf if item]
    elif isinstance(pf, str) and pf.strip():
        pf_list = [sanitize_field(item) for item in pf.split(',') if item]
    pf_list = [x for x in pf_list if x and x not in {":", '":"', '"', "none", "null", "n/a", "na"}]
        
    suggs = raw_json.get("suggestions")
    suggs_list = []
    if isinstance(suggs, list):
        suggs_list = [sanitize_field(item) for item in suggs if item]
    elif isinstance(suggs, str) and suggs.strip():
        suggs_list = [sanitize_field(item) for item in suggs.split('.') if item]
    suggs_list = [x for x in suggs_list if x and x not in {":", '":"', '"', "none", "null", "n/a", "na"}]

    # ---------------------------------------------------------
    # 3. Analyze Findings & Structure Doctor-like Prose
    # ---------------------------------------------------------
    disclaimer_start = summary_text.find("Please remember:")
    if disclaimer_start != -1:
        main_numeric = summary_text[:disclaimer_start].strip()
    else:
        main_numeric = summary_text.strip()

    combined_notes = f"{remarks} {interpretation} {' '.join(pf_list)}".lower()
    
    is_microcytic = "microcytic" in combined_notes or "hypochromic" in combined_notes
    is_anisocytosis = "anisocytosis" in combined_notes or "poikilocytosis" in combined_notes
    is_anemia = "anemia" in combined_notes or "iron deficiency" in combined_notes or "thalassemia" in combined_notes or is_microcytic
    
    is_neutrophilia = "neutrophil" in combined_notes or "neutrophilia" in combined_notes
    is_infection = "infection" in combined_notes or "bacterial" in combined_notes or "viral" in combined_notes or is_neutrophilia
    is_inflammation = "esr" in combined_notes or "inflammation" in combined_notes or "inflammatory" in combined_notes

    is_diabetes = "diabetes" in combined_notes or "diabetic" in combined_notes or "glycemic" in combined_notes
    is_prediabetes = "prediabetes" in combined_notes or "prediabetic" in combined_notes
    is_kidney = "ckd" in combined_notes or "kidney" in combined_notes or "renal" in combined_notes or "creatinine" in combined_notes

    has_any_findings = bool(pf_list or remarks or interpretation or is_anemia or is_infection or is_inflammation or is_diabetes or is_prediabetes or is_kidney)

    # Resolve "Great news!" contradictions
    if "Great news!" in main_numeric and has_any_findings:
        if "creatinine" in summary_text.lower():
            main_numeric = "Based on the markers we analyzed, your primary creatinine levels are within normal limits; however, the laboratory has noted some additional observations regarding your kidney function."
        elif "hba1c" in summary_text.lower():
            main_numeric = "Based on the markers we analyzed, your long-term blood sugar levels are within normal limits; however, the laboratory has noted some additional observations regarding your glucose parameters."
        else:
            main_numeric = "Based on the markers we analyzed, your primary blood count numbers are within normal limits; however, the detailed microscopic analysis of your blood smear and laboratory findings show some notable observations."

    # A. Spoken Smear Findings (inline glossary)
    smear_parts = []
    for term in pf_list:
        term_lower = term.lower()
        desc = None
        # Sort glossary keys by descending length
        sorted_glossary = sorted(GLOSSARY.items(), key=lambda x: len(x[0]), reverse=True)
        for jargon, explanation in sorted_glossary:
            if jargon in term_lower:
                desc = explanation
                break
        if desc:
            smear_parts.append(f"{term} (which means {desc})")
        else:
            smear_parts.append(term)
            
    smear_text = ""
    if smear_parts:
        if len(smear_parts) == 1:
            smear_text = f"Microscopic examination of your blood smear shows {smear_parts[0]}."
        else:
            joined_smear = ", ".join(smear_parts[:-1]) + ", and " + smear_parts[-1]
            smear_text = f"Microscopic examination of your blood smear shows {joined_smear}."

    # B. Spoken Clinical Synthesis
    synthesis_text = ""
    synthesis_parts = []
    
    if "creatinine" in summary_text.lower():
        if is_kidney:
            stage_match = re.search(r"stage\s*(\d)", combined_notes)
            if stage_match:
                stage = stage_match.group(1)
                synthesis_parts.append(f"This pattern aligns with Stage {stage} Chronic Kidney Disease characteristics, indicating some mild to moderate changes in how your kidneys are filtering and highlighting the importance of regular monitoring.")
            else:
                synthesis_parts.append("These creatinine levels suggest some changes in kidney function that warrant medical follow-up and close monitoring.")
    elif "hba1c" in summary_text.lower():
        if is_diabetes:
            synthesis_parts.append("These findings suggest elevated glycemic levels characteristic of diabetes, indicating the need for careful blood sugar management.")
        elif is_prediabetes:
            synthesis_parts.append("These results fall within the prediabetes range, suggesting a mild elevation in long-term blood sugar that can often be managed or reversed through proactive lifestyle changes.")
    else:
        # CBC Report
        if is_anemia and is_infection:
            synthesis_parts.append("Taken together, these findings present a combination of a microcytic hypochromic red cell picture—commonly associated with iron deficiency anemia or a thalassemia trait—alongside signs of a possible active bacterial infection or inflammatory process.")
        elif is_anemia:
            synthesis_parts.append("Overall, these red blood cell characteristics suggest a microcytic hypochromic pattern, which is most commonly associated with iron deficiency anemia or a thalassemia trait.")
        elif is_infection:
            synthesis_parts.append("Overall, the elevated white blood cell counts and neutrophilia point toward a possible active bacterial infection or an acute inflammatory response.")
            
    if remarks and len(remarks) < 150:
        remarks_clean = remarks.rstrip('.')
        if remarks_clean.lower() not in " ".join(synthesis_parts).lower():
            synthesis_parts.append(f"Specifically, the laboratory remarks note: {remarks_clean}.")
            
    if interpretation and len(interpretation) < 250:
        interp_clean = interpretation.rstrip('.')
        if interp_clean.lower() not in " ".join(synthesis_parts).lower():
            synthesis_parts.append(f"The clinical interpretation suggests: {interp_clean}.")

    synthesis_text = " ".join(synthesis_parts)

    # C. Spoken Suggestions (Conversational Next Steps)
    plan_parts = []
    suggs_joined = " ".join(suggs_list).lower()
    
    if "iron studies" in suggs_joined or "ferritin" in suggs_joined or "tibc" in suggs_joined or "serum iron" in suggs_joined:
        plan_parts.append("follow-up iron studies including ferritin and TIBC to assess your iron levels")
    if "electrophoresis" in suggs_joined or "thalassemia" in suggs_joined:
        plan_parts.append("a hemoglobin electrophoresis test to screen for thalassemia trait")
    if "crp" in suggs_joined or "c-reactive protein" in suggs_joined or "c reactive" in suggs_joined:
        plan_parts.append("checking inflammatory markers such as C-reactive protein")
    if "culture" in suggs_joined:
        plan_parts.append("appropriate cultures to locate any potential infection")
    if "endocrinologist" in suggs_joined or "endocrinology" in suggs_joined:
        plan_parts.append("consulting with an endocrinologist for specialized blood sugar management")
    if "nephrologist" in suggs_joined or "nephrology" in suggs_joined:
        plan_parts.append("consulting with a nephrologist to evaluate kidney health")
    if "diet" in suggs_joined or "lifestyle" in suggs_joined or "exercise" in suggs_joined:
        plan_parts.append("focusing on healthy dietary and lifestyle modifications")
    if "repeat" in suggs_joined or "follow-up" in suggs_joined or "cbc" in suggs_joined:
        plan_parts.append("scheduling a follow-up complete blood count to monitor these indices")

    if not plan_parts and suggs_list:
        for s in suggs_list[:2]:
            s_clean = s.rstrip('.').strip()
            if s_clean:
                if s_clean[0].isupper() and not s_clean[1].isupper():
                    s_clean = s_clean[0].lower() + s_clean[1:]
                plan_parts.append(s_clean)

    plan_text = ""
    if plan_parts:
        if len(plan_parts) == 1:
            plan_text = f"As next steps, it is recommended to consider {plan_parts[0]}, and discuss these findings with your doctor."
        else:
            joined_plan = ", ".join(plan_parts[:-1]) + ", and " + plan_parts[-1]
            plan_text = f"As next steps, we recommend considering {joined_plan}, alongside consulting with your physician to correlate these results with your clinical symptoms."

    # ---------------------------------------------------------
    # 4. Put it all together in one beautiful cohesive summary
    # ---------------------------------------------------------
    doctor_summary = []
    if main_numeric:
        doctor_summary.append(main_numeric)
    if smear_text:
        doctor_summary.append(smear_text)
    if synthesis_text:
        doctor_summary.append(synthesis_text)
    if plan_text:
        doctor_summary.append(plan_text)
        
    combined = " ".join(doctor_summary)
    combined += " Please remember: this is an AI-generated summary to help you understand your report. Always share your results with a real doctor for professional medical advice."
    combined = re.sub(r'\s+', ' ', combined).strip()
    return combined


def generate_summary(cbc, raw_json=None):
    wbc = _to_float(cbc.get("wbc")) if not _is_na(cbc.get("wbc")) else None
    rbc = _to_float(cbc.get("rbc")) if not _is_na(cbc.get("rbc")) else None
    hgb = _to_float(cbc.get("hgb")) if not _is_na(cbc.get("hgb")) else None
    plt = _to_float(cbc.get("plt")) if not _is_na(cbc.get("plt")) else None

    conditions = []
    
    # Anemia Check
    if hgb is not None and hgb < 12.0:
        anemia_details = "Your blood test shows signs of Anemia, meaning you have low hemoglobin"
        if rbc is not None and rbc < 4.0:
            anemia_details += " and fewer red blood cells than normal"
        anemia_details += ". Because of this, your body might not be getting enough oxygen, which can cause you to feel very tired, weak, or short of breath."
        conditions.append(anemia_details)
    elif rbc is not None and rbc < 4.0:
        conditions.append("Your red blood cells are slightly lower than normal. This could be due to a minor vitamin deficiency or mild anemia.")
    elif (hgb is not None and hgb > 17.5) or (rbc is not None and rbc > 5.8):
        conditions.append("Your red blood cells are higher than normal. This often happens if you are dehydrated, but it's something your doctor should keep an eye on.")

    # Infection / Immune check
    if wbc is not None:
        if wbc > 11.0:
            conditions.append("Your white blood cell count is high. Since these cells are your body's defense system, a high number usually means your body is currently fighting off an infection or there is inflammation somewhere.")
        elif wbc < 4.0:
            conditions.append("Your white blood cell count is low. This means your immune system might be a bit weak, making it harder for your body to fight off illnesses.")

    # Platelet check
    if plt is not None:
        if plt < 150.0:
            conditions.append("Your platelets (the cells that help your blood clot) are low. This means you might bruise or bleed more easily.")
        elif plt > 450.0:
            conditions.append("Your platelets are higher than normal, which could slightly increase your risk of blood clots.")

    if not conditions:
        if all(x is None for x in [wbc, rbc, hgb, plt]):
            conditions.append("I couldn't read enough data from your report to provide a proper health summary.")
        else:
            conditions.append("Great news! Based on the markers we analyzed, your blood count looks healthy and everything is within normal limits.")

    full_summary = " ".join(conditions)
    full_summary += " Please remember: this is an AI-generated summary to help you understand your report. Always share your results with a real doctor for professional medical advice."
    
    full_summary = append_remarks_and_suggestions(full_summary, raw_json)
    return clean_for_tts(full_summary)

def generate_hba1c_summary(results, raw_json=None):
    hba1c_data = results.get("HbA1c") or results.get("HbA1c Level") or results.get("Glycated Hemoglobin") or {}
    hba1c = _to_float(hba1c_data.get("value"))
    glucose_data = results.get("Blood Glucose") or results.get("Glucose") or results.get("Sugar Level") or {}
    glucose = _to_float(glucose_data.get("value"))
    bmi_data = results.get("BMI") or results.get("Body Mass Index") or {}
    bmi = _to_float(bmi_data.get("value"))
    
    if hba1c is None:
        return "Your HbA1c value could not be clearly read from the report. This marker is essential for understanding your long-term blood sugar levels."
    
    summary = ""
    if hba1c < 5.7:
        summary = f"Your HbA1c level is {hba1c}%, which is excellent! This means your long-term blood sugar is in a healthy range, and you show no signs of diabetes."
    elif 5.7 <= hba1c <= 6.4:
        summary = f"Your HbA1c level is {hba1c}%, which falls into the prediabetes range. This is a warning sign that your blood sugar is running slightly high. Doctors recommend improving your diet and exercising more to bring it back down and prevent diabetes before it starts."
    else:
        summary = f"Your HbA1c level is {hba1c}%, which indicates that your average blood sugar is high enough to be classified as diabetes. It is very important to see a doctor to create a proper healthcare plan to lower it and protect your long-term health."

    if glucose is not None and glucose > 126:
        summary += f" Additionally, your current blood glucose is high ({glucose} mg/dL), which supports the need for medical consultation."
    
    if bmi is not None and bmi > 25:
        summary += f" Your BMI is {bmi}, which is above the healthy range. Managing weight through healthy habits can significantly help in controlling blood sugar."

    summary = append_remarks_and_suggestions(summary, raw_json)
    return clean_for_tts(summary)

def generate_creatinine_summary(results, raw_json=None):
    # Try different possible labels
    creat_data = results.get("Creatinine") or results.get("Serum Creatinine") or results.get("S. Creatinine") or results.get("Creatinine Level") or {}
    val = _to_float(creat_data.get("value"))
    unit = creat_data.get("unit", "").lower()
    egfr_data = results.get("eGFR") or results.get("GFR") or results.get("Estimated GFR") or {}
    egfr = _to_float(egfr_data.get("value"))
    
    if val is None:
        return "Your Creatinine value could not be clearly read from the report. Creatinine is a key marker for kidney function."

    is_high = False
    is_low = False
    
    if "µmol" in unit or "umol" in unit:
        if val > 115.0: is_high = True
        elif val < 50.0: is_low = True
    else:
        if val > 1.3: is_high = True
        elif val < 0.6: is_low = True

    summary = ""
    if is_high:
        summary = f"Your Creatinine level is {val} {unit}, which is higher than normal. Creatinine is a natural waste product that your kidneys filter out. A high number suggests your kidneys might be under stress or not working perfectly right now."
    elif is_low:
        summary = f"Your Creatinine level is {val} {unit}, which is a bit lower than typical. This isn't usually dangerous and often just means you naturally have lower muscle mass or eat a low-meat diet."
    else:
        summary = f"Your Creatinine level is {val} {unit}, which is perfectly normal! This shows that your kidneys are healthy and doing a great job filtering your blood."

    if egfr is not None:
        if egfr < 60:
            summary += f" Your eGFR (filtration rate) is {egfr}, which is low and suggests reduced kidney function. It is important to discuss this with a doctor."
        elif egfr < 90:
            summary += f" Your eGFR is {egfr}, which is slightly below the optimal range."

    if is_high:
        summary += " Please make sure you are drinking plenty of water and follow up with a doctor to check on your kidney health."

    summary = append_remarks_and_suggestions(summary, raw_json)
    return clean_for_tts(summary)
