import sys
import os

# Add backend root to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from nlp.chatbot_logic import (
    set_latest_report, 
    chatbot, 
    latest_report_type,
    latest_report
)
from nlp.summary import (
    generate_summary,
    generate_hba1c_summary,
    generate_creatinine_summary
)

def run_tests():
    print("=" * 60)
    print("RUNNING Conversational Chatbot rule-based verification")
    print("=" * 60)

    # -----------------------------
    # 1. CBC TEST (Low Hemoglobin, abnormal remarks, and peripheral findings)
    # -----------------------------
    print("\n--- 🩸 Testing CBC Report (Anemia, microcytic hypochromic, anisocytosis) ---")
    mock_cbc_data = {
        "wbc": 7.5,
        "rbc": 3.8,
        "hgb": 10.2,
        "hct": 32.0,
        "mcv": 72.0,
        "mch": 22.0,
        "mchc": 29.0,
        "rdw": 18.5,
        "plt": 250.0
    }
    mock_cbc_raw_json = {
        "patient_name": "Deepak Kumar",
        "patient_age": "32",
        "patient_gender": "Male",
        "test_date": "05/22/2026",
        "lab_name": "Premium AI Diagnostics",
        "remarks": "Microcytic Hypochromic blood picture with mild Anisocytosis present.",
        "peripheral_film": ["Microcytic Hypochromic", "Anisocytosis"],
        "interpretation": "Findings are strongly suggestive of Iron Deficiency Anemia.",
        "suggestions": ["Serum Iron Profile", "Ferritin Test", "Consult general physician"]
    }
    
    set_latest_report(
        ocr_text="CBC WBC 7.5 RBC 3.8 Hemoglobin 10.2 MCV 72 Plt 250",
        data=mock_cbc_data,
        raw_json=mock_cbc_raw_json,
        report_type="CBC",
        analysis={
            "wbc": {"value": 7.5, "status": "normal", "range_str": "4.0 - 11.0"},
            "rbc": {"value": 3.8, "status": "low", "range_str": "4.0 - 5.9"},
            "hgb": {"value": 10.2, "status": "low", "range_str": "12.0 - 16.0"},
            "plt": {"value": 250.0, "status": "normal", "range_str": "150.0 - 400.0"}
        }
    )

    # Query 1: Greeting
    print("\n[Query]: 'hello assistant'")
    resp = chatbot("hello assistant")
    print(resp)
    assert "Dedicated Report Assistant" in resp, "Greeting assertion failed"

    # Query 2: Summary
    print("\n[Query]: 'tell me about my report'")
    resp = chatbot("tell me about my report")
    print(resp)
    assert "Deepak Kumar" in resp, "Patient name assertion failed in summary"
    assert "Iron Deficiency Anemia" in resp, "Interpretation assertion failed in summary"
    assert "Hemoglobin is low" in resp, "Abnormal flag assertion failed in summary"

    # Query 3: Remarks
    print("\n[Query]: 'explain my remarks'")
    resp = chatbot("explain my remarks")
    print(resp)
    assert "Microcytic Hypochromic" in resp, "Remarks explanation assertion failed"

    # Query 4: Peripheral Film
    print("\n[Query]: 'what does my peripheral film show?'")
    resp = chatbot("what does my peripheral film show?")
    print(resp)
    assert "Anisocytosis" in resp, "Peripheral smear explanation failed"

    # Query 5: Dietary Recommendations
    print("\n[Query]: 'what food should I eat?'")
    resp = chatbot("what food should I eat?")
    print(resp)
    assert "Iron-Rich Foods" in resp, "Dietary recommendation for low HGB failed"

    # -----------------------------
    # 2. HbA1c TEST (Diabetic ranges)
    # -----------------------------
    print("\n--- 🩸 Testing HbA1c Report (Diabetes) ---")
    mock_hba1c_data = {
        "hba1c_level": 7.8,
        "blood_glucose_level": 162.0
    }
    mock_hba1c_raw_json = {
        "patient_name": "Yasmin Khan",
        "patient_age": "48",
        "patient_gender": "Female",
        "test_date": "05/20/2026",
        "lab_name": "Metro Health Lab",
        "remarks": "Elevated HbA1c indicative of Diabetes mellitus.",
        "interpretation": "Poor glycemic control over the past 3 months.",
        "suggestions": ["Fasting blood sugar monitoring", "HbA1c test in 3 months", "Consult endocrinologist"]
    }

    set_latest_report(
        ocr_text="HbA1c 7.8 Glucose 162",
        data=mock_hba1c_data,
        raw_json=mock_hba1c_raw_json,
        report_type="HBA1C",
        analysis={
            "hba1c_level": {"value": 7.8, "status": "high", "range_str": "4.0 - 5.6"},
            "blood_glucose_level": {"value": 162.0, "status": "high", "range_str": "70 - 140"}
        }
    )

    print("\n[Query]: 'tell me about my report'")
    resp = chatbot("tell me about my report")
    print(resp)
    assert "Yasmin Khan" in resp, "HbA1c patient name summary failed"
    assert "diabetic range" in resp or "Diabetes" in resp, "HbA1c diagnosis summary failed"

    print("\n[Query]: 'how to lower my results?'")
    resp = chatbot("how to lower my results?")
    print(resp)
    assert "Low Glycemic Diet" in resp, "HbA1c lowering tips failed"

    # -----------------------------
    # 3. Creatinine TEST (High Creatinine / Kidney Stage 2)
    # -----------------------------
    print("\n--- 🩸 Testing Creatinine Report (CKD Stage 2) ---")
    mock_creat_data = {
        "serum_creatinine": 1.7,
        "egfr": 58.0
    }
    mock_creat_raw_json = {
        "patient_name": "Ubaid Bhutto",
        "patient_age": "55",
        "patient_gender": "Male",
        "test_date": "05/18/2026",
        "lab_name": "City Dialysis and Renal Care",
        "remarks": "Stage 2 CKD with mild renal impairment.",
        "interpretation": "Creatinine level is elevated. Kidney stage is CKD Stage 2.",
        "suggestions": ["Daily hydration check", "Repeat serum creatinine in 1 month", "Avoid nephrotoxic agents"]
    }

    set_latest_report(
        ocr_text="Creatinine 1.7 eGFR 58",
        data=mock_creat_data,
        raw_json=mock_creat_raw_json,
        report_type="CREATININE",
        analysis={
            "serum_creatinine": {"value": 1.7, "status": "high", "range_str": "0.6 - 1.2"},
            "egfr": {"value": 58.0, "status": "low", "range_str": "90 - 120"}
        }
    )

    print("\n[Query]: 'tell me about report'")
    resp = chatbot("tell me about report")
    print(resp)
    assert "Ubaid Bhutto" in resp, "Creatinine patient name summary failed"
    assert "Stage 2 CKD" in resp or "kidney stage" in resp, "CKD stage summary failed"

    print("\n[Query]: 'explain remarks'")
    resp = chatbot("explain remarks")
    print(resp)
    assert "Stage 2 Ckd" in resp or "renal" in resp, "Creatinine remarks explanation failed"

    print("\n[Query]: 'how to manage kidney results?'")
    resp = chatbot("how to manage kidney results?")
    print(resp)
    assert "NSAIDs" in resp or "hydration" in resp, "Creatinine dietary management failed"

    # -----------------------------
    # 4. VOICE SUMMARY TEST (Dynamic remarks and peripheral film reading)
    # -----------------------------
    print("\n--- 🗣️ Testing Voice Summary Output ---")
    
    # CBC Voice Summary Test
    cbc_voice = generate_summary(mock_cbc_data, mock_cbc_raw_json)
    print("\n[CBC Voice Summary]:")
    print(cbc_voice)
    assert "Microscopic examination of your blood smear shows" in cbc_voice
    assert "anisocytosis, which means your red blood cells are of different sizes" in cbc_voice.lower()
    assert "specifically, the laboratory remarks note" in cbc_voice.lower()
    assert "next steps" in cbc_voice.lower()
    
    # HbA1c Voice Summary Test
    hba1c_voice = generate_hba1c_summary({
        "HbA1c": {"value": mock_hba1c_data["hba1c_level"]},
        "Blood Glucose": {"value": mock_hba1c_data["blood_glucose_level"]}
    }, mock_hba1c_raw_json)
    print("\n[HbA1c Voice Summary]:")
    print(hba1c_voice)
    assert "specifically, the laboratory remarks note: elevated hba1c indicative of diabetes mellitus" in hba1c_voice.lower()
    assert "next steps" in hba1c_voice.lower()

    # Creatinine Voice Summary Test
    creat_voice = generate_creatinine_summary({
        "Creatinine": {"value": mock_creat_data["serum_creatinine"], "unit": "mg/dL"},
        "eGFR": {"value": mock_creat_data["egfr"]}
    }, mock_creat_raw_json)
    print("\n[Creatinine Voice Summary]:")
    print(creat_voice)
    assert "specifically, the laboratory remarks note: stage 2 ckd with mild renal impairment" in creat_voice.lower()
    assert "next steps" in creat_voice.lower()

    print("\n" + "=" * 60)
    print("ALL RULE-BASED CONVERSATIONAL ASSISTANT & VOICE SUMMARY TESTS PASSED SUCCESSFULY!")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
