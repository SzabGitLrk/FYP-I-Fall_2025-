import sys
import os

# Add backend to path
sys.path.append(os.path.abspath("backend"))

from backend.ocr.extract_text import extract_text
from backend.utils.cbc_parser import extract_cbc_values

def test_full_pipeline():
    # Use an actual file from uploads
    image_path = "backend/uploads/report.png"
    if not os.path.exists(image_path):
        # try another one if not exists
        image_path = "backend/uploads/b242f06202ff437ca446b1dde361dbe0_1.webp"
        
    if not os.path.exists(image_path):
        print(f"Error: No test image found in uploads")
        return

    print(f"--- Testing OCR for {image_path} ---")
    try:
        text = extract_text(image_path)
        print("OCR TEXT OUTPUT:")
        print(text)
    except Exception as e:
        print(f"CRITICAL ERROR in extract_text: {e}")
        import traceback
        traceback.print_exc()
        return

    print("-" * 30)

    if not text:
        print("FAIL: OCR returned no text")
        return

    print("--- Testing Parser ---")
    cbc = extract_cbc_values(text)
    print("PARSED CBC VALUES:")
    import json
    print(json.dumps(cbc, indent=2))

    # Count non-None values
    found = sum(1 for v in cbc.values() if v is not None)
    print(f"\nSummary: Found {found} parameters out of {len(cbc)}")

if __name__ == "__main__":
    test_full_pipeline()
