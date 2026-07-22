import pandas as pd
import joblib
import os
from xgboost import XGBClassifier
from sklearn.preprocessing import LabelEncoder

_HERE = os.path.dirname(__file__)
DATA_PATH = os.path.join(_HERE, "../../dataset/creatinine_dataset.csv")

df = pd.read_csv(DATA_PATH)

# Normalize column names
df.columns = df.columns.str.lower()

# The target column is 'target' (0 or 1)
X = df.drop("target", axis=1)
y = df["target"]

# The dataset 'gender' column is already numeric (0/1). Let's keep it that way, but ensure it's handled as numeric.

# Encode target labels (0 -> Normal, 1 -> Abnormal/Kidney Disease)
target_encoder = LabelEncoder()
y_str = y.map({0: "Normal", 1: "Kidney Disease"})
y_enc = target_encoder.fit_transform(y_str)

model = XGBClassifier(
    n_estimators=150,
    learning_rate=0.05,
    max_depth=5,
    missing=float("nan"),
    eval_metric="mlogloss"
)

print("Training Creatinine model...")
model.fit(X, y_enc)

# Save the models and encoders
joblib.dump(model, os.path.join(_HERE, "creatinine_xgb_model.pkl"))
joblib.dump(target_encoder, os.path.join(_HERE, "creatinine_label_encoder.pkl"))

# Save feature names to ensure correct order during inference
feature_names = list(X.columns)
joblib.dump(feature_names, os.path.join(_HERE, "creatinine_feature_names.pkl"))

print("Robust Creatinine model trained (missing-safe)")
