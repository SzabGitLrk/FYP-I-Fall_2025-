import joblib
import pandas as pd
import numpy as np
import os

_HERE = os.path.dirname(__file__)
model = joblib.load(os.path.join(_HERE, "hba1c_xgb_model.pkl"))
target_encoder = joblib.load(os.path.join(_HERE, "hba1c_label_encoder.pkl"))
feature_encoders = joblib.load(os.path.join(_HERE, "hba1c_feature_encoders.pkl"))
feature_names = joblib.load(os.path.join(_HERE, "hba1c_feature_names.pkl"))

gender_encoder = feature_encoders['gender']
smoking_encoder = feature_encoders['smoking_history']

def predict_hba1c(data_dict):
    # Ensure all keys are lowercase
    data_lower = {k.lower(): v for k, v in data_dict.items()}
    
    # Process categorical variables using the loaded encoders
    gender_val = data_lower.get('gender')
    if gender_val is not None:
        try:
            gender_val = gender_encoder.transform([str(gender_val)])[0]
        except ValueError:
            gender_val = np.nan
            
    smoking_val = data_lower.get('smoking_history')
    if smoking_val is not None:
        try:
            smoking_val = smoking_encoder.transform([str(smoking_val)])[0]
        except ValueError:
            smoking_val = np.nan

    processed_data = data_lower.copy()
    processed_data['gender'] = gender_val
    processed_data['smoking_history'] = smoking_val

    # Create DataFrame with ONLY the expected features in the CORRECT order
    data = [[processed_data.get(f) for f in feature_names]]
    df = pd.DataFrame(data, columns=feature_names)

    # Convert None → NaN
    df = df.replace({None: np.nan})

    # Ensure all features are numeric for XGBoost
    df = df.apply(pd.to_numeric, errors="coerce")

    pred = model.predict(df)[0]
    prob = model.predict_proba(df).max()

    label = target_encoder.inverse_transform([pred])[0]
    
    return str(label), float(round(prob * 100, 2))
