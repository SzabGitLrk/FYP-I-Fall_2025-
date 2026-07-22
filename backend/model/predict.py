# import joblib
# import pandas as pd

# # ===============================
# # Load trained model & preprocessors
# # ===============================
# model = joblib.load("model/xgb_model.pkl")
# scaler = joblib.load("model/scaler.pkl")
# encoder = joblib.load("model/label_encoder.pkl")


# # ===============================
# # CBC Prediction Function
# # ===============================
# def predict_cbc(cbc):
#     """
#     cbc example:
#     {
#         "wbc": 10.2,
#         "rbc": 4.5,
#         "hemoglobin": 12.8,
#         "platelets": 189
#     }
#     """

#     features = ["wbc", "rbc", "hemoglobin", "platelets"]

#     # Create DataFrame in correct feature order
#     df = pd.DataFrame([[cbc[f] for f in features]], columns=features)

#     # Scale input
#     scaled = scaler.transform(df)

#     # Predict
#     pred = model.predict(scaled)[0]
#     prob = model.predict_proba(scaled).max()

#     # Decode label
#     label = encoder.inverse_transform([pred])[0]

#     return label, round(prob * 100, 2)


import joblib
import pandas as pd
import numpy as np
import os

_HERE = os.path.dirname(__file__)
model = joblib.load(os.path.join(_HERE, "xgb_model.pkl"))
encoder = joblib.load(os.path.join(_HERE, "label_encoder.pkl"))

# Load feature names to ensure consistent order
try:
    feature_names = joblib.load(os.path.join(_HERE, "feature_names.pkl"))
except:
    # Fallback to hardcoded list if pkl missing
    feature_names = [
        'wbc', 'lymp', 'midp', 'neutp', 'lymn', 'midn', 'neutn', 'rbc', 'hgb',
        'hct', 'mcv', 'mch', 'mchc', 'rdwsd', 'rdwcv', 'plt', 'mpv', 'pdw',
        'pct', 'plcr'
    ]

def predict_cbc(cbc):
    # Ensure all keys are lowercase (already should be from parser)
    cbc_lower = {k.lower(): v for k, v in cbc.items()}
    
    # Create DataFrame with ONLY the expected features in the CORRECT order
    # Missing features will be NaN
    data = [[cbc_lower.get(f) for f in feature_names]]
    df = pd.DataFrame(data, columns=feature_names)

    # Convert None → NaN (important!)
    df = df.replace({None: np.nan})

    # Ensure all features are numeric for XGBoost
    df = df.apply(pd.to_numeric, errors="coerce")

    pred = model.predict(df)[0]
    prob = model.predict_proba(df).max()

    label = encoder.inverse_transform([pred])[0]
    
    # Convert numpy types to native python types for JSON serialization
    return str(label), float(round(prob * 100, 2))

