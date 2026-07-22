
import sys
import os

# Create a dummy input based on the failure log (missing 'id')
sample_cbc = {
    'wbc': 10.0, 'lymp': 10.0, 'midp': 10.0, 'neutp': 10.0, 
    'lymn': 10.0, 'midn': 10.0, 'neutn': 10.0, 'rbc': 10.0, 
    'hgb': 10.0, 'hct': 10.0, 'mcv': 10.0, 'mch': 10.0, 
    'mchc': 10.0, 'rdwsd': 10.0, 'rdwcv': 10.0, 'plt': 10.0, 
    'mpv': 10.0, 'pdw': 10.0, 'pct': 10.0, 'plcr': 10.0
}

try:
    from model.predict import predict_cbc
    print("Testing predict_cbc...")
    label, confidence = predict_cbc(sample_cbc)
    print(f"SUCCESS: Label={label}, Confidence={confidence}")
except Exception as e:
    print(f"FAILURE: {e}")
    sys.exit(1)
