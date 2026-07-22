import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

try:
    print("Importing extract_text...")
    from ocr.extract_text import extract_text
    print("Importing extract_cbc_values...")
    from utils.cbc_parser import extract_cbc_values
    print("Importing predict_cbc...")
    from model.predict import predict_cbc
    print("Importing generate_summary...")
    from nlp.summary import generate_summary
    print("Importing analyze_cbc...")
    from utils.analyzer import analyze_cbc
    
    print("All imports successful!")
    
    # Test with a dummy text
    text = "WBC 10.5 RBC 4.5 HGB 13.0 PLT 250"
    print(f"Testing parser with: {text}")
    cbc = extract_cbc_values(text)
    print(f"Parsed CBC: {cbc}")
    
    analysis = analyze_cbc(cbc)
    print(f"Analysis: {analysis}")
    
    prediction, confidence = predict_cbc(cbc)
    print(f"Prediction: {prediction} ({confidence}%)")
    
    summary = generate_summary(cbc)
    print(f"Summary: {summary}")
    
    print("\nTest completed successfully!")

except Exception as e:
    print(f"\nError during test: {e}")
    import traceback
    traceback.print_exc()
