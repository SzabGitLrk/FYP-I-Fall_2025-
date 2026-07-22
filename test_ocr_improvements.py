import sys
import os

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))

from ocr.extract_text import extract_text
from utils.cbc_parser import extract_cbc_values

def test_ocr_and_parsing():
    print("--- Testing Improved OCR and Filtering Logic ---")
    
    # Simulate some OCR text with common misreads
    test_text = """
    Patient Name: John Doe
    Date: 2024-05-15
    
    RESULTS:
    WBC count: 7.5O x10^9/L  (Ref: 4.0-11.0)
    RBC: 4.8I 10^12/L
    Hemoglobin: 14.O g/dL
    PLT: 25o x10^3/uL
    MCV: 85.l fL
    """
    
    print("\n--- Original Text (Simulated OCR with misreads) ---")
    print(test_text)
    
    # Test Parsing directly with the simulated text
    print("\n--- Testing Parsing Logic (Handling 'O' as '0', etc.) ---")
    parsed_values = extract_cbc_values(test_text)
    print("Parsed Values:", parsed_values)
    
    # Check if we correctly recovered the values
    expected = {
        'wbc': 7.5,
        'rbc': 4.81,
        'hgb': 14.0,
        'plt': 250.0,
        'mcv': 85.1
    }
    
    all_passed = True
    for key, val in expected.items():
        if parsed_values.get(key) != val:
            print(f"ERROR for {key}: Expected {val}, got {parsed_values.get(key)}")
            all_passed = False
        else:
            print(f"SUCCESS: Correctly parsed {key}: {val}")
            
    if all_passed:
        print("\nSUCCESS: Parsing logic correctly handles misreads!")
    else:
        print("\nERROR: Parsing logic failed some tests.")

    # Note: We can't easily test the actual OCR without a real image file,
    # but we've verified the logic that handles its output.
    
if __name__ == "__main__":
    test_ocr_and_parsing()
