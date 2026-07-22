import sys
import os
import json

# Add backend to path
sys.path.append(os.path.abspath("backend"))

from backend.ocr.extract_text import extract_text, clean_text
from backend.utils.cbc_parser import extract_cbc_values
from backend.model.predict import predict_cbc

def test_pipeline():
    # Mock some OCR text from a sample report
    # Sample 1 from CSV: WBC=10, LYMp=43.2, ..., HGB=7.3, ... Label=Abnormal
    sample_text = """
    WBC: 10.0
    LYM%: 43.2
    MID%: 6.7
    NEUT%: 50.1
    LYM#: 4.3
    MID#: 0.7
    NEUT#: 5.0
    RBC: 2.77
    HGB: 7.3
    HCT: 24.2
    MCV: 87.7
    MCH: 26.3
    MCHC: 30.1
    RDW-SD: 35.3
    RDW-CV: 11.4
    PLT: 189
    MPV: 9.2
    PDW: 12.5
    PCT: 0.17
    P-LCR: 22.3
    """

    print("--- Testing Parser ---")
    cbc_values = extract_cbc_values(sample_text)
    print(json.dumps(cbc_values, indent=2))

    print("\n--- Testing Prediction ---")
    prediction, confidence = predict_cbc(cbc_values)
    print(f"Prediction: {prediction}")
    print(f"Confidence: {confidence}%")

    if prediction == "Abnormal":
        print("\nSUCCESS: Prediction matches expected output!")
    else:
        print(f"\nFAILURE: Prediction mismatch! Expected 'Abnormal', got '{prediction}'")

if __name__ == "__main__":
    test_pipeline()
