import sys
import json
from ocr.extract_text import extract_text, run_multi_ocr
from utils.cbc_parser import extract_cbc_values

def test_ocr(image_path):
    print(f"Testing OCR on {image_path}")
    raw_texts = run_multi_ocr(image_path)
    print("\n--- Raw OCR Output ---")
    print(raw_texts)

    final_text = extract_text(image_path)
    print("\n--- Final Text Output ---")
    print(final_text)

    print("\n--- Parsed CBC Values ---")
    parsed = extract_cbc_values(final_text)
    print(json.dumps(parsed, indent=2))

if __name__ == "__main__":
    if len(sys.argv) > 1:
        test_ocr(sys.argv[1])
    else:
        test_ocr('uploads/cd80ddfa631b4adb939cd44c6c8451c6_report.png')
