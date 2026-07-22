import pandas as pd
import joblib
import os
from xgboost import XGBClassifier
from sklearn.preprocessing import LabelEncoder

_HERE = os.path.dirname(__file__)
DATA_PATH = os.path.join(_HERE, "../../dataset/diabetes_prediction_dataset.csv")

df = pd.read_csv(DATA_PATH)

# Normalize column names
df.columns = df.columns.str.lower()

# Encode categorical variables
# 'gender' and 'smoking_history' are strings
gender_encoder = LabelEncoder()
df['gender'] = gender_encoder.fit_transform(df['gender'].astype(str))

smoking_encoder = LabelEncoder()
df['smoking_history'] = smoking_encoder.fit_transform(df['smoking_history'].astype(str))

# The target column is 'diabetes' (0 or 1)
X = df.drop("diabetes", axis=1)
y = df["diabetes"]

# Encode target labels (0 -> Normal, 1 -> Diabetes)
target_encoder = LabelEncoder()
# We will fit it on strings so the model outputs 'Normal' or 'Diabetes' instead of 0/1
y_str = y.map({0: "Normal", 1: "Diabetes"})
y_enc = target_encoder.fit_transform(y_str)

model = XGBClassifier(
    n_estimators=150,
    learning_rate=0.05,
    max_depth=5,
    missing=float("nan"),
    eval_metric="mlogloss"
)

print("Training HbA1c (Diabetes) model...")
model.fit(X, y_enc)

# Save the models and encoders
joblib.dump(model, os.path.join(_HERE, "hba1c_xgb_model.pkl"))
joblib.dump(target_encoder, os.path.join(_HERE, "hba1c_label_encoder.pkl"))
joblib.dump({
    'gender': gender_encoder,
    'smoking_history': smoking_encoder
}, os.path.join(_HERE, "hba1c_feature_encoders.pkl"))

# Save feature names to ensure correct order during inference
feature_names = list(X.columns)
joblib.dump(feature_names, os.path.join(_HERE, "hba1c_feature_names.pkl"))

print("Robust HbA1c model trained (missing-safe)")
