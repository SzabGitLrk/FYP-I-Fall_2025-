import joblib
import pandas as pd
import numpy as np
import os

_HERE = os.path.dirname(__file__)
model = joblib.load(os.path.join(_HERE, "creatinine_xgb_model.pkl"))
target_encoder = joblib.load(os.path.join(_HERE, "creatinine_label_encoder.pkl"))
feature_names = joblib.load(os.path.join(_HERE, "creatinine_feature_names.pkl"))

def predict_creatinine(data_dict):
    # Ensure all keys are lowercase
    data_lower = {k.lower(): v for k, v in data_dict.items()}
    
    # Create DataFrame with ONLY the expected features in the CORRECT order
    data = [[data_lower.get(f) for f in feature_names]]
    df = pd.DataFrame(data, columns=feature_names)

    # Convert None → NaN
    df = df.replace({None: np.nan})

    # Ensure all features are numeric for XGBoost
    df = df.apply(pd.to_numeric, errors="coerce")

    pred = model.predict(df)[0]
    prob = model.predict_proba(df).max()

    label = target_encoder.inverse_transform([pred])[0]
    
    return str(label), float(round(prob * 100, 2))
